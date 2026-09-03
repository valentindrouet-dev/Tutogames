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
public/games/   les pages de règles ingérées, une image par page
```

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

Options : `--dpi 200 --jpeg --quality 84` est le bon réglage par défaut —
plus net qu'un PNG 150 dpi, pour un poids divisé par trois. Le livret Nemesis
passe ainsi de 78 Mo à 25 Mo.

Produit `public/games/mon-jeu/pages.json` et une image par page. Les coordonnées
de découpe étant **normalisées entre 0 et 1**, on peut ré-ingérer à une autre
résolution sans retoucher une seule découpe.

### Étape 3 — Fixer `pageOffset`

Les livrets ont presque toujours une couverture qui décale la numérotation :
la page « 2 » imprimée est souvent la 3ᵉ page du fichier.

Ouvrez `public/games/mon-jeu/pages/`, trouvez la page portant le numéro 2, et
renseignez l'écart dans `source.pageOffset`. **Une seule valeur corrige toutes
les découpes du tutoriel.** Vérifiez dans le Studio : le compteur affiche à la
fois le numéro du livret et l'index du fichier.

### Étape 4 — Recenser le matériel

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

### Étape 5 — Découper les visuels

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

**b) Studio de découpe — pour le reste.**

Ce que l'extraction n'a pas isolé proprement se trace à la main : lancez
l'application, bouton **Studio de découpe** en bas de l'accueil. Naviguez
jusqu'à la page, tracez un rectangle au doigt ou à la souris, copiez le
littéral et collez-le dans le tutoriel.

La découpe se dégrade proprement, en trois niveaux :

| État | Ce que le joueur voit |
|---|---|
| Pas de `crop` | Pictogramme + nom |
| `crop: { page: 9 }` | La page de règles entière, avec le badge « Règles p.9 » |
| `crop: { page: 9, x, y, w, h }` | Le gros plan sur l'élément |

**Un tutoriel sans aucune découpe reste entièrement jouable.** Commencez par
renseigner les numéros de page — c'est déjà utile — et affinez ensuite.

### Étape 6 — Écrire les chapitres

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

Visez **6 à 9 chapitres** et **50 à 70 étapes**. En dessous, on survole ;
au-dessus, on abandonne avant la fin.

### Étape 7 — Relire à voix haute

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

## 6. Portée : dire ce qu'on n'enseigne pas

`scope.covered` et `scope.skipped` sont affichés au joueur avant qu'il commence,
et rappelés en fin de tutoriel.

Un tutoriel qui prétend tout couvrir ment. Un tutoriel qui annonce ses limites
est utilisable : le joueur sait quand ouvrir le livret. **Remplissez toujours
`skipped`.**

---

## 7. Versionnement

Deux numéros distincts, à ne pas confondre :

| Numéro | Où | Change quand |
|---|---|---|
| Version de l'application | `version.json`, affichée sous le titre | L'application évolue |
| Version du contenu | `contentVersion` du tutoriel | Le contenu d'un tutoriel évolue |

**Application** — `version.json` est la source unique. Format `0.01`, `0.02`…
La version est affichée sous le titre sur l'accueil et sert de nom de cache au
service worker (`public/sw.js`), qu'il faut aligner à chaque publication.
Chaque changement est consigné dans `CHANGELOG.md`.

**Contenu** — incrémentez `contentVersion` dès que vous modifiez des étapes.
Les sauvegardes mémorisent la version au moment de l'enregistrement ; le moteur
ramène une position devenue invalide sur l'étape valide la plus proche
(`clampPosition`), une partie en cours n'est donc jamais cassée par une mise à
jour.

---

## 8. Contrôle avant publication

```bash
npm run build        # typecheck + build de production
npm run dev          # relecture à l'écran
```

Le site est publié automatiquement par `.github/workflows/deploy.yml` à chaque
push sur la branche par défaut. Ce workflow publie **uniquement `dist/`** : la
racine du dépôt ne doit jamais être servie telle quelle, son `index.html`
pointe vers `/src/main.tsx` et donnerait une page blanche.

- [ ] Le tutoriel se déroule du début à la fin sans étape vide.
- [ ] Chaque `warn` est un vrai piège, pas une précision.
- [ ] Aucun texte ne répète le libellé d'un bouton.
- [ ] Tous les `components` cités par une étape existent dans la liste.
- [ ] Les numéros de page des `ref` correspondent à l'édition ingérée.
- [ ] `scope.skipped` est rempli.
- [ ] Accents et guillemets français vérifiés.
- [ ] `contentVersion` incrémentée si le contenu a changé.
- [ ] `CHANGELOG.md` et ce guide mis à jour.

---

## 9. Droits sur les visuels

Les pages ingérées sont l'œuvre de l'éditeur. `public/games/` est **exclu du
dépôt** (voir `.gitignore`) : chacun ingère son propre PDF. Ne redistribuez pas
les pages de règles sans l'accord de l'éditeur ; `source.credit` doit toujours
créditer la source, et il est affiché au joueur dans la fiche du jeu.

---

## 10. Journal du guide

| Date | Version app | Modification |
|---|---|---|
| 2026-09-03 | v0.01 | Création du guide, en même temps que le tutoriel Nemesis. |
| 2026-09-03 | v0.02 | Ajout de `npm run extract` (images intégrées + régions d'encre) en amont du Studio, et de la section « Publication ». |
| 2026-09-03 | v0.03 | Première application réelle sur Nemesis : 36 découpes de matériel et 10 schémas d'exemple. Ingestion recommandée en JPEG 200 dpi. |
