// 简笔画素材
// 线条：砖红色单线（currentColor），故意不完全闭合，再叠 #rough 滤镜做出手抖感。
// 上色：蜡笔质感的色块（#crayon 滤镜），并且和线条错开一点点——像手工印刷时套色没对准。

// 开头垫一个看不见、和画布一样大的框：#rough 滤镜的范围跟着图形外框走，
// 动画（打呼的 z、发酵的面团）一动外框就变，整张图的抖动纹理会跟着变，看起来一直在闪
const wrap = (body, vb = '0 0 64 64', cls = '', sw = 2.2) => {
  const [x, y, w, h] = vb.split(/[\s,]+/);
  return `<svg class="sk ${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="none"/>${body}</svg>`;
};

// 蜡笔色块：[颜色, 路径]，整体往右下错开
const crayon = (fills, dx = 1.6, dy = 1.8) =>
  `<g class="crayon" transform="translate(${dx} ${dy})" stroke="none">${fills.map(([c, d]) => `<path class="f-${c}" d="${d}"/>`).join('')}</g>`;

// ---------- 面包造型 ----------

const SHAPES = {
  loaf: {
    fill: [['crust', 'M9 45 C7 29 18 19 32 19 C46 19 57 28 55 44 Q32 47.5 9 45 Z']],
    line: `<path d="M9 45 C7 29 18 19 32 19 C46 19 57 28 55 44"/>
      <path d="M7 45.5 Q32 47.5 57 44.5"/>
      <path d="M21 27 q5 4 3 10"/><path d="M31 24 q5 4 3 10"/><path d="M41 27 q5 4 3 10"/>`,
  },
  toast: {
    fill: [['crust', 'M15 51 V31 C7 29 8 16 20 15 Q32 12.5 44 15 C56 16 57 29 49 31 V50 Z'], ['soft', 'M21 31 C17 27 19 21 25 21 Q32 19.5 39 21 C45 21 47 27 43 31 V45 H21 Z']],
    line: `<path d="M15 51 V31 C7 29 8 16 20 15 Q32 12.5 44 15 C56 16 57 29 49 31 V50"/>
      <path d="M14 51 Q32 52.5 50 50.5"/>`,
  },
  croissant: {
    fill: [['crust', 'M7 41 Q12 21 32 19 Q52 21 57 41 Q46 33 32 38 Q18 33 7 41 Z']],
    line: `<path d="M7 41 Q12 21 32 19 Q52 21 57 41"/>
      <path d="M7 41 Q18 33 32 38 Q46 33 57 41"/>
      <path d="M20 24 q3 7 0 13"/><path d="M32 19.5 q2 9 0 18"/><path d="M44 24 q-3 7 0 13"/>
      <path d="M7 41 q-2 3 1 5"/><path d="M57 41 q2 3 -1 5"/>`,
  },
  baguette: {
    fill: [['crust', 'M9 51 C4 47 7 41 13 37 L44 13 C51 8 58 12 54 19 L23 48 C18 53 13 55 9 51 Z']],
    line: `<path d="M9 51 C4 47 7 41 13 37 L44 13 C51 8 58 12 54 19 L23 48 C18 53 13 55 9 51"/>
      <path d="M17 39 q5 1 7 -3"/><path d="M27 31 q5 1 7 -3"/><path d="M37 23 q5 1 7 -3"/>`,
  },
  cake: {
    fill: [['soft', 'M11 31 V51 H53 V31 Q32 23 11 31 Z'], ['sky', 'M11 31 Q32 23 53 31 V38 q-3 3 -6 0 q-4 4 -7 0 q-4 4 -7 0 q-4 4 -7 0 q-4 4 -7 0 q-4 4 -7 0 Z'], ['crust', 'M32 13 q-3 -3 0 -7 q3 4 0 7 Z']],
    line: `<path d="M11 31 V51 H53 V31"/>
      <path d="M10 31 Q32 23 54 31"/>
      <path d="M11 38 q4 4 7 0 q4 4 7 0 q4 4 7 0 q4 4 7 0 q4 4 7 0 q3 3 3 0"/>
      <path d="M32 26 V16"/><path d="M32 13 q-3 -3 0 -7 q3 4 0 7"/>`,
  },
  cookie: {
    fill: [['crust', 'M32 9 C46 9 55 19 55 32 C55 45 45 55 32 55 C18 55 9 45 9 31 C9 19 19 10 32 9 Z']],
    line: `<path d="M32 9 C46 9 55 19 55 32 C55 45 45 55 32 55 C18 55 9 45 9 31 C9 19 19 10 30 9.5"/>
      <path d="M23 23 l2 1"/><path d="M38 20 l1 2"/><path d="M42 35 l2 1"/><path d="M27 40 l1 2"/><path d="M33 31 l1 1"/><path d="M20 33 l1 1"/>`,
  },
  muffin: {
    fill: [['sky', 'M18 37 L22 54 H42 L46 37 Z'], ['crust', 'M14 37 C9 29 19 21 25 23 C27 14 40 13 42 22 C49 20 56 29 50 37 Z']],
    line: `<path d="M18 37 L22 54 H42 L46 37"/>
      <path d="M26 38 l1 15"/><path d="M32 38 v15"/><path d="M38 38 l-1 15"/>
      <path d="M14 37 C9 29 19 21 25 23 C27 14 40 13 42 22 C49 20 56 29 50 37 Z"/>`,
  },
  melonpan: {
    fill: [['crust', 'M9 44 C7 28 19 19 32 19 C45 19 57 28 55 44 Q32 47.5 9 44 Z']],
    line: `<path d="M9 44 C7 28 19 19 32 19 C45 19 57 28 55 44"/><path d="M8 44.5 Q32 47.5 56 44"/>
      <path d="M14 30 L30 44" stroke-width="1.5"/><path d="M22 22 L44 44" stroke-width="1.5"/><path d="M34 20 L52 36" stroke-width="1.5"/>
      <path d="M50 30 L34 44" stroke-width="1.5"/><path d="M42 22 L20 44" stroke-width="1.5"/><path d="M30 20 L12 36" stroke-width="1.5"/>`,
  },
  // 巧克力脆脆珠面包：可可色圆面包，中间切开挤满甘纳许，开口和表面粘着一圈脆脆珠
  chocobun: {
    fill: [['choco', 'M8 44 C6 28 18 20 32 20 C46 20 58 28 56 44 Q32 48 8 44 Z']],
    line: `<path d="M8 44 C6 28 18 20 32 20 C46 20 58 28 56 44"/><path d="M7 44.5 Q32 48 57 44"/>
      <path d="M15 31 Q32 22 49 31" stroke-width="3.4" class="ganache"/>
      <path class="pearl" d="M17 29 h.1 M22 26.6 h.1 M27.5 25.2 h.1 M33 24.8 h.1 M38.5 25.4 h.1 M44 27 h.1 M48 29.4 h.1 M14 36 h.1 M24 33 h.1 M40 33 h.1 M50 36 h.1 M31 37 h.1 M20 40 h.1 M44 40 h.1" stroke-width="3.2"/>
      <path class="salt" d="M19.5 27.6 h.1 M30 24.8 h.1 M41.5 26 h.1 M27 35 h.1 M36 35 h.1" stroke-width="2.6"/>`,
  },
  anpan: {
    fill: [['crust', 'M9 42 C7 27 19 19 32 19 C45 19 57 27 55 42 C51 48 13 48 9 42 Z']],
    line: `<path d="M9 42 C7 27 19 19 32 19 C45 19 57 27 55 42 C51 48 13 48 9 42"/>
      <path d="M32 25 a3 3 0 1 0 .1 0"/><path d="M26 30 l1 .5"/><path d="M37 29 l1 -.5"/><path d="M31 33 l.5 1"/>`,
  },
  // 碱水面包：先画一根粗的深色线当轮廓，再在上面画一根细一点的面包色，就是一条面绳；撒几粒盐
  pretzel: {
    fill: [],
    line: `<path d="M18 43 C22 36 28 30 32 26 C36 22 40 16 46 16 C54 16 58 24 56 34 C54 46 44 54 32 54 C20 54 10 46 8 34 C6 24 10 16 18 16 C24 16 28 22 32 26 C36 30 42 36 46 43" stroke-width="9"/>
      <path class="rope" d="M18 43 C22 36 28 30 32 26 C36 22 40 16 46 16 C54 16 58 24 56 34 C54 46 44 54 32 54 C20 54 10 46 8 34 C6 24 10 16 18 16 C24 16 28 22 32 26 C36 30 42 36 46 43" stroke-width="5"/>
      <path class="salt" d="M11 32 h.1 M53 32 h.1 M32 51 h.1 M21 49 h.1 M43 49 h.1 M44 21 h.1 M20 21 h.1" stroke-width="2"/>`,
  },
  bagel: {
    fill: [['crust', 'M32 13 C46 13 56 21 56 33 C56 45 45 52 32 52 C18 52 8 45 8 33 C8 22 18 13 32 13 Z M32 27 C27 27 24 29.5 24 33 C24 36 27 38 32 38 C36.5 38 40 36.5 40 33 C40 29.5 37 27 32 27 Z']],
    line: `<path d="M32 13 C46 13 56 21 56 33 C56 45 45 52 32 52 C18 52 8 45 8 33 C8 22 18 13.5 30 13"/>
      <path d="M32 27 C37 27 40 29.5 40 33 C40 36.5 36.5 38 32 38 C27 38 24 36 24 33 C24 29.5 27 27 31 27"/>
      <path d="M18 22 l2 1"/><path d="M44 21 l2 -1"/><path d="M47 42 l2 1"/>`,
  },
};

