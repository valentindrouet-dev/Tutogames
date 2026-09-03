import { lazy, Suspense, useState } from 'react'
import type { Tutorial } from './engine/types'
import { TUTORIALS } from './games'
import { Home } from './ui/Home'
import { Runner } from './ui/Runner'

// Le Studio ne sert qu'à la création de contenu : il sort du bundle
// principal et ne se charge que si on l'ouvre.
const Studio = lazy(() => import('./ui/Studio').then((m) => ({ default: m.Studio })))

type Screen =
  | { view: 'home' }
  | { view: 'studio' }
  | { view: 'runner'; tutorial: Tutorial; players: number; restart: boolean }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ view: 'home' })

  switch (screen.view) {
    case 'runner':
      return (
        <Runner
          key={`${screen.tutorial.id}-${screen.players}`}
          tutorial={screen.tutorial}
          players={screen.players}
          restart={screen.restart}
          onExit={() => setScreen({ view: 'home' })}
        />
      )
    case 'studio':
      return (
        <Suspense fallback={<div className="app" />}>
          <Studio tutorials={TUTORIALS} onExit={() => setScreen({ view: 'home' })} />
        </Suspense>
      )
    default:
      return (
        <Home
          tutorials={TUTORIALS}
          onStart={(tutorial, players, restart) => setScreen({ view: 'runner', tutorial, players, restart })}
          onStudio={() => setScreen({ view: 'studio' })}
        />
      )
  }
}
