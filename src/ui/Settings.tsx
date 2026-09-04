/**
 * Réglages de confort de lecture.
 *
 * Deux réglages, pas plus : la taille du texte et la clarté du fond. Chacun
 * se montre lui-même — les tailles sont écrites à leur taille, les clartés
 * sont des pastilles de la couleur qu'elles produisent. Rien à lire pour
 * comprendre ce qu'un bouton va faire.
 */

import type { Prefs } from '../engine/prefs'
import { LIFTS, TEXT_SCALES, shade } from '../engine/prefs'
import type { Theme } from '../engine/types'
import { Sheet } from './Sheet'
import { Contrast, TextSize } from './icons'
import { themePanel } from './theme'

interface Props {
  prefs: Prefs
  onChange: (p: Prefs) => void
  onClose: () => void
  /** Habillage sur lequel prévisualiser la clarté. */
  theme: Theme
}

export function Settings({ prefs, onChange, onClose, theme }: Props) {
  return (
    <Sheet
      title="Confort de lecture"
      onClose={onClose}
      style={themePanel(theme, prefs)}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onChange({ textScale: 1, lift: 0 })}
          >
            Réinitialiser
          </button>
          <button type="button" className="btn btn-lg btn-primary" style={{ flex: 1 }} onClick={onClose}>
            Terminé
          </button>
        </>
      }
    >
      <div>
        <div className="section-label"><TextSize aria-hidden /> Taille du texte</div>
        <div className="pref-row">
          {TEXT_SCALES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`pref-btn${s.value === prefs.textScale ? ' picked' : ''}`}
              onClick={() => onChange({ ...prefs, textScale: s.value })}
            >
              {/* L'étiquette est écrite à la taille qu'elle règle. */}
              <span style={{ fontSize: `${Math.round(15 * s.value)}px` }}>Aa</span>
              <span className="pref-btn-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="section-label"><Contrast aria-hidden /> Clarté du fond</div>
        <div className="pref-row">
          {LIFTS.map((l) => (
            <button
              key={l}
              type="button"
              className={`pref-btn${l === prefs.lift ? ' picked' : ''}`}
              onClick={() => onChange({ ...prefs, lift: l })}
              aria-label={l === 0 ? 'Clarté d’origine' : l < 0 ? `Plus sombre ${-l}` : `Plus clair ${l}`}
            >
              <span className="pref-swatch" style={{ background: shade(theme.bg, l * 0.1) }} />
              <span className="pref-btn-label">{l === 0 ? 'Origine' : l < 0 ? '−'.repeat(-l) : '+'.repeat(l)}</span>
            </button>
          ))}
        </div>
        <p className="sheet-lead">
          S'applique par-dessus les couleurs du jeu, sans changer leur contraste.
        </p>
      </div>
    </Sheet>
  )
}