export const SHAPE_NAMES = {
  loaf: '欧包', toast: '吐司', croissant: '可颂', baguette: '法棍',
  cake: '蛋糕', cookie: '饼干', muffin: '玛芬', bagel: '贝果', pretzel: '碱水', melonpan: '蜜瓜包', anpan: '红豆包', chocobun: '巧克力包',
};
export const SHAPE_NAMES_EN = {
  loaf: 'Loaf', toast: 'Shokupan', croissant: 'Croissant', baguette: 'Baguette',
  cake: 'Cake', cookie: 'Cookie', muffin: 'Muffin', bagel: 'Bagel', pretzel: 'Pretzel', melonpan: 'Melon pan', anpan: 'Anpan', chocobun: 'Choco bun',
};

export const shape = (name, cls = '') => {
  const s = SHAPES[name] || SHAPES.loaf;
  return wrap(crayon(s.fill) + s.line, '0 0 64 64', `shape ${cls}`);
};

// ---------- 小图标（纯线条） ----------

const ICONS = {
  shop: `<path d="M10 28 V54 H54 V28"/><path d="M6 28 L12 12 H52 L58 28"/>
    <path d="M6 28 q4.6 6 9.6 0 q4.6 6 9.6 0 q4.6 6 9.6 0 q4.6 6 9.6 0 q4.6 6 13.6 0"/>
    <path d="M26 54 V40 H38 V54"/>`,
  book: `<path d="M10 14 Q21 10 32 16 V54 Q21 48 10 52 Z"/><path d="M54 14 Q43 10 32 16 V54 Q43 48 54 52 Z"/>`,
  calendar: `<path d="M10 16 H54 V54 H10 Z"/><path d="M10 26 H54"/><path d="M22 10 V20"/><path d="M42 10 V20"/>
    <path d="M20 36 h2"/><path d="M31 36 h2"/><path d="M42 36 h2"/><path d="M20 45 h2"/><path d="M31 45 h2"/>`,
  photo: `<path d="M12 14 H52 V50 H12 Z"/><path d="M12 42 L25 30 L35 39 L41 34 L52 44"/><path d="M42 22 a3 3 0 1 0 0.1 0"/>`,
  plus: `<path d="M32 12 V52"/><path d="M12 32 H52"/>`,
  back: `<path d="M38 12 L18 32 L38 52"/>`,
  check: `<path d="M12 33 L26 47 L53 16"/>`,
  close: `<path d="M16 16 L48 48"/><path d="M48 16 L16 48"/>`,
  timer: `<path d="M32 18 C44 18 52 27 52 38 C52 49 43 57 32 57 C20 57 12 49 12 38 C12 27 20 18.5 30 18"/>
    <path d="M32 38 V27"/><path d="M32 38 L40 42"/><path d="M26 8 H38"/><path d="M32 8 V18"/>`,
  bell: `<path d="M16 46 C20 40 18 34 19 27 C20 18 26 13 32 13 C38 13 44 18 45 27 C46 34 44 40 48 46 Z"/><path d="M27 51 q5 5 10 0"/>`,
  camera: `<path d="M8 22 H20 L24 15 H40 L44 22 H56 V51 H8 Z"/><path d="M32 26 C38 26 42 30 42 36 C42 42 38 45 32 45 C26 45 22 42 22 36 C22 30 26 26.5 31 26"/>`,
  pencil: `<path d="M14 50 L17 39 L44 12 L52 20 L25 47 Z"/><path d="M39 17 L47 25"/><path d="M14 50 L25 47"/>`,
  trash: `<path d="M12 18 H52"/><path d="M26 18 V12 H38 V18"/><path d="M16 18 L19 54 H45 L48 18"/><path d="M27 26 V46"/><path d="M37 26 V46"/>`,
  gear: `<path d="M32 22 C38 22 42 26 42 32 C42 38 38 42 32 42 C26 42 22 38 22 32 C22 26 26 22.5 31 22"/>
    <path d="M32 8 V15"/><path d="M32 49 V56"/><path d="M8 32 H15"/><path d="M49 32 H56"/>
    <path d="M15 15 L20 20"/><path d="M44 44 L49 49"/><path d="M49 15 L44 20"/><path d="M15 49 L20 44"/>`,
  play: `<path d="M20 12 L50 32 L20 52 Z"/>`,
  pause: `<path d="M22 14 V50"/><path d="M42 14 V50"/>`,
  paste: `<path d="M16 14 H24"/><path d="M40 14 H48 V56 H16 V14"/><path d="M24 10 H40 V18 H24 Z"/><path d="M23 30 H41"/><path d="M23 38 H41"/><path d="M23 46 H34"/>`,
  oven: `<path d="M8 12 H56 V54 H8 Z"/><path d="M8 22 H56"/><path d="M15 29 H49 V47 H15 Z"/>
    <path d="M15 17 h1"/><path d="M22 17 h1"/><path d="M42 17 h8"/>`,
  download: `<path d="M32 10 V40"/><path d="M20 29 L32 41 L44 29"/><path d="M12 46 V54 H52 V46"/>`,
  upload: `<path d="M32 42 V12"/><path d="M20 23 L32 11 L44 23"/><path d="M12 46 V54 H52 V46"/>`,
  up: `<path d="M16 40 L32 22 L48 40"/>`,
  down: `<path d="M16 24 L32 42 L48 24"/>`,
  dice: `<path d="M14 14 H50 V50 H14 Z"/><path d="M23 23 h1"/><path d="M40 23 h1"/><path d="M31.5 31.5 h1"/><path d="M23 40 h1"/><path d="M40 40 h1"/>`,
  next: `<path d="M26 12 L46 32 L26 52"/>`,
  star: `<path d="M32 9 L38.5 24 L55 25.5 L42.5 36.5 L46.5 53 L32 44.5 L17.5 53 L21.5 36.5 L9 25.5 L25.5 24 Z"/>`,
  flour: `<path d="M18 20 Q16 14 20 10 H44 Q48 14 46 20"/><path d="M18 20 L14 54 H50 L46 20 Z"/><path d="M24 36 q8 -6 16 0"/>`,
  share: `<path d="M44 14 a5 5 0 1 0 .1 0"/><path d="M20 28 a5 5 0 1 0 .1 0"/><path d="M44 42 a5 5 0 1 0 .1 0"/><path d="M24 30 L40 20"/><path d="M24 36 L40 45"/>`,
};

export const icon = (name, cls = '') => wrap(ICONS[name] || '', '0 0 64 64', `ic ${cls}`);

// ---------- 吉祥物：吐司店长 ----------
// 一片会挥手的吐司，站在店门口。mood: 'wave' 打招呼 | 'wait' 等发酵 | 'yay' 出炉欢呼

function mascotBody(mood = 'wave') {
  const arms = {
    wave: '<path d="M5 30 q-5 -2 -6 4"/><path d="M35 28 q6 -6 4 -13"/><path d="M37 13 l2 -3"/><path d="M41 15 l3 -1"/>',
    wait: '<path d="M5 30 q-5 2 -3 7"/><path d="M35 30 q5 2 3 7"/>',
    yay: '<path d="M5 27 q-5 -6 -3 -13"/><path d="M35 27 q5 -6 3 -13"/>',
  }[mood];
  const mouth = mood === 'wait' ? '<path d="M17 31 h6"/>' : '<path d="M16 30 q4 4 8 0"/>';
  return `
    ${crayon([['crust', 'M6 46 V22 C-1 20 0 6 11 5 Q20 3 29 5 C40 6 41 20 34 22 V46 Z'], ['soft', 'M11 22 C8 19 9 11 15 11 Q20 10 25 11 C31 11 32 19 29 22 V40 H11 Z']], 1.2, 1.4)}
    <path d="M6 46 V22 C-1 20 0 6 11 5 Q20 3 29 5 C40 6 41 20 34 22 V46 Z"/>
    ${crayon([['ai', 'M2 11 C8 3 32 3 38 11 L37 15 C30 9 10 9 3 15 Z']], 0.6, 0.8)}
    <path d="M2 11 C8 3 32 3 38 11"/><path d="M3 15 C10 9 30 9 37 15"/><path d="M38 12 l5 -4 M38 12 l6 1"/>
    <path d="M14 23 v1.5" stroke-width="3"/><path d="M26 23 v1.5" stroke-width="3"/>
    ${mouth}
    <path d="M9 28 h3" class="blush" stroke-width="2.6"/><path d="M28 28 h3" class="blush" stroke-width="2.6"/>
    ${arms}
    <path d="M12 46 v6 h-4"/><path d="M28 46 v6 h4"/>`;
}

export const mascot = (mood = 'wave', cls = '') => wrap(mascotBody(mood), '-8 0 54 56', `mascot ${cls}`);

// ---------- 门店：日式街角面包店 ----------
// 瓦檐 + 木招牌 + 藏青暖帘 + 格子木门 + 木框橱窗。招牌上的店名由 HTML 叠加（见 css .storefront .sign）

// 一排瓦当：檐口下沿的小半圆
const tiles = (x0, x1, y, w) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1 - 0.1; x += w) d += ` q${w / 2} ${w * 0.55} ${w} 0`;
  return d;
};

// 门店插画随店铺等级变化（一共 8 级），房子的建筑风格也跟着变：
// Lv1–2 木造：周末小推车 → 私房小铺（单间小铺）
// Lv3–4 和风町屋：熟客小店（灯笼、长椅和猫、红毡长凳和红伞）→ 街角面包店（门面往右扩、第二扇大橱窗、一对灯笼、窗台香草、自行车）
// Lv5–6 昭和复古：排队小店（红白条纹布篷、拱形橱窗、马赛克瓷砖、搪瓷招牌、门口排队）→ 两层小楼（拱窗二楼、屋顶大碱水面包）
// Lv7–8 现代：露台面包店（两层楼、单坡屋顶带高窗、木饰面、钢框窗、暖光吊灯、黄铜门把手、橄榄树、白伞露台）→ 旗舰面包店（三层、屋顶露台、黄铜「招牌」、松树、石灯笼）
// 招牌上的店名由 HTML 叠加，位置用 storefrontSign(level) 取

