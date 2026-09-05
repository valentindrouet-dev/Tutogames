# Guide de création d'un tutoriel TutoGames

Ce document est la référence pour transformer un PDF de règles en tutoriel jouable.
Il est le contrat entre le contenu et le moteur.

> **Règle d'entretien : ce fichier se met à jour à chaque évolution.**
> Toute modification du modèle de données (`src/engine/types.ts`), du pipeline
> d'ingestion (`tools/ingest.mjs`) ou des règles de rédaction se répercute ici
> **dans le même commit**. Un guide périmé coûte plus cher que pas de guide.
> La section « Journal du guide » en fin de document trace ces évolutions.

---

## 1. Le principe

Un tutoriel est **de la donnée**, pas du code.

```
src/engine/     moteur générique — ne connaît aucun jeu
src/ui/         interface générique — ne connaît aucun jeu
src/games/      un fichier par jeu — tout le contenu est ici
games/          les pages de règles ingérées et leurs découpes, à la racine du dépôt
```

Un jeu propose **trois modes**, et c'est le même fichier qui les porte tous :

| Mode | Bouton | Pour qui | Ce qu'il montre |
|---|---|---|---|
| `tuto` | 1re Partie | On découvre le jeu | Tout : matériel, mise en place, tour joué pas à pas |
| `setup` | Mise en Place | On connaît le jeu | Les seuls chapitres de mise en place, sans vignettes ni conseils |
| `reprise` | Reprendre | On remonte une partie déjà commencée | La remise en place d'une sauvegarde, ou le contrôle d'une table laissée en plan |
| `recap` | Règles | On y a joué il y a longtemps | Les règles dans l'ordre, résumées |

**Un mode qu'aucun chapitre ne déclare n'apparaît pas.** Un jeu sans règles de
sauvegarde peut donc n'avoir aucun bouton « Reprendre » — ne l'inventez pas.

Ajouter un jeu, c'est ajouter **un fichier** dans `src/games/` et l'inscrire dans
`src/games/index.ts`. Aucune ligne de moteur ou d'interface ne doit changer. Si
vous avez besoin de modifier le moteur pour faire passer un jeu, c'est le signe
qu'il manque une primitive générique — ajoutez-la au moteur, jamais un cas
particulier.

---

## 2. La démarche, de bout en bout

### Étape 1 — Lire les règles en entier, avant d'écrire une ligne

Non négociable. On ne peut pas décider quoi enseigner sans connaître le jeu.
Repérez au passage :

- La liste du matériel et le numéro de page où chaque élément est illustré.
- La procédure de mise en place, numérotée par l'éditeur si elle l'est.
- La structure d'un tour et d'une manche.
- Les **moments spéciaux** : événements uniques déclenchés par une condition,
  et non par le tour de jeu. Ce sont les règles les plus souvent ratées en
  première partie (dans Nemesis : la première rencontre, la première mort).
- Les conditions de victoire et de fin de partie.

### Étape 2 — Ingérer le PDF

Déposez le PDF dans `rules/`, puis :

```bash
npm run ingest -- rules/mon-jeu.pdf mon-jeu
```

Par défaut : 200 dpi, WebP qualité 80 — net à l'écran, un tiers plus léger
que le JPEG. Le livret Nemesis (28 pages) pèse ainsi 15 Mo. `--jpeg` ou
`--png` si nécessaire, `--dpi` et `--quality` pour ajuster.

Produit `games/mon-jeu/pages.json` et une image par page, **à la racine du
dépôt** : c'est la racine qui est publiée par GitHub Pages. Les coordonnées
de découpe étant **normalisées entre 0 et 1**, on peut ré-ingérer à une autre
résolution sans retoucher une seule découpe.

**Un livret livré en plusieurs PDF.** Un tutoriel ne connaît qu'un seul
fichier (`source.pdf`). Quand l'éditeur découpe son livret en parties à
numérotation continue — Frosthaven : pages 1 à 38, 39 à 72, 73 à 84 —
fusionnez-les d'abord, dans l'ordre de lecture :

```bash
npm run merge -- "rules/Frosthaven - Regles.pdf" \
  rules/Frosthaven_Rules_-_Part_1.pdf \
  rules/Frosthaven_Rules_-_Part_2.pdf \
  rules/Frosthaven_Rules_-_Part_3.pdf
```

La commande affiche la plage de pages prise par chaque partie : vérifiez
qu'elle suit la numérotation imprimée. Le fichier produit n'est pas versionné
(`rules/*.pdf` est ignoré) : il se refait en une commande à partir des
parties, qui elles le sont. C'est lui qu'on ingère et que `npm run crops`
lit ; `source.pdf` porte son nom.

