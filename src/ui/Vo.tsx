/**
 * Glossaire de la version originale.
 *
 * Le même bloc sert à deux endroits : la fiche d'un jeu sur l'accueil, qui
 * montre le glossaire entier, et le bouton VO du bandeau, qui montre d'abord
 * les termes de l'étape affichée.
 */

import type { VoTerm } from '../engine/types'

/**
 * Deux colonnes : le mot du tutoriel, et ce que le joueur lit sur sa boîte.
 * La colonne originale est mise en avant — c'est elle qu'on est venu
 * chercher.
 */
export function VoList({ terms }: { terms: VoTerm[] }) {
  return (
    <dl className="vo-list">
      {terms.map((t) => (
        <div className="vo-row" key={`${t.fr}-${t.en}`}>
          <dt className="vo-fr">{t.fr}</dt>
          <dd className="vo-en">
            {t.en}
            {t.note && <span className="vo-note">{t.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
