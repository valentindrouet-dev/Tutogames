# Journal des versions

Le numéro de version de l'application est affiché **sous le titre** sur l'écran
d'accueil. Sa source unique est [`version.json`](version.json).

Format : `0.01`, `0.02`, … `0.10`, puis `1.00` à la première version considérée
comme complète.

À chaque publication :

1. Mettre à jour `version` et `date` dans `version.json`.
2. Aligner `SHELL` dans [`sw.js`](sw.js), à la racine (le nom du cache porte
   la version, ce qui purge automatiquement l'ancienne sur les tablettes déjà
   installées).
3. Ajouter une entrée ici.
4. Mettre à jour `GUIDE_CREATION_TUTO.md` si la démarche de création change.

---

## v0.11 — 2026-09-04

### Modifié

- **Le nombre d'étapes disparaît des boutons de mode.** Il n'aidait pas à
  choisir, et chargeait l'écran. Une partie en cours se signale maintenant
  par l'état du bouton — bordure et fond d'accent — sans le moindre chiffre.
- Les boutons carrés passent de 101 à **86 px** de côté.

---

## v0.10 — 2026-09-04

### Modifié

- **Les trois modes d'un jeu tiennent sur une ligne**, en boutons carrés.
  Chacun porte son pictogramme, son libellé et son nombre d'étapes : le
  pictogramme donne le sens avant même qu'on lise.

### Ajouté

- **Tri des jeux**, dans les réglages de l'accueil, à côté de la taille du
  texte et de la clarté du fond : ordre du catalogue, ou alphabétique. Le
  choix est mémorisé sur la tablette.
- Le panneau s'appelle désormais « Réglages » : il ne contient plus seulement
  du confort de lecture.

---

## v0.09 — 2026-09-04

### Modifié

- **L'accueil ne porte plus de texte libre.** L'accroche sous le titre,
  l'étiquette « Jeux disponibles », la phrase de pied de page, le titre écrit
  de chaque carte et la description de chaque mode ont disparu. Il reste le
  nom de l'application, sa version, et des boutons.
- **Les vignettes deviennent des bandeaux de titre**, trois fois moins hauts :
  la couverture est recadrée sur le seul titre du livret, au rapport 3 pour 1.
  C'est lui qui identifie le jeu, à la place du titre écrit.
- Les trois jeux tiennent maintenant sur un écran d'iPad en paysage, sans
  défilement.

---

## v0.08 — 2026-09-04

### Ajouté

- **Trois modes par jeu.** Un tutoriel ne sert plus seulement la première
  partie : chaque jeu propose « Première partie », « Mise en place » et
  « Rappel des règles ». Chacun garde sa propre sauvegarde, son propre
  chronomètre et sa propre progression.
  - *Mise en place* ne montre que les chapitres d'installation, sans vignettes
    de matériel ni conseils — juste le placement, étape par étape. Les
    avertissements restent : ce sont eux qu'on rate en installant de mémoire.
  - *Rappel des règles* est du contenu écrit pour lui : les points de règles
    dans l'ordre, résumés, pour se remettre en tête un jeu laissé de côté.
- **Troisième tutoriel : Expeditions — Après Scythe.** 43 étapes de première
  partie, 13 de mise en place, 8 de rappel, 18 éléments de matériel et
  36 découpes tirées du livret officiel.
- **L'accueil montre la couverture des livrets.** Le résumé de chaque jeu
  disparaît de la carte : une couverture identifie une boîte bien plus vite
  qu'une phrase. Le détail reste accessible par le bouton d'information.
- **Réglages de confort de lecture.** Taille du texte sur quatre crans, et
  clarté du fond sur cinq, appliquée par-dessus les couleurs du jeu sans
  toucher à leur contraste. Accessibles depuis l'accueil et depuis un
  tutoriel en cours.
- **`npm run grid`** rend une page de règles sous une grille de coordonnées
  normalisées : c'est l'outil de repérage des découpes.

### Retiré

- **Le Studio de découpe.** Il ne servait plus : les rectangles se lisent au
  grid, et se collent directement dans le fichier du jeu.

---

## v0.07 — 2026-09-03

### Ajouté

- **Fond clair pour Tainted Grail.** Le tutoriel prend l'aspect du livret :
  parchemin vieilli, encre sépia, titres au rouge de rubrique. Les découpes
  des règles, elles aussi sur fond clair, entrent enfin dans la page au lieu
  d'y flotter en rectangles lumineux.
- Le modèle de thème accepte `scheme: 'light'` et ses couleurs sémantiques
  `ok` / `warn` / `danger`. Un thème clair inverse les voiles neutres,
  assombrit les teintes d'étape, règle `color-scheme`, et fait suivre le fond
  de la page jusque dans le rebond de défilement de l'iPad.

### Corrigé

- **Nouvelle édition du PDF Nemesis, bien plus définie.** Les 43 découpes ont
  été refaites depuis ce fichier : les cartes d'exemple, jusque-là illisibles
  au-delà du titre, se lisent maintenant en entier.
