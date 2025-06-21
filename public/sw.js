/**
 * SERVICE WORKER - PWA offline functionality and push notifications
 *
 * Purpose: Enables offline access and push notifications for funeral platform
 * Features: Caching strategies, offline fallbacks, push notification handling
 * Critical: Ensures platform works during poor network conditions in crisis
 */

const CACHE_NAME = "uitvaart-platform-v1"
const STATIC_CACHE = "static-v1"
const DYNAMIC_CACHE = "dynamic-v1"

// Files to cache for offline functionality
const STATIC_FILES = ["/", "/offline", "/manifest.json", "/icon-192.png", "/icon-512.png"]

// Install event - cache static files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/offline")
          }
        })
    }),
  )
})

// Push event - handle push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: "U heeft een nieuwe update ontvangen.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Bekijken",
        icon: "/icon-192.png",
      },
      {
        action: "close",
        title: "Sluiten",
        icon: "/icon-192.png",
      },
    ],
  }

  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.title = data.title || "Uitvaart Platform"
  }

  event.waitUntil(self.registration.showNotification("Uitvaart Platform", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  } else if (event.action === "close") {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})
