/**
 * Fusion de plusieurs PDF en un seul, pages dans l'ordre donné.
 *
 *   npm run merge -- "rules/Frosthaven - Regles.pdf" \
 *     rules/Frosthaven_Rules_-_Part_1.pdf \
 *     rules/Frosthaven_Rules_-_Part_2.pdf \
 *     rules/Frosthaven_Rules_-_Part_3.pdf
 *
 * Le premier argument est le fichier produit, les suivants sont les
 * parties, dans l'ordre de lecture. Rien n'est modifié dans les sources.
 *
 * Pourquoi : un tutoriel ne connaît qu'un seul PDF (`source.pdf`), et ses
 * découpes sont repérées par le numéro de page imprimé. Quand un éditeur
 * livre son livret en plusieurs fichiers à numérotation continue (Frosthaven :
 * pages 1 à 38, 39 à 72, 73 à 84), la fusion redonne un fichier où la page
 * imprimée N est la N-ième page du PDF, donc `pageOffset: 0`.
 *
 * Le fichier produit n'est pas versionné (`rules/*.pdf` est ignoré) : il se
 * refait en une commande à partir des parties, qui elles le sont.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument } from 'pdf-lib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const [outArg, ...partArgs] = process.argv.slice(2)

if (!outArg || partArgs.length < 2) {
  console.error(`
Usage : npm run merge -- <pdf-produit> <partie-1.pdf> <partie-2.pdf> [...]

Les parties sont copiées dans l'ordre donné. Le fichier produit est écrasé
s'il existe déjà.
`)
  process.exit(1)
}

const outPath = resolve(ROOT, outArg)
const parts = partArgs.map((p) => resolve(ROOT, p))

for (const p of parts) {
  if (!existsSync(p)) {
    console.error(`Partie introuvable : ${p}`)
    process.exit(1)
  }
}

const merged = await PDFDocument.create()
let first = 1

for (const p of parts) {
  const src = await PDFDocument.load(readFileSync(p), { ignoreEncryption: true })
  const indices = src.getPageIndices()
  const pages = await merged.copyPages(src, indices)
  for (const page of pages) merged.addPage(page)
  const last = first + indices.length - 1
  console.log(`${basename(p)} : ${indices.length} pages → pages ${first} à ${last}`)
  first = last + 1
}

// Les métadonnées des parties ne décrivent plus le fichier entier.
merged.setTitle(basename(outPath).replace(/\.pdf$/i, ''))
merged.setProducer('TutoGames merge-pdf')
merged.setCreator('TutoGames merge-pdf')

writeFileSync(outPath, await merged.save({ useObjectStreams: true }))
console.log(`\nÉcrit : ${outArg} (${first - 1} pages)`)
