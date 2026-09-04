/**
 * Rend une page de règles sous une grille de coordonnées normalisées.
 *
 *   npm run grid -- "rules/Mon jeu - Regles.pdf" 7
 *   npm run grid -- <pdf> <page[,page...]> [x y w h] [--step 0.025] [--w 1500]
 *
 * C'est l'outil de repérage des découpes : on ouvre l'image produite, on lit
 * les bords du visuel sur les axes, et on écrit le rectangle tel quel dans
 * `src/games/<jeu>.ts`. Les coordonnées de la grille sont toujours celles de
 * la **page entière**, même quand on zoome sur une région : un rectangle lu
 * dans un zoom se colle sans conversion.
 *
 * Les images sortent dans `.extract/grid/` (ignoré par git).
 */

import { createCanvas } from '@napi-rs/canvas'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const flags = new Map()
const positional = []
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2)
    flags.set(key, argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true')
  } else positional.push(argv[i])
}

const [pdfArg, pagesArg, ...rect] = positional

if (!pdfArg || !pagesArg) {
  console.error(`
Usage : npm run grid -- <chemin-du-pdf> <page[,page...]> [x y w h] [options]

  x y w h    Région à zoomer, en coordonnées normalisées. Défaut : page entière.

Options :
  --step <n>  Pas de la grille. Défaut 0.025 sur une page entière, 0.01 en zoom.
  --w <px>    Largeur de l'image produite. Défaut 1500.

Exemples :
  npm run grid -- "rules/Nemesis - Regles.pdf" 6
  npm run grid -- "rules/Nemesis - Regles.pdf" 2,3 0.33 0.15 0.67 0.85 --step 0.01
`)
  process.exit(1)
}

const pdfPath = resolve(ROOT, pdfArg)
if (!existsSync(pdfPath)) {
  console.error(`PDF introuvable : ${pdfPath}`)
  process.exit(1)
}

const [x = 0, y = 0, w = 1, h = 1] = rect.map(Number)
const zoomed = w < 1 || h < 1
const step = Number(flags.get('step') ?? (zoomed ? 0.01 : 0.025))
const targetW = Number(flags.get('w') ?? 1500)

const outDir = join(ROOT, '.extract', 'grid')
mkdirSync(outDir, { recursive: true })

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(pdfPath)),
  useSystemFonts: true,
  isEvalSupported: false,
}).promise

for (const raw of pagesArg.split(',')) {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > doc.numPages) {
    console.error(`Page ${raw} hors du fichier (1 à ${doc.numPages}).`)
    continue
  }

  const page = await doc.getPage(n)
  const base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: targetW / (w * base.width) })
  const cw = Math.round(w * viewport.width)
  const ch = Math.round(h * viewport.height)

  const canvas = createCanvas(cw, ch)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, cw, ch)
  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
    transform: [1, 0, 0, 1, -x * viewport.width, -y * viewport.height],
  }).promise

  // Grille en coordonnées de PAGE : un rectangle lu ici se colle tel quel.
  ctx.lineWidth = 1
  ctx.font = 'bold 15px sans-serif'
  const line = (v, horizontal) => {
    const p = horizontal ? ((v - y) / h) * ch : ((v - x) / w) * cw
    if (p < -1 || p > (horizontal ? ch : cw) + 1) return
    const major = Math.round(v * 1000) % 100 === 0
    ctx.strokeStyle = major ? 'rgba(220,0,0,.85)' : 'rgba(0,110,235,.4)'
    ctx.beginPath()
    if (horizontal) { ctx.moveTo(0, p); ctx.lineTo(cw, p) } else { ctx.moveTo(p, 0); ctx.lineTo(p, ch) }
    ctx.stroke()
    ctx.fillStyle = major ? '#c00' : '#06c'
    if (horizontal) ctx.fillText(v.toFixed(3).replace(/0$/, ''), 3, p - 3)
    else ctx.fillText(v.toFixed(3).replace(/0$/, ''), p + 3, 16)
  }
  for (let v = 0; v <= 1.0001; v += step) line(Number(v.toFixed(4)), false)
  for (let v = 0; v <= 1.0001; v += step) line(Number(v.toFixed(4)), true)

  const file = join(outDir, `p${String(n).padStart(2, '0')}_${x}_${y}_${w}_${h}.png`)
  writeFileSync(file, canvas.toBuffer('image/png'))
  console.log(`${file}  ${cw}x${ch}`)
}

console.log(`
Lisez les bords du visuel sur la grille, puis collez le rectangle :

  crop: { page: <numéro imprimé>, x: …, y: …, w: …, h: … }

puis lancez « npm run crops » pour le rendre. Voir GUIDE_CREATION_TUTO.md.`)
