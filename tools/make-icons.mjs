/**
 * Génère les icônes de l'application : onglet du navigateur, écran d'accueil
 * iPad, et icônes du manifeste PWA.
 *
 *   node tools/make-icons.mjs
 *
 * Le dessin est le même partout : trois cartes en éventail — un jeu qu'on
 * étale sur la table — et la coche du tutoriel sur celle de devant. Les
 * couleurs sont celles du titre de l'accueil (blanc, bleu, violet) sur le
 * fond sombre de l'application, pour que l'icône posée sur l'écran d'accueil
 * de l'iPad soit reconnue au premier coup d'œil.
 *
 * `favicon.svg` est écrit à la main dans le dépôt, à côté : il porte le même
 * dessin en vectoriel, c'est lui que servent les navigateurs récents. Si vous
 * changez la composition ici, reportez-la là-bas.
 */

import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const INK = '#0b0e14'
const CARDS = [
  { angle: -0.34, dx: -0.17, dy: 0.03, fill: '#8fb6ff' },
  { angle: 0.34, dx: 0.17, dy: 0.03, fill: '#b58bff' },
  { angle: 0, dx: 0, dy: 0, fill: '#f2f6ff', check: true },
]

/**
 * @param {number} size côté de l'image, en pixels.
 * @param {boolean} maskable fond à bord perdu, dessin resserré : Android et
 *   iOS rognent librement dans cette variante.
 */
function draw(size, maskable) {
  const c = createCanvas(size, size)
  const x = c.getContext('2d')

  const bg = x.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0, '#141d2f')
  bg.addColorStop(1, '#080b12')
  x.fillStyle = bg
  if (maskable) {
    x.fillRect(0, 0, size, size)
  } else {
    x.beginPath()
    x.roundRect(0, 0, size, size, size * 0.22)
    x.fill()
  }

  const pad = size * (maskable ? 0.26 : 0.17)
  const inner = size - pad * 2
  const cw = inner * 0.44
  const ch = inner * 0.62

  x.save()
  x.translate(size / 2, size / 2)

  for (const card of CARDS) {
    x.save()
    x.translate(inner * card.dx, inner * card.dy)
    x.rotate(card.angle)

    // Un filet de la couleur du fond détache chaque carte de la précédente.
    x.beginPath()
    x.roundRect(-cw / 2, -ch / 2, cw, ch, cw * 0.16)
    x.strokeStyle = INK
    x.lineWidth = inner * 0.045
    x.stroke()
    x.fillStyle = card.fill
    x.fill()

    if (card.check) {
      x.strokeStyle = INK
      x.lineWidth = inner * 0.1
      x.lineCap = 'round'
      x.lineJoin = 'round'
      x.beginPath()
      x.moveTo(-inner * 0.11, inner * 0.01)
      x.lineTo(-inner * 0.025, inner * 0.1)
      x.lineTo(inner * 0.13, -inner * 0.11)
      x.stroke()
    }

    x.restore()
  }

  x.restore()
  return c.toBuffer('image/png')
}

const targets = [
  // Onglet du navigateur, pour les moteurs qui ignorent le SVG.
  ['icon-32.png', 32, false],
  // Écran d'accueil iPad et iPhone (apple-touch-icon).
  ['icon-180.png', 180, false],
  // Manifeste PWA.
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
]

for (const [rel, size, maskable] of targets) {
  const out = resolve(root, rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, draw(size, maskable))
  console.log('écrit', rel)
}
