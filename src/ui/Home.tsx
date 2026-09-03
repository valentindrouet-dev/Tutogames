/**
 * Écran d'accueil : bibliothèque de jeux et reprise de la partie en cours.
 *
 * Le numéro de version de l'application est affiche juste sous le titre,
 * conformément au système de versionnement décrit dans CHANGELOG.md.
 */

import { useMemo, useState, type CSSProperties } from 'react'
import type { Tutorial } from '../engine/types'
import { clearSave, formatClock, listSaves } from '../engine/progress'
import { totalSteps } from '../engine/tutorial'
import { Sheet } from './Sheet'
import { Check, CheckCircle, Circle, Crop, Info, Play } from './icons'
import version from '../../version.json'

interface Props {
  tutorials: Tutorial[]
  onStart: (tutorial: Tutorial, restart: boolean) => void
  /** Ouvre l'outil de découpe des visuels de règles. */
  onStudio: () => void
}

export function Home({ tutorials, onStart, onStudio }: Props) {
  const [about, setAbout] = useState<Tutorial | null>(null)
  const [saveTick, setSaveTick] = useState(0)

  // Recalculé après chaque abandon de partie, pour que la barre de reprise
  // disparaisse immédiatement.
  const saves = useMemo(() => listSaves(), [saveTick])
  const resumable = saves
    .map((s) => ({ save: s, tutorial: tutorials.find((t) => t.id === s.tutorialId) }))
    .filter((r): r is { save: (typeof saves)[number]; tutorial: Tutorial } => Boolean(r.tutorial))
    .find((r) => r.save.done.length > 0)

  return (
    <div className="app">
      <div className="home scroll">
        <header className="brand">
          <div className="brand-mark">
            <h1 className="brand-title">TutoGames</h1>
            {/* Version demandee, visible sous le titre. */}
            <span className="brand-version">v<b>{version.version}</b> · {version.date}</span>
          </div>
          <p className="brand-tag">
            Posez la tablette à côté de vous. Elle vous fait installer le jeu, puis
            jouer vos premiers tours, étape par étape.
          </p>
        </header>

        {resumable && (
          <div
            className="resume-bar"
            style={{ '--accent': resumable.tutorial.accent } as CSSProperties}
          >
            <div className="resume-text">
              <div className="resume-title">Reprendre {resumable.tutorial.title}</div>
              <div className="resume-sub">
                Étape {resumable.save.done.length} sur {totalSteps(resumable.tutorial)} ·{' '}
                {formatClock(resumable.save.elapsedMs)} de jeu
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-danger"
              onClick={() => {
                clearSave(resumable.tutorial.id)
                setSaveTick((n) => n + 1)
              }}
            >
              Abandonner
            </button>
            <button
              type="button"
              className="btn btn-lg btn-primary"
              onClick={() => onStart(resumable.tutorial, false)}
            >
              <Play aria-hidden /> Continuer
            </button>
          </div>
        )}

        <section>
          <div className="section-label">Jeux disponibles</div>
          <div className="game-grid">
            {tutorials.map((t) => {
              const save = saves.find((s) => s.tutorialId === t.id)
              return (
                <div
                  key={t.id}
                  className="game-card"
                  style={{
                    '--card-accent': t.accent,
                    '--card-accent-2': t.accent2,
                    '--accent': t.accent,
                    '--accent-2': t.accent2,
                  } as CSSProperties}
                >
                  <div className="game-card-title">{t.title}</div>
                  <p className="game-card-tag">{t.tagline}</p>

                  <div className="meta-row">
                    <span className="chip">{t.players}</span>
                    <span className="chip">~{t.minutes} min</span>
                    <span className="chip chip-accent">{totalSteps(t)} étapes</span>
                    {save && save.done.length > 0 && (
                      <span className="chip chip-accent">
                        <CheckCircle aria-hidden width={15} height={15} />
                        {save.done.length}/{totalSteps(t)}
                      </span>
                    )}
                  </div>

                  <div className="meta-row" style={{ marginTop: 4 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setAbout(t)}>
                      <Info aria-hidden /> Détails
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => onStart(t, true)}
                    >
                      <Play aria-hidden /> {save && save.done.length > 0 ? 'Recommencer' : 'Commencer'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {tutorials.length === 0 && (
          <p className="empty">
            Aucun tutoriel installé. Suivez GUIDE_CREATION_TUTO.md pour en ajouter un
            à partir d'un PDF de règles.
          </p>
        )}

        <footer className="home-foot">
          <span>Progression et chronomètre sauvegardés sur cette tablette.</span>
          <button type="button" className="btn btn-ghost" onClick={onStudio}>
            <Crop aria-hidden /> Studio de découpe
          </button>
        </footer>
      </div>

      {about && (
        <Sheet
          title={about.title}
          onClose={() => setAbout(null)}
          footer={
            <button
              type="button"
              className="btn btn-lg btn-primary btn-block"
              onClick={() => { setAbout(null); onStart(about, true) }}
            >
              <Play aria-hidden /> Commencer le tutoriel
            </button>
          }
        >
          <p className="part-detail-note">{about.tagline}</p>

          <dl className="kv">
            <div className="kv-row"><dt>Éditeur</dt><dd>{about.publisher}</dd></div>
            <div className="kv-row"><dt>Auteur</dt><dd>{about.author}</dd></div>
            <div className="kv-row"><dt>Joueurs</dt><dd>{about.players}</dd></div>
            <div className="kv-row"><dt>Durée du tutoriel</dt><dd>~{about.minutes} min</dd></div>
            <div className="kv-row"><dt>Version du contenu</dt><dd>v{about.contentVersion}</dd></div>
            <div className="kv-row"><dt>Source</dt><dd>{about.source.credit}</dd></div>
          </dl>

          <div>
            <div className="section-label">Ce que vous saurez faire</div>
            <ul className="list-check">
              {about.scope.covered.map((s) => (
                <li className="yes" key={s}><Check aria-hidden /> <span>{s}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="section-label">Laisse de côté pour cette première partie</div>
            <ul className="list-check">
              {about.scope.skipped.map((s) => (
                <li className="no" key={s}><Circle aria-hidden /> <span>{s}</span></li>
              ))}
            </ul>
          </div>
        </Sheet>
      )}
    </div>
  )
}
