/**
 * Écran d'accueil : bibliothèque de jeux, choix de l'effectif, reprise de la
 * partie en cours.
 *
 * Le numéro de version de l'application est affiché juste sous le titre,
 * conformément au système de versionnement décrit dans CHANGELOG.md.
 */

import { useMemo, useState } from 'react'
import type { Tutorial } from '../engine/types'
import { playerLabel, playerRange } from '../engine/types'
import { clearSave, formatClock, listSaves } from '../engine/progress'
import { nominalSteps, totalSteps, viewFor } from '../engine/tutorial'
import { Sheet } from './Sheet'
import { themePanel, themeStyle } from './theme'
import { Check, CheckCircle, Circle, Crop, Info, Play, Users } from './icons'
import version from '../../version.json'

interface Props {
  tutorials: Tutorial[]
  onStart: (tutorial: Tutorial, players: number, restart: boolean) => void
  /** Ouvre l'outil de découpe des visuels de règles. */
  onStudio: () => void
}

export function Home({ tutorials, onStart, onStudio }: Props) {
  const [about, setAbout] = useState<Tutorial | null>(null)
  const [setup, setSetup] = useState<Tutorial | null>(null)
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
            {/* Version, visible sous le titre. */}
            <span className="brand-version">v<b>{version.version}</b> · {version.date}</span>
          </div>
          <p className="brand-tag">
            Posez la tablette à côté de vous. Elle vous fait installer le jeu, puis
            jouer vos premiers tours, étape par étape.
          </p>
        </header>

        {resumable && (
          <div className="resume-bar" style={themeStyle(resumable.tutorial.theme)}>
            <div className="resume-text">
              <div className="resume-title">Reprendre {resumable.tutorial.title}</div>
              <div className="resume-sub">
                {playerLabel(resumable.tutorial.players, resumable.save.players)} ·
                {' '}Étape {resumable.save.done.length} sur{' '}
                {totalSteps(viewFor(resumable.tutorial, resumable.save.players))} ·{' '}
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
              onClick={() => onStart(resumable.tutorial, resumable.save.players, false)}
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
                <div key={t.id} className="game-card" style={themeStyle(t.theme)}>
                  <div className="game-card-title">{t.title}</div>
                  <p className="game-card-tag">{t.tagline}</p>

                  <div className="meta-row">
                    <span className="chip">
                      <Users aria-hidden />
                      {t.players.min} à {t.players.max} joueurs
                    </span>
                    <span className="chip">~{t.minutes} min</span>
                    <span className="chip chip-accent">{nominalSteps(t)} étapes</span>
                    {save && save.done.length > 0 && (
                      <span className="chip chip-accent">
                        <CheckCircle aria-hidden />
                        {save.done.length}/{totalSteps(viewFor(t, save.players))}
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
                      onClick={() => setSetup(t)}
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

      {setup && <PlayerCount tutorial={setup} onClose={() => setSetup(null)} onStart={onStart} />}

      {about && (
        <Sheet
          title={about.title}
          onClose={() => setAbout(null)}
          style={themePanel(about.theme)}
          footer={
            <button
              type="button"
              className="btn btn-lg btn-primary btn-block"
              onClick={() => { setSetup(about); setAbout(null) }}
            >
              <Play aria-hidden /> Commencer le tutoriel
            </button>
          }
        >
          <p className="part-detail-note">{about.tagline}</p>

          <dl className="kv">
            <div className="kv-row"><dt>Éditeur</dt><dd>{about.publisher}</dd></div>
            <div className="kv-row"><dt>Auteur</dt><dd>{about.author}</dd></div>
            <div className="kv-row"><dt>Joueurs</dt><dd>{about.players.min} à {about.players.max}</dd></div>
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
            <div className="section-label">Laissé de côté pour cette première partie</div>
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

/**
 * Choix de l'effectif avant de commencer.
 *
 * Ce n'est pas une formalité : le nombre de joueurs change la mise en place
 * (combien de nacelles, combien de cartes) et parfois les règles elles-mêmes.
 * Le demander une fois évite d'écrire « si vous êtes 3, ignorez ceci » à
 * chaque étape.
 */
function PlayerCount({
  tutorial,
  onClose,
  onStart,
}: {
  tutorial: Tutorial
  onClose: () => void
  onStart: (t: Tutorial, players: number, restart: boolean) => void
}) {
  const counts = playerRange(tutorial.players)
  const [picked, setPicked] = useState(tutorial.players.recommended ?? counts[0])
  const steps = totalSteps(viewFor(tutorial, picked))
  const note = tutorial.players.notes?.[picked]

  return (
    <Sheet
      title={`${tutorial.title} — combien de joueurs ?`}
      onClose={onClose}
      style={themePanel(tutorial.theme)}
      footer={
        <button
          type="button"
          className="btn btn-lg btn-primary btn-block"
          onClick={() => onStart(tutorial, picked, true)}
        >
          {/* « en solo », mais « à 3 joueurs » : la préposition suit l'effectif. */}
          <Play aria-hidden /> {picked === 1 ? 'Commencer en solo' : `Commencer à ${picked} joueurs`}
        </button>
      }
    >
      <div>
        <p className="sheet-lead">
          Le tutoriel s'adapte : mise en place, variantes et étapes propres à cet effectif.
        </p>

        <div className="count-grid">
          {counts.map((n) => (
            <button
              key={n}
              type="button"
              className={`count-btn${n === picked ? ' picked' : ''}`}
              onClick={() => setPicked(n)}
            >
              <span className="count-n">{n}</span>
              <span className="count-label">{playerLabel(tutorial.players, n)}</span>
            </button>
          ))}
        </div>

        <div className="count-summary">
          <span className="chip chip-accent">{steps} étapes</span>
          {tutorial.players.recommended === picked && (
            <span className="chip">Conseillé pour découvrir</span>
          )}
        </div>

        {note && <p className="part-detail-note">{note}</p>}
      </div>
    </Sheet>
  )
}