const UP = 56; // 两层的店加盖的二楼高度
const TOP3 = 60; // 旗舰店（Lv8）再加的第三层
const widthOf = (level) => (level >= 7 ? 340 : level >= 4 ? 280 : level === 3 ? 270 : 240);
const PRETZEL = 'M18 43 C22 36 28 30 32 26 C36 22 40 16 46 16 C54 16 58 24 56 34 C54 46 44 54 32 54 C20 54 10 46 8 34 C6 24 10 16 18 16 C24 16 28 22 32 26 C36 30 42 36 46 43';
const pretzelAt = (tx, ty, k) => `<g transform="translate(${tx} ${ty}) scale(${k})"><path d="${PRETZEL}" stroke-width="9"/><path class="rope" d="${PRETZEL}" stroke-width="5"/></g>`;

export function storefrontSign(level = 3) {
  const vbW = widthOf(level);
  if (level <= 1) return { x: 72, y: 40, w: 96, h: 18, vbW, vbH: 190 };
  if (level === 2) return { x: 76, y: 80, w: 88, h: 16, vbW, vbH: 190 };
  if (level <= 4) return { x: 60, y: 38, w: 120, h: 22, vbW, vbH: 190 };
  const dy = level === 6 || level === 8 ? UP : 0;
  if (level <= 6) return { x: 58, y: 58 + dy, w: 124, h: 20, vbW, vbH: 190 + dy };
  const top = level >= 8 ? TOP3 : 0; // 旗舰店多一层
  return { x: 78, y: 103 + top, w: 124, h: 18, vbW, vbH: 190 + UP + top };
}

// 排队的客人：圆脑袋、外套、手里提着纸袋
function customer(x, coat, flip = false) {
  const f = flip ? -1 : 1;
  return {
    fills: [[coat, `M${x - 6} 178 L${x - 5} 160 Q${x} 155 ${x + 5} 160 L${x + 6} 178 Z`], ['soft', `M${x} 145 a5.5 5.5 0 1 0 .1 0 Z`], ['wood', `M${x + 7 * f} 165 h${5 * f} v7 h${-5 * f} Z`]],
    lines: `<path d="M${x} 145 a5.5 5.5 0 1 0 .1 0"/><path d="M${x - 6} 178 L${x - 5} 160 Q${x} 155 ${x + 5} 160 L${x + 6} 178"/>
      <path d="M${x - 4} 148 q4 -6 8 0" stroke-width="1"/><path d="M${x + 1 * f} 152 h${2 * f}" stroke-width="1"/>
      <path d="M${x + 5 * f} 162 l${3 * f} 3"/><path d="M${x + 7 * f} 165 h${5 * f} v7 h${-5 * f} Z" stroke-width="1.2"/>`,
  };
}

// 竖起来的小旗（のぼり）
function banner(x, color, a, b) {
  return {
    fills: [[color, `M${x + 1} 112 H${x + 13} V154 H${x + 1} Z`]],
    lines: `<path d="M${x} 108 V178" stroke-width="1.8"/><path d="M${x} 112 H${x + 14}" stroke-width="1.2"/>
      <path d="M${x + 1} 112 H${x + 13} V154 H${x + 1} Z"/>
      <text x="${x + 7}" y="128" font-size="8.5" text-anchor="middle" stroke="none" class="sk-text ink-fill">${a}</text>
      <text x="${x + 7}" y="141" font-size="8.5" text-anchor="middle" stroke="none" class="sk-text ink-fill">${b}</text>`,
  };
}

// Lv7 起：右边的露台：白色方阳伞、圆桌、两把细腿椅、矮绿篱、一串暖色小灯
function terrace() {
  const bulbs = [216, 230, 244, 258, 272, 286, 300, 314, 328].map((x, i) => `<circle cx="${x}" cy="${100 + Math.sin((i + .5) / 9 * Math.PI) * 9}" r="1.8" class="bulb"/>`).join('');
  return {
    fills: [
      ['wood', 'M240 170 H336 V174 H240 Z'],
      ['paper', 'M254 122 L282 110 L310 122 Z'],
      ['paper', 'M270 150 H294 V153 H270 Z'],
      ['crust', 'M277 150 C277 146 279 144 282 144 C285 144 287 146 287 150 Z'],
      ['leaf', 'M240 170 q3 -9 8 -6 q4 -6 9 0 q4 -5 9 0 q4 -6 9 0 q2 -4 5 2 Z M316 170 q3 -9 8 -6 q4 -6 9 0 q2 -4 3 6 Z'],
    ],
    lines: `
      <path d="M212 96 Q270 114 336 96" stroke-width="1"/>${bulbs}
      <path d="M240 170 H336 V174 H240 Z"/><path d="M246 174 V178 M330 174 V178"/>
      <path d="M282 170 V112"/><path d="M254 122 L282 110 L310 122 Z"/><path d="M254 122 q14 3 28 0 q14 3 28 0" stroke-width="1"/>
      <path d="M270 150 H294 V153 H270 Z"/><path d="M282 153 V170 M276 170 H288" stroke-width="1.2"/>
      <path d="M277 150 C277 146 279 144 282 144 C285 144 287 146 287 150"/>
      <path d="M258 170 L260 156 H266 M262 156 L264 170 M259 163 H266" stroke-width="1.1"/>
      <path d="M306 170 L304 156 H298 M302 156 L300 170 M305 163 H298" stroke-width="1.1"/>
      <path d="M240 170 q3 -9 8 -6 q4 -6 9 0 q4 -5 9 0 q4 -6 9 0 q2 -4 5 2" stroke-width="1.1"/>
      <path d="M316 170 q3 -9 8 -6 q4 -6 9 0 q2 -4 3 6" stroke-width="1.1"/>`,
  };
}

// 店门外的街景，按等级加：排队的客人（5+）、小旗（5–6）、露台（7+）、石灯笼（8）
function streetExtras(level) {
  const fills = [];
  let lines = '';
  const add = (o) => { fills.push(...o.fills); lines += o.lines; };
  if (level === 5 || level === 6) [customer(216, 'sky'), customer(232, 'crust'), customer(248, 'leaf')].forEach(add);
  if (level === 5 || level === 6) [banner(258, 'shu', '现', '烤'), banner(266, 'ai', '面', '包')].forEach(add);
  if (level >= 7) add(terrace());
  if (level >= 8) {
    const sx = 100;
    add({
      fills: [['tile', `M${212 + sx} 178 H${234 + sx} V172 H${212 + sx} Z M${219 + sx} 172 V154 H${227 + sx} V172 Z M${210 + sx} 142 L${223 + sx} 133 L${236 + sx} 142 Z`], ['crust', `M${220 + sx} 152 V145 H${226 + sx} V152 Z`]],
      lines: `<path d="M${212 + sx} 178 H${234 + sx} V172 H${212 + sx} Z"/><path d="M${219 + sx} 172 V154 H${227 + sx} V172"/>
        <path d="M${214 + sx} 154 H${232 + sx} V142 H${214 + sx} Z"/><path d="M${220 + sx} 152 V145 H${226 + sx} V152 Z" stroke-width="1"/>
        <path d="M${210 + sx} 142 L${223 + sx} 133 L${236 + sx} 142 Z"/><path d="M${223 + sx} 133 v-3"/>`,
    });
  }
  return { fills, lines };
}

// 松树（Lv8）：弯弯的树干 + 三层云朵状松针；dy 是二楼加高的量
function pineTree(dy) {
  return `
    ${crayon([['leaf', 'M2 96 q4 -9 14 -8 q6 -7 16 -2 q8 -1 9 6 q-6 6 -18 5 q-12 4 -21 -1 Z M0 124 q3 -8 12 -7 q6 -6 14 -1 q7 0 8 5 q-5 5 -15 4 q-10 3 -19 -1 Z M6 150 q3 -7 11 -6 q6 -5 13 0 q6 0 6 5 q-5 5 -14 4 q-9 2 -16 -3 Z']])}
    <path d="M18 ${178 + dy} C20 ${158 + dy} 10 160 16 140 C21 124 12 112 20 94" stroke-width="2.2"/>
    <path d="M16 140 l8 -4 M18 116 l-8 -3" stroke-width="1.4"/>
    <path d="M2 96 q4 -9 14 -8 q6 -7 16 -2 q8 -1 9 6 q-6 6 -18 5 q-12 4 -21 -1"/>
    <path d="M0 124 q3 -8 12 -7 q6 -6 14 -1 q7 0 8 5 q-5 5 -15 4 q-10 3 -19 -1"/>
    <path d="M6 150 q3 -7 11 -6 q6 -5 13 0 q6 0 6 5 q-5 5 -14 4 q-9 2 -16 -3"/>`;
}

