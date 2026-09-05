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
import type { Component, Mode, Tutorial } from '../engine/types'
import { MODE_INFO, playerLabel } from '../engine/types'
import { DEFAULT_PREFS, type Prefs } from '../engine/prefs'
import { voTermsIn } from '../engine/vo'
import {
  clampPosition, componentsOf, indexOf, next, prev, stepAt, totalSteps, viewFor,
} from '../engine/tutorial'
import {
  clearSave, elapsedOf, formatClock, loadSave, newSave, writeSave, type Save,
} from '../engine/progress'
import { Thumb, Visual } from './Visual'
import { useManifest, visualUrl, warm } from '../engine/assets'
import { WidgetView } from './widgets'
import { Timer } from './Timer'
import { Sheet } from './Sheet'
import { VoList } from './Vo'
import { themeBackground, themePanel, themeStyle } from './theme'
import {
  Alert, ArrowLeft, ArrowRight, Bulb, Check, FlagEn, Grid, Home, List, Settings, Trophy, STEP_KIND,
} from './icons'

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
  onOpenSettings?: () => void
  onExit: () => void
}

export function Runner({
  tutorial, mode, players, restart, prefs = DEFAULT_PREFS, onOpenSettings, onExit,
}: Props) {
  const view = useMemo(() => viewFor(tutorial, players, mode), [tutorial, players, mode])

  const [save, setSave] = useState<Save>(() => {
    const existing = restart ? null : loadSave(tutorial.id, mode)
    if (!existing || existing.players !== players) return newSave(tutorial, players, mode)
    // Le contenu a pu changer depuis la dernière session : on ramène la
    // position sur une étape qui existe encore.
    return { ...existing, ...clampPosition(view, existing.chapter, existing.step) }
  })

  const [part, setPart] = useState<Component | null>(null)
  const [index, setIndex] = useState(false)
  const [jump, setJump] = useState(false)
  const [vo, setVo] = useState(false)
  const [finished, setFinished] = useState(false)

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

  // Les termes du glossaire que cette étape emploie : c'est ce que le bouton
  // VO montre en premier, avant le glossaire entier.
  const voHere = useMemo(
    () => (tutorial.vo && step ? voTermsIn(tutorial.vo.terms, step, parts, chapter?.title) : []),
    [tutorial.vo, step, parts, chapter],
  )

  // Précharge les visuels de l'étape suivante pendant que le joueur lit
  // celle-ci : au tap sur « Fait », l'image est déjà là.
  const manifest = useManifest(tutorial.source.assetId)
  useEffect(() => {
    if (!manifest) return
    const target = next(view, save.chapter, save.step)
    if (!target) return
    const s = stepAt(view, target)
    if (!s) return
    const off = tutorial.source.pageOffset
    const nextParts = componentsOf(tutorial, s)
    warm([
      visualUrl(manifest, s.crop ?? nextParts[0]?.crop, off),
      ...nextParts.map((c) => visualUrl(manifest, c.crop, off)),
    ])
  }, [manifest, view, tutorial, save.chapter, save.step])

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
    if (finished || part || index || jump) return
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
  }, [finished, part, index, jump, goNext, goPrev])

  const theme = themeStyle(tutorial.theme, prefs)
  // Les panneaux modaux ont leur propre fond : on ne leur passe pas celui du thème.
  const panel = themePanel(tutorial.theme, prefs)

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
                clearSave(tutorial.id, mode)
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

        {tutorial.vo && (
          <button
            type="button"
            className="btn btn-ghost btn-vo"
            onClick={() => setVo(true)}
            aria-label={`Termes de la version ${tutorial.vo.language}`}
          >
            <FlagEn aria-hidden />
            VO
          </button>
        )}

        {mode !== 'setup' && (
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIndex(true)} aria-label="Index du matériel">
            <Grid aria-hidden />
          </button>
        )}

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
            {/* Aller directement à n'importe quelle étape du chapitre. */}
            <button type="button" className="btn btn-ghost step-jump" onClick={() => setJump(true)}>
              <List aria-hidden />
              Étape {save.step + 1} / {chapter.steps.length}
            </button>
          </div>

          <h1 className="step-title">{step.title}</h1>

          {step.body?.length ? (
            <ul className="step-body">
              {step.body.map((line, i) => (
                <li className="step-line" key={i}>{line}</li>
              ))}
            </ul>
          ) : null}

          {step.warn && (
            <div className="callout callout-warn">
              <Alert aria-hidden /><span>{step.warn}</span>
            </div>
          )}

          {step.widget && <WidgetView widget={step.widget} resetKey={step.id} />}

          {step.tip && (
            <div className="callout callout-tip">
              <Bulb aria-hidden /><span>{step.tip}</span>
            </div>
          )}

          {step.ref && <div className="step-ref">Règles officielles — {step.ref}</div>}
        </div>

        <aside className="stage-visual">
          <div className="visual">
            <Visual
              assetId={tutorial.source.assetId}
              pageOffset={tutorial.source.pageOffset}
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
                  onClick={() => setPart(c)}
                >
                  <span className="part-thumb">
                    <Thumb
                      assetId={tutorial.source.assetId}
                      pageOffset={tutorial.source.pageOffset}
                      crop={c.crop}
                      glyph={c.glyph}
                      name={c.name}
                    />
                  </span>
                  <span className="part-txt">
                    <span className="part-name">{c.name}</span>
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

      {jump && (
        <Sheet title={chapter.title} onClose={() => setJump(false)} style={panel}>
          <p className="sheet-lead">{chapter.goal}</p>
          <ol className="jump-list">
            {chapter.steps.map((s, i) => {
              const k = STEP_KIND[s.kind]
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`jump-item${i === save.step ? ' current' : ''}${save.done.includes(s.id) ? ' done' : ''}`}
                    onClick={() => { update({ step: i }); setJump(false) }}
                  >
                    <span className="jump-num">{i + 1}</span>
                    <span className="jump-icon" style={{ '--kind': k.tint } as CSSProperties}>
                      <k.Icon aria-hidden />
                    </span>
                    <span className="jump-title">{s.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </Sheet>
      )}

      {part && (
        <Sheet title="Matériel" onClose={() => setPart(null)} style={panel}>
          <div className="part-detail">
            <div className="visual">
              <Visual
                assetId={tutorial.source.assetId}
                pageOffset={tutorial.source.pageOffset}
                crop={part.crop}
                glyph={part.glyph}
                name={part.name}
                tint={part.tint}
              />
            </div>
            <div>
              <div className="part-detail-name">{part.name}</div>
              {part.qty && <div className="part-qty" style={{ marginBottom: 12 }}>{part.qty}</div>}
              {part.note && <p className="part-detail-note">{part.note}</p>}
            </div>
          </div>
        </Sheet>
      )}

      {vo && tutorial.vo && (
        <Sheet title={`Termes en ${tutorial.vo.language}`} onClose={() => setVo(false)} style={panel}>
          <p className="sheet-lead">
            Le tutoriel est en français, votre boîte ne l’est pas. En face de chaque mot,
            ce qui est imprimé sur le matériel
            {tutorial.vo.edition ? ` (${tutorial.vo.edition})` : ''}.
          </p>

          <div>
            <div className="section-label">Dans cette étape</div>
            {voHere.length ? (
              <VoList terms={voHere} />
            ) : (
              <p className="part-detail-note">Aucun terme propre au jeu dans cette étape.</p>
            )}
          </div>

          <div>
            <div className="section-label">Tout le jeu — {tutorial.vo.terms.length} termes</div>
            <VoList terms={tutorial.vo.terms} />
          </div>
        </Sheet>
      )}

      {index && (
        <Sheet title={`Matériel — ${tutorial.title}`} onClose={() => setIndex(false)} style={panel}>
          <div className="parts-index">
            {tutorial.components.map((c) => (
              <button
                key={c.id}
                type="button"
                className="part"
                style={{ '--part-tint': c.tint ?? tutorial.theme.accent } as CSSProperties}
                onClick={() => { setIndex(false); setPart(c) }}
              >
                <span className="part-thumb">
                  <Thumb
                    assetId={tutorial.source.assetId}
                    pageOffset={tutorial.source.pageOffset}
                    crop={c.crop}
                    glyph={c.glyph}
                    name={c.name}
                  />
                </span>
                <span className="part-txt">
                  <span className="part-name">{c.name}</span>
                  {c.qty && <span className="part-qty">{c.qty}</span>}
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}
