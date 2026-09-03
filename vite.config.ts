import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, rmSync, statSync, createReadStream } from 'node:fs'
import { join, resolve, extname } from 'node:path'

/*
 * Disposition du dépôt
 *
 *   /                 le site publié : GitHub Pages sert cette racine telle
 *                     quelle (« Deploy from a branch », fichier .nojekyll)
 *   /index.html       GÉNÉRÉ par `npm run build`, versionné
 *   /assets/          GÉNÉRÉ par `npm run build`, versionné
 *   /games/           pages de règles et découpes, source de vérité
 *   /icon-*.png, /manifest.webmanifest, /sw.js   statiques, à la racine
 *   /app/index.html   entrée de développement et de build
 *   /src/             sources
 *
 * Vite a pour racine app/ et construit vers la racine du dépôt. Rien n'est
 * copié depuis un dossier public : les statiques vivent déjà là où ils sont
 * servis, ce qui évite de les dupliquer dans le dépôt.
 */

const REPO = resolve(__dirname)

/** Fichiers et dossiers de la racine servis tels quels par le site. */
const ROOT_STATIC = new Set(['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'manifest.webmanifest', 'sw.js'])
const ROOT_DIRS = ['games']

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.webmanifest': 'application/manifest+json',
}

/**
 * En développement, sert depuis la racine du dépôt ce que Pages servira en
 * production : les images de règles et les statiques de la PWA. Sans cela,
 * `npm run dev` ne verrait que app/ et les sources.
 */
function rootStatic(): Plugin {
  return {
    name: 'tutogames-root-static',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
        const top = path.split('/')[0]
        const allowed = ROOT_STATIC.has(path) || ROOT_DIRS.includes(top)
        if (!allowed || path.includes('..')) return next()

        const file = join(REPO, path)
        if (!existsSync(file) || !statSync(file).isFile()) return next()

        res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-cache')
        createReadStream(file).pipe(res)
      })
    },
  }
}

/**
 * Le build écrit dans la racine du dépôt, qu'il ne doit surtout pas vider.
 * On ne nettoie donc que assets/, pour ne pas y laisser s'accumuler les
 * anciens fichiers hachés à chaque construction.
 */
function cleanAssets(): Plugin {
  return {
    name: 'tutogames-clean-assets',
    apply: 'build',
    buildStart() {
      rmSync(join(REPO, 'assets'), { recursive: true, force: true })
    },
  }
}

export default defineConfig({
  root: 'app',
  publicDir: false,
  base: './',
  plugins: [react(), rootStatic(), cleanAssets()],
  build: {
    outDir: '..',
    emptyOutDir: false,
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
