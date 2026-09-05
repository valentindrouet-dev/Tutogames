/**
 * Réglages de l'application.
 *
 * Quatre réglages, pas plus : la taille du texte, la clarté du fond, le
 * surlignage des termes en anglais, l'ordre des jeux. Chacun se montre
 * lui-même — les tailles sont écrites à leur taille, les clartés sont des
 * pastilles de la couleur qu'elles produisent, l'ordre est écrit dans
 * l'ordre qu'il produit. Rien à lire pour comprendre ce qu'un bouton fait.
 */

import type { Prefs } from '../engine/prefs'
import { DEFAULT_PREFS, LIFTS, SORTS, TEXT_SCALES, VO_MODES, shade } from '../engine/prefs'
import type { Theme } from '../engine/types'
import { Sheet } from './Sheet'
import { Contrast, FlagEn, SortIcon, TextSize } from './icons'
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
      title="Réglages"
      onClose={onClose}
      style={themePanel(theme, prefs)}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onChange(DEFAULT_PREFS)}
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
      <div>
        <div className="section-label"><FlagEn aria-hidden /> Termes en anglais</div>
        <div className="pref-row">
          {VO_MODES.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`pref-btn${o.value === prefs.voMode ? ' picked' : ''}`}
              onClick={() => onChange({ ...prefs, voMode: o.value })}
              title={o.hint}
            >
              {/* L'étiquette montre ce que le réglage produit dans le texte. */}
              <span className="pref-glyph">
                {o.value === 'off' ? (
                  'Intrus'
                ) : (
                  <span className="vo-mark" data-vo={o.value === 'vo' ? '' : undefined}>
                    {o.value === 'vo' ? 'Intruder' : 'Intrus'}
                  </span>
                )}
              </span>
              <span className="pref-btn-label">{o.label}</span>
            </button>
          ))}
        </div>
        <p className="sheet-lead">
          Nemesis, Frosthaven et Oathsworn ont leur matériel en anglais. « Sur la boîte »
          écrit les mots concernés comme votre matériel les imprime, accordés à la phrase ;
          la bulle rappelle alors le français. Le bouton VO du bandeau fait la bascule.
        </p>
      </div>

      <div>
        <div className="section-label"><SortIcon aria-hidden /> Ordre des jeux</div>
        <div className="pref-row">
          {SORTS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`pref-btn${o.value === prefs.sort ? ' picked' : ''}`}
              onClick={() => onChange({ ...prefs, sort: o.value })}
            >
              {/* L'étiquette montre l'ordre qu'elle produit. */}
              <span className="pref-glyph">{o.glyph}</span>
              <span className="pref-btn-label">{o.label}</span>
            </button>
          ))}
        </div>
      </div>

    </Sheet>
  )
}
