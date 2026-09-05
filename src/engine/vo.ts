/**
 * Termes de la version originale : trouver ceux qui concernent l'étape
 * affichée.
 *
 * Le glossaire d'un jeu compte plusieurs dizaines d'entrées ; en montrer la
 * liste entière à chaque étape reviendrait à ne rien montrer. Le bouton VO
 * affiche donc d'abord les termes que l'étape emploie réellement, retrouvés
 * dans son texte, et le glossaire complet en dessous.
 *
 * La comparaison passe par une **forme normalisée** : minuscules, accents
 * retirés, ponctuation ramenée à des espaces, et un « s » final enlevé de
 * chaque mot. « Jetons Œuf d'Intrus » et « jeton œuf d'intrus » se ramènent
 * ainsi tous deux à `jeton uf d intru`, et le pluriel du texte retrouve le
 * singulier du glossaire. La normalisation étant la même des deux côtés, sa
 * brutalité est sans conséquence : elle ne sert qu'à comparer.
 */

import type { Component, Step, VoTerm } from './types'

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
