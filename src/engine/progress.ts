/**
 * Sauvegarde de progression et chronomètre.
 *
 * Tout est en localStorage : la tablette reste utilisable sans reseau, et
 * une partie interrompue se reprend exactement ou elle en était, chronomètre
 * compris. Aucune donnée ne quitte l'iPad.
 */

import type { Tutorial } from './types'

const KEY = 'tutogames.save.v1'

export interface Save {
  /** Identifiant du tutoriel en cours. */
  tutorialId: string
  /** Version du contenu au moment de la sauvegarde, pour détecter un decalage. */
  contentVersion: string
  /** Index du chapitre courant. */
  chapter: number
  /** Index de l'étape courante dans le chapitre. */
  step: number
  /** Identifiants des étapes validees, pour la barre de progression. */
  done: string[]
  /** Millisecondes déjà écoulées, hors périodes de pause. */
  elapsedMs: number
  /** Date de reprise du chronomètre, ou null si en pause. */
  runningSince: number | null
  /** Horodatage de la dernière écriture. */
  updatedAt: number
}

type SaveMap = Record<string, Save>

function readAll(): SaveMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as SaveMap) : {}
  } catch {
    // Stockage indisponible (navigation privee, quota) : on repart à vide
    // plutôt que de casser l'application.
    return {}
  }
}

function writeAll(map: SaveMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // Écriture impossible : la session reste jouable, seule la reprise est perdue.
  }
}

export function loadSave(tutorialId: string): Save | null {
  return readAll()[tutorialId] ?? null
}

export function listSaves(): Save[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function writeSave(save: Save): void {
  const all = readAll()
  all[save.tutorialId] = { ...save, updatedAt: Date.now() }
  writeAll(all)
}

export function clearSave(tutorialId: string): void {
  const all = readAll()
  delete all[tutorialId]
  writeAll(all)
}

export function newSave(t: Tutorial): Save {
  return {
    tutorialId: t.id,
    contentVersion: t.contentVersion,
    chapter: 0,
    step: 0,
    done: [],
    elapsedMs: 0,
    runningSince: null,
    updatedAt: Date.now(),
  }
}

/** Temps affiche par le chronomètre, pause comprise. */
export function elapsedOf(save: Save, now: number): number {
  return save.elapsedMs + (save.runningSince ? now - save.runningSince : 0)
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
