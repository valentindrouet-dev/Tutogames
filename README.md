# TutoGames

Application iPad qui vous fait découvrir un jeu de société en le jouant.

Vous posez la tablette à côté de vous. Elle vous fait installer le jeu étape par
étape, puis vous accompagne pendant vos premières manches. Le matériel est
identifié par des images découpées dans le PDF des règles officielles.

**v0.01** — voir [CHANGELOG.md](CHANGELOG.md).

## Jeux disponibles

| Jeu | Éditeur | Joueurs | Chapitres | Étapes |
|---|---|---|---|---|
| Nemesis | Awaken Realms | 1 à 5 | 8 | 65 |

## Démarrer

```bash
npm install
npm run dev
```

## Installer sur l'iPad

1. `npm run build`, puis servez le dossier `dist/` sur le réseau local
   (`npm run preview -- --host` suffit pour un essai).
2. Ouvrez l'adresse dans Safari sur l'iPad.
3. **Partager → Sur l'écran d'accueil**.

L'application s'ouvre alors en plein écran, sans barre de navigateur, et
fonctionne hors ligne. La progression et le chronomètre restent sur la tablette.

## Ajouter les visuels des règles

Les pages de règles ne sont pas dans le dépôt : chacun ingère son propre PDF.

```bash
cp mon-jeu.pdf rules/
npm run ingest -- rules/mon-jeu.pdf nemesis
```

Sans cette étape, le tutoriel reste entièrement jouable : les visuels sont
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
| `npm run ingest -- <pdf> <id>` | Ingère un PDF de règles |

## Crédits

Les règles, textes et illustrations des jeux appartiennent à leurs éditeurs.
Nemesis est un jeu d'Adam Kwapiński édité par Awaken Realms ; le tutoriel
s'appuie sur les règles françaises (traduction Antoine Prono, relecture Funforge).
