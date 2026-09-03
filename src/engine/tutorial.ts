/**
 * Navigation dans un tutoriel : aplatissement des chapitres en une liste
 * linéaire d'étapes, et conversion entre position (chapitre, étape) et
 * index global. Le moteur ne connait aucun jeu en particulier.
 */

import type { Chapter, Component, Step, Tutorial } from './types'

export interface FlatStep {
  step: Step
  chapter: Chapter
  /** Index du chapitre dans le tutoriel. */
  chapterIndex: number
  /** Index de l'étape dans son chapitre. */
  stepIndex: number
  /** Index de l'étape dans le tutoriel entier. */
  globalIndex: number
}

export function flatten(t: Tutorial): FlatStep[] {
  const out: FlatStep[] = []
  t.chapters.forEach((chapter, chapterIndex) => {
    chapter.steps.forEach((step, stepIndex) => {
      out.push({ step, chapter, chapterIndex, stepIndex, globalIndex: out.length })
    })
  })
  return out
}

/**
 * Ramène une position potentiellement invalide (contenu mis à jour depuis la
 * sauvegarde, chapitre supprimé) sur l'étape valide la plus proche.
 */
export function clampPosition(t: Tutorial, chapter: number, step: number) {
  const c = Math.min(Math.max(chapter, 0), Math.max(t.chapters.length - 1, 0))
  const steps = t.chapters[c]?.steps ?? []
  const s = Math.min(Math.max(step, 0), Math.max(steps.length - 1, 0))
  return { chapter: c, step: s }
}

export function indexOf(t: Tutorial, chapter: number, step: number): number {
  let n = 0
  for (let c = 0; c < chapter && c < t.chapters.length; c++) n += t.chapters[c].steps.length
  return n + step
}

export function totalSteps(t: Tutorial): number {
  return t.chapters.reduce((n, c) => n + c.steps.length, 0)
}

/** Étape suivante, ou null si on est à la fin du tutoriel. */
export function next(t: Tutorial, chapter: number, step: number) {
  const steps = t.chapters[chapter]?.steps ?? []
  if (step + 1 < steps.length) return { chapter, step: step + 1 }
  if (chapter + 1 < t.chapters.length) return { chapter: chapter + 1, step: 0 }
  return null
}

/** Étape précédente, ou null si on est au tout debut. */
export function prev(t: Tutorial, chapter: number, step: number) {
  if (step > 0) return { chapter, step: step - 1 }
  if (chapter > 0) {
    const c = chapter - 1
    return { chapter: c, step: Math.max(t.chapters[c].steps.length - 1, 0) }
  }
  return null
}

export function componentMap(t: Tutorial): Map<string, Component> {
  return new Map(t.components.map((c) => [c.id, c]))
}

/** Composants cites par une étape, dans l'ordre déclaré, sans les inconnus. */
export function componentsOf(t: Tutorial, step: Step): Component[] {
  if (!step.components?.length) return []
  const map = componentMap(t)
  return step.components.map((id) => map.get(id)).filter((c): c is Component => Boolean(c))
}
