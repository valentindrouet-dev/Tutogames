# TutoGames

Application iPad qui vous fait découvrir un jeu de société en le jouant.

Vous posez la tablette à côté de vous. Elle vous fait installer le jeu étape par
étape, puis vous accompagne pendant vos premières manches. Le matériel est
identifié par des images découpées dans le PDF des règles officielles.

**v0.22** — voir [CHANGELOG.md](CHANGELOG.md).

## Jeux disponibles

| Jeu | Éditeur | Joueurs | 1re Partie | Reprendre | Mise en Place | Règles |
|---|---|---|---|---|---|---|
| Nemesis 🇬🇧 | Awaken Realms | 1 à 5 | 65 étapes | 6 | 21 | 7 |
| Tainted Grail : La Chute d'Avalon | Awaken Realms | 1 à 4 | 92 étapes | 13 | 22 | 8 |
| Tainted Grail : Rois de la Ruine | Awaken Realms | 1 à 4 | 82 étapes | 12 | 14 | 11 |
| Expeditions : Après Scythe | Stonemaier / Matagot | 1 à 5 | 43 étapes | 6 | 13 | 8 |
| Frosthaven 🇬🇧 | Cephalofair Games | 1 à 4 | 106 étapes | 13 | 17 | 17 |
| Bitoku | Devir / IELLO | 1 à 4 | 81 étapes | 8 | 23 | 11 |
| Oathsworn : Into the Deepwood 🇬🇧 | Shadowborne Games | 1 à 4 | 144 étapes | 13 | 32 | 15 |

## Quatre façons d'ouvrir un jeu

- **1re Partie** — vous ne connaissez pas le jeu. On installe et on joue, pas à
  pas, matériel identifié par les images des règles.
- **Mise en Place** — vous connaissez le jeu, vous voulez juste le poser
  correctement. Rien que le placement, avec les illustrations.
- **Reprendre** — vous remontez une partie déjà commencée. Pour une campagne,
  la remise en place officielle d'une sauvegarde ; pour un jeu d'une séance, le
  contrôle de la table laissée montée.
- **Règles** — vous y avez joué, mais il y a longtemps. Les points de règles
  dans l'ordre, résumés.

### Les termes en anglais

Trois boîtes de la table sont en anglais : *Nemesis*, *Frosthaven* et
*Oathsworn*. Le drapeau
🇬🇧 les signale sur l'accueil, à côté de la durée. Dans le tutoriel, les mots
dont le matériel porte un autre nom sont **surlignés dans les consignes** : un
survol à la souris, une tape sur l'iPad, et la bulle donne le terme imprimé.
Le bouton **VO** du bandeau va plus loin : il **remplace le mot français par
le terme imprimé**. La phrase reste en français, seuls les noms du matériel
basculent — « Défaussez 1 Action card et déplacez votre figurine vers une Room
adjacente » —, et la bulle rappelle alors le français. Le mot est accordé à la
phrase : « les Rôdeurs » donne « les Creepers ».

La fiche du jeu porte le glossaire complet. Un jeu dont le matériel est en
français n'a ni drapeau, ni surlignage.

### Un jeu, deux livrets

*Oathsworn* coupe ses règles en deux livres : l'histoire d'un côté, la
rencontre de l'autre. C'est le même jeu sur la même table, donc un seul
tutoriel, qui suit le chapitre dans l'ordre où on le joue. La pastille sous
une découpe pleine page dit de quel livret vient la page.

Chacun garde sa propre sauvegarde de progression. Le nombre d'étapes est celui
de l'effectif conseillé : l'application demande combien vous êtes au démarrage,
et adapte son contenu.

**Le matériel porte ses propres aides de jeu.** Un composant qui existe en
plusieurs types — les six symboles des jetons Exploration de *Nemesis*, les
quatorze conditions de *Frosthaven* — affiche la liste dans sa fiche, avec le
symbole de chacun. On tape dessus en pleine partie, on lit, on referme.

### Jouer sans rouvrir le livret

