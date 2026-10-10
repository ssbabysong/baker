// 内置配方目录：catalog/recipes.json。
// app 里自带一份（第一次打开没网也有配方），启动后再去 GitHub Pages 拉最新的一份，
// 这样改内置配方只要改 JSON、推上去，不用重新发 App Store。
//
// 合并规则（mergeCatalog）：
//  - 新出现的 key：上架；用户删过的不会再放回来
//  - 已经在架上、用户没改过的：跟着新版本 / 当前语言换内容（id、价签、做过的记录都不变）
//  - 用户改过的：不动，只标一个「店里有新版」，让用户自己选
//  - removed 里的 key：不再给新用户上架，已经在架上的不删

import { db, uid, saveRecipe } from './store.js';

export const CATALOG_URL = 'https://ssbabysong.github.io/baker/catalog/recipes.json';
const SCHEMA = 1;                    // 这个版本的 app 看得懂的目录格式
const CHECK_EVERY = 12 * 3600000;    // 最多半天去线上看一次
const TIMEOUT = 5000;

// ---------- 读目录 ----------

// 只认得出格式对的配方，缺字段的直接跳过，不让一份坏数据弄坏整个配方架
function valid(c) {
  if (!c || c.schema !== SCHEMA || !Array.isArray(c.recipes) || typeof c.version !== 'number') return null;
  const okBody = (b) => b && typeof b.name === 'string' && b.name.trim() && Array.isArray(b.ingredients) && Array.isArray(b.steps);
  const recipes = c.recipes.filter((r) => r && typeof r.key === 'string' && okBody(r.zh) && (!r.en || okBody(r.en)));
  return { ...c, recipes, removed: Array.isArray(c.removed) ? c.removed : [] };
}

async function fetchJson(url, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { cache: 'no-cache', signal: ctl.signal });
    return res.ok ? await res.json() : null;
  } catch { return null; } finally { clearTimeout(t); }
}

// 手上最新的一份：app 自带的，和上次从线上存下来的，取 version 大的
export async function currentCatalog() {
  const bundled = valid(await fetchJson('catalog/recipes.json', 3000));
  const saved = valid(await db.getKv('catalog'));
  if (bundled && saved) return saved.version > bundled.version ? saved : bundled;
  return saved || bundled;
}

// 去线上看看有没有新版本；有就存下来并返回，没有返回 null
export async function refreshCatalog(force = false) {
  const last = (await db.getKv('catalogCheckedAt')) || 0;
  if (!force && Date.now() - last < CHECK_EVERY) return null;
  const remote = valid(await fetchJson(CATALOG_URL, TIMEOUT));
  if (!remote) return null;               // 没网、超时、格式看不懂：下次再说
  await db.setKv('catalogCheckedAt', Date.now());
  const cur = await currentCatalog();
  if (cur && remote.version <= cur.version) return null;
  await db.setKv('catalog', remote);
  return remote;
}

// ---------- 合并到配方架 ----------

const bodyOf = (c, lang) => (lang === 'en' && c.en ? c.en : c.zh);
// 比较「内容有没有被用户改过」用的指纹：名字、份量、备注、材料、步骤
const fingerprint = (r) => {
  const s = JSON.stringify([r.name, r.yield || '', r.notes || '',
    r.ingredients.map((i) => [i.name, i.amount ?? null, i.unit || '', i.note || '']),
    r.steps.map((st) => [st.text, st.minutes ?? null, st.kind || 'other'])]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
};

// 把目录里的一份配方，写进架上那条记录（保留 id、价签、创建时间；材料和步骤的 id 按位置沿用）
function applyBody(r, c, lang) {
  const b = bodyOf(c, lang);
  const next = {
    ...r,
    name: b.name, yield: b.yield || '', notes: b.notes || '', shape: c.shape || r.shape,
    ingredients: b.ingredients.map((i, n) => ({ id: r.ingredients?.[n]?.id || uid(), name: i.name, amount: i.amount ?? null, unit: i.unit || '', note: i.note || '' })),
    steps: b.steps.map((st, n) => ({ id: r.steps?.[n]?.id || uid(), text: st.text, minutes: st.minutes ?? null, kind: st.kind || 'other' })),
    sample: c.key, sampleLang: lang, sampleRev: c.rev || 1,
  };
  delete next.sampleUpdate;
  next.sampleHash = fingerprint(next);
  return next;
}

export async function mergeCatalog(catalog, lang) {
  if (!catalog) return false;
  const all = await db.all('recipes');
  let placed = await db.getKv('seededSamples');
  if (!Array.isArray(placed)) placed = (await db.getKv('seeded')) ? ['anpan', 'country', 'milk'] : [];
  let changed = false;

  for (const c of catalog.recipes) {
    // 架上对应的那条：按 key 找；老数据没记 key 的，按中英文名字认
    let r = all.find((x) => x.sample === c.key)
      || all.find((x) => !x.sample && (x.name === c.zh.name || x.name === c.en?.name));

    if (!r) {
      if (placed.includes(c.key) || catalog.removed.includes(c.key)) continue; // 删过的、下架的不再放
      await saveRecipe(applyBody({ ingredients: [], steps: [] }, c, lang));
      placed.push(c.key);
      changed = true;
      continue;
    }
    if (!placed.includes(c.key)) placed.push(c.key);

    // 用户有没有改过：和上次放上去时的指纹比；老数据没有指纹，就和目录里任一语言的版本比
    const fp = fingerprint(r);
    const pristine = r.sampleHash ? fp === r.sampleHash
      : fp === fingerprint(c.zh) || (c.en && fp === fingerprint(c.en));
    const rev = c.rev || 1;

    if (pristine) {
      if (r.sampleRev !== rev || r.sampleLang !== lang || !r.sampleHash || r.sample !== c.key) {
        await db.put('recipes', applyBody(r, c, lang));
        changed = true;
      }
    } else if (rev > (r.sampleRev || 1) && r.sampleUpdate !== rev && r.sampleSkip !== rev) {
      await db.put('recipes', { ...r, sample: c.key, sampleUpdate: rev }); // 改过了：只提示有新版
      changed = true;
    }
  }
  await db.setKv('seededSamples', placed);
  return changed;
}

// 用户点「换成新版」：用目录里的最新内容覆盖（价签、记录不变）
export async function takeCatalogUpdate(recipe, lang) {
  const cat = await currentCatalog();
  const c = cat?.recipes.find((x) => x.key === recipe.sample);
  if (!c) return null;
  const next = applyBody(recipe, c, lang);
  next.version = (recipe.version || 1) + 1;
  next.updatedAt = Date.now();
  await db.put('recipes', next);
  return next;
}

// 用户点「留着我的」：这个版本不再提示
export async function skipCatalogUpdate(recipe) {
  const next = { ...recipe, sampleSkip: recipe.sampleUpdate };
  delete next.sampleUpdate;
  await db.put('recipes', next);
}
