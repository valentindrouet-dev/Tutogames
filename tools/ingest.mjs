/**
 * Ingestion d'un PDF de règles.
 *
 * Rend chaque page du PDF en une image, et écrit un manifeste que
 * l'application utilisé pour cadrer les découpes déclarées dans les
 * tutoriels (src/games/*.ts).
 *
 *   npm run ingest -- rules/nemesis-regles-fr.pdf nemesis
 *   npm run ingest -- <chemin-du-pdf> <assetId> [--dpi 150] [--jpeg]
 *
 * Produit :
 *   public/games/<assetId>/pages.json
 *   public/games/<assetId>/pages/p001.png ...
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

  assetId   Dossier de sortie sous public/games/. Par défaut, le nom du
            fichier PDF sans extension.

Options :
  --dpi <n>   Résolution de rendu. Défaut 150. 200+ pour des gros plans nets.
  --jpeg      Sortie en JPEG (fichiers plus légers) au lieu de PNG.
  --quality   Qualité JPEG de 1 à 100. Défaut 82.

Exemple :
  npm run ingest -- rules/nemesis-regles-fr.pdf nemesis --dpi 180 --jpeg
`)
  process.exit(1)
}

const pdfPath = resolve(ROOT, pdfArg)
if (!existsSync(pdfPath)) {
  console.error(`PDF introuvable : ${pdfPath}`)
  process.exit(1)
}

const assetId = assetArg || basename(pdfPath).replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
const dpi = Number(flags.get('dpi') ?? 150)
const jpeg = flags.has('jpeg')
const quality = Number(flags.get('quality') ?? 82)

// pdf.js rend à 72 dpi par défaut : l'échelle est le rapport à la cible.
const scale = dpi / 72

/* ---------------------------------------------------------------- rendu */

// Le build « legacy » de pdf.js est celui qui fonctionne sous Node sans DOM.
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

const outDir = resolve(ROOT, 'public/games', assetId)
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

  const file = `p${String(n).padStart(pad, '0')}.${jpeg ? 'jpg' : 'png'}`
  const buffer = jpeg ? await canvas.encode('jpeg', quality) : await canvas.encode('png')
  writeFileSync(resolve(pagesDir, file), buffer)

  pages.push({ n, w, h, file })
  process.stdout.write(`\r  page ${n}/${doc.numPages}`)
}

process.stdout.write('\n')

const manifest = {
  assetId,
  pdf: basename(pdfPath),
  dpi,
  generatedAt: new Date().toISOString(),
  pages,
}

writeFileSync(resolve(outDir, 'pages.json'), JSON.stringify(manifest, null, 2))

console.log(`\nEcrit dans public/games/${assetId}/`)
console.log(`  pages.json + ${pages.length} images`)
console.log(`
Étapes suivantes :
  1. Vérifiez source.pageOffset dans src/games/<jeu>.ts.
     C'est l'écart entre le numéro imprimé sur le livret et l'index de page
     du fichier. Si la page « 2 » du livret est la 3e page du PDF, mettez 1.
  2. Ouvrez l'application, bouton « Studio », pour tracer les découpes.
     Voir GUIDE_CREATION_TUTO.md.`)
