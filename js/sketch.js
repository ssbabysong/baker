// 简笔画素材
// 线条：砖红色单线（currentColor），故意不完全闭合，再叠 #rough 滤镜做出手抖感。
// 上色：蜡笔质感的色块（#crayon 滤镜），并且和线条错开一点点——像手工印刷时套色没对准。

const wrap = (body, vb = '0 0 64 64', cls = '') =>
  `<svg class="sk ${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

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
  bagel: {
    fill: [['crust', 'M32 13 C46 13 56 21 56 33 C56 45 45 52 32 52 C18 52 8 45 8 33 C8 22 18 13 32 13 Z M32 27 C27 27 24 29.5 24 33 C24 36 27 38 32 38 C36.5 38 40 36.5 40 33 C40 29.5 37 27 32 27 Z']],
    line: `<path d="M32 13 C46 13 56 21 56 33 C56 45 45 52 32 52 C18 52 8 45 8 33 C8 22 18 13.5 30 13"/>
      <path d="M32 27 C37 27 40 29.5 40 33 C40 36.5 36.5 38 32 38 C27 38 24 36 24 33 C24 29.5 27 27 31 27"/>
      <path d="M18 22 l2 1"/><path d="M44 21 l2 -1"/><path d="M47 42 l2 1"/>`,
  },
};

export const SHAPE_NAMES = {
  loaf: '欧包', toast: '吐司', croissant: '可颂', baguette: '法棍',
  cake: '蛋糕', cookie: '饼干', muffin: '玛芬', bagel: '贝果',
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
    <path d="M14 23 v1.5" stroke-width="3"/><path d="M26 23 v1.5" stroke-width="3"/>
    ${mouth}
    <path d="M9 28 h3" class="blush" stroke-width="2.6"/><path d="M28 28 h3" class="blush" stroke-width="2.6"/>
    ${arms}
    <path d="M12 46 v6 h-4"/><path d="M28 46 v6 h4"/>`;
}

export const mascot = (mood = 'wave', cls = '') => wrap(mascotBody(mood), '-8 0 54 56', `mascot ${cls}`);

// ---------- 门店 ----------

export function storefront(cls = '') {
  return wrap(`
    ${crayon([
      ['crust', 'M18 52 L26 50 H174 L182 52 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 q-8 9 -16.4 0 Z'],
      ['sky', 'M112 128 V74 Q130 66 148 74 V128 Z'],
      ['skysoft', 'M40 74 H96 V112 H40 Z'],
      ['crust', 'M50 96 C48 87 54 82 60 82 C66 82 71 87 69 96 Z M74 96 Q76 86 84 85 Q91 86 90 96 Z'],
    ], 2, 2.4)}
    <path d="M150 22 V8 H164 V30"/>
    <path d="M154 4 q-4 -4 2 -7 q6 -3 2 -8" stroke-width="1.6"/>
    <path d="M28 52 V128"/><path d="M172 52 V128"/>
    <path d="M10 129 Q120 131.5 236 128.5"/>
    <path d="M20 30 L100 18 L180 30"/>
    <path d="M26 33 H174 V50 H26 Z"/>
    <path d="M18 52 L26 50"/><path d="M182 52 L174 50"/>
    <path d="M18 52 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0 q8 9 16.4 0"/>
    <path d="M34.4 52 l-3 9"/><path d="M67.2 52 l-1 9"/><path d="M100 52 v9"/><path d="M132.8 52 l1 9"/><path d="M165.6 52 l3 9"/>
    <path d="M40 74 H96 V112 H40 Z"/><path d="M40 96 H96"/>
    <path d="M50 96 C48 87 54 82 60 82 C66 82 71 87 69 96"/>
    <path d="M74 96 Q76 86 84 85 Q91 86 90 96"/><path d="M78 88 q2 3 0 7" stroke-width="1.6"/>
    <path d="M112 128 V74 Q130 66 148 74 V128"/>
    <path d="M140 102 h1"/>
    ${crayon([['leaf', 'M13 110 q-7 -2 -8 -8 q7 0 8 8 Z M13 105 q6 -3 8 -9 q-7 0 -8 9 Z'], ['crust', 'M6 116 H20 L18 128 H8 Z']], 1.2, 1.4)}
    <path d="M6 116 H20 L18 128 H8 Z" stroke-width="1.8"/><path d="M13 116 V101" stroke-width="1.8"/>
    <path d="M13 110 q-7 -2 -8 -8 q7 0 8 8" stroke-width="1.6"/><path d="M13 105 q6 -3 8 -9 q-7 0 -8 9" stroke-width="1.6"/>
    <g transform="translate(200 82) scale(0.86)">${mascotBody('wave')}</g>
  `, '0 -14 240 150', cls);
}

// ---------- 烤箱：显示屏位置留给 HTML 叠加倒计时 ----------

export function ovenScene(cls = '', baking = false) {
  return wrap(`
    ${crayon([['soft', 'M10 22 H110 V92 H10 Z'], ['skysoft', 'M22 46 H98 V82 H22 Z'], ['sky', 'M10 92 H110 V97 H10 Z']], 1.6, 1.8)}
    ${baking ? crayon([['crust', 'M36 76 C34 64 46 58 60 58 C74 58 86 64 84 76 Z']], 0, 0).replace('class="crayon"', 'class="crayon rise"') : ''}
    <path d="M10 22 H110 V92 H10 Z"/><path d="M10 36 H110"/>
    <path d="M22 46 H98 V82 H22 Z"/>
    <path d="M20 29 a3 3 0 1 0 .1 0"/><path d="M100 29 a3 3 0 1 0 .1 0"/>
    <path d="M42 25 H78 V33 H42 Z" stroke-width="1.6"/>
    <path d="M30 42 H90" stroke-width="2.6"/>
    <path d="M16 93 v6"/><path d="M104 93 v6"/>
    ${baking ? `<path d="M36 76 C34 64 46 58 60 58 C74 58 86 64 84 76 Z" class="rise"/>
      <path d="M30 18 q-4 -5 0 -10" class="steam"/><path d="M60 16 q-4 -5 0 -10" class="steam s2"/><path d="M90 18 q-4 -5 0 -10" class="steam s3"/>` : '<path d="M44 76 H76" stroke-dasharray="3 5"/>'}
  `, '0 0 120 104', cls);
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
