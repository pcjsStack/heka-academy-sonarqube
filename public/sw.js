/* eslint-disable no-undef */
// SCORM Player Service Worker
// Handles requests for SCORM package files stored in IndexedDB

const CACHE_NAME = 'scorm-cache-v1'
const DB_NAME = 'scorm-cache'
const DB_VERSION = 1

// MIME type mapping for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
}

// Get MIME type from file extension
function getMimeType(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'path' })
      }
    }
  })
}

// Get file from IndexedDB
async function getFileFromDB(path) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['files'], 'readonly')
    const store = transaction.objectStore('files')

    return new Promise((resolve, reject) => {
      const request = store.get(path)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting file from IndexedDB:', error)
    return null
  }
}

// Service Worker Install
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...')
  self.skipWaiting() // Activate immediately
})

// Service Worker Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Service Worker activated')
      return self.clients.claim() // Take control immediately
    })
  )
})

// Service Worker Fetch - Intercept requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle SCORM package requests (starting with /scorm/)
  if (url.pathname.startsWith('/scorm/')) {
    event.respondWith(handleSCORMRequest(url.pathname, event.request))
  }
})

// Handle SCORM file requests
async function handleSCORMRequest(pathname, request) {
  try {
    // Extract the file path (remove /scorm/ prefix)
    const filePath = pathname.replace(/^\/scorm\//, '')

    console.log('[SW] Fetching SCORM file:', filePath)

    // Try to get file from IndexedDB
    const fileData = await getFileFromDB(filePath)

    if (fileData && fileData.blob) {
      console.log('[SW] Found file in IndexedDB:', filePath)

      // Determine MIME type
      const mimeType = getMimeType(filePath)

      // Create response with proper headers
      const headers = new Headers({
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
      })

      return new Response(fileData.blob, {
        status: 200,
        statusText: 'OK',
        headers: headers,
      })
    }

    // Try alternate path variations (with and without leading slash)
    const alternateFileData = await getFileFromDB('/' + filePath)
    if (alternateFileData && alternateFileData.blob) {
      console.log('[SW] Found file with alternate path:', '/' + filePath)

      const mimeType = getMimeType(filePath)
      const headers = new Headers({
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
      })

      return new Response(alternateFileData.blob, {
        status: 200,
        statusText: 'OK',
        headers: headers,
      })
    }

    console.warn('[SW] File not found in IndexedDB:', filePath)

    // Return 404 if file not found
    return new Response('File not found', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('[SW] Error handling SCORM request:', error)

    return new Response('Internal Server Error', {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      }).then(() => {
        console.log('[SW] Cache cleared')
      })
    )
  }
})

console.log('[SW] Service Worker loaded')

