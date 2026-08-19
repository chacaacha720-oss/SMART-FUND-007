// SMART FUND - Service Worker
// Version: 1.0.0
// Provides offline caching for static assets and PWA support

const CACHE_NAME = 'smartfund-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/register.html',
  '/forgot-password.html',
  '/admin.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/api.js',
  '/assets/js/currency.js',
  '/assets/js/i18n.js',
  '/assets/js/locale.js',
  '/assets/img/logo.svg',
  '/assets/img/logo.png',
  '/assets/img/favicon.png',
  '/assets/img/ticker-logo.png',
  '/manifest.webmanifest',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css',
  'https://cdn.tailwindcss.com'
];

const CACHE_STRATEGIES = {
  // Cache-first for static assets
  static: 'cache-first',
  // Network-first for API calls
  api: 'network-first',
  // Stale-while-revalidate for HTML pages
  html: 'stale-while-revalidate'
};

// Origins allowed to be fetched/cached by the SW (must match CSP connect-src)
const ALLOWED_ORIGINS = [
  'https://smart-fund-my.up.railway.app',
  'https://cdn.jsdelivr.net',
  'https://cdn.tailwindcss.com'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { credentials: 'same-origin' });
        })).catch(err => {
          console.warn('[SW] Some assets failed to cache:', err);
          // Don't fail install if some external resources fail
          return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')).map(url => {
            return new Request(url, { credentials: 'same-origin' });
          }));
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper: Determine cache strategy for request
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return 'network-only';
  }

  // Never intercept cross-origin requests outside the CSP allowlist.
  // Let the browser handle them normally (CSP still applies at fetch time).
  if (!ALLOWED_ORIGINS.includes(url.origin)) {
    return 'network-only';
  }
  
  // API calls - network first, never cache
  if (url.pathname.startsWith('/api/')) {
    return 'network-only';
  }
  
  // Static assets - cache first
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/i) ||
    url.pathname.startsWith('/assets/')
  ) {
    return 'cache-first';
  }
  
  // HTML pages - stale while revalidate
  if (
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/')
  ) {
    return 'stale-while-revalidate';
  }
  
  // Default: network first
  return 'network-first';
}

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const strategy = getCacheStrategy(event.request);
  
  // Skip non-GET requests and chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request));
      break;
    case 'network-first':
      event.respondWith(networkFirst(event.request));
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request));
      break;
    default:
      // network-only: pass through to the browser (no interception)
      return;
  }
});

// Cache-first strategy - serve from cache, fallback to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    // Return offline page or error
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first strategy - try network first, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline response for API calls
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Offline - data not available' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale-while-revalidate strategy - serve from cache, update in background
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignore fetch errors - we have cached version
  });
  
  if (cached) {
    return cached;
  }
  
  // If no cache, wait for network
  try {
    const response = await fetchPromise;
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Future: sync offline actions when back online
  console.log('[SW] Background sync triggered');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/img/logo.png',
      badge: '/assets/img/logo.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});