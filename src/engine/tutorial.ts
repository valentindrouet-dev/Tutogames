/**
 * Navigation dans un tutoriel.
 *
 * Tout passe par une **vue** : le tutoriel filtré pour un effectif donné.
 * Une étape marquée `only: [1]` n'existe simplement pas dans la vue à trois
 * joueurs — la navigation, la numérotation et la barre de progression n'ont
 * donc aucun cas particulier à gérer, et le joueur ne voit jamais une
 * consigne qui ne le concerne pas.
 *
 * Le moteur ne connaît aucun jeu en particulier.
 */

import {
  appliesTo, chapterModes, stepModes,
  type Aid, type AidEntry, type Chapter, type Component, type Mode, type Step, type Tutorial,
} from './types'
import { voPrintedIn } from './vo'

/** Position dans un tutoriel : index de chapitre et d'étape, dans la vue. */
export interface Position {
  chapter: number
  step: number
}

/** Tutoriel filtré pour un effectif et un mode. */
export interface View {
  tutorial: Tutorial
  players: number
  mode: Mode
  chapters: Chapter[]
}

/**
 * Construit la vue d'un tutoriel pour un effectif et un mode. Les chapitres
 * et étapes hors effectif ou hors mode sont retirés ; un chapitre vidé de
 * toutes ses étapes disparaît aussi.
 *
 * En mode « Mise en place », les étapes perdent leurs vignettes de matériel
 * et leurs conseils : on sait déjà ce qu'est une tuile Salle, on veut savoir
 * où elle va. Les avertissements, eux, restent — c'est justement ce qu'on
 * rate quand on installe de mémoire.
 */
export function viewFor(tutorial: Tutorial, players: number, mode: Mode = 'tuto'): View {
  const bare = mode === 'setup'
  const chapters = tutorial.chapters
    .filter((c) => appliesTo(c.only, players) && chapterModes(c).includes(mode))
    .map((c) => ({
      ...c,
      steps: c.steps
        .filter((s) => appliesTo(s.only, players) && stepModes(c, s).includes(mode))
        .map((s) => (bare ? { ...s, tip: undefined, components: undefined } : s)),
    }))
    .filter((c) => c.steps.length > 0)

  return { tutorial, players, mode, chapters }
}

export interface FlatStep {
  step: Step
  chapter: Chapter
  chapterIndex: number
  stepIndex: number
  /** Index de l'étape dans la vue entière. */
  globalIndex: number
}

export function flatten(v: View): FlatStep[] {
  const out: FlatStep[] = []
  v.chapters.forEach((chapter, chapterIndex) => {
    chapter.steps.forEach((step, stepIndex) => {
      out.push({ step, chapter, chapterIndex, stepIndex, globalIndex: out.length })
    })
  })
  return out
}

export function stepAt(v: View, pos: Position): Step | undefined {
  return v.chapters[pos.chapter]?.steps[pos.step]
}

/**
 * Ramène une position potentiellement invalide (contenu mis à jour depuis la
 * sauvegarde, effectif changé) sur l'étape valide la plus proche.
 */
export function clampPosition(v: View, chapter: number, step: number): Position {
  const c = Math.min(Math.max(chapter, 0), Math.max(v.chapters.length - 1, 0))
  const steps = v.chapters[c]?.steps ?? []
  const s = Math.min(Math.max(step, 0), Math.max(steps.length - 1, 0))
  return { chapter: c, step: s }
}

export function indexOf(v: View, chapter: number, step: number): number {
  let n = 0
  for (let c = 0; c < chapter && c < v.chapters.length; c++) n += v.chapters[c].steps.length
  return n + step
}

export function totalSteps(v: View): number {
  return v.chapters.reduce((n, c) => n + c.steps.length, 0)
}

/** Étape suivante, ou null si on est à la fin du tutoriel. */
export function next(v: View, chapter: number, step: number): Position | null {
  const steps = v.chapters[chapter]?.steps ?? []
  if (step + 1 < steps.length) return { chapter, step: step + 1 }
  if (chapter + 1 < v.chapters.length) return { chapter: chapter + 1, step: 0 }
  return null
}

/** Étape précédente, ou null si on est au tout début. */
export function prev(v: View, chapter: number, step: number): Position | null {
  if (step > 0) return { chapter, step: step - 1 }
  if (chapter > 0) {
    const c = chapter - 1
    return { chapter: c, step: Math.max(v.chapters[c].steps.length - 1, 0) }
  }
  return null
}

export function componentMap(t: Tutorial): Map<string, Component> {
  return new Map(t.components.map((c) => [c.id, c]))
}

/** Composants cités par une étape, dans l'ordre déclaré, sans les inconnus. */
export function componentsOf(t: Tutorial, step: Step): Component[] {
  if (!step.components?.length) return []
  const map = componentMap(t)
  return step.components.map((id) => map.get(id)).filter((c): c is Component => Boolean(c))
}

/**
 * Nombre d'étapes d'un mode pour l'effectif conseillé — sert à annoncer une
 * taille sur l'écran d'accueil, avant que le joueur ait choisi.
 */
export function nominalSteps(t: Tutorial, mode: Mode = 'tuto'): number {
  return totalSteps(viewFor(t, t.players.recommended ?? t.players.min, mode))
}

/**
 * Où mène une entrée de l'index : une fiche d'aide, une fiche de matériel,
 * ou nulle part (l'entrée porte elle-même sa réponse).
 */
export type IndexTarget =
  | { kind: 'aid'; aid: Aid; entry?: AidEntry }
  | { kind: 'part'; component: Component }
  | { kind: 'text' }

