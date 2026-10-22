// iCloud 同步（只在 iOS App 里有）：配方、出炉记录、照片、店名放进用户自己的 iCloud，同一个 Apple 账号的设备之间自动同步。
// 上传下载、断网排队、别的设备改了推送过来，都是原生的 CloudSyncPlugin.swift（系统的 CKSyncEngine）在管；这里只做两件事：
//   1. 本地改了什么就交给原生（store.js 的 setSyncHook）
//   2. 原生收到别的设备的改动，合并进本地 IndexedDB：以后改的为准；内置配方两边各放了一份的，合成一份
// 网页版没有 iCloud，这些都不做；导入 / 导出备份照旧。

import { db, quiet, setSyncHook } from './store.js';
import { fingerprint } from './catalog.js';

let plugin = null;
let status = { on: false };
let onRemote = () => {};
let onStatus = () => {};

export const cloudReady = () => !!plugin;
export const cloudStatus = () => status;
const active = () => !!plugin && status.on && status.account === 'available';
// 新设备第一次同步完之前，先别把内置配方放上架（见 catalog.js 的 seed）
export const seedingAllowed = () => !active() || !!status.fetchedOnce;

// ---------- 合并规则（纯函数，tests/cloud.test.mjs 里测） ----------

// 本地没有、或者对面改得更晚（一样晚也算对面的，两边结果才一致）
export const remoteWins = (localM, remoteM) => localM == null || (remoteM ?? 0) >= localM;

// 「放上架过哪些内置配方」两边取并集：任何一边删过的，都不再放回来
export function unionList(a, b) {
  const out = Array.isArray(a) ? [...a] : [];
  for (const k of Array.isArray(b) ? b : []) if (!out.includes(k)) out.push(k);
  return out;
}

// 同一款内置配方在架上有好几份（两台设备各放了一份）：留 id 最小的那份，没改过的其他几份删掉，出炉记录改指向留下的那份。
// 两台设备按同一个规则算，结果一样；用户改过的不删
export function planDedupe(recipes, pristine) {
  const groups = new Map();
  for (const r of recipes) {
    if (!r.sample) continue;
    if (!groups.has(r.sample)) groups.set(r.sample, []);
    groups.get(r.sample).push(r);
  }
  const remove = [];
  const remap = {};
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const keep = list.reduce((a, b) => (a.id < b.id ? a : b));
    for (const r of list) {
      if (r !== keep && pristine(r)) { remove.push(r.id); remap[r.id] = keep.id; }
    }
  }
  return { remove, remap };
}

const pristine = (r) => !!r.sampleHash && fingerprint(r) === r.sampleHash;

// ---------- 和原生之间 ----------

export async function initCloud({ changed, statusChanged } = {}) {
  plugin = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins.CloudSync : null;
  if (!plugin) return;
  onRemote = changed || onRemote;
  onStatus = statusChanged || onStatus;
  setSyncHook((c) => { push(c).catch((e) => console.warn('cloud push', e)); });
  await plugin.addListener('changed', () => { pull(); });
  await plugin.addListener('status', (s) => setStatus(s));
  setStatus(await plugin.status());
  pull();
}

let uploadedRound = null; // 这一轮已经整个传过了：晚到的旧状态通知别再触发一遍
function setStatus(s) {
  const was = status;
  status = s;
  if (active() && s.needsFullUpload && s.round !== uploadedRound) uploadAll(s.round);
  onStatus(s, was);
}

export async function setCloudOn(on) {
  if (!plugin) return;
  setStatus(await plugin.setOn({ on }));
}
export const syncNow = () => plugin?.syncNow();

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1]);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function push(c) {
  if (!active()) return; // 没开同步：开的时候会整个传一遍
  if (c.deleted) return plugin.remove({ store: c.store, id: c.id });
  if (c.store === 'photos') {
    const { id, createdAt, blob } = c.value;
    return plugin.save({ store: 'photos', id, json: JSON.stringify({ id, createdAt }), mtime: c.mtime, photo: await blobToBase64(blob) });
  }
  return plugin.save({ store: c.store, id: c.id, json: JSON.stringify(c.value), mtime: c.mtime });
}

// 第一次开同步、换了 iCloud 账号：本地的全部交给原生（云端已有的，原生那边按修改时间比，旧的不会盖掉新的）
let uploading = null;
function uploadAll(round) {
  uploadedRound = round;
  uploading ||= (async () => {
    for (const store of ['recipes', 'bakes', 'photos']) {
      for (const v of await db.all(store)) await push({ store, id: v.id, value: v, mtime: v._m ?? 0 });
    }
    for (const key of ['shop', 'seededSamples']) {
      const value = await db.getKv(key);
      if (value != null) await push({ store: 'kv', id: key, value, mtime: (await db.getKv(`m:${key}`)) ?? 0 });
    }
    await plugin.fullUploadDone();
  })().catch((e) => console.warn('cloud upload', e)).finally(() => { uploading = null; });
  return uploading;
}

// 把原生收到的改动合并进本地；合并的时候又来了新的，合完再来一轮
let pulling = null;
let again = false;
function pull() {
  if (pulling) { again = true; return pulling; }
  pulling = (async () => {
    do {
      again = false;
      const { items } = await plugin.takeInbox();
      if (!items.length) continue;
      const done = [];
      for (const it of items) {
        try { await apply(it); done.push(it.name); } catch (e) { console.warn('cloud apply', it.name, e); } // 没合进去的留在 inbox，下次再试
      }
      if (done.length) await plugin.ack({ names: done });
      await dedupeSamples();
      onRemote();
    } while (again);
  })().catch((e) => console.warn('cloud pull', e)).finally(() => { pulling = null; });
  return pulling;
}

async function apply(it) {
  const { store, id } = it;
  if (store === 'kv') return applyKv(it);
  if (it.deleted) return quiet.del(store, id);
  if (store === 'photos') {
    if (await db.get('photos', id)) return; // 照片换了会是新的 id，同一个 id 的内容不会变
    const blob = await (await fetch(window.Capacitor.convertFileSrc(it.photo))).blob();
    return quiet.put('photos', { ...JSON.parse(it.json), blob, _m: it.mtime });
  }
  const local = await db.get(store, id);
  if (remoteWins(local?._m, it.mtime)) await quiet.put(store, { ...JSON.parse(it.json), _m: it.mtime });
}

async function applyKv(it) {
  if (it.deleted) return;
  const remote = JSON.parse(it.json);
  if (it.id === 'seededSamples') {
    const merged = unionList(await db.getKv('seededSamples'), remote);
    if (merged.length > (Array.isArray(remote) ? remote.length : 0)) await db.setKv('seededSamples', merged); // 本地多出来的也传上去
    else await quiet.setKv('seededSamples', merged, it.mtime);
    return;
  }
  if (remoteWins(await db.getKv(`m:${it.id}`), it.mtime)) await quiet.setKv(it.id, remote, it.mtime);
}

async function dedupeSamples() {
  const { remove, remap } = planDedupe(await db.all('recipes'), pristine);
  if (!remove.length) return;
  for (const b of await db.all('bakes')) {
    if (remap[b.recipeId]) await db.put('bakes', { ...b, recipeId: remap[b.recipeId] });
  }
  for (const id of remove) await db.del('recipes', id);
}
