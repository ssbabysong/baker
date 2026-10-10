// 本地存储：配方、出炉记录、照片都放在 IndexedDB（照片太大，localStorage 放不下）。

import { L, getCurrency } from './i18n.js';

const DB_NAME = 'baker';
const DB_VERSION = 1;
const STORES = ['recipes', 'bakes', 'photos', 'kv'];

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, name === 'kv' ? undefined : { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    const r = fn(s);
    if (r) r.onsuccess = () => { result = r.result; };
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const db = {
  all: (store) => tx(store, 'readonly', (s) => s.getAll()),
  get: (store, id) => tx(store, 'readonly', (s) => s.get(id)),
  put: (store, value) => tx(store, 'readwrite', (s) => s.put(value)),
  del: (store, id) => tx(store, 'readwrite', (s) => s.delete(id)),
  clear: (store) => tx(store, 'readwrite', (s) => s.clear()),
  getKv: (key) => tx('kv', 'readonly', (s) => s.get(key)),
  setKv: (key, value) => tx('kv', 'readwrite', (s) => s.put(value, key)),
  delKv: (key) => tx('kv', 'readwrite', (s) => s.delete(key)),
};

// ---------- 配方 ----------

export function normalizeRecipe(r) {
  const now = Date.now();
  return {
    id: r.id || uid(),
    name: (r.name || L('未命名配方', 'Untitled recipe')).trim(),
    shape: r.shape || guessShape(r.name),
    yield: r.yield || '',
    ingredients: (r.ingredients || []).map((i) => ({
      id: i.id || uid(),
      name: i.name || '',
      amount: i.amount === '' || i.amount == null ? null : Number(i.amount),
      unit: i.unit || '',
      note: i.note || '',
    })),
    steps: (r.steps || []).map((s) => ({
      id: s.id || uid(),
      text: s.text || '',
      minutes: s.minutes === '' || s.minutes == null ? null : Number(s.minutes),
      kind: s.kind || 'other',
    })),
    notes: r.notes || '',
    prices: normPrices(r),
    // 内置配方的来历：哪个 key、哪种语言、第几版、放上架时的内容指纹（用来判断用户改没改过）
    ...(r.sample ? { sample: r.sample, sampleLang: r.sampleLang, sampleRev: r.sampleRev, sampleHash: r.sampleHash } : {}),
    ...(r.sampleSkip ? { sampleSkip: r.sampleSkip } : {}),
    createdAt: r.createdAt || now,
    updatedAt: now,
    version: (r.version || 0) + 1,
  };
}

export function guessShape(name = '') {
  const n = name.toLowerCase();
  if (/盐面包|盐可颂|盐卷|海盐卷|shio|salt bread|salt roll/.test(n)) return 'shiopan';
  if (/可颂|牛角|croissant/.test(n)) return 'croissant';
  if (/法棍|长棍|baguette/.test(n)) return 'baguette';
  if (/蛋糕|cake|戚风|芝士/.test(n)) return 'cake';
  if (/饼干|曲奇|cookie|biscuit/.test(n)) return 'cookie';
  if (/玛芬|麦芬|muffin|纸杯|cupcake/.test(n)) return 'muffin';
  if (/碱水|扭结|pretzel|brezel/.test(n)) return 'pretzel';
  if (/甜甜圈|多拿滋|donut|doughnut/.test(n)) return 'donut';
  if (/贝果|bagel/.test(n)) return 'bagel';
  if (/菠萝|蜜瓜|melon|pineapple/.test(n)) return 'melonpan';
  if (/司康|scone/.test(n)) return 'scone';
  if (/佛卡夏|福卡夏|focaccia/.test(n)) return 'focaccia';
  if (/布里欧|布里奥|brioche/.test(n)) return 'brioche';
  if (/蛋挞|葡挞|tart/.test(n)) return 'eggtart';
  if (/泡芙|puff|choux|éclair|eclair/.test(n)) return 'puff';
  if (/巧克力|可可|脆脆珠|choco|cocoa/.test(n)) return 'chocobun';
  if (/红豆|豆沙|红豆包|anpan|あんぱん/.test(n)) return 'anpan';
  if (/吐司|toast|土司|食パン|生吐司/.test(n)) return 'toast';
  if (/餐包|手撕包|排包|小面包|dinner rolls?|pull-apart/.test(n)) return 'rolls';
  return 'loaf';
}

// 价签：按面包种类给一个说得过去的价格区间随机挑一个。人民币取整，美元按 50 美分一档
const PRICE_RANGE = {
  CNY: {
    cookie: [6, 12], muffin: [10, 16], anpan: [8, 14], melonpan: [8, 14], bagel: [10, 16], pretzel: [10, 16],
    croissant: [12, 18], baguette: [14, 22], loaf: [16, 28], toast: [18, 32], cake: [28, 48], chocobun: [12, 18],
    donut: [8, 14], shiopan: [6, 12], scone: [10, 16], focaccia: [16, 26], brioche: [14, 22], eggtart: [6, 10], rolls: [12, 20], puff: [8, 14],
  },
  USD: {
    cookie: [2, 4], muffin: [3, 5], anpan: [2.5, 4.5], melonpan: [2.5, 4.5], bagel: [3, 5], pretzel: [3, 5],
    croissant: [3.5, 6], baguette: [4, 7], loaf: [6, 10], toast: [6, 11], cake: [28, 48], chocobun: [3.5, 5.5],
    donut: [2, 4], shiopan: [2, 4], scone: [3, 5], focaccia: [5, 9], brioche: [4, 7], eggtart: [2, 3.5], rolls: [4, 7], puff: [2.5, 4.5],
  },
};
export function randomPrice(shape, cur = getCurrency()) {
  const table = PRICE_RANGE[cur] || PRICE_RANGE.CNY;
  const [lo, hi] = table[shape] || (cur === 'USD' ? [3, 6] : [10, 20]);
  const step = cur === 'USD' ? 0.5 : 1;
  return lo + step * Math.floor(Math.random() * (Math.round((hi - lo) / step) + 1));
}

// 每种货币各记一个价（切换货币时不用换算，各是各的价签）；老数据里的 price 当作人民币
export function getPrice(r, cur = getCurrency()) {
  const v = r?.prices?.[cur] ?? (cur === 'CNY' ? r?.price : null);
  return v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v);
}
function normPrices(r) {
  const out = { ...(r.prices || {}) };
  if (out.CNY == null && r.price != null && r.price !== '' && !Number.isNaN(Number(r.price))) out.CNY = Number(r.price);
  for (const k of Object.keys(out)) if (out[k] === '' || out[k] == null || Number.isNaN(Number(out[k]))) delete out[k];
  const cur = getCurrency();
  if (out[cur] == null) out[cur] = randomPrice(r.shape || guessShape(r.name), cur);
  return out;
}