/** Une ligne de l'index alphabétique, prête à afficher. */
export interface IndexRow {
  /** Le mot sous lequel la ligne est rangée. */
  term: string
  /** Lettre de classement, en majuscule et sans accent. */
  letter: string
  /** Deux ou trois lignes de réponse, ou le début de la fiche visée. */
  body: string[]
  /** Là d'où vient la réponse, affiché en petit sous elle. */
  from?: string
  ref?: string
  /** L'entrée sort du livret : signalée comme telle. */
  ext?: boolean
  /**
   * Botte de foin supplémentaire, jamais affichée : les mots imprimés sur le
   * matériel pour les termes que cette ligne emploie. C'est ce qui permet de
   * taper « surgery » et de tomber sur « Bloc opératoire ».
   */
  printed?: string
  target: IndexTarget
}

/**
 * Clé de tri : sans accent, sans article, sans numéro d'ordre, en minuscules.
 *
 * Une entrée peut porter son rang dans une procédure — « 1. Contrôle des
 * moteurs », « II. Phase Événement ». Le rang compte dans la fiche, où il
 * donne l'ordre ; il ne compte pas dans l'index, où on cherche le mot.
 */
function sortKey(term: string): string {
  return term
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^\d+\s*[.)]\s*/, '')
    .replace(/^(i{1,3}|iv|vi{0,3}|ix|x)\s*[.)]\s*/, '')
    .replace(/^(l|d)['\u2019]/, '')
    .replace(/^(le|la|les|un|une|des|du|de)\s+/, '')
    .trim()
}

function letterOf(term: string): string {
  const k = sortKey(term)
  const first = k.charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

/**
 * L'index alphabétique du jeu, calculé.
 *
 * On ne réécrit pas les règles une troisième fois : l'index **récolte** ce
 * qui existe déjà. Chaque entrée d'aide de jeu y entre sous son terme et
 * sous ses alias, chaque composant sous son nom, chaque variante de
 * composant sous son étiquette. Les entrées écrites à la main dans
 * `tutorial.index` complètent, et les renvois (`see`) pointent vers un
 * autre mot.
 *
 * Le résultat est trié sans tenir compte des accents ni des articles :
 * « l'Hibernatorium » se cherche à H, « les Œufs » à O.
 */
export function indexEntriesOf(t: Tutorial): IndexRow[] {
  const rows: IndexRow[] = []
  const seen = new Set<string>()
  const vo = t.vo?.terms ?? []

  const push = (row: IndexRow) => {
    const k = sortKey(row.term)
    if (!k || seen.has(k)) return
    seen.add(k)
    // Ce que la boîte imprime pour les termes de cette ligne : invisible,
    // mais cherchable.
    rows.push(vo.length ? { ...row, printed: voPrintedIn(vo, [row.term, ...row.body]) } : row)
  }

  for (const aid of t.aids ?? []) {
    for (const group of aid.groups) {
      for (const entry of group.entries) {
        const from = group.title ? `${aid.title} — ${group.title}` : aid.title
        const target: IndexTarget = { kind: 'aid', aid, entry }
        for (const term of [entry.term, ...(entry.aliases ?? [])]) {
          push({
            term,
            letter: letterOf(term),
            body: entry.body,
            from,
            ref: entry.ref,
            ext: entry.ext,
            target,
          })
        }
      }
    }
  }

  for (const c of t.components) {
    push({
      term: c.name,
      letter: letterOf(c.name),
      body: c.note ? [c.note] : c.qty ? [c.qty] : [],
      from: 'Matériel',
      target: { kind: 'part', component: c },
    })
    for (const v of c.variants ?? []) {
      push({
        term: v.label,
        letter: letterOf(v.label),
        body: [v.effect],
        from: `Matériel — ${c.name}`,
        target: { kind: 'part', component: c },
      })
    }
  }

  for (const e of t.index ?? []) {
    if (e.see) {
      const to = rows.find((r) => sortKey(r.term) === sortKey(e.see as string))
      for (const term of [e.term, ...(e.aliases ?? [])]) {
        push({
          term,
          letter: letterOf(term),
          body: to ? to.body : (e.body ?? []),
          from: `Voir ${e.see}`,
          ref: e.ref ?? to?.ref,
          ext: e.ext ?? to?.ext,
          target: to ? to.target : { kind: 'text' },
        })
      }
      continue
    }
    for (const term of [e.term, ...(e.aliases ?? [])]) {
      push({
        term,
        letter: letterOf(term),
        body: e.body ?? [],
        from: e.ext ? 'Hors livret' : 'Règles',
        ref: e.ref,
        ext: e.ext,
        target: { kind: 'text' },
      })
    }
  }

  return rows.sort((a, b) => sortKey(a.term).localeCompare(sortKey(b.term), 'fr'))
}

/** Les initiales présentes dans un index, dans l'ordre. */
export function lettersOf(rows: IndexRow[]): string[] {
  const out: string[] = []
  for (const r of rows) if (out[out.length - 1] !== r.letter) out.push(r.letter)
  return out
}

/** Filtre l'index sur une saisie, sans tenir compte des accents. */
/**
 * Filtre l'index sur une saisie, sans tenir compte des accents — et dans les
 * **deux langues** : la requête est comparée au terme, à sa réponse, et aux
 * mots que le matériel imprime à leur place (`printed`). Taper « surgery »
 * sort donc « Bloc opératoire », sans que l'entrée change d'apparence.
 */
export function searchIndex(rows: IndexRow[], query: string): IndexRow[] {
  const q = sortKey(query)
  if (!q) return rows
  return rows.filter((r) => (
    sortKey(r.term).includes(q)
    || (r.printed ? sortKey(r.printed).includes(q) : false)
    || r.body.some((b) => sortKey(b).includes(q))
  ))
}
