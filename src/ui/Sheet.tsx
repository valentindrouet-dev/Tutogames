/** Panneau modal générique (fiche matériel, index, réglages). */

import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Close } from './icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Habillage du jeu : le panneau entier doit porter les couleurs du jeu. */
  style?: CSSProperties
}

export function Sheet({ title, onClose, children, footer, style }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      // Fermeture au tap hors panneau, mais pas sur un tap qui a commencé
      // à l'intérieur et s'est terminé sur le fond (glissement de scroll).
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet" style={style}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer">
            <Close aria-hidden />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}
