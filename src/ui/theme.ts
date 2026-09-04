/**
 * Traduction d'un thème de jeu en variables CSS.
 *
 * La feuille de style ne connaît que des variables ; chaque jeu fournit ses
 * valeurs. La mise en page, elle, ne change jamais : un joueur qui a suivi un
 * tutoriel sait déjà lire les autres.
 */

import type { CSSProperties } from 'react'
import { DEFAULT_PREFS, shade, type Prefs } from '../engine/prefs'
import type { Theme } from '../engine/types'

/**
 * Applique les réglages de confort à l'habillage d'un jeu.
 *
 * La clarté ne touche que les fonds : 10 % de chemin vers le blanc ou le noir
 * par cran, soit 20 % aux extrêmes — assez pour se voir sur un écran de
 * salon. Le texte, lui, bouge de moitié dans le sens inverse, ce qui conserve
 * le contraste que l'auteur du thème avait réglé.
 */
function withPrefs(t: Theme, p: Prefs): Theme {
  if (!p.lift) return t
  const bg = p.lift * 0.1
  const fg = -p.lift * 0.05
  return {
    ...t,
    bg: shade(t.bg, bg),
    bg2: shade(t.bg2, bg),
    bg3: shade(t.bg3, bg),
    stroke: shade(t.stroke, bg),
    strokeSoft: shade(t.strokeSoft, bg),
    fg: shade(t.fg, fg),
    fgDim: shade(t.fgDim, fg),
    fgFaint: shade(t.fgFaint, fg),
  }
}

/** Les variables seules. Ne peint rien : c'est la feuille de style qui décide. */
function vars(raw: Theme, prefs: Prefs): CSSProperties {
  const t = withPrefs(raw, prefs)
  const light = t.scheme === 'light'
  return {
    '--text-scale': String(prefs.textScale),
    '--bg': t.bg,
    '--bg-2': t.bg2,
    '--bg-3': t.bg3,
    '--stroke': t.stroke,
    '--stroke-soft': t.strokeSoft,
    '--fg': t.fg,
    '--fg-dim': t.fgDim,
    '--fg-faint': t.fgFaint,
    '--accent': t.accent,
    '--accent-2': t.accent2,
    '--accent-ink': t.accentInk,
    '--font': t.bodyFont ?? 'var(--font-default)',
    '--font-title': t.titleFont ?? t.bodyFont ?? 'var(--font-default)',
    '--title-transform': t.titleTransform ?? 'none',
    '--title-weight': String(t.titleWeight ?? 780),
    '--title-spacing': t.titleSpacing ?? '-0.025em',
    '--r-lg': t.radius ?? '24px',
    // Voile neutre des pastilles et des fonds discrets : de l'encre sur un
    // thème clair, de la lumière sur un thème sombre.
    '--veil': light ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.09)',
    // Les teintes d'étape sont réglées pour un fond sombre : sur du clair,
    // on les assombrit d'un tiers pour qu'elles restent lisibles.
    '--tint-pct': light ? '62%' : '100%',
    ...(t.ok ? { '--ok': t.ok } : null),
    ...(t.warn ? { '--warn': t.warn } : null),
    ...(t.danger ? { '--danger': t.danger } : null),
    colorScheme: light ? 'light' : 'dark',
  } as CSSProperties
}

/**
 * Habillage d'un écran : les variables, plus le fond et le texte.
 * `color` et `font-family` sont posés en clair parce qu'ils s'héritent en
 * valeur calculée : redéfinir `--fg` plus bas dans l'arbre ne suffirait pas.
 */
export function themeStyle(t: Theme, prefs: Prefs = DEFAULT_PREFS): CSSProperties {
  const v = vars(t, prefs)
  return {
    ...v,
    // Le fond du thème doit peindre toute la page, pas seulement le cadre.
    background: v['--bg' as keyof CSSProperties] as string,
    color: v['--fg' as keyof CSSProperties] as string,
    fontFamily: t.bodyFont ?? undefined,
  }
}

/** Idem, pour un élément qui a déjà son propre fond (panneau modal). */
export function themePanel(t: Theme, prefs: Prefs = DEFAULT_PREFS): CSSProperties {
  const v = vars(t, prefs)
  return {
    ...v,
    color: v['--fg' as keyof CSSProperties] as string,
    fontFamily: t.bodyFont ?? undefined,
  }
}

/** Fond réellement peint, réglages compris — pour habiller la page entière. */
export function themeBackground(t: Theme, prefs: Prefs = DEFAULT_PREFS): string {
  return withPrefs(t, prefs).bg
}