**Un livret en anglais.** On l'ingère comme les autres, et on traduit. Le
texte des étapes est en français, mais les termes imprimés sur le matériel
(Move, Attack, Shield, long rest…) sont gardés tels quels après une première
mention traduite : c'est ce que le joueur lit sur ses cartes. Le champ `ref`
garde le titre de section anglais, pour retrouver la page. Dites-le dans
l'en-tête du fichier et dans la première étape du briefing.

**Un livret sous autocollants scellés.** Certaines étapes de Frosthaven sont
cachées sous des autocollants que la campagne fait décoller plus tard. On ne
reconstitue jamais leur contenu, même s'il est connu par ailleurs : l'étape
du tutoriel dit qu'elle est sous autocollant, et renvoie au livret.

### Étape 3 — Fixer `pageOffset`

Les livrets ont presque toujours une couverture qui décale la numérotation :
la page « 2 » imprimée est souvent la 3ᵉ page du fichier.

Ouvrez `games/mon-jeu/pages/`, trouvez la page portant le numéro 2, et
renseignez l'écart dans `source.pageOffset`. **Une seule valeur corrige toutes
les découpes du tutoriel.** Vérifiez avec `npm run grid -- <pdf> <page>` : le
nom du fichier produit porte l'index dans le PDF, la page rendue porte son
numéro imprimé.

### Étape 4 — Déclarer les effectifs jouables

Avant d'écrire une étape, dites au moteur pour combien de joueurs le tutoriel
existe. L'application pose la question au démarrage et **filtre le contenu** :
c'est ce qui évite d'écrire « si vous êtes 3, ignorez ce qui suit » partout.

```ts
players: {
  min: 1,
  max: 4,
  recommended: 1,               // présélectionné à l'ouverture
  labels: { 1: 'Solo' },        // libellé particulier d'un effectif
  notes: {                      // une phrase : ce qui change à cet effectif
    1: 'Le livret conseille d’apprendre le jeu en solitaire.',
    4: 'À quatre, vos mains de combat tombent à 2 cartes.',
  },
}
```

Ensuite, tout `Chapter` et tout `Step` accepte un filtre `only` :

```ts
{ id: 'w2-1', title: 'Réglez le cadran sur 8', only: [1],       … }
{ id: 'w2-2', title: 'Réglez le cadran sur 7', only: [2],       … }
{ id: 'a7',   title: 'Établissez votre stratégie', only: [2, 3, 4], … }
```

Absent = tous les effectifs. Le moteur construit une **vue** filtrée
(`viewFor(tutorial, players)`) et toute la navigation travaille dessus :
numérotation, saut d'étape, sauvegarde. Aucun autre code n'a de cas particulier
à traiter.

Trois usages qui reviennent presque toujours :

- une **valeur de mise en place** qui dépend du nombre de joueurs → une étape
  par valeur, chacune avec son `only`, plutôt qu'un tableau à lire ;
- une **règle propre au solo** (mort, objectifs, absence de discussion) →
  `only: [1]` d'un côté, `only: [2, 3, …]` de l'autre ;
- une **étape de concertation** qui n'a pas de sens seul → `only: [2, 3, …]`.

### Étape 5 — Habiller le jeu

Chaque jeu a son ambiance. Le champ `theme` fournit les valeurs, la feuille de
style ne connaît que des variables : **la mise en page et la typographie ne
changent jamais**, pour qu'un joueur qui a suivi un tutoriel sache déjà lire
les autres.

```ts
theme: {
  scheme: 'light',                       // fond clair ; 'dark' par défaut
  bg: '#e7dcc3', bg2: '#f3ebd8', bg3: '#fbf5e7',
  stroke: '#c0a97f', strokeSoft: '#d6c5a1',
  fg: '#2b2118', fgDim: '#5e4f3c', fgFaint: '#695c49',
  accent: '#82190f', accent2: '#a8551a', accentInk: '#fdf6e6',
  ok: '#3f6b2f', warn: '#8a5a10', danger: '#9d2418',
  radius: '6px',
}
```

- **Un jeu n'apporte pas sa police.** La typographie est fixée une fois pour
  toutes dans la feuille de style — une pile système, rien à télécharger, donc
  lisible hors ligne. Un jeu apporte ses couleurs et son rayon d'arrondi, c'est
  tout. Trois polices sur trois écrans faisaient trois applications.
- **`scheme: 'light'` bascule l'interface en fond clair.** Il inverse les
  voiles neutres, assombrit les teintes d'étape, règle `color-scheme` et fait
  suivre le fond de la page jusque dans le rebond de défilement de l'iPad. Un
  thème clair **doit** alors fournir ses `ok` / `warn` / `danger` : les valeurs
  par défaut sont réglées pour un fond sombre et disparaissent sur du papier.
- **Regardez d'abord les découpes.** Si les pages du livret sont sur fond
  clair, un thème clair les fait entrer dans la page au lieu de les y faire
  flotter en rectangles lumineux. C'est la vraie raison du parchemin de
  *Tainted Grail*, pas le décor.
