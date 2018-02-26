const dbPromise = idb.open('posts-store', 1, function(db) {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' })
  }
  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', { keyPath: 'id' })
  }
})

async function writeData(st, data) {
  const db = await dbPromise
  const tx = db.transaction(st, 'readwrite')
  const store = tx.objectStore(st)
  store.put(data)
  return tx.complete
}

async function readAllData(st) {
  const db = await dbPromise
  const tx = db.transaction(st, 'readonly')
  const store = tx.objectStore(st)
  return store.getAll()
}

async function clearAllData(st) {
  const db = await dbPromise
  const tx = db.transaction(st, 'readwrite')
  const store = tx.objectStore(st)
  store.clear()
  return tx.complete
}
