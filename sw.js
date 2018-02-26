importScripts('/src/js/idb.js')
importScripts('/src/js/utility.js')

const CACHE_STATIC_NAME = 'static-v7'
const CACHE_DYNAMIC_NAME = 'dynamic-v3'
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
]

const cacheResources = async () => {
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
  //
  const url =
    'https://firestore.googleapis.com/v1beta1/projects/pwa-gram-358d7/databases/(default)/documents/posts'

  if (req.url.includes(url)) {
    const res = await fetch(url)
    const cloneRes = res.clone()
    await clearAllData('posts')
    const data = await cloneRes.json()
    data.documents.forEach(post => {
      const id = post.name.split('/').pop()
      const newCard = {
        id,
        title: post.fields.title.stringValue,
        location: post.fields.location.stringValue,
        image: post.fields.image.stringValue,
      }
      writeData('posts', newCard)
    })

    return res
    // cache only
  } else if (urlsToCache.some(url => url === req.url)) {
    return caches.match(req.url)
  } else {
    const cachedResource = await caches.match(req)
    if (cachedResource) {
      return cachedResource
    } else {
      try {
        const res = await fetch(req)
        const cache = await caches.open(CACHE_DYNAMIC_NAME)
        // trimCache(CACHE_DYNAMIC_NAME, 3)
        cache.put(req.url, res.clone())
        return res
      } catch (err) {
        const cache = await caches.open(CACHE_STATIC_NAME)
        // return offline.html only for when trying to reach HTML pages offline, not for other assets. in this cas, we only have one html file. if there are several, use a regex expression
        if (req.url.includes('/help')) {
          return cache.match('/offline.html')
        }
      }
    }
  }
}

self.addEventListener('fetch', async event => {
  event.respondWith(cachedResource(event.request))
})
