import { useState } from 'react'
import type { Tutorial } from './engine/types'
import { TUTORIALS } from './games'
import { Home } from './ui/Home'
import { Runner } from './ui/Runner'
import { Studio } from './ui/Studio'

type Screen =
  | { view: 'home' }
  | { view: 'studio' }
  | { view: 'runner'; tutorial: Tutorial; restart: boolean }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ view: 'home' })

  switch (screen.view) {
    case 'runner':
      return (
        <Runner
          key={screen.tutorial.id}
          tutorial={screen.tutorial}
          restart={screen.restart}
          onExit={() => setScreen({ view: 'home' })}
        />
      )
    case 'studio':
      return <Studio tutorials={TUTORIALS} onExit={() => setScreen({ view: 'home' })} />
    default:
      return (
        <Home
          tutorials={TUTORIALS}
          onStart={(tutorial, restart) => setScreen({ view: 'runner', tutorial, restart })}
          onStudio={() => setScreen({ view: 'studio' })}
        />
      )
  }
}
