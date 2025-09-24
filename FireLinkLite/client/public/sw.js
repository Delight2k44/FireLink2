/**
 * FireLink Lite Service Worker
 * Handles offline functionality, push notifications, and background sync
 */

const CACHE_NAME = 'firelink-v1.0.0';
const EMERGENCY_CACHE = 'firelink-emergency-v1.0.0';

// Files to cache for offline functionality
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  // Add other critical assets that need to work offline
];

// Emergency-specific assets that should always be available
const EMERGENCY_ASSETS = [
  '/',
  '/community',
  '/call',
  '/audio/panic.mp3',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('FireLink Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching core assets');
        return cache.addAll(CORE_ASSETS.filter(url => !url.includes('/src/')));
      }),
      caches.open(EMERGENCY_CACHE).then((cache) => {
        console.log('Caching emergency assets');
        return cache.addAll(EMERGENCY_ASSETS);
      })
    ]).then(() => {
      console.log('FireLink Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('FireLink Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== EMERGENCY_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('FireLink Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline, with network-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (network-first, cache as fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle emergency assets (cache-first for reliability)
  if (EMERGENCY_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(EMERGENCY_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Handle other requests (network-first)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached response if available
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // Return a generic offline response
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/emergency-badge-72.png',
      tag: 'firelink-emergency',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: data.data,
      actions: data.actions || [
        {
          action: 'navigate',
          title: 'Navigate',
          icon: '/icons/navigate-icon.png'
        },
        {
          action: 'call',
          title: 'Call',
          icon: '/icons/phone-icon.png'
        },
        {
          action: 'respond',
          title: 'Respond',
          icon: '/icons/help-icon.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options).then(() => {
        console.log('Notification displayed successfully');
        
        // If this is an emergency alert, try to play sound
        if (data.data && data.data.playRingtone) {
          // Send message to all clients to play ringtone
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'emergency-alert',
                data: data.data
              });
            });
          });
        }
      })
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  let targetUrl = '/';

  if (action === 'navigate' && data && data.lat && data.lng) {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`;
    targetUrl = googleMapsUrl;
  } else if (action === 'call') {
    targetUrl = '/call';
  } else if (action === 'respond') {
    targetUrl = '/community';
  } else if (data && data.alertId) {
    targetUrl = `/community?alert=${data.alertId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Check if the app is already open
      const existingClient = clients.find((client) => client.url.includes(self.location.origin));
      
      if (existingClient) {
        // Focus existing window and navigate
        existingClient.focus();
        existingClient.postMessage({
          type: 'navigate',
          url: targetUrl
        });
      } else {
        // Open new window
        if (action === 'navigate' && targetUrl.includes('google.com')) {
          // Open Google Maps in new tab
          self.clients.openWindow(targetUrl);
        } else {
          // Open FireLink app
          self.clients.openWindow(targetUrl);
        }
      }
    })
  );
});

// Background sync event (for future offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);

  if (event.tag === 'emergency-sync') {
    event.waitUntil(
      // Sync emergency data when connection is restored
      syncEmergencyData()
    );
  }
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper function to sync emergency data
async function syncEmergencyData() {
  try {
    console.log('Syncing emergency data...');
    
    // Get pending emergency requests from IndexedDB or localStorage
    // Send them to the server when connection is restored
    // This would be implemented based on your offline storage strategy
    
    const response = await fetch('/api/alerts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('Emergency data synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync emergency data:', error);
    throw error; // This will cause the sync to be retried
  }
}

console.log('FireLink Service Worker loaded');