// ---------- Lv5–6 昭和复古面包店 ----------
function retroGround(level) {
  const n = 10;
  const stripes = [];
  for (let i = 0; i < n; i++) {
    const t0 = 38 + 16.4 * i, t1 = t0 + 16.4, b0 = 30 + 18 * i, b1 = b0 + 18;
    stripes.push([i % 2 ? 'paper' : 'shu', `M${t0} 84 H${t1} L${b1} 100 q-9 7 -18 0 Z`]);
  }
  let scallop = 'M30 100';
  for (let i = 0; i < n; i++) scallop += ' q9 7 18 0';
  const mosaic = [156, 162, 168, 174].map((y) => `<path d="M32 ${y} H134 M180 ${y} H208" stroke-width=".7" opacity=".55"/>`).join('')
    + Array.from({ length: 17 }, (_, i) => `<path d="M${38 + i * 6} ${150 + (i % 2) * 3} v3" stroke-width=".6" opacity=".5"/>`).join('');
  return {
    fills: [
      ['paper', 'M32 52 H208 V178 H32 Z'],
      ['skysoft', 'M32 150 H134 V178 H32 Z M180 150 H208 V178 H180 Z'],
      ['crust', 'M60 58 H180 Q190 58 190 68 Q190 78 180 78 H60 Q50 78 50 68 Q50 58 60 58 Z'],
      ...stripes,
      ['skysoft', 'M44 150 V124 Q44 106 81 106 Q118 106 118 124 V150 Z'],
      ['crust', 'M52 136 C51 129 56 125 62 125 C68 125 73 129 72 136 Z M78 136 C78 130 82 127 87 127 C92 127 96 130 95 136 Z M100 136 V128 C98 125 101 122 105 122 C109 122 112 125 110 128 V136 Z'],
      ['wood', 'M134 106 H180 V178 H134 Z'],
      ['skysoft', 'M140 112 H174 V160 H140 Z'],
      ['leaf', 'M122 168 C116 167 116 158 122 158 C121 153 129 152 130 158 C135 158 135 167 129 168 Z'],
      ['crust', 'M119 169 H133 L131 178 H121 Z'],
    ],
    lines: `
      <path d="M28 46 H212 V52 H28 Z"/><path d="M32 52 V178"/><path d="M208 52 V178"/>
      <path d="M60 58 H180 Q190 58 190 68 Q190 78 180 78 H60 Q50 78 50 68 Q50 58 60 58 Z"/>
      <path d="M38 84 H202 L210 100"/><path d="M38 84 L30 100"/><path d="${scallop}"/>
      ${Array.from({ length: n - 1 }, (_, i) => `<path d="M${54.4 + 16.4 * i} 84 L${48 + 18 * i} 100" stroke-width=".9"/>`).join('')}
      <path d="M44 150 V124 Q44 106 81 106 Q118 106 118 124 V150 Z"/><path d="M81 106 V150 M44 128 H118" stroke-width="1"/>
      <text x="81" y="121" font-size="6.5" text-anchor="middle" stroke="none" class="gold-text" font-family="Courier Prime, monospace">BAKERY</text>
      <path d="M44 136 H118" stroke-width="1"/>
      <path d="M52 136 C51 129 56 125 62 125 C68 125 73 129 72 136"/><path d="M78 136 C78 130 82 127 87 127 C92 127 96 130 95 136"/>
      <path d="M100 136 V128 C98 125 101 122 105 122 C109 122 112 125 110 128 V136"/>
      <path d="M40 150 H122 V154 H40 Z"/>
      ${mosaic}
      <path d="M134 106 H180 V178 H134 Z"/><path d="M140 112 H174 V160 H140 Z"/><path d="M168 132 v12" stroke-width="2.2"/>
      <path d="M140 166 H174" stroke-width="1"/>
      <path d="M130 178 V175 H184 V178"/>
      <path d="M208 108 H198 V112" stroke-width="1.4"/>
      <path d="M196 113 a9 9 0 1 0 .1 0"/><path d="M196 115.5 a6.5 6.5 0 1 0 .1 0" class="shu-line" stroke-width="1"/>
      <text x="196" y="125" font-size="6.5" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">面包</text>
      <path d="M122 168 C116 167 116 158 122 158 C121 153 129 152 130 158 C135 158 135 167 129 168" stroke-width="1.2"/>
      <path d="M119 169 H133 L131 178 H121 Z"/>`,
  };
}

function retroUpper() {
  const arch = (x) => `M${x} 92 V68 Q${x} 58 ${x + 16} 58 Q${x + 32} 58 ${x + 32} 68 V92 Z`;
  return {
    fills: [['paper', 'M36 46 H204 V102 H36 Z'], ['skysoft', [56, 104, 152].map(arch).join(' ')], ['wood', 'M54 92 H90 V96 H54 Z M102 92 H138 V96 H102 Z M150 92 H186 V96 H150 Z']],
    lines: `
      <path d="M32 40 H208 V46 H32 Z"/><path d="M36 46 V102"/><path d="M204 46 V102"/>
      ${[56, 104, 152].map((x) => `<path d="${arch(x)}"/><path d="M${x + 16} 58 V92 M${x} 76 H${x + 32}" stroke-width="1"/><path d="M${x - 2} 92 H${x + 34} V96 H${x - 2} Z" stroke-width="1.2"/>`).join('')}
      <path d="M104 40 V30 M136 40 V30" stroke-width="2"/><path d="M100 40 H140" stroke-width="1.4"/>
      ${pretzelAt(97.6, -6, 0.7)}`,
  };
}

// ---------- Lv7–8 现代面包店：两层楼，坐标直接按地面 y=234 画；旗舰店再在上面加一层和屋顶露台 ----------
// Lv7 的屋顶：单坡屋顶往右边斜上去，三角墙上开一排高窗
function lv7Roof() {
  return {
    fills: [['paper', 'M30 40 L212 14 V40 Z'], ['wood', 'M30 40 L72 34 V40 Z'], ['tile', 'M14 44 L228 10 L228 16 L14 50 Z'], ['skysoft', 'M96 34 L196 20 V30 L96 38 Z']],
    lines: `<path d="M14 44 L228 10 L228 16 L14 50 Z"/><path d="M20 48 L222 16" stroke-width=".8" opacity=".5"/>
      <path d="M212 14 V40"/><path d="M96 34 L196 20 V30 L96 38 Z" stroke-width="1.6"/><path d="M121 31 V37 M146 27 V34 M171 24 V31" stroke-width=".9"/>`,
  };
}

function modernShop(level) {
  const G = 178 + UP; // 地面
  const slats = Array.from({ length: 8 }, (_, i) => `<path d="M${35 + i * 5} 40 V${G}" stroke-width=".7" opacity=".7"/>`).join('');
  const grid = [96, 120].map((x) => `<path d="M${x} 136 V${G - 8}" stroke-width="1.1"/>`).join('') + [160, 184, 206].map((y) => `<path d="M78 ${y} H144" stroke-width="1.1"/>`).join('');
  const lamp = (x) => `<path d="M${x} 136 V150" stroke-width=".9"/><path d="M${x - 5} 155 Q${x} 147 ${x + 5} 155 Z" stroke-width="1.1"/>`;
  // 二楼：两扇钢框大窗，窗下花箱
  const upWin = (x, w) => `<path d="M${x} 50 H${x + w} V90 H${x} Z" stroke-width="2"/><path d="M${x + w / 2} 50 V90 M${x} 70 H${x + w}" stroke-width="1"/>
    <path d="M${x + 3} 52 Q${x + 10} 64 ${x + 5} 88" stroke-width=".9"/><path d="M${x + w - 3} 52 Q${x + w - 10} 64 ${x + w - 5} 88" stroke-width=".9"/>
    <path d="M${x - 2} 90 H${x + w + 2} V95 H${x - 2} Z" stroke-width="1.2"/>
    <path d="M${x + 4} 90 q3 -6 6 0 M${x + 14} 90 q3 -7 6 0 M${x + w - 20} 90 q3 -6 6 0 M${x + w - 10} 90 q3 -7 6 0" stroke-width="1"/>`;
  const fills = [
    ['paper', `M30 40 H212 V${G} H30 Z`],
    ['wood', `M30 40 H72 V${G} H30 Z`],
    ['skysoft', 'M80 50 H140 V90 H80 Z M150 50 H204 V90 H150 Z'],
    ['wood', 'M78 90 H142 V95 H78 Z M148 90 H206 V95 H148 Z'],
    ['leaf', 'M84 90 q3 -6 6 0 Z M94 90 q3 -7 6 0 Z M154 90 q3 -6 6 0 Z M184 90 q3 -7 6 0 Z'],
    ['soft', `M78 136 H144 V${G - 8} H78 Z`],
    ['tile', 'M70 124 H218 V130 H70 Z'],
    ['crust', 'M91 155 Q96 147 101 155 Z M115 155 Q120 147 125 155 Z'],
    ['wood', 'M80 202 H142 V206 H80 Z'],
    ['crust', 'M84 202 C84 196 88 193 92 193 C96 193 99 196 99 202 Z M104 202 V196 C102 193 105 190 109 190 C113 190 116 193 114 196 V202 Z M120 202 C120 197 124 194 128 194 C132 194 136 197 136 202 Z'],
    ['skysoft', `M154 136 H204 V${G} H154 Z`],
    ['crust', 'M186 164 H189 V204 H186 Z M148 148 a3 3 0 1 0 .1 0 Z M210 148 a3 3 0 1 0 .1 0 Z'],
    ['tile', `M36 ${G - 18} H66 V${G} H36 Z`],
    ['leaf', `M51 ${G - 18} C36 ${G - 20} 38 ${G - 44} 51 ${G - 42} C64 ${G - 44} 66 ${G - 20} 51 ${G - 18} Z`],
  ];
  let lines = `
    <path d="M26 40 H216"/><path d="M30 40 V${G}"/><path d="M212 40 V${G}"/><path d="M72 40 V${G}"/>${slats}
    ${upWin(80, 60)}${upWin(150, 54)}
    <path d="M72 100 H212" stroke-width=".8" opacity=".5"/>
    <path d="M110 122 H170" stroke-width=".8"/>
    <path d="M70 124 H218 V130 H70 Z"/>
    <path d="M78 136 H144 V${G - 8} H78 Z" stroke-width="2.2"/>${grid}
    ${lamp(96)}${lamp(120)}
    <path d="M80 202 H142 V206 H80 Z"/><path d="M84 206 V${G - 8} M138 206 V${G - 8}" stroke-width="1"/>
    <path d="M84 202 C84 196 88 193 92 193 C96 193 99 196 99 202"/>
    <path d="M104 202 V196 C102 193 105 190 109 190 C113 190 116 193 114 196 V202"/>
    <path d="M120 202 C120 197 124 194 128 194 C132 194 136 197 136 202"/>
    <path d="M74 ${G - 8} H148" stroke-width="1.4"/>
    <path d="M154 136 H204 V${G} H154 Z" stroke-width="2.2"/><path d="M186 164 H189 V204 H186 Z" stroke-width="1.1"/>
    <path d="M148 148 a3 3 0 1 0 .1 0"/><path d="M148 145 V140 M146 140 H150" stroke-width="1"/>
    <path d="M210 148 a3 3 0 1 0 .1 0"/><path d="M210 145 V140 M208 140 H212" stroke-width="1"/>
    <path d="M150 ${G} V${G - 3} H208 V${G}"/>
    <path d="M36 ${G - 18} H66 V${G} H36 Z"/><path d="M51 ${G - 18} V${G - 30}" stroke-width="1.4"/>
    <path d="M51 ${G - 18} C36 ${G - 20} 38 ${G - 44} 51 ${G - 42} C64 ${G - 44} 66 ${G - 20} 51 ${G - 18}" stroke-width="1.3"/>
    <path d="M212 112 H234 M212 120 L220 112" stroke-width="1.8"/><path d="M228 112 V117" stroke-width="1"/>
    ${pretzelAt(218.8, 114, 0.32)}`;
  if (level === 7) {
    const r = lv7Roof();
    fills.push(...r.fills);
    lines += r.lines;
  }
  if (level >= 8) {
    // 入口旁一块黄铜「招牌」
    fills.push(['crust', 'M40 140 H62 V184 H40 Z']);
    lines += `
      <path d="M40 140 H62 V184 H40 Z" stroke-width="1.3"/>
      <text x="51" y="158" font-size="9" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">招</text>
      <text x="51" y="174" font-size="9" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">牌</text>`;
  }
  return { fills, lines };
}

