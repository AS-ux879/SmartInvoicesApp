self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('smart-invoices-cache').then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/login.html',
        '/register.html',
        '/styles.css',
        '/app.js',
        '/auth.js'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
