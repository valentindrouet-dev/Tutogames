/**
 * Termes de la version originale : les repérer dans le texte d'une étape.
 *
 * Le tutoriel est écrit en français, la boîte posée sur la table ne l'est pas
 * toujours. Plutôt qu'un index à consulter à côté, les mots concernés sont
 * **surlignés dans la consigne elle-même** : le joueur voit tout de suite
 * lesquels ne sont pas ceux imprimés sur son matériel, et n'a rien à faire
 * pour les autres.
 *
 * La comparaison passe par une **forme normalisée** : minuscules, accents
 * retirés, ponctuation ramenée à des espaces, et un « s » final enlevé de
 * chaque mot. « Jetons Œuf d'Intrus » et « jeton œuf d'intrus » se ramènent
 * ainsi tous deux à `jeton uf d intru`, et le pluriel du texte retrouve le
 * singulier du glossaire. La normalisation étant la même des deux côtés, sa
 * brutalité est sans conséquence : elle ne sert qu'à comparer.
 */

import type { Component, Step, VoTerm } from './types'

/** Forme comparable d'un mot : sans accent, sans casse, sans pluriel. */
function normWord(word: string): string {
  const w = word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
  return w.length > 2 && w.endsWith('s') ? w.slice(0, -1) : w
}

/**
 * Forme comparable d'un texte, encadrée d'espaces pour que la recherche
 * d'un terme tombe toujours sur des mots entiers : « dé » ne se trouve pas
 * dans « défausse ».
 */
export function normalize(input: string): string {
  const words = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => (w.length > 2 && w.endsWith('s') ? w.slice(0, -1) : w))

  return words.length ? ` ${words.join(' ')} ` : ' '
}

/**
 * Tout ce que le joueur lit à cette étape : son texte, et le matériel
 * affiché à côté. Le titre du chapitre s'ajoute par `extra`.
 */
export function stepText(step: Step, parts: Component[] = [], extra?: string): string {
  return [
    step.title,
    ...(step.body ?? []),
    step.warn ?? '',
    step.tip ?? '',
    ...parts.flatMap((c) => [c.name, c.note ?? '']),
    extra ?? '',
  ].join(' · ')
}

/** Les termes du glossaire employés par cette étape, dans l'ordre du glossaire. */
export function voTermsIn(terms: VoTerm[], step: Step, parts: Component[] = [], extra?: string): VoTerm[] {
  const hay = normalize(stepText(step, parts, extra))
  return terms.filter((t) => hay.includes(normalize(t.fr)))
}

/* ------------------------------------------------------ repérage dans le texte */

/** Un terme retrouvé dans un texte, aux bornes de caractères d'origine. */
export interface VoSpan {
  /** Index du premier caractère du terme dans le texte. */
  start: number
  /** Index suivant le dernier caractère. */
  end: number
  term: VoTerm
}

interface Token {
  start: number
  end: number
  norm: string
}

/**
 * Découpe un texte en mots, en gardant la position de chacun : c'est ce qui
 * permet de surligner le mot **tel qu'il est écrit**, accents et majuscules
 * compris, alors que la comparaison, elle, se fait sur la forme normalisée.
 */
function tokenize(text: string): Token[] {
  const out: Token[] = []
  for (const m of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    const norm = normWord(m[0])
    if (norm) out.push({ start: m.index, end: m.index + m[0].length, norm })
  }
  return out
}

/** Les mots normalisés d'un terme, du plus long au plus court à l'usage. */
function wordsOf(term: VoTerm): string[] {
  return normalize(term.fr).trim().split(' ').filter(Boolean)
}

/**
 * Repère les termes du glossaire dans une suite de textes — le titre de
 * l'étape, ses lignes, son avertissement, son conseil.
 *
 * Deux règles rendent le surlignage lisible plutôt que bariolé :
 *
 * - **Un terme n'est marqué qu'une fois** par étape, à sa première
 *   apparition. Répéter la couleur à chaque « salle » d'une consigne ne dit
 *   rien de plus et rend le texte illisible.
 * - **Le terme le plus long gagne.** « carte Attaque d'Intrus » est marqué
 *   d'un bloc, et ni « carte Action » ni « Intrus » ne viennent le découper.
 */
export function voSpansFor(terms: VoTerm[], texts: string[]): VoSpan[][] {
  const prepared = terms
    .map((term) => ({ term, words: wordsOf(term) }))
    .filter((p) => p.words.length > 0)
    .sort((a, b) => b.words.length - a.words.length)

  const done = new Set<VoTerm>()
  const all = texts.map(tokenize)
  const spans: VoSpan[][] = texts.map(() => [])
  const used = all.map((toks) => new Array<boolean>(toks.length).fill(false))

  for (let i = 0; i < texts.length; i++) {
    const toks = all[i]
    for (let at = 0; at < toks.length; at++) {
      if (used[i][at]) continue
      for (const { term, words } of prepared) {
        if (done.has(term) || at + words.length > toks.length) continue
        let hit = true
        for (let k = 0; k < words.length; k++) {
          if (used[i][at + k] || toks[at + k].norm !== words[k]) {
            hit = false
            break
          }
        }
        if (!hit) continue
        for (let k = 0; k < words.length; k++) used[i][at + k] = true
        spans[i].push({ start: toks[at].start, end: toks[at + words.length - 1].end, term })
        done.add(term)
        break
      }
    }
  }

  return spans
}