- **Contraste avant cachet.** Le texte se lit à 60 cm, de biais, sous une
  lumière de salon. `fg` sur `bg` ne descend jamais sous 7:1.
- **Deux couleurs d'accent**, la seconde servant aux dégradés de boutons.
  `accentInk` est le texte posé sur un aplat d'accent : il doit être lisible.
- `radius` porte beaucoup de caractère : anguleux pour un vaisseau, arrondi
  pour un conte.
- Les `tint` de faces de dé (widget `roller`) restent, par convention, des
  couleurs **vives** : le badge y pose toujours une encre sombre.

Comparez toujours les jeux côte à côte sur l'accueil : si on ne les
distingue pas d'un coup d'œil, le thème ne sert à rien.

### Étape 6 — Découper le bandeau de titre

L'écran d'accueil ne contient **aucun texte libre** : ni résumé, ni titre
écrit. Le bandeau découpé dans la couverture du livret identifie le jeu, et
trois boutons disent le reste. Un joueur reconnaît sa boîte bien plus vite
qu'il ne lit une phrase.

```ts
cover: { page: 1, x: 0.03, y: 0.3, w: 0.94, h: 0.32 },
```

Visez un rectangle **proche du 3 pour 1**, cadré sur le titre du jeu. Ce qui
dépasse du rapport est recadré au centre : un titre placé en haut ou en bas de
la couverture sera coupé si le rectangle est trop haut. Laissez de côté les
logos d'éditeur et les mentions légales.

### Étape 7 — Recenser le matériel

Un `Component` par élément que le joueur doit **reconnaître physiquement** sur
la table. Reprenez le **nom exact des règles** : c'est ce qui permet au joueur
de recouper avec le livret.

```ts
{
  id: 'sac',
  name: 'Sac Intrus',
  qty: '1 sac',
  note: 'On y pioche à chaque rencontre et à la fin de chaque manche : c’est le moteur de la menace.',
  glyph: 'bag',
  tint: '#ef4444',
  crop: { page: 2 },
}
```

- `qty` recopie la quantité imprimée dans les règles.
- `note` fait **une phrase** et dit *à quoi ça sert*, jamais ce que les règles
  disent déjà. Si vous paraphrasez, supprimez la note.
- `glyph` est le pictogramme de secours affiché tant que la découpe n'existe pas.

### Étape 8 — Découper les visuels

Deux voies, à utiliser dans cet ordre.

**a) Extraction automatique — à faire en premier.**

```bash
npm run extract -- rules/mon-jeu.pdf mon-jeu
```

Le script produit des rectangles de découpe candidats dans `.extract/mon-jeu/`,
par deux méthodes complémentaires :

- **Images intégrées.** Il lit la liste d'opérateurs de chaque page pour
  retrouver les bitmaps (`paintImageXObject`) et la matrice qui les place. Les
  rendus 3D de matériel d'un livret de règles sont presque toujours des images
  distinctes : on obtient donc le rectangle *exact* de chaque composant, au
  pixel près. Ces candidats sont marqués `"kind": "image"`.
- **Régions d'encre.** Pour les illustrations vectorielles (schémas, cartes
  d'exemple, plateau annoté), aucune image n'existe dans le PDF. Le script rend
  alors la page et isole les amas de pixels non blancs séparés par des
  gouttières de blanc. Ces candidats sont marqués `"kind": "region"`.

Chaque candidat vient avec un aperçu PNG. On ouvre le dossier, on identifie le
composant, et on copie le champ `crop` correspondant dans le tutoriel — il est
déjà au bon format.

Options utiles :

| Option | Effet |
|---|---|
| `--pages 2-3,9,24-26` | N'analyse que ces pages du fichier. Le matériel est en général sur 2 ou 3 pages : ciblez-les. |
| `--min-size 0.05` | Ignore les candidats plus petits que 5 % de la page (puces, icônes de texte). |
| `--no-regions` | N'extrait que les images intégrées, sans analyse de pixels. |
| `--dpi 200` | Analyse plus fine, aperçus plus nets. |

**b) Grille de coordonnées — pour le reste.**

```bash
npm run grid -- "rules/Mon jeu - Regles.pdf" 3
npm run grid -- "rules/Mon jeu - Regles.pdf" 3 0.33 0.15 0.67 0.85   # zoom
```

L'outil rend la page sous une grille de coordonnées normalisées, dans
`.extract/grid/`. On ouvre l'image, on lit les bords du visuel sur les axes,
on écrit le rectangle. **La grille reste en coordonnées de page même quand on
zoome** : un rectangle lu dans un zoom se colle sans conversion.

C'est la méthode qui a servi pour l'intégralité de *Tainted Grail* et
d'*Expeditions*. Elle remplace l'ancien Studio de découpe, retiré en v0.08.

**c) Pré-découper — une fois les rectangles posés.**

```bash
npm run crops
```

