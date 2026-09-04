# TutoGames

Application iPad qui vous fait découvrir un jeu de société en le jouant.

Vous posez la tablette à côté de vous. Elle vous fait installer le jeu étape par
étape, puis vous accompagne pendant vos premières manches. Le matériel est
identifié par des images découpées dans le PDF des règles officielles.

**v0.10** — voir [CHANGELOG.md](CHANGELOG.md).

## Jeux disponibles

| Jeu | Éditeur | Joueurs | Première partie | Mise en place | Rappel |
|---|---|---|---|---|---|
| Nemesis | Awaken Realms | 1 à 5 | 65 étapes | 21 | 7 |
| Tainted Grail : La Chute d'Avalon | Awaken Realms | 1 à 4 | 92 étapes | 22 | 8 |
| Expeditions : Après Scythe | Stonemaier / Matagot | 1 à 5 | 43 étapes | 13 | 8 |

## Trois façons d'ouvrir un jeu

- **Première partie** — vous ne connaissez pas le jeu. On installe et on joue,
  pas à pas, matériel identifié par les images des règles.
- **Mise en place** — vous connaissez le jeu, vous voulez juste le poser
  correctement. Rien que le placement, avec les illustrations.
- **Rappel des règles** — vous y avez joué, mais il y a longtemps. Les points
  de règles dans l'ordre, résumés.

Chacun garde sa propre sauvegarde. Le nombre d'étapes est celui de l'effectif
conseillé : l'application demande combien vous êtes au démarrage, et adapte son
contenu.

Chaque jeu a son habillage — couleurs, polices, arrondis, fond clair ou
sombre — mais la mise en page ne change jamais : un joueur qui a suivi un
tutoriel sait déjà lire les autres.

## Démarrer

```bash
npm install
npm run dev
```

## Publication

GitHub Pages est réglé sur **Deploy from a branch** et publie la **racine du
dépôt** telle quelle. La racine *est* donc le site :

```
index.html, assets/        générés par `npm run build`, versionnés
games/                     pages de règles et découpes, versionnées
icon-*.png, manifest.webmanifest, sw.js, .nojekyll
app/index.html             entrée de développement (source du build)
```

Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
reconstruit `index.html` et `assets/` à chaque push, les commite s'ils ont
changé, et publie aussi l'artefact Pages — il fonctionne donc que la source
de Pages soit sur *Deploy from a branch* ou sur *GitHub Actions*, et publie le
même contenu dans les deux cas. Vous n'avez pas à lancer le build avant de
pousser. Quand le bot a commité, faites un `git pull` avant de pousser la fois
suivante.

`npm run build` reste utilisable en local ; il écrit directement à la racine.

## Installer sur l'iPad

1. Ouvrez <https://valentindrouet-dev.github.io/Tutogames/> dans Safari sur
   l'iPad. Pour un essai en local : `npm run build` puis
   `npm run preview -- --host`.
2. **Partager → Sur l'écran d'accueil**.

L'application s'ouvre alors en plein écran, sans barre de navigateur, et
fonctionne hors ligne. La progression et le chronomètre restent sur la tablette.

Sur ordinateur, **Espace** passe à l'étape suivante et **Maj + Espace** revient
à la précédente. Le bouton « Étape *n* / *m* » ouvre la liste du chapitre pour
sauter directement où l'on veut.

Le bouton réglages, en haut à droite, ajuste la taille du texte, la clarté du
fond — utile de nuit, ou quand la tablette est posée un peu loin — et l'ordre
d'affichage des jeux.

## Ajouter les visuels des règles

```bash
cp mon-jeu.pdf rules/
npm run ingest  -- rules/mon-jeu.pdf mon-jeu   # pages -> games/mon-jeu/pages/*.webp
npm run extract -- rules/mon-jeu.pdf mon-jeu   # découpes candidates, à coller dans le tutoriel
npm run crops                                   # pré-découpe ce que le tutoriel référence
```

`ingest` rend chaque page en WebP ; `extract` retrouve les visuels de chaque
composant — d'abord les images bitmap intégrées au PDF, avec leur rectangle
exact, puis les illustrations vectorielles par détection des régions d'encre ;
`crops` produit un petit fichier par découpe référencée, que l'application
charge à la place de la page entière (quelques dizaines de Ko au lieu de ~1 Mo).

Sans ces étapes, le tutoriel reste entièrement jouable : les visuels sont
remplacés par des pictogrammes. Voir [GUIDE_CREATION_TUTO.md](GUIDE_CREATION_TUTO.md).

## Ajouter un jeu

Tout le contenu d'un tutoriel tient dans un fichier de `src/games/`. Le moteur
et l'interface sont génériques et ne connaissent aucun jeu.

La démarche complète — lecture des règles, ingestion du PDF, découpe des
visuels, rédaction, contrôle avant publication — est décrite dans
**[GUIDE_CREATION_TUTO.md](GUIDE_CREATION_TUTO.md)**.

## Structure

```
src/engine/     modèle de données, navigation, sauvegarde, accès aux pages
src/ui/         écrans et composants — génériques
src/games/      un fichier par jeu : tout le contenu
tools/ingest.mjs  PDF de règles → images de pages + manifeste
games/          pages de règles et découpes pré-calculées
version.json    source unique du numéro de version
```

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Typecheck puis build à la racine du dépôt |
| `npm run preview` | Sert le build de production |
| `npm run ingest -- <pdf> <id>` | Rend les pages d'un PDF de règles |
| `npm run extract -- <pdf> <id>` | Extrait les découpes candidates du PDF |
| `npm run crops` | Pré-découpe les visuels référencés par les tutoriels |
| `npm run grid -- <pdf> <page>` | Rend une page sous une grille de coordonnées, pour repérer les découpes |

## Crédits

Les règles, textes et illustrations des jeux appartiennent à leurs éditeurs.
Nemesis est un jeu d'Adam Kwapiński édité par Awaken Realms ; le tutoriel
s'appuie sur les règles françaises (traduction Antoine Prono, relecture Funforge).
Tainted Grail : La Chute d'Avalon est un jeu de Krzysztof Piskorski et Marcin
Świerkot édité par Awaken Realms ; le tutoriel s'appuie sur les règles
françaises éditées par Edge Entertainment.
Expeditions : Après Scythe est un jeu de Jamey Stegmaier édité par Stonemaier
Games ; le tutoriel s'appuie sur les règles françaises des Éditions Matagot.
