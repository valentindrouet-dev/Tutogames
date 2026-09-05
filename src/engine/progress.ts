/**
 * Sauvegarde de progression et chronomètre.
 *
 * Tout est en localStorage : la tablette reste utilisable sans réseau, et
 * une partie interrompue se reprend exactement où elle en était — effectif,
 * étape et chronomètre compris. Aucune donnée ne quitte l'iPad.
 *
 * **Une sauvegarde par jeu**, pas une par mode. Sur la vignette d'un jeu il
 * n'y a qu'un bouton « reprendre » : il doit désigner une partie et une
 * seule. Démarrer un autre mode du même jeu efface donc la précédente — on
 * ne perd que sa place dans une lecture, jamais l'état de la table.
 */

import type { Mode, Tutorial } from './types'

const KEY = 'tutogames.save.v1'

export interface Save {
  /** Identifiant du tutoriel en cours. */
  tutorialId: string
  /** Mode en cours : les trois modes d'un jeu se reprennent séparément. */
  mode: Mode
  /** Effectif choisi au démarrage : décide des étapes affichées. */
  players: number
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

/** Clé de sauvegarde : un jeu, une partie en cours. Le mode est dedans. */
function keyOf(tutorialId: string): string {
  return tutorialId
}

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

/**
 * La partie en cours d'un jeu, quel que soit son mode. Passer un `mode`
 * restreint au cas où c'est bien celui-là qui est en cours : c'est ce que
 * fait le lecteur quand il ouvre un mode précis.
 */
export function loadSave(tutorialId: string, mode?: Mode): Save | null {
  const save = readAll()[keyOf(tutorialId)] ?? null
  if (!save) return null
  const normalised: Save = { ...save, mode: save.mode ?? 'tuto' }
  if (mode && normalised.mode !== mode) return null
  return normalised
}

export function listSaves(): Save[] {
  // Les sauvegardes d'avant l'arrivée des modes n'ont pas de champ `mode` :
  // on les rattache à la première partie, qui est ce qu'elles étaient. Les
  // clés d'avant la V2 pouvaient en laisser plusieurs pour un même jeu : on
  // ne garde que la plus récente, celle que le bouton de reprise désigne.
  const byGame = new Map<string, Save>()
  for (const raw of Object.values(readAll())) {
    const save: Save = { ...raw, mode: raw.mode ?? 'tuto' }
    const kept = byGame.get(save.tutorialId)
    if (!kept || save.updatedAt > kept.updatedAt) byGame.set(save.tutorialId, save)
  }
  return [...byGame.values()].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function writeSave(save: Save): void {
  const all = readAll()
  // Écrire, c'est aussi remplacer la partie qu'un autre mode du même jeu
  // aurait laissée : un jeu n'a qu'une place enregistrée.
  for (const key of Object.keys(all)) {
    if (key === save.tutorialId || key.startsWith(`${save.tutorialId}:`)) delete all[key]
  }
  all[keyOf(save.tutorialId)] = { ...save, updatedAt: Date.now() }
  writeAll(all)
}

export function clearSave(tutorialId: string): void {
  const all = readAll()
  for (const key of Object.keys(all)) {
    // Les clés d'avant la V2 portaient le mode en suffixe.
    if (key === tutorialId || key.startsWith(`${tutorialId}:`)) delete all[key]
  }
  writeAll(all)
}

export function newSave(t: Tutorial, players: number, mode: Mode): Save {
  return {
    tutorialId: t.id,
    mode,
    players,
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
