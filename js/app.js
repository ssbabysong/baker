import {
  db, uid, listRecipes, getRecipe, saveRecipe, deleteRecipe, listBakes, getBake, saveBake, deleteBake,
  savePhoto, photoUrl, compressImage, getShop, saveShop, getSession, saveSession, clearSession,
  exportAll, importAll, guessShape,
} from './store.js';
import { parseRecipeText, formatAmount, formatMinutes, guessStepKind } from './parser.js';
import { shape, icon, storefront, storefrontSign, ovenScene, stageScene, emptyShelf, mascot, tabIcon, SHAPE_NAMES } from './sketch.js';
import {
  remainingMs, formatClock, createTimer, pauseTimer, resumeTimer, addMinutes,
  unlockAudio, playChime, startRinging, stopRinging, askNotifyPermission, notify, keepAwake,
} from './timers.js';
import { SAMPLE_RECIPES } from './samples.js';

const $app = document.getElementById('app');
const $tabs = document.getElementById('tabs');
const $dlg = document.getElementById('dlg');

const state = {
  shop: null,
  session: null,
  draft: null,        // 正在编辑 / 导入的配方
  draftFor: null,
  finish: { photo: null, photoUrl: '', rating: 0, notes: '', mode: 'update' },
  filter: '',
  alarmOpen: null,
};

