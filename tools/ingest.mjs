/**
 * Ingestion d'un PDF de règles.
 *
 * Rend chaque page du PDF en une image, et écrit un manifeste que
 * l'application utilisé pour cadrer les découpes déclarées dans les
 * tutoriels (src/games/*.ts).
 *
 *   npm run ingest -- "rules/Nemesis - Regles.pdf" nemesis
 *   npm run ingest -- <chemin-du-pdf> <assetId> [--dpi 200] [--jpeg|--png]
 *
 * Produit, à la racine du dépôt (c'est la racine qui est publiée) :
 *   games/<assetId>/pages.json
 *   games/<assetId>/pages/p01.webp ...
 *
 * WebP par défaut : à qualité égale, un tiers plus léger que le JPEG, et
 * lisible par Safari iPadOS depuis 2020. Après l'ingestion, lancez
 * `npm run crops` pour pré-découper les visuels référencés par le tutoriel.
 *
 * Le manifeste contient la taille réelle de chaque page : c'est ce qui
 * permet à l'application de respecter le rapport de forme des découpes
 * sans jamais déformer un visuel de règles.
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { basename, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/* ------------------------------------------------------------- arguments */

const argv = process.argv.slice(2)
const flags = new Map()
const positional = []

for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2)
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
    flags.set(key, value)
  } else {
    positional.push(argv[i])
  }
}

const [pdfArg, assetArg] = positional

if (!pdfArg) {
  console.error(`
Usage : npm run ingest -- <chemin-du-pdf> [assetId] [options]

  assetId   Dossier de sortie sous games/. Par défaut, le nom du fichier
            PDF sans extension.

Options :
  --dpi <n>   Résolution de rendu. Défaut 200.
  --jpeg      Sortie en JPEG au lieu de WebP.
  --png       Sortie en PNG sans perte (lourd, pour vérification).
  --quality   Qualité WebP/JPEG de 1 à 100. Défaut 80.

Exemple :
  npm run ingest -- "rules/Nemesis - Regles.pdf" nemesis
`)
  process.exit(1)
}

const pdfPath = resolve(ROOT, pdfArg)
if (!existsSync(pdfPath)) {
  console.error(`PDF introuvable : ${pdfPath}`)
  process.exit(1)
}

const assetId = assetArg || basename(pdfPath).replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
const dpi = Number(flags.get('dpi') ?? 200)
const format = flags.has('png') ? 'png' : flags.has('jpeg') ? 'jpeg' : 'webp'
const ext = { png: 'png', jpeg: 'jpg', webp: 'webp' }[format]
const quality = Number(flags.get('quality') ?? 80)

// pdf.js rend à 72 dpi par défaut : l'échelle est le rapport à la cible.
const scale = dpi / 72

/* ---------------------------------------------------------------- rendu */

// Le build « legacy » de pdf.js est celui qui fonctionne sous Node sans DOM.
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

const outDir = resolve(ROOT, 'games', assetId)
const pagesDir = resolve(outDir, 'pages')
rmSync(pagesDir, { recursive: true, force: true })
mkdirSync(pagesDir, { recursive: true })

const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(pdfPath)),
  // Les règles de jeu embarquent quasiment toujours leurs polices ; on évite
  // ainsi de dépendre de fichiers standard absents de l'installation Node.
  useSystemFonts: true,
  isEvalSupported: false,
}).promise

console.log(`${basename(pdfPath)} — ${doc.numPages} pages, rendu à ${dpi} dpi`)

const pages = []
const pad = String(doc.numPages).length

for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n)
  const viewport = page.getViewport({ scale })
  const w = Math.round(viewport.width)
  const h = Math.round(viewport.height)

  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')

  // Les règles sont conçues pour du papier : un fond blanc évite les zones
  // transparentes là où le PDF ne peint rien.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  await page.render({ canvasContext: ctx, viewport, canvas }).promise

  const file = `p${String(n).padStart(pad, '0')}.${ext}`
  const buffer = format === 'png' ? await canvas.encode('png') : await canvas.encode(format, quality)
  writeFileSync(resolve(pagesDir, file), buffer)

  pages.push({ n, w, h, file })
  process.stdout.write(`\r  page ${n}/${doc.numPages}`)
}

process.stdout.write('\n')

const manifest = {
  assetId,
  pdf: basename(pdfPath),
  dpi,
  format,
  generatedAt: new Date().toISOString(),
  pages,
}

writeFileSync(resolve(outDir, 'pages.json'), JSON.stringify(manifest, null, 2))

console.log(`\nÉcrit dans games/${assetId}/`)
console.log(`  pages.json + ${pages.length} images`)
console.log(`
Étapes suivantes :
  1. Vérifiez source.pageOffset dans src/games/<jeu>.ts.
     C'est l'écart entre le numéro imprimé sur le livret et l'index de page
     du fichier. Si la page « 2 » du livret est la 3e page du PDF, mettez 1.
  2. npm run extract -- <pdf> ${assetId}   pour trouver les découpes,
     puis le Studio de l'application pour celles qui restent.
  3. npm run crops                          pour pré-découper les visuels
     référencés par le tutoriel (fichiers légers, chargement rapide).
     Voir GUIDE_CREATION_TUTO.md.`)
