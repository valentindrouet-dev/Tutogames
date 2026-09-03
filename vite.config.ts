import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Retire du build le bloc de secours de index.html.
 *
 * Ce bloc n'existe que pour un cas : le fichier source servi tel quel, sans
 * passer par Vite — ce qui arrive si GitHub Pages publie la racine du depot
 * au lieu de dist/. Il affiche alors un diagnostic plutot qu'un ecran blanc.
 * Dans le build, React monte de toute facon sur #root : le bloc serait au
 * mieux un flash, au pire un message faux.
 */
function stripUnbuiltNotice(): Plugin {
  return {
    name: 'strip-unbuilt-notice',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(/<!--unbuilt-->[\s\S]*?<!--\/unbuilt-->/, '')
    },
  }
}

export default defineConfig({
  plugins: [react(), stripUnbuiltNotice()],
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
