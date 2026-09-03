/**
 * Catalogue des tutoriels installes.
 *
 * Pour ajouter un jeu : creez src/games/<jeu>.ts sur le modele de
 * nemesis.ts, importez-le ici, et ajoutez-le au tableau. La procedure
 * complete est decrite dans GUIDE_CREATION_TUTO.md.
 */

import type { Tutorial } from '../engine/types'
import { nemesis } from './nemesis'

export const TUTORIALS: Tutorial[] = [nemesis]
