const DB_NAME    = 'deviare-pulse'
const DB_VERSION = 1
const STORE      = 'keyval'

// Cached connection — opened once, reused for every subsequent call
let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE)
    req.onsuccess       = (e) => { _db = e.target.result; resolve(_db) }
    req.onerror         = ()  => reject(req.error)
  })
}

export async function dbGet(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror   = () => reject(req.error)
  })
}

export async function dbSet(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export async function dbDel(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}
