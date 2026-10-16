// Service worker: deixa o app funcionar sem internet depois da primeira visita.
const VERSAO = 'ti-v7';
const ARQUIVOS = [
  './', 'index.html', 'css/style.css', 'js/texto.js', 'js/pdf.js', 'js/app.js',
  'vendor/jspdf.umd.min.js', 'vendor/JsBarcode.all.min.js',
  'assets/brasao.png', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png', 'manifest.webmanifest',
];
self.addEventListener('install', (e) => {
  // Cada arquivo é guardado separadamente: se um falhar, os outros continuam.
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.all(ARQUIVOS.map((a) => c.add(a).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Abre do cache e atualiza em segundo plano; sem cache e sem rede, devolve a página inicial guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    const rede = fetch(e.request).then((r) => { if (r && r.ok) caches.open(VERSAO).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => null);
    if (hit) { rede.catch(() => {}); return hit; }
    const r = await rede;
    if (r) return r;
    if (e.request.mode === 'navigate') { const idx = await caches.match('index.html'); if (idx) return idx; }
    return Response.error();
  })());
});
