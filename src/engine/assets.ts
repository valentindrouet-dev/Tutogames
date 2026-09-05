/**
 * Accès aux visuels de règles ingérés.
 *
 * À la racine du dépôt — c'est la racine qui est publiée — pour chaque jeu :
 *   games/<assetId>/pages.json         manifeste : pages, et découpes pré-calculées
 *   games/<assetId>/pages/p01.webp     une image par page (npm run ingest)
 *   games/<assetId>/crops/<clé>.webp   une image par découpe (npm run crops)
 *
 * Deux façons d'afficher une découpe, par ordre de préférence :
 *   1. Le fichier pré-découpé, s'il est listé dans le manifeste : quelques
 *      dizaines de Ko, chargé à la demande.
 *   2. La page entière cadrée en CSS : ~1 Mo par page, mais universel.
 *
 * Sans manifeste (PDF pas encore ingéré), tout reste fonctionnel : les
 * visuels basculent sur les pictogrammes de secours.
 */

import { useEffect, useState } from 'react'
import { rectOf, type Crop } from './types'

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
  format?: string
  generatedAt: string
  pages: PageAsset[]
  /** Découpes pré-calculées, clé -> [largeur, hauteur] en pixels. */
  crops?: Record<string, [number, number]>
}

/** Un manifeste par jeu, résolu une seule fois puis mémorisé. */
const cache = new Map<string, Promise<PageManifest | null>>()

/** Chemins relatifs au document : l'app se sert depuis n'importe quel sous-chemin. */
const url = (path: string) => new URL(path, document.baseURI).href

export function fetchManifest(assetId: string): Promise<PageManifest | null> {
  const hit = cache.get(assetId)
  if (hit) return hit

  const req = fetch(url(`games/${assetId}/pages.json`))
    .then((r) => (r.ok ? (r.json() as Promise<PageManifest>) : null))
    .then((m) => (m && Array.isArray(m.pages) && m.pages.length ? m : null))
    .catch(() => null)

  cache.set(assetId, req)
  return req
}

/**
 * Les manifestes de tous les livrets d'un jeu, par identifiant d'assets.
 *
 * Un jeu à deux livrets a deux dossiers d'assets : on les résout ensemble,
 * en un seul effet, pour que le nombre de crochets ne dépende pas du jeu
 * affiché.
 */
export function useManifests(ids: string[]): Record<string, PageManifest | false> {
  const key = ids.join(' ')
  const [state, setState] = useState<Record<string, PageManifest | false>>({})

  useEffect(() => {
    let alive = true
    setState({})
    Promise.all(key.split(' ').filter(Boolean).map((id) => fetchManifest(id).then((m) => [id, m ?? false] as const)))
      .then((pairs) => {
        if (alive) setState(Object.fromEntries(pairs))
      })
    return () => {
      alive = false
    }
  }, [key])

  return state
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
  return url(`games/${assetId}/pages/${file}`)
}

export function cropUrl(assetId: string, key: string): string {
  return url(`games/${assetId}/crops/${key}.webp`)
}

/**
 * Clé d'une découpe pré-calculée : index de page dans le fichier et rectangle
 * à quatre décimales. Doit rester identique à `cropKey` de tools/crops.mjs.
 * Une découpe sans rectangle (page entière) n'a pas de clé.
 */
export function cropKey(crop: Crop, pageOffset: number): string | null {
  const { x, y, w, h } = rectOf(crop)
  if (w >= 1 && h >= 1) return null
  const n = String(crop.page + pageOffset).padStart(2, '0')
  return `p${n}_${x.toFixed(4)}_${y.toFixed(4)}_${w.toFixed(4)}_${h.toFixed(4)}`
}

/** Découpe pré-calculée disponible pour ce rectangle, ou null. */
export function precut(m: PageManifest, crop: Crop, pageOffset: number) {
  const key = cropKey(crop, pageOffset)
  const size = key && m.crops?.[key]
  return key && size ? { key, url: cropUrl(m.assetId, key), w: size[0], h: size[1] } : null
}

/**
 * URL(s) qu'il faudra charger pour afficher cette découpe : le fichier
 * pré-découpé s'il existe, sinon la page. Sert au préchargement de l'étape
 * suivante.
 */
export function visualUrl(m: PageManifest, crop: Crop | undefined, pageOffset: number): string | null {
  if (!crop) return null
  const pre = precut(m, crop, pageOffset)
  if (pre) return pre.url
  const page = m.pages.find((p) => p.n === crop.page + pageOffset)
  return page ? pageUrl(m.assetId, page.file) : null
}

const warmed = new Set<string>()

/** Précharge des images en arrière-plan, une seule fois par URL. */
export function warm(urls: (string | null)[]): void {
  for (const u of urls) {
    if (!u || warmed.has(u)) continue
    warmed.add(u)
    const img = new Image()
    img.decoding = 'async'
    img.src = u
  }
}
