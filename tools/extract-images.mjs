/**
 * Extraction précise des visuels d'un PDF de règles.
 *
 *   npm run extract -- rules/nemesis.pdf nemesis
 *
 * Deux stratégies complémentaires, exécutées ensemble :
 *
 *  1. IMAGES INTÉGRÉES — on parcourt la liste d'opérateurs de chaque page pour
 *     retrouver les images bitmap (`paintImageXObject`) et la matrice qui les
 *     place. C'est la méthode exacte : les rendus 3D de matériel d'un livret
 *     de règles sont presque toujours des images distinctes, on récupère donc
 *     chaque composant détouré, à sa résolution native.
 *
 *  2. RÉGIONS D'ENCRE — pour les illustrations vectorielles (schémas, cartes
 *     d'exemple), aucune image n'existe dans le PDF. On rend alors la page et
 *     on isole les amas de pixels non blancs séparés par des gouttières de
 *     blanc. Chaque amas devient un candidat de découpe.
 *
 * Les deux produisent la même chose : des rectangles NORMALISÉS (0 à 1), donc
 * directement collables dans le champ `crop` d'un tutoriel. Aucun changement
 * du moteur n'est nécessaire.
 *
 * Sorties, hors de public/ pour ne pas alourdir le site publié :
 *   .extract/<id>/candidates.json          rectangles + métadonnées
 *   .extract/<id>/p03-img02.png            aperçu de chaque candidat
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
    flags.set(key, argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true')
  } else positional.push(argv[i])
}

const [pdfArg, assetArg] = positional
if (!pdfArg) {
  console.error(`
Usage : npm run extract -- <chemin-du-pdf> <assetId> [options]

Options :
  --dpi <n>       Résolution d'analyse des régions d'encre. Défaut 150.
  --min-size <n>  Taille minimale d'un candidat, en fraction de la page.
                  Défaut 0.03 (3 %). Augmentez pour ignorer les puces et
                  petites icônes de texte.
  --pages <liste> Limite l'analyse à certaines pages du fichier, ex. 2-3,9,24-26.
  --no-regions    N'extrait que les images intégrées, sans analyse de pixels.
`)
  process.exit(1)
}

const pdfPath = resolve(ROOT, pdfArg)
if (!existsSync(pdfPath)) {
  console.error(`PDF introuvable : ${pdfPath}`)
  process.exit(1)
}

const assetId = assetArg || basename(pdfPath).replace(/\.pdf$/i, '').toLowerCase()
const dpi = Number(flags.get('dpi') ?? 150)
const minSize = Number(flags.get('min-size') ?? 0.03)
const withRegions = !flags.has('no-regions')

/** « 2-3,9,24-26 » -> Set des numéros de page. Vide = toutes les pages. */
function parsePages(spec) {
  const set = new Set()
  if (!spec) return set
  for (const part of String(spec).split(',')) {
    const [a, b] = part.split('-').map((n) => Number(n.trim()))
    if (!Number.isFinite(a)) continue
    for (let n = a; n <= (Number.isFinite(b) ? b : a); n++) set.add(n)
  }
  return set
}
const only = parsePages(flags.get('pages'))

/* ---------------------------------------------------------------- setup */

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
const { OPS } = pdfjs

// Dossier de travail : ces aperçus servent à identifier les visuels, ils
// n'ont rien à faire dans le site publié.
const outDir = resolve(ROOT, '.extract', assetId)
const previewDir = outDir
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(pdfPath)),
  useSystemFonts: true,
  isEvalSupported: false,
}).promise

console.log(`${basename(pdfPath)} — ${doc.numPages} pages`)
if (only.size) console.log(`Pages analysées : ${[...only].join(', ')}`)

/* ------------------------------------------------------ matrices 2D PDF */

/** Produit de deux matrices [a b c d e f]. */
function mul(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
}

const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

/* ------------------------------------------- 1. images bitmap intégrées */

