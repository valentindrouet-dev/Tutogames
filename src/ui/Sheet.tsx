/**
 * Panneau modal générique (fiche matériel, aide de jeu, index, réglages).
 *
 * Les panneaux **s'empilent** : ouvrir la fiche d'une salle depuis l'index
 * des salles ne referme pas l'index, elle se pose dessus. Seul le panneau
 * du dessus écoute Échap et le tap sur le fond ; ceux du dessous restent
 * montés, donc ils gardent leur position de défilement et réapparaissent
 * exactement comme on les avait laissés.
 */

import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Close } from './icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Habillage du jeu : le panneau entier doit porter les couleurs du jeu. */
  style?: CSSProperties
  /**
   * Un autre panneau est ouvert par-dessus celui-ci. Il reste visible et
   * monté, mais ne se ferme plus ni au clavier ni au tap : c'est le panneau
   * du dessus qui répond.
   */
  behind?: boolean
  /**
   * Bouton propre au panneau, posé dans son en-tête à gauche de la
   * fermeture. C'est là que va la bascule VO : un panneau ouvert cache le
   * bandeau, et on doit pouvoir changer la langue des termes sans le
   * refermer.
   */
  action?: ReactNode
}

export function Sheet({ title, onClose, children, footer, style, behind = false, action }: Props) {
  useEffect(() => {
    if (behind) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, behind])

  return (
    <div
      className={`sheet-backdrop${behind ? ' behind' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-hidden={behind || undefined}
      // Fermeture au tap hors panneau, mais pas sur un tap qui a commencé
      // à l'intérieur et s'est terminé sur le fond (glissement de scroll).
      onPointerDown={(e) => {
        if (!behind && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet" style={style} inert={behind}>
        <div className="sheet-head">
          <h2>{title}</h2>
          {action}
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
