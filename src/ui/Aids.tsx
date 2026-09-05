/**
 * Aides de jeu : la partie « référence » de l'application.
 *
 * Le tutoriel se lit une fois. Les aides se consultent en partie, vingt
 * fois, dans le désordre : l'action d'une salle, l'effet d'un marqueur, le
 * résumé d'une manche. C'est ce qui doit permettre de jouer **sans rouvrir
 * le livret**.
 *
 * Deux écrans : la liste des fiches, puis une fiche. La fiche s'ouvre
 * par-dessus la liste — on la referme, la liste est toujours là.
 *
 * Une entrée signalée `ext` ne vient pas du livret. Elle porte le globe et
 * sa couleur propre, partout et sans exception : le lecteur doit pouvoir
 * dire d'un coup d'œil ce qui est une règle et ce qui est un conseil.
 */

import type { CSSProperties } from 'react'
import type { Aid, AidEntry, AidIcon, Tutorial } from '../engine/types'
import { bookOf } from '../engine/types'
import { Sheet } from './Sheet'
import { Thumb } from './Visual'
import { Alert, Aids as AidsIcon, ArrowRight, Grid, List, Outside, Target } from './icons'

/** Pictogramme d'une fiche. Défaut : le jeu de fiches. */
const AID_ICON: Record<AidIcon, typeof AidsIcon> = {
  rooms: Grid,
  items: AidsIcon,
  summary: List,
  moments: Alert,
  markers: Grid,
  goal: Target,
  combat: Alert,
}

/** Le bandeau qui signale une information venue d'ailleurs que du livret. */
export function OutsideMark({ source }: { source?: string }) {
  return (
    <span className="ext-mark" title={source ? `Hors livret — ${source}` : 'Hors livret'}>
      <Outside aria-hidden />
      Hors livret
    </span>
  )
}

function Entry({ tutorial, entry }: { tutorial: Tutorial; entry: AidEntry }) {
  return (
    <div
      className={`aid-entry${entry.ext ? ' ext' : ''}`}
      style={entry.tint ? ({ '--part-tint': entry.tint } as CSSProperties) : undefined}
      id={`aid-${entry.id}`}
    >
      {entry.crop && (
        <span className="aid-thumb">
          <Thumb book={bookOf(tutorial, entry.crop)} crop={entry.crop} glyph="token" name={entry.term} />
        </span>
      )}
      <div className="aid-entry-txt">
        <div className="aid-entry-head">
          <span className="aid-term">{entry.term}</span>
          {entry.cost && <span className="aid-cost">{entry.cost}</span>}
          {entry.tag && <span className="aid-tag">{entry.tag}</span>}
          {entry.ext && <OutsideMark />}
        </div>
        <ul className="aid-body">
          {entry.body.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
        {entry.warn && <p className="aid-warn"><Alert aria-hidden /> <span>{entry.warn}</span></p>}
        {entry.note && <p className="aid-note">{entry.note}</p>}
        {entry.ref && <p className="aid-ref">{entry.ref}</p>}
      </div>
    </div>
  )
}

/** Une fiche ouverte. */
export function AidSheet({
  tutorial, aid, style, onClose, focus,
}: {
  tutorial: Tutorial
  aid: Aid
  style?: CSSProperties
  onClose: () => void
  /** Identifiant d'entrée à mettre en avant, quand on arrive par l'index. */
  focus?: string
}) {
  return (
    <Sheet title={aid.title} onClose={onClose} style={style}>
      {aid.lead && <p className="sheet-lead">{aid.lead}</p>}
      {aid.groups.map((g, i) => (
        <div key={g.title ?? i}>
          {g.title && <div className="section-label">{g.title}</div>}
          {g.lead && <p className="sheet-lead">{g.lead}</p>}
          <div className="aid-entries">
            {g.entries.map((e) => (
              <div key={e.id} className={focus === e.id ? 'aid-focus' : undefined}>
                <Entry tutorial={tutorial} entry={e} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  )
}

/** La liste des fiches disponibles pour ce jeu. */
export function AidsSheet({
  tutorial, style, onClose, onPick,
}: {
  tutorial: Tutorial
  style?: CSSProperties
  onClose: () => void
  onPick: (aid: Aid) => void
}) {
  const aids = tutorial.aids ?? []
  return (
    <Sheet title={`Aides de jeu — ${tutorial.title}`} onClose={onClose} style={style}>
      <p className="sheet-lead">
        De quoi jouer sans rouvrir le livret. Chaque fiche répond à une question
        qu'on se pose en cours de partie.
      </p>
      <div className="aid-list">
        {aids.map((a) => {
          const Icon = AID_ICON[a.icon ?? 'items']
          const count = a.groups.reduce((n, g) => n + g.entries.length, 0)
          return (
            <button key={a.id} type="button" className="aid-card" onClick={() => onPick(a)}>
              <span className="aid-card-icon"><Icon aria-hidden /></span>
              <span className="aid-card-txt">
                <span className="aid-card-title">{a.title}</span>
                {a.lead && <span className="aid-card-lead">{a.lead}</span>}
                <span className="aid-card-count">{count} entrées</span>
              </span>
              <ArrowRight aria-hidden className="aid-card-go" />
            </button>
          )
        })}
      </div>
      {aids.length === 0 && (
        <p className="empty">Ce tutoriel n'a pas encore ses aides de jeu.</p>
      )}
    </Sheet>
  )
}
