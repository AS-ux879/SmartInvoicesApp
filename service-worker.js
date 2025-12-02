self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("smart-invoices-v2").then((cache) => {
      return cache.addAll([
        "/SmartInvoicesApp/",
        "/SmartInvoicesApp/index.html",
        "/SmartInvoicesApp/login.html",
        "/SmartInvoicesApp/register.html",
        "/SmartInvoicesApp/dashboard.html",
        "/SmartInvoicesApp/styles.css",
        "/SmartInvoicesApp/firebase.js",
        "/SmartInvoicesApp/login.js",
        "/SmartInvoicesApp/register.js",
        "/SmartInvoicesApp/dashboard.js",
        "/SmartInvoicesApp/manifest.json",
        "/SmartInvoicesApp/icon-192.png",
        "/SmartInvoicesApp/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== "smart-invoices-v2" && caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
