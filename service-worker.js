// =======================
//  service-worker.js (للتخزين المؤقت لـ PWA)
// =======================

const CACHE_NAME = 'smart-invoices-cache-v1';

// [تعديل مطلوب] تحديث قائمة الملفات لتشمل مكونات Firebase الجديدة والصفحات
const CACHE_ASSETS = [
  '/',
  '/index.html', // صفحة البداية
  '/login.html',
  '/register.html',
  '/dashboard.html', // صفحة لوحة التحكم
  '/styles.css',

  // ملفات JavaScript المحدثة
  '/firebase.js', // ملف إعدادات Firebase
  '/login.js', // منطق تسجيل الدخول
  '/register.js', // منطق التسجيل
  '/dashboard.js', // منطق لوحة التحكم
  
  // ملفات PWA
  '/manifest.json', 
  '/icon-192.png', 
  '/icon-512.png',
  
  // المكتبات الخارجية (لضمان عملها دون اتصال، يفضل إضافة CDN)
  // يتم تخزينها مؤقتاً عند أول تحميل، لكن إضافتها للقائمة تضمن عدم تجاهلها
  // قد تفشل خطوة التخزين المؤقت إذا لم تكن متاحة عند التثبيت.
  // لذلك، سنعتمد فقط على التخزين المؤقت للملفات المحلية.
];

// مرحلة التثبيت (Install)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(CACHE_ASSETS);
    }).catch(err => {
        console.error('[Service Worker] Failed to cache assets:', err);
    })
  );
});

// مرحلة الاسترداد (Fetch)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // إذا تم العثور على الملف في الذاكرة المؤقتة، يتم إرجاعه
      if (response) {
        return response;
      }
      // إذا لم يتم العثور عليه، يتم محاولة جلبه من الشبكة
      return fetch(event.request);
    })
  );
});

// مرحلة التنشيط (Activate) - لإزالة أي ذاكرة مؤقتة قديمة
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
