/**
 * Rendu haute résolution des visuels référencés par les tutoriels.
 *
 *   npm run crops                 tous les jeux
 *   npm run crops -- nemesis      un seul jeu
 *   npm run crops -- --force      réécrit tout, même l'existant
 *
 * Chaque `crop` à rectangle des tutoriels (matériel et étapes) est rendu
 * DEPUIS LE PDF, à une échelle calculée pour la découpe elle-même, puis écrit
 * en WebP dans games/<id>/crops/. Le manifeste pages.json liste les découpes
 * disponibles avec leurs dimensions.
 *
 * Pourquoi rendre depuis le PDF plutôt que recadrer la page ingérée : une
 * vignette de matériel occupe parfois 4 % de la largeur d'une page. Recadrée
 * dans un rendu de page à 200 dpi, elle ne fait que ~90 px de large, puis
 * l'iPad l'affiche sur 600 px — illisible. Ici, l'échelle est calculée par
 * découpe pour atteindre TARGET_PX sur son grand côté : la petite vignette
 * est rendue à l'équivalent de 3000 dpi, la grande à 300 dpi, et les deux
 * sont nettes à l'écran.
 *
 * Les pages ingérées (npm run ingest) restent utiles : ce sont elles que le
 * Studio de découpe affiche, et le repli de l'application quand une découpe
 * n'a pas encore été rendue.
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Grand côté visé, en pixels. Le panneau visuel d'un iPad Retina fait
 * ~1200 px physiques ; 1800 laisse de la marge sans exploser le poids.
 */
const TARGET_PX = 1800

/** Garde-fou : au-delà, une découpe minuscule ferait exploser le rendu. */
const MAX_SCALE = 44

const QUALITY = 88

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.find((a) => !a.startsWith('--'))

/* ---------------------------------------------- charger les tutoriels */

// Les tutoriels sont du TypeScript : on les bundle en ESM le temps de les lire.
const bundle = join(ROOT, '.extract', 'tutorials.bundle.mjs')
mkdirSync(dirname(bundle), { recursive: true })
await build({
  entryPoints: [join(ROOT, 'src/games/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  logLevel: 'silent',
})
const { TUTORIALS } = await import(pathToFileURL(bundle).href)

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

/**
 * Clé d'une découpe. Doit rester identique à `cropKey` de src/engine/assets.ts :
 * index de page dans le fichier, puis rectangle à quatre décimales.
 */
function cropKey(crop, pageOffset) {
  const x = crop.x ?? 0, y = crop.y ?? 0, w = crop.w ?? 1, h = crop.h ?? 1
  if (w >= 1 && h >= 1) return null
  const n = String(crop.page + pageOffset).padStart(2, '0')
  return `p${n}_${x.toFixed(4)}_${y.toFixed(4)}_${w.toFixed(4)}_${h.toFixed(4)}`
}

/* ------------------------------------------------------------- rendu */

for (const t of TUTORIALS) {
  if (only && t.id !== only && t.source.assetId !== only) continue

  const { assetId, pageOffset, pdf } = t.source
  const pdfPath = join(ROOT, 'rules', pdf)
  if (!existsSync(pdfPath)) {
    console.log(`${t.title} : PDF absent (rules/${pdf}), ignoré.`)
    continue
  }

  const dir = join(ROOT, 'games', assetId)
  const manifestPath = join(dir, 'pages.json')
  if (!existsSync(manifestPath)) {
    console.log(`${t.title} : pages non ingérées (games/${assetId}/pages.json absent), ignoré.`)
    continue
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const cropsDir = join(dir, 'crops')
  mkdirSync(cropsDir, { recursive: true })

  // Toutes les découpes à rectangle : matériel, puis étapes.
  const wanted = new Map()
  const add = (crop) => {
    if (!crop) return
    const key = cropKey(crop, pageOffset)
    if (key && !wanted.has(key)) wanted.set(key, crop)
  }
  for (const c of t.components) add(c.crop)
  for (const ch of t.chapters) for (const s of ch.steps) add(s.crop)

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(pdfPath)),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise

  const pageCache = new Map()
  const getPage = async (n) => {
    if (!pageCache.has(n)) pageCache.set(n, n >= 1 && n <= doc.numPages ? await doc.getPage(n) : null)
    return pageCache.get(n)
  }

  const produced = {}
  let written = 0, kept = 0, missing = 0

  for (const [key, crop] of wanted) {
    const n = crop.page + pageOffset
    const page = await getPage(n)
    if (!page) {
      console.log(`  ! page ${n} hors du PDF pour ${key}`)
      missing++
      continue
    }

    const x = crop.x ?? 0, y = crop.y ?? 0, w = crop.w ?? 1, h = crop.h ?? 1
    const base = page.getViewport({ scale: 1 })

    // Échelle propre à cette découpe : son grand côté vise TARGET_PX.
    const longSide = Math.max(w * base.width, h * base.height)
    const scale = Math.min(MAX_SCALE, Math.max(1, TARGET_PX / longSide))

    const viewport = page.getViewport({ scale })
    const cw = Math.max(1, Math.round(w * viewport.width))
    const ch = Math.max(1, Math.round(h * viewport.height))

    produced[key] = [cw, ch]

    // Déjà rendue à cette taille : on ne la réécrit pas, pour que git ne
    // voie pas changer des fichiers identiques.
    const out = join(cropsDir, `${key}.webp`)
    if (!force && existsSync(out)) {
      kept++
      continue
    }

    const canvas = createCanvas(cw, ch)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cw, ch)

    // On rend la page entière dans un canvas de la taille de la découpe :
    // la translation amène le coin haut-gauche du rectangle à l'origine, et
    // ce qui dépasse est simplement écrêté par le canvas.
    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
      transform: [1, 0, 0, 1, -x * viewport.width, -y * viewport.height],
    }).promise

    writeFileSync(out, await canvas.encode('webp', QUALITY))
    written++
  }

  // Découpes orphelines : rectangles modifiés ou supprimés depuis.
  let removed = 0
  for (const f of readdirSync(cropsDir)) {
    if (!produced[f.replace(/\.webp$/, '')]) {
      unlinkSync(join(cropsDir, f))
      removed++
    }
  }

  manifest.crops = Object.fromEntries(Object.entries(produced).sort())
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  const px = Object.values(produced)
  const min = px.length ? Math.min(...px.map(([a, b]) => Math.max(a, b))) : 0
  console.log(
    `${t.title} : ${px.length} découpe(s) — ${written} rendue(s), ${kept} conservée(s), ` +
    `${removed} supprimée(s)${missing ? `, ${missing} page(s) manquante(s)` : ''}. ` +
    `Plus petit grand côté : ${min} px.`,
  )
}
