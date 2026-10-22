import {
  db, uid, listRecipes, getRecipe, saveRecipe, deleteRecipe, listBakes, getBake, saveBake, deleteBake,
  savePhoto, photoUrl, compressImage, getShop, saveShop, getSessions, saveSessions,
  exportAll, importAll, guessShape, setPrice, randomPrice, getPrice,
} from './store.js';
import { parseRecipeText, formatAmount, formatMinutes, guessStepKind } from './parser.js';
import { rateStar, hanko, houseLogo, shape, icon, storefront, storefrontSign, mysteryShop, ovenScene, stageScene, emptyShelf, mascot, tabIcon, SHAPE_NAMES, SHAPE_NAMES_EN } from './sketch.js';
import {
  remainingMs, formatClock, createTimer, pauseTimer, resumeTimer, addMinutes,
  unlockAudio, playChime, playLevelUp, haptic, startRinging, stopRinging, askNotifyPermission, notify, keepAwake,
  isNative, permissionState, refreshPermission, syncNativeAlarms,
} from './timers.js';
import { currentCatalog, refreshCatalog, mergeCatalog, takeCatalogUpdate, skipCatalogUpdate } from './catalog.js';
import { L, isEn, getLang, setLang, getCurrency, setCurrency, currencySymbol, formatPrice, APP_NAME } from './i18n.js';

const $app = document.getElementById('app');
const $tabs = document.getElementById('tabs');
const $dlg = document.getElementById('dlg');

const state = {
  shop: null,
  sessions: [],       // 正在烤的每一炉，可以同时好几炉
  draft: null,        // 正在编辑 / 导入的配方
  draftFor: null,
  finish: null,       // 出炉页的草稿 { sid, photo, photoUrl, rating, notes, mode }
  filter: '',
  alarmOpen: null,
};