// 旗舰店的第三层 + 屋顶露台（画在最上面 TOP3 高度里，下面整栋往下移）
function flagshipTop() {
  const balusters = Array.from({ length: 19 }, (_, i) => `<path d="M${34 + i * 10} 30 V40" stroke-width=".8"/>`).join('');
  const bulbs = [44, 64, 84, 104, 124, 144, 164, 184, 204].map((x, i) => `<circle cx="${x}" cy="${20 + Math.sin((i + .5) / 9 * Math.PI) * 5}" r="1.6" class="bulb"/>`).join('');
  const umb = (x) => `<path d="M${x} 40 V20"/><path d="M${x - 15} 24 L${x} 16 L${x + 15} 24 Z"/><path d="M${x - 15} 24 q7.5 2 15 0 q7.5 2 15 0" stroke-width=".9"/>
    <path d="M${x - 8} 34 H${x + 8}" stroke-width="1.2"/><path d="M${x} 34 V40" stroke-width="1"/>`;
  return {
    fills: [
      ['wood', 'M30 40 H212 V100 H30 Z'],
      ['skysoft', 'M80 52 H204 V86 H80 Z'],
      ['paper', 'M65 24 L80 16 L95 24 Z M135 24 L150 16 L165 24 Z'],
      ['leaf', 'M34 40 q2 -9 11 -7 q6 -7 13 0 q7 -3 9 7 Z M182 40 q2 -8 10 -6 q6 -6 12 1 q5 -1 6 5 Z'],
    ],
    lines: `
      <path d="M26 40 H216"/><path d="M30 40 V100 M212 40 V100"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M30 ${46 + i * 6} H74" stroke-width=".7" opacity=".6"/>`).join('')}
      <path d="M80 52 H204 V86 H80 Z" stroke-width="2"/><path d="M111 52 V86 M142 52 V86 M173 52 V86" stroke-width="1"/>
      <path d="M30 30 H212" stroke-width="1.2"/>${balusters}
      ${umb(80)}${umb(150)}
      <path d="M34 40 q2 -9 11 -7 q6 -7 13 0 q7 -3 9 7"/><path d="M182 40 q2 -8 10 -6 q6 -6 12 1 q5 -1 6 5"/>
      <path d="M30 18 Q120 30 212 18" stroke-width=".9"/>${bulbs}`,
  };
}


// 一楼（从瓦檐往下），按等级加东西
function groundFloor(level) {
  const eaveRibs = Array.from({ length: 11 }, (_, i) => `<path d="M${42 + i * 15.2} 72 L${36 + i * 16} 86" stroke-width=".8" opacity=".55"/>`).join('');
  const lattice = Array.from({ length: 9 }, (_, i) => `<path d="M${48 + i * 8} 100 V110" stroke-width="1.1"/>`).join('');
  const fills = [
    ['tile', 'M24 86 L34 72 H206 L216 86 Z'],
    ['wood', 'M40 96 H120 V156 H40 Z M40 110 H120 M36 156 H124 V162 H36 Z'],
    ['paper', 'M45 111 H115 V151 H45 Z'],
    ['crust', 'M50 132 C49 124 54 120 60 120 C66 120 71 124 70 132 Z M76 132 C75 125 80 122 84 122 C88 122 93 125 92 132 Z'],
    ['wood', 'M136 92 H142 V178 H136 Z M194 92 H200 V178 H194 Z'],
    ['ai', 'M142 97 H160 V128 H142 Z M162 97 H180 V128 H162 Z M182 97 H194 V128 H182 Z'],
  ];
  let lines = `
    <path d="M24 86 L34 72 H206 L216 86"/><path d="${tiles(24, 216, 86, 8)}"/>${eaveRibs}
    <path d="M36 92 V178"/><path d="M204 92 V178"/>
    <path d="M40 96 H120 V156 H40 Z"/><path d="M45 111 H115 V151 H45 Z"/>${lattice}
    <path d="M45 132 H115"/>
    <path d="M50 132 C49 124 54 120 60 120 C66 120 71 124 70 132"/><path d="M54 124 L64 131 M58 121 L68 129 M66 121 L54 130 M70 126 L60 131" stroke-width="0.9"/>
    <path d="M76 132 C75 125 80 122 84 122 C88 122 93 125 92 132"/><path d="M84 125.5 h.5" stroke-width="2.4"/>
    <path d="M36 156 H124 V162 H36 Z"/>
    <path d="M136 92 H142 V178 H136 Z"/><path d="M194 92 H200 V178 H194 Z"/>
    <path d="M132 95 H204" stroke-width="2.2"/>
    <path d="M142 97 H160 V128 H142 Z"/><path d="M162 97 H180 V128 H162 Z"/><path d="M182 97 H194 V128 H182 Z"/>
    <path d="M171 106 C175 106 177 108.5 177 112 C177 115.5 175 118 171 118 C167 118 165 115.5 165 112 C165 108.5 167 106 170 106" class="ink-paper"/>
    <path d="M167 114.5 C167 111 169 109.5 171 109.5 C173 109.5 175 111 175 114.5 Z" class="ink-paper" stroke-width="1.2"/>
    <path d="M142 130 H194"/><path d="M168 130 V178"/>
    <path d="M142 146 H194 M142 162 H194 M155 130 V178 M181 130 V178" stroke-width="0.9"/>
    <path d="M164 152 v6" stroke-width="2"/><path d="M172 152 v6" stroke-width="2"/>
    <path d="M130 178 V175 H206 V178"/>`;

  if (level >= 3) {
    // 橱窗摆满、门口小树
    fills.push(
      ['crust', 'M97 132 V122 C95 118 99 115 103 115 H107 C111 115 115 118 113 122 V132 Z M52 151 C51 145 55 142 59 142 C63 142 67 145 66 151 Z'],
      ['leaf', 'M128 166 C120 164 120 152 128 152 C126 146 136 144 137 152 C144 151 144 164 136 166 Z'],
      ['crust', 'M123 167 H139 L137 178 H125 Z'],
    );
    lines += `
    <path d="M97 132 V122 C95 118 99 115 103 115 H107 C111 115 115 118 113 122 V132"/>
    <path d="M52 151 C51 145 55 142 59 142 C63 142 67 145 66 151"/>
    <path d="M74 151 L76 144 H96 L98 151"/><path d="M80 144 l4 -9"/><path d="M86 144 l1 -10"/><path d="M92 144 l-2 -8"/>
    <path d="M102 151 h10 M104 147 h6" stroke-width="1.1"/>
    <path d="M128 166 C120 164 120 152 128 152 C126 146 136 144 137 152 C144 151 144 164 136 166" stroke-width="1.3"/>
    <path d="M131 167 V160 M131 162 l-3 -3" stroke-width="1.2"/>
    <path d="M123 167 H139 L137 178 H125 Z"/>`;
    // 竖写「面包」吊牌
    fills.push(['wood', 'M202 100 H214 V138 H202 Z']);
    lines += `
    <path d="M206 96 V100 M210 96 V100" stroke-width="1"/>
    <path d="M202 100 H214 V138 H202 Z"/>
    <text x="208" y="115" font-size="9.5" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">面</text>
    <text x="208" y="129" font-size="9.5" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">包</text>`;
    // 门口一盏灯笼 + 橱窗前的长椅，椅子上一只打盹的猫和一篮面包（熟客常坐的地方）
    fills.push(
      ['shu', 'M122 92 Q128 88 134 92 V106 Q128 110 122 106 Z'],
      ['wood', 'M46 164 H114 V167 H46 Z'],
      ['soft', 'M56 164 C55 157 61 153 68 153 C76 153 80 157 79 164 Z'],
      ['crust', 'M95 158 C95 154 99 152 102 152 C105 152 108 154 107 158 Z'],
    );
    lines += `
    <path d="M128 86 V90"/><path d="M122 92 Q128 88 134 92 V106 Q128 110 122 106 Z"/>
    <path d="M122 97 H134 M122 101 H134" stroke-width=".8"/><path d="M128 108 V113" stroke-width="1.1"/>
    <path d="M46 164 H114 V167 H46 Z"/><path d="M50 167 V178 M110 167 V178"/>
    <path d="M56 164 C55 157 61 153 68 153 C76 153 80 157 79 164"/>
    <path d="M60 156 l1 -4 l3 3"/><path d="M65 154 l2 -4 l2 4"/>
    <path d="M61 159 q1.5 1 3 0" stroke-width="1"/><path d="M79 162 q6 0 5 -5" stroke-width="1.2"/>
    <path d="M92 164 L94 158 H108 L110 164"/><path d="M95 158 C95 154 99 152 102 152 C105 152 108 154 107 158"/>`;
  }
  if (level === 3) {
    // 熟客小店：门口的红毡长凳和红色大伞（野点伞），凳上一杯茶、一个面包
    fills.push(
      ['shu', 'M220 120 Q242 102 264 120 Z M214 158 H254 V162 H214 Z'],
      ['wood', 'M214 162 H254 V165 H214 Z'],
      ['crust', 'M232 158 C232 154 235 152 238 152 C241 152 244 154 243 158 Z'],
      ['paper', 'M220 158 V152 H227 V158 Z'],
    );
    lines += `
    <path d="M242 162 V104"/>
    <path d="M220 120 Q242 102 264 120 Z"/><path d="M242 104 L229 120 M242 104 V120 M242 104 L255 120" stroke-width=".9"/>
    <path d="M220 120 q5.5 3 11 0 q5.5 3 11 0 q5.5 3 11 0 q5.5 3 11 0" stroke-width="1"/>
    <path d="M214 158 H254 V162 H214 Z"/><path d="M214 162 H254 V165 H214 Z"/><path d="M218 165 V178 M250 165 V178"/>
    <path d="M220 158 V152 H227 V158 Z" stroke-width="1.1"/><path d="M222 149 q-1.5 -2 0 -4 M225 149 q-1.5 -2 0 -4" stroke-width=".9"/>
    <path d="M232 158 C232 154 235 152 238 152 C241 152 244 154 243 158"/>`;
  }
  if (level === 4) {
    // 街角面包店：门面往右扩出一间，多一扇大橱窗；左边再挂一盏灯笼成一对；窗台香草；门口停着自行车
    fills.push(
      ['tile', 'M216 86 L222 72 H270 L276 86 Z'],
      ['paper', 'M214 92 H272 V178 H214 Z'],
      ['wood', 'M222 98 H266 V154 H222 Z M220 154 H268 V159 H220 Z'],
      ['paper', 'M226 104 H262 V150 H226 Z'],
      ['crust', 'M230 128 C229 121 234 118 239 118 C244 118 249 121 248 128 Z M232 150 Q236 141 244 140 Q252 141 256 150 Q251 147 244 148 Q237 147 232 150 Z M252 128 V121 C250 118 253 116 256 116 H258 C261 116 263 118 261 121 V128 Z'],
      ['shu', 'M30 92 Q36 88 42 92 V106 Q36 110 30 106 Z'],
      ['leaf', 'M52 150 q3 -6 6 0 Z M74 150 q3 -7 6 0 Z M96 150 q3 -6 6 0 Z'],
      ['crust', 'M51 150 H59 L58 156 H52 Z M73 150 H81 L80 156 H74 Z M95 150 H103 L102 156 H96 Z'],
      ['wood', 'M253 151 H263 V157 H253 Z'],
      ['crust', 'M255 151 C255 148 257 146 259 146 C261 146 263 148 262 151 Z'],
    );
    lines += `
    <path d="M216 86 L222 72 H270 L276 86"/><path d="${tiles(216, 276, 86, 7.5)}"/>
    <path d="M272 92 V178"/>
    <path d="M222 98 H266 V154 H222 Z"/><path d="M226 104 H262 V150 H226 Z"/><path d="M226 128 H262"/>
    <path d="M220 154 H268 V159 H220 Z"/>
    <path d="M230 128 C229 121 234 118 239 118 C244 118 249 121 248 128"/><path d="M236 120 q2 3 1 6 M241 120 q2 3 1 6" stroke-width="1"/>
    <path d="M252 128 V121 C250 118 253 116 256 116 H258 C261 116 263 118 261 121 V128"/>
    <path d="M232 150 Q236 141 244 140 Q252 141 256 150 Q251 147 244 148 Q237 147 232 150"/>
    <path d="M36 86 V90"/><path d="M30 92 Q36 88 42 92 V106 Q36 110 30 106 Z"/>
    <path d="M30 97 H42 M30 101 H42" stroke-width=".8"/><path d="M36 108 V113" stroke-width="1.1"/>
    <path d="M51 150 H59 L58 156 H52 Z M73 150 H81 L80 156 H74 Z M95 150 H103 L102 156 H96 Z" stroke-width="1.1"/>
    <path d="M52 150 q3 -6 6 0 M74 150 q3 -7 6 0 M96 150 q3 -6 6 0" stroke-width="1"/>
    <path d="M236 162 a8 8 0 1 0 .1 0"/><path d="M258 162 a8 8 0 1 0 .1 0"/>
    <path d="M236 170 L243 159 L258 170 M243 159 H253 L258 170 M243 159 L241 154 M238 154 H244 M253 159 L255 152"/>
    <path d="M253 151 H263 V157 H253 Z" stroke-width="1.2"/><path d="M255 151 C255 148 257 146 259 146 C261 146 263 148 262 151" stroke-width="1.1"/>`;
  }
  return { fills, lines };
}

