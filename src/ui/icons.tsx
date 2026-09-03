/**
 * Pictogrammes en SVG inline : pas de police d'icônes à charger, rendu net
 * sur l'écran Retina de l'iPad, et coloration par currentColor.
 */

import type { JSX } from 'react'
import type { Glyph, StepKind } from '../engine/types'

type P = JSX.IntrinsicElements['svg']

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const Play = (p: P) => (
  <svg {...base} {...p}><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" /></svg>
)
export const Pause = (p: P) => (
  <svg {...base} {...p}><rect x="6.5" y="5" width="4" height="14" rx="1.3" fill="currentColor" stroke="none" /><rect x="13.5" y="5" width="4" height="14" rx="1.3" fill="currentColor" stroke="none" /></svg>
)
export const Reset = (p: P) => (
  <svg {...base} {...p}><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3 4v5h5" /></svg>
)
export const ArrowLeft = (p: P) => (
  <svg {...base} {...p}><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
)
export const ArrowRight = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
)
export const Check = (p: P) => (
  <svg {...base} {...p}><path d="M4.5 12.5l5 5 10-11" /></svg>
)
export const CheckCircle = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.6" /></svg>
)
export const Circle = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /></svg>
)
export const Close = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const Alert = (p: P) => (
  <svg {...base} {...p}><path d="M12 3.5L21 19H3z" /><path d="M12 9.5v4" /><path d="M12 16.6h.01" /></svg>
)
export const Bulb = (p: P) => (
  <svg {...base} {...p}><path d="M9.2 17h5.6" /><path d="M10 20.5h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6h5.4c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" /></svg>
)
export const Grid = (p: P) => (
  <svg {...base} {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></svg>
)
export const Home = (p: P) => (
  <svg {...base} {...p}><path d="M3.5 10.5L12 4l8.5 6.5" /><path d="M6 9.6V20h12V9.6" /></svg>
)
export const Info = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.8h.01" /></svg>
)
export const Trophy = (p: P) => (
  <svg {...base} {...p}><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 5.5H4.5V7a3 3 0 0 0 3 3" /><path d="M17 5.5h2.5V7a3 3 0 0 1-3 3" /><path d="M9.5 20h5" /><path d="M12 14v6" /></svg>
)

/* -- pictogrammes de matériel ------------------------------------------ */

const Board = (p: P) => (
  <svg {...base} {...p}><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="M2.5 12h19M12 4.5v15" /></svg>
)
const Tile = (p: P) => (
  <svg {...base} {...p}><rect x="4" y="4" width="16" height="16" rx="2.4" /><path d="M9 9h6v6H9z" /></svg>
)
const Token = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /></svg>
)
const Card = (p: P) => (
  <svg {...base} {...p}><rect x="6" y="3" width="13" height="18" rx="2.2" /><path d="M3.5 6.5v12a2 2 0 0 0 2 2" /></svg>
)
const Die = (p: P) => (
  <svg {...base} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="3.2" /><circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.25" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" /></svg>
)
const Meeple = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="6" r="2.6" /><path d="M6 20v-3.5c0-3 2.7-5.4 6-5.4s6 2.4 6 5.4V20" /></svg>
)
const Marker = (p: P) => (
  <svg {...base} {...p}><path d="M12 21s6.5-6.2 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.8 12 21 12 21z" /><circle cx="12" cy="10.4" r="2.4" /></svg>
)
const Bag = (p: P) => (
  <svg {...base} {...p}><path d="M5.5 8.5h13l1.2 11a1.6 1.6 0 0 1-1.6 1.8H5.9a1.6 1.6 0 0 1-1.6-1.8z" /><path d="M9 8.5V6.8a3 3 0 0 1 6 0v1.7" /></svg>
)
const Figure = (p: P) => (
  <svg {...base} {...p}><path d="M12 3c2.4 0 3.6 1.7 3.6 3.6 0 1.6-.8 2.4-.8 3.6 0 1.6 3.7 2.4 3.7 6.3V21H5.5v-4.5c0-3.9 3.7-4.7 3.7-6.3 0-1.2-.8-2-.8-3.6C8.4 4.7 9.6 3 12 3z" /></svg>
)
const Egg = (p: P) => (
  <svg {...base} {...p}><path d="M12 3c3.3 0 6 4.6 6 8.7 0 4.7-2.7 7.3-6 7.3s-6-2.6-6-7.3C6 7.6 8.7 3 12 3z" /></svg>
)
const Door = (p: P) => (
  <svg {...base} {...p}><rect x="6" y="3.5" width="12" height="17" rx="1.6" /><circle cx="14.6" cy="12" r="1" fill="currentColor" stroke="none" /></svg>
)
const Fire = (p: P) => (
  <svg {...base} {...p}><path d="M12 21c3.6 0 6-2.4 6-5.6 0-4-3.6-5.4-3.6-9.4-2 .8-3 2.6-3 4.4-1-.6-1.6-1.7-1.6-3C7.6 9 6 11.6 6 15.4 6 18.6 8.4 21 12 21z" /></svg>
)

const GLYPHS: Record<Glyph, (p: P) => JSX.Element> = {
  board: Board, tile: Tile, token: Token, card: Card, die: Die, meeple: Meeple,
  marker: Marker, bag: Bag, figure: Figure, egg: Egg, door: Door, fire: Fire,
}

export function GlyphIcon({ glyph, ...rest }: { glyph: Glyph } & P) {
  const C = GLYPHS[glyph] ?? Token
  return <C {...rest} />
}

/* -- nature d'étape ----------------------------------------------------- */

export const STEP_KIND: Record<StepKind, { label: string; tint: string; Icon: (p: P) => JSX.Element }> = {
  info: { label: 'Comprendre', tint: '#818cf8', Icon: Info },
  place: { label: 'Poser', tint: '#38bdf8', Icon: Board },
  take: { label: 'Prendre', tint: '#34d399', Icon: Card },
  shuffle: { label: 'Mélanger', tint: '#f472b6', Icon: Bag },
  action: { label: 'Jouer', tint: '#fbbf24', Icon: Play },
  check: { label: 'Vérifier', tint: '#22d3ee', Icon: CheckCircle },
}

export const Crop = (p: P) => (
  <svg {...base} {...p}><path d="M6.5 2.5v15h15" /><path d="M2.5 6.5h15v15" /></svg>
)

export const List = (p: P) => (
  <svg {...base} {...p}><path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" /><circle cx="4.2" cy="6.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.2" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.2" cy="17.5" r="1.1" fill="currentColor" stroke="none" /></svg>
)
export const Users = (p: P) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 5.6a3.2 3.2 0 0 1 0 6" /><path d="M17.5 14.9c1.9.5 3.2 2.2 3.2 4.6" /></svg>
)
