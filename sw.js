// Guarda o app no aparelho para abrir sem internet.
// Ao publicar uma versão nova, troque o número em CACHE.
var CACHE = 'tetto-v15';
var PREFIXO = 'tetto-'; // só mexe nos caches do próprio Tetto (outros apps no mesmo endereço ficam intactos)
var FILES = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  // cache: 'reload' busca direto no servidor, ignorando a cópia temporária do navegador,
  // para que a versão nova seja realmente a guardada.
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      // apaga só versões antigas do Tetto
      return Promise.all(keys.filter(function (k) { return k.indexOf(PREFIXO) === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    // procura só no cache do Tetto; se não tiver, busca na internet
    caches.open(CACHE).then(function (c) { return c.match(e.request, { ignoreSearch: true }); }).then(function (r) { return r || fetch(e.request); })
  );
});
