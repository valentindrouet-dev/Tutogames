import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker : l'app doit rester utilisable sur une table de jeu sans
// reseau. Enregistre uniquement en production, ou le fichier existe.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href).catch(() => {
      // Hors ligne indisponible : l'application fonctionne quand meme.
    })
  })
}