// ---------- 小工具 ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const DAY = 86400000;
const fmtDate = (t) => { const d = new Date(t); return `${d.getMonth() + 1}月${d.getDate()}日`; };
const fmtDateFull = (t) => { const d = new Date(t); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const fmtDur = (ms) => formatMinutes(Math.round(ms / 60000));
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// 只有发酵和烘烤这两种"等待"的步骤才有计时器；揉面、整形之类做完点一下就好
const TIMED_KINDS = new Set(['ferment', 'bake']);
const isTimed = (st) => !!(st && st.minutes && TIMED_KINDS.has(st.kind));
const progressOf = (t) => (t ? (t.done ? 1 : 1 - remainingMs(t) / t.durationMs) : 0);
const growScale = (p) => (0.66 + 0.34 * Math.min(1, Math.max(0, p))).toFixed(3);

const KIND_LABEL = { ferment: '发酵', bake: '烘烤', rest: '静置', chill: '冷藏', knead: '揉面', other: '' };

// 店铺等级：私房烘焙的成长路线，出炉次数越多，小店越像样
const LEVELS = [
  { at: 0, name: '周末小推车', desc: '在家开烤，推着小车分给邻居尝尝' },
  { at: 1, name: '私房小铺', desc: '有了一间小小的铺子，开了一扇售卖窗' },
  { at: 5, name: '熟客小店', desc: '熟客常来，门口摆了红毡长凳和红伞，坐下来就能吃个面包' },
  { at: 12, name: '街角面包店', desc: '搬到街角，门面变宽，多了一扇大橱窗，门口停着送面包的自行车' },
  { at: 25, name: '排队小店', desc: '换成复古小店：红白条纹布篷、拱形橱窗，门口开始排队' },
  { at: 45, name: '两层小楼', desc: '加盖了带拱窗的二楼，屋顶立起一个大碱水面包' },
  { at: 70, name: '露台面包店', desc: '翻新成白墙落地窗的新店，旁边开了小露台' },
  { at: 100, name: '街区招牌店', desc: '加盖木头二楼和屋顶花园，成了街坊口中的招牌' },
];
function levelOf(n) {
  let i = 0;
  while (i + 1 < LEVELS.length && n >= LEVELS[i + 1].at) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return { lv: i + 1, name: cur.name, next, progress: next ? (n - cur.at) / (next.at - cur.at) : 1 };
}

// 门店插画 + 叠在招牌上的店名
function shopFront(level, name = '', small = false) {
  const g = storefrontSign(level);
  const style = `left:${(g.x / g.vbW * 100).toFixed(2)}%;width:${(g.w / g.vbW * 100).toFixed(2)}%;top:${(g.y / g.vbH * 100).toFixed(2)}%;height:${(g.h / g.vbH * 100).toFixed(2)}%`;
  return `<div class="storefront ${small ? 'mini' : ''}">${storefront(level)}${name ? (small
    ? `<span class="sign" style="${style}">${esc(name)}</span>`
    : `<button class="sign" style="${style}" data-act="rename-shop" title="点一下改店名">${esc(name)}</button>`) : ''}</div>`;
}

// 升级路线：每一级的店面、需要的出炉次数，标出现在在哪
async function showRoadmap() {
  const n = (await listBakes()).length;
  const cur = levelOf(n);
  await dialog(`<div class="roadmap">
    <h3>升级路线</h3>
    <p class="small muted">每出炉一次就离下一级近一点。现在累计出炉 <b class="mono">${n}</b> 次。</p>
    <ol>${LEVELS.map((L, i) => {
      const state = i + 1 < cur.lv ? 'past' : i + 1 === cur.lv ? 'now' : 'next';
      return `<li class="${state}">${shopFront(i + 1, '', true)}
        <div class="t"><b>Lv.${i + 1} ${L.name}</b>
          <span class="small muted">${L.desc}</span>
          <span class="small ${state === 'now' ? 'here' : 'muted'}">${state === 'now' ? '你在这里' : state === 'past' ? '已达成' : `出炉 ${L.at} 次解锁`}</span></div></li>`;
    }).join('')}</ol>
    <div class="row" style="justify-content:center"><button class="btn primary" data-dlg="ok">知道啦</button></div>
  </div>`);
}

// ---------- 弹窗 ----------

function dialog(html, { onOpen } = {}) {
  return new Promise((resolve) => {
    $dlg.innerHTML = html;
    const done = (v) => { $dlg.close(); resolve(v); };
    $dlg.onclick = (e) => {
      const b = e.target.closest('[data-dlg]');
      if (b) {
        const input = $dlg.querySelector('[data-dlg-input]');
        done(b.dataset.dlg === 'ok' && input ? input.value : b.dataset.dlg);
      } else if (e.target === $dlg) done(null);
    };
    $dlg.oncancel = (e) => { e.preventDefault(); done(null); };
    $dlg.showModal();
    onOpen?.($dlg);
    $dlg.querySelector('[data-dlg-input]')?.focus();
  });
}

const confirmDlg = (title, body = '', ok = '确定', danger = false) => dialog(`
  <h3>${esc(title)}</h3>${body ? `<p class="muted">${esc(body)}</p>` : ''}
  <div class="row end"><button class="btn ghost" data-dlg="cancel">算了</button><button class="btn ${danger ? 'danger' : 'primary'}" data-dlg="ok">${esc(ok)}</button></div>
`).then((v) => v === 'ok');

const promptDlg = (title, value = '', type = 'text') => dialog(`
  <h3>${esc(title)}</h3>
  <input class="input" data-dlg-input type="${type}" ${type === 'number' ? 'inputmode="decimal" step="any"' : ''} value="${esc(value)}">
  <div class="row end" style="margin-top:16px"><button class="btn ghost" data-dlg="cancel">算了</button><button class="btn primary" data-dlg="ok">好</button></div>
`).then((v) => (v === 'cancel' ? null : v));

// ---------- 路由 ----------

const ROUTES = [
  [/^#?\/?$/, viewShop, 'shop'],
  [/^#\/recipes$/, viewRecipes, 'recipes'],
  [/^#\/r\/([\w-]+)$/, viewRecipe, 'recipes'],
  [/^#\/edit\/([\w-]+)$/, viewEdit, 'recipes'],
  [/^#\/import$/, viewImport, 'recipes'],
  [/^#\/bake$/, viewBake, 'shop'],
  [/^#\/finish$/, viewFinish, 'shop'],
  [/^#\/logs(?:\/(\d{4}-\d{1,2}))?$/, viewLogs, 'logs'],
  [/^#\/log\/([\w-]+)$/, viewLog, 'logs'],
  [/^#\/settings$/, viewSettings, 'shop'],
];

function resolve(hash) {
  for (const [re, view, tab] of ROUTES) {
    const m = hash.match(re);
    if (m) return { view, tab, args: m.slice(1) };
  }
  return null;
}

let routeToken = 0;
async function route() {
  const hash = location.hash || '#/';
  const token = ++routeToken;
  const r = resolve(hash);
  if (!r) { go('#/'); return; }
  if (hash !== '#/bake' && state.session?.editing) {
    state.session.editing = false;
    persistSession();
  }
  const html = await r.view(...r.args);
  if (token !== routeToken) return; // 期间又跳转了
  $app.innerHTML = html;
  renderTabs(r.tab);
  renderTabClock();
  keepAwake(hash === '#/bake');
  window.scrollTo(0, 0);
}

// 原地刷新当前页（保持滚动位置）
async function rerender() {
  const r = resolve(location.hash || '#/');
  if (!r) return;
  const y = window.scrollY;
  const token = routeToken;
  const html = await r.view(...r.args);
  if (token !== routeToken) return;
  $app.innerHTML = html;
  renderTabClock();
  window.scrollTo(0, y);
}

const TABS = [['shop', '#/', '店铺', 'shop'], ['recipes', '#/recipes', '配方本', 'book'], ['logs', '#/logs', '日历', 'calendar']];

// 只在第一次画出整排按钮；之后切换只改选中状态，这样镜片能平滑地滑过去
function renderTabs(active) {
  if (!$tabs.querySelector('.lens')) {
    $tabs.innerHTML = '<span class="lens" aria-hidden="true"></span>' + TABS.map(([k, href, label]) =>
      `<a href="${href}" data-tab="${k}"><i class="tab-ic"></i><span>${label}</span></a>`).join('');
  }
  TABS.forEach(([k, , , ic], i) => {
    const a = $tabs.querySelector(`[data-tab="${k}"]`);
    const on = k === active;
    if (a.classList.contains('on') === on && a.dataset.drawn) return;
    a.classList.toggle('on', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    a.querySelector('.tab-ic').innerHTML = tabIcon(ic, on);
    a.dataset.drawn = '1';
    if (on) $tabs.style.setProperty('--i', i);
  });
}

// 往下滚动时把菜单栏缩小，往上滚动或回到顶部时展开（和 iOS 一样）
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const bar = $tabs.parentElement;
  if (y < 40 || y < lastY - 6) bar.classList.remove('mini');
  else if (y > lastY + 6) bar.classList.add('mini');
  lastY = y;
}, { passive: true });

// =====================================================================
// 店铺首页
// =====================================================================

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

const isToday = (t) => new Date(t).toDateString() === new Date().toDateString();

async function viewShop() {
  const [recipes, bakes] = await Promise.all([listRecipes(), listBakes()]);
  const shop = state.shop;
  const lv = levelOf(bakes.length);
  const days = Math.floor((Date.now() - shop.openedAt) / DAY) + 1;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = bakes.filter((b) => b.finishedAt >= monthStart.getTime()).length;
  const today = bakes.filter((b) => isToday(b.finishedAt)).length;
  const bakeCount = (id) => bakes.filter((b) => b.recipeId === id).length;

  const s = state.session;
  let ovenHtml;
  if (s) {
    const cur = s.recipe.steps[s.current];
    const running = s.timers.filter((t) => !t.done);
    const curT = cur && s.timers.find((t) => t.stepId === cur.id);
    ovenHtml = `<a class="card oven-card" href="#/bake" ${curT ? `data-grow="${curT.id}"` : ''}>
      ${stageScene(cur?.kind, running.length > 0, '', progressOf(curT))}
      <div class="info"><b>${esc(s.recipe.name)}</b>
        <span class="small muted">第 ${Math.min(s.current + 1, s.recipe.steps.length)}/${s.recipe.steps.length} 步${cur ? ` · ${esc(cur.text.slice(0, 16))}` : ''}</span>
        ${running.length ? `<div class="small">${icon('timer')} <span class="mono" data-clock="${running[0].id}">${formatClock(remainingMs(running[0]))}</span> ${esc(running[0].label.slice(0, 10))}</div>` : ''}
      </div>${icon('next')}</a>`;
  } else {
    ovenHtml = `<div class="card dashed oven-card">${ovenScene()}
      <div class="info"><b>烤箱空着</b><span class="small muted">从配方架上挑一个，开烤吧</span></div></div>`;
  }

  const recent = bakes.slice(0, 6);
  const thumbs = await Promise.all(recent.map((b) => photoUrl(b.photoId)));

  return `
  <div class="greet"><div class="t"><h1>${greeting()}</h1>
    <p>${today ? `今天已出炉 ${today} 炉` : s ? `「${esc(s.recipe.name)}」正在烤箱里` : '今天想烤点什么？'}</p></div>
    <a class="btn icon ghost" href="#/settings" aria-label="店务">${icon('gear')}</a></div>
  ${shopFront(lv.lv, shop.name)}
  <div class="shop-meta">
    <button class="lv" data-act="roadmap" aria-label="查看升级路线">Lv.${lv.lv} ${lv.name} ›</button>
    <span class="small muted"> · 营业第 <span class="mono">${days}</span> 天</span>
    ${lv.next ? `<div class="progress" title="再出炉 ${lv.next.at - bakes.length} 次升级"><i style="width:${Math.round(lv.progress * 100)}%"></i></div>
      <button class="link-btn" data-act="roadmap">再出炉 ${lv.next.at - bakes.length} 次 → ${lv.next.name} · 升级路线</button>` : '<button class="link-btn" data-act="roadmap">已经是最高等级 · 升级路线</button>'}
  </div>

  <div class="stats">
    <div class="stat"><b>${recipes.length}</b><span>本店配方</span></div>
    <div class="stat"><b>${bakes.length}</b><span>累计出炉</span></div>
    <div class="stat"><b>${thisMonth}</b><span>本月出炉</span></div>
  </div>

  <h2>烤箱</h2>
  ${ovenHtml}

  <h2>配方架 <a class="more" href="#/recipes">全部 ›</a></h2>
  <div class="shelf">
    ${recipes.map((r) => `<a class="item" href="#/r/${r.id}">${shape(r.shape)}<span>${esc(r.name)}</span><small>${bakeCount(r.id) ? `做过 ${bakeCount(r.id)} 次` : '还没做过'}</small></a>`).join('')}
    <a class="item add" href="#/import">${icon('plus')}<span class="muted">上新配方</span></a>
  </div>
  <div class="shelf-board"></div>

  <h2>作品墙 <a class="more" href="#/logs">日历 ›</a></h2>
  ${recent.length ? `<div class="wall">${recent.map((b, i) => polaroid(b, thumbs[i])).join('')}</div>`
    : `<div class="empty">${emptyShelf()}<div>还没有作品，第一炉在等你</div></div>`}
  `;
}

function polaroid(b, url) {
  return `<a class="polaroid" href="#/log/${b.id}"><span class="tape"></span>
    <div class="ph">${url ? `<img src="${url}" alt="" loading="lazy">` : shape(b.shape)}</div>
    <figcaption>${esc(b.recipeName)} · ${fmtDate(b.finishedAt)}</figcaption></a>`;
}

// =====================================================================
// 配方
// =====================================================================

async function viewRecipes() {
  const [recipes, bakes] = await Promise.all([listRecipes(), listBakes()]);
  const q = state.filter.trim().toLowerCase();
  const list = q ? recipes.filter((r) => r.name.toLowerCase().includes(q) || r.ingredients.some((i) => i.name.toLowerCase().includes(q))) : recipes;
  const last = (id) => bakes.find((b) => b.recipeId === id);
  return `
  <div class="topbar"><h1>配方本</h1>
    <a class="btn sm" href="#/import" data-act="new-import">${icon('paste')} 导入</a>
    <a class="btn sm primary" href="#/edit/new" data-act="new-blank">${icon('plus')} 手写</a></div>
  <input class="search" type="search" placeholder="找配方 / 找材料…" value="${esc(state.filter)}" data-act-input="filter">
  <div class="recipe-list" style="margin-top:14px">
    ${list.map((r, i) => {
      const l = last(r.id);
      const total = r.steps.reduce((a, s) => a + (s.minutes || 0), 0);
      return `<a class="card ${i % 2 ? 'alt' : ''} recipe-row" href="#/r/${r.id}"><span class="tile">${shape(r.shape)}</span>
        <div class="t"><b>${esc(r.name)}</b>
        <span>${r.ingredients.length} 种材料 · ${r.steps.length} 步${total ? ` · 约 ${formatMinutes(total)}` : ''}${l ? ` · 上次 ${fmtDate(l.finishedAt)}` : ''}</span></div>
        ${icon('next')}</a>`;
    }).join('') || `<div class="empty">${emptyShelf()}<div>${q ? '没找到' : '配方架还是空的'}</div></div>`}
  </div>`;
}

async function viewRecipe(id) {
  const r = await getRecipe(id);
  if (!r) return notFound();
  const bakes = (await listBakes()).filter((b) => b.recipeId === id);
  const thumbs = await Promise.all(bakes.slice(0, 6).map((b) => photoUrl(b.photoId)));
  const total = r.steps.reduce((a, s) => a + (s.minutes || 0), 0);
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/recipes" aria-label="返回">${icon('back')}</a><h1></h1>
    <button class="btn icon ghost" data-act="share-recipe" data-id="${r.id}" aria-label="分享">${icon('share')}</button>
    <a class="btn icon ghost" href="#/edit/${r.id}" aria-label="编辑">${icon('pencil')}</a></div>
  <div class="hero">${shape(r.shape)}<h1>${esc(r.name)}</h1>
    <div class="chips">
      ${r.yield ? `<span class="chip time">${esc(r.yield)}</span>` : ''}
      ${total ? `<span class="chip time">${icon('timer')} 约 ${formatMinutes(total)}</span>` : ''}
      <span class="chip time">做过 ${bakes.length} 次</span>
    </div></div>

  <div style="margin:18px 0 4px"><button class="btn primary big block" data-act="start-bake" data-id="${r.id}">${icon('oven')} 开烤！</button></div>

  <h2>材料</h2>
  ${ingTable(r.ingredients)}

  <h2>步骤</h2>
  <ol class="steps">${r.steps.map((s) => `<li>${esc(s.text)}${stepMeta(s)}</li>`).join('')}</ol>

  ${r.notes ? `<h2>备注</h2><div class="card fill notes">${esc(r.notes)}</div>` : ''}

  ${bakes.length ? `<h2>这款的作品</h2><div class="wall">${bakes.slice(0, 6).map((b, i) => polaroid(b, thumbs[i])).join('')}</div>` : ''}

  <div class="row" style="margin-top:32px"><button class="btn danger sm" data-act="delete-recipe" data-id="${r.id}">${icon('trash')} 删除配方</button>
    <span class="small muted grow" style="text-align:right">v${r.version} · 更新于 ${fmtDate(r.updatedAt)}</span></div>`;
}

function ingTable(ings, scale = 1) {
  if (!ings.length) return '<p class="muted">（还没有材料）</p>';
  return `<table class="ing-table">${ings.map((i) => `<tr><td>${esc(i.name)}${i.note ? ` <span class="note">${esc(i.note)}</span>` : ''}</td>
    <td class="amt">${i.amount != null ? formatAmount(i.amount * scale) : ''} ${esc(i.unit)}</td></tr>`).join('')}</table>`;
}

function stepMeta(s) {
  const bits = [];
  if (s.minutes) bits.push(`<span class="chip time">${icon('timer')} ${formatMinutes(s.minutes)}</span>`);
  if (KIND_LABEL[s.kind]) bits.push(`<span class="badge">${KIND_LABEL[s.kind]}</span>`);
  return bits.length ? `<div class="meta">${bits.join('')}</div>` : '';
}

// 导出为纯文本：再粘贴回「导入」也能原样解析
function recipeToText(r) {
  return [
    r.name, '',
    '材料：', ...r.ingredients.map((i) => `${i.name} ${i.amount != null ? formatAmount(i.amount) : ''}${i.unit}${i.note ? `（${i.note}）` : ''}`.trim()), '',
    '步骤：', ...r.steps.map((s, n) => `${n + 1}. ${s.text}${s.minutes && !/\d\s*(分|小时|min|h)/i.test(s.text) ? ` ${formatMinutes(s.minutes)}` : ''}`),
    ...(r.notes ? ['', '备注：', r.notes] : []),
  ].join('\n');
}

// ---------- 编辑配方 ----------

function blankRecipe() {
  return { name: '', shape: 'loaf', yield: '', ingredients: [{ id: uid(), name: '', amount: null, unit: 'g', note: '' }], steps: [{ id: uid(), text: '', minutes: null, kind: 'other' }], notes: '' };
}

async function viewEdit(id) {
  if (state.draftFor !== id || !state.draft) {
    if (id === 'new') state.draft = blankRecipe();
    else {
      const r = await getRecipe(id);
      if (!r) return notFound();
      state.draft = clone(r);
    }
    state.draftFor = id;
  }
  const d = state.draft;
  return `
  <div class="topbar"><a class="btn icon ghost" href="${id === 'new' ? '#/recipes' : `#/r/${id}`}" data-act="cancel-edit" aria-label="返回">${icon('back')}</a>
    <h1>${id === 'new' ? '上新配方' : '改配方'}</h1>
    <button class="btn primary sm" data-act="save-recipe">${icon('check')} 保存</button></div>

  <label class="f"><span>名字</span><input class="input" data-d="name" value="${esc(d.name)}" placeholder="比如：乡村欧包"></label>
  <div class="f"><span class="small muted">长什么样</span>
    <div class="shape-pick">${Object.keys(SHAPE_NAMES).map((k) => `<button type="button" class="${d.shape === k ? 'on' : ''}" data-act="set-shape" data-v="${k}">${shape(k)}${SHAPE_NAMES[k]}</button>`).join('')}</div></div>
  <label class="f" style="margin-top:14px"><span>份量</span><input class="input" data-d="yield" value="${esc(d.yield)}" placeholder="比如：1 个 · 约 800g"></label>

  <h2>${icon('flour')} 材料</h2>
  <div class="edit-grid">
    ${d.ingredients.map((i) => `<div class="edit-ing">
      <input class="input" data-d="ing.${i.id}.name" value="${esc(i.name)}" placeholder="材料">
      <input class="input num" data-d="ing.${i.id}.amount" value="${i.amount ?? ''}" type="number" inputmode="decimal" step="any" placeholder="用量">
      <input class="input" data-d="ing.${i.id}.unit" value="${esc(i.unit)}" placeholder="单位">
      <button class="btn icon sm ghost" data-act="del-ing" data-id="${i.id}" aria-label="删除">${icon('close')}</button>
    </div>`).join('')}
  </div>
  <button class="btn sm" style="margin-top:8px" data-act="add-ing">${icon('plus')} 加材料</button>

  <h2>${icon('timer')} 步骤</h2>
  <div>
    ${d.steps.map((s, n) => `<div class="edit-step">
      <textarea class="input" rows="2" style="min-height:56px" data-d="step.${s.id}.text" placeholder="第 ${n + 1} 步做什么">${esc(s.text)}</textarea>
      <div class="tools">
        <input class="input num" data-d="step.${s.id}.minutes" value="${s.minutes ?? ''}" type="number" inputmode="decimal" step="any" placeholder="分钟">
        <span class="small muted">分钟</span><span class="grow" style="flex:1"></span>
        <button class="btn icon sm ghost" data-act="move-step" data-id="${s.id}" data-v="-1" aria-label="上移">${icon('up')}</button>
        <button class="btn icon sm ghost" data-act="move-step" data-id="${s.id}" data-v="1" aria-label="下移">${icon('down')}</button>
        <button class="btn icon sm ghost" data-act="del-step" data-id="${s.id}" aria-label="删除">${icon('close')}</button>
      </div></div>`).join('')}
  </div>
  <button class="btn sm" style="margin-top:8px" data-act="add-step">${icon('plus')} 加步骤</button>

  <h2>${icon('pencil')} 备注</h2>
  <textarea class="input" data-d="notes" placeholder="小心得、注意事项…">${esc(d.notes)}</textarea>

  <button class="btn primary block" style="margin-top:22px" data-act="save-recipe">${icon('check')} 保存配方</button>`;
}

// 更新 recipe 对象里 "ing.<id>.amount" 这种路径的值
function applyField(recipe, path, value) {
  const [a, b, c] = path.split('.');
  if (a === 'ing' || a === 'step') {
    const list = a === 'ing' ? recipe.ingredients : recipe.steps;
    const item = list.find((x) => x.id === b);
    if (!item) return;
    if (c === 'amount' || c === 'minutes') item[c] = value === '' ? null : Number(value);
    else item[c] = value;
    if (a === 'step' && c === 'text') {
      item.kind = guessStepKind(value);
    }
  } else {
    recipe[a] = value;
  }
}

// ---------- 导入 ----------

const IMPORT_EXAMPLE = `乡村欧包

材料：
高筋面粉 400g
全麦粉 100g
水 360g
盐 10g
酵母 3g

步骤：
1. 面粉和水混合，静置30分钟
2. 加盐和酵母揉面10分钟
3. 一次发酵 2小时
4. 整形后二次发酵 1小时
5. 250°C 烤 40分钟`;

function viewImport() {
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/recipes" aria-label="返回">${icon('back')}</a><h1>导入配方</h1></div>
  <p class="muted small">把食谱整段粘贴进来就好——小红书、公众号、笔记里抄的都行。我会认出<span class="scribble">材料和用量</span>、<span class="scribble">每一步和它的时间</span>，导入后还能再改。</p>
  <textarea class="input tall" id="import-text" placeholder="${esc(IMPORT_EXAMPLE)}"></textarea>
  <div class="row" style="margin-top:12px">
    <button class="btn primary grow" data-act="parse-import">${icon('check')} 认一下</button>
    <label class="btn">${icon('upload')} 文件<input type="file" accept=".txt,.md,.json,text/plain,application/json" hidden data-act-change="import-file"></label>
  </div>
  <p class="small muted" style="margin-top:18px">小提示：写上「材料」「步骤」这样的小标题会认得更准；时间写成「30分钟」「1.5小时」「45 min」都可以。</p>`;
}

// =====================================================================
// 烘焙中
// =====================================================================

async function startBake(id) {
  const r = await getRecipe(id);
  if (!r) return;
  if (state.session) {
    const ok = await confirmDlg('烤箱里还有东西', `「${state.session.recipe.name}」还没出炉，要放弃它开始新的吗？`, '换这个', true);
    if (!ok) return;
    stopRinging();
  }
  unlockAudio();
  askNotifyPermission();
  state.session = {
    id: uid(),
    recipeId: r.id,
    original: clone(r),
    recipe: clone(r),
    startedAt: Date.now(),
    scale: 1,
    checked: [],
    doneSteps: [],
    current: 0,
    timers: [],
    editing: false,
  };
  await persistSession();
  go('#/bake');
}

let saveTimer = null;
function persistSession(debounce = 0) {
  clearTimeout(saveTimer);
  const run = () => (state.session ? saveSession(state.session) : clearSession());
  if (!debounce) return run();
  saveTimer = setTimeout(run, debounce);
  return Promise.resolve();
}

function viewBake() {
  const s = state.session;
  if (!s) {
    return `<div class="topbar"><a class="btn icon ghost" href="#/" aria-label="返回">${icon('back')}</a><h1>烤箱</h1></div>
      <div class="empty">${ovenScene()}<p>烤箱空着呢</p><a class="btn primary" href="#/recipes">去挑个配方</a></div>`;
  }
  const r = s.recipe;
  const ed = s.editing;
  const scaleBtns = [0.5, 1, 1.5, 2].map((v) => `<button class="chip ${s.scale === v ? 'on' : ''}" data-act="scale" data-v="${v}">×${v}</button>`).join('');
  const changes = diffRecipe(s.original, r);

  const ingHtml = ed
    ? `<div class="edit-grid">${r.ingredients.map((i) => `<div class="edit-ing">
        <input class="input" data-s="ing.${i.id}.name" value="${esc(i.name)}" placeholder="材料">
        <input class="input num" data-s="ing.${i.id}.amount" value="${i.amount != null ? formatAmount(i.amount * s.scale) : ''}" type="number" inputmode="decimal" step="any">
        <input class="input" data-s="ing.${i.id}.unit" value="${esc(i.unit)}">
        <button class="btn icon sm ghost" data-act="bake-del-ing" data-id="${i.id}" aria-label="删除">${icon('close')}</button></div>`).join('')}</div>
        <button class="btn sm" style="margin-top:8px" data-act="bake-add-ing">${icon('plus')} 加材料</button>`
    : `<ul class="checklist">${r.ingredients.map((i) => {
        const done = s.checked.includes(i.id);
        return `<li class="${done ? 'done' : ''}" data-act="toggle-ing" data-id="${i.id}">
          <span class="box">${done ? icon('check') : ''}</span><span class="name">${esc(i.name)}${i.note ? ` <span class="small muted">${esc(i.note)}</span>` : ''}</span>
          <span class="amt">${i.amount != null ? formatAmount(i.amount * s.scale) : ''} ${esc(i.unit)}</span></li>`;
      }).join('')}</ul>`;

  const stepsHtml = r.steps.map((st, n) => {
    const done = s.doneSteps.includes(st.id);
    const cur = n === s.current && !done;
    const timers = s.timers.filter((t) => t.stepId === st.id);
    if (ed) {
      return `<li><div class="edit-step" style="padding-top:0">
        <textarea class="input" rows="2" style="min-height:56px" data-s="step.${st.id}.text">${esc(st.text)}</textarea>
        <div class="tools"><input class="input num" data-s="step.${st.id}.minutes" value="${st.minutes ?? ''}" type="number" inputmode="decimal" step="any" placeholder="分钟">
        <span class="small muted">分钟</span><span style="flex:1"></span>
        <button class="btn icon sm ghost" data-act="bake-del-step" data-id="${st.id}" aria-label="删除">${icon('close')}</button></div></div></li>`;
    }
    return `<li class="${done ? 'done' : ''} ${cur ? 'current' : ''}">
      <div class="stext" data-act="focus-step" data-i="${n}">${esc(st.text)}${timers.map((t) => ` <span class="tick mono" data-clock="${t.id}">${t.done ? '时间到！' : formatClock(remainingMs(t))}</span>`).join('')}</div>
      ${!done && isTimed(st) && !timers.length ? `<div class="meta"><span class="chip time">${icon('timer')} ${formatMinutes(st.minutes)}</span></div>` : ''}
    </li>`;
  }).join('');

  return `
  <div class="bake-head">
    <a class="btn icon ghost" href="#/" aria-label="返回">${icon('back')}</a>
    <div class="t"><b>${esc(r.name)}</b><span><span class="mono">${fmtDateFull(s.startedAt).slice(-5)}</span> 开烤 · 已 <span data-elapsed>${fmtDur(Date.now() - s.startedAt)}</span></span></div>
    <button class="btn sm ${ed ? 'primary' : ''}" data-act="bake-edit-toggle">${icon(ed ? 'check' : 'pencil')} ${ed ? '改好了' : '改配方'}</button>
  </div>
  ${changes.length ? `<p class="small" style="margin:8px 0 0"><span class="badge">这次改了 ${changes.length} 处</span> <span class="muted">出炉时再决定要不要存回配方</span></p>` : ''}

  ${ed ? '' : bakeHero(s)}

  <h2>称料 <span class="row" style="margin-left:auto;gap:6px">${scaleBtns}</span></h2>
  ${ingHtml}

  <h2>步骤</h2>
  <ol class="steps bake-steps">${stepsHtml}</ol>
  ${ed ? `<div class="row" style="justify-content:space-between;margin-top:8px">
    <button class="btn sm" data-act="bake-add-step">${icon('plus')} 加步骤</button>
    <button class="btn sm primary" data-act="bake-edit-toggle">${icon('check')} 改好了</button></div>
    <p class="small muted center" style="margin-top:10px">改动会自动保存，离开这一页也会自动退出修改</p>` : ''}

  <div class="stack" style="margin-top:26px">
    <button class="btn crust block" data-act="go-finish">${icon('camera')} 出炉啦！拍照记录</button>
    <button class="btn ghost block small danger" data-act="abandon">放弃这一炉</button>
  </div>`;
}

// 顶部的大烤箱：显示屏上就是当前计时，旁边站着吐司店长
const START_WORD = { bake: '放进烤箱', ferment: '开始发酵' };

// 正在计时时的一排小按钮：暂停 / 继续、加 5 分钟、取消
function timerControls(t) {
  const paused = t.pausedRemaining != null;
  return `<div class="timer-ctl">
    <button class="link-btn" data-act="${paused ? 'timer-resume' : 'timer-pause'}" data-id="${t.id}">${icon(paused ? 'play' : 'pause')} ${paused ? '继续' : '暂停'}</button>
    <button class="link-btn" data-act="timer-add" data-id="${t.id}">${icon('plus')} 5 分钟</button>
    <button class="link-btn" data-act="timer-stop" data-id="${t.id}">${icon('close')} 取消计时</button>
  </div>`;
}

function bakeHero(s) {
  const r = s.recipe;
  const cur = r.steps[s.current];
  const live = s.timers.filter((t) => !t.done).sort((a, b) => remainingMs(a) - remainingMs(b));
  const ringing = s.timers.find((t) => t.done);
  const curTimer = cur && s.timers.find((t) => t.stepId === cur.id);
  const kind = cur?.kind;
  const timed = isTimed(cur);
  const running = !!(curTimer && !curTimer.done);
  const mood = !cur ? 'yay' : running ? 'wait' : 'wave';
  const clockText = (t) => (t.done ? '时间到！' : formatClock(remainingMs(t)));

  // 烤箱：倒计时显示在烤箱面板上；发酵：大号倒计时在碗下面；其他步骤：不计时，只放揉面动画
  let scene;
  if (!cur) {
    scene = `<div class="oven-wrap">${ovenScene('', false, true)}<span class="display">出炉啦</span>${mascot('yay')}</div>`;
  } else if (kind === 'bake') {
    const t = curTimer;
    const display = t ? `<span class="display ${t.done ? 'ring' : ''}" data-clock="${t.id}">${clockText(t)}</span>`
      : `<span class="display">${timed ? formatClock(cur.minutes * 60000) : '--:--'}</span>`;
    scene = `<div class="oven-wrap">${ovenScene('', running)}${display}${mascot(mood)}</div>`;
  } else if (kind === 'ferment') {
    const t = curTimer;
    const clock = t ? `<div class="hero-clock ${t.done ? 'ring' : ''}" data-clock="${t.id}">${clockText(t)}</div>`
      : timed ? `<div class="hero-clock">${formatClock(cur.minutes * 60000)}</div>` : '';
    scene = `<div class="oven-wrap" ${t ? `data-grow="${t.id}"` : ''}>${stageScene('ferment', running, '', progressOf(t))}${mascot(mood)}</div>${clock}`;
  } else {
    // 别的步骤在做的时候，如果之前的发酵/烘烤计时还在跑，用一行小字提醒
    const other = ringing || live[0];
    scene = `<div class="oven-wrap">${stageScene(kind, true)}${mascot('wave')}</div>
      ${other ? `<div class="hero-clock small">${icon(other.done ? 'bell' : 'timer')} <span data-clock="${other.id}">${clockText(other)}</span> · ${esc(other.label.slice(0, 10))}</div>` : ''}`;
  }

  let action;
  let hint;
  if (!cur) {
    action = `<button class="btn primary big block" data-act="go-finish">${icon('camera')} 出炉啦！拍照记录</button>`;
    hint = '每一步都完成了，辛苦啦';
  } else if (timed && !curTimer) {
    action = `<button class="btn primary big block" data-act="timer-start" data-id="${cur.id}">${START_WORD[kind]} · ${formatMinutes(cur.minutes)}</button>`;
    hint = '按下就开始计时，时间到会叫你';
  } else {
    action = `<button class="btn primary big block" data-act="step-done" data-id="${cur.id}">${icon('check')} 这步好了，下一步</button>`;
    hint = running ? (kind === 'ferment' ? '面团在睡觉长大，安心去做别的吧' : '烤箱在努力，时间到我会叫你')
      : curTimer?.done ? '时间到啦，看看状态再进行下一步' : '慢慢来，做完这步就点一下';
  }
  return `<div class="bake-hero">
    ${scene}
    ${curTimer && !curTimer.done ? timerControls(curTimer) : ''}
    ${cur ? `<div class="step-now"><span class="n">第 ${s.current + 1} 步 · 共 ${r.steps.length} 步</span>
      <b>${esc(cur.text)}</b>${cur.minutes || KIND_LABEL[cur.kind] ? `<span class="small muted">${[KIND_LABEL[cur.kind], cur.minutes ? formatMinutes(cur.minutes) : ''].filter(Boolean).join(' · ')}</span>` : ''}</div>` : ''}
    ${action}
    <p class="hero-hint">${hint}</p>
  </div>`;
}

// 列出这次做的时候对配方的改动
function diffRecipe(a, b) {
  if (!a || !b) return [];
  const out = [];
  const amt = (i) => `${i.amount != null ? formatAmount(i.amount) : ''}${i.unit}`;
  const aIng = new Map(a.ingredients.map((i) => [i.id, i]));
  const bIng = new Map(b.ingredients.map((i) => [i.id, i]));
  for (const i of b.ingredients) {
    const o = aIng.get(i.id);
    if (!o) { if (i.name) out.push({ t: `加了 ${i.name} ${amt(i)}` }); continue; }
    if (o.name !== i.name) out.push({ t: `${i.name}`, old: o.name });
    if (o.amount !== i.amount || o.unit !== i.unit) out.push({ t: `${i.name} ${amt(i)}`, old: amt(o) });
  }
  for (const o of a.ingredients) if (!bIng.has(o.id)) out.push({ t: `去掉了 ${o.name}` });
  const aSt = new Map(a.steps.map((s) => [s.id, s]));
  const bSt = new Map(b.steps.map((s) => [s.id, s]));
  b.steps.forEach((s, n) => {
    const o = aSt.get(s.id);
    if (!o) { if (s.text) out.push({ t: `新增步骤：${s.text}` }); return; }
    if (o.text !== s.text) out.push({ t: `第${n + 1}步：${s.text}`, old: o.text });
    if ((o.minutes || null) !== (s.minutes || null)) out.push({ t: `第${n + 1}步 ${s.minutes ? formatMinutes(s.minutes) : '不计时'}`, old: o.minutes ? formatMinutes(o.minutes) : '不计时' });
  });
  for (const o of a.steps) if (!bSt.has(o.id)) out.push({ t: `删掉步骤：${o.text}` });
  return out;
}

// ---------- 计时循环 ----------

function tick() {
  const s = state.session;
  if (!s) return;
  const now = Date.now();
  let changed = false;
  for (const t of s.timers) {
    if (!t.done && t.pausedRemaining == null && t.endsAt <= now) {
      t.done = true;
      changed = true;
      fireAlarm(t);
    }
  }
  document.querySelectorAll('[data-clock]').forEach((el) => {
    const t = s.timers.find((x) => x.id === el.dataset.clock);
    if (t) el.textContent = t.done ? '时间到！' : formatClock(remainingMs(t, now));
  });
  document.querySelectorAll('[data-grow]').forEach((el) => {
    const t = s.timers.find((x) => x.id === el.dataset.grow);
    el.querySelector('[data-grow-scale]')?.style.setProperty('--g', growScale(progressOf(t)));
  });
  const el = document.querySelector('[data-elapsed]');
  if (el) el.textContent = fmtDur(now - s.startedAt);
  if (changed) {
    persistSession();
    if (location.hash === '#/bake') rerender();
  }
  renderTabClock();
}

// 别的页面上不再浮一排计时小条：最近的那个倒计时直接显示在菜单栏「店铺」下面
function renderTabClock() {
  const label = $tabs.querySelector('[data-tab="shop"] span');
  if (!label) return;
  const s = state.session;
  const ts = s ? s.timers.slice().sort((a, b) => remainingMs(a) - remainingMs(b)) : [];
  const t = ts.find((x) => x.done) || ts[0];
  label.textContent = t ? (t.done ? '时间到' : formatClock(remainingMs(t))) : '店铺';
  label.classList.toggle('mono', !!t);
  label.parentElement.classList.toggle('ticking', !!t);
}

async function fireAlarm(t) {
  startRinging();
  const autoStop = setTimeout(stopRinging, 60000); // 没人理也只响一分钟
  notify(`⏰ ${t.label}`, `「${state.session?.recipe.name || ''}」这一步的时间到啦`);
  if (state.alarmOpen) return;
  state.alarmOpen = t.id;
  const v = await dialog(`<div class="alarm">${mascot('yay')}<h3>时间到！</h3>
    <p>${esc(t.label)}</p>
    <div class="row" style="justify-content:center">
      <button class="btn" data-dlg="more">再等 5 分钟</button>
      <button class="btn primary" data-dlg="ok">好了，下一步</button></div></div>`);
  clearTimeout(autoStop);
  state.alarmOpen = null;
  stopRinging();
  const s = state.session;
  const live = s?.timers.find((x) => x.id === t.id);
  if (!live) return;
  if (v === 'more') {
    addMinutes(live, 5);
  } else {
    // 计时到这里就结束了；点了「好了，下一步」再顺手进入下一步
    s.timers = s.timers.filter((x) => x.id !== live.id);
    if (v === 'ok' && live.stepId) completeStep(s, live.stepId);
  }
  await persistSession();
  if (location.hash === '#/bake') rerender();
}

// =====================================================================
// 出炉记录
// =====================================================================

function viewFinish() {
  const s = state.session;
  if (!s) { setTimeout(() => go('#/'), 0); return ''; }
  const f = state.finish;
  const changes = diffRecipe(s.original, s.recipe);
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/bake" aria-label="返回">${icon('back')}</a><h1>出炉啦</h1></div>
  <label class="photo-drop">
    ${f.photoUrl ? `<img src="${f.photoUrl}" alt="">` : `${icon('camera')}<span>拍一张 / 选一张照片</span>`}
    <input type="file" accept="image/*" capture="environment" hidden data-act-change="pick-photo">
  </label>

  <h2>${esc(s.recipe.name)} <span class="small muted mono" style="font-weight:400">用时 ${fmtDur(Date.now() - s.startedAt)}</span></h2>
  <div class="rating" role="radiogroup" aria-label="打分">
    ${[1, 2, 3, 4, 5].map((n) => `<button class="${f.rating >= n ? 'on' : ''}" data-act="rate" data-v="${n}" aria-label="${n} 分">${icon('star')}</button>`).join('')}
  </div>

  <label class="f" style="margin-top:16px"><span>这一炉的笔记</span>
    <textarea class="input" data-f="notes" placeholder="组织怎么样？下次想调整什么？">${esc(f.notes)}</textarea></label>

  ${changes.length ? `
  <h2>这次改了配方</h2>
  <ul class="diff">${changes.map((c) => `<li>${esc(c.t)}${c.old != null ? ` <span class="old">${esc(c.old)}</span>` : ''}</li>`).join('')}</ul>
  <div class="choice" style="margin-top:12px">
    <label><input type="radio" name="mode" value="update" ${f.mode === 'update' ? 'checked' : ''} data-act-change="mode"><span>更新原配方<small>以后就按这次的来</small></span></label>
    <label><input type="radio" name="mode" value="new" ${f.mode === 'new' ? 'checked' : ''} data-act-change="mode"><span>另存为新配方<small>原配方不动，多一个「${esc(s.recipe.name)} · 改」</small></span></label>
    <label><input type="radio" name="mode" value="none" ${f.mode === 'none' ? 'checked' : ''} data-act-change="mode"><span>只记在这一次<small>改动保存在这条记录里，配方不变</small></span></label>
  </div>` : ''}

  <button class="btn primary block" style="margin-top:24px" data-act="save-bake">${icon('check')} 放上作品墙</button>`;
}

async function saveFinish() {
  const s = state.session;
  const f = state.finish;
  const before = (await listBakes()).length;
  const changes = diffRecipe(s.original, s.recipe);
  let recipeId = s.recipeId;
  let mode = changes.length ? f.mode : 'none';
  const orig = await getRecipe(s.recipeId);
  if (mode === 'update' && !orig) mode = 'new'; // 原配方已被删
  if (mode === 'update') {
    await saveRecipe({ ...s.recipe, id: orig.id, createdAt: orig.createdAt, version: orig.version });
  } else if (mode === 'new') {
    const copy = clone(s.recipe);
    delete copy.id; delete copy.createdAt; copy.version = 0;
    copy.name = `${s.recipe.name} · 改`;
    recipeId = (await saveRecipe(copy)).id;
  }
  const photoId = f.photo ? await savePhoto(f.photo) : null;
  const bake = {
    id: uid(),
    recipeId,
    recipeName: s.recipe.name,
    shape: s.recipe.shape,
    snapshot: s.recipe,
    scale: s.scale,
    changes,
    changeMode: mode,
    startedAt: s.startedAt,
    finishedAt: Date.now(),
    photoId,
    rating: f.rating,
    notes: f.notes,
  };
  await saveBake(bake);
  for (const t of s.timers) t.done = true;
  stopRinging();
  state.session = null;
  state.finish = { photo: null, photoUrl: '', rating: 0, notes: '', mode: 'update' };
  await persistSession();
  go(`#/log/${bake.id}`);
  setTimeout(() => celebrate(before + 1, bake.shape), 250);
}

async function celebrate(count, shapeName) {
  const a = levelOf(count - 1);
  const b = levelOf(count);
  playChime();
  const up = b.lv > a.lv;
  await dialog(`<div class="celebrate">${up ? shopFront(b.lv, state.shop.name, true) : `<div class="duo">${shape(shapeName)}${mascot('yay')}</div>`}
    <h3>${up ? `小店升级啦！Lv.${b.lv} ${b.name}` : `第 ${count} 炉出炉！`}</h3>
    ${up ? `<p class="small muted" style="margin-top:-4px">${LEVELS[b.lv - 1].desc}</p>` : ''}
    <p class="muted">${b.next ? `再出炉 ${b.next.at - count} 次，就能升级成「${b.next.name}」` : '已经是最高等级的小店了'}</p>
    <button class="btn primary" data-dlg="ok">好耶</button></div>`);
}

// ---------- 作品 ----------

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEK_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };

// 烘焙日历：做过面包的日子画上那款面包
async function viewLogs(ym) {
  const now = new Date();
  let [y, m] = ym ? ym.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  if (!(m >= 1 && m <= 12)) [y, m] = [now.getFullYear(), now.getMonth() + 1];
  const from = new Date(y, m - 1, 1).getTime();
  const to = new Date(y, m, 1).getTime();
  const all = await listBakes();
  const bakes = all.filter((b) => b.finishedAt >= from && b.finishedAt < to);

  const byDay = new Map();
  for (const b of bakes) {
    const d = new Date(b.finishedAt).getDate();
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(b);
  }
  const firstDow = new Date(y, m - 1, 1).getDay();
  const daysIn = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push('<span class="d out"></span>');
  for (let d = 1; d <= daysIn; d++) {
    const list = byDay.get(d);
    const today = y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
    cells.push(list
      ? `<a class="d" href="#/log/${list[0].id}" title="${esc(list.map((b) => b.recipeName).join('、'))}">${shape(list[0].shape)}${list.length > 1 ? `<span class="cnt">${list.length}</span>` : ''}</a>`
      : `<span class="d ${today ? 'today' : ''}">${d}</span>`);
  }

  const prev = m === 1 ? `${y - 1}-12` : `${y}-${m - 1}`;
  const next = m === 12 ? `${y + 1}-1` : `${y}-${m + 1}`;
  const kinds = new Set(bakes.map((b) => b.recipeName)).size;
  const hours = bakes.reduce((a, b) => a + (b.finishedAt - b.startedAt), 0) / 3600000;
  const urls = await Promise.all(bakes.map((b) => photoUrl(b.photoId)));

  return `
  <div class="cal-head">
    <div class="y">${y}</div>
    <div class="m"><button data-go="#/logs/${prev}" aria-label="上个月">${icon('back')}</button>${MONTHS[m - 1]}<button data-go="#/logs/${next}" aria-label="下个月">${icon('next')}</button></div>
  </div>
  <div class="cal">${WEEK.map((w) => `<span class="wd">${w}</span>`).join('')}${cells.join('')}</div>

  <div class="stats cal-stats">
    <div class="stat"><b>${bakes.length}</b><span>loaves baked</span></div>
    <div class="stat"><b>${kinds}</b><span>recipes</span></div>
    <div class="stat"><b>${hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10}</b><span>hours</span></div>
  </div>

  ${bakes.length ? `<div class="diary-list" style="margin-top:30px">${bakes.map((b, i) => `<a class="card ${i % 2 ? 'alt' : ''} diary-row" href="#/log/${b.id}">
      <span class="ph">${urls[i] ? `<img src="${urls[i]}" alt="" loading="lazy">` : shape(b.shape)}</span>
      <span class="t"><span class="date">${ymd(b.finishedAt)} · ${WEEK_ZH[new Date(b.finishedAt).getDay()]}</span><b>${esc(b.recipeName)}</b>
      <span class="small muted">${'★'.repeat(b.rating || 0)}${b.notes ? ` ${esc(b.notes.slice(0, 22))}${b.notes.length > 22 ? '…' : ''}` : ''}</span></span></a>`).join('')}</div>`
    : `<div class="empty" style="margin-top:20px">${mascot('wait')}<p>这个月还没有开炉</p></div>`}

  <div class="diary-foot">Baking Mood</div>`;
}

// 一炉一页的烘焙日记
async function viewLog(id) {
  const b = await getBake(id);
  if (!b) return notFound();
  const url = await photoUrl(b.photoId);
  const recipe = await getRecipe(b.recipeId);
  const d = new Date(b.finishedAt);
  const modeText = { update: '已更新到原配方', new: '已另存为新配方', none: '只记在这一次' }[b.changeMode] || '';
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/logs/${d.getFullYear()}-${d.getMonth() + 1}" aria-label="返回">${icon('back')}</a><h1></h1>
    <label class="btn icon ghost" aria-label="换照片">${icon('camera')}<input type="file" accept="image/*" hidden data-act-change="replace-photo" data-id="${b.id}"></label></div>
  <div class="diary">
    <div class="date">${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div>
    <div class="wday">${WEEK_ZH[d.getDay()]}</div>
    ${shape(b.shape)}
    <div class="name">${esc(b.recipeName)}</div>
    <div class="photo">${url ? `<img src="${url}" alt="">` : `<div class="ph-empty">${shape(b.shape)}</div>`}<span class="hanko">出炉</span></div>
    <div class="meta">${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 出炉 · 用时 ${fmtDur(b.finishedAt - b.startedAt)}${b.scale !== 1 ? ` · ×${b.scale}` : ''}</div>
    <div class="rating" style="justify-content:center;margin-top:8px">${[1, 2, 3, 4, 5].map((n) => `<button class="${b.rating >= n ? 'on' : ''}" data-act="log-rate" data-id="${b.id}" data-v="${n}" aria-label="${n} 分">${icon('star')}</button>`).join('')}</div>
  </div>

  <h2>笔记</h2>
  <textarea class="input" data-l="${b.id}" placeholder="组织怎么样？下次想调整什么？">${esc(b.notes)}</textarea>

  ${b.changes?.length ? `<h2>这次的改动 <span class="badge">${modeText}</span></h2>
    <ul class="diff">${b.changes.map((c) => `<li>${esc(c.t)}${c.old != null ? ` <span class="old">${esc(c.old)}</span>` : ''}</li>`).join('')}</ul>` : ''}

  <details style="margin-top:22px"><summary class="muted">这一炉用的配方</summary>
    <div style="margin-top:8px">${ingTable(b.snapshot.ingredients, b.scale)}
    <ol class="steps" style="margin-top:12px">${b.snapshot.steps.map((st) => `<li>${esc(st.text)}${stepMeta(st)}</li>`).join('')}</ol></div>
  </details>

  <div class="row" style="margin-top:28px">
    ${recipe ? `<a class="btn sm" href="#/r/${recipe.id}">${icon('book')} 去看配方</a>
    <button class="btn sm primary" data-act="start-bake" data-id="${recipe.id}">${icon('oven')} 再做一次</button>` : ''}
    <span style="flex:1"></span>
    <button class="btn icon sm danger" data-act="delete-bake" data-id="${b.id}" aria-label="删除">${icon('trash')}</button>
  </div>
  <div class="diary-foot">Baking Mood</div>`;
}

// =====================================================================
// 设置
// =====================================================================

function viewSettings() {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const permText = { granted: '已开启', denied: '被拒绝了（去系统设置里打开）', default: '还没开', unsupported: '这个浏览器不支持' }[perm];
  const theme = document.documentElement.dataset.theme || 'auto';
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/" aria-label="返回">${icon('back')}</a><h1>店务</h1></div>
  <div class="stack">
    <div class="card"><div class="row"><div class="grow"><b>店名</b><div class="small muted">${esc(state.shop.name)}</div></div>
      <button class="btn sm" data-act="rename-shop">改名</button></div></div>
    <div class="card alt"><div class="row"><div class="grow"><b>计时提醒通知</b><div class="small muted">${permText}</div></div>
      <button class="btn sm" data-act="notify-perm">开启</button><button class="btn sm" data-act="test-sound">${icon('bell')} 试听</button></div>
      <p class="small muted" style="margin:8px 0 0">计时时屏幕会保持常亮。把 app 添加到主屏幕后，切到后台也能收到提醒（iOS 需 16.4 以上）。</p></div>
    <div class="card"><div class="row"><div class="grow"><b>外观</b></div>
      ${[['auto', '跟随系统'], ['light', '白纸'], ['dark', '黑板']].map(([k, l]) => `<button class="chip ${theme === k ? 'on' : ''}" data-act="theme" data-v="${k}">${l}</button>`).join('')}</div></div>
    <div class="card alt"><b>备份</b><p class="small muted" style="margin:2px 0 10px">所有数据只存在这台设备的浏览器里。换手机前记得导出。</p>
      <div class="row"><button class="btn sm" data-act="export-all">${icon('download')} 导出备份</button>
      <label class="btn sm">${icon('upload')} 从备份恢复<input type="file" accept=".json,application/json" hidden data-act-change="import-all"></label></div></div>
  </div>
  <p class="center small muted" style="margin-top:28px">小烘焙铺 · 用简笔画经营你的厨房</p>`;
}

function notFound() {
  return `<div class="topbar"><a class="btn icon ghost" href="#/" aria-label="返回">${icon('back')}</a><h1></h1></div>
    <div class="empty">${emptyShelf()}<p>找不到了，可能已经被删掉</p></div>`;
}

// =====================================================================
// 事件
// =====================================================================

const actions = {
  'roadmap'() { showRoadmap(); },
  async 'rename-shop'() {
    const name = await promptDlg('给小店起个名字', state.shop.name);
    if (name && name.trim()) {
      state.shop.name = name.trim().slice(0, 16);
      await saveShop(state.shop);
      rerender();
    }
  },
  'new-blank'() { state.draft = null; state.draftFor = null; },
  'new-import'() {},
  'start-bake'(el) { startBake(el.dataset.id); },
  async 'delete-recipe'(el) {
    if (await confirmDlg('删除这个配方？', '已经出炉的作品记录会保留。', '删除', true)) {
      await deleteRecipe(el.dataset.id);
      toast('配方已下架');
      go('#/recipes');
    }
  },
  async 'share-recipe'(el) {
    const r = await getRecipe(el.dataset.id);
    const text = recipeToText(r);
    try {
      if (navigator.share) await navigator.share({ title: r.name, text });
      else { await navigator.clipboard.writeText(text); toast('配方文字已复制'); }
    } catch { /* 用户取消分享 */ }
  },

  // 编辑配方
  'cancel-edit'() { state.draft = null; state.draftFor = null; },
  'set-shape'(el) { state.draft.shape = el.dataset.v; rerender(); },
  'add-ing'() { state.draft.ingredients.push({ id: uid(), name: '', amount: null, unit: 'g', note: '' }); rerender(); },
  'del-ing'(el) { state.draft.ingredients = state.draft.ingredients.filter((i) => i.id !== el.dataset.id); rerender(); },
  'add-step'() { state.draft.steps.push({ id: uid(), text: '', minutes: null, kind: 'other' }); rerender(); },
  'del-step'(el) { state.draft.steps = state.draft.steps.filter((s) => s.id !== el.dataset.id); rerender(); },
  'move-step'(el) {
    const st = state.draft.steps;
    const i = st.findIndex((s) => s.id === el.dataset.id);
    const j = i + Number(el.dataset.v);
    if (j < 0 || j >= st.length) return;
    [st[i], st[j]] = [st[j], st[i]];
    rerender();
  },
  async 'save-recipe'() {
    const d = state.draft;
    if (!d.name.trim()) { toast('先给配方起个名字'); return; }
    d.ingredients = d.ingredients.filter((i) => i.name.trim());
    d.steps = d.steps.filter((s) => s.text.trim());
    const saved = await saveRecipe(d);
    state.draft = null; state.draftFor = null;
    toast('配方已上架');
    go(`#/r/${saved.id}`);
  },
  'parse-import'() {
    const text = document.getElementById('import-text').value;
    if (!text.trim()) { toast('先粘贴一段食谱'); return; }
    const p = parseRecipeText(text);
    state.draft = {
      ...p,
      shape: guessShape(p.name),
      yield: '',
      ingredients: p.ingredients.map((i) => ({ ...i, id: uid() })),
      steps: p.steps.map((s) => ({ ...s, id: uid() })),
    };
    state.draftFor = 'new';
    toast(`认出 ${p.ingredients.length} 种材料、${p.steps.length} 个步骤`);
    go('#/edit/new');
  },

  // 烘焙中
  'toggle-ing'(el) {
    const c = state.session.checked;
    const i = c.indexOf(el.dataset.id);
    if (i >= 0) c.splice(i, 1); else c.push(el.dataset.id);
    persistSession(); rerender();
  },
  'focus-step'(el) {
    const s = state.session;
    const i = Number(el.dataset.i);
    const st = s.recipe.steps[i];
    s.doneSteps = s.doneSteps.filter((id) => id !== st.id);
    s.current = i;
    persistSession(); rerender();
  },
  'step-done'(el) {
    const s = state.session;
    s.timers = s.timers.filter((t) => t.stepId !== el.dataset.id); // 这一步完成了，它的计时也一起结束
    completeStep(s, el.dataset.id);
    persistSession(); rerender();
  },
  'timer-start'(el) {
    unlockAudio();
    const s = state.session;
    const st = s.recipe.steps.find((x) => x.id === el.dataset.id);
    if (!isTimed(st)) return;
    s.timers = s.timers.filter((t) => t.stepId !== st.id);
    s.timers.push(createTimer({ label: st.text.slice(0, 20) || '计时', minutes: st.minutes, stepId: st.id }));
    s.current = s.recipe.steps.indexOf(st);
    askNotifyPermission();
    persistSession(); rerender();
  },

  'timer-pause'(el) { pauseTimer(findTimer(el)); persistSession(); rerender(); },
  'timer-resume'(el) { resumeTimer(findTimer(el)); persistSession(); rerender(); },
  'timer-add'(el) { addMinutes(findTimer(el), 5); stopRinging(); persistSession(); rerender(); },
  'timer-stop'(el) {
    state.session.timers = state.session.timers.filter((t) => t.id !== el.dataset.id);
    stopRinging(); persistSession(); rerender();
  },
  'scale'(el) { state.session.scale = Number(el.dataset.v); persistSession(); rerender(); },
  'bake-edit-toggle'() { state.session.editing = !state.session.editing; persistSession(); rerender(); },
  'bake-add-ing'() { state.session.recipe.ingredients.push({ id: uid(), name: '', amount: null, unit: 'g', note: '' }); persistSession(); rerender(); },
  'bake-del-ing'(el) { const r = state.session.recipe; r.ingredients = r.ingredients.filter((i) => i.id !== el.dataset.id); persistSession(); rerender(); },
  'bake-add-step'() { state.session.recipe.steps.push({ id: uid(), text: '', minutes: null, kind: 'other' }); persistSession(); rerender(); },
  'bake-del-step'(el) {
    const s = state.session;
    s.recipe.steps = s.recipe.steps.filter((x) => x.id !== el.dataset.id);
    s.timers = s.timers.filter((t) => t.stepId !== el.dataset.id);
    s.current = Math.min(s.current, s.recipe.steps.length);
    persistSession(); rerender();
  },
  'go-finish'() {
    const s = state.session;
    s.editing = false;
    s.recipe.ingredients = s.recipe.ingredients.filter((i) => i.name.trim());
    s.recipe.steps = s.recipe.steps.filter((x) => x.text.trim());
    persistSession();
    go('#/finish');
  },
  async 'abandon'() {
    if (!(await confirmDlg('放弃这一炉？', '计时和这次的改动都会丢掉。', '放弃', true))) return;
    stopRinging();
    state.session = null;
    await persistSession();
    go('#/');
  },

  // 出炉
  'rate'(el) { state.finish.rating = Number(el.dataset.v); rerender(); },
  'save-bake'(el) { el.disabled = true; saveFinish(); },

  // 作品
  async 'log-rate'(el) {
    const b = await getBake(el.dataset.id);
    b.rating = Number(el.dataset.v);
    await saveBake(b); rerender();
  },
  async 'delete-bake'(el) {
    if (await confirmDlg('撕掉这张照片？', '这条出炉记录会被删除。', '删除', true)) {
      await deleteBake(el.dataset.id);
      go('#/logs');
    }
  },

  // 设置
  async 'notify-perm'() {
    const p = await askNotifyPermission();
    toast(p === 'granted' ? '通知已开启' : '没有拿到通知权限');
    rerender();
  },
  'test-sound'() { playChime(); notify('⏰ 试一下', '时间到的时候会这样提醒你'); },
  'theme'(el) {
    const v = el.dataset.v;
    if (v === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = v;
    try { localStorage.setItem('baker-theme', v); } catch { /* 无痕模式 */ }
    rerender();
  },
  async 'export-all'() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `烘焙铺备份-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};

const changeActions = {
  async 'pick-photo'(el) {
    const file = el.files?.[0];
    if (!file) return;
    const blob = await compressImage(file);
    if (state.finish.photoUrl) URL.revokeObjectURL(state.finish.photoUrl);
    state.finish.photo = blob;
    state.finish.photoUrl = URL.createObjectURL(blob);
    rerender();
  },
  async 'replace-photo'(el) {
    const file = el.files?.[0];
    if (!file) return;
    const b = await getBake(el.dataset.id);
    if (b.photoId) await db.del('photos', b.photoId);
    b.photoId = await savePhoto(await compressImage(file));
    await saveBake(b); rerender();
  },
  'mode'(el) { state.finish.mode = el.value; },
  async 'import-file'(el) {
    const file = el.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (/\.json$/i.test(file.name)) {
      try {
        const data = JSON.parse(text);
        if (data.app === 'baker') { await importAll(data); toast('备份已恢复'); go('#/recipes'); return; }
        if (data.name) { state.draft = { ...blankRecipe(), ...data, id: undefined }; state.draftFor = 'new'; go('#/edit/new'); return; }
      } catch { /* 不是 JSON，当文字处理 */ }
    }
    document.getElementById('import-text').value = text;
  },
  async 'import-all'(el) {
    const file = el.files?.[0];
    if (!file) return;
    try {
      await importAll(JSON.parse(await file.text()));
      state.shop = await getShop();
      toast('备份已恢复');
      go('#/');
    } catch (e) { toast(e.message || '文件读不了'); }
  },
};

// 把一步标成完成，跳到下一个没做的步骤
function completeStep(s, stepId) {
  if (!s.doneSteps.includes(stepId)) s.doneSteps.push(stepId);
  const next = s.recipe.steps.findIndex((st) => !s.doneSteps.includes(st.id));
  s.current = next < 0 ? s.recipe.steps.length : next;
  if (next < 0) toast('全部步骤完成，可以出炉了！');
}

function findTimer(el) {
  return state.session.timers.find((t) => t.id === el.dataset.id);
}

document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-go]');
  if (nav) { location.replace(nav.dataset.go); return; }
  const el = e.target.closest('[data-act]');
  if (!el || !actions[el.dataset.act]) return;
  if (el.tagName === 'BUTTON' || el.tagName === 'LI' || el.dataset.act === 'focus-step') e.preventDefault();
  actions[el.dataset.act](el, e);
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-act-change]');
  if (el) changeActions[el.dataset.actChange]?.(el, e);
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.d != null && state.draft) applyField(state.draft, el.dataset.d, el.value);
  else if (el.dataset.s != null && state.session) {
    const s = state.session;
    let v = el.value;
    if (/\.amount$/.test(el.dataset.s) && v !== '') v = String(Number(v) / s.scale);
    applyField(s.recipe, el.dataset.s, v);
    persistSession(400);
  } else if (el.dataset.f != null) state.finish[el.dataset.f] = el.value;
  else if (el.dataset.actInput === 'filter') {
    state.filter = el.value;
    clearTimeout(filterTimer);
    filterTimer = setTimeout(async () => {
      const pos = el.selectionStart;
      await rerender();
      const box = document.querySelector('[data-act-input="filter"]');
      box?.focus(); box?.setSelectionRange(pos, pos);
    }, 250);
  } else if (el.dataset.l != null) {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(async () => {
      const b = await getBake(el.dataset.l);
      b.notes = el.value;
      await saveBake(b);
    }, 400);
  }
});
let filterTimer = null;
let noteTimer = null;

// 在烘焙页里改了配方并且编辑框失焦时，刷新一下改动提示
document.addEventListener('focusout', (e) => {
  if (e.target.dataset?.s != null && location.hash === '#/bake') {
    persistSession();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { tick(); if (state.session) keepAwake(location.hash === '#/bake'); }
});

// =====================================================================
// 启动
// =====================================================================

async function boot() {
  try {
    const t = localStorage.getItem('baker-theme');
    if (t && t !== 'auto') document.documentElement.dataset.theme = t;
  } catch { /* 无痕模式 */ }

  state.shop = await getShop();
  if (!(await db.getKv('shop'))) await saveShop(state.shop);
  if (!(await db.getKv('seeded'))) {
    for (const r of SAMPLE_RECIPES) await saveRecipe(r);
    await db.setKv('seeded', true);
  }
  state.session = (await getSession()) || null;
  if (state.session) state.session.editing = false;

  window.addEventListener('hashchange', route);
  await route();
  setInterval(tick, 1000);
  tick();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
