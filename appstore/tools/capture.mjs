// 给 App Store 截图：塞一批像样的数据进去，再按 6.9" iPhone（440×956pt @3x）截几屏原始画面
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.argv[2]; const LANG = process.argv[3] || 'zh';
const NOW = new Date(2026, 9, 18, 9, 41).getTime(); // 10 月 18 日 9:41（本地时间）
const STATUS = 54;                                   // 状态栏高度，合成时另外画
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 440, height: 956 - STATUS }, deviceScaleFactor: 3, locale: LANG === 'zh' ? 'zh-CN' : 'en-US' });
await ctx.clock.install({ time: NOW });
// App 里没有打包乐米小奶泡体（只授权了网页），用的是小赖字体：截图换上 iOS 包里的样式（先 npm run build:www）
await ctx.route('**/css/style.css', (r) => r.fulfill({ path: new URL('../../www/css/style.css', import.meta.url).pathname }));
await ctx.addInitScript((lang) => { localStorage.setItem('baker-lang', lang); localStorage.setItem('baker-currency', lang === 'zh' ? 'CNY' : 'USD'); }, LANG);
const q = await ctx.newPage(); const errs = []; q.on('pageerror', (e) => errs.push(e.message));
await q.goto('http://localhost:8080/#/recipes'); await q.waitForSelector('.rack');

await q.evaluate(async ({ NOW, LANG }) => {
  const db = await new Promise((res) => { const r = indexedDB.open('baker'); r.onsuccess = () => res(r.result); });
  const all = (store) => new Promise((res) => { const g = db.transaction(store).objectStore(store).getAll(); g.onsuccess = () => res(g.result); });
  const put = (store, v, k) => new Promise((res) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(v, k); t.oncomplete = res; });
  const recipes = await all('recipes');
  const by = (shape) => recipes.find((r) => r.shape === shape);
  const DAY = 86400000;
  await put('kv', { name: LANG === 'zh' ? '晴天面包铺' : 'Sunny Day Bakery', openedAt: NOW - 96 * DAY }, 'shop');
  // 28 炉：这个月 11 炉，前几个月 17 炉 → Lv.5
  const order = ['chocobun', 'toast', 'loaf', 'anpan'];
  const notesZh = ['组织很软，下次糖少放一点', '割包开口很漂亮', '巧克力脆脆珠粘得满满的', '', '二发稍微过了一点', ''];
  const notesEn = ['So soft. A little less sugar next time', 'Lovely ear on the score', 'Covered in crunch pearls', '', 'Slightly over-proofed', ''];
  const thisMonth = [1, 3, 4, 6, 8, 9, 11, 13, 14, 16, 17];
  const days = [...thisMonth.map((d) => new Date(2026, 9, d, 16, 20).getTime())];
  for (let i = 0; i < 17; i++) days.push(new Date(2026, 9, 1).getTime() - (i * 5 + 2) * DAY + 15 * 3600000);
  let n = 0;
  for (const t of days) {
    const r = by(order[n % order.length]) || recipes[n % recipes.length];
    await put('bakes', { id: 'demo' + n, recipeId: r.id, recipeName: r.name, shape: r.shape, snapshot: r, scale: 1, changes: [], changeMode: 'none',
      startedAt: t - 3.5 * 3600000, finishedAt: t, photoId: null, rating: 4 + (n % 2), notes: (LANG === 'zh' ? notesZh : notesEn)[n % 6] });
    n++;
  }
  // 两炉正在烤：巧克力面包在一次发酵（已经 22 分钟），牛奶吐司在烤箱里（还剩 12 分钟）
  const mk = (r, current, minutesLeft, total, startedAgo) => {
    const st = r.steps[current];
    return { id: 'sess-' + r.shape, recipeId: r.id, original: r, recipe: JSON.parse(JSON.stringify(r)), startedAt: NOW - startedAgo * 60000, scale: 1,
      checked: r.ingredients.map((i) => i.id), doneSteps: r.steps.slice(0, current).map((s) => s.id), current,
      timers: [{ id: 't-' + r.shape, label: st.text.slice(0, 20), stepId: st.id, durationMs: total * 60000, endsAt: NOW + minutesLeft * 60000, pausedRemaining: null, done: false }],
      editing: false };
  };
  const choco = by('chocobun'); const toast = by('toast');
  await put('kv', [mk(choco, 1, 38, 60, 40), mk(toast, 5, 12, 35, 190)], 'sessions');
}, { NOW, LANG });

await q.reload(); await q.waitForSelector('.rack');
const shot = async (name) => { await q.waitForTimeout(900); await q.screenshot({ path: `${OUT}/${name}.png` }); };
const go = async (hash, sel) => { await q.goto('http://localhost:8080/' + hash); await q.waitForSelector(sel); };

await go('#/', '.storefront'); await shot('1-shop');
await q.evaluate(() => { const el = document.querySelector('.ovens'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150); }); await shot('3-ovens');
await go('#/bake/sess-chocobun', '.bake-hero'); await shot('2-proof');
await go('#/recipes', '.rack'); await shot('4-rack');
// 步骤页固定用巧克力面包（步骤最多、最有看头），不看配方架上的排序
const choco = await q.evaluate(async () => { const { db } = await import('/js/store.js'); return '#/r/' + (await db.all('recipes')).find((r) => r.shape === 'chocobun').id; });
await go(choco, '.hero'); await q.evaluate(() => { const el = document.querySelector('.steps'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70); }); await shot('5-steps');
await go('#/logs', '.cal'); await shot('6-calendar');
await go('#/', '.storefront'); await q.click('[data-act="roadmap"]'); await q.waitForSelector('.roadmap'); await shot('7-roadmap');
console.log(LANG, 'errors', errs); await b.close();
