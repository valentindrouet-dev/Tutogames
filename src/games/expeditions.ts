/**
 * Expeditions : Après Scythe — première partie tutorielle.
 *
 * Source : « Expeditions — Livret de Règles », édition française (Matagot,
 * traduction Raphaël Biolluz), Stonemaier Games. Les numéros de page du
 * champ `ref` et des découpes sont ceux imprimés sur le livret, qui
 * coïncident ici avec l'index des pages du PDF (pageOffset 0).
 *
 * Périmètre : le tutoriel installe la partie, apprend le tour à trois
 * actions et les quatre récompenses qui font gagner, puis le décompte.
 * Le mode solo se joue contre l'Automa, dont les règles sont dans un
 * livret séparé : il est signalé, pas enseigné.
 */

import type { Tutorial } from '../engine/types'

export const expeditions: Tutorial = {
  id: 'expeditions',
  title: 'Expeditions',
  tagline:
    'Une météorite est tombée en Sibérie et a réveillé un mal ancien. Vous menez votre propre expédition, en Mecha, pour en revenir couvert de gloire.',
  contentVersion: '2.0',
  publisher: 'Stonemaier Games / Matagot',
  author: 'Jamey Stegmaier',
  players: {
    min: 1,
    max: 5,
    recommended: 3,
    labels: { 1: 'Solo' },
    notes: {
      1: 'Le solo se joue contre l’Automa, qui a son propre livret. Ce tutoriel installe la partie et enseigne les règles, mais ne détaille pas l’Automa.',
      2: 'À deux, la course aux jetons Gloire est directe : surveillez le Campement à chaque tour adverse.',
      5: 'À cinq, les cartes centrales tournent vite. Ce que vous convoitez ne sera plus là à votre tour suivant.',
    },
  },
  minutes: 75,

  // Acier et neige de Sibérie, ambre des jetons Action. Titres condensés en
  // capitales, comme les intertitres du livret.
  theme: {
    bg: '#0d1519',
    bg2: '#142026',
    bg3: '#1d2c34',
    stroke: '#2d424c',
    strokeSoft: '#213139',
    fg: '#eaf1f4',
    fgDim: '#9db1ba',
    fgFaint: '#6d838d',
    accent: '#e08a2e',
    accent2: '#c2452b',
    accentInk: '#140b02',
    radius: '10px',
  },

  source: {
    pdf: 'Expeditions - Regles FR.pdf',
    assetId: 'expeditions',
    pageOffset: 0,
    credit: 'Règles officielles FR — Stonemaier Games / Éditions Matagot',
  },

  cover: { page: 1, x: 0.03, y: 0.045, w: 0.94, h: 0.243 },

  scope: {
    covered: [
      'La mise en place du pupitre et du plateau, des deux listes officielles',
      'Le jeton Action : pourquoi un tour vaut deux actions, parfois trois',
      'Déplacer, Jouer, Récolter, Renouveler',
      'Lire une carte : valeur base, conditions, capacité, couleur d’ouvrier',
      'Révéler un lieu, y tirer sa Corruption, et la combattre',
      'Résoudre une quête, améliorer un objet, fondre une météorite',
      'Fanfaronner et les huit catégories de Gloire',
      'Les icônes de récompense : sauver, balayer, renouveler, emprunter à un lieu voisin',
      'Les capacités des cinq Mechas, une par une',
      'Le déclenchement de la fin de partie et le décompte',
      'Les récompenses, le tour, la Gloire et les Mechas en aides de jeu consultables en partie',
    ],
    skipped: [
      'Le comportement de l’Automa en solo, qui a son propre livret dans la boîte',
      'Le texte des cartes Quête, Objet, Météorite et Personnage, qui se lit quand elles sortent',
      'La feuille Résultats, qui est un carnet de records et non une règle',
    ],
  },

  /**
   * L'enjeu du jeu, avant les règles.
   *
   * Expeditions se lit vite mais se comprend mal : on voit bien qu'on gagne
   * des ressources, beaucoup moins pourquoi. Tout tient dans une phrase —
   * on ne gagne pas en accumulant, on gagne en **transformant** ce qu'on
   * accumule en jetons Gloire, et le plus tôt possible.
   */
  brief: {
    pitch: [
      'Sibérie, 1925. Une météorite s’est écrasée près de la Tunguska et a réveillé une corruption ancienne. Deux expéditions sont parties l’étudier ; aucune n’est revenue.',
      'Vous êtes un héros de guerre qui finance la sienne. Vous partez du Campement à bord d’un Mecha, avec un Personnage, un Compagnon et rien d’autre.',
      'Le plateau se découvre en marchant : chaque tuile Lieu se retourne quand un Mecha y entre, et sort du sac la Corruption qui l’occupe.',
    ],
    win: [
      'Le plus riche gagne. Tout se compte en pièces à la fin, et rien d’autre ne compte.',
      'Quatre sources : les jetons Gloire, les pièces gagnées en jeu, les Objets améliorés, et 2 $ par jeton Corruption.',
      'Les jetons Gloire pèsent le plus lourd, et leur valeur dépend de vos quêtes : 5, 6, 8 ou 10 $ pièce pour 0, 1, 2 ou 3 quêtes résolues.',
      'À égalité, c’est le joueur qui totalise le plus dans les catégories Gloire qui l’emporte — y compris celles où il n’a posé aucune étoile.',
    ],
    doing: [
      'Vos cartes fabriquent deux ressources : la Puissance et la Ruse. Elles ne valent rien en fin de partie — ce sont des munitions, pas des points.',
      'Vous les dépensez pour Combattre la Corruption, pour Résoudre des quêtes, et ce sont ces gestes-là qui remplissent les catégories Gloire.',
      'Fanfaronner transforme une catégorie remplie en jeton Gloire. C’est la seule action qui marque vraiment.',
      'Résoudre des quêtes tôt vaut double : chaque quête résolue augmente ce que rapportent TOUS vos jetons Gloire, y compris ceux déjà posés.',
      'Tout votre tour est une question de rythme : le jeton Action vous impose d’alterner, et il faut savoir quand tout renouveler.',
    ],
    traps: [
      'Empiler Puissance et Ruse sans jamais les dépenser. Elles plafonnent à 10 chacune, et ne valent pas un centime au décompte.',
      'Poser sa quatrième Gloire trop tôt : elle déclenche la fin de partie, et chacun joue encore un dernier tour. Le déclencheur n’est pas forcément le vainqueur.',
      'Fanfaronner avant d’avoir résolu ses quêtes : la Gloire est posée à 5 $ et ne remonte que si vous résolvez ensuite — donc résolvez d’abord.',
      'Oublier qu’un lieu ne rend sa récompense Améliorer, Fondre ou Fanfaronner qu’une fois toute sa Corruption retirée.',
    ],
    first: [
      'Regardez le Campement avant votre premier tour : les sept catégories vous disent ce que le jeu récompense. Choisissez-en deux ou trois, pas sept.',
      'Le premier tour donne les trois actions. Servez-vous-en pour aller loin, pas pour grappiller à côté du Campement.',
      'Une quête résolue vaut plus qu’une quête gardée en main : elle remonte la valeur de toutes vos étoiles, présentes et à venir.',
      'Renouveler n’est pas un tour perdu : votre rang actif est votre main de demain, et une main vide n’a rien à jouer.',
      'La Corruption est le seul point qui se ramasse par paquets. Deux jetons valent une Gloire de plus si vous atteignez sept.',
    ],
    extSource: 'guides de jeu en ligne',
  },

  aids: [
    {
      id: 'enjeu',
      title: 'L’enjeu et le décompte',
      lead: 'Ce qui rapporte des pièces, et ce qui n’en rapporte pas.',
      icon: 'goal',
      groups: [
        {
          title: 'Le décompte final',
          lead: 'Tout se compte en pièces. Le plus riche gagne.',
          entries: [
            {
              id: 'sc-gloire',
              term: 'Jetons Gloire',
              cost: '5 à 10 $ pièce',
              body: [
                'Chaque jeton Gloire posé sur le Campement rapporte selon le nombre de Quêtes que vous avez résolues.',
                '0 quête : 5 $. 1 quête : 6 $. 2 quêtes : 8 $. 3 quêtes ou plus : 10 $.',
              ],
              note: 'La valeur s’applique à tous vos jetons, y compris ceux posés avant la quête.',
              ref: 'Fin de partie — p.13',
            },
            {
              id: 'sc-pieces',
              term: 'Pièces',
              cost: 'valeur faciale',
              body: ['La somme de vos pièces à la fin de la partie.'],
              ref: 'Fin de partie — p.13',
            },
            {
              id: 'sc-objets',
              term: 'Objets améliorés',
              body: ['Chaque Objet amélioré rapporte la valeur imprimée en bas à droite de sa carte.'],
              ref: 'Fin de partie — p.13',
            },
            {
              id: 'sc-corruption',
              term: 'Jetons Corruption',
              cost: '2 $ pièce',
              body: [
                'Chacun de vos jetons Corruption rapporte 2 $, celui de valeur 20 compris.',
                'Ignorez au décompte les valeurs imprimées sur les jetons.',
              ],
              ref: 'Fin de partie — p.13',
            },
            {
              id: 'sc-rien',
              term: 'Ce qui ne rapporte rien',
              body: [
                'La Puissance et la Ruse restantes. Les Ouvriers. Les jetons Plan. Les cartes en main.',
                'Ce sont des moyens, pas des points.',
              ],
              warn: 'Une piste de Puissance à 10 en fin de partie, c’est 10 points de dépense qu’on n’a pas faits.',
              ref: 'Fin de partie — p.13',
            },
            {
              id: 'sc-egalite',
              term: 'Égalité',
              body: [
                'Le joueur à égalité qui totalise le plus dans les catégories Gloire l’emporte.',
                'On compte alors toutes les catégories, même celles où il n’a pas d’étoile.',
                'Si l’égalité persiste, victoire partagée.',
              ],
              ref: 'Fin de partie — p.13',
            },
          ],
        },
        {
          title: 'Les catégories de Gloire',
          lead: 'Huit cases sur le Campement, sept catégories : Ouvriers et jetons Plan n’en font qu’une.',
          entries: [
            { id: 'ct-quetes', term: 'Résoudre 4 Quêtes', body: ['Quatre cartes Quête glissées sous le bord supérieur de votre pupitre.'], ref: 'Catégories Gloire — p.11' },
            { id: 'ct-meteorites', term: 'Fondre 4 Météorites', body: ['Quatre cartes Météorite glissées sous le bord inférieur de votre pupitre.'], ref: 'Catégories Gloire — p.11' },
            { id: 'ct-objets', term: 'Améliorer 4 Objets', body: ['Quatre cartes Objet glissées sous le bord droit de votre pupitre.'], ref: 'Catégories Gloire — p.11' },
            {
              id: 'ct-lieu20',
              term: 'Combattre la Corruption du Lieu 20',
              body: ['Le Lieu 20 ne porte qu’un seul jeton, de valeur 20. Il a sa catégorie à lui.'],
              ref: 'Catégories Gloire — p.11',
            },
            {
              id: 'ct-corruption',
              term: 'Posséder au moins 7 jetons Corruption',
              body: ['Le jeton du Lieu 20 ne compte pas dans ce total.'],
              ref: 'Catégories Gloire — p.11',
            },
            {
              id: 'ct-cartes',
              term: 'Contrôler au moins 8 cartes',
              body: [
                'Vos cartes en main et dans votre rang actif.',
                'Les cartes résolues, fondues ou améliorées ne comptent pas : elles ne sont plus contrôlées.',
              ],
              ref: 'Catégories Gloire — p.11',
            },
            {
              id: 'ct-ouvriers',
              term: 'Posséder 7 Ouvriers, ou 5 jetons Plan',
              body: ['Deux cases sur le plateau, une seule Gloire : réussir les deux ne rapporte qu’un jeton.'],
              ref: 'Catégories Gloire — p.11',
            },
          ],
        },
      ],
    },

    {
      id: 'actions',
      title: 'Le tour et les actions',
      lead: 'Ce que le jeton Action autorise, et ce que chaque action fait.',
      icon: 'summary',
      groups: [
        {
          title: 'Le jeton Action',
          entries: [
            {
              id: 'ac-tour',
              term: 'Un tour ordinaire',
              body: [
                'Glissez votre jeton Action pour couvrir Déplacer, Jouer OU Récolter.',
                'Effectuez les 2 actions restées visibles, dans l’ordre de votre choix.',
                'Le jeton reste là jusqu’à votre prochain tour Renouveler.',
              ],
              warn: 'Vous devez faire toutes les actions visibles que vous pouvez faire — ce n’est pas au choix.',
              ref: 'Déroulement — p.4',
            },
            {
              id: 'ac-triple',
              term: 'Le tour à trois actions',
              body: [
                'Quand votre jeton Action est dans la case Renouveler au début du tour — au premier tour, et après chaque Renouveler.',
                'Glissez-le dans la case vide, puis faites Déplacer, Jouer ET Récolter dans l’ordre de votre choix.',
              ],
              ref: 'Déroulement — p.4',
            },
            {
              id: 'ac-renouveler',
              term: 'Renouveler',
              body: [
                'Tour Renouveler : glissez votre jeton depuis Déplacer, Jouer ou Récolter sur la case Renouveler. C’est tout votre tour.',
                'Replacez sur votre pupitre les Ouvriers posés sur vos cartes actives, puis reprenez toutes vos cartes actives en main.',
              ],
              warn: 'On ne peut Renouveler que si le jeton couvrait Déplacer, Jouer ou Récolter au début du tour.',
              note: 'Une récompense Renouveler, elle, rend cartes et Ouvriers sans déplacer le jeton Action.',
              ref: 'Renouveler — p.12',
            },
          ],
        },
        {
          title: 'Les trois actions',
          entries: [
            {
              id: 'ac-deplacer',
              term: 'Déplacer',
              body: [
                'Déplacez votre Mecha dans un autre Lieu vide, à Portée de 1 à 3 Lieux.',
                'Vous pouvez traverser des Lieux occupés ; ils comptent dans la distance.',
                'Vous devez terminer ailleurs qu’au départ, et jamais sur une carte centrale.',
              ],
              warn: 'Une fois le Campement quitté, on n’y revient pas : ce n’est pas un Lieu.',
              note: 'Aucune destination valide ? Ne bougez pas, l’action est simplement passée.',
              ref: 'Déplacer — p.5',
            },
            {
              id: 'ac-jouer',
              term: 'Jouer',
              body: [
                'Posez 1 carte de votre main à droite de votre rang actif.',
                'Dans l’ordre que vous voulez : gagnez sa Valeur Base (coin supérieur gauche), et/ou posez 1 Ouvrier de la couleur demandée pour activer sa capacité.',
                'Les deux sont facultatifs.',
              ],
              warn: 'Puissance et Ruse plafonnent à 10 chacune. Au-delà, le surplus est perdu.',
              note: 'Une carte ne porte jamais plus d’un Ouvrier. « Précédent » désigne la carte immédiatement à gauche dans le rang actif.',
              ref: 'Jouer — p.6',
            },
            {
              id: 'ac-recolter',
              term: 'Récolter',
              body: [
                'Gagnez les récompenses visibles du Lieu où se trouve votre Mecha, lues au bas de la tuile.',
                'Un symbole « / » veut dire « ou » : ne prenez que les récompenses d’un seul côté.',
              ],
              ref: 'Récolter — p.9',
            },
          ],
        },
        {
          title: 'Les capacités qui marquent',
          lead: 'Elles viennent des cartes et des Lieux, pas du tour de base.',
          entries: [
            {
              id: 'ac-combattre',
              term: 'Combattre',
              body: [
                'Payez le coût du jeton Corruption le plus haut du Lieu où vous êtes — orange coûte de la Puissance, turquoise de la Ruse.',
                'Prenez ce jeton sur votre pupitre. Vous pouvez enchaîner tant que vous pouvez payer.',
                'Retirer le dernier jeton d’un Lieu révèle sa récompense cachée : Améliorer, Fondre ou Fanfaronner.',
              ],
              warn: 'Le Lieu 20 est le seul dont le jeton se paie en mélangeant les deux : 10 Puissance ET 10 Ruse.',
              note: 'Un jeton Corruption détruit sans être gagné retourne dans le sac.',
              ref: 'Combattre — p.8',
            },
            {
              id: 'ac-resoudre',
              term: 'Résoudre',
              body: [
                'Votre Mecha doit être sur le Lieu indiqué par la carte Quête que vous contrôlez.',
                'Payez le coût inscrit à droite de la carte, gagnez la récompense en dessous.',
                'Glissez la Quête sous le bord supérieur de votre pupitre, sous les précédentes.',
              ],
              warn: 'Quatre Quêtes résolues au maximum. La Corruption sur le Lieu n’empêche pas de Résoudre.',
              note: 'Chaque quête résolue augmente ce que vaut chacun de vos jetons Gloire, même ceux déjà posés.',
              ref: 'Résoudre — p.8',
            },
            {
              id: 'ac-ameliorer',
              term: 'Améliorer',
              body: [
                'Glissez 1 carte Objet sous le bord droit de votre pupitre, sous les précédentes, en ne laissant voir que sa capacité.',
                'Sa partie continue est active pour le reste de la partie. Ses récompenses instantanées, elles, sont ignorées.',
              ],
              warn: 'Quatre Objets améliorés au maximum. La récompense Améliorer d’un Lieu n’apparaît qu’une fois sa Corruption retirée.',
              note: 'Un Ouvrier posé sur la carte revient sur votre pupitre, immédiatement disponible.',
              ref: 'Améliorer — p.10',
            },
            {
              id: 'ac-fondre',
              term: 'Fondre',
              body: [
                'Glissez 1 carte Météorite sous le bord inférieur de votre pupitre, tournée à 90°, en ne laissant voir que son bonus.',
                'Gagnez aussitôt le bonus Fondre de TOUTES vos Météorites fondues, la nouvelle comprise.',
              ],
              warn: 'Quatre Météorites fondues au maximum.',
              note: 'Posséder 1 puis 2 Météorites fondues débloque les effets « 1 » et « 2 » des cartes Météorite que vous jouez.',
              ref: 'Fondre — p.10',
            },
            {
              id: 'ac-fanfaronner',
              term: 'Fanfaronner',
              body: [
                'Choisissez sur le Campement 1 catégorie dont vous avez atteint l’objectif et où vous n’avez pas déjà d’étoile.',
                'Posez-y un jeton Gloire à votre couleur.',
              ],
              warn: 'Les jetons des autres joueurs ne vous bloquent pas. Le 4ᵉ jeton Gloire posé déclenche la fin de partie.',
              ref: 'Fanfaronner — p.10',
            },
          ],
        },
      ],
    },

    {
      id: 'recompenses',
      title: 'Lire une récompense',
      lead: 'Les icônes des tuiles Lieu et des cartes, une par une.',
      icon: 'markers',
      groups: [
        {
          title: 'Gagner du matériel',
          entries: [
            {
              id: 'rc-carte',
              term: 'Gagner une carte',
              body: [
                'La carte arrive le plus à droite de votre rang actif, pas dans votre main.',
                'Certaines récompenses donnent la carte du dessus de la Pioche ; d’autres font piocher 2 cartes et en garder 1, la seconde partant face visible dans le Tas.',
              ],
              note: 'Pioche vide ? Mélangez le Tas pour en faire une nouvelle. Le Highlander, lui, prend ses cartes gagnées en main.',
              ref: 'Récolter — p.9',
            },
            {
              id: 'rc-centrale',
              term: 'Carte centrale',
              body: [
                'Les 5 cartes face visible posées entre les Lieux.',
                'Une carte centrale « adjacente » est adjacente au Lieu où se trouve votre Mecha.',
                'Chaque carte centrale gagnée est aussitôt remplacée par le dessus de la Pioche.',
              ],
              ref: 'Récolter — p.9 · Jouer — p.6',
            },
            {
              id: 'rc-ouvrier',
              term: 'Gagner un Ouvrier',
              body: [
                'Prenez-le dans la Réserve et posez-le sur votre pupitre : il est « disponible ».',
                'Les Ouvriers sont limités à 10 par couleur. Réserve vide dans cette couleur, rien ne se passe.',
              ],
              ref: 'Récolter — p.9',
            },
            {
              id: 'rc-plan',
              term: 'Jeton Plan',
              body: [
                'Gagné en révélant un Lieu face cachée, et par certaines récompenses.',
                'Il ne vaut rien en pièces. Cinq d’entre eux valent une catégorie Gloire.',
              ],
              note: 'Les jetons Plan sont en nombre limité dans la Réserve.',
              ref: 'Déplacer — p.5 · Récolter — p.10',
            },
          ],
        },
        {
          title: 'Manipuler ses cartes',
          entries: [
            {
              id: 'rc-balayer',
              term: 'Balayer',
              body: [
                'Choisissez autant de cartes centrales que vous voulez parmi les 5 et mettez-les au Tas.',
                'Remplacez-les une par une par le dessus de la Pioche.',
              ],
              ref: 'Récolter — p.9',
            },
            {
              id: 'rc-sauver',
              term: 'Sauver',
              body: [
                'Reprenez en main 1 carte de votre rang actif.',
                'L’Ouvrier qui s’y trouvait revient sur votre pupitre.',
              ],
              ref: 'Récolter — p.9',
            },
            {
              id: 'rc-renouveler',
              term: 'Récompense Renouveler',
              body: [
                'Reprenez vos Ouvriers et vos cartes actives, comme au tour Renouveler.',
                'Mais ne glissez PAS votre jeton Action : votre tour continue.',
              ],
              ref: 'Récolter — p.9',
            },
            {
              id: 'rc-jouer',
              term: 'Jouer 1 carte de sa main',
              body: ['Toutes les règles ordinaires de l’action Jouer s’appliquent.'],
              ref: 'Récolter — p.9',
            },
          ],
        },
        {
          title: 'Emprunter à côté',
          entries: [
            {
              id: 'rc-adjacent',
              term: 'Récompense d’un Lieu adjacent',
              body: [
                'Gagnez 1 seule des icônes de ce Lieu.',
                'Le symbole « / » ne vous limite pas ici : vous choisissez librement.',
              ],
              ref: 'Récolter — p.9',
            },
            {
              id: 'rc-capacite',
              term: 'Activer la capacité d’une carte adjacente',
              body: [
                'Vise les cartes centrales. Vous ne posez pas d’Ouvrier dessus.',
                'Un effet continu ainsi activé ne dure que jusqu’à la fin de ce tour.',
              ],
              ref: 'Récolter — p.9',
            },
          ],
        },
        {
          title: 'Découvrir un Lieu',
          entries: [
            {
              id: 'rc-revelation',
              term: 'Entrer sur un Lieu face cachée',
              body: [
                'Votre déplacement s’arrête là. Puis, dans l’ordre :',
                '1. Gagnez le jeton Plan posé sur le Lieu.',
                '2. Retournez la tuile face visible.',
                '3. Tirez des jetons Corruption du sac, un par un, empilés face visible, jusqu’à atteindre le niveau de Corruption imprimé du Lieu.',
              ],
              warn: 'Le Lieu 20 est l’exception : on y pose le jeton de valeur 20 au lieu de piocher.',
              note: 'Sac vide en cours de tirage : arrêtez, le Lieu reste en l’état.',
              ref: 'Déplacer — p.5',
            },
            {
              id: 'rc-cachee',
              term: 'Récompense cachée d’un Lieu',
              body: [
                'Chaque Lieu du Centre et du Nord a une de ses récompenses recouverte par la Corruption.',
                'C’est toujours Améliorer, Fondre ou Fanfaronner. Elle n’est récoltable qu’une fois le dernier jeton Corruption retiré.',
              ],
              ref: 'Récolter — p.10',
            },
          ],
        },
      ],
    },

    {
      id: 'mechas',
      title: 'Les cinq Mechas',
      lead: 'Chaque Mecha a une capacité continue, active toute la partie.',
      icon: 'items',
      groups: [
        {
          entries: [
            {
              id: 'me-tatanka',
              term: 'Tatanka',
              body: ['Vous pouvez Résoudre, Améliorer et Fondre jusqu’à 5 fois chacun, au lieu de 4.'],
              ref: 'Capacités de Mecha — p.12',
            },
            {
              id: 'me-arpenteur',
              term: 'Arpenteur des marais',
              body: ['La Portée de vos déplacements est de 1 à 4 Lieux, au lieu de 1 à 3.'],
              ref: 'Capacités de Mecha — p.12',
            },
            {
              id: 'me-odin',
              term: 'La Colère d’Odin',
              body: ['À tout moment de votre tour, détruisez 1 jeton Plan de votre pupitre pour gagner 1 Puissance, 1 Ruse ou 1 $.'],
              note: 'Les jetons Plan n’ont aucune valeur en pièces : c’est le seul Mecha qui sait les convertir.',
              ref: 'Capacités de Mecha — p.12',
            },
            {
              id: 'me-bucheron',
              term: 'Bûcheron',
              body: [
                'Chaque fois que vous Combattez, réduisez de 1 le coût du PREMIER jeton Corruption de chaque couleur.',
                'Le jeton de valeur 20 du Lieu 20 tombe donc à 18.',
              ],
              note: 'Deuxième jeton orange dans le même Combattre : plein tarif. C’est bien un rabais par couleur, pas par jeton.',
              ref: 'Capacités de Mecha — p.12',
            },
            {
              id: 'me-highlander',
              term: 'Highlander',
              body: ['Les cartes que vous gagnez arrivent dans votre main, et non dans votre rang actif.'],
              ref: 'Capacités de Mecha — p.12',
            },
          ],
        },
      ],
    },
  ],

  index: [
    {
      term: 'Portée',
      body: [
        'La distance d’un déplacement : 1 à 3 Lieux par défaut, 1 à 4 pour l’Arpenteur des marais.',
        'Les Lieux traversés comptent, occupés ou non.',
      ],
      ref: 'Déplacer — p.5',
    },
    {
      term: 'Rang actif',
      body: [
        'Les cartes posées à droite de votre pupitre. Elles restent dans l’ordre où elles ont été jouées.',
        'Toute carte qui y arrive — jouée, gagnée ou défaussée — se place le plus à droite.',
      ],
      ref: 'Jouer — p.6',
    },
    {
      term: 'Précédent',
      body: ['La carte immédiatement à gauche dans votre rang actif.'],
      ref: 'Jouer — p.6',
    },
    {
      term: 'Valeur Base',
      body: [
        'Le chiffre en haut à gauche d’une carte : la Puissance et/ou la Ruse qu’elle donne quand on la joue.',
        'Certaines cartes en donnent davantage si vous avez assez de Gloire ou de Météorites fondues.',
      ],
      ref: 'Jouer — p.6',
    },
    {
      term: 'Couleur d’une carte',
      body: ['C’est la couleur de l’Ouvrier imprimé dans son coin inférieur gauche : bleu, rouge, vert, jaune ou violet.'],
      ref: 'Jouer — p.6',
    },
    {
      term: 'Cartes que vous contrôlez',
      body: [
        'Vos cartes en main et celles de votre rang actif.',
        'Une carte résolue, fondue ou améliorée n’est plus contrôlée : elle est glissée sous le pupitre.',
      ],
      ref: 'Jouer — p.6 · Catégories Gloire — p.11',
    },
    {
      term: 'Tas',
      body: ['La défausse commune, à côté de la Pioche. Pioche vide, on mélange le Tas pour en refaire une.'],
      ref: 'Récolter — p.9',
    },
    {
      term: 'Réserve',
      body: ['Les Ouvriers et les jetons Plan disponibles au centre de la table. Les Ouvriers sont limités à 10 par couleur.'],
      ref: 'Récolter — p.9',
    },
    {
      term: 'Campement',
      body: [
        'Le point de départ de tous les Mechas, et le tableau des catégories de Gloire.',
        'Il est adjacent à 3 Lieux. Une fois quitté, on n’y revient jamais : ce n’est pas un Lieu.',
      ],
      ref: 'Déplacer — p.5',
    },
    {
      term: 'Lieu 20',
      body: [
        'Le seul Lieu dont la Corruption est un unique jeton de valeur 20, payé en 10 Puissance ET 10 Ruse.',
        'Il a sa propre catégorie de Gloire, et vaut 2 $ comme tout jeton Corruption.',
      ],
      ref: 'Combattre — p.8',
    },
    {
      term: 'Puissance',
      aliases: ['Ruse'],
      body: [
        'Les deux ressources du jeu, suivies sur la piste de votre pupitre. Plafond : 10 chacune.',
        'Elles servent à Combattre et à Résoudre. Elles ne valent rien au décompte.',
      ],
      ref: 'Jouer — p.6',
    },
    {
      term: 'Mode solo',
      body: [
        'Expeditions se joue seul contre un Automa, décrit dans un livret séparé fourni avec la boîte.',
        'Ce tutoriel installe la partie et déroule les règles communes ; le comportement de l’Automa se lit dans son livret.',
      ],
      ref: 'Livret Automa',
    },
  ],

  /* ------------------------------------------------------------ matériel */

  components: [
    {
      id: 'campement',
      name: 'Plateau Campement',
      qty: '1 plateau',
      note: 'Le point de départ de tous les Mechas, et le tableau des huit catégories de Gloire.',
      glyph: 'board',
      tint: '#e08a2e',
      crop: { page: 1, x: 0.05, y: 0.606, w: 0.3, h: 0.036 },
    },
    {
      id: 'pupitres',
      name: 'Pupitres',
      qty: '5 pupitres',
      note: 'Votre tableau de bord. On glisse des cartes sous ses quatre bords : quêtes en haut, améliorations à droite, météorites en bas.',
      glyph: 'board',
      crop: { page: 1, x: 0.05, y: 0.642, w: 0.28, h: 0.046 },
    },
    {
      id: 'lieux',
      name: 'Tuiles Lieu',
      qty: '20 tuiles',
      note: '6 Sud, 7 Centre, 7 Nord. Les Sud commencent face visible ; les autres se révèlent en y entrant.',
      glyph: 'tile',
      crop: { page: 1, x: 0.05, y: 0.69, w: 0.3, h: 0.04 },
    },
    {
      id: 'mechas',
      name: 'Figurines Mecha',
      qty: '5 figurines',
      note: 'Une par pupitre. Chaque Mecha a une capacité continue, active toute la partie.',
      glyph: 'figure',
      tint: '#e08a2e',
      crop: { page: 1, x: 0.05, y: 0.735, w: 0.28, h: 0.041 },
    },
    {
      id: 'anneaux',
      name: 'Anneaux de socle',
      qty: '5 anneaux',
      note: 'Vous choisissez votre couleur en clipsant un anneau sous votre Mecha.',
      glyph: 'token',
      crop: { page: 1, x: 0.05, y: 0.778, w: 0.27, h: 0.034 },
    },
    {
      id: 'ouvriers',
      name: 'Meeples Ouvrier',
      qty: '50 meeples',
      note: '10 de chaque couleur. Rouge : soldat. Bleu : ingénieur. Vert : explorateur. Jaune : marchand. Violet : possédé.',
      glyph: 'meeple',
      tint: '#e08a2e',
      crop: { page: 1, x: 0.05, y: 0.813, w: 0.28, h: 0.058 },
    },
    {
      id: 'depart',
      name: 'Cartes Départ',
      qty: '12 cartes',
      note: 'Six Personnages et six Compagnons, appairés par un chiffre romain. Vous démarrez avec une paire.',
      glyph: 'card',
      crop: { page: 1, x: 0.35, y: 0.604, w: 0.25, h: 0.048 },
    },
    {
      id: 'objets',
      name: 'Cartes Objet',
      qty: '25 cartes',
      note: 'Elles se glissent à droite du pupitre pour être améliorées : leur capacité continue reste alors active jusqu’à la fin.',
      glyph: 'card',
      tint: '#3b82f6',
      crop: { page: 1, x: 0.35, y: 0.641, w: 0.25, h: 0.05 },
    },
    {
      id: 'meteorites',
      name: 'Cartes Météorite',
      qty: '25 cartes',
      note: 'Elles se glissent sous le pupitre, tournées d’un quart de tour, pour être fondues.',
      glyph: 'card',
      tint: '#22c55e',
      crop: { page: 1, x: 0.35, y: 0.683, w: 0.25, h: 0.033 },
    },
    {
      id: 'quetes',
      name: 'Cartes Quête',
      qty: '40 cartes',
      note: 'Chacune désigne un lieu précis. On la résout en s’y rendant et en payant son coût.',
      glyph: 'card',
      tint: '#a855f7',
      crop: { page: 1, x: 0.35, y: 0.72, w: 0.25, h: 0.033 },
    },
    {
      id: 'jetons-action',
      name: 'Jetons Action',
      qty: '5 jetons',
      note: 'Le cœur du jeu. Il glisse d’une case à l’autre du pupitre et décide de ce que vous ferez à ce tour.',
      glyph: 'token',
      tint: '#e08a2e',
      crop: { page: 1, x: 0.35, y: 0.769, w: 0.25, h: 0.034 },
    },
    {
      id: 'jetons-piste',
      name: 'Jetons Puissance et Ruse',
      qty: '5 + 5 jetons',
      note: 'Deux curseurs sur la piste de votre pupitre, plafonnés à 10 chacun. Ils paient la Corruption : orange en Puissance, turquoise en Ruse.',
      glyph: 'marker',
      tint: '#c2452b',
      crop: { page: 1, x: 0.35, y: 0.806, w: 0.25, h: 0.068 },
    },
    {
      id: 'plans',
      name: 'Jetons Plan',
      qty: '24 jetons',
      note: 'Gagnés en révélant un lieu. Ils ne valent rien en pièces, mais cinq d’entre eux valent une Gloire.',
      glyph: 'token',
      tint: '#22c55e',
      crop: { page: 1, x: 0.35, y: 0.881, w: 0.25, h: 0.034 },
    },
    {
      id: 'gloire',
      name: 'Jetons Gloire',
      qty: '20 jetons',
      note: 'Quatre étoiles par joueur. C’est en posant la quatrième qu’on déclenche la fin de partie.',
      glyph: 'token',
      tint: '#e08a2e',
      crop: { page: 1, x: 0.665, y: 0.605, w: 0.29, h: 0.04 },
      // Les huit catégories du Campement : ce qu'il faut atteindre pour
      // poser une étoile. Quatre étoiles posées déclenchent la fin de partie.
      variants: [
        { label: '4 quêtes', effect: 'Résolvez quatre cartes Quête.' },
        { label: '4 météorites', effect: 'Fondez quatre cartes Météorite.' },
        { label: '4 objets', effect: 'Améliorez quatre cartes Objet.' },
        { label: 'Corruption du Lieu 20', effect: 'Combattez la Corruption du lieu numéro 20 — celle que le sac ne contient pas.' },
        { label: '7 Corruption', effect: 'Combattez sept jetons Corruption.' },
        { label: '8 cartes', effect: 'Ayez huit cartes dans votre main.' },
        { label: '7 ouvriers', effect: 'Ayez sept meeples Ouvrier.' },
        { label: '5 Plans', effect: 'Ayez cinq jetons Plan.' },
      ],
    },
    {
      id: 'corruption',
      name: 'Jetons Corruption',
      qty: '37 jetons',
      note: 'Orange, ils se paient en Puissance ; turquoise, en Ruse. Chacun rapporte 2 $ en fin de partie.',
      glyph: 'token',
      tint: '#c2452b',
      crop: { page: 1, x: 0.665, y: 0.666, w: 0.29, h: 0.058 },
    },
    {
      id: 'sac',
      name: 'Sac Corruption',
      qty: '1 sac',
      note: 'On y pioche à l’aveugle chaque fois qu’un lieu se révèle.',
      glyph: 'bag',
      crop: { page: 1, x: 0.665, y: 0.718, w: 0.29, h: 0.042 },
    },
    {
      id: 'pieces',
      name: 'Pièces',
      qty: '80 pièces',
      note: 'La monnaie, et le score. Le joueur le plus riche gagne.',
      glyph: 'token',
      tint: '#e08a2e',
      crop: { page: 1, x: 0.665, y: 0.766, w: 0.29, h: 0.062 },
    },
    {
      id: 'aides',
      name: 'Cartes Aide de jeu',
      qty: '10 cartes',
      note: 'Deux par joueur : le glossaire des icônes et le résumé du tour. Gardez-les sous les yeux la première partie.',
      glyph: 'card',
      crop: { page: 1, x: 0.665, y: 0.824, w: 0.29, h: 0.038 },
    },
  ],

  /* ------------------------------------------------------------ chapitres */

  chapters: [
    {
      id: 'brief',
      title: 'Briefing',
      kind: 'brief',
      goal: 'Savoir ce que le jeu vous demande, et sur quoi il se termine.',
      steps: [
        {
          id: 'b1',
          kind: 'info',
          title: 'Posez la tablette à côté du campement',
          body: [
            'Vous allez installer la partie, puis apprendre le tour de jeu et les récompenses qui rapportent.',
            'Une étape vous dit une seule chose à faire. Vous validez quand c’est fait sur la table.',
          ],
          tip: 'Le chronomètre en haut à droite tourne pendant la partie. Il reprend même si vous fermez l’application.',
        },
        {
          id: 'b1b',
          kind: 'info',
          title: 'Où vous êtes, et ce que vous cherchez',
          body: [
            'Sibérie, 1925. Une météorite a réveillé une corruption ancienne près de la Tunguska, et deux expéditions envoyées l’étudier ne sont jamais revenues.',
            'Vous financez la vôtre. Vous partez du Campement à bord d’un Mecha, avec un Personnage et un Compagnon.',
            'Le plateau se découvre en marchant : chaque tuile Lieu se retourne quand un Mecha y entre, et sort du sac la Corruption qui l’occupe.',
          ],
          tip: 'Ce n’est pas un jeu d’exploration au sens propre : la carte est le décor. Ce que vous cherchez vraiment, ce sont les étoiles du Campement.',
          components: ['campement', 'mechas'],
          ref: 'Aperçu et objectif — p.1',
        },
        {
          id: 'b2',
          kind: 'info',
          title: 'Le but : être le plus riche',
          body: [
            'Tout se compte en pièces à la fin : jetons Gloire, pièces gagnées, objets améliorés, jetons Corruption.',
            'Un jeton Gloire vaut 5 $, ou jusqu’à 10 $ si vous avez résolu des quêtes.',
          ],
          warn: 'Ce n’est pas une course : le premier à quatre Gloire déclenche la fin, il ne gagne pas pour autant.',
          components: ['gloire', 'pieces'],
          ref: 'Fin de partie — p.13',
        },
        {
          id: 'b2b',
          kind: 'info',
          title: 'Ce que vous faites de vos tours',
          body: [
            'Vos cartes fabriquent deux ressources : la Puissance et la Ruse. Elles ne valent rien au décompte — ce sont des munitions.',
            'Vous les dépensez pour Combattre la Corruption et pour Résoudre des quêtes. Ce sont ces gestes qui remplissent les catégories du Campement.',
            'Fanfaronner transforme une catégorie remplie en jeton Gloire. C’est la seule action qui marque vraiment.',
          ],
          warn: 'Une piste de Puissance à 10 en fin de partie, c’est 10 points de dépense qu’on n’a pas faits. Rien ne se garde.',
          tip: 'Résolvez vos quêtes tôt : chaque quête résolue augmente ce que rapportent TOUS vos jetons Gloire, y compris ceux déjà posés.',
          components: ['jetons-piste', 'quetes'],
          ref: 'Fin de partie — p.13',
        },
        {
          id: 'b2c',
          kind: 'info',
          title: 'Vos premiers tours',
          ext: true,
          extSource: 'guides de jeu en ligne',
          body: [
            'Regardez le Campement avant de jouer : ses sept catégories vous disent ce que le jeu récompense. Choisissez-en deux ou trois, pas sept.',
            'Le premier tour donne les trois actions. Servez-vous-en pour aller loin, pas pour grappiller à côté du Campement.',
            'Renouveler n’est pas un tour perdu : votre rang actif est votre main de demain, et une main vide n’a rien à jouer.',
            'La Corruption est le seul point qui se ramasse par paquets — sept jetons valent une catégorie entière.',
          ],
          warn: 'Ces conseils ne sont pas dans le livret de règles : ce sont des habitudes de joueurs, pas des obligations.',
          ref: 'Aucune — hors livret',
        },
        {
          id: 'b3',
          kind: 'info',
          title: 'Un tour, c’est un jeton qui glisse',
          body: [
            'Votre pupitre porte quatre cases : Déplacer, Jouer, Récolter, Renouveler.',
            'Vous glissez votre jeton Action sur l’une d’elles — et vous faites toutes les autres, celles qui restent visibles.',
          ],
          components: ['jetons-action'],
          crop: { page: 12, x: 0.675, y: 0.155, w: 0.28, h: 0.195 },
          ref: 'Déroulement de la partie — p.4',
        },
        {
          id: 'b4-solo',
          kind: 'info',
          title: 'En solo, l’Automa a son propre livret',
          only: [1],
          body: [
            'Le mode solitaire oppose un adversaire automatisé, avec son paquet et sa mise en place.',
            'Ce tutoriel installe la partie et vous apprend les règles ; sortez le livret Automa pour l’adversaire.',
          ],
          warn: 'La mise en place qui suit est celle d’une partie normale. Le livret Automa la complète, il ne la remplace pas.',
          ref: 'Matériel — p.1',
        },
        {
          id: 'b5',
          kind: 'check',
          title: 'Ce que vous saurez faire',
          body: [
            'Installer la partie en entier, pupitre puis plateau.',
            'Enchaîner vos tours sans hésiter sur le jeton Action.',
            'Reconnaître les quatre façons de marquer, et savoir quand fanfaronner.',
          ],
        },
      ],
    },

    {
      id: 'materiel',
      title: 'Le matériel',
      kind: 'setup',
      goal: 'Reconnaître les cinq familles de cartes et les jetons qui comptent.',
      steps: [
        {
          id: 'm1',
          kind: 'take',
          title: 'Sortez le Campement et les pupitres',
          body: ['Le Campement au centre, un pupitre par joueur.'],
          components: ['campement', 'pupitres'],
          crop: { page: 1, x: 0.05, y: 0.606, w: 0.3, h: 0.082 },
          ref: 'Matériel — p.1',
        },
        {
          id: 'm2',
          kind: 'take',
          title: 'Les tuiles Lieu et les Mechas',
          body: [
            'Les 20 tuiles hexagonales forment la carte, une région à la fois.',
            'Chaque Mecha va avec un pupitre, et porte un anneau à votre couleur.',
          ],
          components: ['lieux', 'mechas', 'anneaux'],
          crop: { page: 1, x: 0.05, y: 0.69, w: 0.3, h: 0.122 },
          ref: 'Matériel — p.1',
        },
        {
          id: 'm3',
          kind: 'take',
          title: 'Les trois paquets qui vont dans la Pioche',
          body: [
            'Objet, Météorite, Quête : 90 cartes qu’on mélange ensemble en une seule Pioche.',
            'C’est de là que sortiront les cinq cartes centrales, et tout ce que vous gagnerez.',
          ],
          components: ['objets', 'meteorites', 'quetes'],
          crop: { page: 1, x: 0.35, y: 0.641, w: 0.25, h: 0.112 },
          ref: 'Matériel — p.1',
        },
        {
          id: 'm4',
          kind: 'take',
          title: 'Ouvriers, jetons et pièces',
          body: [
            'Les ouvriers activent les capacités des cartes ; leur couleur décide de ce qu’on peut activer.',
            'Puissance et Ruse sont deux curseurs, pas des réserves de jetons.',
          ],
          components: ['ouvriers', 'jetons-piste', 'plans', 'pieces'],
          crop: { page: 1, x: 0.05, y: 0.813, w: 0.28, h: 0.058 },
          ref: 'Matériel — p.1',
        },
        {
          id: 'm5',
          kind: 'take',
          title: 'La Corruption et son sac',
          body: [
            'Les jetons Corruption recouvrent les récompenses des lieux du Centre et du Nord.',
            'Orange : payé en Puissance. Turquoise : payé en Ruse.',
          ],
          components: ['corruption', 'sac'],
          crop: { page: 1, x: 0.665, y: 0.666, w: 0.29, h: 0.1 },
          ref: 'Matériel — p.1',
        },
      ],
    },

    {
      id: 'setup-joueur',
      title: 'Mise en place : votre pupitre',
      kind: 'setup',
      modes: ['tuto', 'setup'],
      goal: 'Chaque joueur repart avec un pupitre prêt et deux cartes en main.',
      steps: [
        {
          id: 'sj1',
          kind: 'take',
          title: 'Tirez un pupitre au hasard',
          body: [
            'Prenez le Mecha correspondant, clipsez un anneau de socle à votre couleur.',
          ],
          components: ['pupitres', 'mechas', 'anneaux'],
          crop: { page: 2, x: 0.16, y: 0.415, w: 0.73, h: 0.24 },
          ref: 'Mise en place — p.2',
        },
        {
          id: 'sj2',
          kind: 'take',
          title: 'Tirez une carte Personnage, prenez son Compagnon',
          body: [
            'Le Compagnon porte le même chiffre romain, en haut à droite.',
            'Les deux cartes vont dans votre main, à gauche du pupitre, face visible.',
          ],
          components: ['depart'],
          crop: { page: 4, x: 0.365, y: 0.715, w: 0.48, h: 0.25 },
          ref: 'Mise en place — p.2',
        },
        {
          id: 'sj3',
          kind: 'place',
          title: 'Posez vos quatre jetons Gloire sur le pupitre',
          body: ['Les quatre étoiles à votre couleur, à portée de main.'],
          components: ['gloire'],
          ref: 'Mise en place — p.2',
        },
        {
          id: 'sj4',
          kind: 'place',
          title: 'Jeton Action dans la case Renouveler',
          body: [
            'C’est la position de départ : à votre premier tour, vous ferez donc les trois actions.',
          ],
          components: ['jetons-action'],
          crop: { page: 12, x: 0.675, y: 0.155, w: 0.28, h: 0.195 },
          ref: 'Mise en place — p.2',
        },
        {
          id: 'sj5',
          kind: 'place',
          title: 'Puissance et Ruse sur la case 0',
          body: ['Les deux jetons sur la case 0 de la piste, le long du bord gauche du pupitre.'],
          components: ['jetons-piste'],
          ref: 'Mise en place — p.2',
        },
        {
          id: 'sj6',
          kind: 'take',
          title: 'Prenez les deux cartes Aide de jeu',
          body: ['Une de chaque : le glossaire des icônes, et le résumé du tour à son verso.'],
          components: ['aides'],
          ref: 'Mise en place — p.2',
        },
        {
          id: 'sj7',
          kind: 'info',
          title: 'Les patins : plus tard',
          body: [
            'La boîte fournit des patins autocollants pour faciliter le glissement des cartes sous le pupitre.',
            'Ils sont définitifs : jouez une partie sans, vous verrez si vous en avez besoin.',
          ],
          modes: ['tuto'],
          ref: 'Mise en place — p.2',
        },
      ],
    },

    {
      id: 'setup-monde',
      title: 'Mise en place : le plateau',
      kind: 'setup',
      modes: ['tuto', 'setup'],
      goal: 'La carte est montée, la Pioche et les cartes centrales sont en place.',
      steps: [
        {
          id: 'sm1',
          kind: 'place',
          title: 'Le Campement au centre de la table',
          body: ['Posez tous les Mechas à côté : ils démarrent au Campement.'],
          components: ['campement', 'mechas'],
          crop: { page: 3, x: 0.04, y: 0.455, w: 0.9, h: 0.385 },
          ref: 'Mise en place — p.3',
        },
        {
          id: 'sm2',
          kind: 'shuffle',
          title: 'Triez les tuiles Lieu en trois piles',
          body: [
            '6 tuiles Sud, 7 Centre, 7 Nord. Mélangez chaque pile séparément, face cachée.',
            'Le diagramme en haut à droite du Campement donne la forme exacte à construire.',
          ],
          components: ['lieux'],
          crop: { page: 3, x: 0.04, y: 0.455, w: 0.9, h: 0.385 },
          ref: 'Mise en place — p.3',
        },
        {
          id: 'sm3',
          kind: 'place',
          title: 'Posez les Sud face visible, le reste face cachée',
          body: [
            'Les 6 tuiles Sud d’abord, face visible.',
            'Puis les 7 Centre, face cachée. Enfin les 7 Nord, face cachée.',
          ],
          warn: 'Un jeton Plan va sur chaque tuile face cachée — les Centre et les Nord, jamais les Sud.',
          components: ['lieux', 'plans'],
          ref: 'Mise en place — p.3',
        },
        {
          id: 'sm4',
          kind: 'shuffle',
          title: 'Mélangez la Pioche',
          body: [
            'Toutes les cartes Météorite, Objet et Quête ensemble, face cachée, à côté du Campement.',
            'Révélez-en 5, une dans chacune des cases indiquées par le diagramme : ce sont les cartes centrales.',
            'Laissez de la place à côté de la Pioche pour le Tas.',
          ],
          components: ['objets', 'meteorites', 'quetes'],
          crop: { page: 3, x: 0.04, y: 0.455, w: 0.9, h: 0.385 },
          ref: 'Mise en place — p.3',
        },
        {
          id: 'sm5',
          kind: 'place',
          title: 'Formez la Réserve',
          body: ['Ouvriers, pièces et jetons Plan restants, à portée de tous.'],
          components: ['ouvriers', 'pieces', 'plans'],
          ref: 'Mise en place — p.3',
        },
        {
          id: 'sm6',
          kind: 'place',
          title: 'Remplissez le sac Corruption',
          body: ['Tous les jetons Corruption dans le sac.'],
          warn: 'Sauf celui de valeur 20 : il attend à part, et ira sur le Lieu 20 quand il sera révélé.',
          components: ['sac', 'corruption'],
          ref: 'Mise en place — p.3',
        },
        {
          id: 'sm7-solo',
          kind: 'check',
          title: 'Vous commencez',
          only: [1],
          body: ['En solo, vous et l’Automa alternez les tours : c’est vous qui ouvrez.'],
          ref: 'Mise en place — p.3 ; livret Automa',
        },
        {
          id: 'sm7',
          kind: 'check',
          title: 'Tirez le premier joueur au hasard',
          only: [2, 3, 4, 5],
          body: ['Les tours s’enchaînent ensuite dans le sens horaire.'],
          ref: 'Mise en place — p.3',
        },
      ],
    },

    {
      id: 'tour',
      title: 'Le tour de jeu',
      kind: 'play',
      goal: 'Comprendre le jeton Action, et pourquoi il faut parfois passer un tour à Renouveler.',
      steps: [
        {
          id: 't1',
          kind: 'action',
          title: 'Votre premier tour : les trois actions',
          body: [
            'Votre jeton Action est dans la case Renouveler. Glissez-le dans la case vide.',
            'Vous effectuez alors Déplacer, Jouer et Récolter, dans l’ordre de votre choix.',
          ],
          components: ['jetons-action'],
          crop: { page: 12, x: 0.675, y: 0.155, w: 0.28, h: 0.195 },
          ref: 'Déroulement de la partie — p.4',
        },
        {
          id: 't2',
          kind: 'info',
          title: 'Les tours suivants : deux actions',
          body: [
            'Glissez le jeton Action pour couvrir Déplacer, Jouer ou Récolter.',
            'Vous devez effectuer toutes les actions restées visibles, dans l’ordre de votre choix.',
          ],
          warn: 'Vous ne choisissez pas ce que vous faites : vous choisissez ce que vous ne faites pas.',
          ref: 'Déroulement de la partie — p.4',
        },
        {
          id: 't3',
          kind: 'action',
          title: 'Le tour Renouveler',
          body: [
            'Glissez votre jeton Action sur la case Renouveler : c’est tout votre tour.',
            'Reprenez tous vos ouvriers posés sur vos cartes actives, et remettez ces cartes en main.',
          ],
          warn: 'On ne peut Renouveler que si le jeton couvrait Déplacer, Jouer ou Récolter au début du tour.',
          crop: { page: 12, x: 0.675, y: 0.155, w: 0.28, h: 0.195 },
          ref: 'Renouveler — p.12',
        },
        {
          id: 't4',
          kind: 'info',
          title: 'Main, rang actif, et sous le pupitre',
          body: [
            'À gauche du pupitre : votre main. À droite : votre rang actif, les cartes jouées.',
            'Une carte gagnée ou défaussée va toujours à l’extrémité droite du rang actif.',
            'Résoudre, améliorer et fondre font glisser des cartes SOUS le pupitre : elles quittent le jeu.',
          ],
          crop: { page: 9, x: 0.15, y: 0.67, w: 0.8, h: 0.3 },
          ref: 'Cartes que vous contrôlez — p.6',
        },
        {
          id: 't5',
          kind: 'info',
          title: 'La capacité de votre Mecha',
          body: [
            'Chaque Mecha a une capacité continue, active toute la partie, imprimée sur son pupitre.',
            'Elle n’est pas un bonus de plus : elle décide de ce qui vous convient pendant toute la partie.',
          ],
          tip: 'Lisez-la maintenant, avant de choisir votre première direction.',
          ref: 'Capacités de Mecha — p.12',
        },
        {
          id: 't5b',
          kind: 'info',
          title: 'Les cinq capacités, en clair',
          body: [
            'Tatanka : Résoudre, Améliorer et Fondre jusqu’à 5 fois chacun, au lieu de 4.',
            'Arpenteur des marais : Portée de 1 à 4 Lieux, au lieu de 1 à 3.',
            'La Colère d’Odin : à tout moment de votre tour, détruisez 1 jeton Plan pour gagner 1 Puissance, 1 Ruse ou 1 $.',
            'Bûcheron : quand vous Combattez, le PREMIER jeton Corruption de chaque couleur coûte 1 de moins.',
            'Highlander : les cartes que vous gagnez arrivent dans votre main, et non dans votre rang actif.',
          ],
          warn: 'Le rabais du Bûcheron vaut par couleur, pas par jeton : un deuxième jeton orange dans le même Combattre est au plein tarif.',
          tip: 'Ces cinq capacités sont dans les aides de jeu, sous « Les cinq Mechas ».',
          components: ['mechas', 'pupitres'],
          ref: 'Capacités de Mecha — p.12',
        },
      ],
    },

    {
      id: 'actions',
      title: 'Les trois actions',
      kind: 'play',
      goal: 'Savoir exactement ce que font Déplacer, Jouer et Récolter.',
      steps: [
        {
          id: 'a1',
          kind: 'action',
          title: 'Déplacer : de 1 à 3 lieux',
          body: [
            'Votre Mecha va dans un autre lieu vide, à portée de 1 à 3 lieux.',
            'Il traverse librement les lieux occupés, mais ne peut pas s’y arrêter.',
          ],
          warn: 'Le Campement n’est pas un lieu : une fois parti, vous n’y revenez jamais.',
          crop: { page: 5, x: 0.515, y: 0.645, w: 0.44, h: 0.32 },
          ref: 'Déplacer — p.5',
        },
        {
          id: 'a2',
          kind: 'action',
          title: 'Entrer sur un lieu face cachée',
          body: [
            'Votre déplacement s’arrête là. Prenez le jeton Plan posé dessus.',
            'Retournez la tuile face visible.',
            'Puis piochez des jetons Corruption un par un, empilés face visible, jusqu’à atteindre le niveau de Corruption du lieu.',
          ],
          warn: 'Le niveau de Corruption est le nombre à droite du carré, en bas de la tuile. On s’arrête dès que la somme l’atteint, pas avant.',
          components: ['plans', 'corruption', 'sac'],
          crop: { page: 5, x: 0.675, y: 0.365, w: 0.19, h: 0.18 },
          ref: 'Lieu face cachée — p.5',
        },
        {
          id: 'a3',
          kind: 'action',
          title: 'Jouer : une carte de votre main',
          body: [
            'Posez-la à droite de votre rang actif. Deux choses, dans l’ordre que vous voulez :',
            'gagner sa Valeur Base, en haut à gauche — de la Puissance, de la Ruse, ou les deux ;',
            'poser 1 ouvrier dessus pour activer sa capacité, en bas de la carte.',
          ],
          warn: 'Une carte n’accueille jamais plus d’un ouvrier, et l’ouvrier doit être de la couleur exigée par la capacité.',
          components: ['ouvriers'],
          crop: { page: 6, x: 0.68, y: 0.132, w: 0.28, h: 0.275 },
          ref: 'Jouer — p.6',
        },
        {
          id: 'a4',
          kind: 'info',
          title: 'Les conditions d’une carte',
          body: [
            'Sous la Valeur Base, certaines cartes affichent des bonus conditionnels.',
            'Ils s’appliquent si vous possédez au moins le montant de Gloire ou de Météorites fondues indiqué.',
          ],
          warn: 'Puissance et Ruse plafonnent à 10 chacune. Au-delà, le surplus est perdu.',
          crop: { page: 6, x: 0.68, y: 0.132, w: 0.28, h: 0.275 },
          ref: 'Valeur Base — p.6',
        },
        {
          id: 'a5',
          kind: 'info',
          title: 'Les deux temps d’une carte Objet',
          body: [
            'Récompense instantanée, au-dessus de l’icône Ouvrier : obtenue au moment où vous posez l’ouvrier.',
            'Récompense continue, souvent en « Chaque fois » : active tant que la carte est dans votre rang actif avec un ouvrier dessus.',
          ],
          components: ['objets'],
          crop: { page: 7, x: 0.68, y: 0.06, w: 0.28, h: 0.27 },
          ref: 'Objet — p.7',
        },
        {
          id: 'a6',
          kind: 'action',
          title: 'Récolter : les récompenses de votre lieu',
          body: [
            'Prenez toutes les récompenses visibles au bas de la tuile où se trouve votre Mecha.',
            'Un symbole « / » signifie « ou » : choisissez les récompenses d’un seul côté.',
          ],
          tip: 'Récolter est l’action qu’on sous-estime : c’est elle qui donne les ouvriers, les cartes et les pièces.',
          ref: 'Récolter — p.9',
        },
        {
          id: 'a7',
          kind: 'info',
          title: 'Les cartes centrales',
          body: [
            'Les 5 cartes face visible entre les lieux. Certaines récompenses vous en font gagner une.',
            'Une carte centrale gagnée est aussitôt remplacée par la carte du dessus de la Pioche.',
            'Balayer : mettez au Tas autant de cartes centrales que vous voulez, et remplacez-les.',
          ],
          warn: 'Une carte gagnée ou défaussée ne rapporte pas sa Valeur Base et n’accueille pas d’ouvrier.',
          ref: 'Récolter — p.9',
        },
        {
          id: 'a8',
          kind: 'info',
          title: 'Les icônes de récompense qu’on ne devine pas',
          body: [
            'Sauver : reprenez en main une carte de votre rang actif. L’ouvrier qui s’y trouvait revient sur votre pupitre.',
            'Récompense Renouveler : rendez ouvriers et cartes actives, mais NE glissez PAS votre jeton Action. Votre tour continue.',
            'Récompense d’un lieu adjacent : gagnez une seule de ses icônes, et le « / » ne vous limite pas.',
            'Activer une carte adjacente : vise les cartes centrales, sans y poser d’ouvrier. Un effet continu ainsi activé ne dure que ce tour.',
          ],
          tip: 'Le bouton Aides de jeu garde ces icônes sous la main, sous « Lire une récompense ».',
          components: ['aides', 'ouvriers'],
          ref: 'Récolter — pp.9-10',
        },
        {
          id: 'a9',
          kind: 'info',
          title: 'Ce que le plateau vous limite',
          body: [
            'Puissance et Ruse plafonnent à 10 chacune. Le surplus est perdu, il ne se reporte pas.',
            'Les ouvriers sont limités à 10 par couleur : réserve vide dans cette couleur, rien ne se passe.',
            'Une carte ne porte jamais plus d’un ouvrier.',
            'Les jetons Plan aussi sont en nombre limité dans la Réserve.',
          ],
          warn: 'Chaque catégorie du Campement est plafonnée à quatre — quatre quêtes, quatre objets, quatre météorites. Le Tatanka, lui, monte à cinq.',
          components: ['jetons-piste', 'ouvriers', 'plans'],
          ref: 'Jouer — p.6 · Récolter — p.9',
        },
      ],
    },

    {
      id: 'gloire',
      title: 'Marquer des points',
      kind: 'play',
      goal: 'Connaître les quatre récompenses spéciales et savoir quand fanfaronner.',
      steps: [
        {
          id: 'g1',
          kind: 'action',
          title: 'Combattre la Corruption',
          body: [
            'Payez le coût du jeton du dessus : orange en Puissance, turquoise en Ruse.',
            'Prenez le jeton sur votre pupitre. Vous pouvez enchaîner tant que vous pouvez payer.',
          ],
          warn: 'Retirer le dernier jeton d’un lieu révèle en dessous une récompense Améliorer, Fondre ou Fanfaronner — accessible ensuite par Récolter.',
          components: ['corruption', 'jetons-piste'],
          crop: { page: 8, x: 0.1, y: 0.765, w: 0.83, h: 0.105 },
          ref: 'Combattre — p.8',
        },
        {
          id: 'g2',
          kind: 'action',
          title: 'Résoudre une quête',
          body: [
            'Votre Mecha doit être sur le lieu indiqué par la carte Quête que vous contrôlez.',
            'Payez le coût à droite de la carte, prenez la récompense, puis glissez la carte sous le bord SUPÉRIEUR du pupitre.',
          ],
          warn: 'Quatre quêtes résolues au maximum — et chaque quête résolue augmente ce que vaut chacun de vos jetons Gloire.',
          components: ['quetes'],
          ref: 'Résoudre — p.8',
        },
        {
          id: 'g3',
          kind: 'action',
          title: 'Améliorer un objet',
          body: [
            'Glissez une carte Objet sous le bord DROIT du pupitre, de façon à ne laisser voir que sa capacité.',
            'Sa partie continue est alors active pour le reste de la partie, sans ouvrier.',
          ],
          warn: 'Une fois améliorée, seule la capacité continue compte : la récompense instantanée est ignorée.',
          components: ['objets'],
          crop: { page: 10, x: 0.64, y: 0.3, w: 0.31, h: 0.17 },
          ref: 'Améliorer — p.10',
        },
        {
          id: 'g4',
          kind: 'action',
          title: 'Fondre une météorite',
          body: [
            'Glissez une carte Météorite sous le bord INFÉRIEUR du pupitre, tournée d’un quart de tour, bonus visible.',
            'Gagnez immédiatement le bonus Fondre de chacune de vos météorites fondues, celle-ci comprise.',
          ],
          tip: 'Posséder une, puis deux météorites fondues débloque des effets plus forts sur les cartes Météorite que vous jouez ensuite.',
          components: ['meteorites'],
          ref: 'Fondre — p.10',
        },
        {
          id: 'g5',
          kind: 'action',
          title: 'Fanfaronner : poser une Gloire',
          body: [
            'Choisissez une catégorie du Campement dont vous avez atteint l’objectif et où vous n’avez pas déjà d’étoile.',
            'Posez-y un jeton Gloire à votre couleur.',
          ],
          warn: 'Les jetons adverses ne bloquent rien : une même catégorie accueille plusieurs joueurs.',
          components: ['gloire'],
          crop: { page: 11, x: 0.06, y: 0.3, w: 0.81, h: 0.265 },
          ref: 'Fanfaronner — p.10',
        },
        {
          id: 'g6',
          kind: 'info',
          title: 'Les huit catégories',
          body: [
            '4 quêtes résolues · 4 météorites fondues · 4 objets améliorés · la Corruption du Lieu 20.',
            '7 jetons Corruption · 8 cartes contrôlées · 7 ouvriers ou 5 jetons Plan.',
          ],
          warn: 'Ouvriers et jetons Plan partagent une seule catégorie : réussir les deux ne rapporte qu’une Gloire.',
          crop: { page: 11, x: 0.06, y: 0.3, w: 0.81, h: 0.265 },
          ref: 'Catégories Gloire — p.11',
        },
        {
          id: 'g7',
          kind: 'check',
          title: 'La fin de partie',
          body: [
            'Elle se déclenche dès qu’un joueur pose son 4ᵉ jeton Gloire. Chacun joue alors un dernier tour.',
            'On compte : les Gloire (5/6/8/10 $ selon 0/1/2/3+ quêtes résolues), les pièces, les objets améliorés, et 2 $ par Corruption.',
          ],
          warn: 'À égalité, c’est le joueur qui totalise le plus dans les catégories Gloire qui l’emporte, même celles où il n’a pas d’étoile.',
          crop: { page: 13, x: 0.64, y: 0.078, w: 0.31, h: 0.135 },
          ref: 'Fin de partie — p.13',
        },
        {
          id: 'g8',
          kind: 'info',
          title: 'Un conseil pour cette première partie',
          body: [
            'Décidez tôt de deux catégories que vous visez, et construisez votre pupitre pour elles.',
            'Un tour Renouveler bien placé rapporte plus que deux tours à jouer des cartes faibles.',
          ],
          ref: 'Déroulement de la partie — p.4',
        },
      ],
    },

    /* --------------------------------------------- reprise d'une séance */

    {
      id: 'rp',
      title: 'Reprendre la séance',
      kind: 'setup',
      modes: ['reprise'],
      goal: 'Retrouver l’état exact d’une table laissée en plan, et repartir sans faute.',
      steps: [
        {
          id: 'rp1',
          kind: 'info',
          title: 'Expeditions n’a pas de sauvegarde',
          body: [
            'C’est une partie d’une séance : le livret ne prévoit ni fiche de sauvegarde, ni rangement intermédiaire.',
            'Reprendre veut donc dire : la table est restée montée, et on vérifie qu’elle n’a pas bougé.',
          ],
          warn: 'Rangée, la partie est perdue : ni la Pioche, ni l’ordre des jetons Corruption empilés ne se reconstituent.',
          ref: 'Déroulement de la partie — p.4',
        },
        {
          id: 'rp2',
          kind: 'check',
          title: 'Le jeton Action, d’abord',
          body: [
            'Sur chaque pupitre, la case qu’il couvre décide du tour à venir : c’est l’information la plus fragile de la table.',
            'S’il est dans la case Renouveler, le joueur fera ses trois actions à son prochain tour.',
          ],
          warn: 'Un jeton Action déplacé par mégarde change tout le tour du joueur. Vérifiez-les tous avant de reprendre.',
          components: ['jetons-action'],
          crop: { page: 12, x: 0.675, y: 0.155, w: 0.28, h: 0.195 },
          ref: 'Renouveler — p.12',
        },
        {
          id: 'rp3',
          kind: 'check',
          title: 'Vérifiez chaque pupitre',
          body: [
            'La main à gauche, le rang actif à droite, dans l’ordre où les cartes ont été jouées.',
            'Les ouvriers posés sur les cartes, et ceux restés disponibles sur le pupitre.',
            'Les jetons Puissance et Ruse sur la piste, les jetons Corruption et Plan gagnés.',
          ],
          warn: 'L’ordre du rang actif compte : plusieurs capacités visent « la carte précédente ».',
          components: ['ouvriers', 'jetons-piste', 'corruption', 'plans'],
          crop: { page: 9, x: 0.15, y: 0.67, w: 0.8, h: 0.3 },
          ref: 'Cartes que vous contrôlez — p.6',
        },
        {
          id: 'rp4',
          kind: 'check',
          title: 'Les cartes glissées sous les pupitres',
          body: [
            'Quêtes résolues en haut, objets améliorés à droite, météorites fondues en bas.',
            'Comptez-les : ce sont les catégories de Gloire, plafonnées à quatre.',
          ],
          components: ['quetes', 'objets', 'meteorites'],
          crop: { page: 10, x: 0.64, y: 0.3, w: 0.31, h: 0.17 },
          ref: 'Améliorer et Fondre — p.10',
        },
        {
          id: 'rp5',
          kind: 'check',
          title: 'Vérifiez le plateau',
          body: [
            'La position de chaque Mecha, les tuiles encore face cachée et leurs jetons Plan.',
            'Les piles de Corruption sur chaque lieu, dans leur ordre : c’est le jeton du dessus qui se paie.',
            'Les cinq cartes centrales, la Pioche et le Tas.',
          ],
          components: ['lieux', 'corruption', 'mechas'],
          crop: { page: 3, x: 0.04, y: 0.455, w: 0.9, h: 0.385 },
          ref: 'Mise en place — p.3',
        },
        {
          id: 'rp6-solo',
          kind: 'check',
          title: 'Le Campement, et à qui le tour',
          only: [1],
          body: [
            'Les jetons Gloire déjà posés : ils disent où en est la course, et si la fin est proche.',
            'À vous ou à l’Automa ? Reprenez au tour interrompu, puis alternez.',
          ],
          warn: 'Si vous ou l’Automa avez déjà posé un 4ᵉ jeton Gloire, la fin de partie est déclenchée : il ne reste qu’un tour à chacun.',
          tip: 'Le rappel des règles, sur l’accueil, remet le tour en tête en quatre étapes.',
          components: ['gloire', 'campement'],
          crop: { page: 13, x: 0.64, y: 0.078, w: 0.31, h: 0.135 },
          ref: 'Fin de partie — p.13',
        },
        {
          id: 'rp6',
          kind: 'check',
          title: 'Le Campement, et à qui le tour',
          only: [2, 3, 4, 5],
          body: [
            'Les jetons Gloire déjà posés : ils disent où en est la course, et si la fin est proche.',
            'Reprenez au joueur dont c’était le tour, puis dans le sens horaire.',
          ],
          warn: 'Si un joueur a déjà posé son 4ᵉ jeton Gloire, la fin de partie est déclenchée : il ne reste qu’un tour à chacun.',
          tip: 'Le rappel des règles, sur l’accueil, remet le tour en tête en quatre étapes.',
          components: ['gloire', 'campement'],
          crop: { page: 13, x: 0.64, y: 0.078, w: 0.31, h: 0.135 },
          ref: 'Fin de partie — p.13',
        },
      ],
    },

    /* ------------------------------------------------- rappel des règles */

    {
      id: 'r-tour',
      title: 'Le tour',
      kind: 'play',
      modes: ['recap'],
      goal: 'Retrouver le mécanisme du jeton Action en trente secondes.',
      steps: [
        {
          id: 'r1',
          kind: 'info',
          title: 'Le jeton Action décide de tout',
          body: [
            'Jeton dans Renouveler en début de tour : glissez-le dans la case vide et faites les trois actions.',
            'Sinon : glissez-le pour couvrir Déplacer, Jouer ou Récolter, et faites les deux qui restent visibles.',
            'Ou glissez-le sur Renouveler : c’est tout votre tour.',
          ],
          warn: 'On ne peut Renouveler que si le jeton couvrait une action au début du tour.',
          crop: { page: 12, x: 0.675, y: 0.155, w: 0.28, h: 0.195 },
          ref: 'Déroulement — p.4, Renouveler — p.12',
        },
        {
          id: 'r2',
          kind: 'info',
          title: 'Déplacer',
          body: [
            'Un autre lieu vide, à 1 à 3 lieux. On traverse les lieux occupés, on ne s’y arrête pas.',
            'Lieu face cachée : le déplacement s’arrête, on prend le jeton Plan, on retourne la tuile, on tire la Corruption.',
          ],
          ref: 'Déplacer — p.5',
        },
        {
          id: 'r3',
          kind: 'info',
          title: 'Jouer',
          body: [
            'Une carte de la main vers la droite du rang actif.',
            'Gagner sa Valeur Base, et/ou poser 1 ouvrier de la bonne couleur pour activer sa capacité.',
          ],
          warn: 'Puissance et Ruse plafonnent à 10.',
          ref: 'Jouer — p.6',
        },
        {
          id: 'r4',
          kind: 'info',
          title: 'Récolter',
          body: [
            'Les récompenses visibles au bas de votre lieu. Un « / » veut dire : un seul côté.',
            'Une carte centrale gagnée est remplacée aussitôt par le dessus de la Pioche.',
          ],
          ref: 'Récolter — p.9',
        },
      ],
    },

    {
      id: 'r-points',
      title: 'Marquer et finir',
      kind: 'play',
      modes: ['recap'],
      goal: 'Retrouver les quatre récompenses spéciales et le décompte.',
      steps: [
        {
          id: 'r5',
          kind: 'info',
          title: 'Les quatre bords du pupitre',
          body: [
            'Haut : quêtes résolues. Droite : objets améliorés. Bas : météorites fondues.',
            'Quatre maximum dans chaque catégorie, sauf capacité de Mecha contraire.',
          ],
          ref: 'Résoudre p.8, Améliorer et Fondre p.10',
        },
        {
          id: 'r6',
          kind: 'info',
          title: 'Combattre',
          body: [
            'Payer le jeton du dessus : orange en Puissance, turquoise en Ruse. Enchaîner tant qu’on peut payer.',
            'Le dernier jeton retiré révèle une récompense Améliorer, Fondre ou Fanfaronner sous le lieu.',
          ],
          crop: { page: 8, x: 0.1, y: 0.765, w: 0.83, h: 0.105 },
          ref: 'Combattre — p.8',
        },
        {
          id: 'r7',
          kind: 'info',
          title: 'Les huit catégories de Gloire',
          body: [
            '4 quêtes · 4 météorites · 4 objets · Corruption du Lieu 20 · 7 Corruption · 8 cartes · 7 ouvriers ou 5 Plans.',
          ],
          crop: { page: 11, x: 0.06, y: 0.3, w: 0.81, h: 0.265 },
          ref: 'Catégories Gloire — p.11',
        },
        {
          id: 'r8',
          kind: 'check',
          title: 'Le décompte',
          body: [
            'Fin déclenchée au 4ᵉ jeton Gloire posé ; chacun joue un dernier tour.',
            'Gloire : 5/6/8/10 $ selon 0/1/2/3+ quêtes résolues. Plus les pièces, les objets améliorés, et 2 $ par Corruption.',
          ],
          ref: 'Fin de partie — p.13',
        },
      ],
    },
  ],
}
