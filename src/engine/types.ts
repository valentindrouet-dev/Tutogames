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
 * `npm run crops` rend chaque découpe depuis le PDF à l'échelle qu'il faut.
 *
 * Le rectangle est optionnel. Un `Crop` réduit à son numéro de page affiche
 * la page entière : c'est déjà la bonne référence visuelle, et le rectangle
 * se précise ensuite avec `npm run grid`, qui rend la page sous une grille
 * de coordonnées. Voir GUIDE_CREATION_TUTO.md, « Découper les visuels ».
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
 * Effectifs pour lesquels un élément de contenu s'applique.
 *
 * Absent = tous les effectifs. Sinon, la liste exacte : `[1]` pour une étape
 * qui ne concerne que le solo, `[2, 3]` pour une variante à deux ou trois
 * joueurs. C'est ce qui permet à un même tutoriel de couvrir le solo et la
 * partie à cinq sans dire au joueur « si vous êtes 3, ignorez ce qui suit ».
 */
export type PlayerFilter = number[]

/**
 * Ce qu'on vient chercher dans l'application. Un même jeu sert trois besoins
 * qui n'ont rien à voir :
 *
 * - `tuto`  — première partie : on installe et on joue, pas à pas.
 * - `setup` — on connaît le jeu, on veut juste le poser correctement.
 * - `recap` — on y a joué il y a longtemps : les règles, dans l'ordre, en
 *             résumé, pour se remettre en tête avant de commencer.
 *
 * Un chapitre ou une étape déclare les modes où il apparaît. Rien de déclaré
 * = `['tuto']` seulement : un contenu didactique n'a pas sa place dans un
 * rappel, il faut le vouloir.
 */
export type Mode = 'tuto' | 'setup' | 'recap'

export const MODES: Mode[] = ['tuto', 'setup', 'recap']

export interface ModeInfo {
  id: Mode
  /** Nom du bouton sur l'écran d'accueil. */
  label: string
  /** Une ligne : à qui ça s'adresse. */
  blurb: string
}

export const MODE_INFO: Record<Mode, ModeInfo> = {
  tuto: {
    id: 'tuto',
    label: 'Première partie',
    blurb: 'On installe et on joue, pas à pas.',
  },
  setup: {
    id: 'setup',
    label: 'Mise en place',
    blurb: 'Juste le placement, étape par étape.',
  },
  recap: {
    id: 'recap',
    label: 'Rappel des règles',
    blurb: 'Vous y avez déjà joué : on rafraîchit.',
  },
}

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
  /** Libellé court affiché sur la face. */
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

/** Compteur manipulé par le joueur (cartes en main, munitions, dégâts...). */
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
  /** Matériel concerné : affiché en vignettes cliquables sous l'étape. */
  components?: string[]
  /** Conseil optionnel. */
  tip?: string
  /** Piège de règle à ne pas rater. Toujours visible. */
  warn?: string
  /** Illustration principale de l'étape, découpée dans les règles. */
  crop?: Crop
  /** Élément interactif de l'étape. */
  widget?: Widget
  /** Page des règles officielles, affichée en petit pour recouper. */
  ref?: string
  /** Effectifs concernés. Absent = tous. */
  only?: PlayerFilter
  /** Modes où cette étape apparaît. Absent = ceux du chapitre. */
  modes?: Mode[]
}

export type ChapterKind = 'brief' | 'setup' | 'play' | 'debrief'

export interface Chapter {
  id: string
  title: string
  kind: ChapterKind
  /** Une phrase : ce que le joueur saura faire à la fin du chapitre. */
  goal: string
  steps: Step[]
  /** Effectifs concernés. Absent = tous. */
  only?: PlayerFilter
  /** Modes où ce chapitre apparaît. Absent = `['tuto']`. */
  modes?: Mode[]
}

/**
 * Habillage visuel propre au jeu.
 *
 * Chaque jeu a son ambiance : Nemesis est une alerte orange dans un vaisseau,
 * Tainted Grail une brume verte sur un parchemin. Seules les variables CSS
 * listées ici changent — la mise en page, elle, reste la même partout, pour
 * qu'un joueur qui connaît un tutoriel sache déjà lire les autres.
 *
 * Les polices sont des piles système : aucune police n'est téléchargée, donc
 * l'application reste utilisable hors ligne sur la table de jeu.
 */