/**
 * Retourne les images bitmap d'une page, avec leur rectangle normalisé.
 * La page doit avoir été rendue au préalable : c'est le rendu qui remplit
 * `page.objs`.
 */
async function embeddedImages(page, viewport) {
  const ops = await page.getOperatorList()
  const found = []

  // On rejoue la pile graphique pour connaître la matrice courante à
  // l'instant où chaque image est peinte.
  let ctm = viewport.transform.slice()
  const stack = []

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    const args = ops.argsArray[i]

    if (fn === OPS.save) stack.push(ctm.slice())
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm
    else if (fn === OPS.transform) ctm = mul(ctm, args)
    else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
      const id = args[0]

      // Une image occupe le carré unité de l'espace utilisateur, replié par
      // la matrice courante. Les quatre coins donnent le rectangle à l'écran.
      const corners = [apply(ctm, 0, 0), apply(ctm, 1, 0), apply(ctm, 0, 1), apply(ctm, 1, 1)]
      const xs = corners.map((c) => c[0])
      const ys = corners.map((c) => c[1])
      const x0 = Math.min(...xs)
      const y0 = Math.min(...ys)
      const x1 = Math.max(...xs)
      const y1 = Math.max(...ys)

      let img = null
      try {
        img = page.objs.has(id) ? page.objs.get(id) : null
      } catch {
        // Objet non résolu : on garde quand même le rectangle, qui suffit
        // à produire une découpe.
      }

      found.push({
        id,
        rect: { x0, y0, x1, y1 },
        img,
      })
    }
  }

  return found.map((f) => ({
    ...f,
    norm: {
      x: f.rect.x0 / viewport.width,
      y: f.rect.y0 / viewport.height,
      w: (f.rect.x1 - f.rect.x0) / viewport.width,
      h: (f.rect.y1 - f.rect.y0) / viewport.height,
    },
  }))
}

/* --------------------------------------------- 2. régions d'encre */

/**
 * Isole les amas de pixels non blancs séparés par des gouttières de blanc.
 *
 * On travaille sur une grille grossière plutôt que pixel par pixel : une
 * illustration de règles est entourée de marge, donc une cellule de quelques
 * millimètres suffit à séparer deux visuels tout en gardant les parties d'un
 * même visuel connectées.
 */
function inkRegions(ctx, w, h, cell = 8, threshold = 246) {
  const cols = Math.ceil(w / cell)
  const rows = Math.ceil(h / cell)
  const ink = new Uint8Array(cols * rows)
  const { data } = ctx.getImageData(0, 0, w, h)

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let marked = 0
      for (let y = cy * cell; y < Math.min((cy + 1) * cell, h) && !marked; y++) {
        for (let x = cx * cell; x < Math.min((cx + 1) * cell, w); x++) {
          const i = (y * w + x) * 4
          // Un pixel compte comme de l'encre s'il est nettement non blanc.
          if (data[i] < threshold || data[i + 1] < threshold || data[i + 2] < threshold) {
            marked = 1
            break
          }
        }
      }
      ink[cy * cols + cx] = marked
    }
  }

  // Composantes connexes en 8-voisinage, parcours itératif pour éviter
  // une récursion profonde sur les grandes zones.
  const seen = new Uint8Array(cols * rows)
  const boxes = []

  for (let start = 0; start < ink.length; start++) {
    if (!ink[start] || seen[start]) continue
    const queue = [start]
    seen[start] = 1
    let minX = cols, minY = rows, maxX = -1, maxY = -1, count = 0

    while (queue.length) {
      const idx = queue.pop()
      const cx = idx % cols
      const cy = (idx - cx) / cols
      count++
      if (cx < minX) minX = cx
      if (cy < minY) minY = cy
      if (cx > maxX) maxX = cx
      if (cy > maxY) maxY = cy

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
          const n = ny * cols + nx
          if (ink[n] && !seen[n]) {
            seen[n] = 1
            queue.push(n)
          }
        }
      }
    }

    boxes.push({
      x: (minX * cell) / w,
      y: (minY * cell) / h,
      w: ((maxX - minX + 1) * cell) / w,
      h: ((maxY - minY + 1) * cell) / h,
      cells: count,
    })
  }

  return boxes
}