// Lv2：一间小小的单间铺子：斜斜的小屋顶、檐下一块木招牌、一扇小售卖窗、一扇窄格子门
function tinyShop() {
  const lattice = [146, 158].map((x) => `<path d="M${x} 104 V178" stroke-width=".9"/>`).join('') + [122, 140, 158].map((y) => `<path d="M134 ${y} H170" stroke-width=".9"/>`).join('');
  return wrap(`
    ${crayon([
      ['tile', 'M44 78 L58 62 H182 L196 78 Z'],
      ['wood', 'M76 80 H164 V96 H76 Z'],
      ['paper', 'M66 108 H118 V148 H66 Z'],
      ['ai', 'M66 108 H90 V120 H66 Z M94 108 H118 V120 H94 Z'],
      ['wood', 'M62 148 H122 V154 H62 Z M130 100 H134 V178 H130 Z M170 100 H174 V178 H170 Z'],
      ['crust', 'M72 148 C71 141 76 137 82 137 C88 137 93 141 92 148 Z M98 148 C98 142 102 139 107 139 C112 139 115 142 115 148 Z'],
    ])}
    <path d="M4 178 Q120 180 236 177"/>
    <path d="M44 78 L58 62 H182 L196 78 Z"/><path d="M70 62 L66 78 M94 62 V78 M120 62 V78 M146 62 V78 M170 62 L174 78" stroke-width=".8" opacity=".55"/>
    <path d="M56 78 V178"/><path d="M184 78 V178"/>
    <path d="M76 80 H164 V96 H76 Z"/>
    <path d="M66 108 H118 V148 H66 Z"/>
    <path d="M66 108 H90 V120 H66 Z"/><path d="M94 108 H118 V120 H94 Z"/>
    <path d="M72 148 C71 141 76 137 82 137 C88 137 93 141 92 148"/><path d="M80 140 q2 3 1 6" stroke-width="1"/>
    <path d="M98 148 C98 142 102 139 107 139 C112 139 115 142 115 148"/>
    <path d="M62 148 H122 V154 H62 Z"/>
    <path d="M130 100 H134 V178 H130 Z"/><path d="M170 100 H174 V178 H170 Z"/><path d="M134 104 H170"/>${lattice}
    <path d="M150 140 v6" stroke-width="2"/>
    <path d="M126 178 V175 H178 V178"/>
    <g transform="translate(8 145) scale(0.6)" stroke-width="2.5">${mascotBody('wave')}</g>
  `, '0 0 240 190', 'store', 1.5);
}

