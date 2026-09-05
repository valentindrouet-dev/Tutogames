# Dossier des règles

Déposez ici les PDF de règles à ingérer, puis lancez :

```bash
npm run ingest -- rules/<fichier>.pdf <identifiant-du-jeu>
```

Les PDF appartiennent à leurs éditeurs et ne sont pas versionnés par défaut
(`.gitignore`). Ceux présents ici ont été ajoutés volontairement par le
propriétaire du dépôt :

| Fichier | Tutoriel |
|---|---|
| `Nemesis - Regles.pdf` | `src/games/nemesis.ts` |
| `Tainted Grail - Regles.pdf` | `src/games/taintedgrail.ts` |
| `Expeditions - Regles FR.pdf` | `src/games/expeditions.ts` |
| `Frosthaven_Rules_-_Part_1.pdf`, `_Part_2.pdf`, `_Part_3.pdf` | `src/games/frosthaven.ts`, après fusion en `Frosthaven - Regles.pdf` par `npm run merge` (fichier local, non versionné) |
| `Bitoku_Rulebook_FR_V1_Light.pdf` | `src/games/bitoku.ts` |
| `Tainted Grail Rois de la Ruine - Regles.pdf` | `src/games/taintedgrailkor.ts` |
| `Nemesis - Rules VO.pdf` | Aucun tutoriel : c'est la source du glossaire VO de `src/games/nemesis.ts`. |
| `Oathsworn - Rules 1.pdf` … `Rules 4.pdf` | `src/games/oathsworn.ts`, après fusion en `Oathsworn - Regles.pdf` par `npm run merge` (fichier local, non versionné) |
| `Oathsworn - Encounters 1.pdf` … `Encounters 7.pdf` | `src/games/oathsworn.ts`, second livret, après fusion en `Oathsworn - Rencontre.pdf` par `npm run merge` (fichier local, non versionné) |

Le nom du fichier attendu est déclaré dans `source.pdf` du tutoriel : c'est là
que `npm run crops` va chercher le PDF pour rendre les découpes. Un jeu livré
en deux livrets — *Oathsworn* — déclare le second dans `source.books`, avec son
propre PDF et son propre dossier d'assets.

Voir `GUIDE_CREATION_TUTO.md` à la racine du dépôt.