export interface Theme {
  /** Fond général, du plus sombre au plus clair. */
  bg: string
  bg2: string
  bg3: string
  /** Filets et bordures. */
  stroke: string
  strokeSoft: string
  /** Textes, du plus lisible au plus discret. */
  fg: string
  fgDim: string
  fgFaint: string
  /** Couleur dominante, et sa variante pour les dégradés. */
  accent: string
  accent2: string
  /** Texte posé sur un aplat d'accent. */
  accentInk: string
  /** Pile de polices des titres. */
  titleFont?: string
  /** Pile de polices du texte courant. */
  bodyFont?: string
  /** Casse des titres d'étape. */
  titleTransform?: 'none' | 'uppercase'
  titleWeight?: number
  titleSpacing?: string
  /** Rayon d'arrondi général : anguleux pour un vaisseau, doux pour un conte. */
  radius?: string
  /**
   * Sombre par défaut. `'light'` bascule l'interface en fond clair : les
   * voiles neutres, les ascenseurs et les teintes d'étape s'inversent, et
   * la couleur de fond de la page suit le thème jusque dans le rebond de
   * défilement. Un thème clair doit fournir ses `ok` / `warn` / `danger` :
   * les valeurs par défaut sont réglées pour un fond sombre.
   */
  scheme?: 'light' | 'dark'
  /** Vert de validation. Défaut réglé pour un fond sombre. */
  ok?: string
  /** Jaune d'avertissement. Défaut réglé pour un fond sombre. */
  warn?: string
  /** Rouge d'abandon. Défaut réglé pour un fond sombre. */
  danger?: string
}

/** Effectifs jouables et leurs particularités. */
export interface Players {
  min: number
  max: number
  /** Libellé d'un effectif particulier, ex. `{ 1: 'Solo' }`. */
  labels?: Record<number, string>
  /**
   * Effectif conseillé pour une première partie. Présélectionné à l'ouverture.
   */
  recommended?: number
  /** Une phrase par effectif : ce qui change. Affiché au moment du choix. */
  notes?: Record<number, string>
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
  players: Players
  /** Durée annoncée de la partie tutorielle, en minutes. */
  minutes: number
  theme: Theme
  source: {
    /** Nom du fichier PDF ingéré, tel qu'il est dans rules/. */
    pdf: string
    /** Identifiant du dossier d'assets : games/<assetId>/ */
    assetId: string
    /**
     * Écart entre le numéro imprimé sur la page et son index dans le PDF.
     * Un livret dont la page « 2 » est la 3e page du fichier a un offset de 1.
     * Une seule valeur corrige donc toutes les découpes du tutoriel.
     */
    pageOffset: number
    credit: string
  }
  /**
   * Couverture du livret, découpée dans le PDF. C'est elle qui illustre le
   * jeu sur l'écran d'accueil : un joueur reconnaît sa boîte bien plus vite
   * qu'il ne lit un résumé.
   */
  cover?: Crop
  /** Ce que le tutoriel couvre volontairement, et ce qu'il laisse de côté. */
  scope: { covered: string[]; skipped: string[] }
  components: Component[]
  chapters: Chapter[]
}

/** Modes d'un chapitre. Rien de déclaré = première partie seulement. */
export function chapterModes(c: Chapter): Mode[] {
  return c.modes ?? ['tuto']
}

/** Modes d'une étape : les siens, sinon ceux de son chapitre. */
export function stepModes(c: Chapter, s: Step): Mode[] {
  return s.modes ?? chapterModes(c)
}

/** Modes réellement proposés par un tutoriel, dans l'ordre canonique. */
export function modesOf(t: Tutorial): Mode[] {
  const found = new Set<Mode>()
  for (const c of t.chapters) for (const m of chapterModes(c)) found.add(m)
  for (const c of t.chapters) for (const s of c.steps) for (const m of stepModes(c, s)) found.add(m)
  return MODES.filter((m) => found.has(m))
}

/** Un contenu s'applique-t-il à cet effectif ? */
export function appliesTo(only: PlayerFilter | undefined, players: number): boolean {
  return !only || only.includes(players)
}

/** Libellé d'un effectif, ex. « Solo » ou « 3 joueurs ». */
export function playerLabel(p: Players, n: number): string {
  return p.labels?.[n] ?? (n === 1 ? '1 joueur' : `${n} joueurs`)
}

/** Effectifs jouables, dans l'ordre. */
export function playerRange(p: Players): number[] {
  return Array.from({ length: p.max - p.min + 1 }, (_, i) => p.min + i)
}
