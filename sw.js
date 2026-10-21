/**
 * Bite POS — service worker.
 * Pre-caches the entire register so ordering, billing and stock keep working offline.
 */
const VERSION = 'bite-shell-v1.0.3';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/vendor/tailwind.min.js',
  'assets/vendor/chart.umd.min.js',
  'assets/fonts/fraunces.woff2',
  'assets/fonts/manrope.woff2',
  'assets/img/favicon.svg',
  'assets/img/icon-192.png',
  'assets/img/icon-512.png',
  'assets/js/app.js',
  'assets/js/utils.js',
  'assets/js/store.js',
  'assets/js/sync.js',
  'assets/js/auth.js',
  'assets/js/pos.js',
  'assets/js/kitchen.js',
  'assets/js/menu.js',
  'assets/js/inventory.js',
  'assets/js/billing.js',
  'assets/js/analytics.js',
  'assets/js/sync-ui.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL.map((path) => new Request(path, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith('bite-shell-') && key !== VERSION).map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await cache.match('index.html');
    if (shell) return shell;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Bite offline</title><body style="font-family:sans-serif;background:#0b0f19;color:#f7f3ea;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center"><h1>Bite is offline</h1><p>Reload once a connection is available to install the register shell.</p></div></body>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || new Response('Offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/api/sync.php') || url.pathname.endsWith('api/sync.php')) {
    event.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ ok: false, error: 'The sync API is unreachable while offline. Changes remain queued on this device.' }),
      { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    )));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
