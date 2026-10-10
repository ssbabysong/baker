// 简笔画素材
// 线条：砖红色单线（currentColor），故意不完全闭合，再叠 #rough 滤镜做出手抖感。
// 上色：蜡笔质感的色块（#crayon 滤镜），并且和线条错开一点点——像手工印刷时套色没对准。

const wrap = (body, vb = '0 0 64 64', cls = '', sw = 2.2) =>
  `<svg class="sk ${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

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
  cake: '蛋糕', cookie: '饼干', muffin: '玛芬', bagel: '贝果', pretzel: '碱水', melonpan: '蜜瓜包', anpan: '红豆包',
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

export function storefront(cls = '') {
  const eaveRibs = Array.from({ length: 11 }, (_, i) => `<path d="M${42 + i * 15.2} 72 L${36 + i * 16} 86" stroke-width=".8" opacity=".55"/>`).join('');
  const roofRibs = Array.from({ length: 12 }, (_, i) => `<path d="M${40 + i * 15} 23 V31" stroke-width=".8" opacity=".55"/>`).join('');
  const lattice = Array.from({ length: 9 }, (_, i) => `<path d="M${48 + i * 8} 100 V110" stroke-width="1.1"/>`).join('');
  return wrap(`
    ${crayon([
      ['tile', 'M22 32 L30 22 H210 L218 32 Z'],
      ['wood', 'M60 38 H180 V60 H60 Z'],
      ['tile', 'M24 86 L34 72 H206 L216 86 Z'],
      ['wood', 'M40 96 H120 V156 H40 Z M40 110 H120 M36 156 H124 V162 H36 Z'],
      ['paper', 'M45 111 H115 V151 H45 Z'],
      ['crust', 'M50 132 C49 124 54 120 60 120 C66 120 71 124 70 132 Z M76 132 C75 125 80 122 84 122 C88 122 93 125 92 132 Z M97 132 V122 C95 118 99 115 103 115 H107 C111 115 115 118 113 122 V132 Z M52 151 C51 145 55 142 59 142 C63 142 67 145 66 151 Z'],
      ['wood', 'M136 92 H142 V178 H136 Z M194 92 H200 V178 H194 Z'],
      ['ai', 'M142 97 H160 V128 H142 Z M162 97 H180 V128 H162 Z M182 97 H194 V128 H182 Z'],
      ['wood', 'M202 100 H214 V138 H202 Z'],
      ['wood', 'M211 168 L215 149 H227 L231 168 Z'],
      ['leaf', 'M128 166 C120 164 120 152 128 152 C126 146 136 144 137 152 C144 151 144 164 136 166 Z'],
      ['crust', 'M123 167 H139 L137 178 H125 Z'],
    ])}
    <path d="M4 178 Q120 180 236 177"/>
    <!-- 屋顶小瓦 -->
    <path d="M22 32 L30 22 H210 L218 32 Z"/>${roofRibs}
    <path d="M30 32 V72"/><path d="M210 32 V72"/>
    <!-- 木招牌 -->
    <path d="M60 38 H180 V60 H60 Z"/><path d="M64 42 H176" stroke-width="0.8" opacity=".5"/>
    <path d="M78 38 L82 32"/><path d="M162 38 L158 32"/>
    <!-- 瓦檐 -->
    <path d="M24 86 L34 72 H206 L216 86"/><path d="${tiles(24, 216, 86, 8)}"/>${eaveRibs}
    <path d="M36 92 V178"/><path d="M204 92 V178"/>
    <!-- 木框橱窗：上面一排格子，里面两层面包 -->
    <path d="M40 96 H120 V156 H40 Z"/><path d="M45 111 H115 V151 H45 Z"/>${lattice}
    <path d="M45 132 H115"/>
    <path d="M50 132 C49 124 54 120 60 120 C66 120 71 124 70 132"/><path d="M54 124 L64 131 M58 121 L68 129 M66 121 L54 130 M70 126 L60 131" stroke-width="0.9"/>
    <path d="M76 132 C75 125 80 122 84 122 C88 122 93 125 92 132"/><path d="M84 125.5 h.5" stroke-width="2.4"/>
    <path d="M97 132 V122 C95 118 99 115 103 115 H107 C111 115 115 118 113 122 V132"/>
    <path d="M52 151 C51 145 55 142 59 142 C63 142 67 145 66 151"/>
    <path d="M74 151 L76 144 H96 L98 151"/><path d="M80 144 l4 -9"/><path d="M86 144 l1 -10"/><path d="M92 144 l-2 -8"/>
    <path d="M102 151 h10 M104 147 h6" stroke-width="1.1"/>
    <path d="M36 156 H124 V162 H36 Z"/>
    <!-- 门口：门柱、暖帘、格子拉门 -->
    <path d="M136 92 H142 V178 H136 Z"/><path d="M194 92 H200 V178 H194 Z"/>
    <path d="M132 95 H204" stroke-width="2.2"/>
    <path d="M142 97 H160 V128 H142 Z"/><path d="M162 97 H180 V128 H162 Z"/><path d="M182 97 H194 V128 H182 Z"/>
    <path d="M171 106 C175 106 177 108.5 177 112 C177 115.5 175 118 171 118 C167 118 165 115.5 165 112 C165 108.5 167 106 170 106" class="ink-paper"/>
    <path d="M167 114.5 C167 111 169 109.5 171 109.5 C173 109.5 175 111 175 114.5 Z" class="ink-paper" stroke-width="1.2"/>
    <path d="M142 130 H194"/><path d="M168 130 V178"/>
    <path d="M142 146 H194 M142 162 H194 M155 130 V178 M181 130 V178" stroke-width="0.9"/>
    <path d="M164 152 v6" stroke-width="2"/><path d="M172 152 v6" stroke-width="2"/>
    <path d="M130 178 V175 H206 V178"/>
    <!-- 竖写吊牌「面包」 -->
    <path d="M206 96 V100 M210 96 V100" stroke-width="1"/>
    <path d="M202 100 H214 V138 H202 Z"/>
    <text x="208" y="115" font-size="9.5" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">面</text>
    <text x="208" y="129" font-size="9.5" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">包</text>
    <!-- 小黑板 -->
    <path d="M208 178 L215 146 H227 L234 178"/><path d="M211 168 L215 149 H227 L231 168 Z" stroke-width="1.2"/>
    <path d="M217 155 h7 M216 160 h10" stroke-width="1"/>
    <!-- 门口一盆小树 -->
    <path d="M128 166 C120 164 120 152 128 152 C126 146 136 144 137 152 C144 151 144 164 136 166" stroke-width="1.3"/>
    <path d="M131 167 V160 M131 162 l-3 -3" stroke-width="1.2"/>
    <path d="M123 167 H139 L137 178 H125 Z"/>
    <!-- 店长 -->
    <g transform="translate(8 145) scale(0.6)" stroke-width="2.5">${mascotBody('wave')}</g>
  `, '0 0 240 190', `store ${cls}`, 1.5);
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

// 按步骤类型选画面：烘烤 → 烤箱，发酵 → 发酵碗，其他 → 揉面
export function stageScene(kind, running = false, cls = '', progress = 0) {
  if (kind === 'bake') return ovenScene(cls, running);
  if (kind === 'ferment') return proofScene(cls, running, progress);
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
  calendar: {
    fill: [['soft', 'M10 16 H54 V54 H10 Z'], ['crust', 'M10 16 H54 V26 H10 Z']],
    line: '<path d="M10 16 H54 V54 H10 Z"/><path d="M10 26 H54"/><path d="M22 10 V20"/><path d="M42 10 V20"/><path d="M26 44 C25 38 29 35 32 35 C35 35 39 38 38 44 Z"/>',
  },
};
export function tabIcon(name, active) {
  const t = TAB_ICONS[name];
  return wrap((active ? crayon(t.fill, 1.2, 1.4) : '') + t.line, '0 0 64 64', 'ti', 2.6);
}
