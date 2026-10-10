// 离线缓存：app 外壳预缓存，其余（比如字体）用到时顺手缓存。
const CACHE = 'baker-v36';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/store.js', 'js/parser.js', 'js/sketch.js', 'js/timers.js', 'js/samples.js', 'js/i18n.js',
  'fonts/shopfont.ttf',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload'：绕过浏览器的 HTTP 缓存（GitHub Pages 会让文件缓存 10 分钟），保证装进来的是新版本
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const sameOrigin = new URL(e.request.url).origin === self.location.origin;
      // 本站文件每次都向服务器确认一下有没有新版本（no-cache），不吃 HTTP 缓存里的旧文件
      const net = fetch(sameOrigin ? new Request(e.request, { cache: 'no-cache' }) : e.request).then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      // 本站文件：网络优先保证更新；第三方字体：缓存优先
      return sameOrigin ? net.then((r) => r || hit) : (hit || net);
    }),
  );
});

// 点通知回到 app 的计时页
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate?.('./#/bake'); return c.focus(); }
      }
      return self.clients.openWindow('./#/bake');
    }),
  );
});