// 还没有当前货币价签的配方，第一次上架时补一个（不改 updatedAt / version）
export async function listRecipes() {
  const all = await db.all('recipes');
  const cur = getCurrency();
  for (const r of all) {
    if (getPrice(r, cur) == null) {
      r.prices = { ...(r.prices || {}), [cur]: randomPrice(r.shape, cur) };
      await db.put('recipes', r);
    }
  }
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export const getRecipe = (id) => db.get('recipes', id);
// 只改价签，不算改配方
export async function setPrice(id, price, cur = getCurrency()) {
  const r = await getRecipe(id);
  if (!r) return null;
  r.prices = { ...(r.prices || {}), [cur]: price };
  await db.put('recipes', r);
  return r;
}
export async function saveRecipe(r) {
  const rec = normalizeRecipe(r);
  await db.put('recipes', rec);
  return rec;
}
export async function deleteRecipe(id) {
  await db.del('recipes', id);
}

// ---------- 出炉记录 ----------

export const listBakes = async () => (await db.all('bakes')).sort((a, b) => b.finishedAt - a.finishedAt);
export const getBake = (id) => db.get('bakes', id);
export const saveBake = (b) => db.put('bakes', b);
export async function deleteBake(id) {
  const b = await getBake(id);
  if (b?.photoId) await db.del('photos', b.photoId);
  await db.del('bakes', id);
}

// ---------- 照片 ----------

export async function savePhoto(blob) {
  const id = uid();
  await db.put('photos', { id, blob, createdAt: Date.now() });
  return id;
}

const urlCache = new Map();
export async function photoUrl(id) {
  if (!id) return '';
  if (urlCache.has(id)) return urlCache.get(id);
  const p = await db.get('photos', id);
  if (!p) return '';
  const url = URL.createObjectURL(p.blob);
  urlCache.set(id, url);
  return url;
}

// 把相机原图压缩到长边 1280，避免存储爆掉。
// 手机原图动辄几千万像素：尽量让浏览器解码时直接缩小，用完马上释放，免得内存吃紧卡死
async function decodeImage(file, max) {
  // onload 时只读了文件头拿到尺寸，还没整张解码，很省内存
  const url = URL.createObjectURL(file);
  const img = new Image();
  const ok = await new Promise((res) => { img.onload = () => res(true); img.onerror = () => res(false); img.src = url; });
  if (!ok || !img.naturalWidth) { URL.revokeObjectURL(url); return null; }
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  try {
    // 直接解码成目标尺寸，不在内存里放一张原图大小的位图
    const bmp = await createImageBitmap(file, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
    URL.revokeObjectURL(url);
    return { src: bmp, w, h };
  } catch {
    return { src: img, w, h, keepUrl: url }; // 不支持缩放解码的老系统：退回用 <img> 画
  }
}

export async function compressImage(file, max = 1280, quality = 0.82) {
  const d = await decodeImage(file, max);
  if (!d) return file;
  const canvas = document.createElement('canvas');
  canvas.width = d.w;
  canvas.height = d.h;
  canvas.getContext('2d').drawImage(d.src, 0, 0, d.w, d.h);
  d.src.close?.();
  if (d.keepUrl) URL.revokeObjectURL(d.keepUrl);
  const blob = await new Promise((res) => canvas.toBlob((b) => res(b || file), 'image/jpeg', quality));
  canvas.width = 0; canvas.height = 0; // 让 iOS 立刻回收画布内存
  return blob;
}

// ---------- 店铺设置 & 进行中的烘焙 ----------

export async function getShop() {
  return (await db.getKv('shop')) || { name: L('我的小烘焙铺', 'My Little Bakery'), openedAt: Date.now() };
}
export const saveShop = (shop) => db.setKv('shop', shop);

// 正在烤的可以有好几炉，一炉一个 session；老版本只存了一个 'session'，读的时候顺手迁过来
export async function getSessions() {
  const list = await db.getKv('sessions');
  if (Array.isArray(list)) return list;
  const old = await db.getKv('session');
  if (old) { await db.setKv('sessions', [old]); await db.delKv('session'); return [old]; }
  return [];
}
export const saveSessions = (list) => db.setKv('sessions', list);

// ---------- 备份 ----------

function blobToDataUrl(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  });
}

export async function exportAll() {
  const photos = await db.all('photos');
  return {
    app: 'baker',
    version: 1,
    exportedAt: Date.now(),
    shop: await getShop(),
    recipes: await db.all('recipes'),
    bakes: await db.all('bakes'),
    photos: await Promise.all(photos.map(async (p) => ({ id: p.id, createdAt: p.createdAt, data: await blobToDataUrl(p.blob) }))),
  };
}

export async function importAll(data) {
  if (!data || data.app !== 'baker') throw new Error(L('不是这个 app 的备份文件', 'Not a backup file from this app'));
  if (data.shop) await saveShop(data.shop);
  for (const r of data.recipes || []) await db.put('recipes', r);
  for (const b of data.bakes || []) await db.put('bakes', b);
  for (const p of data.photos || []) {
    const blob = await (await fetch(p.data)).blob();
    await db.put('photos', { id: p.id, createdAt: p.createdAt, blob });
  }
}