- Le plafond d'échelle des découpes passe de 44 à 120 : les plus petites
  vignettes atteignent désormais elles aussi 1800 px de grand côté, au lieu
  de plafonner à 1463 px.
- Quatre couleurs étaient écrites en dur dans la feuille de style — texte des
  étapes, texte des avertissements, pastille de chapitre, badge de page. Elles
  suivent maintenant le thème, sans quoi un fond clair les rendait illisibles.

---

## v0.06 — 2026-09-03

### Ajouté

- **Deuxième tutoriel : Tainted Grail — La Chute d'Avalon.** 10 chapitres,
  92 étapes en solo, 96 à plusieurs, 27 éléments de matériel et 49 découpes
  tirées du livret officiel. Il installe la campagne entière — personnages
  puis monde —, fait jouer un jour complet, déroule l'exemple de combat du
  livret coup par coup, couvre la diplomatie et l'aube du jour 2.
- **Le tutoriel demande le nombre de joueurs avant de commencer.** L'effectif
  choisi filtre le contenu : mise en place, variantes et étapes propres au
  solo ou à un effectif donné. Le moteur travaille sur une vue filtrée, donc
  la numérotation, le saut d'étape et la sauvegarde en tiennent compte. Le
  cadran du menhir de départ de *Tainted Grail* (8 jours en solo, 5 à quatre)
  est le cas d'école.
- **Habillage visuel par jeu.** Chaque tutoriel fournit ses couleurs, ses
  polices, sa graisse de titre et ses arrondis. Nemesis garde son alerte
  orange sur métal ; Tainted Grail passe au parchemin, à l'or et aux
  capitales serif. La mise en page, elle, ne change pas d'un jeu à l'autre.
- **Raccourcis clavier.** **Espace** avance d'une étape, **Maj + Espace**
  recule. Les flèches et Entrée fonctionnent aussi. Sans effet quand on
  saisit du texte.
- **Saut d'étape.** Le bouton « Étape *n* / *m* », au-dessus du titre, ouvre
  la liste des étapes du chapitre et permet d'aller directement à l'une
  d'elles.

### Corrigé

- **Qualité des visuels.** Les découpes étaient taillées dans l'image de page
  rendue à 200 dpi : un composant occupant 4 % de la page ne faisait que
  92 px de large, illisible une fois agrandi. `npm run crops` rend désormais
  chaque découpe **directement depuis le PDF**, à l'échelle nécessaire pour
  atteindre 1800 px de grand côté. Le plus petit visuel de Nemesis passe de
  92 à 1463 px.