Pour chaque `crop` à rectangle du tutoriel, l'outil **rend la zone directement
depuis le PDF**, à l'échelle qu'il faut pour que son grand côté atteigne
1800 px, et écrit un WebP dans `games/mon-jeu/crops/`. Il liste ensuite les
découpes disponibles dans `pages.json`. L'application charge ce petit fichier
(quelques dizaines de Ko) au lieu de la page entière (~1 Mo) ; elle retombe
sur la page si la découpe manque. **À relancer après toute modification d'un
rectangle**, et après une ré-ingestion. Les découpes orphelines sont
supprimées automatiquement.

> **Ne découpez jamais dans l'image de page.** Un composant qui occupe 4 % de
> la page ne fait que 92 px de large dans un rendu à 200 dpi : agrandi à
> l'écran, il est illisible. En repartant du PDF, la même découpe sort à
> 1800 px. C'est la seule raison d'être de cet outil.

> **Mais une découpe ne sera jamais plus nette que le PDF.** L'outil monte
> l'échelle jusqu'à 1800 px ; si l'image intégrée au fichier n'en fait que
> 300, il ne fait qu'agrandir du flou. Quand les visuels restent mous après
> `npm run crops`, cherchez une meilleure édition du PDF plutôt qu'un réglage :
> le livret Nemesis a été remplacé pour cette raison, et les mêmes rectangles
> ont donné des découpes nettes sans qu'une seule ligne du tutoriel change.

Ré-ingérer et re-découper après un changement de PDF :

```bash
npm run ingest -- "rules/Mon jeu - Regles.pdf" mon-jeu
npm run crops -- mon-jeu --force      # --force réécrit les découpes existantes
```

Les coordonnées étant normalisées, elles restent valables tant que la mise en
page du livret n'a pas bougé. Vérifiez-le en planche contact (étape d).

La découpe se dégrade proprement, en quatre niveaux :

| État | Ce que le joueur voit | Chargé |
|---|---|---|
| Pas de `crop` | Pictogramme + nom | rien |
| `crop: { page: 9 }` | La page de règles entière, avec le badge « Règles p.9 » | la page, ~1 Mo |
| `crop: { page: 9, x, y, w, h }` sans `npm run crops` | Le gros plan, cadré en CSS dans la page | la page, ~1 Mo |
| `crop: { page: 9, x, y, w, h }` après `npm run crops` | Le gros plan, fichier dédié | ~30 Ko |

**Un tutoriel sans aucune découpe reste entièrement jouable.** Commencez par
renseigner les numéros de page — c'est déjà utile — et affinez ensuite.

**d) Relire les découpes, en planche contact.**

Après `npm run crops`, regardez les fichiers produits, tous ensemble. Deux
défauts ne se voient qu'à l'œil :

- une **légende coupée** en bas ou à droite du rectangle — la découpe perd le
  nom du composant, qui est justement ce que le joueur cherche ;
- un **aplat blanc** à la place de l'illustration. Certains masques et images
  de PDF ne se rendent pas ; c'est le cas des cartes annotées de plusieurs
  pages du livret *Tainted Grail*. Dans ce cas, changez de source : la photo
  produit du même élément dans la liste du matériel fait toujours l'affaire.

### Étape 9 — Écrire les chapitres

Découpage recommandé, éprouvé sur Nemesis :

| Chapitre | `kind` | Rôle |
|---|---|---|
| Briefing | `brief` | Ce qu'on va faire, ce qu'il faut sortir de la boîte |
| Mise en place (1 ou 2 chapitres) | `setup` | Suivre la procédure officielle, étape par étape |
| Comprendre le tour | `play` | La structure de la manche et le coût des actions |
| Boucle principale | `play` | L'action qu'on répète le plus, avec ses conséquences |
| Les moments qui font peur | `play` | Combat, conflit, tout ce qui bloque un débutant |
| Fin de manche | `play` | Ce qui se passe quand les joueurs ont fini |
| Gagner | `debrief` | Conditions de victoire, et ce qu'on n'a pas couvert |

Visez **6 à 10 chapitres** et **60 à 95 étapes** — Nemesis en compte 65, le
tutoriel *Tainted Grail*, qui installe une campagne entière, 92. En dessous,
on survole ; au-dessus, on abandonne avant la fin. Un livret de 84 pages
comme celui de *Frosthaven* déborde forcément : on y accepte une centaine
d'étapes en première partie, mais on ne rogne pas sur les trois autres modes
pour autant.

Comptez ce que voit **un** joueur : `nominalSteps()` calcule le total à
l'effectif conseillé, filtres `only` appliqués.

### Étape 10 — Servir les trois modes

Un chapitre déclare les modes où il apparaît. **Rien de déclaré = `['tuto']`
seulement** : un contenu didactique n'a pas sa place dans un rappel, il faut le
vouloir.

