/**
 * Affichage d'une découpe de page de règles.
 *
 * La page complète sert d'image de fond ; `background-size` et
 * `background-position` cadrent le rectangle demande. Un seul fichier par
 * page couvre donc toutes ses découpes, sans pre-découpage ni requête
 * supplémentaire.
 *
 * Formule de cadrage, pour un rectangle normalisé (x, y, w, h) :
 *   background-size     : 100/w % sur X, 100/h % sur Y
 *     -> l'image est agrandie pour que la découpe occupe toute la boîte.
 *   background-position : 100*x/(1-w) % sur X, 100*y/(1-h) % sur Y
 *     -> déduit de la définition CSS du positionnement en pourcentage,
 *        offset = (boîte - image) * p, qu'on résout pour offset = -x * image.
 */

import type { CSSProperties } from 'react'
import { rectOf, type Crop, type Glyph } from '../engine/types'
import { pageUrl, useManifest, type PageManifest } from '../engine/assets'
import { GlyphIcon } from './icons'

/** Position en pourcentage cadrant le bord `start` de la découpe. */
function axisPosition(start: number, size: number): number {
  // Une découpe pleine largeur (ou pleine hauteur) n'à rien à decaler.
  if (size >= 1) return 0
  return (100 * start) / (1 - size)
}

interface Framed {
  style: CSSProperties
  /** true si la découpe couvre la page entière (référence, pas gros plan). */
  wholePage: boolean
}

/**
 * Traduit une découpe en styles CSS, ou null si la page n'à pas été ingérée.
 * `pageOffset` convertit le numéro imprimé sur le livret en index de fichier.
 */
export function frame(crop: Crop, m: PageManifest, pageOffset: number): Framed | null {
  const page = m.pages.find((p) => p.n === crop.page + pageOffset)
  if (!page) return null

  const { x, y, w, h } = rectOf(crop)

  return {
    wholePage: w >= 1 && h >= 1,
    style: {
      backgroundImage: `url("${pageUrl(m.assetId, page.file)}")`,
      backgroundSize: `${100 / w}% ${100 / h}%`,
      backgroundPosition: `${axisPosition(x, w)}% ${axisPosition(y, h)}%`,
      // Rapport de forme réel de la découpe, pour ne jamais déformer un
      // visuel de règles : la boîte s'adapte à l'image, pas l'inverse.
      aspectRatio: `${w * page.w} / ${h * page.h}`,
    },
  }
}

interface Props {
  assetId: string
  pageOffset: number
  crop?: Crop
  glyph: Glyph
  /** Nom affiche par le visuel de secours. */
  name: string
  tint?: string
}

export function Visual({ assetId, pageOffset, crop, glyph, name, tint }: Props) {
  const manifest = useManifest(assetId)

  if (crop && manifest) {
    const f = frame(crop, manifest, pageOffset)
    if (f) {
      return (
        <>
          <div className="crop" style={f.style} role="img" aria-label={name} />
          {f.wholePage && <span className="crop-badge">Règles p.{crop.page}</span>}
        </>
      )
    }
  }

  return (
    <div className="visual-fallback" style={tint ? ({ '--accent': tint } as CSSProperties) : undefined}>
      <GlyphIcon glyph={glyph} aria-hidden />
      <span className="fb-name">{name}</span>
      {crop && manifest === false && (
        <span className="fb-hint">
          Visuel des règles p.{crop.page} — lancez <code>npm run ingest</code> pour l'afficher
        </span>
      )}
    </div>
  )
}

/** Vignette carrée utilisée dans les listes de matériel. */
export function Thumb({ assetId, pageOffset, crop, glyph, name }: Props) {
  const manifest = useManifest(assetId)

  // Une page entière réduite à 46 px est illisible : la vignette garde le
  // pictogramme tant que la découpe n'à pas été précisée dans le Studio.
  if (crop && manifest) {
    const f = frame(crop, manifest, pageOffset)
    if (f && !f.wholePage) {
      return (
        <span
          className="crop"
          role="img"
          aria-label={name}
          style={{ ...f.style, position: 'absolute', inset: 0, aspectRatio: 'auto', borderRadius: 0 }}
        />
      )
    }
  }

  return <GlyphIcon glyph={glyph} aria-hidden />
}
