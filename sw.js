// ĐỔI TÊN CACHE MỖI KHI DEPLOY BẢN SỬA LỖI MỚI.
// Đây là nguyên nhân khiến bản vá "thanh trắng status bar" trước đó
// (sửa index.html + manifest.webmanifest) không được áp dụng ngay:
// chiến lược fetch bên dưới là cache-first, và activate chỉ xóa các
// cache có TÊN KHÁC với CACHE_NAME hiện tại. Nếu tên không đổi,
// service worker cũ vẫn coi cache hiện có là "mới nhất" và tiếp tục
// phục vụ index.html/manifest.webmanifest bản CŨ (có lỗi) cho người
// dùng đã cài app, bất kể bạn đã cập nhật gì trên GitHub Pages.
const CACHE_NAME = 'app-v2';
const ASSETS = [
  './',
  './index.html',
  './verify.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache toàn bộ assets cần thiết
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: xóa các cache phiên bản cũ (chỉ hoạt động khi CACHE_NAME
// đã được đổi tên; nếu giữ nguyên tên như cũ thì dòng filter này
// không xóa được gì, và bản lỗi cũ vẫn tồn tại trong cache)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, tự cập nhật cache khi có bản mới từ mạng
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
