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
/**
 * Un livret de règles ingéré : le PDF, son dossier d'assets, et l'écart
 * entre le numéro imprimé sur une page et son index dans le fichier.
 */
export interface Source {
  /** Nom du fichier PDF ingéré, tel qu'il est dans rules/. */
  pdf: string
  /** Identifiant du dossier d'assets : games/<assetId>/ */
  assetId: string
  /**
   * Écart entre le numéro imprimé sur la page et son index dans le PDF.
   * Un livret dont la page « 2 » est la 3e page du fichier a un offset de 1.
   * Une seule valeur corrige donc toutes les découpes de ce livret.
   */
  pageOffset: number
}

/** Un livret secondaire, avec le nom que le joueur lit sur sa couverture. */
export interface Book extends Source {
  /** Titre imprimé sur la couverture : « Encounter Rule Book ». */
  label: string
}

export interface Crop {
  /**
   * Livret d'où vient la page, quand le jeu en a plusieurs — la clé d'une
   * entrée de `source.books`. Absent : le livret principal.
   */
  book?: string
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

/**
 * Le livret d'où vient une découpe : celui qu'elle nomme, ou le principal.
 *
 * Un jeu à deux livrets garde un seul tutoriel — c'est le même jeu sur la
 * table. Chaque découpe dit d'où elle vient, et la résolution des images
 * comme la référence affichée passent par ici.
 */
export function bookOf(t: Tutorial, crop?: Crop): Book {
  const key = crop?.book
  const book = key ? t.source.books?.[key] : undefined
  return book ?? { ...t.source, label: '' }
}

/** Les dossiers d'assets d'un jeu : le livret principal, puis les autres. */
export function assetIdsOf(t: Tutorial): string[] {
  return [t.source.assetId, ...Object.values(t.source.books ?? {}).map((b) => b.assetId)]
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
 * - `tuto`    — première partie : on installe et on joue, pas à pas.
 * - `setup`   — on connaît le jeu, on veut juste le poser correctement.
 * - `reprise` — on remet en place une partie déjà commencée : campagne
 *               sauvegardée, ou table laissée en plan la semaine dernière.
 * - `recap`   — on y a joué il y a longtemps : les règles, dans l'ordre, en
 *               résumé, pour se remettre en tête avant de commencer.
 *
 * Un chapitre ou une étape déclare les modes où il apparaît. Rien de déclaré
 * = `['tuto']` seulement : un contenu didactique n'a pas sa place dans un
 * rappel, il faut le vouloir.
 *
 * Un mode qu'aucun chapitre ne déclare n'apparaît pas sur l'accueil : un jeu
 * sans règles de sauvegarde n'a pas de bouton « Reprendre ».
 */
export type Mode = 'tuto' | 'setup' | 'reprise' | 'recap'

// L'ordre d'affichage des boutons sur l'accueil.
export const MODES: Mode[] = ['tuto', 'reprise', 'setup', 'recap']

export interface ModeInfo {
  id: Mode
  /** Nom complet, pour le bandeau du tutoriel et le titre du panneau. */
  label: string
  /**
   * Un seul mot, pour les boutons carrés de l'accueil : quatre libellés
   * complets ne tiennent pas dans quatre carrés, et le pictogramme porte
   * déjà le sens.
   */
  short: string
}

export const MODE_INFO: Record<Mode, ModeInfo> = {
  tuto: { id: 'tuto', label: 'Première partie', short: '1re Partie' },
  reprise: { id: 'reprise', label: 'Reprendre', short: 'Reprendre' },
  setup: { id: 'setup', label: 'Mise en place', short: 'Mise en Place' },
  recap: { id: 'recap', label: 'Rappel des règles', short: 'Règles' },
}

/**
 * Un élément de matériel du jeu. C'est ce que le joueur doit reconnaître
 * physiquement sur sa table : on l'illustre par une découpe du PDF.
 */
/**
 * Une variété d'un même composant : ce qui la distingue, et ce qu'elle fait.
 *
 * Beaucoup de matériel se présente en plusieurs types qu'un débutant ne
 * distingue pas encore : six symboles sur les jetons Exploration de *Nemesis*,
 * cinq jetons de combat dans *Oathsworn*, quatre couleurs de Puissance. Le
 * livret les décrit une fois, page 15 ou en annexe, et le joueur y retourne
 * dix fois par partie.
 *
 * Les déclarer ici, c'est mettre cette page-là dans la fiche du composant :
 * on tape sur « Jetons Exploration » et on a les six effets sous les yeux,
 * sans quitter l'étape en cours. C'est l'aide de jeu que la boîte ne fournit
 * pas toujours.
 *
 * À réserver aux **variétés d'un même composant**. Une règle qui s'applique au
 * composant entier va dans `note` ; une règle de jeu va dans une étape.
 */
export interface Variant {
  /** Ce qui est imprimé dessus, ou ce qui la distingue à l'œil. */
  label: string
  /** Quantité de cette variété, si le livret la donne. */
  qty?: string
  /** Ce qu'elle fait, en une à trois phrases. C'est le texte de l'aide de jeu. */
  effect: string
  /** Découpe du symbole ou de la carte, quand la reconnaître à l'œil compte. */
  crop?: Crop
  /** Couleur de repérage, quand la variété en a une. */
  tint?: string
}

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
  /**
   * Les variétés de ce composant, quand il en a plusieurs qui ne font pas la
   * même chose. Affichées dans la fiche du matériel, en aide de jeu.
   */
  variants?: Variant[]
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
 * Tainted Grail un parchemin sous une encre sépia. Seules les couleurs et le
 * rayon d'arrondi changent — la mise en page et la **typographie** restent
 * les mêmes partout, pour qu'un joueur qui connaît un tutoriel sache déjà
 * lire les autres.
 *
 * La police est une pile système : rien n'est téléchargé, donc l'application
 * reste utilisable hors ligne sur la table de jeu.
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

/**
 * Un terme du jeu et ce qui est imprimé à sa place sur le matériel de la
 * version originale.
 */
export interface VoTerm {
  /** Le terme tel que le tutoriel l'écrit. */
  fr: string
  /** Le terme tel qu'il est imprimé sur la boîte du joueur, au singulier. */
  en: string
  /**
   * Le pluriel imprimé, quand un « s » ne suffit pas. Sert au mode « sur la
   * boîte », qui remplace le mot français par celui du matériel : « les
   * Larves » doit donner « les Larvae », pas « les Larvas ».
   */
  enPlural?: string
  /** Où on le lit, ou ce qui prête à confusion. Une ligne au plus. */
  note?: string
}

/**
 * Glossaire de la version originale.
 *
 * Un tutoriel est écrit en français, mais la boîte posée sur la table ne
 * l'est pas toujours : les règles de *Nemesis* et de *Frosthaven* sont ici
 * traduites, alors que les cartes, les tuiles et les plateaux du joueur
 * portent leurs noms anglais. Le glossaire fait le pont, et le bouton VO
 * du bandeau montre à chaque étape les termes qu'elle emploie.
 *
 * Un tutoriel dont le matériel est en français n'a pas de `vo` : ni bouton,
 * ni drapeau sur l'écran d'accueil.
 */
export interface Vo {
  /** Langue du matériel, telle qu'elle s'écrit dans une phrase. */
  language: string
  /** Édition à laquelle le glossaire correspond. */
  edition?: string
  /** Les termes, dans l'ordre où on les rencontre dans le jeu. */
  terms: VoTerm[]
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
  source: Source & {
    credit: string
    /**
     * Livrets supplémentaires du même jeu, par clé. Certains éditeurs
     * découpent leurs règles en deux livres qui se suivent à la table :
     * Oathsworn a un livret pour l'histoire et un pour la rencontre, chacun
     * paginé à partir de 1. Une découpe nomme le sien par `crop.book` ; sans
     * clé, elle vient du livret principal.
     */
    books?: Record<string, Book>
  }
  /**
   * Bandeau de titre du livret, découpé dans le PDF. C'est lui qui identifie
   * le jeu sur l'écran d'accueil, à la place d'un titre écrit et d'un résumé :
   * un joueur reconnaît sa boîte bien plus vite qu'il ne lit une phrase.
   * Cadrez sur le titre, en bandeau large — environ 3 pour 1.
   */
  cover?: Crop
  /**
   * Glossaire de la version originale, quand le matériel du joueur n'est pas
   * en français. Absent = rien à traduire, et pas de bouton VO.
   */
  vo?: Vo
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
