/**
 * Termes de la version originale, dans le texte de l'étape.
 *
 * Quand la boîte posée sur la table n'est pas en français, les mots dont le
 * matériel porte un autre nom sont **surlignés dans la consigne**. Un survol
 * à la souris, une tape sur l'iPad, et la bulle donne le terme imprimé.
 *
 * Le glossaire complet reste consultable sur la fiche du jeu, à l'accueil :
 * ici, on ne montre que ce que l'étape emploie, là où le joueur le lit.
 */

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type PointerEvent as ReactPointerEvent, type ReactNode,
} from 'react'
import type { VoTerm } from '../engine/types'
import type { VoSpan } from '../engine/vo'

/* ------------------------------------------------------------------ bulle */

interface Tip {
  term: VoTerm
  /** Le mot surligné : sert à ne fermer que sa propre bulle. */
  el: HTMLElement
  /** Ouverte au doigt : elle reste jusqu'à la prochaine tape. */
  sticky: boolean
  x: number
  y: number
  /** Au-dessus du mot, sauf trop près du haut de l'écran. */
  above: boolean
}

interface VoApi {
  tip: Tip | null
  /** Langue du matériel, pour ce que lit un lecteur d'écran. */
  language: string
  show: (el: HTMLElement, term: VoTerm, sticky: boolean) => void
  hide: (el?: HTMLElement) => void
}

const VoCtx = createContext<VoApi | null>(null)

/** Marge minimale entre le bord de l'écran et le centre de la bulle. */
const EDGE = 150

/**
 * Porte la bulle des termes. À placer autour du contenu d'un écran, à
 * l'intérieur de l'élément qui porte l'habillage du jeu : la bulle est en
 * position fixe — elle échappe ainsi au défilement du texte, qui la
 * découperait — mais hérite des couleurs du tutoriel.
 */
export function VoScope({ language, children }: { language: string; children: ReactNode }) {
  const [tip, setTip] = useState<Tip | null>(null)

  const show = useCallback((el: HTMLElement, term: VoTerm, sticky: boolean) => {
    const r = el.getBoundingClientRect()
    const above = r.top > 140
    setTip({
      term,
      el,
      sticky,
      x: Math.min(Math.max(r.left + r.width / 2, EDGE), window.innerWidth - EDGE),
      y: above ? r.top : r.bottom,
      above,
    })
  }, [])

  const hide = useCallback((el?: HTMLElement) => {
    setTip((t) => (t && el && t.el !== el ? t : null))
  }, [])

  // Posée en coordonnées d'écran, la bulle ne suit pas le mot : tout ce qui
  // le déplace la referme. Une tape ailleurs la referme aussi — sur le mot
  // lui-même, c'est le bouton qui décide (bascule).
  useEffect(() => {
    if (!tip) return
    const close = () => setTip(null)
    const away = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !tip.el.contains(e.target)) close()
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('pointerdown', away, true)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('pointerdown', away, true)
    }
  }, [tip])

  return (
    <VoCtx.Provider value={{ tip, language, show, hide }}>
      {children}
      {tip && (
        <span
          className="vo-tip"
          data-above={tip.above ? '' : undefined}
          style={{ left: tip.x, top: tip.y }}
          role="status"
        >
          <span className="vo-tip-en">{tip.term.en}</span>
          {tip.term.note && <span className="vo-tip-note">{tip.term.note}</span>}
        </span>
      )}
    </VoCtx.Provider>
  )
}

/* ------------------------------------------------------------ surlignage */

function VoMark({ term, children }: { term: VoTerm; children: string }) {
  const api = useContext(VoCtx)
  const ref = useRef<HTMLButtonElement>(null)
  const open = api?.tip?.el === ref.current

  const enter = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (api && ref.current && e.pointerType === 'mouse') api.show(ref.current, term, false)
  }
  const leave = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (api && ref.current && e.pointerType === 'mouse' && !api.tip?.sticky) api.hide(ref.current)
  }
  const click = () => {
    if (!api || !ref.current) return
    // Deuxième tape sur le même mot : on referme.
    if (open && api.tip?.sticky) api.hide()
    else api.show(ref.current, term, true)
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`vo-mark${open ? ' open' : ''}`}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onClick={click}
      aria-label={`${children} — en ${api?.language ?? 'version originale'} : ${term.en}`}
    >
      {children}
    </button>
  )
}

/**
 * Un texte d'étape, avec ses termes surlignés. Sans `spans`, le texte est
 * rendu tel quel : c'est le cas quand le joueur a coupé le surlignage, ou
 * quand le jeu n'a pas de glossaire.
 */
export function VoText({ text, spans }: { text: string; spans?: VoSpan[] }) {
  if (!spans?.length) return <>{text}</>

  const out: ReactNode[] = []
  let at = 0
  for (const [i, s] of spans.entries()) {
    if (s.start > at) out.push(text.slice(at, s.start))
    out.push(
      <VoMark key={`${s.start}-${i}`} term={s.term}>
        {text.slice(s.start, s.end)}
      </VoMark>,
    )
    at = s.end
  }
  if (at < text.length) out.push(text.slice(at))

  return <>{out}</>
}

/* -------------------------------------------------------------- glossaire */

/**
 * Le glossaire entier, en deux colonnes : le mot du tutoriel, et ce que le
 * joueur lit sur sa boîte. Sur la fiche du jeu, à l'accueil.
 */
export function VoList({ terms }: { terms: VoTerm[] }) {
  return (
    <dl className="vo-list">
      {terms.map((t) => (
        <div className="vo-row" key={`${t.fr}-${t.en}`}>
          <dt className="vo-fr">{t.fr}</dt>
          <dd className="vo-en">
            {t.en}
            {t.note && <span className="vo-note">{t.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
