// 离线缓存：app 外壳预缓存，其余（比如字体）用到时顺手缓存。
const CACHE = 'baker-v82';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/store.js', 'js/parser.js', 'js/sketch.js', 'js/timers.js', 'js/i18n.js', 'js/catalog.js', 'catalog/recipes.json',
  'fonts/shopfont.ttf',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload'：绕过浏览器的 HTTP 缓存（GitHub Pages 会让文件缓存 10 分钟），保证装进来的是新版本
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(SHELL.map((u) => fetch(u, { cache: 'reload' }).then((res) => (res.ok ? c.put(u, res) : null)).catch(() => null))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 只管两类请求：本站自己的文件（网络优先），和 Google 字体（缓存优先）。
// 其他站点的请求（比如线上的内置配方目录）不经过这里，免得被缓存住、永远拿不到新版
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  let url;
  try { url = new URL(e.request.url); } catch { return; }
  if (url.origin !== self.location.origin && !FONT_HOSTS.includes(url.hostname)) return;
  e.respondWith(handle(e.request));
});

// 无论如何都要给页面一个回应：网络、缓存都不行时，打开页面的请求退回缓存里的首页，绝不让 app 白屏 / 黑屏
async function handle(req) {
  let sameOrigin = false;
  try { sameOrigin = new URL(req.url).origin === self.location.origin; } catch { /* 忽略 */ }
  const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' }).catch(() => null);
  if (!sameOrigin) {
    // 第三方字体：缓存优先
    if (hit) return hit;
    return fetch(req).then((res) => { putCache(req, res.clone()); return res; }).catch(() => Response.error());
  }
  try {
    // 本站文件：网络优先，并绕过 HTTP 缓存拿新版本。只用网址发请求，不复制原请求（iOS 上复制「打开页面」的请求会出错）
    const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });
    if (res.ok) { putCache(req, res.clone()); return res; }
    return hit || res;
  } catch {
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const home = await caches.match('./').catch(() => null) || await caches.match('index.html').catch(() => null);
      if (home) return home;
    }
    return fetch(req).catch(() => Response.error());
  }
}

function putCache(req, res) {
  caches.open(CACHE).then((c) => c.put(req, res)).catch(() => {});
}

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
