/**
 * Écran d'accueil : bibliothèque de jeux, choix du mode et de l'effectif,
 * reprise de la partie en cours.
 *
 * Une carte de jeu montre la couverture de son livret et trois boutons —
 * première partie, mise en place, rappel des règles. Pas de résumé : la
 * couverture identifie la boîte bien plus vite qu'une phrase, et les boutons
 * disent déjà ce qu'ils font.
 *
 * Une partie en cours ne prend pas de bandeau : elle met un petit bouton
 * carré dans le coin de sa vignette. Un jeu n'a qu'une partie enregistrée à
 * la fois, donc ce bouton ne désigne jamais qu'une chose.
 *
 * Le numéro de version de l'application est affiché juste sous le titre,
 * conformément au système de versionnement décrit dans CHANGELOG.md.
 */

import { useMemo, useState } from 'react'
import type { Mode, Tutorial } from '../engine/types'
import { MODE_INFO, bookOf, modesOf, playerLabel, playerRange } from '../engine/types'
import type { Prefs } from '../engine/prefs'
import { clearSave, formatClock, listSaves, type Save } from '../engine/progress'
import { totalSteps, viewFor } from '../engine/tutorial'
import { Sheet } from './Sheet'
import { VoList } from './Vo'
import { Visual } from './Visual'
import { themePanel, themeStyle } from './theme'
import { Check, Circle, Close, FlagEn, Info, MODE_ICON, Play, Resume, Settings, Users } from './icons'
import version from '../../version.json'

interface Props {
  tutorials: Tutorial[]
  onStart: (tutorial: Tutorial, mode: Mode, players: number, restart: boolean) => void
  prefs: Prefs
  onOpenSettings: () => void
}

