/**
 * Pré-découpe des visuels référencés par les tutoriels.
 *
 *   npm run crops                 tous les jeux
 *   npm run crops -- nemesis      un seul jeu
 *
 * Pour chaque `crop` à rectangle des tutoriels (matériel et étapes), découpe
 * la zone dans la page ingérée et l'écrit en WebP dans games/<id>/crops/.
 * Le manifeste pages.json reçoit la liste des découpes disponibles.
 *
 * Pourquoi : cadrer une page entière en CSS oblige la tablette à charger
 * ~1 Mo par page, même pour une vignette de 46 px. Un fichier pré-découpé
 * pèse quelques dizaines de Ko. L'application préfère toujours le fichier
 * pré-découpé quand il existe, et retombe sur la page sinon — le tutoriel
 * reste donc jouable même si cet outil n'a pas été lancé.
 *
 * À relancer après toute modification des rectangles dans src/games/*.ts,
 * ou après une ré-ingestion. Les découpes orphelines sont supprimées.
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Plus grand côté d'une découpe, en pixels. Suffisant pour le panneau visuel d'un iPad Retina. */
const MAX_SIDE = 1400
const QUALITY = 82

const only = process.argv[2]

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

/* ------------------------------------------------------------- découpe */

for (const t of TUTORIALS) {
  if (only && t.id !== only && t.source.assetId !== only) continue

  const { assetId, pageOffset } = t.source
  const dir = join(ROOT, 'games', assetId)
  const manifestPath = join(dir, 'pages.json')
  if (!existsSync(manifestPath)) {
    console.log(`${t.title} : pas de pages ingérées (games/${assetId}/pages.json absent), ignoré.`)
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

  const pages = new Map()
  const loadPage = async (n) => {
    if (!pages.has(n)) {
      const p = manifest.pages.find((p) => p.n === n)
      pages.set(n, p ? await loadImage(join(dir, 'pages', p.file)) : null)
    }
    return pages.get(n)
  }

  const produced = {}
  let written = 0, kept = 0

  for (const [key, crop] of wanted) {
    const n = crop.page + pageOffset
    const img = await loadPage(n)
    if (!img) {
      console.log(`  ! page ${n} introuvable pour ${key}`)
      continue
    }

    const sx = Math.round((crop.x ?? 0) * img.width)
    const sy = Math.round((crop.y ?? 0) * img.height)
    const sw = Math.max(1, Math.round((crop.w ?? 1) * img.width))
    const sh = Math.max(1, Math.round((crop.h ?? 1) * img.height))

    const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh))
    const w = Math.max(1, Math.round(sw * scale))
    const h = Math.max(1, Math.round(sh * scale))

    const out = join(cropsDir, `${key}.webp`)
    produced[key] = [w, h]

    // Déjà produite à la bonne taille : on ne la réécrit pas, pour que git
    // ne voie pas changer des fichiers identiques.
    if (existsSync(out)) {
      kept++
      continue
    }

    const canvas = createCanvas(w, h)
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
    writeFileSync(out, await canvas.encode('webp', QUALITY))
    written++
  }

  // Découpes orphelines : rectangles modifiés ou supprimés depuis.
  let removed = 0
  for (const f of readdirSync(cropsDir)) {
    const key = f.replace(/\.webp$/, '')
    if (!produced[key]) {
      unlinkSync(join(cropsDir, f))
      removed++
    }
  }

  manifest.crops = Object.fromEntries(Object.entries(produced).sort())
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log(`${t.title} : ${Object.keys(produced).length} découpe(s) — ${written} écrite(s), ${kept} conservée(s), ${removed} supprimée(s).`)
}