// Lv1：一辆木头面包小推车，布篷下挂着短暖帘，车上摆着几个面包
function stallCart() {
  return wrap(`
    ${crayon([
      ['wood', 'M72 40 H168 V58 H72 Z'],
      ['tile', 'M48 76 L64 62 H176 L192 76 Z'],
      ['ai', 'M64 78 H90 V96 H64 Z M94 78 H120 V96 H94 Z M124 78 H150 V96 H124 Z M154 78 H176 V96 H154 Z'],
      ['wood', 'M60 124 H180 V156 H60 Z'],
      ['crust', 'M70 124 C69 116 75 112 82 112 C89 112 95 116 94 124 Z M100 124 C99 117 104 114 110 114 C116 114 121 117 120 124 Z M128 124 V116 C126 112 130 109 134 109 H140 C144 109 148 112 146 116 V124 Z M154 124 C154 118 158 115 163 115 C168 115 171 118 171 124 Z'],
      ['tile', 'M80 154 a12 12 0 1 0 .1 0 Z M160 154 a12 12 0 1 0 .1 0 Z'],
    ])}
    <path d="M4 178 Q120 180 236 177"/>
    <path d="M72 40 H168 V58 H72 Z"/><path d="M84 58 V62 M156 58 V62"/>
    <path d="M48 76 L64 62 H176 L192 76 Z"/><path d="M64 62 L60 76 M88 62 L86 76 M112 62 V76 M136 62 L138 76 M160 62 L164 76" stroke-width=".9" opacity=".6"/>
    <path d="M64 78 H90 V96 H64 Z"/><path d="M94 78 H120 V96 H94 Z"/><path d="M124 78 H150 V96 H124 Z"/><path d="M154 78 H176 V96 H154 Z"/>
    <path d="M62 76 V124"/><path d="M178 76 V124"/>
    <path d="M70 124 C69 116 75 112 82 112 C89 112 95 116 94 124"/><path d="M78 115 q2 3 1 6 M84 114 q2 3 1 6" stroke-width="1"/>
    <path d="M100 124 C99 117 104 114 110 114 C116 114 121 117 120 124"/>
    <path d="M128 124 V116 C126 112 130 109 134 109 H140 C144 109 148 112 146 116 V124"/>
    <path d="M154 124 C154 118 158 115 163 115 C168 115 171 118 171 124"/>
    <path d="M56 124 H184"/><path d="M60 124 H180 V156 H60 Z"/><path d="M60 140 H180" stroke-width=".9" opacity=".6"/>
    <path d="M180 132 H206 L212 126" stroke-width="2"/>
    <path d="M80 154 a12 12 0 1 0 .1 0"/><path d="M80 160 V172 M74 166 H86" stroke-width="1"/>
    <path d="M160 154 a12 12 0 1 0 .1 0"/><path d="M160 160 V172 M154 166 H166" stroke-width="1"/>
    <g transform="translate(18 145) scale(0.6)" stroke-width="2.5">${mascotBody('wave')}</g>
  `, '0 0 240 190', 'store', 1.5);
}

// 和风町屋（Lv3–4）
function machiya(level, cls) {
  const g = groundFloor(level);
  const W = widthOf(level);
  const roofRibs = Array.from({ length: 12 }, (_, i) => `<path d="M${40 + i * 15} 23 V31" stroke-width=".8" opacity=".55"/>`).join('');
  return wrap(`
    ${crayon([['tile', 'M22 32 L30 22 H210 L218 32 Z'], ['wood', 'M60 38 H180 V60 H60 Z'], ...g.fills])}
    <path d="M4 178 Q${W / 2} 180 ${W - 4} 177"/>
    <path d="M22 32 L30 22 H210 L218 32 Z"/>${roofRibs}
    <path d="M30 32 V72"/><path d="M210 32 V72"/>
    <path d="M60 38 H180 V60 H60 Z"/><path d="M64 42 H176" stroke-width="0.8" opacity=".5"/>
    <path d="M78 38 L82 32"/><path d="M162 38 L158 32"/>
    ${g.lines}
    <g transform="translate(8 145) scale(0.6)" stroke-width="2.5">${mascotBody('wave')}</g>
  `, `0 0 ${W} 190`, `store ${cls}`, 1.5);
}

// 昭和复古（Lv5–6）和现代（Lv7–8）：一楼 + 可选二楼 + 街景
function grownShop(level, cls) {
  const W = widthOf(level);
  if (level >= 7) {
    const m = modernShop(level);
    const st = streetExtras(level);
    const top = level >= 8 ? TOP3 : 0;
    const f = level >= 8 ? flagshipTop() : { fills: [], lines: '' };
    return wrap(`
      ${crayon(f.fills)}
      ${f.lines}
      <g transform="translate(0 ${top})">
        ${level >= 8 ? pineTree(UP) : ''}
        ${crayon(m.fills)}
        <path d="M4 ${178 + UP} Q${W / 2} ${180 + UP} ${W - 4} ${177 + UP}"/>
        ${m.lines}
        <g transform="translate(0 ${UP})">
          ${crayon(st.fills)}
          ${st.lines}
          <g transform="translate(8 145) scale(0.6)" stroke-width="2.5">${mascotBody('wave')}</g>
        </g>
      </g>
    `, `0 0 ${W} ${190 + UP + top}`, `store ${cls}`, 1.5);
  }
  const two = level === 6;
  const dy = two ? UP : 0;
  const g = retroGround(level);
  const u = two ? retroUpper() : { fills: [], lines: '' };
  const st = streetExtras(level);
  return wrap(`
    ${level >= 8 ? pineTree(dy) : ''}
    ${crayon(u.fills)}
    ${u.lines}
    <g transform="translate(0 ${dy})">
      ${crayon([...g.fills, ...st.fills])}
      <path d="M4 178 Q${W / 2} 180 ${W - 4} 177"/>
      ${g.lines}
      ${st.lines}
      <g transform="translate(8 145) scale(0.6)" stroke-width="2.5">${mascotBody('wave')}</g>
    </g>
  `, `0 0 ${W} ${190 + dy}`, `store ${cls}`, 1.5);
}

export function storefront(level = 3, cls = '') {
  const tag = (svg) => svg.replace('class="sk store', `class="sk store ${cls}`);
  if (level <= 1) return tag(stallCart());
  if (level === 2) return tag(tinyShop());
  if (level <= 4) return machiya(level, cls);
  return grownShop(level, cls);
}

// ---------- 烤箱：显示屏位置留给 HTML 叠加倒计时 ----------

export function ovenScene(cls = '', baking = false, done = false) {
  return wrap(`
    ${crayon([['soft', 'M10 22 H110 V92 H10 Z'], ['skysoft', 'M22 46 H98 V82 H22 Z'], ['sky', 'M10 92 H110 V97 H10 Z']], 1.6, 1.8)}
    ${baking ? '<rect class="oven-glow" x="23" y="47" width="74" height="34" rx="2" stroke="none"/>' : ''}
    ${baking ? crayon([['crust', 'M36 76 C34 64 46 58 60 58 C74 58 86 64 84 76 Z']], 0, 0).replace('class="crayon"', 'class="crayon rise"') : ''}
    <path d="M10 22 H110 V92 H10 Z"/><path d="M10 36 H110"/>
    <path d="M22 46 H98 V82 H22 Z"/>
    <path d="M20 29 a3 3 0 1 0 .1 0"/><path d="M100 29 a3 3 0 1 0 .1 0"/>
    <path d="M42 25 H78 V33 H42 Z" stroke-width="1.6"/>
    <path d="M30 42 H90" stroke-width="2.6"/>
    <path d="M16 93 v6"/><path d="M104 93 v6"/>
    ${baking ? `<path d="M36 76 C34 64 46 58 60 58 C74 58 86 64 84 76 Z" class="rise"/>
      <path d="M30 18 q-4 -5 0 -10" class="steam"/><path d="M60 16 q-4 -5 0 -10" class="steam s2"/><path d="M90 18 q-4 -5 0 -10" class="steam s3"/>` : done ? `${crayon([['crust', 'M36 76 C34 62 46 56 60 56 C74 56 86 62 84 76 Z']], 0.8, 1)}
      <path d="M36 76 C34 62 46 56 60 56 C74 56 86 62 84 76 Z"/><path d="M50 62 q3 3 2 8"/><path d="M60 59 q3 3 2 8"/><path d="M70 62 q3 3 2 8"/>` : '<path d="M44 76 H76" stroke-dasharray="3 5"/>'}
  `, '0 0 120 104', cls);
}

// 发酵：烤盘上一排排小面团，跟着发酵进度一点点变大（progress 0→1），等待时还会轻轻呼吸
// 圆滚滚的小面团：底部略宽、顶部圆，像刚滚圆放上烤盘的样子
const dome = (cx, y, w) => {
  const h = w * 0.5;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  return `M${x0} ${y} C${x0 - w * 0.04} ${y - h * 0.7} ${cx - w * 0.32} ${y - h} ${cx} ${y - h} C${cx + w * 0.32} ${y - h} ${x1 + w * 0.04} ${y - h * 0.7} ${x1} ${y} Q${cx} ${y + w * 0.06} ${x0} ${y} Z`;
};
const PROOF_BUNS = [
  // 后排小一点、前排大一点，做出一点透视
  [36, 58, 15], [60, 58, 15], [84, 58, 15],
  [26, 70, 19], [60, 70, 19], [94, 70, 19],
];
export function proofScene(cls = '', running = false, progress = 0) {
  const g = (0.66 + 0.34 * Math.min(1, Math.max(0, progress))).toFixed(3);
  const buns = PROOF_BUNS.map(([cx, y, w], k) => `
    <g class="bun" style="transform-origin:${cx}px ${y}px">
      <g class="${running ? 'breathe' : ''}" style="transform-origin:${cx}px ${y}px;animation-delay:${(k * 0.55).toFixed(2)}s">
        ${crayon([['soft', dome(cx, y, w)]], 0.6, 0.8)}
        <path d="${dome(cx, y, w)}"/>
        ${k === 4 ? `<path d="M${cx - 5} ${y - 6} q1.5 1.5 3 0" stroke-width="1.3"/><path d="M${cx + 2} ${y - 6} q1.5 1.5 3 0" stroke-width="1.3"/><path d="M${cx - 1.5} ${y - 3} q1.5 1 3 0" stroke-width="1.2"/>` : ''}
      </g>
    </g>`).join('');
  return wrap(`
    ${crayon([['tile', 'M8 72 L22 50 H98 L112 72 Z'], ['tile', 'M8 72 H112 V78 H8 Z'], ['paper', 'M16 69 L27 53 H93 L104 69 Z']], 1.2, 1.4)}
    <path d="M8 72 L22 50 H98 L112 72 Z"/>
    <path d="M16 69 L27 53 H93 L104 69 Z" stroke-width=".9" opacity=".6"/>
    <path d="M8 72 H112 V78 H8 Z"/>
    <path d="M16 84 h88" stroke-width="1" opacity=".35"/>
    <g class="grow" data-grow-scale style="--g:${g}">${buns}</g>
    ${running ? `<text class="zz" x="70" y="38" font-size="10" stroke="none" fill="currentColor" font-family="Courier Prime, monospace">z</text>
      <text class="zz z2" x="76" y="30" font-size="8" stroke="none" fill="currentColor" font-family="Courier Prime, monospace">z</text>` : ''}
  `, '0 0 120 104', cls);
}