export function Home({ tutorials, onStart, prefs, onOpenSettings }: Props) {
  const [about, setAbout] = useState<Tutorial | null>(null)
  const [setup, setSetup] = useState<{ tutorial: Tutorial; mode: Mode } | null>(null)
  const [saveTick, setSaveTick] = useState(0)

  // Recalculé après chaque abandon de partie, pour que la barre de reprise
  // disparaisse immédiatement.
  const saves = useMemo(() => listSaves(), [saveTick])

  // L'ordre d'affichage est un réglage : catalogue, ou alphabétique.
  const games = useMemo(
    () => (prefs.sort === 'alpha'
      ? [...tutorials].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
      : tutorials),
    [tutorials, prefs.sort],
  )
  return (
    <div className="app" style={{ '--text-scale': String(prefs.textScale) } as React.CSSProperties}>
      <div className="home scroll">
        <header className="brand">
          <div className="brand-mark">
            <h1 className="brand-title">TutoGames</h1>
            {/* Version, visible sous le titre. */}
            <span className="brand-version">v<b>{version.version}</b> · {version.date}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onOpenSettings} aria-label="Réglages">
            <Settings aria-hidden />
          </button>
        </header>

        <section>
          <div className="game-grid">
            {games.map((t) => (
              <GameCard
                key={t.id}
                tutorial={t}
                prefs={prefs}
                save={saves.find((s) => s.tutorialId === t.id) ?? null}
                onPick={(mode) => setSetup({ tutorial: t, mode })}
                onAbout={() => setAbout(t)}
                onResume={(save) => onStart(t, save.mode, save.players, false)}
                onDrop={() => { clearSave(t.id); setSaveTick((n) => n + 1) }}
              />
            ))}
          </div>
        </section>

        {tutorials.length === 0 && (
          <p className="empty">
            Aucun tutoriel installé. Suivez GUIDE_CREATION_TUTO.md pour en ajouter un
            à partir d'un PDF de règles.
          </p>
        )}
      </div>

      {setup && (
        <PlayerCount
          tutorial={setup.tutorial}
          mode={setup.mode}
          prefs={prefs}
          onClose={() => setSetup(null)}
          onStart={onStart}
        />
      )}

      {about && (
        <Sheet
          title={about.title}
          onClose={() => setAbout(null)}
          style={themePanel(about.theme, prefs)}
          footer={
            <button
              type="button"
              className="btn btn-lg btn-primary btn-block"
              onClick={() => { setSetup({ tutorial: about, mode: 'tuto' }); setAbout(null) }}
            >
              <Play aria-hidden /> Commencer la première partie
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

          {about.vo && (
            <div>
              <div className="section-label">
                Termes en {about.vo.language} — {about.vo.terms.length}
              </div>
              <p className="part-detail-note" style={{ marginBottom: 12 }}>
                Pendant le tutoriel, le bouton VO du bandeau montre ceux de l’étape affichée.
              </p>
              <VoList terms={about.vo.terms} />
            </div>
          )}

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
 * Carte d'un jeu : sa couverture, et une entrée par mode.
 *
 * Une partie en cours se signale par un petit bouton carré dans le coin de
 * la vignette, et par l'état du bouton de son mode. Rien de plus : la
 * couverture doit rester lisible.
 */
function GameCard({
  tutorial,
  prefs,
  save,
  onPick,
  onAbout,
  onResume,
  onDrop,
}: {
  tutorial: Tutorial
  prefs: Prefs
  save: Save | null
  onPick: (mode: Mode) => void
  onAbout: () => void
  onResume: (save: Save) => void
  onDrop: () => void
}) {
  const modes = modesOf(tutorial)
  // Une sauvegarde sans étape validée n'est qu'une ouverture d'écran : elle
  // ne vaut pas la peine d'un bouton « reprendre ».
  const started = save && save.done.length > 0 ? save : null

  return (
    <div className="game-card" style={themeStyle(tutorial.theme, prefs)}>
      <button type="button" className="game-cover" onClick={onAbout} aria-label={`${tutorial.title} — détails`}>
        <Visual
          book={bookOf(tutorial, tutorial.cover)}
          crop={tutorial.cover}
          glyph="board"
          name={tutorial.title}
          tint={tutorial.theme.accent}
        />
      </button>

      {/* Les deux commandes de la partie en cours vivent ensemble, dans le
          coin de la vignette : reprendre en grand, abandonner en petit. Elles
          ne touchent pas à la rangée de pastilles, qui reste sur une ligne. */}
      {started && (
        <div className="game-resume-box">
          <button
            type="button"
            className="game-drop"
            onClick={onDrop}
            aria-label={`Abandonner la partie en cours de ${tutorial.title}`}
            title="Abandonner la partie en cours"
          >
            <Close aria-hidden />
          </button>
          <button
            type="button"
            className="game-resume"
            onClick={() => onResume(started)}
            aria-label={`Reprendre ${tutorial.title} — ${MODE_INFO[started.mode].label}`}
            title={`Reprendre — ${MODE_INFO[started.mode].label}, ${playerLabel(tutorial.players, started.players)}, ${formatClock(started.elapsedMs)}`}
          >
            <Resume aria-hidden />
          </button>
        </div>
      )}

      <div className="game-card-body">
        <div className="game-card-head">
          {/* Le bandeau de couverture porte le titre : on ne le répète pas. */}
          <span className="chip">
            <Users aria-hidden />
            {tutorial.players.min} à {tutorial.players.max}
          </span>
          <span className="chip">~{tutorial.minutes} min</span>
          {/* Matériel en anglais : le drapeau prévient avant même d'ouvrir. */}
          {tutorial.vo && (
            <span
              className="chip chip-flag"
              role="img"
              aria-label={`Matériel en ${tutorial.vo.language}`}
              title={`Matériel en ${tutorial.vo.language} — termes VO dans le tutoriel`}
            >
              <FlagEn aria-hidden />
            </span>
          )}
          <span className="game-card-spacer" />
          <button type="button" className="btn btn-ghost btn-icon" onClick={onAbout} aria-label={`${tutorial.title} — détails`}>
            <Info aria-hidden />
          </button>
        </div>

        <div className="mode-list">
          {modes.map((m) => {
            // Un jeu n'a qu'une partie en cours : au plus un mode s'allume.
            const current = started?.mode === m
            const Icon = MODE_ICON[m]
            return (
              <button
                key={m}
                type="button"
                className={`mode-btn${current ? ' started' : ''}`}
                onClick={() => onPick(m)}
                aria-label={`${tutorial.title} — ${MODE_INFO[m].label}`}
              >
                <Icon aria-hidden />
                <span className="mode-btn-label">{MODE_INFO[m].short}</span>
              </button>
            )
          })}
        </div>
      </div>
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
  mode,
  prefs,
  onClose,
  onStart,
}: {
  tutorial: Tutorial
  mode: Mode
  prefs: Prefs
  onClose: () => void
  onStart: (t: Tutorial, mode: Mode, players: number, restart: boolean) => void
}) {
  const counts = playerRange(tutorial.players)
  const [picked, setPicked] = useState(tutorial.players.recommended ?? counts[0])
  const steps = totalSteps(viewFor(tutorial, picked, mode))
  const note = tutorial.players.notes?.[picked]

  return (
    <Sheet
      title={`${tutorial.title} — ${MODE_INFO[mode].label.toLowerCase()}`}
      onClose={onClose}
      style={themePanel(tutorial.theme, prefs)}
      footer={
        <button
          type="button"
          className="btn btn-lg btn-primary btn-block"
          onClick={() => onStart(tutorial, mode, picked, true)}
        >
          {/* « en solo », mais « à 3 joueurs » : la préposition suit l'effectif. */}
          <Play aria-hidden /> {picked === 1 ? 'Commencer en solo' : `Commencer à ${picked} joueurs`}
        </button>
      }
    >
      <div>
        <p className="sheet-lead">Combien serez-vous ? Le contenu s'adapte à l'effectif.</p>

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
