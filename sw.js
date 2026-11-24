// Service worker: guarda o app no celular para abrir sem internet.
// IMPORTANTE: a cada mudança em qualquer arquivo do app, aumente o número em CACHE
// (foto-pdf-v1 → foto-pdf-v2 …) e mantenha a lista FILES completa; senão o
// celular continua usando a versão antiga.
const CACHE = 'foto-pdf-v1';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/filename.js',
  'js/pages.js',
  'js/image.js',
  'js/pdf.js',
  'js/share.js',
  'js/settings.js',
  'js/queue.js',
  'js/app.js',
  'vendor/jspdf.umd.min.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' ignora o cache HTTP, para a versão nova não misturar arquivos velhos.
  const requests = FILES.map((f) => new Request(f, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request))
  );
});
