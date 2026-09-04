/**
 * Catalogue des tutoriels installés.
 *
 * Pour ajouter un jeu : créez src/games/<jeu>.ts sur le modèle de
 * nemesis.ts, importez-le ici, et ajoutez-le au tableau. La procédure
 * complète est décrite dans GUIDE_CREATION_TUTO.md.
 */

import type { Tutorial } from '../engine/types'
import { bitoku } from './bitoku'
import { expeditions } from './expeditions'
import { frosthaven } from './frosthaven'
import { nemesis } from './nemesis'
import { taintedgrail } from './taintedgrail'

export const TUTORIALS: Tutorial[] = [nemesis, taintedgrail, expeditions, frosthaven, bitoku]
