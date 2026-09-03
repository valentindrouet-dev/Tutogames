/**
 * Genere les icônes PWA de l'application.
 * Usage : node tools/make-icons.mjs
 */
import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** @param {number} size @param {boolean} maskable */
function draw(size, maskable) {
  const c = createCanvas(size, size)
  const x = c.getContext('2d')

  // Fond : degrade sombre proche du theme de l'app.
  const bg = x.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0, '#131a29')
  bg.addColorStop(1, '#080b12')
  x.fillStyle = bg
  if (maskable) {
    x.fillRect(0, 0, size, size)
  } else {
    const r = size * 0.22
    x.beginPath()
    x.roundRect(0, 0, size, size, r)
    x.fill()
  }

  // Marge de securite pour les icônes masquables (zone rognee par iOS/Android).
  const pad = maskable ? size * 0.22 : size * 0.2
  const inner = size - pad * 2

  // Trois "cartes" en eventail : le geste d'apprendre un jeu.
  const cards = [
    { a: -0.26, fill: '#38bdf8' },
    { a: 0, fill: '#818cf8' },
    { a: 0.26, fill: '#f472b6' },
  ]
  const cw = inner * 0.42
  const ch = inner * 0.62

  x.save()
  x.translate(size / 2, size / 2 + inner * 0.05)
  for (const card of cards) {
    x.save()
    x.rotate(card.a)
    x.fillStyle = card.fill
    x.beginPath()
    x.roundRect(-cw / 2, -ch / 2, cw, ch, cw * 0.16)
    x.fill()
    x.restore()
  }

  // Coche : le tutoriel valide chaque étape.
  x.strokeStyle = '#08111c'
  x.lineWidth = inner * 0.085
  x.lineCap = 'round'
  x.lineJoin = 'round'
  x.beginPath()
  x.moveTo(-inner * 0.12, inner * 0.01)
  x.lineTo(-inner * 0.02, inner * 0.11)
  x.lineTo(inner * 0.15, -inner * 0.12)
  x.stroke()
  x.restore()

  return c.toBuffer('image/png')
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-180.png', 180, false],
  ['icon-maskable-512.png', 512, true],
]

for (const [rel, size, maskable] of targets) {
  const out = resolve(root, rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, draw(size, maskable))
  console.log('écrit', rel)
}
