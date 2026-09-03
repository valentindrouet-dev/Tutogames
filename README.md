# TutoGames

Application iPad qui vous fait découvrir un jeu de société en le jouant.

Vous posez la tablette à côté de vous. Elle vous fait installer le jeu étape par
étape, puis vous accompagne pendant vos premières manches. Le matériel est
identifié par des images découpées dans le PDF des règles officielles.

**v0.06** — voir [CHANGELOG.md](CHANGELOG.md).

## Jeux disponibles

| Jeu | Éditeur | Joueurs | Chapitres | Étapes |
|---|---|---|---|---|
| Nemesis | Awaken Realms | 1 à 5 | 9 | 65 |
| Tainted Grail : La Chute d'Avalon | Awaken Realms | 1 à 4 | 10 | 92 |

Le nombre d'étapes est celui de l'effectif conseillé : le tutoriel demande
combien vous êtes au démarrage, et adapte son contenu.

Chaque jeu a son habillage — couleurs, polices, arrondis — mais la mise en page
ne change jamais : un joueur qui a suivi un tutoriel sait déjà lire les autres.

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

## Crédits

Les règles, textes et illustrations des jeux appartiennent à leurs éditeurs.
Nemesis est un jeu d'Adam Kwapiński édité par Awaken Realms ; le tutoriel
s'appuie sur les règles françaises (traduction Antoine Prono, relecture Funforge).
Tainted Grail : La Chute d'Avalon est un jeu de Krzysztof Piskorski et Marcin
Świerkot édité par Awaken Realms ; le tutoriel s'appuie sur les règles
françaises éditées par Edge Entertainment.