```ts
// Mise en place : sert la première partie ET le mode « Mise en place ».
{ id: 'setup-board', title: 'Mise en place : le plateau', kind: 'setup',
  modes: ['tuto', 'setup'], … }

// Rappel : des chapitres écrits pour lui, courts, jamais réutilisés ailleurs.
{ id: 'r-boucle', title: 'La manche', kind: 'play', modes: ['recap'], … }
```

Une étape peut affiner : `modes: ['tuto']` sur une étape d'un chapitre
`['tuto', 'setup']` la réserve à la première partie — pratique pour un aparté
qui n'a rien à faire dans une installation rapide.

**Ce que le mode `setup` retire tout seul.** Le moteur y supprime les `tip` et
les vignettes de matériel de chaque étape : on sait déjà ce qu'est une tuile
Salle, on veut savoir où elle va. Les `warn` restent — c'est justement ce
qu'on rate en installant de mémoire. Vous n'avez donc **rien à réécrire** :
vos chapitres de mise en place servent les deux modes tels quels.

**Écrire le rappel.** Comptez 6 à 10 étapes, pas plus — jusqu'à 18 pour un
jeu à campagne comme *Frosthaven*, où la phase d'avant-poste s'ajoute au
scénario. Une étape par bloc de règles, dans l'ordre où on les rencontre à la
table. Des listes de faits, pas des explications : celui qui lit connaît déjà
le jeu, il cherche à retrouver un détail. Les `warn` valent de l'or ici : ce
sont les règles qu'on oublie entre deux parties.

Ne déclarez jamais `modes: ['tuto', 'recap']` sur un chapitre didactique pour
faire le rappel à moindres frais : soixante-dix étapes de première partie
relues en mode rappel ne sont pas un rappel. Le chapitre de rappel s'écrit à
part, court, et les chapitres didactiques restent en `tuto` seul.

**Écrire la reprise.** Deux cas très différents, et il faut trancher en lisant
le livret :

- **Le jeu a des règles de sauvegarde** (campagne). Écrivez la remise en place
  comme la procédure de sauvegarde à l'envers, en suivant le livret étape par
  étape. C'est ce que fait *Tainted Grail* : fiche de sauvegarde, plateaux,
  paquets, carte, menhirs, cadrans. 12 à 15 étapes.
  *Frosthaven* est le cas de la campagne **sans** sauvegarde en cours de
  scénario : le livret dit qu'un scénario se joue en une séance, et la
  campagne se suit sur des fiches (feuille de campagne, fiches de
  personnage, paquet de bâtiments, plateau-carte). La reprise remonte ces
  supports, puis dit où l'on en est : phase d'avant-poste à jouer, ou
  scénario à choisir. Ne lui faites pas dire comment reprendre au milieu
  d'un scénario si le livret ne le dit pas.
- **Le jeu n'en a pas** (partie d'une séance). N'inventez pas de sauvegarde.
  Écrivez un contrôle de la table laissée montée : ce qui a pu bouger, ce qui
  est irrécupérable si on l'a rangé, et où reprendre. 5 à 7 étapes, et dites
  dès la première que le jeu n'a pas de sauvegarde officielle.

### Étape 11 — Écrire le glossaire VO, si la boîte n'est pas en français

Un joueur qui possède *Nemesis* en anglais lit « Rôdeur » dans le tutoriel et
cherche une carte qui porte « Creeper ». Le champ `vo` fait le pont :

```ts
vo: {
  language: 'anglais',
  edition: 'Nemesis Rulebook, Awaken Realms',
  terms: [
    { fr: 'Rôdeur', en: 'Creeper' },
    { fr: 'marqueur Dégâts', en: 'Injury marker',
      note: 'Injury pour un Intrus, Wound pour un personnage.' },
  ],
},
```

Le bouton VO du bandeau montre **d'abord les termes de l'étape affichée**, puis
le glossaire entier ; la fiche du jeu, sur l'accueil, le montre en entier. Un
drapeau à côté de la durée prévient avant même d'ouvrir le jeu. Un tutoriel
sans `vo` n'a ni bouton ni drapeau : c'est le cas de tous les jeux dont le
matériel est en français.

**La correspondance est automatique.** `voTermsIn()` compare le texte de
l'étape — titre, corps, `warn`, `tip`, et le nom des composants affichés — au
glossaire, sur une forme normalisée : minuscules, accents retirés, ponctuation
ramenée à des espaces, « s » final enlevé de chaque mot. « Jetons Œuf d'Intrus »
retrouve donc l'entrée « jeton Œuf ». Vous n'avez rien à déclarer étape par
étape : un terme ajouté au glossaire apparaît partout où il est employé.

Trois règles pour un glossaire utile :

- **Le `fr` doit être le mot que le tutoriel écrit**, au singulier. Un terme que
  vous n'employez jamais ne sortira jamais ; ce n'est pas grave, il reste dans
  le glossaire complet, que le joueur consulte à la table.
