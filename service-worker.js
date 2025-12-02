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
        "/SmartInvoicesApp/manifest.json"
      ]);
    })
  );
});

// تفعيل النسخة الجديدة وحذف القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== "smart-invoices-v2") {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// جلب الملفات من الكاش أولاً - ثم من الإنترنت
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
