/**
 * Déroulement d'un tutoriel : une étape à l'écran, un gros bouton pour
 * avancer, le matériel concerne toujours visible à côté.
 *
 * Règle de conception : le bouton principal dit ce qu'il fait ; on ne
 * répète jamais son libellé dans le corps de l'étape.
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Component, Tutorial } from '../engine/types'
import {
  clampPosition, componentsOf, indexOf, next, prev, totalSteps,
} from '../engine/tutorial'
import {
  clearSave, elapsedOf, formatClock, loadSave, newSave, writeSave, type Save,
} from '../engine/progress'
import { Thumb, Visual } from './Visual'
import { useManifest, visualUrl, warm } from '../engine/assets'
import { WidgetView } from './widgets'
import { Timer } from './Timer'
import { Sheet } from './Sheet'
import {
  Alert, ArrowLeft, ArrowRight, Bulb, Check, CheckCircle, Circle, Grid, Home, Trophy, STEP_KIND,
} from './icons'

interface Props {
  tutorial: Tutorial
  /** true pour répartir de zéro, false pour reprendre la sauvegarde. */
  restart: boolean
  onExit: () => void
}

export function Runner({ tutorial, restart, onExit }: Props) {
  const [save, setSave] = useState<Save>(() => {
    const existing = restart ? null : loadSave(tutorial.id)
    if (!existing) return newSave(tutorial)
    // Le contenu à pu changer depuis la dernière session : on ramène la
    // position sur une étape qui existe encore.
    const pos = clampPosition(tutorial, existing.chapter, existing.step)
    return { ...existing, ...pos }
  })

  const [part, setPart] = useState<Component | null>(null)
  const [index, setIndex] = useState(false)
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

  const chapter = tutorial.chapters[save.chapter]
  const step = chapter?.steps[save.step]
  const total = useMemo(() => totalSteps(tutorial), [tutorial])
  const position = indexOf(tutorial, save.chapter, save.step)
  const parts = useMemo(() => (step ? componentsOf(tutorial, step) : []), [tutorial, step])

  // Précharge les visuels de l'étape suivante pendant que le joueur lit
  // celle-ci : au tap sur « Fait », l'image est déjà là.
  const manifest = useManifest(tutorial.source.assetId)
  useEffect(() => {
    if (!manifest) return
    const target = next(tutorial, save.chapter, save.step)
    if (!target) return
    const s = tutorial.chapters[target.chapter]?.steps[target.step]
    if (!s) return
    const off = tutorial.source.pageOffset
    const nextParts = componentsOf(tutorial, s)
    warm([
      visualUrl(manifest, s.crop ?? nextParts[0]?.crop, off),
      ...nextParts.map((c) => visualUrl(manifest, c.crop, off)),
    ])
  }, [manifest, tutorial, save.chapter, save.step])

  const goNext = useCallback(() => {
    if (!step) return
    const done = save.done.includes(step.id) ? save.done : [...save.done, step.id]
    const target = next(tutorial, save.chapter, save.step)
    if (!target) {
      // Fin du tutoriel : on arrête le chronomètre pour figer le temps final.
      update({
        done,
        elapsedMs: elapsedOf(save, Date.now()),
        runningSince: null,
      })
      setFinished(true)
      return
    }
    update({ done, ...target })
  }, [save, step, tutorial, update])

  const goPrev = useCallback(() => {
    const target = prev(tutorial, save.chapter, save.step)
    if (target) update(target)
  }, [save.chapter, save.step, tutorial, update])

  const toggleTimer = useCallback(() => {
    if (save.runningSince) {
      update({ elapsedMs: elapsedOf(save, Date.now()), runningSince: null })
    } else {
      update({ runningSince: Date.now() })
    }
  }, [save, update])

  // Le chronomètre démarre au premier pas du joueur, pas à l'ouverture de
  // l'écran : on ne compte pas le temps passe à lire la présentation.
  useEffect(() => {
    if (position > 0 && save.runningSince === null && save.elapsedMs === 0) {
      update({ runningSince: Date.now() })
    }
  }, [position, save.runningSince, save.elapsedMs, update])

  // Navigation au clavier : utile pour tester au bureau, inoffensif sur iPad.
  useEffect(() => {
    if (finished || part || index) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, part, index, goNext, goPrev])

  const theme = {
    '--accent': tutorial.accent,
    '--accent-2': tutorial.accent2,
  } as CSSProperties

  if (finished) {
    return (
      <div className="app" style={theme}>
        <div className="done-screen">
          <div className="done-badge"><Trophy aria-hidden /></div>
          <div>
            <div className="done-title">Partie tutorielle terminée</div>
            <div className="done-time">{formatClock(save.elapsedMs)} — {tutorial.title}</div>
          </div>
          <p className="brand-tag" style={{ maxWidth: '52ch' }}>
            Vous connaissez la mise en place, le tour de jeu et la phase Événement.
            Rejouez maintenant une partie complète avec les règles officielles.
          </p>
          <div className="done-actions">
            <button
              type="button"
              className="btn btn-lg btn-ghost"
              onClick={() => {
                clearSave(tutorial.id)
                setSave(newSave(tutorial))
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
          <p className="empty">Ce tutoriel ne contient aucune étape.</p>
          <button type="button" className="btn btn-lg btn-primary" onClick={onExit}>
            <Home aria-hidden /> Accueil
          </button>
        </div>
      </div>
    )
  }

  const kind = STEP_KIND[step.kind]
  const isLast = next(tutorial, save.chapter, save.step) === null

  return (
    <div className="app" style={theme}>
      <header className="topbar">
        <button type="button" className="btn btn-ghost btn-icon" onClick={onExit} aria-label="Retour à l'accueil">
          <Home aria-hidden />
        </button>

        <div className="topbar-id">
          <span className="topbar-title">{tutorial.title}</span>
          <span className="topbar-sub">TUTO v{tutorial.contentVersion}</span>
        </div>

        <div className="topbar-spacer" />

        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIndex(true)} aria-label="Index du matériel">
          <Grid aria-hidden />
        </button>

        <Timer elapsedMs={save.elapsedMs} runningSince={save.runningSince} onToggle={toggleTimer} />
      </header>

      <nav className="chapters" aria-label="Chapitres">
        {tutorial.chapters.map((c, i) => (
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
        <div className="stage-main scroll">
          <span className="step-kind" style={{ '--kind': kind.tint } as CSSProperties}>
            <kind.Icon aria-hidden /> {kind.label}
          </span>

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
                  style={{ '--part-tint': c.tint ?? tutorial.accent } as CSSProperties}
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

      {part && (
        <Sheet title="Matériel" onClose={() => setPart(null)}>
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

      {index && (
        <Sheet title={`Matériel — ${tutorial.title}`} onClose={() => setIndex(false)}>
          <div className="parts-index">
            {tutorial.components.map((c) => (
              <button
                key={c.id}
                type="button"
                className="part"
                style={{ '--part-tint': c.tint ?? tutorial.accent } as CSSProperties}
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

/** Puce de chapitre réutilisée par l'écran d'accueil. */
export function ChapterDots({ done, total }: { done: number; total: number }) {
  return (
    <span className="chip">
      {done >= total ? <CheckCircle aria-hidden width={16} height={16} /> : <Circle aria-hidden width={16} height={16} />}
      {done}/{total}
    </span>
  )
}
