/**
 * Chronomètre de la partie tutorielle.
 *
 * Il compte le temps réel passe autour de la table, pas le temps d'écran :
 * il survit donc à un rechargement, à une mise en veille de l'iPad et à une
 * reprise le lendemain, puisque seul un horodatage de départ est mémorisé.
 */

import { useEffect, useState } from 'react'
import { formatClock } from '../engine/progress'
import { Pause, Play } from './icons'

interface Props {
  /** Millisecondes accumulées hors périodes de pause. */
  elapsedMs: number
  /** Horodatage du dernier démarrage, ou null si en pause. */
  runningSince: number | null
  onToggle: () => void
}

export function Timer({ elapsedMs, runningSince, onToggle }: Props) {
  const [, tick] = useState(0)

  useEffect(() => {
    if (!runningSince) return
    // Un rafraîchissement par seconde suffit : l'affichage est à la seconde.
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [runningSince])

  const total = elapsedMs + (runningSince ? Date.now() - runningSince : 0)
  const running = Boolean(runningSince)

  return (
    <div className={`timer${running ? '' : ' paused'}`}>
      <span className="timer-value">{formatClock(total)}</span>
      <button
        type="button"
        className={`timer-btn${running ? ' run' : ''}`}
        onClick={onToggle}
        aria-label={running ? 'Mettre le chronomètre en pause' : 'Démarrer le chronomètre'}
      >
        {running ? <Pause aria-hidden /> : <Play aria-hidden />}
      </button>
    </div>
  )
}