// ---------- 小工具 ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const DAY = 86400000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad2 = (n) => String(n).padStart(2, '0');
const fmtDate = (t) => { const d = new Date(t); return L(`${d.getMonth() + 1}月${d.getDate()}日`, `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`); };
const fmtTime = (t) => { const d = new Date(t); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fmtDur = (ms) => formatMinutes(Math.round(ms / 60000));
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
const shapeNames = () => (isEn() ? SHAPE_NAMES_EN : SHAPE_NAMES);
const times = (n) => L(`${n} 次`, n === 1 ? '1 time' : `${n} times`);

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
// 发酵没写时间的，默认按 1 小时算（计时器也按这个）
const stepMin = (st) => (st ? st.minutes || (st.kind === 'ferment' ? 60 : null) : null);
const isTimed = (st) => !!(st && stepMin(st) && TIMED_KINDS.has(st.kind));
const progressOf = (t) => (t ? (t.done ? 1 : 1 - remainingMs(t) / t.durationMs) : 0);
const growScale = (p) => (0.66 + 0.34 * Math.min(1, Math.max(0, p))).toFixed(3);

const kindLabel = (k) => ({
  ferment: L('发酵', 'Proof'), bake: L('烘烤', 'Bake'), rest: L('静置', 'Rest'), chill: L('冷藏', 'Chill'), knead: L('揉面', 'Knead'),
  shape: L('整形', 'Shape'), cool: L('冷却', 'Cool'), decorate: L('装饰', 'Finish'),
}[k] || '');

// 每一步「在做什么」：发酵 / 烘烤按记下的类型；其他的看字面认（整形、冷却、装饰、揉面），
// 实在认不出来：第一次发酵之前算揉面，之后算整形。步骤标签的颜色和烘焙页的小动画都按它来
function stepKind(st, i, steps) {
  if (!st) return 'other';
  if (st.kind === 'ferment' || st.kind === 'bake') return st.kind;
  const t = String(st.text || '').toLowerCase();
  if (/切开|切口|割包|score|slice open/.test(t)) return 'shape';
  if (/冷却|放凉|晾凉|晾网|cool/.test(t)) return 'cool';
  if (/甘纳许|裱花|挤入|挤上|抹平|抹匀|装饰|淋面|刷.{0,4}蛋液|蛋液|撒上|粘满|粘上|筛糖粉|ganache|pipe|piping|glaze|frost|brush|egg wash|sprinkle|dust/.test(t)) return 'decorate';
  if (/整形|分割|滚圆|收圆|擀|卷起|包入|包馅|切开|搓|编|割包|shape|divide|round|roll|score|fill/.test(t)) return 'shape';
  if (/揉|搅拌|混合|厨师机|打面|knead|mix/.test(t)) return 'knead';
  if (st.kind === 'rest' || st.kind === 'chill') return st.kind;
  const firstFerment = steps.findIndex((x) => x.kind === 'ferment');
  return firstFerment >= 0 && i > firstFerment ? 'shape' : 'knead';
}
const kindTag = (k) => (kindLabel(k) ? `<span class="kind k-${k}">${kindLabel(k)}</span>` : '');

// 步骤文字：只把数字（时间、温度、份数、用量）加粗
const NUM_RE = /(\d+(?:\.\d+)?(?:\s*[-~～]\s*\d+(?:\.\d+)?)?\s*(?:°\s*[CF]|℃|℉|度|%|％|分钟|分|小时|秒|倍|份|个|克|g|kg|ml|min|h(?![a-z])|s(?![a-z]))?)/gi;
const stepHtml = (text) => esc(text).replace(NUM_RE, '<b class="num">$1</b>');

// 店铺等级：私房烘焙的成长路线，出炉次数越多，小店越像样
const LEVELS = [
  { at: 0, name: ['周末小推车', 'Weekend Cart'], desc: ['在家开烤，推着小车分给邻居尝尝', 'Baking at home and wheeling a cart round to the neighbors'] },
  { at: 1, name: ['私房小铺', 'Tiny Window Shop'], desc: ['有了一间小小的铺子，开了一扇售卖窗', 'A tiny shop of your own, with one little sales window'] },
  { at: 5, name: ['熟客小店', "Regulars' Corner"], desc: ['熟客常来，门口摆了红毡长凳和红伞，坐下来就能吃个面包', 'Regulars drop by; a red bench and parasol out front for a quick bite'] },
  { at: 12, name: ['街角面包店', 'Corner Bakery'], desc: ['搬到街角，门面变宽，多了一扇大橱窗，门口停着送面包的自行车', 'On the corner now: a wider front, a big display window and a delivery bike'] },
  { at: 25, name: ['排队小店', 'Line Out the Door'], desc: ['换成复古小店：红白条纹布篷、拱形橱窗，门口开始排队', 'A retro shop with a striped awning and arched windows, and a line outside'] },
  { at: 45, name: ['两层小楼', 'Two-Story Bakery'], desc: ['加盖了带拱窗的二楼，屋顶立起一个大碱水面包', 'A second floor with arched windows and a giant pretzel on the roof'] },
  { at: 70, name: ['露台面包店', 'Terrace Bakery'], desc: ['盖了两层的新店，楼下落地窗，旁边开了露台', 'A new two-story shop with a glass front and a terrace next door'] },
  { at: 100, name: ['旗舰面包店', 'Flagship Bakery'], desc: ['三层的旗舰店，屋顶也开了空中露台，成了街区的地标', 'Three floors and a rooftop terrace: a neighborhood landmark'] },
];
// 隐藏款：不占等级，满足条件就解锁，可以在升级路线里换上当店面（id 就是 sketch.js 里 HIDDEN 的编号）
// 镰仓 = 小店到 Lv.4、京都 = Lv.6、百年老铺 = Lv.8，巴黎甜品沙龙是累计出炉 200 次的纪念礼物
const SECRETS = [
  { id: 10, lv: 4, name: ['镰仓海边面包店', 'Kamakura Seaside'], desc: ['海边的白色木板小屋：鱼鳞瓦屋顶、蓝白条纹雨棚，门口一丛丛紫阳花，石墙后面开过江之电，远处是灯塔、江之岛和消波块', 'A white clapboard house by the sea: fish-scale roof, blue-and-white awning, hydrangeas by the door, the Enoden tram behind the wall, a lighthouse, Enoshima and tetrapods beyond'] },
  { id: 11, lv: 6, name: ['京都二年坂面包店', 'Kyoto Slope Bakery'], desc: ['二年坂半坡上的茶屋式面包店：土黄墙、竹帘、木格子，门口红毡长凳和大红伞，石板坡道往上走就是八坂塔，墙边一棵红枫', 'A teahouse-style bakery halfway up Ninenzaka: ochre walls, bamboo blinds, a red bench and parasol, stone steps up to the Yasaka pagoda and a maple by the wall'] },
  { id: 9, lv: 8, name: ['百年老铺', 'Century Bakery'], desc: ['三层的欧洲老面包店：墨绿色木门面、条纹布篷、铸铁挂牌，橱窗里摆满面包和甜点，屋顶立着碱水面包徽章', 'A three-story old-world bakery: forest-green woodwork, a striped awning, windows full of bread and cakes and a pretzel crest on the roof'] },
  { id: 12, bakes: 200, name: ['巴黎甜品沙龙', 'Paris Pâtisserie'], desc: ['奥斯曼风格的大楼：孟莎屋顶和石栏杆、圆形老虎窗、通长铸铁阳台，一楼三个拱门的甜品橱窗，远处一座埃菲尔铁塔', 'A Haussmann building: mansard roof with a stone balustrade, round dormers, a long iron balcony, three arched pastry windows and the Eiffel Tower in the distance'] },
];
const secretOf = (id) => SECRETS.find((x) => x.id === id);
const secretOpen = (x, n) => (x.lv ? levelOf(n).lv >= x.lv : n >= x.bakes);
const secretHow = (x) => (x.lv ? L(`小店到 Lv.${x.lv} 解锁`, `Unlocks at Lv.${x.lv}`) : L(`累计出炉 ${x.bakes} 次的纪念礼物`, `A gift for your ${x.bakes}th bake`));
// 店面的名字：普通等级用等级名，隐藏款用自己的名字
const lookName = (id) => (secretOf(id) ? L(...secretOf(id).name) : lvName(id - 1));
const lookDesc = (id) => (secretOf(id) ? L(...secretOf(id).desc) : lvDesc(id - 1));
const lvName = (i) => L(...LEVELS[i].name);
const lvDesc = (i) => L(...LEVELS[i].desc);
function levelOf(n) {
  let i = 0;
  while (i + 1 < LEVELS.length && n >= LEVELS[i + 1].at) i++;
  const next = LEVELS[i + 1];
  return { lv: i + 1, name: lvName(i), next: next ? { at: next.at, name: lvName(i + 1) } : null, progress: next ? (n - LEVELS[i].at) / (next.at - LEVELS[i].at) : 1 };
}

// 首页和小组件上画哪个店面：在升级路线里自己选过（state.shop.look，必须已解锁：不高于现在等级的店，或者已解锁的隐藏款）就用选的，不然跟着等级走
const lookOf = (lv, n) => {
  const k = state.shop.look;
  if (k >= 1 && k <= lv && !secretOf(k)) return k;
  if (secretOf(k) && secretOpen(secretOf(k), n)) return k;
  return lv;
};

// 店名在招牌字体里有多宽（以字号为 1 计）：用画布量真字体；字体还没加载好就先用备用字体量，加载好以后重画一遍
const signCanvas = document.createElement('canvas').getContext('2d');
let signFontReady = document.fonts?.check?.('16px AppFont') ?? true;
// 字体到了以后只把页面上招牌的字号重新量一遍，不整页重画（整页重画会让图片、文字闪一下）
if (!signFontReady) document.fonts.load('16px AppFont').then(() => {
  signFontReady = true;
  document.querySelectorAll('.storefront[data-lv] > .sign').forEach((el) => { el.style.cssText = signStyle(Number(el.parentElement.dataset.lv), el.textContent); });
}).catch(() => {});
const measure = (t) => { signCanvas.font = `100px ${getComputedStyle(document.documentElement).getPropertyValue('--title') || 'sans-serif'}`; return signCanvas.measureText(t); };
const textEm = (t) => measure(t).width / 100;
// 字身要往下挪多少（以字号为 1 计）才在招牌上看着正好居中：量出字形实际占的上下范围，和一行的正中间比。
// 中文看整个方块字；英文看大写字母从顶到基线这一段（小写的 y、g 往下拖的尾巴不算）
const inkShift = (cjk) => {
  const m = measure(cjk ? '面' : 'H');
  const base = (100 - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
  return (50 - (base + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2)) / 100;
};

// 门店插画 + 叠在招牌上的店名
// 字号按招牌在画里的大小算（cqw = 店面宽度的百分之一，大图小图都对）：字宽加字距最多占招牌宽的六成多，字高不超过招牌高的六成，四周留白，不显得挤。
// 中文字距宽一点，英文窄一点；上下按字形实际的位置对正（inkShift）
function signStyle(level, name) {
  const g = storefrontSign(level);
  const n = [...name].length || 1;
  const cjk = /[\u2e80-\uffff]/.test(name);
  const ls = cjk ? 0.12 : 0.05;
  // 隐藏款的招牌又细又扁：中文可以撑满一点；英文 y、g 的尾巴会往下拖，要留出位置
  const fs = Math.min(g.h * (g.fit ? (cjk ? 0.7 : 0.56) : 0.6), (g.w * 0.64) / (textEm(name || '店') + ls * n));
  const cq = (v) => `${(v / g.vbW * 100).toFixed(2)}cqw`;
  const shift = inkShift(cjk); // 招牌是弹性居中的：上面垫 2 倍，字就往下走 1 倍
  const style = `left:${(g.x / g.vbW * 100).toFixed(2)}%;width:${(g.w / g.vbW * 100).toFixed(2)}%;top:${(g.y / g.vbH * 100).toFixed(2)}%;height:${(g.h / g.vbH * 100).toFixed(2)}%`
    + `;font-size:${cq(fs)};letter-spacing:${ls}em;line-height:1;padding-left:${ls}em`
    + (shift > 0 ? `;padding-top:${cq(fs * shift * 2)}` : `;padding-bottom:${cq(-fs * shift * 2)}`);
  return style;
}
function shopFront(level, name = '', small = false) {
  const style = signStyle(level, name);
  return `<div class="storefront ${small ? 'mini' : ''}" data-lv="${level}">${storefront(level)}${name ? (small
    ? `<span class="sign" style="${style}">${esc(name)}</span>`
    : `<button class="sign" style="${style}" data-act="rename-shop" title="${L('点一下改店名', 'Tap to rename')}">${esc(name)}</button>`) : ''}</div>`;
}

// 升级路线：每一级的店面、需要的出炉次数，标出现在在哪
// 从某一级的大图点「升级路线」回来时，列表停在点进去之前滚到的地方
async function showRoadmap(scrollTop = 0) {
  const n = (await listBakes()).length;
  const cur = levelOf(n);
  await dialog(`<div class="roadmap">
    <h3>${L('升级路线', 'Road to the flagship')}</h3>
    <p class="small muted">${L(`每出炉一次就离下一级近一点。现在累计出炉 <b class="need">${n}</b> 次。`, `Every bake gets you closer. Baked so far: <b class="need">${n}</b>.`)} ${L('点已解锁的店面可以看大图。', 'Tap an unlocked shop to see it big.')}</p>
    <ol>${LEVELS.map((lvl, i) => {
      const st = i + 1 < cur.lv ? 'past' : i + 1 === cur.lv ? 'now' : 'next';
      return `<li class="${st}" ${st !== 'next' ? `data-act="level-view" data-lv="${i + 1}" role="button"` : ''}>${shopFront(i + 1, '', true)}
        <div class="t"><b>Lv.${i + 1} ${lvName(i)}</b>
          <span class="small muted">${lvDesc(i)}</span>
          <span class="small ${st === 'now' ? 'here' : 'muted'}">${st === 'now' ? L('你在这里', 'You are here') : st === 'past' ? L('已达成', 'Done')
            : L(`出炉 <b class="need">${lvl.at}</b> 次解锁`, `Unlocks at <b class="need">${lvl.at}</b> bakes`)}</span></div></li>`;
    }).join('')}
    <li class="secret-head">${L('— 隐藏款 —', '— Secret shops —')}</li>
    ${SECRETS.map((x) => {
      const open = secretOpen(x, n); // 还没解锁：盖着布的店 + 问号
      const using = open && lookOf(cur.lv, n) === x.id;
      return `<li class="${open ? 'past' : 'next secret'} ${using ? 'now' : ''}" ${open ? `data-act="level-view" data-lv="${x.id}" role="button"` : ''}>${open ? shopFront(x.id, '', true) : `<div class="storefront mini">${mysteryShop()}</div>`}
        <div class="t"><b>${open ? L(...x.name) : '???'}</b>
          <span class="small muted">${open ? L(...x.desc) : L('解锁之后才知道是什么', 'Unlock it to find out what it is')}</span>
          <span class="small ${using ? 'here' : 'muted'}">${using ? L('正在用这家店面', 'In use') : open ? L('已解锁，点开可以换上', 'Unlocked: tap to use it') : secretHow(x)}</span></div></li>`;
    }).join('')}</ol>
    <div class="row" style="justify-content:center"><button class="btn primary" data-dlg="ok">${L('知道啦', 'Got it')}</button></div>
  </div>`, { onOpen: (d) => { d.querySelector('.roadmap ol').scrollTop = scrollTop; flattenShops(d.querySelector('.roadmap ol')); } });
}

// 升级路线里的小店面都套着手绘抖动滤镜，WebKit 滚动时现画来不及，快速滑会闪白：
// 打开以后挨个画成图片换上去（画过的按等级和深浅色记住，下次打开直接用），滚动时只是挪图片
const shopPngCache = new Map();
async function flattenShops(list) {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  for (const box of list.querySelectorAll('li .storefront')) {
    const svg = box.querySelector(':scope > svg');
    if (!svg || !list.isConnected) continue;
    const key = `${box.dataset.lv || 'mystery'}|${dark}`;
    const [, , vw, vh] = (svg.getAttribute('viewBox') || '0 0 1 1').split(/[\s,]+/).map(Number);
    const w = box.clientWidth || 104;
    const h = Math.round(w * vh / vw);
    if (!shopPngCache.has(key)) shopPngCache.set(key, svgToPng(svg.outerHTML, w, h).catch(() => null));
    const png = await shopPngCache.get(key);
    if (!png || !svg.isConnected) continue;
    const img = new Image(w, h);
    img.alt = '';
    img.src = `data:image/png;base64,${png}`;
    img.style.cssText = 'display:block;width:100%;height:auto';
    await img.decode().catch(() => {});
    svg.replaceWith(img);
  }
}

// ---------- 弹窗 ----------

function dialog(html, { onOpen } = {}) {
  return new Promise((resolve) => {
    $dlg.innerHTML = html;
    const done = (v) => { $dlg.close(); nativeBarSig = ''; syncNativeBar(); resolve(v); };
    $dlg.onclick = (e) => {
      const b = e.target.closest('[data-dlg]');
      if (b) {
        const input = $dlg.querySelector('[data-dlg-input]');
        done(b.dataset.dlg === 'ok' && input ? input.value : b.dataset.dlg);
      } else if (e.target === $dlg) done(null);
    };
    $dlg.oncancel = (e) => { e.preventDefault(); done(null); };
    $dlg.showModal();
    // 原生导航栏浮在网页上面，弹窗高的时候（比如升级路线）会被右上角的按钮盖住：弹窗开着时先把导航栏按钮收起来
    if (nativeTabs) { nativeBarSig = 'dialog'; nativeTabs.bar({ items: [] }).catch(() => {}); }
    onOpen?.($dlg);
    // 系统会自动把焦点给第一个能点的东西：日期、时间框会因此直接弹出系统的选择器（看着像两个弹窗），按钮会多一圈蓝框。只有要打字的框才给焦点
    const typing = $dlg.querySelector('[data-dlg-input]');
    if (typing) typing.focus(); else document.activeElement?.blur?.();
  });
}

const confirmDlg = (title, body = '', ok = L('确定', 'OK'), danger = false) => dialog(`
  <h3>${esc(title)}</h3>${body ? `<p class="muted">${esc(body)}</p>` : ''}
  <div class="row end"><button class="btn ghost" data-dlg="cancel">${L('算了', 'Cancel')}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-dlg="ok">${esc(ok)}</button></div>
`).then((v) => v === 'ok');

const promptDlg = (title, value = '', type = 'text') => dialog(`
  <h3>${esc(title)}</h3>
  <input class="input" data-dlg-input type="${type}" ${type === 'number' ? 'inputmode="decimal" step="any"' : ''} value="${esc(value)}">
  <div class="row end" style="margin-top:16px"><button class="btn ghost" data-dlg="cancel">${L('算了', 'Cancel')}</button><button class="btn primary" data-dlg="ok">${L('好', 'OK')}</button></div>
`).then((v) => (v === 'cancel' ? null : v));

// ---------- 正在烤的几炉 ----------

const sessionById = (id) => state.sessions.find((s) => s.id === id);
// 烘焙页 / 出炉页地址里带着是哪一炉
const routeSid = () => location.hash.match(/^#\/(?:bake|finish)\/([\w-]+)/)?.[1];
const routeSession = () => sessionById(routeSid());
const allTimers = () => state.sessions.flatMap((s) => s.timers);
const sessionOfTimer = (tid) => state.sessions.find((s) => s.timers.some((t) => t.id === tid));

let saveTimer = null;
function persistSessions(debounce = 0) {
  clearTimeout(saveTimer);
  const run = () => { syncNativeAlarms(nativeAlarms()); return saveSessions(state.sessions); };
  if (!debounce) return run();
  saveTimer = setTimeout(run, debounce);
  return Promise.resolve();
}

// 原生 app 里：每个在走的计时器对应一条系统闹钟
function nativeAlarms() {
  return state.sessions.flatMap((s) => s.timers.filter((t) => !t.done && t.pausedRemaining == null).map((t) => ({
    id: t.id, at: t.endsAt, title: `⏰ ${t.label}`,
    body: L(`「${s.recipe.name}」这一步的时间到啦`, `${s.recipe.name}: time’s up for this step`),
  })));
}

// ---------- 路由 ----------

const ROUTES = [
  [/^#?\/?$/, viewShop, 'shop'],
  [/^#\/recipes$/, viewRecipes, 'recipes'],
  [/^#\/r\/([\w-]+)$/, viewRecipe, 'recipes'],
  [/^#\/edit\/([\w-]+)$/, viewEdit, 'recipes'],
  [/^#\/import$/, viewImport, 'recipes'],
  [/^#\/bake(?:\/([\w-]+))?$/, viewBake, 'shop'],
  [/^#\/finish\/([\w-]+)$/, viewFinish, 'shop'],
  [/^#\/backfill(?:\/(\d{4}-\d{2}-\d{2}))?$/, viewBackfill, 'logs'],
  [/^#\/logs(?:\/(\d{4}-\d{1,2}))?$/, viewLogs, 'logs'],
  [/^#\/log\/([\w-]+)$/, viewLog, 'logs'],
  [/^#\/settings$/, viewSettings, 'shop'],
  [/^#\/wall$/, viewWall, 'shop'],
  [/^#\/wall\/([\w-]+)$/, viewWall, 'recipes'],
];

// 宽屏（折叠屏展开、iPad）：店铺、配方、日历、烘焙铺开成两栏（页面里有 .split / .md 就算宽版）；表单类的页面保持一栏、居中
const wideMQ = matchMedia('(min-width: 720px)');
const isWide = (html) => /class="(split|md|shelf-wide|wall-page)\b/.test(html);
// 折叠屏打开 / 合上：配方页的结构跟着变（宽屏是左边配方架、右边详情），原地重画；整页轻轻淡入，不是一下子跳过去
wideMQ.addEventListener('change', async () => {
  const v = resolve(location.hash || '#/')?.view;
  if (v === viewRecipes || v === viewRecipe) await rerender();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) $app.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
});

// 换页面内容；宽屏配方页左边那栏自己能滚，换内容时记住它滚到哪了
function swapApp(html) {
  const listY = $app.querySelector('.md-list')?.scrollTop;
  $app.innerHTML = html;
  $app.classList.toggle('wide', isWide(html));
  const list = listY && $app.querySelector('.md-list');
  if (list) list.scrollTop = listY;
  syncNativeBar();
}

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
  // 离开某一炉的烘焙页，就退出它的修改模式
  const sid = routeSid();
  let changed = false;
  for (const s of state.sessions) if (s.editing && !(hash.startsWith('#/bake/') && s.id === sid)) { s.editing = false; changed = true; }
  if (changed) persistSessions();
  const html = await r.view(...r.args);
  if (token !== routeToken) return; // 期间又跳转了
  if (html == null) return;          // 视图自己跳走了
  swapApp(html);
  renderTabs(r.tab);
  renderTabClock();
  syncFocus();
  keepAwake(hash.startsWith('#/bake/'));
  window.scrollTo(0, 0);
  scheduleWidgetSync();
}

// 原地刷新当前页（保持滚动位置）
async function rerender() {
  const r = resolve(location.hash || '#/');
  if (!r) return;
  const y = window.scrollY;
  const token = routeToken;
  const html = await r.view(...r.args);
  if (token !== routeToken || html == null) return;
  swapApp(html);
  renderTabClock();
  syncFocus();
  window.scrollTo(0, y);
  scheduleWidgetSync();
}

const TABS = () => [['shop', '#/', L('店铺', 'Shop'), 'shop'], ['recipes', '#/recipes', L('配方架', 'Recipes'), 'rack'], ['logs', '#/logs', L('日历', 'Diary'), 'calendar']];

// 只在第一次画出整排按钮；之后切换只改选中状态，这样镜片能平滑地滑过去（换语言时重画）
function renderTabs(active) {
  if (!$tabs.querySelector('.lens') || $tabs.dataset.lang !== getLang()) {
    $tabs.dataset.lang = getLang();
    $tabs.innerHTML = '<span class="lens" aria-hidden="true"></span>' + TABS().map(([k, href, label]) =>
      `<a href="${href}" data-tab="${k}"><i class="tab-ic"></i><span>${label}</span></a>`).join('');
  }
  TABS().forEach(([k, , , ic], i) => {
    const a = $tabs.querySelector(`[data-tab="${k}"]`);
    const on = k === active;
    if (a.classList.contains('on') === on && a.dataset.drawn) return;
    a.classList.toggle('on', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    a.querySelector('.tab-ic').innerHTML = tabIcon(ic, on);
    a.dataset.drawn = '1';
    if (on) $tabs.style.setProperty('--i', i);
  });
  syncNativeTabs(active);
}

// iOS App 里用系统原生菜单栏（见 ios/App/App/Plugins/NativeTabs.swift）：位置、玻璃效果、iPhone Duo 上竖着排在状态栏旁边，都交给系统。
// 网页这边只负责把标题、手绘图标、当前在哪个标签告诉它；用户点了哪个标签，它告诉网页去哪页。
// 浏览器里没有这个插件，照旧用网页画的底部胶囊
const nativeTabs = isNative() ? window.Capacitor.Plugins.NativeTabs : null;
let nativeActive = null;
let nativeTitles = '';
let nativeIconTheme = '';
if (nativeTabs) {
  document.documentElement.classList.add('native-tabs');
  nativeTabs.addListener('select', ({ key }) => {
    const tab = TABS().find(([k]) => k === key);
    if (tab) go(tab[1]);
  });
}
// 顶部导航栏也交给系统：返回键、顶栏上带 data-tool 的按钮（值是 SF Symbols 图标名）搬到原生导航栏上，
// 网页里的这些按钮藏起来；点原生按钮 = 点网页里原来那个按钮，行为完全一样。
// 页面标题不搬：还是网页里原来的手绘大字，原生按钮和它在同一行。
// 带同一个 data-tool-menu 的几个按钮合成一个原生按钮，点开是菜单（比如配方架的「导入 / 手写」）
let nativeTools = [];
let nativeBack = null;
let nativeBarSig = '';
if (nativeTabs) {
  nativeTabs.addListener('tap', ({ id }) => {
    if (id === 'back') nativeBack?.click();
    else nativeTools[Number(id)]?.click();
  });
}
// 导航栏按钮也用店里的手绘图标：data-tool 的 SF Symbols 名 → 手绘图标；系统只取形状，颜色跟着导航栏走
const BAR_ICONS = { gearshape: 'gear', 'square.and.arrow.up': 'share', pencil: 'pencil', checkmark: 'check', plus: 'plus' };
const barIconCache = new Map();
function barIcon(name) {
  // 齿轮在网页里是蜡笔涂满的一块，交给系统只剩个剪影；导航栏上改画它的手绘轮廓线，和别的线条图标一样
  const svg = name === 'gear'
    ? icon('gear').replace(/<g class="crayon"[^>]*>/, '<g>').replace('class="f-soft"', 'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"')
    : icon(name);
  // 网页里的线条很细（适合大插画），导航栏上的小图标加粗一点，和系统按钮的分量差不多
  const bold = svg.replace('stroke-width="2.2"', 'stroke-width="4.4"').replace('stroke-width="3.2"', 'stroke-width="4.4"');
  if (!barIconCache.has(name)) barIconCache.set(name, svgToPng(bold.replace('<svg', '<svg style="color:#000"'), 24, 24).catch(() => undefined));
  return barIconCache.get(name);
}

async function syncNativeBar() {
  if (!nativeTabs || $dlg.open) return;
  const heads = [...$app.querySelectorAll('.topbar, .greet, .bake-head')];
  nativeBack = $app.querySelector('.topbar > a.btn.icon:first-child, .bake-head > a.btn.icon:first-child');
  nativeTools = heads.flatMap((h) => [...h.querySelectorAll('[data-tool], [data-tool-menu]')]);
  const label = (el) => el.getAttribute('aria-label') || el.textContent.trim();
  const items = [];
  const menus = {};
  nativeTools.forEach((el, i) => {
    const m = el.dataset.toolMenu;
    if (!m) { items.push({ id: String(i), symbol: el.dataset.tool, title: label(el), prominent: el.hasAttribute('data-tool-prominent') }); return; }
    if (!menus[m]) items.push(menus[m] = { id: `menu-${m}`, symbol: m, title: el.dataset.toolTitle || label(el), prominent: false, menu: [] });
    menus[m].menu.push({ id: String(i), title: label(el) });
  });
  const bar = {
    back: nativeBack ? label(nativeBack) : undefined,
    items,
  };
  const sig = JSON.stringify(bar);
  if (sig === nativeBarSig) return;
  nativeBarSig = sig;
  for (const it of items) if (BAR_ICONS[it.symbol]) it.icon = await barIcon(BAR_ICONS[it.symbol]);
  if (bar.back) bar.backIcon = await barIcon('back');
  if (sig !== nativeBarSig) return; // 画图标的工夫页面又变了，以新的为准
  nativeTabs.bar(bar).catch((e) => console.warn('native bar', e));
}

// Duo 立起来当小闹钟时，正在烤的话整屏只放「现在这一步」（html.focus）：自动切到那一炉的烘焙页，
// 收起菜单栏、导航栏；放下 / 合上 / 打开以后回到原来的页面
let standBack = null;
function standSwitch(on) {
  const onBake = location.hash.startsWith('#/bake/');
  if (on && state.sessions.length && !onBake) {
    // 好几炉同时在做：挑计时最快到点的那一炉
    const left = (x) => Math.min(Infinity, ...x.timers.filter((t) => !t.done).map(remainingMs));
    const pick = [...state.sessions].sort((a, b) => left(a) - left(b))[0];
    standBack = location.hash || '#/';
    go(`#/bake/${pick.id}`);
    return; // 换页以后 route() 会调 syncFocus
  }
  if (!on && standBack != null) {
    const back = standBack;
    standBack = null;
    if (onBake) { go(back); return; }
  }
  syncFocus();
}
function syncFocus() {
  const root = document.documentElement;
  const on = root.classList.contains('stand') && !!$app.querySelector('.split.bake');
  if (on === root.classList.contains('focus')) return;
  root.classList.toggle('focus', on);
  nativeTabs?.focus({ on }).catch(() => {});
}

// 折叠屏半折、折痕横在屏幕中间（手机横过来立着，像个小笔记本）：html.laptop，--fold-top / --fold-bottom 是折痕上下沿。
// 烘焙页在这个姿势下分成两截：上半截固定显示正在进行的这一步，下半截滚动看其余内容（见 CSS）
// 测试用的假姿势：stand 立起来 / laptop 半折平放 / closed 合上 / open 打开 / real 回到真实的铰链（真的动一下铰链也会回到真实的）
let fakePosture = false;
function testPosture(kind) {
  const fakes = {
    stand: { status: 'partial', angle: 45 },
    laptop: { status: 'partial', angle: 110, fold: { x: 0, y: Math.round(innerHeight / 2) - 10, w: innerWidth, h: 20 } },
    closed: { status: 'closed', angle: 0 },
    open: { status: 'open', angle: 180 },
  };
  fakePosture = kind !== 'real';
  if (fakePosture) applyPosture(fakes[kind] || fakes.open, true);
  else nativeTabs?.posture().then((p) => applyPosture(p)).catch(() => {});
  toast(`posture: ${kind}`);
}

function applyPosture(p, fake = false) {
  // 真的动了铰链：假姿势作废，按真实的来
  if (!fake) fakePosture = false;
  const f = p?.fold;
  // 立起来（像个小闹钟）：只打开一点点角度，或者半开着但用的是外屏（外屏上没有折痕）
  const stand = p?.status === 'partial' && (!f || (p.angle > 0 && p.angle <= 75));
  const laptop = !stand && p?.status === 'partial' && f && f.w > f.h;
  const root = document.documentElement;
  root.classList.toggle('laptop', !!laptop);
  const wasStand = root.classList.contains('stand');
  root.classList.toggle('stand', stand);
  if (stand !== wasStand) standSwitch(stand);
  // 合上用外屏：首页第一屏正好到三个数字为止（html.folded，见 CSS）
  root.classList.toggle('folded', p?.status === 'closed');
  if (laptop) {
    root.style.setProperty('--fold-top', `${f.y}px`);
    root.style.setProperty('--fold-bottom', `${f.y + f.h}px`);
  }
}
// 调试版 App 的假数据开关（-seed 50 / -unseed，见 js/dev-seed.js）；正式版这里永远拿到 0，不会加载那个文件
if (nativeTabs?.devSeed) {
  nativeTabs.devSeed().then(async ({ n, bakes, clear }) => {
    if (!n && !clear) return;
    const dev = await import('./dev-seed.js');
    await (clear ? dev.unseed() : dev.seed(n, bakes ?? n));
    rerender();
  }).catch(() => {});
}
if (nativeTabs) {
  nativeTabs.addListener('posture', applyPosture);
  nativeTabs.posture().then(applyPosture).catch(() => {});
}

async function syncNativeTabs(active = nativeActive) {
  if (!nativeTabs) return;
  nativeActive = active;
  const titles = Object.fromEntries(TABS().map(([k, , label]) => [k, label]));
  const t = tabClockText();
  if (t) titles.shop = t;
  // 图标跟着深浅色走：换主题时重新画一套
  const root = document.documentElement;
  const theme = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const payload = { active, titles };
  if (theme !== nativeIconTheme) {
    const css = getComputedStyle(root);
    const icon = (ic, on) => svgToPng(tabIcon(ic, on).replace('<svg', `<svg style="color:${css.getPropertyValue(on ? '--doodle' : '--ink-soft').trim()}"`), 28, 28);
    payload.icons = {};
    for (const [k, , , ic] of TABS()) payload.icons[k] = { off: await icon(ic, false), on: await icon(ic, true) };
    nativeIconTheme = theme;
  }
  const sig = JSON.stringify([active, titles]);
  if (!payload.icons && sig === nativeTitles) return;
  nativeTitles = sig;
  nativeTabs.set(payload).catch((e) => console.warn('native tabs', e));
}

// 菜单栏一直保持原来的大小：滚动时缩小 / 展开的动画在手机上会卡，去掉了

// =====================================================================
// 店铺首页
// =====================================================================

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return L('夜深了', 'Up late?');
  if (h < 11) return L('早上好', 'Good morning');
  if (h < 14) return L('中午好', 'Good noon');
  if (h < 18) return L('下午好', 'Good afternoon');
  return L('晚上好', 'Good evening');
}

const isToday = (t) => new Date(t).toDateString() === new Date().toDateString();

// 首页的一台烤箱：一炉一张卡片
function ovenCard(s) {
  const cur = s.recipe.steps[s.current];
  const running = s.timers.filter((t) => !t.done);
  // 有计时在跑时，小插画跟着计时的那一步走（比如边发酵边做别的，就画发酵）
  const curT = running[0] || (cur && s.timers.find((t) => t.stepId === cur.id));
  const sceneStep = (curT && s.recipe.steps.find((st) => st.id === curT.stepId)) || cur;
  const n = s.recipe.steps.length;
  return `<a class="card oven-card" href="#/bake/${s.id}" ${curT ? `data-grow="${curT.id}"` : ''}>
    ${cur ? stageScene(stepKind(sceneStep, s.recipe.steps.indexOf(sceneStep), s.recipe.steps), running.length > 0, '', progressOf(curT)) : ovenScene('', false, true)}
    <div class="info"><b>${esc(s.recipe.name)}</b>
      <span class="small muted step-line">${cur ? `${L(`第 ${s.current + 1}/${n} 步`, `Step ${s.current + 1}/${n}`)} · ${esc(cur.text)}` : L('可以出炉啦', 'Ready to come out')}</span>
      ${running.length ? `<div class="small clock-line">${icon('timer')}<span class="mono" data-clock="${running[0].id}">${formatClock(remainingMs(running[0]))}</span><span class="lbl">${esc(running[0].label)}</span></div>` : ''}
    </div>${icon('next')}</a>`;
}

async function viewShop() {
  const [recipes, bakes] = await Promise.all([listRecipes(), listBakes()]);
  const shop = state.shop;
  const lv = levelOf(bakes.length);
  // 营业天数从开店那天或者最早的一炉（补记的老记录可能比装 App 还早）算起
  const opened = bakes.reduce((m, b) => Math.min(m, b.finishedAt || m), shop.openedAt);
  const days = Math.floor((Date.now() - opened) / DAY) + 1;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = bakes.filter((b) => b.finishedAt >= monthStart.getTime()).length;
  const today = bakes.filter((b) => isToday(b.finishedAt)).length;
  const bakeCount = (id) => bakes.filter((b) => b.recipeId === id).length;
  const ss = state.sessions;

  // 几炉一起烤：一台烤箱一张卡，最后留一台空烤箱可以再开一炉
  const ovens = ss.map(ovenCard).join('') + (ss.length
    ? `<a class="oven-add" href="#/recipes">${icon('plus')}<span>${L('再开一炉', 'Start another batch')}</span></a>`
    : `<div class="card dashed oven-card">${ovenScene()}
      <div class="info"><b>${L('烤箱空着', 'Oven is free')}</b><span class="small muted">${L('从配方架上挑一个，开烤吧', 'Pick a recipe from the shelf and start')}</span></div></div>`);

  const sub = today ? L(`今天已出炉 ${today} 炉`, `${today} batch${today > 1 ? 'es' : ''} out today`)
    : ss.length === 1 ? L(`「${esc(ss[0].recipe.name)}」正在烤箱里`, `${esc(ss[0].recipe.name)} is in the oven`)
    : ss.length ? L(`${ss.length} 炉正在烤`, `${ss.length} batches on the go`)
    : L('今天想烤点什么？', 'What shall we bake today?');

  const recent = bakes.slice(0, 6);
  const thumbs = await Promise.all(recent.map((b) => photoUrl(b.photoId)));
  const left = lv.next ? lv.next.at - bakes.length : 0;
  const giftLeft = Math.max(0, ...SECRETS.filter((x) => x.bakes).map((x) => x.bakes - bakes.length));

  return `
  <div class="split home"><div class="col-a">
  <div class="greet"><div class="t"><h1>${greeting()}</h1><p>${sub}</p></div>
    <a class="btn icon ghost" href="#/settings" data-tool="gearshape" aria-label="${L('店务', 'Settings')}">${icon('gear')}</a></div>
  ${shopFront(lookOf(lv.lv, bakes.length), shop.name)}
  <div class="shop-meta">
    <button class="lv" data-act="roadmap" aria-label="${L('查看升级路线', 'See the road map')}">Lv.${lv.lv} ${lv.name} ›</button>
    <span class="small muted"> · ${L(`营业第 <span class="mono">${days}</span> 天`, `Day <span class="mono">${days}</span>`)}</span>
    ${lv.next ? `<div class="progress"><i style="width:${Math.round(lv.progress * 100)}%"></i></div>
      <div class="small muted">${L(`再出炉 <b class="need">${left}</b> 次 → ${lv.next.name}`, `<b class="need">${left}</b> more bake${left > 1 ? 's' : ''} → ${lv.next.name}`)}${SECRETS.some((x) => x.lv === lv.lv + 1) ? L(' + 隐藏款', ' + a secret shop') : ''}</div>`
      : giftLeft > 0 ? `<div class="small muted">${L(`已经是最高等级啦 · 再出炉 <b class="need">${giftLeft}</b> 次有纪念礼物`, `Top level · <b class="need">${giftLeft}</b> more for an anniversary gift`)}</div>`
      : `<div class="small muted">${L('已经是最高等级啦', 'Top level reached')}</div>`}
  </div>

  <div class="stats">
    <div class="stat"><b>${recipes.length}</b><span>${L('本店配方', 'Recipes')}</span></div>
    <div class="stat"><b>${bakes.length}</b><span>${L('累计出炉', 'Baked')}</span></div>
    <div class="stat"><b>${thisMonth}</b><span>${L('本月出炉', 'This month')}</span></div>
  </div>
  </div><div class="col-b">

  <h2>${L('烤箱', 'Ovens')}${ss.length > 1 ? ` <span class="small muted" style="font-weight:400">${L(`${ss.length} 台在烤`, `${ss.length} busy`)}</span>` : ''}</h2>
  <div class="ovens">${ovens}</div>

  <h2>${L('配方架', 'Recipe shelf')} <a class="more" href="#/recipes">${L('全部', 'All')} ›</a></h2>
  <div class="shelf">
    ${recipes.map((r) => `<a class="item" href="#/r/${r.id}"><span class="pic">${shape(r.shape)}${priceTag(r)}</span><span>${esc(r.name)}</span><small>${bakeCount(r.id) ? L(`做过 ${bakeCount(r.id)} 次`, `Baked ${times(bakeCount(r.id))}`) : L('还没做过', 'Not yet baked')}</small></a>`).join('')}
    <a class="item add" href="#/import">${icon('plus')}<span class="muted">${L('上新配方', 'New recipe')}</span></a>
  </div>
  <div class="shelf-board"></div>

  <h2>${L('作品墙', 'Bake wall')} <a class="more" href="#/wall">${L('全部', 'All')} ›</a></h2>
  ${recent.length ? `<div class="wall">${recent.map((b, i) => polaroid(b, thumbs[i])).join('')}</div>`
    : `<div class="empty">${emptyShelf()}<div>${L('还没有作品，第一炉在等你', 'Nothing here yet. Your first batch awaits')}</div></div>`}
  <div class="home-foot">${houseLogo()}</div>
  </div></div>
  `;
}

// 整面作品墙：所有作品按月份分组，新的在前；从配方详情进来（#/wall/<配方>）就只看这一款的
async function viewWall(recipeId) {
  const r = recipeId && await getRecipe(recipeId);
  if (recipeId && !r) return notFound();
  const bakes = (await listBakes()).filter((b) => !recipeId || b.recipeId === recipeId);
  const urls = await Promise.all(bakes.map((b) => photoUrl(b.photoId)));
  const groups = [];
  bakes.forEach((b, i) => {
    const d = new Date(b.finishedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (groups.at(-1)?.key !== key) groups.push({ key, d, items: [] });
    groups.at(-1).items.push(polaroid(b, urls[i]));
  });
  const title = r ? L(`「${esc(r.name)}」的作品`, `${esc(r.name)}: past bakes`) : L('作品墙', 'Bake wall');
  return `<div class="wall-page">
  <div class="topbar"><a class="btn icon ghost" href="${r ? `#/r/${r.id}` : '#/'}" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1>${title}</h1>
    <span class="sub">${L(`共 ${bakes.length} 炉`, `${bakes.length} in all`)}</span></div>
  ${groups.length ? groups.map((g) => `<h2>${L(`${g.d.getFullYear()} 年 ${g.d.getMonth() + 1} 月`, `${MONTHS[g.d.getMonth()]} ${g.d.getFullYear()}`)}
      <span class="small muted" style="font-weight:400">${L(`${g.items.length} 炉`, `${g.items.length}`)}</span></h2>
    <div class="wall">${g.items.join('')}</div>`).join('')
    : `<div class="empty">${emptyShelf()}<div>${L('还没有作品，第一炉在等你', 'Nothing here yet. Your first batch awaits')}</div></div>`}
  </div>`;
}

function polaroid(b, url) {
  return `<a class="polaroid" href="#/log/${b.id}"><span class="tape"></span>
    <div class="ph">${url ? `<img src="${url}" alt="" loading="lazy">` : shape(b.shape)}</div>
    <figcaption><span class="n">${esc(b.recipeName)}</span><span class="dt">${fmtDate(b.finishedAt)}</span></figcaption></a>`;
}

// =====================================================================
// 配方
// =====================================================================

// 面包旁边立一张小价签（按当前货币）
const priceTag = (r) => { const p = getPrice(r); return p != null ? `<span class="price">${formatPrice(p)}</span>` : ''; };
const totalMinutes = (r) => r.steps.reduce((a, st) => a + (stepMin(st) || 0), 0);

// 配方架：和首页一样的轻木板，每层三个面包，面包下面是牛皮纸名签，旁边立着价签；最后留一个空位上新配方
// 配方架页：宽屏上整面铺开（一层五个）；点了某一款才分成左边配方架、右边详情（viewRecipe）
async function viewRecipes() {
  if (!wideMQ.matches) return recipeShelf();
  return `<div class="shelf-wide">${await recipeShelf(null, 5)}</div>`;
}

async function viewRecipe(id) {
  if (!wideMQ.matches) return recipeDetail(id);
  const detail = await recipeDetail(id, true);
  if (detail == null) return null;
  return `<div class="md"><div class="md-list">${await recipeShelf(id)}</div><div class="md-detail">${detail}</div></div>`;
}

async function recipeShelf(sel = null, per = 3) {
  const [recipes, bakes] = await Promise.all([listRecipes(), listBakes()]);
  const q = state.filter.trim().toLowerCase();
  const list = q ? recipes.filter((r) => r.name.toLowerCase().includes(q) || r.ingredients.some((i) => i.name.toLowerCase().includes(q))) : recipes;
  const count = (id) => bakes.filter((b) => b.recipeId === id).length;
  const items = list.map((r) => {
    const total = totalMinutes(r);
    const n = count(r.id);
    // 宽屏分栏时再点一下选中的那款 = 收起右边的详情，回到整面配方架
    return `<a class="rack-item ${r.id === sel ? 'on' : ''}" href="${r.id === sel ? '#/recipes' : `#/r/${r.id}`}"${r.id === sel ? ' aria-current="true"' : ''}><span class="pic">${shape(r.shape)}${priceTag(r)}</span>
      <span class="tag">${esc(r.name)}</span>
      <small>${total ? `${L('约', '~')} ${formatMinutes(total)}` : L(`${r.steps.length} 步`, `${r.steps.length} steps`)}${n ? ` · ${L(`做过 ${n} 次`, `×${n}`)}` : ''}</small></a>`;
  });
  if (!q) items.push(`<a class="rack-item add" href="#/import">${icon('plus')}<span>${L('上新配方', 'New recipe')}</span></a>`);
  const rows = [];
  const cols = per === 5 ? ' style="--per:5"' : '';
  for (let i = 0; i < items.length; i += per) rows.push(items.slice(i, i + per));
  return `
  <div class="topbar"><h1>${L('配方架', 'Recipe shelf')}</h1>
    <a class="btn sm" href="#/import" data-act="new-import" data-tool-menu="plus" data-tool-title="${L('上新配方', 'New recipe')}">${icon('paste')} ${L('导入', 'Import')}</a>
    <a class="btn sm primary" href="#/edit/new" data-act="new-blank" data-tool-menu="plus">${icon('plus')} ${L('手写', 'Write')}</a></div>
  <input class="search" type="search" placeholder="${L('找配方 / 找材料…', 'Find a recipe or ingredient…')}" value="${esc(state.filter)}" data-act-input="filter">
  <div id="rack-results">${list.length || !q ? `<div class="rack"${cols}>${rows.map((row) => `<div class="rack-row">${row.join('')}</div>`).join('')}</div>`
    : `<div class="empty">${emptyShelf()}<div>${L(`没找到「${esc(state.filter)}」`, `Nothing matches “${esc(state.filter)}”`)}</div></div>`}</div>`;
}

// md：宽屏右边那栏，不要返回键（左边就是配方架）
async function recipeDetail(id, md = false) {
  const r = await getRecipe(id);
  if (!r) return notFound();
  state.lastRecipe = id;
  if (getPrice(r) == null) await setPrice(r.id, randomPrice(r.shape)).then((x) => { r.prices = x.prices; });
  const bakes = (await listBakes()).filter((b) => b.recipeId === id);
  const thumbs = await Promise.all(bakes.slice(0, 6).map((b) => photoUrl(b.photoId)));
  const total = totalMinutes(r);
  const baking = state.sessions.filter((s) => s.recipeId === id);
  return `
  <div class="topbar">${md ? '' : `<a class="btn icon ghost" href="#/recipes" aria-label="${L('返回', 'Back')}">${icon('back')}</a>`}<h1></h1>
    <button class="btn icon ghost" data-act="share-recipe" data-id="${r.id}" data-tool="square.and.arrow.up" aria-label="${L('分享', 'Share')}">${icon('share')}</button>
    <a class="btn icon ghost" href="#/edit/${r.id}" data-tool="pencil" aria-label="${L('编辑', 'Edit')}">${icon('pencil')}</a></div>
  <div class="split recipe"><div class="col-a">
  <div class="hero">${shape(r.shape)}<h1>${esc(r.name)}</h1>
    <div class="chips">
      ${r.yield ? `<span class="chip time">${esc(r.yield)}</span>` : ''}
      ${total ? `<span class="chip time">${icon('timer')} ${L('约', '~')} ${formatMinutes(total)}</span>` : ''}
      <span class="chip time">${L(`做过 ${bakes.length} 次`, `Baked ${times(bakes.length)}`)}</span>
      <button class="chip price-chip" data-act="edit-price" data-id="${r.id}" aria-label="${L('改价签', 'Edit price')}">${formatPrice(getPrice(r))} ${icon('pencil')}</button>
    </div></div>

  ${r.sampleUpdate ? `<div class="catalog-update">${icon('star')}<span>${L('店里有新版的这款配方', 'There’s a new version of this recipe')}</span>
    <button class="link-btn" data-act="catalog-skip" data-id="${r.id}">${L('留着我的', 'Keep mine')}</button>
    <button class="btn sm primary" data-act="catalog-take" data-id="${r.id}">${L('换成新版', 'Use new')}</button></div>` : ''}
  ${baking.length ? `<a class="baking-now" href="#/bake/${baking[0].id}">${icon('oven')} ${L('这款正在烤箱里，去看看', 'This one is in the oven: take a look')} ›</a>` : ''}
  <div style="margin:18px 0 4px"><button class="btn primary big block" data-act="start-bake" data-id="${r.id}">${icon('oven')} ${baking.length ? L('再烤一炉', 'Bake another batch') : L('开烤！', 'Start baking')}</button></div>

  <h2>${L('材料', 'Ingredients')}</h2>
  ${ingTable(r.ingredients)}
  </div><div class="col-b">

  <h2>${L('步骤', 'Steps')}</h2>
  <ol class="steps">${r.steps.map((s, i) => { const k = stepKind(s, i, r.steps); return `<li class="k-${k}"><div class="stext">${stepHtml(s.text)}</div>${stepMeta(s, k)}</li>`; }).join('')}</ol>

  ${r.notes ? `<h2>${L('备注', 'Notes')}</h2><div class="card fill notes">${esc(r.notes)}</div>` : ''}

  ${bakes.length ? `<h2>${L('这款的作品', 'Past bakes')} <a class="more" href="#/wall/${r.id}">${L('全部', 'All')} ›</a></h2><div class="wall">${bakes.slice(0, 6).map((b, i) => polaroid(b, thumbs[i])).join('')}</div>` : ''}

  <div class="row" style="margin-top:32px"><button class="btn danger sm" data-act="delete-recipe" data-id="${r.id}">${icon('trash')} ${L('删除配方', 'Delete')}</button>
    <span class="small muted grow" style="text-align:right">v${r.version} · ${L(`更新于 ${fmtDate(r.updatedAt)}`, `updated ${fmtDate(r.updatedAt)}`)}</span></div>
  </div></div>`;
}

function ingTable(ings, scale = 1) {
  if (!ings.length) return `<p class="muted">${L('（还没有材料）', '(No ingredients yet)')}</p>`;
  return `<table class="ing-table">${ings.map((i) => `<tr><td>${esc(i.name)}${i.note ? ` <span class="note">${esc(i.note)}</span>` : ''}</td>
    <td class="amt">${i.amount != null ? formatAmount(i.amount * scale) : ''} ${esc(i.unit)}</td></tr>`).join('')}</table>`;
}

function stepMeta(s, k = s.kind) {
  const bits = [];
  if (kindLabel(k)) bits.push(kindTag(k));
  const m = stepMin(s);
  if (m) bits.push(`<span class="chip time">${icon('timer')} ${formatMinutes(m)}${!s.minutes ? ` <span class="muted">${L('默认', 'default')}</span>` : ''}</span>`);
  return bits.length ? `<div class="meta">${bits.join('')}</div>` : '';
}

// 导出为纯文本：再粘贴回「导入」也能原样解析
function recipeToText(r) {
  return [
    r.name, '',
    L('材料：', 'Ingredients:'), ...r.ingredients.map((i) => `${i.name} ${i.amount != null ? formatAmount(i.amount) : ''}${i.unit}${i.note ? ` (${i.note})` : ''}`.trim()), '',
    L('步骤：', 'Steps:'), ...r.steps.map((s, n) => `${n + 1}. ${s.text}${s.minutes && !/\d\s*(分|小时|min|h)/i.test(s.text) ? ` ${formatMinutes(s.minutes)}` : ''}`),
    ...(r.notes ? ['', L('备注：', 'Notes:'), r.notes] : []),
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
  const cur = getCurrency();
  d.prices = { ...(d.prices || {}) };
  if (d.prices[cur] == null || d.prices[cur] === '') d.prices[cur] = getPrice(d) ?? randomPrice(d.shape);
  const names = shapeNames();
  return `
  <div class="topbar"><a class="btn icon ghost" href="${id === 'new' ? '#/recipes' : `#/r/${id}`}" data-act="cancel-edit" aria-label="${L('返回', 'Back')}">${icon('back')}</a>
    <h1>${id === 'new' ? L('上新配方', 'New recipe') : L('改配方', 'Edit recipe')}</h1>
    <button class="btn primary sm" data-act="save-recipe" data-tool="checkmark" data-tool-prominent>${icon('check')} ${L('保存', 'Save')}</button></div>

  <label class="f"><span>${L('名字', 'Name')}</span><input class="input" data-d="name" value="${esc(d.name)}" placeholder="${L('比如：乡村欧包', 'e.g. Country loaf')}"></label>
  <div class="f"><span class="small muted">${L('长什么样', 'Looks like')}</span>
    <div class="shape-pick">${Object.keys(names).map((k) => `<button type="button" class="${d.shape === k ? 'on' : ''}" data-act="set-shape" data-v="${k}">${shape(k)}${names[k]}</button>`).join('')}</div></div>
  <label class="f" style="margin-top:14px"><span>${L('份量', 'Yield')}</span><input class="input" data-d="yield" value="${esc(d.yield)}" placeholder="${L('比如：1 个 · 约 800g', 'e.g. 1 loaf · about 800g')}"></label>
  <div class="f price-f"><span>${L('价签', 'Price tag')}</span>
    <div class="row"><span class="mono">${currencySymbol()}</span><input class="input num" data-d="price" value="${esc(String(d.prices[cur]))}" type="number" inputmode="decimal" step="any" min="0">
      <button type="button" class="link-btn" data-act="dice-price">${icon('dice')} ${L('随机定个价', 'Roll a price')}</button></div></div>

  <h2>${icon('flour')} ${L('材料', 'Ingredients')}</h2>
  <div class="edit-grid">
    ${d.ingredients.map((i) => `<div class="edit-ing">
      <input class="input" data-d="ing.${i.id}.name" value="${esc(i.name)}" placeholder="${L('材料', 'Item')}">
      <input class="input num" data-d="ing.${i.id}.amount" value="${i.amount ?? ''}" type="number" inputmode="decimal" step="any" placeholder="${L('用量', 'Qty')}">
      <input class="input" data-d="ing.${i.id}.unit" value="${esc(i.unit)}" placeholder="${L('单位', 'Unit')}">
      <button class="btn icon sm ghost" data-act="del-ing" data-id="${i.id}" aria-label="${L('删除', 'Delete')}">${icon('close')}</button>
    </div>`).join('')}
  </div>
  <button class="btn sm" style="margin-top:8px" data-act="add-ing">${icon('plus')} ${L('加材料', 'Add ingredient')}</button>

  <h2>${icon('timer')} ${L('步骤', 'Steps')}</h2>
  <div>
    ${d.steps.map((s, n) => `<div class="edit-step">
      <textarea class="input" rows="2" style="min-height:56px" data-d="step.${s.id}.text" placeholder="${L(`第 ${n + 1} 步做什么`, `Step ${n + 1}`)}">${esc(s.text)}</textarea>
      <div class="tools">
        <input class="input num" data-d="step.${s.id}.minutes" value="${s.minutes ?? ''}" type="number" inputmode="decimal" step="any" placeholder="${L('分钟', 'min')}">
        <span class="small muted">${L('分钟', 'min')}</span><span class="grow" style="flex:1"></span>
        <button class="btn icon sm ghost" data-act="move-step" data-id="${s.id}" data-v="-1" aria-label="${L('上移', 'Move up')}">${icon('up')}</button>
        <button class="btn icon sm ghost" data-act="move-step" data-id="${s.id}" data-v="1" aria-label="${L('下移', 'Move down')}">${icon('down')}</button>
        <button class="btn icon sm ghost" data-act="del-step" data-id="${s.id}" aria-label="${L('删除', 'Delete')}">${icon('close')}</button>
      </div></div>`).join('')}
  </div>
  <button class="btn sm" style="margin-top:8px" data-act="add-step">${icon('plus')} ${L('加步骤', 'Add step')}</button>

  <h2>${icon('pencil')} ${L('备注', 'Notes')}</h2>
  <textarea class="input" data-d="notes" placeholder="${L('小心得、注意事项…', 'Tips and things to remember…')}">${esc(d.notes)}</textarea>

  <button class="btn primary block" style="margin-top:22px" data-act="save-recipe">${icon('check')} ${L('保存配方', 'Save recipe')}</button>`;
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
  } else if (a === 'price') {
    recipe.prices = { ...(recipe.prices || {}), [getCurrency()]: value === '' ? '' : Number(value) };
  } else {
    recipe[a] = value;
  }
}

// ---------- 导入 ----------

const IMPORT_EXAMPLE = () => L(`乡村欧包

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
5. 250°C 烤 40分钟`, `Country Loaf

Ingredients:
400g bread flour
100g whole wheat flour
360g water
10g salt
3g yeast

Steps:
1. Mix flour and water, rest 30 min
2. Add salt and yeast, knead 10 min
3. Bulk ferment 2 h
4. Shape and proof 1 h
5. Bake at 250°C for 40 min`);

// 给用户自己的 AI 助手（ChatGPT、豆包、Kimi、DeepSeek……）用的提示词：让它把随便什么样的食谱整理成这里最好认的格式
const AI_PROMPT = () => L(`请把我发给你的面包 / 甜点食谱，严格按照下面「格式示例」的样子重写。只输出重写好的配方，不要加开场白、解释或总结。

格式示例：
巧克力软欧

材料：
面团：
高筋面粉 250g
可可粉 15g
牛奶 130-150g
即发干酵母 3g（或鲜酵母 9g）
馅料：
黑巧克力 100g
盐 适量

步骤：
1. 面团材料放入厨师机，低速搅拌 3分钟
2. 室温进行一次发酵 60分钟，至两倍大
3. 分割滚圆，松弛 15分钟
4. 包入馅料，整形后进行二次发酵 40分钟
5. 烤箱预热到 350°F
6. 350°F 烤 25分钟

小贴士：
可可粉要过筛

必须遵守：
- 第一行只写配方名
- 只用三个小标题：「材料：」「步骤：」「小贴士：」，各占一行
- 材料一样一行，写成「名称 数量单位」。绝对不要把几样材料写在同一行，也不要用顿号、逗号或空格把它们连在一起
- 材料分组时，组名单独一行、以冒号结尾（如「馅料：」），这一组的材料写在它下面，每样一行
- 用量是范围写成「130-150g」；没有准确用量写「适量」
- 步骤用「1. 2. 3.」编号，一步一行，不要用「*」「-」或其他符号开头
- 每个要等待的步骤（发酵、静置、松弛、冷藏、烘烤）都要写上时间，例如「发酵 60分钟」「烤 25分钟」；时间是范围可以写「40-60分钟」
- 重量尽量换算成克（g），液体用克或毫升（ml）
- 温度用华氏度（°F），原文是摄氏度的换算成华氏度
- 不要用表格、加粗、斜体、Markdown 符号或表情符号
- 原文是英文或其他语言时，翻译成中文

食谱原文：
`, `Rewrite the bread / pastry recipe I send you so it follows the "Format example" below exactly. Output only the rewritten recipe: no intro, explanation or summary.

Format example:
Chocolate Soft Loaf

Ingredients:
Dough:
250g bread flour
15g cocoa powder
130-150g milk
3g instant yeast (or 9g fresh yeast)
Filling:
100g dark chocolate
salt to taste

Steps:
1. Put the dough ingredients in a stand mixer and mix on low for 3 min
2. Bulk ferment at room temperature for 60 min, until doubled
3. Divide, pre-shape and rest 15 min
4. Fill, shape and proof for 40 min
5. Preheat the oven to 350°F
6. Bake at 350°F for 25 min

Notes:
Sift the cocoa powder

Rules you must follow:
- The first line is the recipe name only
- Use only three headings, each on its own line: "Ingredients:", "Steps:", "Notes:"
- One ingredient per line, as "amount unit name". Never put several ingredients on the same line or join them with commas or spaces
- For groups, put the group name on its own line ending with a colon (e.g. "Filling:") and list that group's ingredients under it, one per line
- Write ranges as "130-150g"; with no exact amount write "to taste"
- Number the steps "1. 2. 3.", one step per line; don't start lines with "*", "-" or other symbols
- Give a time for every waiting step (proof, rest, chill, bake), e.g. "proof 60 min", "bake 25 min"; a range like "40-60 min" is fine
- Use grams (g) for weights where possible; grams or millilitres (ml) for liquids
- Temperatures in °F (convert from °C if needed)
- No tables, bold, italics, Markdown symbols or emoji
- If the original is in another language, translate it into English

Original recipe:
`);

function viewImport() {
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/recipes" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1>${L('导入配方', 'Import a recipe')}</h1></div>
  <p class="muted small">${L('把食谱整段粘贴进来就好——下厨房、小红书、公众号、笔记里抄的都行。我会认出<span class="scribble">材料和用量</span>、<span class="scribble">每一步和它的时间</span>，导入后还能再改。',
    'Paste a whole recipe from anywhere. I’ll pick out the <span class="scribble">ingredients and amounts</span> and <span class="scribble">each step with its time</span>; you can tweak it after.')}</p>
  <textarea class="input tall" id="import-text" placeholder="${esc(IMPORT_EXAMPLE())}"></textarea>
  <div class="row" style="margin-top:12px">
    <button class="btn primary block" data-act="parse-import">${icon('check')} ${L('认一下', 'Read it')}</button>
  </div>
  <p class="small muted" style="margin-top:18px">${L('小提示：写上「材料」「步骤」这样的小标题会认得更准；时间写成「30分钟」「1.5小时」「45 min」都可以。',
    'Tip: headings like “Ingredients” and “Steps” help; times like “30 min”, “1.5 h” or “1h30m” all work.')}</p>
  <details class="card ai-help">
    <summary>${icon('paste')} ${L('配方太乱？让你的 AI 助手先整理一下', 'Messy recipe? Let your AI assistant tidy it first')}</summary>
    <p class="small muted">${L('截图、外文食谱、视频文案、长篇笔记都可以：把下面这段话复制给 ChatGPT、豆包、Kimi、DeepSeek 之类的 AI 助手，后面贴上食谱原文（或者发截图），再把它整理好的结果粘贴到上面的框里。',
      'Screenshots, recipes in other languages, video captions, long blog posts: copy the text below into ChatGPT or any AI assistant, add the recipe (or a screenshot) after it, then paste its answer into the box above.')}</p>
    <pre class="ai-prompt">${esc(AI_PROMPT())}<span class="muted">${L('（在这里贴上食谱原文或截图）', '(paste the recipe or a screenshot here)')}</span></pre>
    <button class="btn block" data-act="copy-ai-prompt">${icon('paste')} ${L('复制这段话', 'Copy the prompt')}</button>
  </details>`;
}

// =====================================================================
// 烘焙中（可以同时好几炉，每炉一个 session）
// =====================================================================

async function startBake(id) {
  const r = await getRecipe(id);
  if (!r) return;
  unlockAudio();
  askNotifyPermission();
  const s = {
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
  state.sessions.push(s);
  await persistSessions();
  go(`#/bake/${s.id}`);
}

function viewBake(id) {
  // 旧地址 #/bake：只有一炉就直接进去，没有就回首页
  if (!id) {
    const last = state.sessions[state.sessions.length - 1];
    setTimeout(() => location.replace(last ? `#/bake/${last.id}` : '#/'), 0);
    return null;
  }
  const s = sessionById(id);
  if (!s) {
    return `<div class="topbar"><a class="btn icon ghost" href="#/" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1>${L('烤箱', 'Oven')}</h1></div>
      <div class="empty">${ovenScene()}<p>${L('这一炉已经出炉或者放弃了', 'This batch is already done')}</p><a class="btn primary" href="#/recipes">${L('去挑个配方', 'Pick a recipe')}</a></div>`;
  }
  const r = s.recipe;
  const ed = s.editing;
  const scaleBtns = [0.5, 1, 1.5, 2].map((v) => `<button class="chip ${s.scale === v ? 'on' : ''}" data-act="scale" data-v="${v}">×${v}</button>`).join('');
  const changes = diffRecipe(s.original, r);
  // 称料全部勾完就折叠成一行，想核对再点开
  const allWeighed = r.ingredients.length > 0 && r.ingredients.every((i) => s.checked.includes(i.id));

  const ingHtml = ed
    ? `<div class="edit-grid">${r.ingredients.map((i) => `<div class="edit-ing">
        <input class="input" data-s="ing.${i.id}.name" value="${esc(i.name)}" placeholder="${L('材料', 'Item')}">
        <input class="input num" data-s="ing.${i.id}.amount" value="${i.amount != null ? formatAmount(i.amount * s.scale) : ''}" type="number" inputmode="decimal" step="any">
        <input class="input" data-s="ing.${i.id}.unit" value="${esc(i.unit)}">
        <button class="btn icon sm ghost" data-act="bake-del-ing" data-id="${i.id}" aria-label="${L('删除', 'Delete')}">${icon('close')}</button></div>`).join('')}</div>
        <button class="btn sm" style="margin-top:8px" data-act="bake-add-ing">${icon('plus')} ${L('加材料', 'Add ingredient')}</button>`
    : allWeighed && !s.ingOpen
    ? `<button class="ing-folded" data-act="ing-fold" data-v="1">${icon('check')}<span>${L(`料都称好了 · ${r.ingredients.length} 样`, `All ${r.ingredients.length} weighed out`)}</span><span class="small muted">${L('展开', 'Show')}</span></button>`
    : `<ul class="checklist">${r.ingredients.map((i) => {
        const done = s.checked.includes(i.id);
        return `<li class="${done ? 'done' : ''}" data-act="toggle-ing" data-id="${i.id}">
          <span class="box">${done ? icon('check') : ''}</span><span class="name">${esc(i.name)}${i.note ? ` <span class="small muted">${esc(i.note)}</span>` : ''}</span>
          <span class="amt">${i.amount != null ? formatAmount(i.amount * s.scale) : ''} ${esc(i.unit)}</span></li>`;
      }).join('')}</ul>${allWeighed ? `<button class="link-btn fold-again" data-act="ing-fold" data-v="0">${L('收起', 'Hide')}</button>` : ''}`;

  const stepsHtml = r.steps.map((st, n) => {
    const done = s.doneSteps.includes(st.id);
    const cur = n === s.current && !done;
    const timers = s.timers.filter((t) => t.stepId === st.id);
    if (ed) {
      return `<li><div class="edit-step" style="padding-top:0">
        <textarea class="input" rows="2" style="min-height:56px" data-s="step.${st.id}.text">${esc(st.text)}</textarea>
        <div class="tools"><input class="input num" data-s="step.${st.id}.minutes" value="${st.minutes ?? ''}" type="number" inputmode="decimal" step="any" placeholder="${L('分钟', 'min')}">
        <span class="small muted">${L('分钟', 'min')}</span><span style="flex:1"></span>
        <button class="btn icon sm ghost" data-act="bake-del-step" data-id="${st.id}" aria-label="${L('删除', 'Delete')}">${icon('close')}</button></div></div></li>`;
    }
    const k = stepKind(st, n, r.steps);
    return `<li class="k-${k} ${done ? 'done' : ''} ${cur ? 'current' : ''}">
      <div class="stext" data-act="focus-step" data-i="${n}">${stepHtml(st.text)}${timers.map((t) => ` <span class="tick mono" data-clock="${t.id}">${clockText(t)}</span>`).join('')}</div>
      ${done ? '' : `<div class="meta">${kindTag(k)}${isTimed(st) && !timers.length ? `<span class="chip time">${icon('timer')} ${formatMinutes(stepMin(st))}</span>` : ''}</div>`}
    </li>`;
  }).join('');

  const others = state.sessions.filter((x) => x.id !== s.id);
  // 烘焙页外面包一层 .rfont（display: contents，不影响排版），和配方详情页共用一套字体设置
  return `<div class="rfont">
  <div class="bake-head">
    <a class="btn icon ghost" href="#/" aria-label="${L('返回', 'Back')}">${icon('back')}</a>
    <div class="t"><b>${esc(r.name)}</b><span>${L(`<span class="mono">${fmtTime(s.startedAt)}</span> 开烤 · 已 <span data-elapsed>${fmtDur(Date.now() - s.startedAt)}</span>`,
      `Started <span class="mono">${fmtTime(s.startedAt)}</span> · <span data-elapsed>${fmtDur(Date.now() - s.startedAt)}</span> in`)}</span></div>
    <button class="btn sm ${ed ? 'primary' : ''}" data-act="bake-edit-toggle" data-tool="${ed ? 'checkmark' : 'pencil'}" ${ed ? 'data-tool-prominent' : ''}>${icon(ed ? 'check' : 'pencil')} ${ed ? L('改好了', 'Done') : L('改配方', 'Edit')}</button>
  </div>
  ${others.length ? `<div class="oven-tabs">${state.sessions.map((x) => `<a class="${x.id === s.id ? 'on' : ''}" href="#/bake/${x.id}">${shape(x.recipe.shape)}<span>${esc(x.recipe.name)}</span>${x.timers.some((t) => !t.done) ? `<span class="mono small" data-clock="${x.timers.find((t) => !t.done).id}"></span>` : ''}</a>`).join('')}</div>` : ''}
  ${changes.length ? `<p class="small" style="margin:8px 0 0"><span class="badge">${L(`这次改了 ${changes.length} 处`, `${changes.length} change${changes.length > 1 ? 's' : ''}`)}</span> <span class="muted">${L('出炉时再决定要不要存回配方', 'Decide whether to keep them when it’s done')}</span></p>` : ''}

  ${ed ? '' : `<div class="split bake"><div class="col-a">${bakeHero(s)}</div><div class="col-b">`}

  <h2>${L('称料', 'Weigh out')} <span class="row" style="margin-left:auto;gap:6px">${scaleBtns}</span></h2>
  ${ingHtml}

  <h2>${L('步骤', 'Steps')}</h2>
  <ol class="steps bake-steps">${stepsHtml}</ol>
  ${ed ? `<div class="row" style="justify-content:space-between;margin-top:8px">
    <button class="btn sm" data-act="bake-add-step">${icon('plus')} ${L('加步骤', 'Add step')}</button>
    <button class="btn sm primary" data-act="bake-edit-toggle">${icon('check')} ${L('改好了', 'Done')}</button></div>
    <p class="small muted center" style="margin-top:10px">${L('改动会自动保存，离开这一页也会自动退出修改', 'Changes save automatically; leaving this page ends editing')}</p>` : ''}

  <div class="stack" style="margin-top:26px">
    <button class="btn crust block" data-act="go-finish">${icon('camera')} ${L('出炉啦！拍照记录', 'It’s out! Take a photo')}</button>
    <button class="btn ghost block small danger" data-act="abandon">${L('放弃这一炉', 'Give up this batch')}</button>
  </div>
  ${ed ? '' : '</div></div>'}</div>`;
}

const clockText = (t) => (t.done ? L('时间到！', 'Time’s up!') : formatClock(remainingMs(t)));
const startWord = (k) => ({ bake: L('放进烤箱', 'Into the oven'), ferment: L('开始发酵', 'Start proofing') }[k]);

// 正在计时时的一排小按钮：暂停 / 继续、加 5 分钟、取消
function timerControls(t) {
  const paused = t.pausedRemaining != null;
  return `<div class="timer-ctl">
    <button class="link-btn" data-act="${paused ? 'timer-resume' : 'timer-pause'}" data-id="${t.id}">${icon(paused ? 'play' : 'pause')} ${paused ? L('继续', 'Resume') : L('暂停', 'Pause')}</button>
    <button class="link-btn" data-act="timer-add" data-id="${t.id}">${icon('plus')} ${L('5 分钟', '5 min')}</button>
    <button class="link-btn" data-act="timer-stop" data-id="${t.id}">${icon('close')} ${L('取消计时', 'Cancel')}</button>
  </div>`;
}

// 顶部的大场景：烤 → 烤箱面板上倒计时；发酵 → 烤盘上的面包慢慢长大；其他 → 揉面动画
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

  let scene;
  if (!cur) {
    scene = `<div class="oven-wrap">${ovenScene('', false, true)}<span class="display">${L('出炉啦', 'Done!')}</span>${mascot('yay')}</div>`;
  } else if (kind === 'bake') {
    const t = curTimer;
    const display = t ? `<span class="display ${t.done ? 'ring' : ''}" data-clock="${t.id}">${clockText(t)}</span>`
      : `<span class="display">${timed ? formatClock(stepMin(cur) * 60000) : '--:--'}</span>`;
    scene = `<div class="oven-wrap">${ovenScene('', running)}${display}${mascot(mood)}</div>`;
  } else if (kind === 'ferment') {
    const t = curTimer;
    const clock = t ? `<div class="hero-clock ${t.done ? 'ring' : ''}" data-clock="${t.id}">${clockText(t)}</div>`
      : timed ? `<div class="hero-clock">${formatClock(stepMin(cur) * 60000)}</div>` : '';
    scene = `<div class="oven-wrap" ${t ? `data-grow="${t.id}"` : ''}>${stageScene('ferment', running, '', progressOf(t))}${mascot(mood)}</div>${clock}`;
  } else {
    // 别的步骤在做的时候，如果之前的发酵/烘烤计时还在跑，用一行小字提醒
    const bg = [...(ringing ? [ringing] : []), ...live.filter((t) => t !== ringing)];
    scene = `<div class="oven-wrap">${stageScene(stepKind(cur, s.current, r.steps), true)}${mascot('wave')}</div>
      ${bg.map((t) => {
        const i = r.steps.findIndex((st) => st.id === t.stepId);
        const k = stepKind(r.steps[i], i, r.steps);
        return `<button class="bg-timer k-${k} ${t.done ? 'ring' : ''}" data-act="focus-step" data-i="${i}">${icon(t.done ? 'bell' : 'timer')}
          <span>${L(`第 ${i + 1} 步`, `Step ${i + 1}`)} · ${esc(kindLabel(k) || t.label.slice(0, 10))}</span><b class="mono" data-clock="${t.id}">${clockText(t)}</b><span class="go">${L('回去看', 'View')} ›</span></button>`;
      }).join('')}`;
  }

  // 下一步要做什么：往后第一个还没做、也不在后台计时的步骤
  const aheadIdx = r.steps.findIndex((st, i) => i > s.current && !s.doneSteps.includes(st.id) && !s.timers.some((t) => t.stepId === st.id && !t.done));
  const ahead = aheadIdx >= 0 ? r.steps[aheadIdx] : null;
  const upNext = cur ? `<div class="up-next"><span class="n">${L('下一步', 'Next')}</span>${ahead
    ? `<span>${stepHtml(ahead.text)}</span>` : `<span>${L('出炉，拍照记录', 'Take it out and snap a photo')}</span>`}</div>` : '';
  let action;
  let hint;
  if (!cur) {
    action = `<button class="btn primary big block" data-act="go-finish">${icon('camera')} ${L('出炉啦！拍照记录', 'It’s out! Take a photo')}</button>`;
    hint = L('每一步都完成了，辛苦啦', 'Every step done. Nice work');
  } else if (timed && !curTimer) {
    action = `<button class="btn primary big block" data-act="timer-start" data-id="${cur.id}">${startWord(kind)} · ${formatMinutes(stepMin(cur))}</button>`;
    hint = L('按下就开始计时，时间到会叫你', 'Tap to start the timer. I’ll call you when it’s time');
  } else {
    // 主按钮永远是「这步好了，下一步」；发酵 / 烘烤还在计时、后面又有能先做的步骤时，多一个「边等边做下一步」
    action = `<button class="btn primary big block" data-act="step-done" data-id="${cur.id}">${icon('check')} ${L('这步好了，下一步', 'Done, next step')}</button>
      ${running && ahead ? `<button class="btn sm ahead-btn" data-act="step-ahead">${icon('timer')} ${kind === 'ferment' ? L('边发酵，边做下一步', 'Next step while it proofs') : L('边烤，边做下一步', 'Next step while it bakes')}</button>` : ''}`;
    hint = running ? (kind === 'ferment' ? L('面团在睡觉长大，安心去做别的吧', 'The dough is napping and growing. Go do something else')
      : L('烤箱在努力，时间到我会叫你', 'The oven’s on it. I’ll call you'))
      : curTimer?.done ? L('时间到啦，看看状态再进行下一步', 'Time’s up. Check it, then move on') : L('慢慢来，做完这步就点一下', 'Take your time. Tap when this step is done');
  }
  return `<div class="bake-hero">
    ${scene}
    ${curTimer && !curTimer.done ? timerControls(curTimer) : ''}
    ${cur ? `<div class="step-now k-${stepKind(cur, s.current, r.steps)}">
      <div class="top"><span class="n">${L(`第 ${s.current + 1} 步 · 共 ${r.steps.length} 步`, `Step ${s.current + 1} of ${r.steps.length}`)}</span>${kindTag(stepKind(cur, s.current, r.steps))}${stepMin(cur) ? `<span class="n">${formatMinutes(stepMin(cur))}</span>` : ''}</div>
      <p>${stepHtml(cur.text)}</p></div>` : ''}
    ${action}
    <p class="hero-hint">${hint}</p>
    ${upNext}
  </div>`;
}

// 列出这次做的时候对配方的改动
function diffRecipe(a, b) {
  if (!a || !b) return [];
  const out = [];
  const amt = (i) => `${i.amount != null ? formatAmount(i.amount) : ''}${i.unit}`;
  const noTimer = L('不计时', 'no timer');
  const stepN = (n) => L(`第${n}步`, `Step ${n}`);
  const aIng = new Map(a.ingredients.map((i) => [i.id, i]));
  const bIng = new Map(b.ingredients.map((i) => [i.id, i]));
  for (const i of b.ingredients) {
    const o = aIng.get(i.id);
    if (!o) { if (i.name) out.push({ t: L(`加了 ${i.name} ${amt(i)}`, `Added ${i.name} ${amt(i)}`) }); continue; }
    if (o.name !== i.name) out.push({ t: `${i.name}`, old: o.name });
    if (o.amount !== i.amount || o.unit !== i.unit) out.push({ t: `${i.name} ${amt(i)}`, old: amt(o) });
  }
  for (const o of a.ingredients) if (!bIng.has(o.id)) out.push({ t: L(`去掉了 ${o.name}`, `Removed ${o.name}`) });
  const aSt = new Map(a.steps.map((s) => [s.id, s]));
  const bSt = new Map(b.steps.map((s) => [s.id, s]));
  b.steps.forEach((s, n) => {
    const o = aSt.get(s.id);
    if (!o) { if (s.text) out.push({ t: L(`新增步骤：${s.text}`, `New step: ${s.text}`) }); return; }
    if (o.text !== s.text) out.push({ t: `${stepN(n + 1)}${L('：', ': ')}${s.text}`, old: o.text });
    if ((o.minutes || null) !== (s.minutes || null)) out.push({ t: `${stepN(n + 1)} ${s.minutes ? formatMinutes(s.minutes) : noTimer}`, old: o.minutes ? formatMinutes(o.minutes) : noTimer });
  });
  for (const o of a.steps) if (!bSt.has(o.id)) out.push({ t: L(`删掉步骤：${o.text}`, `Removed step: ${o.text}`) });
  return out;
}

// ---------- 计时循环 ----------

function tick() {
  const now = Date.now();
  let changed = false;
  for (const s of state.sessions) {
    for (const t of s.timers) {
      if (!t.done && t.pausedRemaining == null && t.endsAt <= now) {
        t.done = true;
        changed = true;
        fireAlarm(s, t);
      }
    }
  }
  const timers = allTimers();
  document.querySelectorAll('[data-clock]').forEach((el) => {
    const t = timers.find((x) => x.id === el.dataset.clock);
    if (t) el.textContent = t.done ? L('时间到！', 'Time’s up!') : formatClock(remainingMs(t, now));
  });
  document.querySelectorAll('[data-grow]').forEach((el) => {
    const t = timers.find((x) => x.id === el.dataset.grow);
    el.querySelector('[data-grow-scale]')?.style.setProperty('--g', growScale(progressOf(t)));
  });
  const el = document.querySelector('[data-elapsed]');
  const rs = routeSession();
  if (el && rs) el.textContent = fmtDur(now - rs.startedAt);
  if (changed) {
    persistSessions();
    if (location.hash.startsWith('#/bake/') || location.hash === '#/' || location.hash === '') rerender();
  }
  renderTabClock();
}

// 别的页面上不再浮一排计时小条：所有炉里最近的那个倒计时直接显示在菜单栏「店铺」下面
// 正在计时的话，「店铺」标签下面换成最近的那个倒计时
function tabClockText() {
  const ts = allTimers().slice().sort((a, b) => remainingMs(a) - remainingMs(b));
  const t = ts.find((x) => x.done) || ts[0];
  return t ? (t.done ? L('时间到', 'Time!') : formatClock(remainingMs(t))) : '';
}
function renderTabClock() {
  syncNativeTabs();
  syncNativeBar();
  const label = $tabs.querySelector('[data-tab="shop"] span');
  if (!label) return;
  const t = tabClockText();
  label.textContent = t || L('店铺', 'Shop');
  label.classList.toggle('mono', !!t);
  label.parentElement.classList.toggle('ticking', !!t);
}

const alarmQueue = [];
async function fireAlarm(s, t) {
  startRinging();
  const autoStop = setTimeout(stopRinging, 60000); // 没人理也只响一分钟
  if (!isNative()) notify(`⏰ ${t.label}`, L(`「${s.recipe.name}」这一步的时间到啦`, `${s.recipe.name}: time’s up for this step`)); // 原生 app 里系统闹钟已经响了
  // 几炉同时响时一个一个弹
  if (state.alarmOpen) { alarmQueue.push([s, t]); clearTimeout(autoStop); return; }
  state.alarmOpen = t.id;
  const multi = state.sessions.length > 1;
  const v = await dialog(`<div class="alarm">${mascot('yay')}<h3>${L('时间到！', 'Time’s up!')}</h3>
    <p>${multi ? `<b>${esc(s.recipe.name)}</b> · ` : ''}${esc(t.label)}</p>
    <div class="row" style="justify-content:center">
      <button class="btn" data-dlg="more">${L('再等 5 分钟', '5 more min')}</button>
      <button class="btn primary" data-dlg="ok">${L('好了，下一步', 'Done, next step')}</button></div></div>`);
  clearTimeout(autoStop);
  state.alarmOpen = null;
  stopRinging();
  const live = s.timers.find((x) => x.id === t.id);
  if (live && sessionById(s.id)) {
    if (v === 'more') {
      addMinutes(live, 5);
    } else {
      // 计时到这里就结束了；点了「好了，下一步」再顺手进入下一步
      s.timers = s.timers.filter((x) => x.id !== live.id);
      if (v === 'ok' && live.stepId) {
        const curStep = s.recipe.steps[s.current];
        if (curStep && curStep.id !== live.stepId) { if (!s.doneSteps.includes(live.stepId)) s.doneSteps.push(live.stepId); }
        else completeStep(s, live.stepId);
      }
    }
    await persistSessions();
    if (v === 'ok' && multi && location.hash !== `#/bake/${s.id}`) go(`#/bake/${s.id}`);
    else rerender();
  }
  const nextAlarm = alarmQueue.shift();
  if (nextAlarm) fireAlarm(...nextAlarm);
}

// =====================================================================
// 出炉记录
// =====================================================================

// 出炉页的草稿（照片、星星、笔记）跟着这一炉存下来：拍照时 app 被系统杀掉也不会丢
function finishDraft(sid) {
  const s = sessionById(sid);
  if (s && !s.finishDraft) s.finishDraft = { photoId: null, rating: 0, notes: '', mode: 'update' };
  return s?.finishDraft || { photoId: null, rating: 0, notes: '', mode: 'update' };
}

async function viewFinish(sid) {
  const s = sessionById(sid);
  if (!s) { setTimeout(() => go('#/'), 0); return null; }
  const f = finishDraft(sid);
  const photo = f.photoId ? await photoUrl(f.photoId) : '';
  const changes = diffRecipe(s.original, s.recipe);
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/bake/${s.id}" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1>${L('出炉啦', 'Fresh out')}</h1></div>
  ${(() => {
    const inner = state.photoBusy ? `<span class="small muted">${L('照片处理中…', 'Processing photo…')}</span>`
      : photo ? `<img src="${photo}" alt="">` : `${icon('camera')}<span>${L('拍一张 / 选一张照片', 'Take or pick a photo')}</span>`;
    // 不限定相机：iOS 会弹系统菜单，拍照、照片图库、选取文件都可以
    return `<label class="photo-drop">${inner}<input type="file" accept="image/*" hidden data-act-change="pick-photo"></label>`;
  })()}

  <h2>${esc(s.recipe.name)} <span class="small muted mono" style="font-weight:400">${L('用时', 'took')} ${fmtDur(Date.now() - s.startedAt)}</span></h2>
  ${ratingRow(f.rating, 'rate')}

  <label class="f" style="margin-top:16px"><span>${L('这一炉的笔记', 'Notes on this batch')}</span>
    <textarea class="input" data-f="notes" placeholder="${L('组织怎么样？下次想调整什么？', 'How was the crumb? Anything to change next time?')}">${esc(f.notes)}</textarea></label>

  ${changes.length ? `
  <h2>${L('这次改了配方', 'You changed the recipe')}</h2>
  <ul class="diff">${changes.map((c) => `<li>${esc(c.t)}${c.old != null ? ` <span class="old">${esc(c.old)}</span>` : ''}</li>`).join('')}</ul>
  <div class="choice" style="margin-top:12px">
    <label><input type="radio" name="mode" value="update" ${f.mode === 'update' ? 'checked' : ''} data-act-change="mode"><span>${L('更新原配方', 'Update the recipe')}<small>${L('以后就按这次的来', 'Use this version from now on')}</small></span></label>
    <label><input type="radio" name="mode" value="new" ${f.mode === 'new' ? 'checked' : ''} data-act-change="mode"><span>${L('另存为新配方', 'Save as a new recipe')}<small>${L(`原配方不动，多一个「${esc(s.recipe.name)} · 改」`, `Keep the original, add “${esc(s.recipe.name)} · v2”`)}</small></span></label>
    <label><input type="radio" name="mode" value="none" ${f.mode === 'none' ? 'checked' : ''} data-act-change="mode"><span>${L('只记在这一次', 'Just this once')}<small>${L('改动保存在这条记录里，配方不变', 'Changes stay with this bake only')}</small></span></label>
  </div>` : ''}

  <button class="btn primary block" style="margin-top:24px" data-act="save-bake">${icon('check')} ${L('放上作品墙', 'Pin it to the wall')}</button>`;
}

// 打分：一排五颗手绘星星，点亮几颗就是几分；下面一句话说说这一炉怎么样
const RATE_WORDS = () => L(['差点意思', '还行', '不错', '很好吃', '完美出炉'], ['Meh', 'Okay', 'Good', 'Delicious', 'Perfect bake']);
function ratingRow(value, act, id = '') {
  const v = value || 0;
  return `<div class="rating-wrap"><div class="rating" role="radiogroup" aria-label="${L('打分', 'Rating')}">
    ${[1, 2, 3, 4, 5].map((n) => `<button class="${v >= n ? 'on' : ''}" data-act="${act}" ${id ? `data-id="${id}"` : ''} data-v="${n}" role="radio" aria-checked="${v === n}" aria-label="${n} · ${RATE_WORDS()[n - 1]}">${rateStar(v >= n)}</button>`).join('')}
  </div><div class="rating-word">${v ? RATE_WORDS()[v - 1] : L('烤得怎么样？点星星打个分', 'How did it turn out? Tap the stars')}</div></div>`;
}

async function saveFinish() {
  const s = routeSession();
  if (!s) return;
  const f = finishDraft(s.id);
  const before = (await listBakes()).length;
  const changes = diffRecipe(s.original, s.recipe);
  let recipeId = s.recipeId;
  let mode = changes.length ? f.mode : 'none';
  const orig = await getRecipe(s.recipeId);
  if (mode === 'update' && !orig) mode = 'new'; // 原配方已被删
  if (mode === 'update') {
    await saveRecipe({ ...s.recipe, id: orig.id, createdAt: orig.createdAt, version: orig.version, prices: orig.prices });
  } else if (mode === 'new') {
    const copy = clone(s.recipe);
    delete copy.id; delete copy.createdAt; copy.version = 0;
    copy.name = `${s.recipe.name} · ${L('改', 'v2')}`;
    recipeId = (await saveRecipe(copy)).id;
  }
  const photoId = f.photoId || null;
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
  if (!state.sessions.some((x) => x.id !== s.id && x.timers.some((t) => t.done))) stopRinging();
  state.sessions = state.sessions.filter((x) => x.id !== s.id);
  state.finish = null;
  await persistSessions();
  go(`#/log/${bake.id}`);
  setTimeout(() => celebrate(before + 1, bake.shape), 250);
}

async function celebrate(count, shapeName) {
  const a = levelOf(count - 1);
  const b = levelOf(count);
  const up = b.lv > a.lv;
  // 这一炉刚好解锁的隐藏款（升到 Lv.4 / 6 / 8，或者第 200 炉）
  const fresh = SECRETS.filter((x) => secretOpen(x, count) && !secretOpen(x, count - 1));
  if (up || fresh.length) playLevelUp(); else playChime();
  const left = b.next ? b.next.at - count : 0;
  const gift = fresh.find((x) => x.bakes);
  // 第 200 炉这种纪念日，第一张直接是礼物，不再先弹一张普通的出炉
  if (up || !gift) await dialog(`<div class="celebrate">${up ? shopFront(b.lv, state.shop.name, true) : `<div class="duo">${shape(shapeName)}${mascot('yay')}</div>`}
    <h3>${up ? L(`小店升级啦！Lv.${b.lv} ${b.name}`, `Level up! Lv.${b.lv} ${b.name}`) : L(`第 ${count} 炉出炉！`, `Batch #${count} is out!`)}</h3>
    ${up ? `<p class="small muted" style="margin-top:-4px">${lvDesc(b.lv - 1)}</p>` : ''}
    <p class="muted">${b.next ? L(`再出炉 ${left} 次，就能升级成「${b.next.name}」`, `${left} more to become “${b.next.name}”`) : L('已经是最高等级的小店了', 'Your shop is at the top level')}</p>
    <button class="btn primary" data-dlg="ok">${fresh.length ? L('好耶，还有惊喜？', 'Yay! And…?') : L('好耶', 'Yay')}</button></div>`);
  for (const x of fresh) {
    const v = await dialog(`<div class="celebrate">${shopFront(x.id, state.shop.name, true)}
      <h3>${x.bakes ? L(`出炉 ${x.bakes} 次纪念礼物！`, `A gift for ${x.bakes} bakes!`) : L('解锁隐藏款！', 'Secret shop unlocked!')}</h3>
      <p><b>${L(...x.name)}</b></p>
      <p class="small muted" style="margin-top:-4px">${L(...x.desc)}</p>
      <p class="muted">${L('以后在升级路线里也能随时换上', 'You can switch to it any time from the road map')}</p>
      <div class="row" style="justify-content:center"><button class="btn" data-dlg="later">${L('先不换', 'Not now')}</button><button class="btn primary" data-dlg="use">${L('换上这家店', 'Use this shop')}</button></div></div>`);
    if (v === 'use') { state.shop.look = x.id; await saveShop(state.shop); rerender(); scheduleWidgetSync(); }
  }
}

// ---------- 作品 ----------

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const weekday = (d) => L(['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'], ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])[d];
const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`; };

// 烘焙日历：做过面包的日子画上那款面包
async function viewLogs(ym) {
  const now = new Date();
  let [y, m] = ym ? ym.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  if (!(m >= 1 && m <= 12)) [y, m] = [now.getFullYear(), now.getMonth() + 1];
  // 还没到的月份不让翻过去
  const atNow = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
  if (atNow) [y, m] = [now.getFullYear(), now.getMonth() + 1];
  const from = new Date(y, m - 1, 1).getTime();
  const to = new Date(y, m, 1).getTime();
  const all = await listBakes();
  const bakes = all.filter((b) => b.finishedAt >= from && b.finishedAt < to);

  const prev = m === 1 ? `${y - 1}-12` : `${y}-${m - 1}`;
  const next = m === 12 ? `${y + 1}-1` : `${y}-${m + 1}`;
  const kinds = new Set(bakes.map((b) => b.recipeName)).size;
  const hours = bakes.reduce((a, b) => a + (b.finishedAt - b.startedAt), 0) / 3600000;
  // 选中的那一天：点过的日子 > 今天（在这个月里）> 这个月最后烤过的那天
  const inMonth = (k) => k && k.startsWith(`${y}-${pad2(m)}-`);
  const isToday = y === now.getFullYear() && m === now.getMonth() + 1;
  const sel = inMonth(state.calSel) ? state.calSel
    : isToday ? ymdInput(now)
    : bakes.length ? ymdInput(Math.max(...bakes.map((b) => b.finishedAt))) : null;
  const dayBakes = sel ? bakes.filter((b) => ymdInput(b.finishedAt) === sel).sort((a, b) => a.finishedAt - b.finishedAt) : [];
  const urls = await Promise.all(dayBakes.map((b) => photoUrl(b.photoId)));
  const selDate = sel && new Date(...sel.split('-').map((v, i) => Number(v) - (i === 1 ? 1 : 0)));
  const canBackfill = selDate && selDate <= now;

  state.calSlide = null;
  return `
  <div class="split logs"><div class="col-a">
  <div class="cal-head">
    <div class="y">${y}</div>
    <div class="m"><button data-go="#/logs/${prev}" aria-label="${L('上个月', 'Previous month')}">${icon('back')}</button>${MONTHS[m - 1]}<button data-go="#/logs/${next}" aria-label="${L('下个月', 'Next month')}" ${atNow ? 'disabled' : ''}>${icon('next')}</button></div>
  </div>
  <div class="cal-swipe ${state.calSlide ? `slide-${state.calSlide}` : ''}">${monthGrid(y, m, bakes, true, sel)}</div>

  <div class="stats cal-stats">
    <div class="stat"><b>${bakes.length}</b><span>loaves baked</span></div>
    <div class="stat"><b>${kinds}</b><span>recipes</span></div>
    <div class="stat"><b>${hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10}</b><span>hours</span></div>
  </div>
  </div><div class="col-b">

  ${sel ? `<div class="day-head"><b>${ymd(selDate)}</b> <span>${weekday(selDate.getDay())}</span></div>
  ${dayBakes.length ? `<div class="diary-list">${dayBakes.map((b, i) => `<a class="card ${i % 2 ? 'alt' : ''} diary-row" href="#/log/${b.id}">
      <span class="ph">${urls[i] ? `<img src="${urls[i]}" alt="" loading="lazy">` : shape(b.shape)}</span>
      <span class="t"><span class="date">${hm(b.finishedAt)} ${L('出炉', 'out of the oven')}</span><b>${esc(b.recipeName)}</b>
      <span class="small muted">${b.rating ? `<span class="mini-rate">${rateStar(true).repeat(b.rating)}</span>` : ''}${b.notes ? ` ${esc(b.notes.slice(0, 22))}${b.notes.length > 22 ? '…' : ''}` : ''}</span></span></a>`).join('')}</div>`
    : `<div class="empty day-empty">${mascot('wait')}<p>${L('这天没有开炉', 'No bakes on this day')}</p></div>`}
  ${canBackfill ? `<div class="backfill-cta"><a class="link-btn" href="#/backfill/${sel}">${icon('plus')} ${dayBakes.length ? L('这天还烤了别的？补记一炉', 'Baked something else? Add it') : L('补记这一天', 'Add a bake on this day')}</a></div>` : ''}`
  : `<div class="empty day-empty">${mascot('wait')}<p>${L('这个月还没有开炉', 'No bakes this month yet')}</p></div>
  <div class="backfill-cta"><a class="link-btn" href="#/backfill">${icon('plus')} ${L('补记一炉', 'Add a past bake')}</a></div>`}
  </div></div>`;
}

const hm = (t) => { const d = new Date(t); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

// 一个月的格子：做过面包的日子画上那款面包（日历页和日历小组件共用）
// links：日历页里，点哪天就选中哪天，下面换成那天烤的面包
function monthGrid(y, m, bakes, links, sel = null) {
  const now = new Date();
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
    const key = `${y}-${pad2(m)}-${pad2(d)}`;
    const today = y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
    const future = new Date(y, m - 1, d) > now;
    const cls = `d ${list ? 'has' : ''} ${today ? 'today' : ''} ${key === sel ? 'sel' : ''} ${future ? 'future' : ''}`;
    const inner = list ? `${shape(list[0].shape)}${list.length > 1 ? `<span class="cnt">${list.length}</span>` : ''}` : d;
    const title = list ? ` title="${esc(list.map((b) => b.recipeName).join(', '))}"` : '';
    cells.push(links && (list || new Date(y, m - 1, d) <= now)
      ? `<button class="${cls}" data-act="cal-day" data-day="${key}"${title} aria-label="${key}"${key === sel ? ' aria-pressed="true"' : ''}>${inner}</button>`
      : `<span class="${cls}"${title}>${inner}</span>`);
  }
  return `<div class="cal">${WEEK.map((w) => `<span class="wd">${w}</span>`).join('')}${cells.join('')}</div>`;
}

// =====================================================================
// 补记一炉：以前烤过、当时没记的，事后补一条（日期、时间、用时、照片、打分、笔记）
// =====================================================================

const ymdInput = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };

function backfillDraft(date) {
  const today = ymdInput(Date.now());
  if (!state.backfill) state.backfill = { recipeId: null, date: date || today, time: '16:00', hours: '', photoId: null, rating: 0, notes: '' };
  if (date && state.backfill.date !== date && !state.backfill.touched) state.backfill.date = date;
  return state.backfill;
}

async function viewBackfill(date) {
  const f = backfillDraft(date);
  const recipes = await listRecipes();
  if (!f.recipeId && recipes.length) f.recipeId = recipes[0].id;
  const r = recipes.find((x) => x.id === f.recipeId);
  const photo = f.photoId ? await photoUrl(f.photoId) : '';
  const estimate = r ? Math.round(totalMinutes(r) / 6) / 10 : '';
  const inner = state.photoBusy ? `<span class="small muted">${L('照片处理中…', 'Processing photo…')}</span>`
    : photo ? `<img src="${photo}" alt="">` : `${icon('camera')}<span>${L('有照片的话放一张', 'Add a photo if you have one')}</span>`;
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/logs" data-act="backfill-cancel" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1>${L('补记一炉', 'Add a past bake')}</h1></div>
  <p class="small muted" style="margin-top:-4px">${L('以前烤过、当时没来得及记的，在这里补上，也会算进出炉次数。', 'Record a bake you didn’t log at the time. It counts toward your shop level too.')}</p>

  <h2>${L('烤的是哪个', 'Which recipe')}</h2>
  ${recipes.length ? `<div class="bf-recipes">${recipes.map((x) => `<button type="button" class="${x.id === f.recipeId ? 'on' : ''}" data-act="bf-recipe" data-id="${x.id}">${shape(x.shape)}<span>${esc(x.name)}</span></button>`).join('')}</div>`
    : `<p class="muted">${L('配方架上还没有配方，', 'No recipes yet. ')}<a href="#/import">${L('先上新一个', 'Add one first')}</a></p>`}

  <h2>${L('什么时候', 'When')}</h2>
  <div class="bf-when">
    <label class="f"><span>${L('日期', 'Date')}</span><input class="input" type="date" data-bf="date" value="${f.date}" max="${ymdInput(Date.now())}"></label>
    <label class="f"><span>${L('出炉时间', 'Out at')}</span><input class="input" type="time" data-bf="time" value="${f.time}"></label>
    <label class="f"><span>${L('大概花了几小时', 'Hours it took')}</span><input class="input num" type="number" inputmode="decimal" step="0.5" min="0" data-bf="hours" value="${esc(f.hours)}" placeholder="${estimate || ''}"></label>
  </div>

  <h2>${L('照片', 'Photo')}</h2>
  <label class="photo-drop">${inner}<input type="file" accept="image/*" hidden data-act-change="bf-photo"></label>

  <h2>${L('打分', 'Rating')}</h2>
  ${ratingRow(f.rating, 'bf-rate')}

  <label class="f" style="margin-top:16px"><span>${L('笔记', 'Notes')}</span>
    <textarea class="input" data-bf="notes" placeholder="${L('还记得那一炉怎么样吗？', 'Anything you remember about it?')}">${esc(f.notes)}</textarea></label>

  <button class="btn primary block" style="margin-top:24px" data-act="bf-save" ${r ? '' : 'disabled'}>${icon('check')} ${L('放上作品墙', 'Pin it to the wall')}</button>`;
}

async function saveBackfill() {
  const f = state.backfill;
  const r = f && await getRecipe(f.recipeId);
  if (!r) { toast(L('先选一个配方', 'Pick a recipe first')); return; }
  const [y, mo, d] = f.date.split('-').map(Number);
  const [hh, mm] = (f.time || '16:00').split(':').map(Number);
  let finishedAt = new Date(y, mo - 1, d, hh || 0, mm || 0).getTime();
  if (!Number.isFinite(finishedAt)) { toast(L('日期不对', 'That date doesn’t look right')); return; }
  if (finishedAt > Date.now()) finishedAt = Date.now();
  const hours = f.hours === '' || Number.isNaN(Number(f.hours)) ? totalMinutes(r) / 60 : Number(f.hours);
  const before = (await listBakes()).length;
  const bake = {
    id: uid(), recipeId: r.id, recipeName: r.name, shape: r.shape, snapshot: clone(r), scale: 1,
    changes: [], changeMode: 'none',
    startedAt: finishedAt - Math.max(0, hours) * 3600000, finishedAt,
    photoId: f.photoId, rating: f.rating, notes: f.notes, backfilled: true,
  };
  await saveBake(bake);
  state.backfill = null;
  state.calSel = ymdInput(finishedAt);
  go(`#/log/${bake.id}`);
  setTimeout(() => celebrate(before + 1, bake.shape), 250);
}

// 日记页：改这一炉的日期和出炉时间（补记错了、或者当时忘了点出炉）
async function editBakeTime(id) {
  const b = await getBake(id);
  if (!b) return;
  const d = new Date(b.finishedAt);
  const v = await dialog(`<h3>${L('改日期和时间', 'Change date & time')}</h3>
    <div class="bf-when">
      <label class="f"><span>${L('日期', 'Date')}</span><input class="input" type="date" id="et-date" value="${ymdInput(b.finishedAt)}" max="${ymdInput(Date.now())}"></label>
      <label class="f"><span>${L('出炉时间', 'Out at')}</span><input class="input" type="time" id="et-time" value="${pad2(d.getHours())}:${pad2(d.getMinutes())}"></label>
    </div>
    <div class="row end" style="margin-top:16px"><button class="btn ghost" data-dlg="cancel">${L('算了', 'Cancel')}</button><button class="btn primary" data-dlg="save">${L('好', 'OK')}</button></div>`, {
    onOpen: (dl) => { dl.querySelector('[data-dlg="save"]').addEventListener('click', () => { dl.dataset.date = dl.querySelector('#et-date').value; dl.dataset.time = dl.querySelector('#et-time').value; }, { capture: true }); },
  });
  if (v !== 'save') return;
  const [y, mo, dd] = ($dlg.dataset.date || '').split('-').map(Number);
  const [hh, mm] = ($dlg.dataset.time || '').split(':').map(Number);
  const t = new Date(y, mo - 1, dd, hh || 0, mm || 0).getTime();
  if (!Number.isFinite(t)) return;
  const took = b.finishedAt - b.startedAt;
  b.finishedAt = Math.min(t, Date.now());
  b.startedAt = b.finishedAt - took;
  state.calSel = ymdInput(b.finishedAt);
  await saveBake(b);
  toast(L('日期改好了', 'Date updated'));
  rerender();
}

// 一炉一页的烘焙日记
async function viewLog(id) {
  const b = await getBake(id);
  if (!b) return notFound();
  state.calSel = ymdInput(b.finishedAt); // 返回日历时停在这一天
  const url = await photoUrl(b.photoId);
  const recipe = await getRecipe(b.recipeId);
  const all = await listBakes();
  const no = all.length - all.findIndex((x) => x.id === b.id);
  const d = new Date(b.finishedAt);
  const modeText = { update: L('已更新到原配方', 'Saved to recipe'), new: L('已另存为新配方', 'Saved as new recipe'), none: L('只记在这一次', 'This bake only') }[b.changeMode] || '';
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/logs/${d.getFullYear()}-${d.getMonth() + 1}" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1></h1></div>
  <div class="diary">
    <div class="date">${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div>
    <div class="wday">${weekday(d.getDay())}</div>
    ${shape(b.shape)}
    <div class="name">${esc(b.recipeName)}</div>
    <div class="photo">${url ? `<img src="${url}" alt="">` : `<div class="ph-empty">${shape(b.shape)}</div>`}${hanko(L('出炉', 'Baked'))}
      <label class="photo-change" aria-label="${L('换照片', 'Change photo')}">${icon('camera')}<span>${url ? L('换照片', 'Change') : L('加照片', 'Add photo')}</span><input type="file" accept="image/*" hidden data-act-change="replace-photo" data-id="${b.id}"></label></div>
    <div class="meta">${L(`${fmtTime(b.finishedAt)} 出炉 · 用时 ${fmtDur(b.finishedAt - b.startedAt)}`, `Out at ${fmtTime(b.finishedAt)} · took ${fmtDur(b.finishedAt - b.startedAt)}`)}${b.scale !== 1 ? ` · ×${b.scale}` : ''}${b.backfilled ? ` · ${L('补记', 'added later')}` : ''}
      <button class="link-btn edit-time" data-act="edit-bake-time" data-id="${b.id}">${icon('pencil')} ${L('改日期', 'Change date')}</button></div>
    ${ratingRow(b.rating, 'log-rate', b.id)}
  </div>

  <h2>${L('笔记', 'Notes')}</h2>
  <textarea class="input" data-l="${b.id}" placeholder="${L('组织怎么样？下次想调整什么？', 'How was the crumb? Anything to change next time?')}">${esc(b.notes)}</textarea>

  ${b.changes?.length ? `<h2>${L('这次的改动', 'Changes this time')} <span class="badge">${modeText}</span></h2>
    <ul class="diff">${b.changes.map((c) => `<li>${esc(c.t)}${c.old != null ? ` <span class="old">${esc(c.old)}</span>` : ''}</li>`).join('')}</ul>` : ''}

  <details style="margin-top:22px"><summary class="muted">${L('这一炉用的配方', 'Recipe used for this batch')}</summary>
    <div style="margin-top:8px">${ingTable(b.snapshot.ingredients, b.scale)}
    <ol class="steps" style="margin-top:12px">${b.snapshot.steps.map((st, i) => { const k = stepKind(st, i, b.snapshot.steps); return `<li class="k-${k}"><div class="stext">${stepHtml(st.text)}</div>${stepMeta(st, k)}</li>`; }).join('')}</ol></div>
  </details>

  <div class="row" style="margin-top:28px">
    ${recipe ? `<a class="btn sm" href="#/r/${recipe.id}">${icon('book')} ${L('去看配方', 'View recipe')}</a>
    <button class="btn sm primary" data-act="start-bake" data-id="${recipe.id}">${icon('oven')} ${L('再做一次', 'Bake again')}</button>` : ''}
    <span style="flex:1"></span>
    <button class="btn icon sm danger" data-act="delete-bake" data-id="${b.id}" aria-label="${L('删除', 'Delete')}">${icon('trash')}</button>
  </div>`;
}

// =====================================================================
// 桌面小组件（只在 iOS 原生 app 里）：我的店面（小）、配方架（中 / 大）、烘焙日历（中 / 大）
// 数据写进 App Group 给小组件读；插画就用 app 里的手绘 SVG，转成 PNG 一起存过去，小组件直接贴图
// =====================================================================

let widgetPlugin = null;
let widgetTimer = 0;
let widgetLast = '';
const widgetSent = new Set(); // 这次启动已经存过去的图

function scheduleWidgetSync() {
  if (!isNative()) return;
  clearTimeout(widgetTimer);
  widgetTimer = setTimeout(() => syncWidgets().catch((e) => console.warn('widget sync', e)), 1200);
}

// 把一张 SVG 画成 PNG（base64）。SVG 的颜色、滤镜写在 CSS 里，转图前先把算好的样式抄到每个元素上
async function svgToPng(markup, w, h, pad = 0) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${w}px;height:${h}px;pointer-events:none`;
  host.innerHTML = markup;
  document.body.appendChild(host);
  try {
    const svg = host.querySelector('svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    const els = [svg, ...svg.querySelectorAll('*')];
    const styles = els.map((el) => {
      const cs = getComputedStyle(el);
      const filter = (cs.filter.match(/#[\w-]+/) || [])[0];
      return [
        cs.display === 'none' ? 'display:none' : '',
        `fill:${cs.fill}`, `stroke:${cs.stroke}`, `stroke-width:${cs.strokeWidth}`,
        `opacity:${cs.opacity}`, `fill-opacity:${cs.fillOpacity}`, `stroke-opacity:${cs.strokeOpacity}`,
        cs.strokeDasharray !== 'none' ? `stroke-dasharray:${cs.strokeDasharray}` : '',
        filter ? `filter:url(${filter})` : '',
        el.tagName === 'text' ? `font-family:${cs.fontFamily};font-size:${cs.fontSize}` : '',
      ].filter(Boolean).join(';');
    });
    const out = svg.cloneNode(true);
    [out, ...out.querySelectorAll('*')].forEach((el, i) => { el.removeAttribute('class'); el.setAttribute('style', styles[i]); });
    out.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // 直接按 @3x 的尺寸画：iOS 的 WebKit 会先按 SVG 自己写的宽高把图栅格化、再拉伸到画布上，
    // 写成 1 倍大小再放大 3 倍就糊了（菜单栏、导航栏的图标、小组件的图都走这里）
    out.setAttribute('width', w * 3);
    out.setAttribute('height', h * 3);
    if (pad) {
      const [x, y, vw, vh] = out.getAttribute('viewBox').split(/[\s,]+/).map(Number);
      out.setAttribute('viewBox', `${x - vw * pad} ${y - vh * pad} ${vw * (1 + 2 * pad)} ${vh * (1 + 2 * pad)}`);
    }
    out.insertAdjacentHTML('afterbegin', `<defs>${document.getElementById('rough').outerHTML}${document.getElementById('crayon').outerHTML}</defs>`);
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(out));
    await img.decode();
    const k = 3; // 按 @3x 出图（和上面 SVG 的宽高一致）
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(h * k);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    host.remove();
  }
}

async function syncWidgets() {
  widgetPlugin ||= window.Capacitor.Plugins.WidgetBridge;
  const [recipes, bakes] = await Promise.all([listRecipes(), listBakes()]);
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const v = (k) => css.getPropertyValue(k).trim();
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const t = dark ? 'd' : 'l';

  // 用到哪些图：图名带上深浅色，换主题时会重新出一套
  const draw = {};
  const pic = (name, make) => { const key = `${name}-${t}`; if (!widgetSent.has(key)) draw[key] = make; return key; };
  const bread = (sh) => pic(`b-${String(sh || 'loaf').replace(/[^\w-]/g, '')}`, () => [shape(sh), 64, 64, 0.06]);
  const lv = levelOf(bakes.length);
  const look = lookOf(lv.lv, bakes.length);
  const sign = storefrontSign(look);
  const shopPic = pic(`shop${look}`, () => [storefront(look), 300, 300 * sign.vbH / sign.vbW]);

  const since = Date.now() - 45 * DAY; // 日历最多看这个月，留够 45 天
  const data = {
    colors: { paper: v('--paper'), card: v('--card'), ink: v('--ink'), soft: v('--ink-soft'), line: v('--line'), wood: v('--wood'), brown: v('--brown'), cocoa: v('--doodle') },
    shop: { lv: lv.lv, bakes: bakes.length, img: shopPic },
    rack: recipes.slice(0, 12).map((r) => ({ id: r.id, name: r.name, img: bread(r.shape), price: getPrice(r) != null ? formatPrice(getPrice(r)) : '' })),
    recipeCount: recipes.length,
    bakes: bakes.filter((b) => b.finishedAt >= since).map((b) => ({ t: b.finishedAt, id: b.id, img: bread(b.shape) })),
    weekdays: WEEK,
    months: MONTHS,
    text: {
      baked: L('次出炉', 'baked'),
      rack: L('配方架', 'Recipe shelf'),
      rackCount: L('%d 款', '%d'),
      emptyRack: L('配方架还空着', 'The shelf is empty'),
      monthCount: L('本月 %d 炉', '%d this month'),
    },
  };
  const json = JSON.stringify(data);
  const keys = Object.keys(draw);
  if (json === widgetLast && !keys.length) return;
  const images = {};
  for (const key of keys) images[key] = await svgToPng(...draw[key]());
  await widgetPlugin.update({ json, images });
  keys.forEach((k) => widgetSent.add(k));
  widgetLast = json;
}

// 点小组件打开 app：bakerydays://route/r/xxx → #/r/xxx
async function listenWidgetRoutes() {
  if (!isNative()) return;
  widgetPlugin ||= window.Capacitor.Plugins.WidgetBridge;
  const goTo = (hash) => {
    // 模拟器里没法真的折 Duo：用链接假装一个姿势来测试（xcrun simctl openurl booted bakerydays://route/test-posture/stand）
    const fake = hash?.match(/^#\/test-posture\/(\w+)$/);
    if (fake) return testPosture(fake[1]);
    if (hash && hash !== location.hash) location.hash = hash;
  };
  await widgetPlugin.addListener('route', (e) => goTo(e.hash));
  goTo((await widgetPlugin.takeRoute()).hash);
}

// =====================================================================
// 设置
// =====================================================================

function viewSettings() {
  const perm = permissionState();
  const permText = { granted: L('已开启', 'On'), denied: L('已关闭', 'Off'), default: L('未开启', 'Not set'), unsupported: L('不支持', 'Not supported') }[perm];
  const theme = document.documentElement.dataset.theme || 'auto';
  const chips = (act, cur, list) => list.map(([k, l]) => `<button class="chip ${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}">${l}</button>`).join('');
  return `
  <div class="topbar"><a class="btn icon ghost" href="#/" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1>${L('店务', 'Settings')}</h1></div>
  <div class="stack">
    <div class="card"><div class="row"><div class="grow"><b>${L('店名', 'Shop name')}</b><div class="small muted">${esc(state.shop.name)}</div></div>
      <button class="btn sm" data-act="rename-shop">${L('改名', 'Rename')}</button></div></div>
    <div class="card alt"><div class="row"><div class="grow"><b>${L('计时提醒', 'Timer alerts')}</b><div class="small muted">${permText}</div></div>
      ${perm === 'default' ? `<button class="btn sm" data-act="notify-perm">${L('开启', 'Turn on')}</button>` : ''}<button class="btn sm" data-act="test-sound">${icon('bell')} ${L('试听', 'Test')}</button></div>
      <p class="small muted" style="margin:6px 0 0">${isNative() ? L('锁屏或关掉 app 也会准时提醒', 'Alerts even when locked or closed') : L('加到主屏幕后，后台也会响', 'Add to Home Screen to hear it in the background')}</p></div>
    <div class="card"><div class="row"><div class="grow"><b>${L('语言', 'Language')}</b></div>${chips('lang', getLang(), [['zh', '中文'], ['en', 'English']])}</div></div>
    <div class="card alt"><div class="row"><div class="grow"><b>${L('价签货币', 'Currency')}</b></div>${chips('currency', getCurrency(), [['CNY', L('¥ 人民币', '¥ CNY')], ['USD', L('$ 美元', '$ USD')]])}</div></div>
    <div class="card"><div class="row"><div class="grow"><b>${L('外观', 'Look')}</b></div>
      ${chips('theme', theme, [['auto', L('跟随系统', 'Auto')], ['light', L('白纸', 'Paper')], ['dark', L('黑板', 'Chalkboard')]])}</div></div>
    <div class="card"><b>${L('备份', 'Backup')}</b><p class="small muted" style="margin:2px 0 10px">${L('数据只存在这台设备上，换手机前记得导出。', 'Data lives only on this device. Export before switching phones.')}</p>
      <div class="row"><button class="btn sm" data-act="export-all">${icon('download')} ${L('导出备份', 'Export')}</button>
      <label class="btn sm">${icon('upload')} ${L('从备份恢复', 'Restore')}<input type="file" accept=".json,application/json" hidden data-act-change="import-all"></label></div></div>
  </div>
  <p class="center small muted" style="margin-top:28px">${esc(APP_NAME())} · ${L('经营你的小面包店', 'run your own little bakery')}</p>`;
}

function notFound() {
  return `<div class="topbar"><a class="btn icon ghost" href="#/" aria-label="${L('返回', 'Back')}">${icon('back')}</a><h1></h1></div>
    <div class="empty">${emptyShelf()}<p>${L('找不到了，可能已经被删掉', 'Can’t find it. It may have been deleted')}</p></div>`;
}

// =====================================================================
// 事件
// =====================================================================

// 烘焙页上的操作都作用在地址里的那一炉
function withSession(fn) {
  return (el, e) => {
    const s = routeSession();
    if (!s) return;
    fn(s, el, e);
    persistSessions();
    rerender();
  };
}

const actions = {
  'roadmap'() { showRoadmap(); },
  // 补记一炉
  'bf-recipe'(el) { backfillDraft().recipeId = el.dataset.id; rerender(); },
  'bf-rate'(el) { backfillDraft().rating = Number(el.dataset.v); rerender(); },
  'bf-save'(el) { el.disabled = true; saveBackfill().finally(() => { el.disabled = false; }); },
  async 'backfill-cancel'() {
    const f = state.backfill;
    if (f?.photoId) await db.del('photos', f.photoId); // 没存下来的照片别留着占地方
    state.backfill = null;
  },
  'edit-bake-time'(el) { editBakeTime(el.dataset.id); },
  'cal-day'(el) { state.calSel = el.dataset.day; rerender(); },
  async 'catalog-take'(el) {
    const r = await getRecipe(el.dataset.id);
    if (!r) return;
    if (!(await confirmDlg(L('换成新版配方？', 'Switch to the new version?'), L('你对这款配方的改动会被新版覆盖，价签和做过的记录都保留。', 'Your edits to this recipe will be replaced. Price tag and bake history stay.'), L('换成新版', 'Use new')))) return;
    await takeCatalogUpdate(r, getLang());
    toast(L('已换成新版', 'Updated'));
    rerender();
  },
  async 'catalog-skip'(el) {
    const r = await getRecipe(el.dataset.id);
    if (r) { await skipCatalogUpdate(r); rerender(); }
  },
  // 升级路线里已解锁的等级：点开看大图
  async 'level-view'(el) {
    const lv = Number(el.dataset.lv);
    const listTop = el.closest('ol')?.scrollTop || 0;
    const n = (await listBakes()).length;
    const top = levelOf(n).lv;
    const using = lookOf(top, n) === lv;
    // 已经在用这个：最高级就不用多一个按钮；不是最高级就给「换回跟着等级走」
    const pick = using
      ? (lv === top ? '' : `<button class="btn primary" data-dlg="follow">${L('换回最新的店面', 'Back to the latest shop')}</button>`)
      : `<button class="btn primary" data-dlg="use">${L('就用这个店面', 'Use this shop')}</button>`;
    const v = await dialog(`<div class="level-big">
      ${shopFront(lv, state.shop.name, true)}
      <h3>${secretOf(lv) ? `${L('隐藏款', 'Secret')} · ${lookName(lv)}` : `Lv.${lv} ${lvName(lv - 1)}`}</h3>
      <p class="small muted">${lookDesc(lv)}</p>
      <div class="row" style="justify-content:center"><button class="btn" data-dlg="back">${icon('back')} ${L('升级路线', 'Road map')}</button>${pick || `<button class="btn primary" data-dlg="ok">${L('好', 'OK')}</button>`}</div>
    </div>`);
    if (v === 'use' || v === 'follow') {
      // 选最高级 = 跟着等级走（以后升级了自动换新店面）
      state.shop.look = v === 'use' && lv !== top ? lv : null;
      await saveShop(state.shop);
      rerender();
      scheduleWidgetSync();
    } else if (v === 'back') showRoadmap(listTop);
  },
  async 'rename-shop'() {
    const name = await promptDlg(L('给小店起个名字', 'Name your shop'), state.shop.name);
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
    if (await confirmDlg(L('删除这个配方？', 'Delete this recipe?'), L('已经出炉的作品记录会保留。', 'Your past bakes will be kept.'), L('删除', 'Delete'), true)) {
      await deleteRecipe(el.dataset.id);
      toast(L('配方已下架', 'Recipe removed'));
      go('#/recipes');
    }
  },
  async 'share-recipe'(el) {
    const r = await getRecipe(el.dataset.id);
    const text = recipeToText(r);
    try {
      if (nativeTabs) await nativeTabs.share({ title: r.name, text });
      else if (navigator.share) await navigator.share({ title: r.name, text });
      else { await navigator.clipboard.writeText(text); toast(L('配方文字已复制', 'Recipe copied')); }
    } catch { /* 用户取消分享 */ }
  },

  // 编辑配方
  'cancel-edit'() { state.draft = null; state.draftFor = null; },
  'set-shape'(el) { state.draft.shape = el.dataset.v; rerender(); },
  'dice-price'() { state.draft.prices = { ...(state.draft.prices || {}), [getCurrency()]: randomPrice(state.draft.shape) }; rerender(); },
  async 'edit-price'(el) {
    const r = await getRecipe(el.dataset.id);
    if (!r) return;
    const v = await dialog(`<h3>${L('改价签', 'Edit price tag')}</h3>
      <div class="row price-f"><span class="mono">${currencySymbol()}</span><input class="input num" data-dlg-input type="number" inputmode="decimal" step="any" min="0" value="${esc(String(getPrice(r) ?? ''))}">
        <button type="button" class="link-btn" data-dice>${icon('dice')} ${L('随机', 'Roll')}</button></div>
      <div class="row end" style="margin-top:16px"><button class="btn ghost" data-dlg="cancel">${L('算了', 'Cancel')}</button><button class="btn primary" data-dlg="ok">${L('好', 'OK')}</button></div>`, {
      onOpen: (d) => { d.querySelector('[data-dice]').onclick = () => { d.querySelector('[data-dlg-input]').value = randomPrice(r.shape); }; },
    });
    if (v == null || v === 'cancel' || v.trim() === '' || Number.isNaN(Number(v))) return;
    await setPrice(r.id, Math.max(0, Number(v)));
    rerender();
  },
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
    if (!d.name.trim()) { toast(L('先给配方起个名字', 'Give the recipe a name first')); return; }
    d.ingredients = d.ingredients.filter((i) => i.name.trim());
    d.steps = d.steps.filter((s) => s.text.trim());
    const saved = await saveRecipe(d);
    state.draft = null; state.draftFor = null;
    toast(L('配方已上架', 'Recipe is on the shelf'));
    go(`#/r/${saved.id}`);
  },
  async 'copy-ai-prompt'() {
    try { await navigator.clipboard.writeText(AI_PROMPT()); toast(L('已复制，去 AI 助手那里粘贴吧', 'Copied: paste it into your AI assistant')); }
    catch { toast(L('复制失败，长按上面的文字手动复制', 'Couldn’t copy: long-press the text to copy it')); }
  },
  'parse-import'() {
    const text = document.getElementById('import-text').value;
    if (!text.trim()) { toast(L('先粘贴一段食谱', 'Paste a recipe first')); return; }
    const p = parseRecipeText(text);
    state.draft = {
      ...p,
      shape: guessShape(p.name),
      yield: '',
      ingredients: p.ingredients.map((i) => ({ ...i, id: uid() })),
      steps: p.steps.map((s) => ({ ...s, id: uid() })),
    };
    state.draftFor = 'new';
    toast(L(`认出 ${p.ingredients.length} 种材料、${p.steps.length} 个步骤`, `Found ${p.ingredients.length} ingredients and ${p.steps.length} steps`));
    go('#/edit/new');
  },

  // 烘焙中
  'toggle-ing': withSession((s, el) => {
    const c = s.checked;
    const i = c.indexOf(el.dataset.id);
    if (i >= 0) c.splice(i, 1); else c.push(el.dataset.id);
    // 勾完最后一样就自动收起来
    if (s.recipe.ingredients.every((x) => c.includes(x.id))) s.ingOpen = false;
  }),
  'ing-fold': withSession((s, el) => { s.ingOpen = el.dataset.v === '1'; }),
  'focus-step': withSession((s, el) => {
    const i = Number(el.dataset.i);
    const st = s.recipe.steps[i];
    s.doneSteps = s.doneSteps.filter((id) => id !== st.id);
    s.current = i;
  }),
  'step-ahead': withSession((s) => { stepAhead(s); }),
  'step-done': withSession((s, el) => {
    s.timers = s.timers.filter((t) => t.stepId !== el.dataset.id); // 这一步完成了，它的计时也一起结束
    completeStep(s, el.dataset.id);
  }),
  'timer-start': withSession((s, el) => {
    unlockAudio();
    const st = s.recipe.steps.find((x) => x.id === el.dataset.id);
    if (!isTimed(st)) return;
    s.timers = s.timers.filter((t) => t.stepId !== st.id);
    s.timers.push(createTimer({ label: st.text.slice(0, 20) || L('计时', 'Timer'), minutes: stepMin(st), stepId: st.id }));
    s.current = s.recipe.steps.indexOf(st);
    askNotifyPermission();
  }),
  'timer-pause': withSession((s, el) => pauseTimer(findTimer(s, el))),
  'timer-resume': withSession((s, el) => resumeTimer(findTimer(s, el))),
  'timer-add': withSession((s, el) => { addMinutes(findTimer(s, el), 5); stopRinging(); }),
  'timer-stop': withSession((s, el) => { s.timers = s.timers.filter((t) => t.id !== el.dataset.id); stopRinging(); }),
  'scale': withSession((s, el) => { s.scale = Number(el.dataset.v); }),
  'bake-edit-toggle': withSession((s) => { s.editing = !s.editing; }),
  'bake-add-ing': withSession((s) => { s.recipe.ingredients.push({ id: uid(), name: '', amount: null, unit: 'g', note: '' }); }),
  'bake-del-ing': withSession((s, el) => { s.recipe.ingredients = s.recipe.ingredients.filter((i) => i.id !== el.dataset.id); }),
  'bake-add-step': withSession((s) => { s.recipe.steps.push({ id: uid(), text: '', minutes: null, kind: 'other' }); }),
  'bake-del-step': withSession((s, el) => {
    s.recipe.steps = s.recipe.steps.filter((x) => x.id !== el.dataset.id);
    s.timers = s.timers.filter((t) => t.stepId !== el.dataset.id);
    s.current = Math.min(s.current, s.recipe.steps.length);
  }),
  'go-finish'() {
    const s = routeSession();
    if (!s) return;
    s.editing = false;
    s.recipe.ingredients = s.recipe.ingredients.filter((i) => i.name.trim());
    s.recipe.steps = s.recipe.steps.filter((x) => x.text.trim());
    persistSessions();
    go(`#/finish/${s.id}`);
  },
  async 'abandon'() {
    const s = routeSession();
    if (!s) return;
    if (!(await confirmDlg(L('放弃这一炉？', 'Give up this batch?'), L('计时和这次的改动都会丢掉。', 'Its timers and changes will be lost.'), L('放弃', 'Give up'), true))) return;
    state.sessions = state.sessions.filter((x) => x.id !== s.id);
    if (!allTimers().some((t) => t.done)) stopRinging();
    await persistSessions();
    go('#/');
  },

  // 出炉
  'rate'(el) { const s = routeSession(); if (s) { finishDraft(s.id).rating = Number(el.dataset.v); persistSessions(); rerender(); } },
  'save-bake'(el) { el.disabled = true; saveFinish(); },

  // 作品
  async 'log-rate'(el) {
    const b = await getBake(el.dataset.id);
    b.rating = Number(el.dataset.v);
    await saveBake(b); rerender();
  },
  async 'delete-bake'(el) {
    if (await confirmDlg(L('撕掉这张照片？', 'Tear off this photo?'), L('这条出炉记录会被删除。', 'This bake record will be deleted.'), L('删除', 'Delete'), true)) {
      await deleteBake(el.dataset.id);
      go('#/logs');
    }
  },

  // 设置
  async 'notify-perm'() {
    const p = await askNotifyPermission();
    toast(p === 'granted' ? L('通知已开启', 'Alerts on') : L('没有拿到通知权限', 'Permission not granted'));
    rerender();
  },
  'test-sound'() { playChime(); notify(L('⏰ 试一下', '⏰ Test'), L('时间到的时候会这样提醒你', 'This is how timers will alert you')); },
  'theme'(el) {
    const v = el.dataset.v;
    if (v === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = v;
    try { localStorage.setItem('baker-theme', v); } catch { /* 无痕模式 */ }
    rerender();
  },
  async 'lang'(el) {
    setLang(el.dataset.v);
    await syncCatalog();
    document.title = APP_NAME();
    renderTabs('shop');
    renderTabClock();
    rerender();
  },
  'currency'(el) { setCurrency(el.dataset.v); rerender(); },
  async 'export-all'() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${L('面包物语备份', 'bakery-days-backup')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};

const changeActions = {
  async 'pick-photo'(el) {
    const file = el.files?.[0];
    el.value = '';
    if (file) await setFinishPhoto(file);
  },
  async 'replace-photo'(el) {
    const file = el.files?.[0];
    el.value = '';
    if (file) await replaceLogPhoto(el.dataset.id, file);
  },
  async 'bf-photo'(el) {
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    const f = backfillDraft();
    let blob;
    try { blob = await editPhoto(file); } catch { return toast(L('这张照片读不了，换一张试试', 'Couldn’t read that photo, try another')); }
    if (!blob) return;
    state.photoBusy = true; rerender();
    try {
      const id = await savePhoto(blob);
      if (f.photoId) await db.del('photos', f.photoId);
      f.photoId = id;
    } catch { toast(L('这张照片读不了，换一张试试', 'Couldn’t read that photo, try another')); }
    state.photoBusy = false; rerender();
  },

  'mode'(el) { const s = routeSession(); if (s) { finishDraft(s.id).mode = el.value; persistSessions(); } },
  async 'import-all'(el) {
    const file = el.files?.[0];
    if (!file) return;
    try {
      await importAll(JSON.parse(await file.text()));
      state.shop = await getShop();
      toast(L('备份已恢复', 'Backup restored'));
      go('#/');
    } catch (e) { toast(e.message || L('文件读不了', 'Can’t read that file')); }
  },
};

// ---------- 照片 ----------

// 选完照片先调一下：方框就是作品墙 / 日记里显示的样子（都是正方形），拖动挪位置、双指缩放、双指拧旋转；
// 原生 app 里还能一键抠图（系统的主体识别，背景变透明）。点「算了」返回 null，什么都不改
async function editPhoto(file) {
  const base = await compressImage(file, 1600, 0.9);
  const cutter = isNative() ? window.Capacitor?.Plugins?.PhotoCutout : null;
  const plainUrl = URL.createObjectURL(base);
  const img = new Image();
  img.src = plainUrl;
  try { await img.decode(); } catch { URL.revokeObjectURL(plainUrl); throw new Error('bad image'); }
  const W = img.naturalWidth, H = img.naturalHeight;
  const st = { F: 300, z: 1, x: 0, y: 0, r: 0, cut: false, cutUrl: '' };
  let $img;
  const minZ = () => (st.cut ? 0.4 : 1);
  // 转了角度以后，照片要比方框大一圈才盖得住四个角：方框转到照片的方向上，宽高都变成 F·(|cos|+|sin|)
  const span = () => st.F * (Math.abs(Math.cos(st.r)) + Math.abs(Math.sin(st.r)));
  const scale = () => Math.max(span() / W, span() / H) * st.z;
  // 不抠图时照片要铺满方框（不露底）：在照片自己的方向上限制挪动；抠图后可以缩小，只要别整个拖出框外
  const clamp = () => {
    const s = scale();
    if (st.cut) {
      const m = Math.max(W, H) * s / 2 + st.F / 4;
      st.x = Math.max(-m, Math.min(m, st.x));
      st.y = Math.max(-m, Math.min(m, st.y));
      return;
    }
    const c = Math.cos(st.r), n = Math.sin(st.r);
    const eu = Math.max(0, (W * s - span()) / 2), ev = Math.max(0, (H * s - span()) / 2);
    const u = Math.max(-eu, Math.min(eu, st.x * c + st.y * n));
    const v = Math.max(-ev, Math.min(ev, -st.x * n + st.y * c));
    st.x = u * c - v * n;
    st.y = u * n + v * c;
  };
  const draw = () => {
    clamp();
    const s = scale();
    $img.style.width = `${W * s}px`;
    $img.style.height = `${H * s}px`;
    $img.style.transform = `translate(${st.F / 2 + st.x}px, ${st.F / 2 + st.y}px) rotate(${st.r}rad) translate(${-W * s / 2}px, ${-H * s / 2}px)`;
  };
  const html = `<div class="photo-edit">
    <h3>${L('调整照片', 'Adjust photo')}</h3>
    <p class="small muted">${L('拖动挪位置，双指缩放、拧一拧可以旋转', 'Drag to move, pinch to zoom, twist to rotate')}</p>
    <div class="pe-frame"><img class="pe-img" alt="" draggable="false" src="${plainUrl}"></div>
    <div class="row pe-opts">
      ${cutter ? `<button class="btn sm" data-pe="cut"><span>${L('抠图', 'Cut out')}</span></button>` : ''}
      <button class="btn sm ghost" data-pe="reset">${L('复位', 'Reset')}</button>
    </div>
    <div class="row end"><button class="btn ghost" data-dlg="cancel">${L('算了', 'Cancel')}</button><button class="btn primary" data-dlg="ok">${L('用这张', 'Use it')}</button></div>
  </div>`;
  const v = await dialog(html, { onOpen: (d) => {
    const frame = d.querySelector('.pe-frame');
    $img = d.querySelector('.pe-img');
    st.F = frame.clientWidth || 300;
    draw();
    // 拖动 + 双指缩放
    const pts = new Map();
    let last = null;
    let free = 0; // 双指拧的真实角度（显示的角度靠近 90° 的整数倍时会吸附过去）
    const QUARTER = Math.PI / 2;
    const snap = (a) => { const q = Math.round(a / QUARTER) * QUARTER; return Math.abs(a - q) < 0.07 ? q : a; };
    const pinch = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x) }; };
    frame.addEventListener('pointerdown', (e) => { frame.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); last = pts.size === 2 ? pinch() : null; free = st.r; });
    frame.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      if (pts.size === 1) { st.x += e.clientX - p.x; st.y += e.clientY - p.y; }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) {
        const now = pinch();
        if (last) {
          st.z = Math.max(minZ(), Math.min(4, st.z * now.d / last.d));
          let da = now.a - last.a;
          if (da > Math.PI) da -= 2 * Math.PI;
          if (da < -Math.PI) da += 2 * Math.PI;
          free += da;
          st.r = snap(free);
        }
        last = now;
      }
      draw();
    });
    const up = (e) => { pts.delete(e.pointerId); last = pts.size === 2 ? pinch() : null; free = st.r; };
    frame.addEventListener('pointerup', up);
    frame.addEventListener('pointercancel', up);
    frame.addEventListener('wheel', (e) => { e.preventDefault(); st.z = Math.max(minZ(), Math.min(4, st.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))); draw(); }, { passive: false });
    d.querySelector('[data-pe="reset"]').addEventListener('click', () => { st.z = 1; st.x = 0; st.y = 0; st.r = 0; draw(); });
    const cutBtn = d.querySelector('[data-pe="cut"]');
    cutBtn?.addEventListener('click', async () => {
      if (cutBtn.disabled) return;
      if (!st.cut && !st.cutUrl) {
        cutBtn.disabled = true;
        cutBtn.querySelector('span').textContent = L('抠图中…', 'Cutting out…');
        try {
          const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(base); });
          const { data } = await cutter.cutout({ data: b64 });
          st.cutUrl = `data:image/png;base64,${data}`;
        } catch { toast(L('没找到能抠出来的东西，换个角度拍试试', 'Couldn’t find a subject to cut out')); }
        cutBtn.disabled = false;
        cutBtn.querySelector('span').textContent = L('抠图', 'Cut out');
        if (!st.cutUrl) return;
      }
      st.cut = !st.cut;
      cutBtn.classList.toggle('primary', st.cut);
      frame.classList.toggle('cut', st.cut);
      $img.src = st.cut ? st.cutUrl : plainUrl;
      await $img.decode().catch(() => {});
      if (!st.cut && st.z < 1) st.z = 1;
      draw();
    });
  } });
  if (v !== 'ok') { URL.revokeObjectURL(plainUrl); return null; }
  // 按方框里看到的样子出一张 1200×1200 的图：抠过的存 PNG（留着透明背景），没抠的存 JPEG
  const N = 1200, k = N / st.F, s = scale();
  const canvas = document.createElement('canvas');
  canvas.width = N; canvas.height = N;
  const ctx = canvas.getContext('2d');
  ctx.translate((st.F / 2 + st.x) * k, (st.F / 2 + st.y) * k);
  ctx.rotate(st.r);
  ctx.drawImage($img, -W * s / 2 * k, -H * s / 2 * k, W * s * k, H * s * k);
  const blob = await new Promise((res) => canvas.toBlob(res, st.cut ? 'image/png' : 'image/jpeg', 0.85));
  canvas.width = 0; canvas.height = 0;
  URL.revokeObjectURL(plainUrl);
  return blob || base;
}

async function setFinishPhoto(file) {
  const s = routeSession();
  if (!s) return;
  const f = finishDraft(s.id);
  let blob;
  try { blob = await editPhoto(file); } catch { return toast(L('这张照片读不了，换一张试试', 'Couldn’t read that photo, try another')); }
  if (!blob) return;
  state.photoBusy = true; rerender();
  try {
    const old = f.photoId;
    f.photoId = await savePhoto(blob);
    if (old) await db.del('photos', old);
    await persistSessions();
  } catch { toast(L('这张照片读不了，换一张试试', 'Couldn’t read that photo, try another')); }
  state.photoBusy = false;
  rerender();
}

async function replaceLogPhoto(id, file) {
  try {
    const blob = await editPhoto(file);
    if (!blob) return;
    const b = await getBake(id);
    const photoId = await savePhoto(blob);
    if (b.photoId) await db.del('photos', b.photoId);
    b.photoId = photoId;
    await saveBake(b);
  } catch { toast(L('这张照片读不了，换一张试试', 'Couldn’t read that photo, try another')); }
  rerender();
}

// 把一步标成完成，跳到下一个没做的步骤
// 把一步标成完成，然后往后找下一个没做的步骤；后面都做完了，再回头找前面没做完的（比如还在发酵的那一步）
function completeStep(s, stepId) {
  if (!s.doneSteps.includes(stepId)) s.doneSteps.push(stepId);
  const steps = s.recipe.steps;
  const from = steps.findIndex((st) => st.id === stepId);
  let next = steps.findIndex((st, i) => i > from && !s.doneSteps.includes(st.id));
  if (next < 0) next = steps.findIndex((st) => !s.doneSteps.includes(st.id));
  s.current = next < 0 ? steps.length : next;
  if (next < 0) toast(L('全部步骤完成，可以出炉了！', 'All steps done. Time to take it out!'));
}

// 边等边做：发酵 / 烘烤的计时留在后台继续走，先去做后面的步骤
function stepAhead(s) {
  const steps = s.recipe.steps;
  const busy = (st) => s.doneSteps.includes(st.id) || s.timers.some((t) => t.stepId === st.id && !t.done);
  const next = steps.findIndex((st, i) => i > s.current && !busy(st));
  if (next < 0) { toast(L('后面没有能先做的步骤了', 'Nothing left to do ahead')); return false; }
  s.current = next;
  return true;
}

function findTimer(s, el) {
  return s.timers.find((t) => t.id === el.dataset.id);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && actions[el.dataset.act]) {
    if (el.tagName === 'BUTTON' || el.tagName === 'LI' || el.dataset.act === 'focus-step') e.preventDefault();
    actions[el.dataset.act](el, e);
    return;
  }
  const nav = e.target.closest('[data-go]');
  if (nav) location.replace(nav.dataset.go);
});

// 记下最近一次点「选照片」的时间：从相机回来时不做版本检查，不刷新
let lastFilePick = 0;
document.addEventListener('click', (e) => { if (e.target.closest('input[type=file], label:has(input[type=file])')) lastFilePick = Date.now(); }, true);

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-act-change]');
  if (el) changeActions[el.dataset.actChange]?.(el, e);
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.d != null && state.draft) applyField(state.draft, el.dataset.d, el.value);
  else if (el.dataset.s != null && routeSession()) {
    const s = routeSession();
    let v = el.value;
    if (/\.amount$/.test(el.dataset.s) && v !== '') v = String(Number(v) / s.scale);
    applyField(s.recipe, el.dataset.s, v);
    persistSessions(400);
  } else if (el.dataset.bf != null) {
    const f = backfillDraft();
    f[el.dataset.bf] = el.value;
    if (el.dataset.bf === 'date') f.touched = true;
  } else if (el.dataset.f != null) { const s = routeSession(); if (s) { finishDraft(s.id)[el.dataset.f] = el.value; persistSessions(400); } }
  else if (el.dataset.actInput === 'filter') {
    if (e.isComposing) return; // 拼音还没选字，别动输入框，选完字会有 compositionend
    filterRack(el.value);
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

// 配方架搜索：只换下面的结果，输入框本身不重画——不然中文输入法打到一半就被打断、字被截掉
function filterRack(value) {
  state.filter = value;
  clearTimeout(filterTimer);
  filterTimer = setTimeout(async () => {
    const r = resolve(location.hash || '#/');
    const html = r && await r.view(...r.args);
    const box = document.getElementById('rack-results');
    if (!box || !location.hash.match(/^#\/(recipes|r\/)/)) return;
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const next = tpl.content.getElementById('rack-results');
    if (next) box.replaceWith(next);
  }, 200);
}
// 从屏幕左边缘往右滑 = 点左上角的返回（和 iOS 一样）：
// 手指一碰到边缘，就把要回去的那一页先画在底下（稍微往左错开、压暗一点），当前页跟着手指往右走；
// 松手过三分之一或者甩得快就返回，不然弹回。返回走的是每页自己的返回按钮（编辑页放弃草稿等逻辑不变），
// 等新页面真正画出来了才把底下那层撤掉，所以中间不会闪回旧页、也不会露出空白底色
let edge = null;
const backLink = () => document.querySelector('#app .topbar > a.btn.icon:first-child');
const UNDER_SHIFT = 0.3; // 底下那页一开始往左错开屏宽的 30%

function edgeSetup(link) {
  const e = { x: 0, y: 0, t: 0, dx: 0, on: false, under: null, dim: null };
  const href = link.getAttribute('href');
  const r = href && resolve(href);
  if (r) {
    Promise.resolve(r.view(...r.args)).then((html) => {
      if (edge !== e || html == null) return;
      const under = document.createElement('div');
      under.className = isWide(html) ? 'under wide' : 'under';
      under.innerHTML = html;
      const dim = document.createElement('div');
      dim.className = 'under-dim';
      e.under = under; e.dim = dim;
      if (e.on) { document.body.prepend(dim); document.body.prepend(under); edgePaint(e); }
    }).catch(() => {});
  }
  return e;
}
function edgePaint(e) {
  const p = Math.min(1, e.dx / innerWidth);
  $app.style.transform = `translate3d(${e.dx}px,0,0)`;
  if (e.under) e.under.style.transform = `translate3d(${-(1 - p) * UNDER_SHIFT * innerWidth}px,0,0)`;
  if (e.dim) e.dim.style.opacity = String(1 - p);
}
function edgeCleanup(e) {
  $app.classList.remove('dragging');
  $app.style.transition = ''; $app.style.transform = '';
  e.under?.remove(); e.dim?.remove();
}

document.addEventListener('touchstart', (ev) => {
  const p = ev.touches[0];
  const link = ev.touches.length === 1 && p.clientX < 28 && !document.querySelector('dialog[open]') && !edge?.leaving && backLink();
  if (!link) { if (!edge?.leaving) edge = null; return; }
  edge = edgeSetup(link);
  Object.assign(edge, { x: p.clientX, y: p.clientY, t: Date.now() });
}, { passive: true });

document.addEventListener('touchmove', (ev) => {
  if (!edge || edge.leaving) return;
  const p = ev.touches[0];
  const dx = p.clientX - edge.x, dy = p.clientY - edge.y;
  if (!edge.on) {
    if (Math.abs(dy) > 12 && Math.abs(dy) > dx) { edge = null; return; } // 是在上下滚
    if (dx < 8) return;
    edge.on = true;
    $app.classList.add('dragging');
    if (edge.under) { document.body.prepend(edge.dim); document.body.prepend(edge.under); }
  }
  ev.preventDefault(); // 横着拖的时候别让页面跟着上下滚
  edge.dx = Math.max(0, dx);
  edgePaint(edge);
}, { passive: false });

function edgeEnd() {
  const e = edge;
  if (!e || e.leaving) return;
  if (!e.on) { edge = null; return; }
  const back = e.dx > innerWidth * 0.33 || (e.dx > 40 && e.dx / (Date.now() - e.t) > 0.45);
  const ease = 'transform .26s cubic-bezier(.2,.8,.3,1)';
  $app.style.transition = ease;
  if (e.under) { e.under.style.transition = ease; e.dim.style.transition = 'opacity .26s'; }
  if (!back) {
    e.dx = 0; edgePaint(e);
    setTimeout(() => { edgeCleanup(e); if (edge === e) edge = null; }, 270);
    return;
  }
  e.leaving = true;
  e.dx = innerWidth; edgePaint(e);
  setTimeout(() => {
    // 新页面画出来（#app 内容被换掉）再收尾；万一没换（比如还在原页）就 1 秒后兜底
    const done = () => { mo.disconnect(); clearTimeout(fallback); edgeCleanup(e); if (edge === e) edge = null; };
    const mo = new MutationObserver(done);
    mo.observe($app, { childList: true });
    const fallback = setTimeout(done, 1000);
    backLink()?.click();
  }, 270);
}
document.addEventListener('touchend', edgeEnd, { passive: true });
document.addEventListener('touchcancel', edgeEnd, { passive: true });

// 日历页：左右滑动翻月份（往左滑看下个月），翻的时候轻轻震一下
let swipe = null;
document.addEventListener('touchstart', (e) => {
  swipe = location.hash.startsWith('#/logs') && e.touches.length === 1
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  if (!swipe) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
  const fast = Date.now() - swipe.t < 600;
  swipe = null;
  if (!fast || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  const btn = document.querySelectorAll('.cal-head .m button')[dx < 0 ? 1 : 0];
  if (!btn || btn.disabled) return; // 已经是这个月了，不往后翻
  state.calSlide = dx < 0 ? 'next' : 'prev';
  haptic();
  go(btn.dataset.go);
}, { passive: true });

document.addEventListener('compositionend', (e) => {
  if (e.target.dataset?.actInput === 'filter') filterRack(e.target.value);
});

// 在烘焙页里改了配方并且编辑框失焦时，马上存一下
document.addEventListener('focusout', (e) => {
  if (e.target.dataset?.s != null && location.hash.startsWith('#/bake/')) persistSessions();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { tick(); keepAwake(location.hash.startsWith('#/bake/')); }
});

// =====================================================================
// 启动
// =====================================================================

// 内置配方：先用手上的目录（app 自带的或上次存下的）放上架；再悄悄去线上看一眼有没有新版
async function syncCatalog() {
  await mergeCatalog(await currentCatalog(), getLang());
}
async function checkCatalogOnline(force = false) {
  const fresh = await refreshCatalog(force).catch(() => null);
  if (!fresh) return;
  if (await mergeCatalog(fresh, getLang())) {
    // 只在看配方的页面上刷新，别打断烘焙
    if (/^#?\/?$|^#\/recipes|^#\/r\//.test(location.hash || '#/')) rerender();
  }
}

async function boot() {
  try {
    const t = localStorage.getItem('baker-theme');
    if (t && t !== 'auto') document.documentElement.dataset.theme = t;
  } catch { /* 无痕模式 */ }
  setLang(getLang());
  document.title = APP_NAME();

  state.shop = await getShop();
  if (!(await db.getKv('shop'))) await saveShop(state.shop);
  await syncCatalog();
  state.sessions = await getSessions();
  for (const s of state.sessions) s.editing = false;
  await refreshPermission();
  syncNativeAlarms(nativeAlarms());

  window.addEventListener('hashchange', route);
  await route();
  listenWidgetRoutes().catch((e) => console.warn('widget routes', e));
  checkCatalogOnline();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkCatalogOnline(); });
  setInterval(tick, 1000);
  tick();
  // app 的字体（小赖字体）尽早在后台下好
  setTimeout(() => document.fonts?.load?.('16px AppFont', '面包').catch(() => {}), 1500);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // 新版本接管后，等手上没事的时候再刷新一次（不在拍照、烘焙、编辑这些页面上刷，免得打断）。第一次安装不刷
    const hadController = !!navigator.serviceWorker.controller;
    let pending = false;
    const busy = () => /^#\/(bake|finish|edit|import|backfill)/.test(location.hash) || state.photoBusy || Date.now() - lastFilePick < 120000;
    const tryReload = () => { if (pending && !busy()) { pending = false; location.reload(); } };
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) { pending = true; tryReload(); } });
    window.addEventListener('hashchange', tryReload);
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      // 从后台切回来时也检查一下有没有新版本（刚去拍过照就先不查）
      document.addEventListener('visibilitychange', () => { if (!document.hidden && !busy()) reg.update().catch(() => {}); });
    }).catch(() => {});
  }
}

boot();

// 像 app 一样：iOS 不理会 user-scalable=no，双指缩放得自己拦
for (const t of ['gesturestart', 'gesturechange']) document.addEventListener(t, (e) => e.preventDefault(), { passive: false });