// 其他步骤（揉面、整形、混合……）：案板上的面团被擀面杖压来压去，扬起一点面粉
export function makeScene(cls = '', running = true) {
  return wrap(`
    ${crayon([['wood', 'M8 84 H112 V92 H8 Z'], ['wood', 'M24 52 H96 V58 H24 Z']], 1.2, 1.4)}
    <g class="${running ? 'knead' : ''}">
      ${crayon([['soft', 'M34 84 C32 72 44 66 60 66 C76 66 88 72 86 84 Z']], 0.8, 1)}
      <path d="M34 84 C32 72 44 66 60 66 C76 66 88 72 86 84"/>
    </g>
    <g class="${running ? 'roll' : ''}">
      <path d="M24 52 H96 V58 H24 Z"/><path d="M24 55 H12"/><path d="M96 55 H108"/>
      <path d="M12 52 v6 M108 52 v6" stroke-width="2.6"/>
    </g>
    ${running ? '<g class="flour"><circle cx="30" cy="76" r="1"/><circle cx="92" cy="72" r="1.2"/><circle cx="24" cy="68" r=".8"/><circle cx="98" cy="80" r=".9"/></g>' : ''}
    <path d="M8 84 H112 V92 H8 Z"/>
    <path d="M14 92 v8 M106 92 v8"/>
  `, '0 0 120 104', cls);
}

// 整形 / 分割：刮板一下一下切右边的长面团，左边两个小面团在转圈收圆
export function shapeScene(cls = '') {
  const ball = (cx, w) => dome(cx, 84, w);
  const log = 'M80 84 C79 74 84 71 96 71 C108 71 113 74 112 84 Z';
  return wrap(`
    ${crayon([['wood', 'M8 84 H112 V92 H8 Z'], ['soft', ball(22, 20)], ['soft', log]], 1.2, 1.4)}
    <path d="${ball(22, 20)}"/><path d="${log}"/>
    <g class="roundup" style="transform-origin:52px 84px">
      ${crayon([['soft', ball(52, 24)]], 0.8, 1)}
      <path d="${ball(52, 24)}"/><path d="M45 76 q7 -5 14 0" stroke-width="1.2" opacity=".6"/>
    </g>
    <g class="chop">
      ${crayon([['tile', 'M89 52 H103 V66 H89 Z'], ['wood', 'M89 46 H103 V52 H89 Z']], 0.8, 1)}
      <path d="M89 52 H103 V66 H89 Z"/><path d="M89 46 H103 V52 H89 Z"/>
    </g>
    <g class="flour"><circle cx="14" cy="78" r="1"/><circle cx="72" cy="76" r="1.1"/><circle cx="36" cy="70" r=".8"/><circle cx="108" cy="66" r=".9"/></g>
    <path d="M8 84 H112 V92 H8 Z"/>
    <path d="M14 92 v8 M106 92 v8"/>
  `, '0 0 120 104', cls);
}

// 冷却：出炉的面包躺在晾网上，冒着热气
export function coolScene(cls = '') {
  return wrap(`
    ${crayon([['crust', 'M30 74 C28 56 44 48 60 48 C76 48 92 56 90 74 Z']], 0.9, 1.1)}
    <path d="M30 74 C28 56 44 48 60 48 C76 48 92 56 90 74 Z"/>
    <path d="M46 56 q4 4 2 10"/><path d="M58 53 q4 4 2 10"/><path d="M70 56 q4 4 2 10"/>
    <path d="M10 76 H110 V80 H10 Z"/>
    <path d="M20 76 V80 M30 76 V80 M40 76 V80 M50 76 V80 M60 76 V80 M70 76 V80 M80 76 V80 M90 76 V80 M100 76 V80" stroke-width="1"/>
    <path d="M16 80 v10 M104 80 v10"/><path d="M12 90 h8 M100 90 h8"/>
    <path d="M44 40 q-4 -5 0 -10" class="steam"/><path d="M60 36 q-4 -5 0 -10" class="steam s2"/><path d="M76 40 q-4 -5 0 -10" class="steam s3"/>
  `, '0 0 120 104', cls);
}

// 装饰 / 挤馅：裱花袋往切开的面包里挤甘纳许，顶上撒脆脆珠
export function decorateScene(cls = '') {
  return wrap(`
    ${crayon([['wood', 'M10 86 H110 V92 H10 Z'], ['crust', 'M28 84 C26 66 42 58 58 58 C74 58 90 66 88 84 Z']], 1, 1.2)}
    <path d="M10 86 H110 V92 H10 Z"/>
    <path d="M28 84 C26 66 42 58 58 58 C74 58 90 66 88 84 Z"/>
    <path d="M36 70 Q58 60 80 70" stroke-width="3.4" class="ganache"/>
    <path class="pearl" d="M40 66.5 h.1 M50 63.4 h.1 M62 62.6 h.1 M73 64.8 h.1" stroke-width="3"/>
    <g class="squeeze" style="transform-origin:84px 22px">
      ${crayon([['paper', 'M70 14 L100 26 L74 46 Z']], 0.6, 0.8)}
      <path d="M70 14 L100 26 L74 46 Z"/><path d="M74 46 L70 52" stroke-width="2.6"/>
      <path d="M76 22 q6 3 12 4" stroke-width="1" opacity=".5"/>
    </g>
    <circle class="drip" cx="69" cy="56" r="1.8" fill="#4a2c1e" stroke="none"/>
  `, '0 0 120 104', cls);
}

// 按步骤类型选画面：烘烤 → 烤箱，发酵 → 烤盘上长大的面团，整形 → 刮板和小面团，
// 冷却 / 冷藏 → 晾网，装饰 → 裱花袋，其他 → 揉面
export function stageScene(kind, running = false, cls = '', progress = 0) {
  if (kind === 'bake') return ovenScene(cls, running);
  if (kind === 'ferment') return proofScene(cls, running, progress);
  if (kind === 'shape') return shapeScene(cls);
  if (kind === 'cool' || kind === 'chill') return coolScene(cls);
  if (kind === 'decorate') return decorateScene(cls);
  return makeScene(cls, true);
}

// 空状态：空空的木架子
export function emptyShelf(cls = '') {
  return wrap(`
    <path d="M10 50 H150"/><path d="M14 50 V58"/><path d="M146 50 V58"/>
    <path d="M10 90 H150"/><path d="M14 90 V98"/><path d="M146 90 V98"/>
    <path d="M30 50 V36 H46 V50"/><path d="M28 36 H48"/>
    ${crayon([['crust', 'M110 90 C108 80 116 74 124 74 C132 74 140 80 138 90 Z']])}
    <path d="M110 90 C108 80 116 74 124 74 C132 74 140 80 138 90"/>
    <path d="M60 30 q6 -4 12 0" stroke-dasharray="2 3"/>
  `, '0 20 160 84', cls);
}

// ---------- 菜单栏图标（可上色版本） ----------
export const TAB_ICONS = {
  shop: {
    fill: [['tile', 'M6 22 L12 12 H52 L58 22 Z'], ['ai', 'M17 26 H31 V40 H17 Z M33 26 H47 V40 H33 Z']],
    line: '<path d="M6 22 L12 12 H52 L58 22 Z"/><path d="M12 22 V54"/><path d="M52 22 V54"/><path d="M14 26 H50"/><path d="M17 26 H31 V40 H17 Z"/><path d="M33 26 H47 V40 H33 Z"/><path d="M8 54 H56"/><path d="M32 40 V54"/>',
  },
  book: {
    fill: [['wood', 'M14 9 H50 V55 H14 Z'], ['paper', 'M36 15 H44 V33 H36 Z']],
    line: '<path d="M14 9 H50 V55 H14 Z"/><path d="M22 9 V55"/><path d="M14 17 H22 M14 27 H22 M14 37 H22 M14 47 H22" stroke-width="1.6"/><path d="M36 15 H44 V33 H36 Z" stroke-width="1.8"/>',
  },
  rack: {
    fill: [['wood', 'M8 30 H56 V34 H8 Z M8 52 H56 V56 H8 Z'], ['crust', 'M14 30 C13 22 19 18 24 18 C29 18 35 22 34 30 Z M38 52 C37 45 42 42 46 42 C50 42 55 45 54 52 Z']],
    line: '<path d="M8 30 H56 V34 H8 Z"/><path d="M8 52 H56 V56 H8 Z"/><path d="M10 34 V56 M54 34 V56" stroke-width="1.8"/><path d="M14 30 C13 22 19 18 24 18 C29 18 35 22 34 30"/><path d="M40 30 V22 H50 V30" stroke-width="1.8"/><path d="M38 52 C37 45 42 42 46 42 C50 42 55 45 54 52"/><path d="M16 52 V44 H28 V52" stroke-width="1.8"/>',
  },
  calendar: {
    fill: [['soft', 'M10 16 H54 V54 H10 Z'], ['crust', 'M10 16 H54 V26 H10 Z']],
    line: '<path d="M10 16 H54 V54 H10 Z"/><path d="M10 26 H54"/><path d="M22 10 V20"/><path d="M42 10 V20"/><path d="M26 44 C25 38 29 35 32 35 C35 35 39 38 38 44 Z"/>',
  },
};
export function tabIcon(name, active) {
  const t = TAB_ICONS[name];
  return wrap((active ? crayon(t.fill, 1.2, 1.4) : '') + t.line, '0 0 64 64', 'ti', 2.6);
}
