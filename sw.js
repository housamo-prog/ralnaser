// اسم النسخة (غيّر الرقم v1 إلى v2 وهكذا في كل مرة تُحدّث فيها الموقع)
const CACHE_NAME = 'rabie-alnaser-v2';

// الملفات التي سيتم حفظها للعمل دون اتصال
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// 1. حدث التثبيت: حفظ الملفات الجديدة
self.addEventListener('install', event => {
    self.skipWaiting(); // إجبار المتصفح على تفعيل النسخة الجديدة فوراً
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('فشل حفظ بعض الملفات', err));
        })
    );
});

// 2. حدث التفعيل: مسح الكاش القديم نهائياً
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ تم حذف الكاش القديم:', cacheName);
                        return caches.delete(cacheName); // حذف أي كاش قديم
                    }
                })
            );
        }).then(() => self.clients.claim()) // السيطرة على الصفحات المفتوحة فوراً
    );
});

// 3. حدث الجلب: استراتيجية Network First (الشبكة أولاً)
self.addEventListener('fetch', event => {
    // تجاهل طلبات الـ API (الصلاة، القرآن، الخطوط) لتعمل مباشرة من الإنترنت
    if (event.request.url.includes('api.') || event.request.url.includes('fonts.')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // إذا نجح الجلب من الإنترنت، حدّث الكاش بالنسخة الجديدة
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // إذا فشل الاتصال بالإنترنت، استخدم النسخة المحفوظة
                return caches.match(event.request);
            })
    );
});
