// 離線快取：第一次開啟時把整個遊戲存到 iPad，之後沒有網路也能玩。
// 更新 index.html 後，iPad 連網開啟時會在背景下載新版，再下一次開啟就是新版。
// 新增或刪除檔案時，記得更新 FILES 並把 VERSION 改掉（例如 v3）。
const VERSION = 'v2';
const CACHE = 'block-island-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
// 家長錄好上傳後才會有的檔案，沒有也不影響安裝
const OPTIONAL = ['./zhuyin-audio.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).then(() => Promise.all(OPTIONAL.map(f => c.add(f).catch(() => {}))))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// 先用快取立刻開啟，同時在背景向網路拿新版存起來（下次開啟生效）
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit || Response.error());
    return hit || net;
  }));
});
