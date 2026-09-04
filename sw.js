/*
 * Service worker : l'app doit démarrer et rester utilisable sans réseau,
 * une fois posée sur la table de jeu.
 *
 * Deux caches, aux cycles de vie différents :
 *
 *  - SHELL, versionné : index.html, assets/ hachés, icônes, manifeste.
 *    Publier une version purge automatiquement l'ancienne.
 *
 *  - MEDIA, durable : pages et découpes de règles (games/). Plusieurs Mo,
 *    qui ne changent pas d'une version à l'autre de l'app — les purger à
 *    chaque publication ferait tout retélécharger sur la tablette pour rien.
 *    Incrémentez MEDIA seulement si les images ont été ré-ingérées.
 *
 * Stratégies :
 *  - Navigation et pages.json : réseau d'abord, repli sur le cache.
 *  - Tout le reste (même origine, GET) : cache d'abord, puis réseau mis en cache.
 */

const SHELL = 'tutogames-shell-v0.14'
const MEDIA = 'tutogames-media-v1'
const START = './'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll([START])).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

/** Réseau d'abord ; la réponse fraîche remplace celle du cache. */
function networkFirst(request, cacheName, key = request) {
  return fetch(request)
    .then((res) => {
      if (res.ok) caches.open(cacheName).then((c) => c.put(key, res.clone()))
      return res
    })
    .catch(() => caches.match(key).then((hit) => hit || Response.error()))
}

/** Cache d'abord ; un manqué est servi par le réseau puis mémorisé. */
function cacheFirst(request, cacheName) {
  return caches.match(request).then(
    (hit) =>
      hit ||
      fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') caches.open(cacheName).then((c) => c.put(request, res.clone()))
        return res
      }),
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL, START))
    return
  }

  const isMedia = url.pathname.includes('/games/')
  if (isMedia && url.pathname.endsWith('/pages.json')) {
    // Le manifeste est minuscule et décide de tout : on le veut à jour.
    event.respondWith(networkFirst(request, MEDIA))
    return
  }

  event.respondWith(cacheFirst(request, isMedia ? MEDIA : SHELL))
})