- Les panneaux modaux (choix de l'effectif, fiche matériel, index, saut
  d'étape) portent les couleurs du jeu, et plus celles de l'application.
- `npm run typecheck` ne produit plus de fichiers `.js` à côté des sources.
  Vite résolvant `.js` avant `.tsx`, ces fichiers faisaient construire du
  code périmé sans le moindre message.

### Documentation

- `GUIDE_CREATION_TUTO.md` : deux étapes nouvelles dans la démarche
  (« Déclarer les effectifs jouables », « Habiller le jeu »), une section
  « Ce que le joueur peut faire pendant le tutoriel », la relecture des
  découpes en planche contact, et l'encadré sur les `.js` émis par TypeScript.

---

## v0.05 — 2026-09-03

### Corrigé

- **Publication depuis la branche, sans écran blanc.** GitHub Pages reste en
  « Deploy from a branch » et sert la racine du dépôt ; la racine est
  désormais le site construit. `index.html` et `assets/` sont générés par
  `npm run build` et versionnés, les statiques (`games/`, icônes, manifeste,
  service worker) vivent à la racine, l'entrée de développement est dans
  `app/`. Un `.nojekyll` désactive le traitement Jekyll. Plus aucun réglage à
  changer côté GitHub, et plus de course entre deux publieurs.
- Le workflow `deploy.yml` reconstruit et commite `index.html` + `assets/` à
  chaque push, et publie aussi l'artefact Pages : il fonctionne dans les deux
  modes de Pages (branche ou Actions) et publie le même contenu dans les deux.
  Le site suit les sources sans build manuel.

### Optimisé

- **Images.** Pages ingérées en WebP 200 dpi : 15 Mo au lieu de 25 Mo en
  JPEG, plus nettes. Surtout, `npm run crops` pré-découpe les 43 visuels
  référencés par le tutoriel Nemesis (1,1 Mo au total) : une étape charge
  désormais ~40 Ko d'images au lieu d'une page entière de ~1 Mo.
- **Connexions.** Les visuels de l'étape suivante sont préchargés pendant la
  lecture de l'étape courante. Le service worker sépare un cache de coque,
  purgé à chaque version, d'un cache média durable pour `games/` : une mise à
  jour de l'app ne fait plus retélécharger les règles sur la tablette. Le
  manifeste `pages.json` est toujours pris sur le réseau quand il est là.
- **Bundle.** Le Studio de découpe est chargé à la demande (chunk séparé de
  4,5 Ko) ; le bundle principal ne le contient plus.

---

## v0.04 — 2026-09-03

### Corrigé

- **Écran blanc persistant en ligne, cause identifiée.** La source de Pages
  était restée sur *Deploy from a branch*. GitHub lançait donc son publieur
  Jekyll en parallèle du workflow, sur chaque push : Jekyll publie la racine
  du dépôt, et terminait quelques secondes après le workflow, écrasant sa
  publication. La racine contenant l'`index.html` de développement, la page
  restait blanche. Les quatre déploiements du workflow étaient pourtant tous
  au vert — d'où le diagnostic trompeur.
  Le correctif est un réglage du dépôt : **Settings › Pages › Source →
  GitHub Actions**. Il ne peut pas être fait depuis le code.

### Ajouté

- La racine servie telle quelle n'affiche plus un écran blanc muet mais un
  message nommant la cause et le correctif. Un greffon Vite retire ce bloc du
  build, où il serait au mieux un flash, au pire un message faux.

---

## v0.03 — 2026-09-03

### Ajouté

- **Les visuels des règles.** Le PDF officiel est ingéré (28 pages, 200 dpi,
  JPEG) et les 36 éléments de matériel portent désormais leur photo exacte,
  découpée dans le livret : plateau, figurines, tuiles Salle, cartes, jetons,
  marqueurs, dés, sac Intrus.
- Dix étapes reçoivent le schéma d'exemple correspondant du livret : exemple
  de déplacement en salle inexplorée, en salle occupée, de rencontre, de
  combat, de fuite, de carte Attaque d'Intrus, de carte Événement, de carte
  Action, et de scan d'une carte Contamination.

### Modifié

- Ingestion en JPEG 200 dpi plutôt qu'en PNG 150 dpi : visuels plus nets pour
  un poids divisé par trois. Seules les pages effectivement référencées par
  une découpe sont téléchargées par la tablette.
- Panneau visuel plus haut, pour afficher en entier les encadrés d'exemple du
  livret, qui sont hauts et étroits.

### Corrigé

- Identifiants de composants normalisés en ASCII (`coordonnees`,
  `evenements`), et « Cartes Rôle » accentué.

---

## v0.02 — 2026-09-03

### Corrigé

- **Page blanche sur GitHub Pages.** Pages servait la racine du dépôt, donc
  l'`index.html` de développement dont le script pointe vers `/src/main.tsx` :
  le navigateur ne sait pas exécuter du TypeScript, la page restait vide sans
  erreur visible. Un workflow construit désormais `dist/` et publie ce seul
  dossier. Les réglages Pages du dépôt doivent rester sur « GitHub Actions ».
- Les pages de règles ingérées sont maintenant versionnées : le site étant
  construit depuis le dépôt, il doit les contenir pour afficher les visuels.

### Ajouté

- `npm run extract` : extraction des visuels d'un PDF de règles, par deux
  méthodes complémentaires. Les images bitmap intégrées sont retrouvées via la
  liste d'opérateurs et leur matrice de placement, ce qui donne le rectangle
  exact de chaque composant ; les illustrations vectorielles sont isolées par
  détection des régions d'encre. Les deux produisent des rectangles normalisés
  collables tels quels dans un tutoriel.

---

## v0.01 — 2026-09-03

Première version.

### Application

- Écran d'accueil : bibliothèque de jeux, reprise de la partie en cours,
  numéro de version affiché sous le titre.
- Déroulement d'un tutoriel : une étape à l'écran, gros boutons tactiles,
  matériel concerné affiché à côté, navigation libre entre chapitres.
- Sauvegarde de progression : étape courante, étapes validées et chronomètre,
  conservées sur la tablette. Reprise exacte après fermeture de l'application.
- Chronomètre intégré : compte le temps réel autour de la table, survit à une
  mise en veille, se met en pause et reprend.
- Éléments interactifs : dé simulé (`roller`), choix à conséquence (`choice`),
  compteur (`counter`).
- Fiche matériel et index complet du matériel du jeu.
- PWA installable sur l'écran d'accueil iPad, utilisable hors ligne.

### Contenu

- Tutoriel **Nemesis** (Awaken Realms), contenu v1.0 : 8 chapitres, 65 étapes,
  36 éléments de matériel. Couvre la mise en place complète (20 étapes
  officielles), la structure de la manche, l'exploration et le jet de bruit,
  la rencontre et l'attaque-surprise, le combat et la fuite, la phase
  Événement et le sac Intrus, les conditions de victoire.

### Outils

- `npm run ingest` : rend les pages d'un PDF de règles en images et écrit le
  manifeste utilisé par l'application.
- Studio de découpe intégré : trace les rectangles de découpe au doigt et
  produit le littéral TypeScript à coller dans le tutoriel.
