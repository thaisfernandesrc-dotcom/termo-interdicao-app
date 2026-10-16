// Service worker: deixa o app funcionar sem internet depois da primeira visita.
const VERSAO = 'ti-v1';
const ARQUIVOS = [
  './', 'index.html', 'css/style.css', 'js/texto.js', 'js/pdf.js', 'js/app.js',
  'vendor/jspdf.umd.min.js', 'vendor/JsBarcode.all.min.js',
  'assets/brasao.png', 'assets/icon-192.png', 'assets/icon-512.png', 'manifest.webmanifest',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Abre do cache e atualiza em segundo plano (na próxima abertura vem a versão nova).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => {
    const rede = fetch(e.request).then((r) => { if (r.ok) caches.open(VERSAO).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || rede;
  }));
});
