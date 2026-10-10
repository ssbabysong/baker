// 本地存储：配方、出炉记录、照片都放在 IndexedDB（照片太大，localStorage 放不下）。

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
    name: (r.name || '未命名配方').trim(),
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
    price: r.price === '' || r.price == null || Number.isNaN(Number(r.price)) ? randomPrice(r.shape || guessShape(r.name)) : Math.max(0, Number(r.price)),
    createdAt: r.createdAt || now,
    updatedAt: now,
    version: (r.version || 0) + 1,
  };
}

export function guessShape(name = '') {
  const n = name.toLowerCase();
  if (/可颂|牛角|croissant/.test(n)) return 'croissant';
  if (/法棍|长棍|baguette/.test(n)) return 'baguette';
  if (/蛋糕|cake|戚风|芝士/.test(n)) return 'cake';
  if (/饼干|曲奇|cookie|biscuit/.test(n)) return 'cookie';
  if (/玛芬|麦芬|muffin|纸杯|cupcake/.test(n)) return 'muffin';
  if (/碱水|扭结|pretzel|brezel/.test(n)) return 'pretzel';
  if (/贝果|bagel|甜甜圈|donut/.test(n)) return 'bagel';
  if (/菠萝|蜜瓜|melon/.test(n)) return 'melonpan';
  if (/红豆|豆沙|红豆包|anpan|あんぱん/.test(n)) return 'anpan';
  if (/吐司|toast|土司|食パン|生吐司/.test(n)) return 'toast';
  return 'loaf';
}

// 价签：按面包种类给一个说得过去的价格区间，随机挑一个整数（元）
const PRICE_RANGE = {
  cookie: [6, 12], muffin: [10, 16], anpan: [8, 14], melonpan: [8, 14], bagel: [10, 16], pretzel: [10, 16],
  croissant: [12, 18], baguette: [14, 22], loaf: [16, 28], toast: [18, 32], cake: [28, 48],
};
export function randomPrice(shape) {
  const [lo, hi] = PRICE_RANGE[shape] || [10, 20];
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

// 老配方没有价签的，第一次上架时补一个（不改 updatedAt / version）
export async function listRecipes() {
  const all = await db.all('recipes');
  for (const r of all) {
    if (r.price == null) { r.price = randomPrice(r.shape); await db.put('recipes', r); }
  }
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export const getRecipe = (id) => db.get('recipes', id);
// 只改价签，不算改配方
export async function setPrice(id, price) {
  const r = await getRecipe(id);
  if (!r) return;
  r.price = price;
  await db.put('recipes', r);
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

// 把相机原图压缩到长边 1280，避免存储爆掉
export async function compressImage(file, max = 1280, quality = 0.82) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b || file), 'image/jpeg', quality));
}

// ---------- 店铺设置 & 进行中的烘焙 ----------

export async function getShop() {
  return (await db.getKv('shop')) || { name: '我的小烘焙铺', openedAt: Date.now() };
}
export const saveShop = (shop) => db.setKv('shop', shop);

export const getSession = () => db.getKv('session');
export const saveSession = (s) => db.setKv('session', s);
export const clearSession = () => db.delKv('session');

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
  if (!data || data.app !== 'baker') throw new Error('不是烘焙铺的备份文件');
  if (data.shop) await saveShop(data.shop);
  for (const r of data.recipes || []) await db.put('recipes', r);
  for (const b of data.bakes || []) await db.put('bakes', b);
  for (const p of data.photos || []) {
    const blob = await (await fetch(p.data)).blob();
    await db.put('photos', { id: p.id, createdAt: p.createdAt, blob });
  }
}