- **N'y mettez pas ce qui n'a pas besoin d'être traduit.** Le tutoriel
  *Frosthaven* garde déjà Move, Attack, Shield et les conditions en anglais :
  les faire figurer ne dirait rien au joueur.
- **La `note` sert aux pièges**, pas à la paraphrase : « Injury pour un Intrus,
  Wound pour un personnage » vaut mieux que « le marqueur de dégâts ».

Comptez une trentaine de termes pour un jeu simple, une centaine pour un jeu à
campagne. `npm run vo` donne la moyenne par étape, les étapes sans aucun terme
et les entrées jamais rencontrées ; `npm run vo -- nemesis` pour un seul jeu.

### Étape 12 — Relire à voix haute

Lisez le tutoriel comme si vous guidiez quelqu'un. Toute phrase que vous
n'auriez pas dite à l'oral n'a rien à faire à l'écran.

---

## 3. Règles de rédaction

Ces règles viennent du cahier des charges : *pas de texte inutile qui répète ce
que des boutons clairs peuvent vouloir dire.*

**Le titre est un impératif court.** « Mélangez les tuiles Salle "2" », pas
« Dans cette étape, vous allez mélanger… ». Beaucoup de joueurs ne liront que ça.

**Une ligne de `body` = une action ou un fait.** Jamais de paragraphe. Si une
ligne dépasse deux lignes à l'écran, coupez-la en deux.

**Ne répétez jamais le bouton.** Le bouton principal dit déjà « Fait » ou
« Compris ». N'écrivez pas « cliquez sur Suivant quand c'est fait ».

**`warn` est réservé aux pièges.** Une règle qu'on rate en première partie et
qui gâche la suite : « Personne ne doit voir les tuiles pendant le mélange. »
Si tout est un avertissement, plus rien ne l'est — deux `warn` par chapitre
maximum.

**`tip` est optionnel par nature.** Le tutoriel doit rester juste si le joueur
saute tous les `tip`.

**`ref` renvoie aux règles officielles.** Format : `'Mise en place, étape 8 — p.6'`.
C'est ce qui permet au joueur d'aller vérifier, et à vous de maintenir le
tutoriel quand une réédition change la pagination.

**Français correct, accents compris.** Guillemets français `« »`, apostrophes
typographiques `’`, espace insécable avant `: ; ! ?` si vous en mettez une.

---

## 4. Choisir le bon `kind` d'étape

| `kind` | Étiquette | Quand |
|---|---|---|
| `info` | Comprendre | Le joueur lit, il n'y a rien à faire sur la table |
| `place` | Poser | Poser du matériel sur le plateau |
| `take` | Prendre | Prendre ou distribuer du matériel |
| `shuffle` | Mélanger | Mélanger, tirer au hasard, cacher |
| `action` | Jouer | Le joueur agit dans la partie simulée |
| `check` | Vérifier | Récapitulatif, contrôle avant de continuer |

Le `kind` pilote le pictogramme, la couleur, **et le libellé du bouton**
(« Compris » pour `info`, « Fait » ailleurs). Un `kind` juste évite d'écrire
une consigne redondante.

---

## 5. Les éléments interactifs

C'est ce qui distingue un tutoriel d'un livret PDF : le joueur **pratique** la
règle au lieu de la lire. N'en mettez pas partout — un widget par règle qu'un
débutant ne peut pas déduire seul.

### `roller` — un dé simulé

```ts
widget: {
  kind: 'roller',
  title: 'Jet de bruit',
  cta: 'Lancer le dé de bruit',
  faces: [
    { label: '1', effect: 'Posez un marqueur Bruit dans le couloir n° 1.', tint: '#22d3ee' },
    { label: 'Danger', effect: 'Tout Intrus adjacent hors combat vient ici.', tint: '#ef4444' },
  ],
}
```

`effect` dit **la conséquence**, pas le nom du résultat. `weight` pondère un
tirage quand la composition est connue (le sac Intrus est défini par la mise en
place, donc pondérable). `scripted: 0` force le premier tirage pour scénariser
une démonstration.

> **Honnêteté du simulateur.** Ne prétendez jamais reproduire la répartition
> exacte des faces d'un dé que vous n'avez pas comptée. Montrez les résultats
> possibles, et dites dans un `tip` que le vrai dé fait foi. C'est ce que fait
> le tutoriel Nemesis pour le d10 de bruit et le d6 de combat.

### `choice` — une décision et sa conséquence

Pour les règles en « si… alors ». Le joueur choisit, l'application montre ce
qui arrive. Idéal pour l'attaque-surprise, les priorités de ciblage.

### `counter` — un compteur

Cartes en main, munitions, dégâts. Utile quand un nombre doit être *manipulé*
pour être compris.

---

## 6. Ce que le joueur peut faire pendant le tutoriel

