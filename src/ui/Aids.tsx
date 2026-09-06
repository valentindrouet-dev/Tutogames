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
 *
 * Les termes du glossaire VO sont repérés ici comme dans une étape, et la
 * bascule est dans l'en-tête du panneau : c'est en consultant l'index des
 * salles, la boîte ouverte, qu'on a le plus besoin du mot imprimé.
 */

import { useMemo, type CSSProperties } from 'react'
import type { Aid, AidEntry, AidIcon, Tutorial } from '../engine/types'
import { bookOf } from '../engine/types'
import { voSpansFor } from '../engine/vo'
import { Sheet } from './Sheet'
import { Thumb } from './Visual'
import { VoButton, VoText, type Way } from './Vo'
import { Alert, Aids as AidsIcon, ArrowRight, Grid, List, Outside, Target } from './icons'

/**
 * De quoi lire et basculer les termes VO dans un panneau. `way` décide de la
 * langue affichée ; `onWay` est absent quand le jeu n'a pas de glossaire, ou
 * quand le lecteur a masqué les termes dans les réglages.
 */
export interface VoProps {
  tutorial: Tutorial
  way: Way
  onWay?: (way: Way) => void
  /** false quand les termes sont masqués : ni surlignage ni bulle. */
  marks: boolean
}

/** La bascule de l'en-tête, ou rien si ce jeu n'a pas de glossaire. */
export function voAction({ tutorial, way, onWay }: VoProps) {
  if (!tutorial.vo || !onWay) return undefined
  return <VoButton language={tutorial.vo.language} way={way} onWay={onWay} compact />
}

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

function Entry({ tutorial, entry, vo }: { tutorial: Tutorial; entry: AidEntry; vo: VoProps }) {
  // Le terme, ses lignes, son piège et sa note : un même repérage, donc un
  // terme n'est marqué qu'une fois par entrée, à sa première apparition.
  const marks = useMemo(() => {
    if (!tutorial.vo || !vo.marks) return null
    const texts = [entry.term, ...entry.body, entry.warn ?? '', entry.note ?? '']
    const spans = voSpansFor(tutorial.vo.terms, texts)
    return {
      term: spans[0],
      body: spans.slice(1, 1 + entry.body.length),
      warn: spans[1 + entry.body.length],
      note: spans[2 + entry.body.length],
    }
  }, [tutorial.vo, vo.marks, entry])

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
          <span className="aid-term"><VoText text={entry.term} spans={marks?.term} way={vo.way} /></span>
          {entry.cost && <span className="aid-cost">{entry.cost}</span>}
          {entry.tag && <span className="aid-tag">{entry.tag}</span>}
          {entry.ext && <OutsideMark />}
        </div>
        <ul className="aid-body">
          {entry.body.map((line, i) => (
            <li key={i}><VoText text={line} spans={marks?.body[i]} way={vo.way} /></li>
          ))}
        </ul>
        {entry.warn && (
          <p className="aid-warn">
            <Alert aria-hidden /> <span><VoText text={entry.warn} spans={marks?.warn} way={vo.way} /></span>
          </p>
        )}
        {entry.note && (
          <p className="aid-note"><VoText text={entry.note} spans={marks?.note} way={vo.way} /></p>
        )}
        {entry.ref && <p className="aid-ref">{entry.ref}</p>}
      </div>
    </div>
  )
}

/** Une fiche ouverte. */
export function AidSheet({
  tutorial, aid, style, onClose, focus, vo, behind,
}: {
  tutorial: Tutorial
  aid: Aid
  style?: CSSProperties
  onClose: () => void
  /** Identifiant d'entrée à mettre en avant, quand on arrive par l'index. */
  focus?: string
  vo: VoProps
  behind?: boolean
}) {
  return (
    <Sheet title={aid.title} onClose={onClose} style={style} behind={behind} action={voAction(vo)}>
      {aid.lead && <p className="sheet-lead">{aid.lead}</p>}
      {aid.groups.map((g, i) => (
        <div key={g.title ?? i}>
          {g.title && <div className="section-label">{g.title}</div>}
          {g.lead && <p className="sheet-lead">{g.lead}</p>}
          <div className="aid-entries">
            {g.entries.map((e) => (
              <div key={e.id} className={focus === e.id ? 'aid-focus' : undefined}>
                <Entry tutorial={tutorial} entry={e} vo={vo} />
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
  tutorial, style, onClose, onPick, behind,
}: {
  tutorial: Tutorial
  style?: CSSProperties
  onClose: () => void
  onPick: (aid: Aid) => void
  behind?: boolean
}) {
  const aids = tutorial.aids ?? []
  return (
    <Sheet title={`Aides de jeu — ${tutorial.title}`} onClose={onClose} style={style} behind={behind}>
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
