/**
 * Index alphabétique : toutes les réponses du jeu, par ordre de mot.
 *
 * Le joueur ne cherche pas un chapitre, il cherche un mot — « dépressurisation »,
 * « point de non-retour », « objet lourd ». L'index le prend au mot : on tape
 * deux lettres, ou on saute à la lettre, et on tombe sur la réponse.
 *
 * Rien n'est écrit deux fois. Les lignes sont **récoltées** dans les aides
 * de jeu, le matériel et les entrées écrites à la main du tutoriel — voir
 * `indexEntriesOf`. Taper sur une ligne ouvre la fiche d'où elle vient.
 */

import { useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Tutorial } from '../engine/types'
import { type IndexRow, indexEntriesOf, lettersOf, searchIndex } from '../engine/tutorial'
import { Sheet } from './Sheet'
import { Close, Outside, Search } from './icons'

export function IndexSheet({
  tutorial, style, onClose, onGo,
}: {
  tutorial: Tutorial
  style?: CSSProperties
  onClose: () => void
  /** Ouvre la fiche d'où vient la ligne. Sans cible, la ligne se lit sur place. */
  onGo: (row: IndexRow) => void
}) {
  const [query, setQuery] = useState('')
  const all = useMemo(() => indexEntriesOf(tutorial), [tutorial])
  const rows = useMemo(() => searchIndex(all, query), [all, query])
  const letters = useMemo(() => lettersOf(all), [all])
  const shown = useMemo(() => new Set(rows.map((r) => r.letter)), [rows])
  const scroller = useRef<HTMLDivElement | null>(null)

  // On saute à une lettre en visant son titre : pas de calcul de hauteur,
  // donc rien à corriger quand la taille du texte change.
  const jumpTo = (letter: string) => {
    const el = scroller.current?.querySelector(`[data-letter="${letter}"]`)
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  let last = ''

  return (
    <Sheet title={`Index — ${tutorial.title}`} onClose={onClose} style={style}>
      <div className="index-search">
        <Search aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un mot — salle, marqueur, action…"
          aria-label="Chercher dans l'index"
        />
        {query && (
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setQuery('')} aria-label="Effacer">
            <Close aria-hidden />
          </button>
        )}
      </div>

      <div className="index-alpha" role="group" aria-label="Aller à une lettre">
        {letters.map((l) => (
          <button
            key={l}
            type="button"
            className="index-letter-btn"
            disabled={!shown.has(l)}
            onClick={() => jumpTo(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="index-rows" ref={scroller}>
        {rows.map((r) => {
          const head = r.letter !== last ? r.letter : null
          last = r.letter
          return (
            <div key={`${r.letter}-${r.term}`}>
              {head && <div className="index-letter" data-letter={head}>{head}</div>}
              <button
                type="button"
                className={`index-row${r.ext ? ' ext' : ''}${r.target.kind === 'text' ? ' flat' : ''}`}
                onClick={() => onGo(r)}
              >
                <span className="index-term">
                  {r.term}
                  {r.ext && <Outside aria-hidden className="index-ext" />}
                </span>
                {r.body.length > 0 && <span className="index-body">{r.body[0]}</span>}
                {r.from && <span className="index-from">{r.from}</span>}
              </button>
            </div>
          )
        })}
        {rows.length === 0 && <p className="empty">Aucune entrée pour « {query} ».</p>}
      </div>
    </Sheet>
  )
}

/** Une ligne d'index lue sur place, quand elle ne renvoie vers aucune fiche. */
export function IndexRowSheet({
  row, style, onClose,
}: {
  row: IndexRow
  style?: CSSProperties
  onClose: () => void
}) {
  return (
    <Sheet title={row.term} onClose={onClose} style={style}>
      <div className={`aid-entry${row.ext ? ' ext' : ''}`}>
        <div className="aid-entry-txt">
          {row.ext && (
            <div className="aid-entry-head">
              <span className="ext-mark"><Outside aria-hidden /> Hors livret</span>
            </div>
          )}
          <ul className="aid-body">
            {row.body.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
          {row.ref && <p className="aid-ref">{row.ref}</p>}
        </div>
      </div>
    </Sheet>
  )
}
