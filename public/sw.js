/* Noor service worker - cache versioning and safe offline behavior */
const VERSION = 'noor-v1'
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pattern.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('noor-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isNavigation(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')
}

function isCacheableStatic(url) {
  return url.origin === self.location.origin && /\.(?:js|css|woff2?|png|svg|jpg|jpeg|webp|ico|json|webmanifest)$/.test(url.pathname)
}

function isSensitiveOrVolatileApi(url) {
  // Avoid caching remote Quran/Tafsir/audio/search data without version validation.
  // Also avoid user-specific or unpredictable API responses.
  return (
    url.hostname === 'api.alquran.cloud' ||
    url.hostname === 'api.quran.com' ||
    url.hostname === 'cdn.islamic.network' ||
    url.pathname.includes('/auth') ||
    url.pathname.includes('/user')
  )
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (isNavigation(request)) {
      const offline = await caches.match('/offline.html')
      if (offline) return offline
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => undefined)
  return cached || (await networkPromise) || new Response('', { status: 504 })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return
  if (isSensitiveOrVolatileApi(url)) {
    event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })))
    return
  }

  if (isNavigation(request)) {
    event.respondWith(networkFirst(request))
    return
  }

  if (isCacheableStatic(url)) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Default: network, no aggressive caching for unknown dynamic resources.
  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
