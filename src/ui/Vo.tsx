/**
 * Termes de la version originale, dans le texte de l'étape.
 *
 * Quand la boîte posée sur la table n'est pas en français, les mots dont le
 * matériel porte un autre nom sont surlignés dans la consigne. Deux façons
 * de les lire, que le bouton VO du bandeau fait basculer :
 *
 *  - **en français** : le mot reste écrit en français, et la bulle donne le
 *    terme imprimé sur le matériel ;
 *  - **sur la boîte** : le mot **est remplacé** par le terme imprimé, et la
 *    bulle rappelle le français. La phrase, elle, reste en français : seuls
 *    les noms du matériel basculent, ce qui laisse lire la consigne tout en
 *    cherchant la bonne carte des yeux.
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
import { FlagEn } from './icons'

/** Ce que la bulle affiche, et dans quel sens. */
export type Way = 'fr' | 'vo'

/* ------------------------------------------------------------------ bulle */

interface Tip {
  term: VoTerm
  /** Ce que la bulle doit donner : le terme imprimé, ou le mot français. */
  other: string
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
  show: (el: HTMLElement, term: VoTerm, other: string, sticky: boolean) => void
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

  const show = useCallback((el: HTMLElement, term: VoTerm, other: string, sticky: boolean) => {
    const r = el.getBoundingClientRect()
    const above = r.top > 140
    setTip({
      term,
      other,
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
          <span className="vo-tip-en">{tip.other}</span>
          {tip.term.note && <span className="vo-tip-note">{tip.term.note}</span>}
        </span>
      )}
    </VoCtx.Provider>
  )
}

/* ------------------------------------------------------------ surlignage */

/** Le dernier mot d'un terme : c'est lui qui porte le nombre. */
const lastWord = (t: string) => t.trim().split(/\s+/).pop() ?? ''

/**
 * Le texte trouvé était-il au pluriel ? Le repérage compare des formes sans
 * « s » final : « les Rôdeurs » et « un Rôdeur » tombent tous deux sur la
 * même entrée. On regarde donc le mot tel qu'il est écrit.
 */
function isPlural(source: string, fr: string): boolean {
  const a = lastWord(source).toLowerCase()
  const b = lastWord(fr).toLowerCase()
  return /[sx]$/.test(a) && !/[sx]$/.test(b)
}

/**
 * Le pluriel anglais d'un terme, quand le glossaire ne le donne pas.
 *
 * La règle du « s » couvre la quasi-totalité des noms de matériel — Rooms,
 * Corridors, Action cards —, complétée par « es » après s, x, z, ch ou sh, et
 * par « ies » après une consonne et un y. Une abréviation entre parenthèses
 * reste telle quelle : « Hit Points (HP) » ne se pluralise pas.
 *
 * Un terme dont le français est déjà au pluriel ne passe jamais par ici :
 * `isPlural` le voit et n'accorde rien. Restent les vrais irréguliers —
 * Larva, Larvae — qui se déclarent dans le glossaire, par `enPlural`.
 */
function pluralOf(en: string): string {
  if (!/^[\p{L}\s'-]+$/u.test(en)) return en
  const last = lastWord(en)
  // Déjà au pluriel : « hit points », « special rules ». Un « s » final qui
  // suit ss, us ou is appartient au mot — class, bonus, Miss —, pas au nombre.
  if (/s$/i.test(last) && !/(ss|us|is)$/i.test(last)) return en
  if (/([sxz]|ch|sh)$/i.test(last)) return en + 'es'
  if (/[^aeiou]y$/i.test(last)) return en.slice(0, -1) + 'ies'
  return en + 's'
}

/**
 * Le terme imprimé, accordé au mot qu'il remplace.
 *
 * « Rôdeur » en tête de phrase devient « Creeper », pas « creeper » ; « les
 * Rôdeurs » devient « les Creepers ». Le glossaire écrit chaque terme comme
 * la boîte l'imprime : on ne touche qu'à la majuscule et au nombre, pour que
 * la phrase française reste lisible autour.
 */
function printed(term: VoTerm, source: string): string {
  const en = isPlural(source, term.fr) ? (term.enPlural ?? pluralOf(term.en)) : term.en
  const head = source[0]
  if (!head || head !== head.toUpperCase() || head === head.toLowerCase()) return en
  return en[0].toUpperCase() + en.slice(1)
}

function VoMark({ term, way, children }: { term: VoTerm; way: Way; children: string }) {
  const api = useContext(VoCtx)
  const ref = useRef<HTMLButtonElement>(null)
  const open = api?.tip?.el === ref.current

  // En français, le mot montre le terme imprimé ; sur la boîte, l'inverse.
  const shown = way === 'vo' ? printed(term, children) : children
  const other = way === 'vo' ? children : term.en

  const enter = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (api && ref.current && e.pointerType === 'mouse') api.show(ref.current, term, other, false)
  }
  const leave = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (api && ref.current && e.pointerType === 'mouse' && !api.tip?.sticky) api.hide(ref.current)
  }
  const click = () => {
    if (!api || !ref.current) return
    // Deuxième tape sur le même mot : on referme.
    if (open && api.tip?.sticky) api.hide()
    else api.show(ref.current, term, other, true)
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`vo-mark${open ? ' open' : ''}`}
      data-vo={way === 'vo' ? '' : undefined}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onClick={click}
      aria-label={
        way === 'vo'
          ? `${shown} — en français : ${children}`
          : `${children} — en ${api?.language ?? 'version originale'} : ${term.en}`
      }
    >
      {shown}
    </button>
  )
}

/**
 * Un texte d'étape, avec ses termes surlignés. Sans `spans`, le texte est
 * rendu tel quel : c'est le cas quand le joueur a coupé le surlignage, ou
 * quand le jeu n'a pas de glossaire.
 */
export function VoText({ text, spans, way = 'fr' }: { text: string; spans?: VoSpan[]; way?: Way }) {
  if (!spans?.length) return <>{text}</>

  const out: ReactNode[] = []
  let at = 0
  for (const [i, s] of spans.entries()) {
    if (s.start > at) out.push(text.slice(at, s.start))
    out.push(
      <VoMark key={`${s.start}-${i}`} term={s.term} way={way}>
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

/* ------------------------------------------------------------ la bascule */

/**
 * La bascule VO, telle qu'on la met dans l'en-tête d'un panneau.
 *
 * Le bandeau du tutoriel a la sienne, mais un panneau ouvert le recouvre —
 * et c'est justement dans l'index des salles ou la fiche d'un composant
 * qu'on a besoin du mot imprimé, la boîte ouverte sous les yeux. Le bouton
 * est donc partout où il y a du texte de jeu à lire.
 */
export function VoButton({
  language, way, onWay, compact = false,
}: {
  language: string
  way: Way
  onWay: (way: Way) => void
  /** Dans un en-tête de panneau : pas de libellé, juste le drapeau. */
  compact?: boolean
}) {
  const on = way === 'vo'
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-vo${on ? ' on' : ''}${compact ? ' btn-icon' : ''}`}
      onClick={() => onWay(on ? 'fr' : 'vo')}
      aria-pressed={on}
      aria-label={`Écrire les termes en ${language}`}
      title={on
        ? `Termes écrits en ${language}, comme sur votre matériel`
        : `Écrire les termes en ${language}, comme sur votre matériel`}
    >
      <FlagEn aria-hidden />
      {!compact && 'VO'}
    </button>
  )
}