Un tutoriel dit d'abord **pourquoi** on joue : où on est, comment on gagne, ce
qu'on cherche à faire tour après tour, et par quoi commencer. C'est la première
chose qu'on lit, et ça reste consultable pendant la partie.

Deux boutons du bandeau prennent le relais une fois la partie lancée :

- **Aides de jeu** — une fiche par question qu'on se pose en jouant. Pour
  *Nemesis* : l'enjeu et la victoire, l'index des 25 salles avec le coût et
  l'effet de chacune, les objets et les corps, les marqueurs et les portes, les
  moments spéciaux, et le résumé des règles de la dernière page du livret.
- **Index** — tous les mots du jeu par ordre alphabétique, avec un champ de
  recherche. 181 entrées pour *Nemesis*. Taper sur une ligne ouvre la fiche
  d'où elle vient ; les fiches s'empilent, et refermer la dernière rend la
  précédente intacte.

**Ce qui ne vient pas du livret est signalé comme tel.** Les conseils de jeu
recueillis ailleurs portent un globe, une couleur qui ne sert qu'à ça, et le
mot « hors livret ». Une règle et un conseil ne se confondent jamais.

**En solo, vous avez les règles du solo.** Ce n'est pas la même partie en moins
nombreux : le tutoriel sort le paquet d'objectifs Solo de *Nemesis*, l'Automa
d'*Expeditions*, le Tengu de *Bitoku*, la variante à deux personnages de
*Frosthaven*, et il vous épargne le jeton Premier joueur, le tour de table et
le voisin de gauche.

Chaque jeu a ses couleurs — fond clair ou sombre, accent, arrondis — mais la
mise en page et la typographie ne changent jamais : un joueur qui a suivi un
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
| `npm run merge -- <sortie> <partie>...` | Fusionne un livret livré en plusieurs PDF, dans l'ordre donné |
| `npm run extract -- <pdf> <id>` | Extrait les découpes candidates du PDF |
| `npm run crops` | Pré-découpe les visuels référencés par les tutoriels |
| `npm run grid -- <pdf> <page>` | Rend une page sous une grille de coordonnées, pour repérer les découpes |
| `npm run snap -- <jeu> [--write]` | Recale les découpes d'un tutoriel sur le bloc qu'elles visent |
| `npm run players -- [jeu]` | Montre ce que chaque effectif voit, et repère les étapes écrites pour une table pleine |
| `npm run aids` | Liste les aides de jeu du matériel, et ce qui reste à décrire |
| `npm run vo` | Contrôle les glossaires de version originale, jeu par jeu |

## Crédits

Les règles, textes et illustrations des jeux appartiennent à leurs éditeurs.
Nemesis est un jeu d'Adam Kwapiński édité par Awaken Realms ; le tutoriel
s'appuie sur les règles françaises (traduction Antoine Prono, relecture Funforge).
Tainted Grail : La Chute d'Avalon est un jeu de Krzysztof Piskorski et Marcin
Świerkot édité par Awaken Realms ; le tutoriel s'appuie sur les règles
françaises éditées par Edge Entertainment.
Expeditions : Après Scythe est un jeu de Jamey Stegmaier édité par Stonemaier
Games ; le tutoriel s'appuie sur les règles françaises des Éditions Matagot.
Frosthaven est un jeu d'Isaac Childres édité par Cephalofair Games ; le
tutoriel est une traduction des règles anglaises, livrées en trois PDF.
Bitoku est un jeu de Germán P. Millán édité par Devir ; le tutoriel s'appuie
sur les règles françaises de IELLO (traduction MeepleRules.fr).
Tainted Grail : Rois de la Ruine est un jeu de Krzysztof Piskorski et Marcin
Świerkot édité par Awaken Realms ; le tutoriel s'appuie sur les règles
françaises.
Oathsworn : Into the Deepwood est un jeu de Jamie Jolly édité par Shadowborne
Games ; le tutoriel est une traduction de ses deux livrets anglais, le « Story
Rule Book » et l'« Encounter Rule Book ». Les glossaires VO citent les livrets anglais de Nemesis, de
Frosthaven et d'Oathsworn.
