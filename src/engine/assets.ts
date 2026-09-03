/**
 * Accès aux pages de règles ingérées.
 *
 * Le script tools/ingest.mjs produit, pour chaque jeu :
 *   public/games/<assetId>/pages.json        manifeste des pages
 *   public/games/<assetId>/pages/p001.webp   une image par page
 *
 * L'application interroge le manifeste au démarrage d'un tutoriel. S'il est
 * absent (PDF pas encore ingéré), tout reste fonctionnel : les visuels
 * basculent sur les pictogrammes de secours. Le tutoriel n'est jamais bloque
 * par l'absence d'assets.
 */

import { useEffect, useState } from 'react'

export interface PageAsset {
  n: number
  w: number
  h: number
  file: string
}

export interface PageManifest {
  assetId: string
  pdf: string
  dpi: number
  generatedAt: string
  pages: PageAsset[]
}

/** Un manifeste par jeu, résolu une seule fois puis mémorisé. */
const cache = new Map<string, Promise<PageManifest | null>>()

function manifestUrl(assetId: string): string {
  // `base: './'` côté Vite : les assets sont relatifs au document, ce qui
  // permet de servir l'app depuis un sous-chemin sans reconfiguration.
  return new URL(`games/${assetId}/pages.json`, document.baseURI).href
}

export function fetchManifest(assetId: string): Promise<PageManifest | null> {
  const hit = cache.get(assetId)
  if (hit) return hit

  const req = fetch(manifestUrl(assetId), { cache: 'force-cache' })
    .then((r) => (r.ok ? (r.json() as Promise<PageManifest>) : null))
    .then((m) => (m && Array.isArray(m.pages) && m.pages.length ? m : null))
    .catch(() => null)

  cache.set(assetId, req)
  return req
}

/** null tant que la résolution est en cours, puis le manifeste ou `false`. */
export function useManifest(assetId: string): PageManifest | false | null {
  const [state, setState] = useState<PageManifest | false | null>(null)

  useEffect(() => {
    let alive = true
    setState(null)
    fetchManifest(assetId).then((m) => {
      if (alive) setState(m ?? false)
    })
    return () => {
      alive = false
    }
  }, [assetId])

  return state
}

export function pageUrl(assetId: string, file: string): string {
  return new URL(`games/${assetId}/pages/${file}`, document.baseURI).href
}
