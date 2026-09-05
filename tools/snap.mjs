/**
 * Recale les découpes d'un tutoriel sur le bloc qu'elles visent.
 *
 * Un rectangle écrit à la main coupe presque toujours quelque chose : une
 * lettre à droite, la légende sous une photo, la dernière ligne d'un
 * paragraphe. On regarde l'encre autour du rectangle : tant que le bord
 * tranche dans du noir, on le repousse, et on s'arrête à la première vraie
 * respiration — une gouttière en largeur, une interligne franche en hauteur.
 * Le déplacement est plafonné : on recale, on ne recadre pas.
 *
 * Le script rattrape le détail, pas l'erreur de colonne : un rectangle calé
 * sur les colonnes d'une autre page reste faux après recalage. Mesurez les
 * colonnes (`npm run grid`) avant, relisez en planche contact après.
 *
 *   npm run snap -- mon-jeu           # montre ce qui bougerait
 *   npm run snap -- mon-jeu --write   # réécrit src/games/mon-jeu.ts
 *
 * Les pages lues sont celles de `games/<assetId>/pages/` : ingérez d'abord.
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const write = args.includes('--write')
const game = args.find((a) => !a.startsWith('--'))

if (!game) {
  console.error('Usage : npm run snap -- <jeu> [--write]')
  process.exit(1)
}

const src = `src/games/${game}.ts`
if (!existsSync(src)) {
  console.error(`${src} est introuvable.`)
  process.exit(1)
}

/** L'identifiant d'ingestion, s'il diffère du nom de fichier. */
const source = readFileSync(src, 'utf8')
const assetId = source.match(/assetId: '([^']+)'/)?.[1] ?? game
const pagesDir = `games/${assetId}/pages`
if (!existsSync(pagesDir)) {
  console.error(`${pagesDir} est introuvable : ingérez le PDF d'abord.`)
  process.exit(1)
}

/* ------------------------------------------------------------------ encre */

/** Largeur d'analyse : assez fine pour distinguer une espace d'une gouttière. */
const W = 1200
/** Seuil de noir : le texte d'un livret, pas les fonds imprimés. */
const DARK = 105
/** Respiration horizontale qui arrête l'expansion, en fraction de page. */
const GAPX = 0.013
/** Respiration verticale : une interligne franche, pas un blanc entre mots. */
const GAPY = 0.018
/** Déplacement maximal d'un bord, en fraction de page. */
const CAP = 0.09

const masks = new Map()
async function maskOf(page) {
  if (masks.has(page)) return masks.get(page)
  const file = `${pagesDir}/p${String(page).padStart(2, '0')}.webp`
  if (!existsSync(file)) return null
  const img = await loadImage(file)
  const H = Math.round((img.height / img.width) * W)
  const ctx = createCanvas(W, H).getContext('2d')
  ctx.drawImage(img, 0, 0, W, H)
  const d = ctx.getImageData(0, 0, W, H).data
  const m = new Uint8Array(W * H)
  for (let i = 0, p = 0; p < W * H; p++, i += 4) {
    m[p] = d[i] < DARK && d[i + 1] < DARK && d[i + 2] < DARK ? 1 : 0
  }
  const out = { m, W, H }
  masks.set(page, out)
  return out
}

const inkCol = (k, px, y0, y1) => {
  for (let py = y0; py < y1; py++) if (k.m[py * k.W + px]) return true
  return false
}
const inkRow = (k, py, x0, x1) => {
  const off = py * k.W
  for (let px = x0; px < x1; px++) if (k.m[off + px]) return true
  return false
}

/** Repousse un bord tant qu'il tranche dans l'encre, jusqu'à la respiration. */
function push(has, from, dir, limit, gap) {
  if (!has(dir > 0 ? from - 1 : from)) return from // le bord ne coupe rien
  let blank = 0
  for (let k = 1; k <= limit; k++) {
    const at = from + dir * k
    if (has(dir > 0 ? at - 1 : at)) blank = 0
    else if (++blank >= gap) return at - dir * (blank - 1)
  }
  return from // rien de net à portée : on ne touche pas
}

async function snap(r) {
  const k = await maskOf(r.page)
  if (!k) return r
  const cx = (v) => Math.min(Math.max(v, 0), k.W - 1)
  const cy = (v) => Math.min(Math.max(v, 0), k.H - 1)
  let x0 = Math.round(r.x * k.W)
  let x1 = Math.round((r.x + r.w) * k.W)
  let y0 = Math.round(r.y * k.H)
  let y1 = Math.round((r.y + r.h) * k.H)
  const capX = Math.round(CAP * k.W)
  const capY = Math.round(CAP * k.H)
  const gx = Math.round(GAPX * k.W)
  const gy = Math.round(GAPY * k.H)

  x1 = push((px) => inkCol(k, cx(px), y0, y1), x1, +1, capX, gx)
  x0 = push((px) => inkCol(k, cx(px), y0, y1), x0, -1, capX, gx)
  y1 = push((py) => inkRow(k, cy(py), x0, x1), y1, +1, capY, gy)
  y0 = push((py) => inkRow(k, cy(py), x0, x1), y0, -1, capY, gy)

  const round = (v) => Number(v.toFixed(3))
  return {
    page: r.page,
    x: round(x0 / k.W),
    y: round(y0 / k.H),
    w: round((x1 - x0) / k.W),
    h: round((y1 - y0) / k.H),
  }
}

/* ------------------------------------------------------- lecture, réécriture */

const RECT = /\{ page: (\d+), x: ([-\d.]+), y: ([-\d.]+), w: ([-\d.]+), h: ([-\d.]+) \}/g

const rects = []
for (const m of source.matchAll(RECT)) {
  rects.push({
    at: m.index,
    len: m[0].length,
    page: Number(m[1]),
    x: Number(m[2]),
    y: Number(m[3]),
    w: Number(m[4]),
    h: Number(m[5]),
  })
}

const num = (v) => String(Number(v.toFixed(3)))
const fmt = (r) => `{ page: ${r.page}, x: ${num(r.x)}, y: ${num(r.y)}, w: ${num(r.w)}, h: ${num(r.h)} }`

let out = ''
let at = 0
let moved = 0
for (const r of rects) {
  const n = await snap(r)
  const same = n.x === r.x && n.y === r.y && n.w === r.w && n.h === r.h
  if (!same) {
    moved++
    console.log(`  p${String(r.page).padStart(2, '0')} ${fmt(r)}\n     → ${fmt(n)}`)
  }
  out += source.slice(at, r.at) + fmt(same ? r : n)
  at = r.at + r.len
}
out += source.slice(at)

console.log(`\n${game} : ${rects.length} découpe(s), ${moved} recalée(s).`)
if (write && moved) {
  writeFileSync(src, out)
  console.log(`${src} réécrit. Relancez « npm run crops -- ${game} », puis relisez en planche contact.`)
} else if (moved) {
  console.log('Ajoutez --write pour appliquer.')
}
