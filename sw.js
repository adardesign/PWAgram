const CACHE_STATIC_NAME = 'static-v4'
const CACHE_DYNAMIC_NAME = 'dynamic-v2'

const cacheResources = async () => {
  const urlsToCache = [
    '/',
    '/index.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  ]
  const cache = await caches.open(CACHE_STATIC_NAME)
  return cache.addAll(urlsToCache)
}

self.addEventListener('install', event => event.waitUntil(cacheResources()))

const cleanCache = async () => {
  const keyList = await caches.keys()
  return Promise.all(
    keyList.map(key => {
      if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
        console.log('[Service Worker] Removing old cache.', key)
        return caches.delete(key)
      }
    })
  )
}

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event)
  event.waitUntil(cleanCache())
  return self.clients.claim()
})

const cachedResource = async req => {
  const cachedResource = await caches.match(req)
  if (cachedResource) {
    return cachedResource
  } else {
    const res = await fetch(req)
    const cache = await caches.open(CACHE_DYNAMIC_NAME)
    cache.put(req.url, res.clone())
    return res
  }
}

self.addEventListener('fetch', async event => {
  event.respondWith(cachedResource(event.request))
})
