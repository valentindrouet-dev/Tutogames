/**
 * Modèle de données d'un tutoriel TutoGames.
 *
 * Principe : un tutoriel est de la DONNÉE pure. Le moteur (src/engine) et
 * l'interface (src/ui) sont génériques et ne connaissent aucun jeu en
 * particulier. Ajouter un jeu = ajouter un fichier dans src/games/.
 *
 * La procédure complète d'ingestion d'un PDF de règles est décrite dans
 * GUIDE_CREATION_TUTO.md, à la racine du dépôt.
 */

/**
 * Zone rectangulaire découpée dans une page de règles, en coordonnées
 * normalisées (0 à 1) relatives à la page. Indépendant de la résolution :
 * on peut re-générer les pages en 300 dpi sans toucher aux découpes.
 *
 * Le rectangle est optionnel. Un `Crop` réduit à son numéro de page affiche
 * la page entière : c'est déjà la bonne référence visuelle, et le rectangle
 * se précise ensuite dans le Studio de découpe (bouton « Studio » de
 * l'accueil). Voir GUIDE_CREATION_TUTO.md, section « Découper les visuels ».
 */
export interface Crop {
  /** Numéro de page imprimé sur la page des règles. */
  page: number
  /** Bord gauche, 0 = gauche de la page, 1 = droite. Défaut 0. */
  x?: number
  /** Bord haut, 0 = haut de la page, 1 = bas. Défaut 0. */
  y?: number
  /** Largeur, en fraction de la largeur de page. Défaut 1. */
  w?: number
  /** Hauteur, en fraction de la hauteur de page. Défaut 1. */
  h?: number
}

/** Rectangle complet, valeurs par défaut appliquées. */
export function rectOf(c: Crop) {
  return { x: c.x ?? 0, y: c.y ?? 0, w: c.w ?? 1, h: c.h ?? 1 }
}

/** Palette de secours quand l'image de règles n'est pas encore ingérée. */
export type Glyph =
  | 'board' | 'tile' | 'token' | 'card' | 'die' | 'meeple'
  | 'marker' | 'bag' | 'figure' | 'egg' | 'door' | 'fire'

/**
 * Un élément de matériel du jeu. C'est ce que le joueur doit reconnaître
 * physiquement sur sa table : on l'illustre par une découpe du PDF.
 */
export interface Component {
  id: string
  /** Nom exact utilisé dans les règles, pour que le joueur puisse recouper. */
  name: string
  /** Quantité dans la boîte, telle qu'imprimée dans les règles. */
  qty?: string
  /** Une phrase max : à quoi ça sert. Pas de paraphrase des règles. */
  note?: string
  /** Découpe dans le PDF de règles. */
  crop?: Crop
  /** Illustration de secours si la découpe n'est pas disponible. */
  glyph: Glyph
  /** Couleur d'accent, pour le repérage visuel rapide. */
  tint?: string
}

/** Faces d'un dé simulé, pour les séquences didactiques. */
export interface DieFace {
  /** Libellé court affiche sur la face. */
  label: string
  /** Explication d'une ligne du résultat. */
  effect: string
  /** Poids de tirage. Défaut 1. */
  weight?: number
  tint?: string
}

export interface Roller {
  kind: 'roller'
  /** Titre du jet, ex. « Jet de bruit ». */
  title: string
  faces: DieFace[]
  /** Force le premier résultat, pour scénariser un tour de démonstration. */
  scripted?: number
  /** Texte du bouton de lancer. */
  cta?: string
}

/** Choix à faire par le joueur, avec la conséquence de chaque branche. */
export interface Choice {
  kind: 'choice'
  title: string
  options: { label: string; outcome: string; tint?: string }[]
}

/** Compteur manipule par le joueur (cartes en main, munitions, dégâts...). */
export interface Counter {
  kind: 'counter'
  title: string
  min: number
  max: number
  start: number
  /** Libellé de l'unité, ex. « cartes ». */
  unit?: string
}

export type Widget = Roller | Choice | Counter

/** Nature d'une étape : conditionne le pictogramme et la couleur. */
export type StepKind =
  | 'info'      // on lit, on comprend
  | 'place'     // on pose du matériel sur la table
  | 'take'      // on prend / distribue du matériel
  | 'shuffle'   // on mélange
  | 'action'    // le joueur agit dans la partie simulée
  | 'check'     // vérification / récapitulatif

export interface Step {
  id: string
  /** Impératif court. C'est le seul texte que beaucoup de joueurs liront. */
  title: string
  kind: StepKind
  /** Détail. Chaque entrée est une ligne courte, jamais un pavé. */
  body?: string[]
  /** Matériel concerne : affiche en vignettes cliquables sous l'étape. */
  components?: string[]
  /** Conseil optionnel, replié par défaut. */
  tip?: string
  /** Piège de règle à ne pas rater. Toujours visible. */
  warn?: string
  /** Illustration principale de l'étape, découpée dans les règles. */
  crop?: Crop
  /** Élément interactif de l'étape. */
  widget?: Widget
  /** Page des règles officielles, affichée en petit pour recouper. */
  ref?: string
}

export type ChapterKind = 'brief' | 'setup' | 'play' | 'debrief'

export interface Chapter {
  id: string
  title: string
  kind: ChapterKind
  /** Une phrase : ce que le joueur saura faire à la fin du chapitre. */
  goal: string
  steps: Step[]
}

export interface Tutorial {
  id: string
  title: string
  /** Sous-titre court : le pitch en une ligne. */
  tagline: string
  /** Version du contenu du tutoriel, indépendante de la version de l'app. */
  contentVersion: string
  publisher: string
  author: string
  players: string
  /** Durée annoncée de la partie tutorielle, en minutes. */
  minutes: number
  /** Couleur dominante du jeu, utilisée pour tout l'habillage. */
  accent: string
  accent2: string
  source: {
    /** Nom du fichier PDF ingéré. */
    pdf: string
    /** Identifiant du dossier d'assets : public/games/<assetId>/pages/ */
    assetId: string
    /**
     * Écart entre le numéro imprimé sur la page et son index dans le PDF.
     * Un livret dont la page « 2 » est la 3e page du fichier a un offset de 1.
     * Une seule valeur corrige donc toutes les découpes du tutoriel.
     */
    pageOffset: number
    credit: string
  }
  /** Ce que le tutoriel couvre volontairement, et ce qu'il laisse de côté. */
  scope: { covered: string[]; skipped: string[] }
  components: Component[]
  chapters: Chapter[]
}
