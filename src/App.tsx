import { useCallback, useState } from 'react'
import type { Mode, Tutorial } from './engine/types'
import { loadPrefs, savePrefs, type Prefs } from './engine/prefs'
import { TUTORIALS } from './games'
import { Home } from './ui/Home'
import { Runner } from './ui/Runner'
import { Settings } from './ui/Settings'

type Screen =
  | { view: 'home' }
  | { view: 'runner'; tutorial: Tutorial; mode: Mode; players: number; restart: boolean }

/** Habillage neutre des réglages ouverts depuis l'accueil. */
const NEUTRAL = TUTORIALS[0]?.theme

export default function App() {
  const [screen, setScreen] = useState<Screen>({ view: 'home' })
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [settings, setSettings] = useState(false)

  const change = useCallback((p: Prefs) => {
    setPrefs(p)
    savePrefs(p)
  }, [])

  const panel = settings && NEUTRAL && (
    <Settings
      prefs={prefs}
      onChange={change}
      onClose={() => setSettings(false)}
      theme={screen.view === 'runner' ? screen.tutorial.theme : NEUTRAL}
    />
  )

  if (screen.view === 'runner') {
    return (
      <>
        <Runner
          key={`${screen.tutorial.id}-${screen.mode}-${screen.players}`}
          tutorial={screen.tutorial}
          mode={screen.mode}
          players={screen.players}
          restart={screen.restart}
          prefs={prefs}
          onPrefs={change}
          onOpenSettings={() => setSettings(true)}
          onExit={() => setScreen({ view: 'home' })}
        />
        {panel}
      </>
    )
  }

  return (
    <>
      <Home
        tutorials={TUTORIALS}
        prefs={prefs}
        onOpenSettings={() => setSettings(true)}
        onStart={(tutorial, mode, players, restart) =>
          setScreen({ view: 'runner', tutorial, mode, players, restart })
        }
      />
      {panel}
    </>
  )
}
