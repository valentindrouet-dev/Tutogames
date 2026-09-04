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
  type Chapter, type Component, type Mode, type Step, type Tutorial,
} from './types'

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
