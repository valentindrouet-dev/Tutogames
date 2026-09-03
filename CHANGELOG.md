# Journal des versions

Le numéro de version de l'application est affiché **sous le titre** sur l'écran
d'accueil. Sa source unique est [`version.json`](version.json).

Format : `0.01`, `0.02`, … `0.10`, puis `1.00` à la première version considérée
comme complète.

À chaque publication :

1. Mettre à jour `version` et `date` dans `version.json`.
2. Aligner `VERSION` dans `public/sw.js` (le nom du cache porte la version, ce
   qui purge automatiquement l'ancienne sur les tablettes déjà installées).
3. Ajouter une entrée ici.
4. Mettre à jour `GUIDE_CREATION_TUTO.md` si la démarche de création change.

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
