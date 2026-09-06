/**
 * Déroulement d'un tutoriel : une étape à l'écran, un gros bouton pour
 * avancer, le matériel concerné toujours visible à côté.
 *
 * Tout se lit sur une **vue** — le tutoriel filtré pour l'effectif choisi.
 * Les étapes qui ne concernent pas cet effectif n'existent pas ici.
 *
 * Règle de conception : le bouton principal dit ce qu'il fait ; on ne
 * répète jamais son libellé dans le corps de l'étape.
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Aid, Component, Crop, Mode, Tutorial, Variant } from '../engine/types'
import { MODE_INFO, assetIdsOf, bookOf, playerLabel } from '../engine/types'
import { DEFAULT_PREFS, type Prefs } from '../engine/prefs'
import { voSpansFor } from '../engine/vo'
import {
  clampPosition, componentsOf, indexOf, next, prev, stepAt, totalSteps, viewFor,
  type IndexRow,
} from '../engine/tutorial'
import {
  clearSave, elapsedOf, formatClock, loadSave, newSave, writeSave, type Save,
} from '../engine/progress'
import { Thumb, Visual } from './Visual'
import { useManifests, visualUrl, warm } from '../engine/assets'
import { WidgetView } from './widgets'
import { Timer } from './Timer'
import { Sheet } from './Sheet'
import { AidSheet, AidsSheet, OutsideMark, voAction, type VoProps } from './Aids'
import { IndexRowSheet, IndexSheet } from './IndexSheet'
import { VoScope, VoText } from './Vo'
import { themeBackground, themePanel, themeStyle } from './theme'
import {
  Aids, Alert, ArrowLeft, ArrowRight, AZ, Bulb, Check, FlagEn, Grid, Home, List, Outside,
  Settings, Trophy, STEP_KIND,
} from './icons'

/**
 * Un panneau ouvert par-dessus l'étape.
 *
 * Les panneaux s'empilent : depuis l'index du matériel on ouvre une fiche,
 * depuis l'index alphabétique on ouvre une aide de jeu, depuis une aide on
 * revient à la liste. Refermer un panneau rend celui d'en dessous, tel
 * qu'on l'avait laissé — c'est la seule règle de navigation à retenir.
 */
type Panel =
  | { kind: 'jump' }
  | { kind: 'parts' }
  | { kind: 'part'; component: Component }
  | { kind: 'aids' }
  | { kind: 'aid'; aid: Aid; focus?: string }
  | { kind: 'index' }
  | { kind: 'row'; row: IndexRow }

/** Écran de fin : ce qu'on vient de terminer n'est pas la même chose selon le mode. */
const DONE_TITLE: Record<Mode, string> = {
  tuto: 'Partie tutorielle terminée',
  setup: 'Le jeu est installé',
  reprise: 'La partie est remontée',
  recap: 'Règles rafraîchies',
}

const DONE_LEAD: Record<Mode, string> = {
  tuto:
    'Vous connaissez la mise en place, le tour de jeu et la fin de manche. Rejouez maintenant une partie complète avec les règles officielles.',
  setup:
    'Tout est en place. Bonne partie — et si un point de règle vous échappe, le rappel des règles est à un bouton d’ici.',
  reprise:
    'La table est dans l’état où vous l’aviez laissée. Relisez vos objectifs en cours, et reprenez où vous en étiez.',
  recap:
    'Vous avez tout revu, dans l’ordre. Installez le jeu et lancez-vous : le livret n’est là que pour les cas particuliers.',
}

interface Props {
  tutorial: Tutorial
  /** Ce qu'on est venu chercher : première partie, mise en place, rappel. */
  mode: Mode
  /** Effectif choisi pour cette partie. */
  players: number
  /** true pour repartir de zéro, false pour reprendre la sauvegarde. */
  restart: boolean
  prefs?: Prefs
  /** Pour la bascule VO du bandeau, enregistrée avec les autres réglages. */
  onPrefs?: (p: Prefs) => void
  onOpenSettings?: () => void
  onExit: () => void
}

/**
 * Les variétés d'un composant, en aide de jeu.
 *
 * Six symboles de jeton Exploration, cinq jetons de combat, quatre couleurs
 * de Puissance : le livret les décrit une fois, et le joueur y retourne dix
 * fois par partie. La fiche du matériel les garde sous la main, avec leur
 * vignette quand la reconnaître à l'œil compte.
 */
