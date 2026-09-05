/**
 * Réglages de confort de lecture.
 *
 * L'application est posée sur une table, lue à 50 cm et souvent de biais,
 * parfois sous une lampe, parfois presque dans le noir. Deux réglages
 * suffisent à couvrir ces situations : la taille du texte, et la clarté du
 * fond. Ils s'appliquent par-dessus l'habillage du jeu, sans le remplacer.
 *
 * Stockés sur la tablette, comme la progression : rien ne part ailleurs.
 */

const KEY = 'tutogames.prefs.v1'

/** Ordre d'affichage des jeux sur l'accueil. */
export type SortOrder = 'catalogue' | 'alpha'

export interface Prefs {
  /** Multiplicateur de la taille du texte. */
  textScale: number
  /** `catalogue` suit l'ordre d'installation, `alpha` trie par titre. */
  sort: SortOrder
  /**
   * Décalage de clarté du fond, de -2 (plus sombre) à +2 (plus clair).
   * Zéro laisse les couleurs du jeu telles que son auteur les a réglées.
   */
  lift: number
  /**
   * Surligner, dans les consignes, les termes dont le matériel du joueur
   * porte un autre nom. Sans effet sur un jeu sans glossaire.
   */
  voMarks: boolean
}

export const TEXT_SCALES = [
  { value: 1, label: 'Normal' },
  { value: 1.15, label: 'Grand' },
  { value: 1.3, label: 'Très grand' },
  { value: 1.5, label: 'Énorme' },
]

export const LIFTS = [-2, -1, 0, 1, 2]

export const VO_MARKS: { value: boolean; label: string }[] = [
  { value: true, label: 'Surlignés' },
  { value: false, label: 'Masqués' },
]

export const SORTS: { value: SortOrder; glyph: string; label: string }[] = [
  { value: 'catalogue', glyph: '1 · 2 · 3', label: 'Catalogue' },
  { value: 'alpha', glyph: 'A → Z', label: 'Alphabétique' },
]

export const DEFAULT_PREFS: Prefs = { textScale: 1, lift: 0, sort: 'catalogue', voMarks: true }

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<Prefs>
    return {
      textScale: clamp(Number(p.textScale) || 1, 1, 1.5),
      lift: clamp(Math.round(Number(p.lift) || 0), -2, 2),
      sort: p.sort === 'alpha' ? 'alpha' : 'catalogue',
      // Absent des réglages enregistrés avant la v0.16 : actif par défaut.
      voMarks: p.voMarks !== false,
    }
  } catch {
    // Stockage indisponible : les réglages par défaut restent utilisables.
    return DEFAULT_PREFS
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Le réglage vaut pour la session, il ne survivra pas à la fermeture.
  }
}

/* --------------------------------------------------------------- couleurs */

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
}

/**
 * Éclaircit (`amount > 0`) ou assombrit une couleur, en fraction du chemin
 * qui la sépare du blanc ou du noir. Une couleur qu'on ne sait pas lire est
 * rendue telle quelle : mieux vaut un réglage sans effet qu'un fond cassé.
 */
export function shade(color: string, amount: number): string {
  const rgb = parseHex(color)
  if (!rgb || amount === 0) return color
  const target = amount > 0 ? 255 : 0
  const k = Math.abs(amount)
  return toHex(rgb.map((v) => v + (target - v) * k) as [number, number, number])
}
