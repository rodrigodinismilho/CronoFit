const CACHE = 'cronofit-v1';
const ASSETS = [
  'index.html',
  'css/app.css',
  'js/chart.min.js',
  'js/papaparse.min.js',
  'js/db.js',
  'js/utils.js',
  'js/calendar.js',
  'js/dashboard.js',
  'js/checklist.js',
  'js/csv-importer.js',
  'js/app.js',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
