# TutoGames

Application iPad qui vous fait découvrir un jeu de société en le jouant.

Vous posez la tablette à côté de vous. Elle vous fait installer le jeu étape par
étape, puis vous accompagne pendant vos premières manches. Le matériel est
identifié par des images découpées dans le PDF des règles officielles.

**v0.04** — voir [CHANGELOG.md](CHANGELOG.md).

## Jeux disponibles

| Jeu | Éditeur | Joueurs | Chapitres | Étapes |
|---|---|---|---|---|
| Nemesis | Awaken Realms | 1 à 5 | 8 | 65 |

## Démarrer

```bash
npm install
npm run dev
```

## Publication

Le site est publié sur GitHub Pages par
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), à chaque push
sur la branche par défaut.

Le workflow construit `dist/` avec Vite et publie **uniquement ce dossier**.

> **Réglage obligatoire, une seule fois.**
> Dans **Settings › Pages** du dépôt, **Source** doit être sur
> **GitHub Actions**, et non sur *Deploy from a branch*.
>
> Tant que la source reste sur une branche, GitHub lance en parallèle son
> propre publieur Jekyll (`pages build and deployment`), qui publie la
> **racine du dépôt**. Les deux se courent après, et c'est le dernier arrivé
> qui gagne — souvent Jekyll, à quelques secondes près. Or la racine contient
> l'`index.html` de développement, dont le script pointe vers
> `/src/main.tsx` : le navigateur ne sait pas exécuter du TypeScript, donc la
> page reste blanche.
>
> Ce cas n'est plus silencieux : servie telle quelle, la racine affiche
> maintenant un message qui nomme la cause et le correctif. Si vous voyez
> « SOURCE NON CONSTRUITE » à l'écran, c'est ce réglage qu'il faut changer.

## Installer sur l'iPad

1. Ouvrez <https://valentindrouet-dev.github.io/Tutogames/> dans Safari sur
   l'iPad. Pour un essai en local : `npm run build` puis
   `npm run preview -- --host`.
2. **Partager → Sur l'écran d'accueil**.

L'application s'ouvre alors en plein écran, sans barre de navigateur, et
fonctionne hors ligne. La progression et le chronomètre restent sur la tablette.

## Ajouter les visuels des règles

Les pages de règles ne sont pas dans le dépôt : chacun ingère son propre PDF.

```bash
cp mon-jeu.pdf rules/
npm run ingest  -- rules/mon-jeu.pdf nemesis   # pages -> images
npm run extract -- rules/mon-jeu.pdf nemesis   # découpes candidates
```

`ingest` rend chaque page ; `extract` retrouve les visuels de chaque composant
— d'abord les images bitmap intégrées au PDF, avec leur rectangle exact, puis
les illustrations vectorielles par détection des régions d'encre. Il produit
des rectangles normalisés directement collables dans le tutoriel.

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
public/games/   pages ingérées (hors dépôt)
version.json    source unique du numéro de version
```

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Typecheck puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production |
| `npm run ingest -- <pdf> <id>` | Rend les pages d'un PDF de règles |
| `npm run extract -- <pdf> <id>` | Extrait les découpes candidates du PDF |

## Crédits

Les règles, textes et illustrations des jeux appartiennent à leurs éditeurs.
Nemesis est un jeu d'Adam Kwapiński édité par Awaken Realms ; le tutoriel
s'appuie sur les règles françaises (traduction Antoine Prono, relecture Funforge).
