importScripts('/src/js/idb.js')
importScripts('/src/js/utility.js')

const CACHE_STATIC_NAME = 'static-v12'
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
  const url = 'https://pwa-gram-358d7.firebaseio.com/posts.json'
  if (req.url.includes(url)) {
    const res = await fetch(url)
    const cloneRes = res.clone()
    await clearAllData('posts')
    const data = await cloneRes.json()
    for (let post of Object.values(data)) {
      writeData('posts', post)
    }

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

async function sendFromSyncManager() {
  const data = await readAllData('sync-posts')

  console.log('Run', data)

  const promiseArray = data.map(post => {
    return fetch(
      'https://us-central1-pwa-gram-358d7.cloudfunctions.net/storePostData',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          location: post.location,
          image:
            'https://firebasestorage.googleapis.com/v0/b/pwa-gram-358d7.appspot.com/o/IMG_2970.JPG?alt=media&token=b0f77615-c129-46c0-9b13-5cecc0214b33',
        }),
      }
    )
  })

  const res = await Promise.all(promiseArray)

  res.forEach(async res => {
    console.log(res)
    if (res.ok) {
      const response = await res.json()
      deleteItemFromData('sync-posts', response.id)
    }
  })
}

self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Syncing')
  if (event.tag === 'sync-new-posts') {
    console.log('Syncing New Posts')
    try {
      event.waitUntil(sendFromSyncManager())
      clearAllData('sync-posts')
    } catch (e) {
      console.log('Error while sending data', data)
    }
  }
})