/* ------------------------------------------------------------- traitement */

const scale = dpi / 72
const candidates = []
const pad = String(doc.numPages).length

for (let n = 1; n <= doc.numPages; n++) {
  if (only.size && !only.has(n)) continue

  const page = await doc.getPage(n)
  const viewport = page.getViewport({ scale })
  const w = Math.round(viewport.width)
  const h = Math.round(viewport.height)

  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  await page.render({ canvasContext: ctx, viewport, canvas }).promise

  const tag = `p${String(n).padStart(pad, '0')}`

  /* -- images intégrées -- */
  const images = await embeddedImages(page, viewport)
  let k = 0
  for (const im of images) {
    const { x, y, w: rw, h: rh } = im.norm
    if (rw < minSize || rh < minSize) continue
    if (rw > 0.99 && rh > 0.99) continue // fond de page, pas un composant

    k++
    const file = `${tag}-img${String(k).padStart(2, '0')}.png`

    // Aperçu découpé dans le rendu de la page : mêmes pixels que ce que
    // l'application affichera, donc fidèle au résultat final.
    const sx = Math.max(0, Math.round(x * w))
    const sy = Math.max(0, Math.round(y * h))
    const sw = Math.min(w - sx, Math.round(rw * w))
    const sh = Math.min(h - sy, Math.round(rh * h))
    if (sw > 1 && sh > 1) {
      const crop = createCanvas(sw, sh)
      crop.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
      writeFileSync(resolve(previewDir, file), await crop.encode('png'))
    }

    candidates.push({
      kind: 'image',
      page: n,
      file,
      crop: { page: n, x: +x.toFixed(4), y: +y.toFixed(4), w: +rw.toFixed(4), h: +rh.toFixed(4) },
      pixels: im.img ? { w: im.img.width, h: im.img.height } : null,
    })
  }

  /* -- régions d'encre -- */
  let r = 0
  if (withRegions) {
    for (const box of inkRegions(ctx, w, h)) {
      if (box.w < minSize || box.h < minSize) continue
      if (box.w > 0.97 && box.h > 0.97) continue

      r++
      const file = `${tag}-reg${String(r).padStart(2, '0')}.png`
      const sx = Math.max(0, Math.round(box.x * w))
      const sy = Math.max(0, Math.round(box.y * h))
      const sw = Math.min(w - sx, Math.round(box.w * w))
      const sh = Math.min(h - sy, Math.round(box.h * h))
      if (sw > 1 && sh > 1) {
        const crop = createCanvas(sw, sh)
        crop.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
        writeFileSync(resolve(previewDir, file), await crop.encode('png'))
      }

      candidates.push({
        kind: 'region',
        page: n,
        file,
        crop: {
          page: n,
          x: +box.x.toFixed(4),
          y: +box.y.toFixed(4),
          w: +box.w.toFixed(4),
          h: +box.h.toFixed(4),
        },
        pixels: { w: sw, h: sh },
      })
    }
  }

  process.stdout.write(`\r  page ${n}/${doc.numPages} — ${k} image(s), ${r} région(s)`)
}

process.stdout.write('\n')

writeFileSync(
  resolve(outDir, 'candidates.json'),
  JSON.stringify({ assetId, pdf: basename(pdfPath), dpi, minSize, candidates }, null, 2),
)

const images = candidates.filter((c) => c.kind === 'image').length
console.log(`
${candidates.length} candidat(s) — ${images} image(s) intégrée(s), ${candidates.length - images} région(s).

  .extract/${assetId}/candidates.json
  .extract/${assetId}/            aperçu de chaque candidat

Les rectangles sont normalisés : le champ « crop » de chaque candidat se colle
tel quel dans src/games/<jeu>.ts. Voir GUIDE_CREATION_TUTO.md.`)
