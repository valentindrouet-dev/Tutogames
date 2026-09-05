/**
 * Les aides de jeu du matériel : ce que chaque jeu détaille, et ce qu'il ne
 * détaille pas encore.
 *
 *   npm run aids
 *
 * Un composant qui existe en plusieurs types — six symboles de jeton
 * Exploration, quatorze conditions de Frosthaven — porte une liste de
 * `variants`. La fiche du matériel la montre en aide de jeu, et le joueur
 * n'a plus à rouvrir le livret en pleine partie.
 *
 * Le relevé sert à voir d'un coup où il reste du travail : un composant dont
 * la quantité ou le nom annonce plusieurs sortes, mais qui n'a pas de liste,
 * est signalé.
 */

import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('.extract', { recursive: true })
const entry = '.extract/aids-entry.ts'
const bundle = '.extract/aids.bundle.mjs'
writeFileSync(entry, "export { TUTORIALS } from '../src/games/index'\n")
await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'silent' })
const { TUTORIALS } = await import(pathToFileURL(bundle).href)

/**
 * Ce qui annonce vraiment plusieurs sortes, et pas seulement deux composants
 * réunis sous un même nom. « Cartes Yōkai et Yōkai de départ », c'est un lot ;
 * « 8 de type A et 8 de type B », c'est une liste à écrire.
 */
const MANY = /\bde type\b|\bsortes?\b|\bcouleurs?\b|\btypes?\b|\bchacune?\b/i

let total = 0
for (const t of TUTORIALS) {
  const withAid = t.components.filter((c) => c.variants?.length)
  const candidates = t.components.filter(
    (c) => !c.variants && (MANY.test(c.name) || MANY.test(c.qty ?? '') || MANY.test(c.note ?? '')),
  )
  total += withAid.reduce((n, c) => n + c.variants.length, 0)
  console.log(`\n${t.title}`)
  console.log(`  ${withAid.length} composant(s) avec aide, ${withAid.reduce((n, c) => n + c.variants.length, 0)} type(s) décrit(s)`)
  for (const c of withAid) {
    const shots = c.variants.filter((v) => v.crop).length
    console.log(`    ${c.name} — ${c.variants.length} types${shots ? `, ${shots} vignette(s)` : ''}`)
  }
  if (candidates.length) {
    console.log(`  ? sans aide, mais le nom ou la quantité en annonce plusieurs :`)
    for (const c of candidates) console.log(`      ${c.name}${c.qty ? ` (${c.qty})` : ''}`)
  }
}
console.log(`\n${total} type(s) de matériel décrits en tout.`)
