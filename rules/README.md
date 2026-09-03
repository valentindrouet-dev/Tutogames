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

Le nom du fichier attendu est déclaré dans `source.pdf` du tutoriel : c'est là
que `npm run crops` va chercher le PDF pour rendre les découpes.

Voir `GUIDE_CREATION_TUTO.md` à la racine du dépôt.
