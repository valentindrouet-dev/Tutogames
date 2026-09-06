/**
 * Contrôle des glossaires de version originale.
 *
 *   npm run vo                 tous les jeux qui ont un glossaire
 *   npm run vo -- nemesis      un seul
 *
 * Pour chaque jeu, la commande dit combien de termes chaque étape fait
 * ressortir. Ce qu'on y cherche :
 *
 *  - une **moyenne de 4 à 10 termes par étape**. En dessous, le glossaire est
 *    trop maigre ou ses entrées ne sont pas écrites comme le tutoriel écrit ;
 *    au-dessus, il déborde de mots trop courants et le bouton VO devient
 *    illisible.
 *  - les **étapes sans aucun terme** : normal pour un briefing, suspect pour
 *    une étape de mise en place.
 *  - les **termes jamais trouvés** : soit le mot ne s'écrit pas dans le
 *    tutoriel comme dans le glossaire, soit il n'y apparaît pas du tout. Le
 *    second cas est acceptable — le glossaire complet sert aussi de référence
 *    à la table — mais vérifiez que ce n'est pas une faute de frappe.
 *
 * Voir GUIDE_CREATION_TUTO.md, « Écrire le glossaire VO ».
 */

import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const only = process.argv.slice(2).find((a) => !a.startsWith('--'))

// Les tutoriels sont du TypeScript : on les bundle le temps de les lire.
const dir = join(ROOT, '.extract')
mkdirSync(dir, { recursive: true })
const entry = join(dir, 'vo-entry.ts')
writeFileSync(
  entry,
  [
    "export { TUTORIALS } from '../src/games/index'",
    "export { voTermsIn } from '../src/engine/vo'",
    "export { componentsOf } from '../src/engine/tutorial'",
    '',
  ].join('\n'),
)
const bundle = join(dir, 'vo.bundle.mjs')
await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'silent' })
const { TUTORIALS, voTermsIn, componentsOf } = await import(pathToFileURL(bundle).href)

let found = 0

for (const t of TUTORIALS) {
  if (!t.vo || (only && t.id !== only)) continue
  found++

  const rows = []
  const seen = new Set()

  for (const c of t.chapters) {
    for (const s of c.steps) {
      const hits = voTermsIn(t.vo.terms, s, componentsOf(t, s), c.title)
      hits.forEach((h) => seen.add(h.fr))
      rows.push({ id: s.id, n: hits.length })
    }
  }

  // Les aides de jeu emploient les mêmes termes, et le surlignage y marche
  // aussi : un terme qui n'existe que là n'est pas un terme oublié. On les
  // compte à part, pour ne pas fausser la moyenne par étape.
  let aidHits = 0
  for (const aid of t.aids ?? []) {
    for (const g of aid.groups) {
      for (const e of g.entries) {
        const fake = { id: e.id, title: e.term, kind: 'info', body: [...e.body, e.note ?? '', e.warn ?? ''] }
        const hits = voTermsIn(t.vo.terms, fake, [], aid.title)
        hits.forEach((h) => seen.add(h.fr))
        aidHits += hits.length
      }
    }
  }

  const total = rows.reduce((sum, r) => sum + r.n, 0)
  const top = [...rows].sort((a, b) => b.n - a.n).slice(0, 3)
  const empty = rows.filter((r) => r.n === 0)
  const never = t.vo.terms.filter((x) => !seen.has(x.fr)).map((x) => x.fr)

  console.log(`\n${t.title} — glossaire ${t.vo.language}`)
  console.log(`  ${t.vo.terms.length} termes, ${rows.length} étapes, ${(total / rows.length).toFixed(1)} termes par étape`)
  console.log(`  étapes les plus fournies : ${top.map((r) => `${r.id} (${r.n})`).join(', ')}`)
  console.log(`  étapes sans terme : ${empty.length}${empty.length ? ` — ${empty.slice(0, 10).map((r) => r.id).join(' ')}` : ''}`)
  const aidCount = (t.aids ?? []).reduce((n, a) => n + a.groups.reduce((m, g) => m + g.entries.length, 0), 0)
  if (aidCount) console.log(`  aides de jeu : ${aidCount} entrées, ${aidHits} termes repérés`)
  console.log(`  jamais rencontrés : ${never.length ? never.join(' · ') : 'aucun'}`)

  // Le mode « sur la boîte » remplace le mot français par le terme imprimé,
  // accordé en nombre. On montre les pluriels que la règle fabrique, pour
  // repérer ceux qui demandent un `enPlural` — Larva donne Larvae, pas
  // Larvas.
  const guessed = t.vo.terms
    .filter((v) => !v.enPlural && /^[\p{L}\s'-]+$/u.test(v.en) && !/[sx]$/i.test(v.fr.trim().split(/\s+/).pop()))
    .map((v) => {
      const last = v.en.trim().split(/\s+/).pop()
      if (/s$/i.test(last) && !/(ss|us|is)$/i.test(last)) return null
      if (/([sxz]|ch|sh)$/i.test(last)) return `${v.en} → ${v.en}es`
      if (/[^aeiou]y$/i.test(last)) return `${v.en} → ${v.en.slice(0, -1)}ies`
      return null
    })
    .filter(Boolean)
  if (guessed.length) console.log(`  pluriels fabriqués, à vérifier : ${guessed.join(' · ')}`)
  const declared = t.vo.terms.filter((v) => v.enPlural)
  if (declared.length) {
    console.log(`  pluriels déclarés : ${declared.map((v) => `${v.en} → ${v.enPlural}`).join(' · ')}`)
  }
}

if (!found) {
  console.log(only ? `Aucun glossaire VO pour « ${only} ».` : 'Aucun tutoriel ne déclare de glossaire VO.')
}
