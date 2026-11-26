/* Sternik Morski – service worker: działanie offline.
 * Pliki aplikacji i treści: najpierw z pamięci podręcznej, w tle aktualizacja z sieci
 * (po zmianach na stronie nowa wersja pojawia się przy kolejnym uruchomieniu).
 * Zapytania do Supabase zawsze idą do sieci (postęp offline czeka w kolejce w aplikacji). */
const CACHE = 'sternik-v1';
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/vendor/supabase.js",
  "js/config.js",
  "js/cloud.js",
  "js/visuals.js",
  "js/generators.js",
  "js/app.js",
  "content/levels.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "content/level-1.json",
  "content/mc/level-1.json",
  "content/level-2.json",
  "content/mc/level-2.json",
  "content/level-3.json",
  "content/mc/level-3.json",
  "content/level-4.json",
  "content/mc/level-4.json",
  "content/level-5.json",
  "content/mc/level-5.json",
  "content/level-6.json",
  "content/mc/level-6.json",
  "content/level-7.json",
  "content/mc/level-7.json"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // Supabase itp. – sieć
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const key = req.mode === 'navigate' ? './' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res && res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    const res = await fresh;
    return res || new Response('Brak połączenia z internetem.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
