/**
 * Éléments interactifs d'une étape.
 *
 * Ils servent à faire *pratiquer* une règle plutôt qu'à la décrire : le
 * joueur lance le dé de bruit, choisit entre tirer et fuir, suit son nombre
 * de cartes en main. Chaque widget affiche la conséquence immédiate du
 * résultat, ce qui est justement ce qu'un débutant n'arrive pas à déduire
 * seul en lisant les règles.
 */

import { useState, type CSSProperties } from 'react'
import type { Choice, Counter, DieFace, Roller, Widget } from '../engine/types'
import { Reset } from './icons'

/* ------------------------------------------------------------- dé simulé */

/** Tirage pondéré : permet de reproduire un dé à faces inégales (bruit d10). */
function rollWeighted(faces: DieFace[]): number {
  const total = faces.reduce((n, f) => n + (f.weight ?? 1), 0)
  let pick = Math.random() * total
  for (let i = 0; i < faces.length; i++) {
    pick -= faces[i].weight ?? 1
    if (pick <= 0) return i
  }
  return faces.length - 1
}

function RollerWidget({ w }: { w: Roller }) {
  const [face, setFace] = useState<number | null>(null)
  const [rolled, setRolled] = useState(0)

  function roll() {
    // Le premier jet peut être scénarisé pour que la démonstration tombe
    // toujours sur le cas que l'étape explique. Les suivants sont libres.
    const next = rolled === 0 && w.scripted != null ? w.scripted : rollWeighted(w.faces)
    setFace(next)
    setRolled((n) => n + 1)
  }

  const f = face != null ? w.faces[face] : null

  return (
    <div className="widget">
      <div className="widget-title">{w.title}</div>

      {f ? (
        <div className="roll-face" key={rolled} style={{ '--face-tint': f.tint ?? 'var(--accent)' } as CSSProperties}>
          <span className="roll-face-badge">{f.label}</span>
          <span className="roll-face-effect">{f.effect}</span>
        </div>
      ) : (
        <div className="roll-empty">{w.faces.length} résultats possibles</div>
      )}

      <button type="button" className="btn btn-primary btn-block" onClick={roll}>
        {face == null ? (w.cta ?? 'Lancer le dé') : <><Reset aria-hidden /> Relancer</>}
      </button>
    </div>
  )
}

/* ---------------------------------------------------------------- choix */

function ChoiceWidget({ w }: { w: Choice }) {
  const [picked, setPicked] = useState<number | null>(null)

  return (
    <div className="widget">
      <div className="widget-title">{w.title}</div>

      <div className="choice-grid">
        {w.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            className={`choice-btn${picked === i ? ' picked' : ''}`}
            style={{ '--opt-tint': o.tint ?? 'var(--accent)' } as CSSProperties}
            onClick={() => setPicked(i)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {picked != null && <div className="choice-outcome">{w.options[picked].outcome}</div>}
    </div>
  )
}

/* -------------------------------------------------------------- compteur */

function CounterWidget({ w }: { w: Counter }) {
  const [n, setN] = useState(w.start)
  const clamp = (v: number) => Math.min(Math.max(v, w.min), w.max)

  return (
    <div className="widget">
      <div className="widget-title">{w.title}</div>
      <div className="counter">
        <button
          type="button"
          className="counter-btn"
          onClick={() => setN((v) => clamp(v - 1))}
          disabled={n <= w.min}
          aria-label="Retirer un"
        >
          −
        </button>
        <div>
          <div className="counter-val">{n}</div>
          {w.unit && <div className="counter-unit">{w.unit}</div>}
        </div>
        <button
          type="button"
          className="counter-btn"
          onClick={() => setN((v) => clamp(v + 1))}
          disabled={n >= w.max}
          aria-label="Ajouter un"
        >
          +
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ mux */

export function WidgetView({ widget, resetKey }: { widget: Widget; resetKey: string }) {
  // `key` remonte l'état à chaque changement d'étape : on ne veut pas voir
  // le résultat du jet précédent en arrivant sur une nouvelle étape.
  switch (widget.kind) {
    case 'roller':
      return <RollerWidget key={resetKey} w={widget} />
    case 'choice':
      return <ChoiceWidget key={resetKey} w={widget} />
    case 'counter':
      return <CounterWidget key={resetKey} w={widget} />
  }
}