function Variants({ tutorial, list, vo }: { tutorial: Tutorial; list: Variant[]; vo: VoProps }) {
  // Un repérage par variété : l'étiquette et son effet. Sur une liste de six
  // faces de dé, marquer le terme une seule fois pour tout le tableau ne
  // servirait à rien — on veut le mot imprimé en face de chaque ligne.
  const marks = tutorial.vo && vo.marks
    ? list.map((v) => voSpansFor(tutorial.vo!.terms, [v.label, v.effect]))
    : null

  return (
    <div className="variants">
      {list.map((v, i) => (
        <div className="variant" key={v.label} style={v.tint ? ({ '--part-tint': v.tint } as CSSProperties) : undefined}>
          {v.crop && (
            <span className="variant-thumb">
              <Thumb book={bookOf(tutorial, v.crop)} crop={v.crop} glyph="token" name={v.label} />
            </span>
          )}
          <div className="variant-txt">
            <div className="variant-head">
              <span className="variant-label">
                <VoText text={v.label} spans={marks?.[i][0]} way={vo.way} />
              </span>
              {v.qty && <span className="variant-qty">{v.qty}</span>}
            </div>
            <p className="variant-effect">
              <VoText text={v.effect} spans={marks?.[i][1]} way={vo.way} />
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Runner({
  tutorial, mode, players, restart, prefs = DEFAULT_PREFS, onPrefs, onOpenSettings, onExit,
}: Props) {
  const view = useMemo(() => viewFor(tutorial, players, mode), [tutorial, players, mode])

  const [save, setSave] = useState<Save>(() => {
    const existing = restart ? null : loadSave(tutorial.id, mode)
    if (!existing || existing.players !== players) return newSave(tutorial, players, mode)
    // Le contenu a pu changer depuis la dernière session : on ramène la
    // position sur une étape qui existe encore.
    return { ...existing, ...clampPosition(view, existing.chapter, existing.step) }
  })

  // Une pile, pas trois booléens : fermer rend toujours le panneau d'avant.
  const [stack, setStack] = useState<Panel[]>([])
  const [finished, setFinished] = useState(false)

  const openPanel = useCallback((panel: Panel) => setStack((s) => [...s, panel]), [])
  const closePanel = useCallback(() => setStack((s) => s.slice(0, -1)), [])

  // Une ligne d'index mène à la fiche d'où elle vient. Quand elle porte
  // elle-même sa réponse, on l'ouvre telle quelle.
  const goFromIndex = useCallback((row: IndexRow) => {
    if (row.target.kind === 'aid') {
      openPanel({ kind: 'aid', aid: row.target.aid, focus: row.target.entry?.id })
    } else if (row.target.kind === 'part') {
      openPanel({ kind: 'part', component: row.target.component })
    } else {
      openPanel({ kind: 'row', row })
    }
  }, [openPanel])

  // Toute mutation de l'état passe par ici : la sauvegarde suit la
  // progression sans qu'aucun appelant n'ait à y penser.
  const update = useCallback((patch: Partial<Save>) => {
    setSave((s) => {
      const merged = { ...s, ...patch }
      writeSave(merged)
      return merged
    })
  }, [])

  const chapter = view.chapters[save.chapter]
  const step = stepAt(view, save)
  const total = useMemo(() => totalSteps(view), [view])
  const position = indexOf(view, save.chapter, save.step)
  const parts = useMemo(() => (step ? componentsOf(tutorial, step) : []), [tutorial, step])

  // Termes de la version originale. Un terme n'est marqué qu'une fois par
  // étape, dans l'ordre où le joueur lit : titre, lignes, avertissement,
  // conseil. `way` décide de la langue affichée, pas du repérage.
  const way = prefs.voMode === 'vo' ? 'vo' : 'fr'
  const voOn = Boolean(tutorial.vo) && prefs.voMode !== 'off'

  // Ce que les panneaux reçoivent : la langue affichée, la bascule, et le
  // fait que le lecteur ait ou non demandé le surlignage. La bascule est
  // absente si les termes sont masqués — le réglage est plus fort que le
  // bouton.
  const vo: VoProps = useMemo(() => ({
    tutorial,
    way,
    marks: voOn,
    onWay: onPrefs && voOn
      ? (w: typeof way) => onPrefs({ ...prefs, voMode: w })
      : undefined,
  }), [tutorial, way, voOn, onPrefs, prefs])
  const marks = useMemo(() => {
    if (!tutorial.vo || !voOn || !step) return null
    const body = step.body ?? []
    const spans = voSpansFor(tutorial.vo.terms, [step.title, ...body, step.warn ?? '', step.tip ?? ''])
    return { title: spans[0], body: spans.slice(1, 1 + body.length), warn: spans[1 + body.length], tip: spans[2 + body.length] }
  }, [tutorial.vo, voOn, step])

  // Précharge les visuels de l'étape suivante pendant que le joueur lit
  // celle-ci : au tap sur « Fait », l'image est déjà là.
  const manifests = useManifests(assetIdsOf(tutorial))
  useEffect(() => {
    const target = next(view, save.chapter, save.step)
    if (!target) return
    const s = stepAt(view, target)
    if (!s) return
    const nextParts = componentsOf(tutorial, s)
    // Chaque découpe sait de quel livret elle vient : on précharge dans le
    // manifeste du sien.
    const urlOf = (crop?: Crop) => {
      if (!crop) return null
      const book = bookOf(tutorial, crop)
      const m = manifests[book.assetId]
      return m ? visualUrl(m, crop, book.pageOffset) : null
    }
    warm([urlOf(s.crop ?? nextParts[0]?.crop), ...nextParts.map((c) => urlOf(c.crop))])
  }, [manifests, view, tutorial, save.chapter, save.step])

  const goNext = useCallback(() => {
    if (!step) return
    const done = save.done.includes(step.id) ? save.done : [...save.done, step.id]
    const target = next(view, save.chapter, save.step)
    if (!target) {
      // Fin du tutoriel : on arrête le chronomètre pour figer le temps final.
      update({ done, elapsedMs: elapsedOf(save, Date.now()), runningSince: null })
      setFinished(true)
      return
    }
    update({ done, ...target })
  }, [save, step, view, update])

  const goPrev = useCallback(() => {
    const target = prev(view, save.chapter, save.step)
    if (target) update(target)
  }, [save.chapter, save.step, view, update])

  const toggleTimer = useCallback(() => {
    if (save.runningSince) {
      update({ elapsedMs: elapsedOf(save, Date.now()), runningSince: null })
    } else {
      update({ runningSince: Date.now() })
    }
  }, [save, update])

  // Le chronomètre démarre au premier pas du joueur, pas à l'ouverture de
  // l'écran : on ne compte pas le temps passé à lire la présentation.
  useEffect(() => {
    if (position > 0 && save.runningSince === null && save.elapsedMs === 0) {
      update({ runningSince: Date.now() })
    }
  }, [position, save.runningSince, save.elapsedMs, update])

  /*
   * Clavier, pour l'ordinateur : ESPACE avance, Maj+ESPACE recule. Les
   * flèches et Entrée font de même. Sans effet sur iPad, et désactivé quand
   * un panneau est ouvert pour ne pas naviguer derrière lui.
   */
  useEffect(() => {
    if (finished || stack.length > 0) return
    const onKey = (e: KeyboardEvent) => {
      // Ne pas voler l'espace à un bouton ou un champ qui a le focus.
      const el = document.activeElement
      const typing = el instanceof HTMLElement &&
        (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName))

      if (e.key === ' ' || e.code === 'Space') {
        if (typing) return
        e.preventDefault()
        if (e.shiftKey) goPrev()
        else goNext()
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, stack.length, goNext, goPrev])

  const theme = themeStyle(tutorial.theme, prefs)
  // Les panneaux modaux ont leur propre fond : on ne leur passe pas celui du thème.
  const panel_ = themePanel(tutorial.theme, prefs)

  // Le rebond de défilement de l'iPad laisse voir le fond de la page, pas
  // celui de l'application : sans cela, un tutoriel clair clignoterait noir
  // à chaque à-coup du doigt.
  useEffect(() => {
    const { background } = document.body.style
    document.body.style.background = themeBackground(tutorial.theme, prefs)
    return () => { document.body.style.background = background }
  }, [tutorial.theme, prefs])

  if (finished) {
    return (
      <div className="app" style={theme}>
        <div className="done-screen">
          <div className="done-badge"><Trophy aria-hidden /></div>
          <div>
            <div className="done-title">{DONE_TITLE[mode]}</div>
            <div className="done-time">
              {formatClock(save.elapsedMs)} — {tutorial.title}, {playerLabel(tutorial.players, players).toLowerCase()}
            </div>
          </div>
          <p className="brand-tag" style={{ maxWidth: '52ch' }}>{DONE_LEAD[mode]}</p>
          <div className="done-actions">
            <button
              type="button"
              className="btn btn-lg btn-ghost"
              onClick={() => {
                clearSave(tutorial.id)
                setSave(newSave(tutorial, players, mode))
                setFinished(false)
              }}
            >
              Recommencer
            </button>
            <button type="button" className="btn btn-lg btn-primary" onClick={onExit}>
              <Home aria-hidden /> Accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!chapter || !step) {
    return (
      <div className="app" style={theme}>
        <div className="done-screen">
          <p className="empty">Ce tutoriel ne contient aucune étape pour cet effectif.</p>
          <button type="button" className="btn btn-lg btn-primary" onClick={onExit}>
            <Home aria-hidden /> Accueil
          </button>
        </div>
      </div>
    )
  }

  const kind = STEP_KIND[step.kind]
  const isLast = next(view, save.chapter, save.step) === null

  return (
    <div className="app" style={theme}>
      <VoScope language={tutorial.vo?.language ?? 'anglais'}>
        <header className="topbar">
          <button type="button" className="btn btn-ghost btn-icon" onClick={onExit} aria-label="Retour à l'accueil">
            <Home aria-hidden />
          </button>

          <div className="topbar-id">
            <span className="topbar-title">{tutorial.title}</span>
            <span className="topbar-sub">
              {MODE_INFO[mode].label.toUpperCase()} · {playerLabel(tutorial.players, players).toUpperCase()}
            </span>
          </div>

          <div className="topbar-spacer" />

          {tutorial.vo && onPrefs && (
            <button
              type="button"
              className={`btn btn-ghost btn-vo${prefs.voMode === 'vo' ? ' on' : ''}`}
              // Le bouton bascule la langue des termes. « Masqués » se règle
              // dans les réglages : ici, on veut le geste d'un seul doigt.
              onClick={() => onPrefs({ ...prefs, voMode: prefs.voMode === 'vo' ? 'fr' : 'vo' })}
              aria-pressed={prefs.voMode === 'vo'}
              aria-label={`Écrire les termes en ${tutorial.vo.language}`}
              title={
                prefs.voMode === 'vo'
                  ? `Termes écrits en ${tutorial.vo.language}, comme sur votre matériel`
                  : `Écrire les termes en ${tutorial.vo.language}, comme sur votre matériel`
              }
            >
              <FlagEn aria-hidden />
              VO
            </button>
          )}

          {mode !== 'setup' && (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => openPanel({ kind: 'parts' })}
              aria-label="Matériel du jeu"
              title="Matériel"
            >
              <Grid aria-hidden />
            </button>
          )}

          {/* Les aides de jeu se consultent en partie, pas seulement pendant
              la lecture : elles sont là dans tous les modes. */}
          {tutorial.aids?.length ? (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => openPanel({ kind: 'aids' })}
              aria-label="Aides de jeu"
              title="Aides de jeu"
            >
              <Aids aria-hidden />
            </button>
          ) : null}

          {(tutorial.aids?.length || tutorial.index?.length) ? (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => openPanel({ kind: 'index' })}
              aria-label="Index alphabétique"
              title="Index"
            >
              <AZ aria-hidden />
            </button>
          ) : null}

          {onOpenSettings && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={onOpenSettings} aria-label="Réglages">
              <Settings aria-hidden />
            </button>
          )}

          <Timer elapsedMs={save.elapsedMs} runningSince={save.runningSince} onToggle={toggleTimer} />
        </header>

        <nav className="chapters" aria-label="Chapitres">
          {view.chapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`chapter-pill${i === save.chapter ? ' active' : i < save.chapter ? ' done' : ''}`}
              onClick={() => update({ chapter: i, step: 0 })}
            >
              <span className="chapter-pill-num">{i + 1}</span>
              {c.title}
            </button>
          ))}
        </nav>

        <div className="progress">
          <div className="progress-fill" style={{ width: `${(position / Math.max(total - 1, 1)) * 100}%` }} />
        </div>

        <main className="stage">
          <div className="stage-main">
            <div className="step-head">
              <span className="step-kind" style={{ '--kind': kind.tint } as CSSProperties}>
                <kind.Icon aria-hidden /> {kind.label}
              </span>
              {/* Cette étape n'est pas dans le livret : on le dit avant que
                  le joueur la lise, pas après. */}
              {step.ext && <OutsideMark source={step.extSource} />}
              {/* Aller directement à n'importe quelle étape du chapitre. */}
              <button type="button" className="btn btn-ghost step-jump" onClick={() => openPanel({ kind: 'jump' })}>
                <List aria-hidden />
                Étape {save.step + 1} / {chapter.steps.length}
              </button>
            </div>

            <h1 className="step-title"><VoText text={step.title} spans={marks?.title} way={way} /></h1>

            {step.body?.length ? (
              <ul className="step-body">
                {step.body.map((line, i) => (
                  <li className="step-line" key={i}>
                    {/* La puce et le texte sont les deux seuls enfants du
                        conteneur flex : sans cette enveloppe, chaque terme
                        surligné deviendrait un élément flex, avec sa
                        gouttière. */}
                    <span><VoText text={line} spans={marks?.body[i]} way={way} /></span>
                  </li>
                ))}
              </ul>
            ) : null}

            {step.warn && (
              <div className="callout callout-warn">
                <Alert aria-hidden /><span><VoText text={step.warn} spans={marks?.warn} way={way} /></span>
              </div>
            )}

            {step.widget && <WidgetView widget={step.widget} resetKey={step.id} />}

            {step.tip && (
              <div className="callout callout-tip">
                <Bulb aria-hidden /><span><VoText text={step.tip} spans={marks?.tip} way={way} /></span>
              </div>
            )}

            {step.extTip && (
              <div className="callout callout-ext">
                <Outside aria-hidden />
                <span>
                  <b>Hors livret{step.extSource ? ` — ${step.extSource}` : ''}.</b> {step.extTip}
                </span>
              </div>
            )}

            {step.ref && <div className="step-ref">Règles officielles — {step.ref}</div>}
          </div>

          <aside className="stage-visual">
            <div className="visual">
              <Visual
                book={bookOf(tutorial, step.crop ?? parts[0]?.crop)}
                crop={step.crop ?? parts[0]?.crop}
                glyph={parts[0]?.glyph ?? 'board'}
                name={step.title}
              />
            </div>

            {parts.length > 0 && (
              <div className="parts">
                {parts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="part"
                    style={{ '--part-tint': c.tint ?? tutorial.theme.accent } as CSSProperties}
                    onClick={() => openPanel({ kind: 'part', component: c })}
                  >
                    <span className="part-thumb">
                      <Thumb
                        book={bookOf(tutorial, c.crop)}
                        crop={c.crop}
                        glyph={c.glyph}
                        name={c.name}
                      />
                    </span>
                    <span className="part-txt">
                      <span className="part-name">
                        {c.name}
                        {c.variants && <span className="part-types">{c.variants.length} types</span>}
                      </span>
                      {c.qty && <span className="part-qty">{c.qty}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </main>

        <footer className="actionbar">
          <button
            type="button"
            className="btn btn-lg btn-ghost btn-icon"
            onClick={goPrev}
            disabled={position === 0}
            aria-label="Étape précédente"
          >
            <ArrowLeft aria-hidden />
          </button>

          <span className="actionbar-count">{position + 1}/{total}</span>

          <button type="button" className="btn btn-lg btn-primary" onClick={goNext}>
            {isLast ? <><Check aria-hidden /> Terminer</> : <>{step.kind === 'info' ? 'Compris' : 'Fait'} <ArrowRight aria-hidden /></>}
          </button>
        </footer>

        {/*
          * La pile de panneaux. Tous restent montés : celui du dessous garde
          * sa position de défilement et redevient actif dès qu'on referme
          * celui du dessus.
          */}
        {stack.map((panel, i) => {
          const behind = i < stack.length - 1
          const key = `${i}-${panel.kind}`

          if (panel.kind === 'jump') {
            return (
              <Sheet key={key} title={chapter.title} onClose={closePanel} style={panel_} behind={behind}>
                <p className="sheet-lead">{chapter.goal}</p>
                <ol className="jump-list">
                  {chapter.steps.map((s, n) => {
                    const k = STEP_KIND[s.kind]
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={`jump-item${n === save.step ? ' current' : ''}${save.done.includes(s.id) ? ' done' : ''}`}
                          onClick={() => { update({ step: n }); closePanel() }}
                        >
                          <span className="jump-num">{n + 1}</span>
                          <span className="jump-icon" style={{ '--kind': k.tint } as CSSProperties}>
                            <k.Icon aria-hidden />
                          </span>
                          <span className="jump-title">{s.title}</span>
                          {s.ext && <Outside aria-hidden className="jump-ext" />}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </Sheet>
            )
          }

          if (panel.kind === 'parts') {
            return (
              <Sheet
                key={key}
                title={`Matériel — ${tutorial.title}`}
                onClose={closePanel}
                style={panel_}
                behind={behind}
                action={voAction(vo)}
              >
                <div className="parts-index">
                  {tutorial.components.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="part"
                      style={{ '--part-tint': c.tint ?? tutorial.theme.accent } as CSSProperties}
                      onClick={() => openPanel({ kind: 'part', component: c })}
                    >
                      <span className="part-thumb">
                        <Thumb book={bookOf(tutorial, c.crop)} crop={c.crop} glyph={c.glyph} name={c.name} />
                      </span>
                      <span className="part-txt">
                        <span className="part-name">
                          <VoText
                            text={c.name}
                            spans={tutorial.vo && voOn ? voSpansFor(tutorial.vo.terms, [c.name])[0] : undefined}
                            way={way}
                          />
                          {c.variants && <span className="part-types">{c.variants.length} types</span>}
                        </span>
                        {c.qty && <span className="part-qty">{c.qty}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </Sheet>
            )
          }

          if (panel.kind === 'part') {
            const c = panel.component
            const cMarks = tutorial.vo && voOn
              ? voSpansFor(tutorial.vo.terms, [c.name, c.note ?? ''])
              : null
            return (
              <Sheet
                key={key}
                title={c.name}
                onClose={closePanel}
                style={panel_}
                behind={behind}
                action={voAction(vo)}
              >
                <div className={`part-detail${c.variants ? ' part-detail-aid' : ''}`}>
                  <div className="visual">
                    <Visual book={bookOf(tutorial, c.crop)} crop={c.crop} glyph={c.glyph} name={c.name} tint={c.tint} />
                  </div>
                  <div>
                    <div className="part-detail-name">
                      <VoText text={c.name} spans={cMarks?.[0]} way={way} />
                    </div>
                    {c.qty && <div className="part-qty" style={{ marginBottom: 12 }}>{c.qty}</div>}
                    {c.note && (
                      <p className="part-detail-note">
                        <VoText text={c.note} spans={cMarks?.[1]} way={way} />
                      </p>
                    )}
                  </div>
                </div>
                {c.variants && <Variants tutorial={tutorial} list={c.variants} vo={vo} />}
              </Sheet>
            )
          }

          if (panel.kind === 'aids') {
            return (
              <AidsSheet
                key={key}
                tutorial={tutorial}
                style={panel_}
                onClose={closePanel}
                behind={behind}
                onPick={(aid) => openPanel({ kind: 'aid', aid })}
              />
            )
          }

          if (panel.kind === 'aid') {
            return (
              <AidSheet
                key={key}
                tutorial={tutorial}
                aid={panel.aid}
                focus={panel.focus}
                style={panel_}
                onClose={closePanel}
                behind={behind}
                vo={vo}
              />
            )
          }

          if (panel.kind === 'index') {
            return (
              <IndexSheet
                key={key}
                tutorial={tutorial}
                style={panel_}
                onClose={closePanel}
                onGo={goFromIndex}
                behind={behind}
                vo={vo}
              />
            )
          }

          return (
            <IndexRowSheet
              key={key}
              row={panel.row}
              style={panel_}
              onClose={closePanel}
              behind={behind}
              vo={vo}
            />
          )
        })}

    </VoScope>
    </div>
  )
}