À connaître en rédigeant : **n'expliquez jamais ces gestes dans une étape**,
l'interface les porte déjà.

| Geste | Où |
|---|---|
| Étape suivante | Bouton principal, flèche droite, **Espace**, Entrée |
| Étape précédente | Flèche gauche, **Maj + Espace** |
| Aller à n'importe quelle étape du chapitre | Bouton « Étape *n* / *m* », au-dessus du titre |
| Changer de chapitre | Le bandeau de chapitres, en haut |
| Ouvrir la fiche d'un composant | Les vignettes de matériel, sous l'étape |
| Index complet du matériel | Bouton grille, en haut à droite |
| Chronomètre | En haut à droite ; il survit à la fermeture de l'application |
| Taille du texte, clarté du fond, ordre des jeux | Bouton réglages, en haut à droite et sur l'accueil |

Le saut d'étape et les raccourcis clavier sont **génériques** : ils suivent la
vue filtrée par l'effectif et le mode, donc un tutoriel n'a rien à déclarer
pour en bénéficier.

Les réglages (`src/engine/prefs.ts`) multiplient toutes les tailles de texte,
décalent la clarté des fonds de ±20 % au maximum par-dessus l'habillage du
jeu, et choisissent l'ordre des jeux sur l'accueil. Écrivez donc vos titres
**courts** : un titre qui tient sur deux lignes en taille normale en prend
quatre en « Énorme ».

---

## 7. Portée : dire ce qu'on n'enseigne pas

`scope.covered` et `scope.skipped` sont affichés au joueur avant qu'il commence,
et rappelés en fin de tutoriel.

Un tutoriel qui prétend tout couvrir ment. Un tutoriel qui annonce ses limites
est utilisable : le joueur sait quand ouvrir le livret. **Remplissez toujours
`skipped`.**

---

## 8. Versionnement

Deux numéros distincts, à ne pas confondre :

| Numéro | Où | Change quand |
|---|---|---|
| Version de l'application | `version.json`, affichée sous le titre | L'application évolue |
| Version du contenu | `contentVersion` du tutoriel | Le contenu d'un tutoriel évolue |

**Application** — `version.json` est la source unique. Format `0.01`, `0.02`…
La version est affichée sous le titre sur l'accueil et sert de nom de cache au
service worker (`sw.js`, à la racine), qu'il faut aligner à chaque publication.
Chaque changement est consigné dans `CHANGELOG.md`.

**Contenu** — incrémentez `contentVersion` dès que vous modifiez des étapes.
Les sauvegardes mémorisent la version au moment de l'enregistrement ; le moteur
ramène une position devenue invalide sur l'étape valide la plus proche
(`clampPosition`), une partie en cours n'est donc jamais cassée par une mise à
jour.

---

## 9. Contrôle avant publication

```bash
npm run build        # typecheck + build de production
npm run dev          # relecture à l'écran
```

> **Ne faites jamais émettre de JavaScript à TypeScript.** `npm run typecheck`
> et `npm run build` lancent `tsc -b`, qui ne produit aucun fichier. Forcer
> `--noEmit false` sème des `.js` à côté des sources ; Vite résout `.js` avant
> `.tsx` et construit alors **du code périmé**, sans rien signaler. Si un
> changement n'apparaît pas dans le build : `find src -name '*.js' -delete`.

GitHub Pages publie la **racine du dépôt** (« Deploy from a branch »). Le
workflow `.github/workflows/deploy.yml` y reconstruit `index.html` et `assets/`
à chaque push, les commite, et publie aussi l'artefact Pages (il couvre donc
les deux modes de Pages). Pas de build manuel avant de pousser, mais un
`git pull` avant le push suivant si le bot a commité.

- [ ] Le tutoriel se déroule du début à la fin sans étape vide, **à chaque
      effectif jouable**.
- [ ] Chaque valeur de mise en place qui dépend du nombre de joueurs a bien
      sa variante `only`.
- [ ] Sur l'accueil, le jeu se distingue des autres d'un coup d'œil.
- [ ] Le bandeau de couverture est net, cadré sur le titre, proche du 3/1.
- [ ] Chaque mode déclaré se déroule en entier : aucun chapitre vide, aucun
      renvoi à une étape qui n'existe pas dans ce mode.
- [ ] Le rappel tient en 6 à 10 étapes et ne réexplique rien.
- [ ] Chaque `warn` est un vrai piège, pas une précision.
- [ ] Aucun texte ne répète le libellé d'un bouton.
- [ ] Tous les `components` cités par une étape existent dans la liste.
- [ ] Les numéros de page des `ref` correspondent à l'édition ingérée.
- [ ] `scope.skipped` est rempli.
- [ ] Accents et guillemets français vérifiés.
- [ ] `contentVersion` incrémentée si le contenu a changé.
- [ ] `npm run crops` relancé si un rectangle a changé, et les découpes
      relues en planche contact.
