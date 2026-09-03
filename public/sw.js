/*
 * Service worker minimal : l'app doit demarrer sans reseau, une fois posee
 * sur la table de jeu.
 *
 * Strategie :
 *  - Navigation      : reseau d'abord, repli sur le cache (app-shell).
 *  - Autres requetes : cache d'abord, puis reseau qu'on met en cache.
 *
 * Le nom de cache porte la version : publier une nouvelle version purge
 * automatiquement l'ancienne.
 */

const VERSION = 'tutogames-v0.03'
const SHELL = './'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll([SHELL])).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(SHELL, copy))
          return res
        })
        .catch(() => caches.match(SHELL).then((r) => r || Response.error())),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(request, copy))
          }
          return res
        }),
    ),
  )
})
