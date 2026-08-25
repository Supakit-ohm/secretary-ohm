// Service Worker — เลขา Ohm
// Cache-first สำหรับไฟล์แอปหลัก + CDN, network-first สำหรับทุกอย่างอื่น (เช่น Google Drive API)
const CACHE_NAME = "secretary-ohm-v5";   // bump ทุกครั้งที่ deploy ของใหม่ ไม่งั้นเครื่องเก่าจะติด cache เดิม

const PRECACHE_URLS = [
  "./preview-dashboard.html",
  "./styles.css",
  "./config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://unpkg.com/prop-types@15.8.1/prop-types.js",
  "https://unpkg.com/recharts@2.15.0/umd/Recharts.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        // อย่าให้ install ล้มเหลวทั้งหมดถ้า CDN บาง URL โหลดไม่ทัน
        console.warn("precache partial failure", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // ไม่แคช Google API / Drive — ต้องเป็นข้อมูลสดเสมอ
  if (url.includes("googleapis.com") || url.includes("accounts.google.com")) {
    return;
  }

  if (event.request.method !== "GET") return;

  // ไฟล์แอปของเราเอง (HTML/CSS/JS) ใช้ network-first — เปิดทีไรได้เวอร์ชันล่าสุดเสมอ
  // ถ้าเน็ตล่มค่อย fallback ไป cache (ยังใช้ออฟไลน์ได้เหมือนเดิม)
  const isAppFile = /\.(html|css)$|config\.js$|\/$/.test(new URL(url).pathname);
  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== "opaque") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
