/**
 * Ce que chaque effectif voit, jeu par jeu.
 *
 * Un tutoriel demande l'effectif au démarrage et filtre son contenu (`only`).
 * Ce contrôle sert à répondre à une question simple : quand je choisis
 * 1 joueur, est-ce que le tutoriel me donne bien les règles du solo, et
 * est-ce qu'il me cache celles qui n'existent pas à cette table ?
 *
 *   npm run players            tous les jeux
 *   npm run players -- nemesis un seul
 *
 * Deux relevés :
 *
 *  - le compte d'étapes par effectif et par mode, pour voir d'un coup d'œil
 *    si un effectif est servi ;
 *  - les étapes qui PARLENT des autres joueurs sans porter de filtre. Ce
 *    n'est pas toujours une faute — « chaque joueur » va très bien quand on
 *    est seul à la table — mais c'est là que se cachent les « premier
 *    joueur », « voisin de gauche » et « tour de table » qui n'ont pas de
 *    sens en solo.
 */

import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'

const only = process.argv.slice(2).find((a) => !a.startsWith('--'))

mkdirSync('.extract', { recursive: true })
const entry = '.extract/players-entry.ts'
const bundle = '.extract/players.bundle.mjs'
writeFileSync(
  entry,
  "export { TUTORIALS } from '../src/games/index'\n" +
    "export { viewFor } from '../src/engine/tutorial'\n" +
    "export { modesOf, playerRange } from '../src/engine/types'\n",
)
await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'silent' })
const { TUTORIALS, viewFor, modesOf, playerRange } = await import(pathToFileURL(bundle).href)

/**
 * Tournures qui supposent quelqu'un d'autre autour de la table. « Voisin »
 * seul ne compte pas : dans un jeu de cartes-lieux, c'est la carte d'à côté.
 */
const CROWD =
  /premier joueur|tour de table|joueur voisin|voisin de (?:gauche|droite)|sens horaire|chacun son tour|(?:les |un )?autres? joueurs?/i

let flagged = 0

for (const t of TUTORIALS) {
  if (only && t.id !== only) continue

  const counts = playerRange(t.players).map((n) => {
    const per = modesOf(t)
      .map((m) => `${m[0]}${viewFor(t, n, m).chapters.flatMap((c) => c.steps).length}`)
      .join(' ')
    return `${n}j ${per}`
  })
  console.log(`\n${t.title}`)
  console.log(`  ${counts.join('   ')}`)

  const soloOnly = []
  const soloHidden = []
  const crowd = []
  for (const ch of t.chapters) {
    for (const s of ch.steps) {
      const text = [s.title, ...(s.body ?? []), s.warn ?? '', s.tip ?? ''].join(' ')
      if (s.only?.length === 1 && s.only[0] === 1) soloOnly.push(s.id)
      else if (s.only && !s.only.includes(1)) soloHidden.push(s.id)
      else if (CROWD.test(text)) crowd.push(`${s.id} — ${s.title}`)
    }
  }
  console.log(`  solo : ${soloOnly.length} étape(s) propres, ${soloHidden.length} masquée(s)`)
  if (t.players.min === 1 && !t.players.notes?.[1]) console.log('  ! aucune note d’effectif pour le solo')
  if (crowd.length) {
    flagged += crowd.length
    console.log(`  ? ${crowd.length} étape(s) parlent des autres joueurs sans filtre :`)
    for (const c of crowd) console.log(`      ${c}`)
  }
}

console.log(
  `\n${flagged} étape(s) à relire. Un signalement n'est pas une faute : ` +
    'un adversaire automatisé, comme le Tengu de Bitoku, tient le rôle de l’autre joueur.',
)