- [ ] Aucun `.js` traîne dans `src/` (voir l'encadré ci-dessus).
- [ ] `CHANGELOG.md` et ce guide mis à jour.

---

## 10. Droits sur les visuels

Les pages ingérées et leurs découpes sont l'œuvre de l'éditeur. Elles sont
**versionnées dans `games/`** parce que le site est publié depuis la racine du
dépôt : sans elles, la tablette n'aurait rien à afficher. Cela signifie qu'un
dépôt public les rend téléchargeables par n'importe qui. Pour un jeu dont
l'éditeur n'a pas donné son accord, passez le dépôt en privé (Pages continue
de fonctionner) ou ne poussez pas les visuels. `source.credit` doit toujours
créditer la source ; il est affiché au joueur dans la fiche du jeu.

---

## 11. Journal du guide

| Date | Version app | Modification |
|---|---|---|
| 2026-09-03 | v0.01 | Création du guide, en même temps que le tutoriel Nemesis. |
| 2026-09-03 | v0.02 | Ajout de `npm run extract` (images intégrées + régions d'encre) en amont du Studio, et de la section « Publication ». |
| 2026-09-03 | v0.05 | Les visuels vivent dans `games/` à la racine (plus `public/`). Ajout de `npm run crops` (étape 5c) et du niveau « fichier dédié » dans le tableau de dégradation. Publication depuis la branche, build automatique. |
| 2026-09-03 | v0.03 | Première application réelle sur Nemesis : 36 découpes de matériel et 10 schémas d'exemple. Ingestion recommandée en JPEG 200 dpi. |
| 2026-09-03 | v0.06 | Deux étapes nouvelles : « Déclarer les effectifs jouables » (`players`, filtres `only`, vue filtrée) et « Habiller le jeu » (`theme`). Les découpes sont rendues depuis le PDF à 1800 px et non plus taillées dans la page. Ajout de la relecture en planche contact, de la section « Ce que le joueur peut faire », et de l'encadré sur les `.js` émis par TypeScript. Volumétrie revue à 6-10 chapitres et 60-95 étapes. Deuxième tutoriel : *Tainted Grail — La Chute d'Avalon*. |
| 2026-09-03 | v0.07 | `scheme: 'light'` et couleurs sémantiques (`ok` / `warn` / `danger`) par jeu : l'interface accepte un fond clair, appliqué au parchemin de *Tainted Grail*. Nouvelle édition du PDF Nemesis, découpes refaites à l'identique avec `--force`. Encadré sur la qualité de la source d'une découpe, et la marche à suivre après un changement de PDF. |
| 2026-09-04 | v0.08 | Trois modes par jeu (`modes` sur les chapitres et les étapes) : première partie, mise en place, rappel des règles. Nouvelle étape « Découper la couverture » (`cover`) et « Servir les trois modes ». Le Studio de découpe est remplacé par `npm run grid`, qui rend une page sous une grille de coordonnées. Réglages de confort : taille du texte et clarté du fond. Troisième tutoriel : *Expeditions*. |
| 2026-09-04 | v0.09 | L'accueil ne porte plus de texte libre : le `cover` devient un bandeau de titre au rapport 3/1, qui remplace le titre écrit et le résumé de la carte. Trois cartes tiennent désormais sur un écran d'iPad sans défilement. |
| 2026-09-04 | v0.10 | Les trois modes tiennent sur une ligne, en boutons carrés à pictogramme (`MODE_ICON`). Les réglages accueillent le tri des jeux, catalogue ou alphabétique. |
| 2026-09-04 | v0.12 | Quatrième mode : `reprise`. Section « Écrire la reprise », qui distingue le jeu à sauvegarde officielle du jeu d'une séance. `MODE_INFO` gagne un libellé court d'un mot pour les boutons carrés. |
| 2026-09-04 | v0.13 | Une seule typographie pour toute l'application : `titleFont`, `bodyFont`, `titleTransform`, `titleWeight` et `titleSpacing` sont retirés de `Theme`. Un jeu apporte ses couleurs et son rayon d'arrondi, plus sa police. |
| 2026-09-05 | v0.15 | Nouvelle étape « Écrire le glossaire VO » (`vo`, `voTermsIn`, bouton VO et drapeau sur l'accueil), pour les jeux dont le matériel n'est pas en français. Sixième tutoriel : *Tainted Grail : Rois de la Ruine*. |
| 2026-09-04 | v0.14 | `npm run merge` pour un livret livré en plusieurs PDF (Frosthaven). Encadrés sur le livret en anglais et sur le contenu sous autocollants scellés. Le rappel s'écrit toujours à part, jamais en réutilisant les chapitres didactiques. Reprise d'une campagne sans sauvegarde en cours de scénario. Quatrième et cinquième tutoriels : *Frosthaven* et *Bitoku*. |
