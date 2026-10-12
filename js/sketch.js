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
  // 甜甜圈：粉色糖霜盖住上半圈，撒几根彩针
  donut: {
    fill: [['crust', 'M32 13 C46 13 56 21 56 33 C56 45 45 52 32 52 C18 52 8 45 8 33 C8 22 18 13 32 13 Z'],
      ['pink', 'M11 31 C11 21 21 15 32 15 C43 15 53 21 53 31 Q50 35 46 32 Q42 37 38 33 Q34 37 30 33 Q26 37 22 33 Q18 36 14 33 Q12 34 11 31 Z'],
      ['paper', 'M32 26 C37 26 40 28.5 40 31.5 C40 34.5 36.5 36 32 36 C27 36 24 34.5 24 31.5 C24 28.5 27 26 32 26 Z']],
    line: `<path d="M32 13 C46 13 56 21 56 33 C56 45 45 52 32 52 C18 52 8 45 8 33 C8 22 18 13.5 30 13"/>
      <path d="M11 31 Q14 35 18 33 Q22 37 26 33 Q30 37 34 33 Q38 37 42 33 Q46 36 50 32 Q52 33 53 30" stroke-width="1.6"/>
      <path d="M32 26 C37 26 40 28.5 40 31.5 C40 34.5 36.5 36 32 36 C27 36 24 34.5 24 31.5 C24 28.5 27 26 31 26"/>
      <path class="sp1" d="M18 24 l3 -1 M44 21 l2 2" stroke-width="2"/><path class="sp2" d="M26 19 l2 2 M47 28 l3 0" stroke-width="2"/><path class="sp3" d="M36 18 l2 -1 M15 29 l2 1" stroke-width="2"/>`,
  },
  // 盐面包：胖胖的直筒（不是可颂那样两头尖的月牙），一头露出卷起来的螺旋截面，
  // 底下一圈烤得金黄的黄油脆底，顶上几颗大海盐粒
  shiopan: {
    fill: [['custard', 'M5 47 Q9 42 15 44 L49 44 Q55 42 59 47 Q57 51.5 50 50.5 Q32 53 14 50.5 Q7 51.5 5 47 Z'],
      ['crust', 'M11 41 C9 33 13 26 21 26 L45 25 C53 25 57 31 56 38 C55 43 51 46 45 46 L20 46 C15 46 12 44 11 41 Z']],
    line: `<path d="M5 47 Q9 42 15 44 M49 44 Q55 42 59 47 Q57 51.5 50 50.5 Q32 53 14 50.5 Q7 51.5 5 47" stroke-width="1.6"/>
      <path d="M11 41 C9 33 13 26 21 26 L45 25 C53 25 57 31 56 38 C55 43 51 46 45 46 L20 46 C15 46 12 44 11 41"/>
      <path d="M19 36 c0 -2 3 -2 3 0 c0 3 -6 3 -6 0 c0 -5 9 -5 9 0 c0 6 -12 6 -12 0" stroke-width="1.6"/>
      <path d="M33 26 q4 9 1 19.5 M44 25.5 q4 9 1 20" stroke-width="1.5"/>
      <path d="M28 30 q8 -2 16 -1" stroke-width="1.3" opacity=".5"/>
      <path class="salt" d="M30 29.5 l2 .3 M39 28.5 l2 -.3 M48 30 l1.6 .8 M36 34 l1.6 .4 M46 36 l1.6 0" stroke-width="3.2"/>`,
  },
  // 司康：矮矮的圆柱，腰上一圈裂口，表面几粒葡萄干
  scone: {
    fill: [['crust', 'M14 50 L16 30 C17 22 24 19 32 19 C40 19 47 22 48 30 L50 50 Q32 53 14 50 Z'], ['soft', 'M16 33 Q32 38 48 33 L48.5 38 Q32 42 15.6 38 Z']],
    line: `<path d="M14 50 L16 30 C17 22 24 19 32 19 C40 19 47 22 48 30 L50 50"/><path d="M13 50 Q32 53 51 50"/>
      <path d="M16 33 Q32 38 48 33"/><path d="M20 27 l3 -2 M38 23 l4 2 M30 24 l1 2" stroke-width="1.4" opacity=".6"/>
      <path d="M19 45 h.1 M27 42 h.1 M36 46 h.1 M44 43 h.1 M41 48 h.1" stroke-width="3.2"/>`,
  },
  // 佛卡夏：扁扁的一大块，手指戳出来的小坑，几根迷迭香
  focaccia: {
    fill: [['crust', 'M8 44 C7 38 9 31 14 30 L50 28 C55 28 57 33 56 42 C55 47 52 49 46 49 L14 50 C10 50 8 48 8 44 Z']],
    line: `<path d="M8 44 C7 38 9 31 14 30 L50 28 C55 28 57 33 56 42 C55 47 52 49 46 49 L14 50 C10 50 8 48 8 44"/>
      <path d="M17 36 a1.4 1.4 0 1 0 .1 0 M27 41 a1.4 1.4 0 1 0 .1 0 M38 35 a1.4 1.4 0 1 0 .1 0 M47 41 a1.4 1.4 0 1 0 .1 0 M21 44 a1 1 0 1 0 .1 0 M33 45 a1 1 0 1 0 .1 0" stroke-width="1.6"/>
      <path class="herb" d="M24 34 q3 -2 6 -1 M29 33 l-1 -2 M27 33.6 l0 2 M42 42 q3 -2 6 -1 M47 41 l-1 -2 M45 41.6 l0 2" stroke-width="1.8"/>`,
  },
  // 布里欧修：花边模子里一个圆身子，头上顶着一个小圆球
  brioche: {
    fill: [['tile', 'M11 40 L16 54 H48 L53 40 Z'], ['crust', 'M10 41 C9 31 19 26 32 26 C45 26 55 31 54 41 Z'], ['crust', 'M32 13 C38 13 41 17 41 22 C41 27 37 30 32 30 C27 30 23 27 23 22 C23 17 27 13 32 13 Z']],
    line: `<path d="M11 41 L16 54 H48 L53 41"/>
      <path d="M21 42 l2 12 M27 42 l1 12 M32 42 v12 M37 42 l-1 12 M43 42 l-2 12" stroke-width="1.5"/>
      <path d="M10 41 C9 31 19 26 32 26 C45 26 55 31 54 41 Q32 44 10 41"/>
      <path d="M32 13 C38 13 41 17 41 22 C41 27 37 30 32 30 C27 30 23 27 23 22 C23 17 27 13 31 13"/>
      <path d="M27 18 q3 -2 6 -1" stroke-width="1.4" opacity=".6"/>`,
  },
  // 蛋挞：酥皮小碗，顶上黄澄澄的蛋液，烤出几个焦点
  eggtart: {
    fill: [['crust', 'M8 30 L14 50 H50 L56 30 C56 38 8 38 8 30 Z'], ['crust', 'M7 30 C7 18 57 18 57 30 C57 39 7 39 7 30 Z'], ['custard', 'M12 30 C12 22 52 22 52 30 C52 35.5 12 35.5 12 30 Z']],
    line: `<path d="M8 31 L14 50 H50 L56 31"/><path d="M13 49 Q32 52 51 49"/>
      <path d="M17 38 l3 11 M25 39 l1.5 11 M32 39 v11 M39 39 l-1.5 11 M47 38 l-3 11" stroke-width="1.5"/>
      <path d="M7 30 C7 18 57 18 57 30 C57 39 7 39 7 30"/>
      <path d="M12 30 C12 22 52 22 52 30 C52 35.5 12 35.5 12 30" stroke-width="1.5"/>
      <path class="spot" d="M23 27 h.1 M35 30 h.1 M43 26 h.1 M29 32 h.1 M40 32 h.1" stroke-width="3.2"/>`,
  },
  // 餐包 / 手撕包：一盘挤在一起的三个小圆包，刷了蛋液亮亮的
  rolls: {
    fill: [['crust', 'M5 46 C4 34 12 28 21 28 C30 28 35 34 34 46 Z'], ['crust', 'M30 46 C29 34 34 28 43 28 C52 28 60 34 59 46 Z'], ['crust', 'M15 49 C14 35 22 26 32 26 C42 26 50 35 49 49 Z']],
    line: `<path d="M5 46 C4 34 12 28 21 28 C25 28 28 29 30 31"/><path d="M34 31 C36 29 39 28 43 28 C52 28 60 34 59 46"/>
      <path d="M15 49 C14 35 22 26 32 26 C42 26 50 35 49 49"/><path d="M4 47 Q32 52 60 47"/>
      <path d="M23 33 q4 -3 9 -3" stroke-width="1.4" opacity=".6"/><path d="M10 36 q3 -3 7 -3 M47 34 q3 -2 7 -1" stroke-width="1.3" opacity=".5"/>`,
  },
  // 泡芙：下半个壳、中间一圈奶油、上面一顶裂开的酥皮盖子，撒点糖粉
  puff: {
    fill: [['crust', 'M11 40 C11 47 19 51 32 51 C45 51 53 47 53 40 Z'], ['paper', 'M10 40 Q14 35 20 38 Q26 34 32 38 Q38 34 44 38 Q50 35 54 40 Q50 44 44 41 Q38 45 32 41 Q26 45 20 41 Q14 44 10 40 Z'],
      ['crust', 'M12 36 C11 24 22 15 32 15 C42 15 53 24 52 36 Z']],
    line: `<path d="M11 40 C11 47 19 51 32 51 C45 51 53 47 53 40"/>
      <path d="M10 40 Q14 35 20 38 Q26 34 32 38 Q38 34 44 38 Q50 35 54 40"/>
      <path d="M12 36 C11 24 22 15 32 15 C42 15 53 24 52 36 Q32 39 12 36"/>
      <path d="M15 29 l5 -3 l4 3 l5 -4 l4 3 l5 -3 l4 3 l5 -2" stroke-width="1.4"/><path d="M24 20 l3 2 M38 19 l2 3" stroke-width="1.3" opacity=".6"/>
      <path class="salt" d="M22 19 h.1 M30 18 h.1 M41 20 h.1 M46 27 h.1 M17 30 h.1" stroke-width="2.4"/>`,
  },
};

export const SHAPE_NAMES = {
  loaf: '欧包', toast: '吐司', croissant: '可颂', shiopan: '盐面包',
  cake: '蛋糕', cookie: '饼干', muffin: '玛芬', bagel: '贝果', pretzel: '碱水', melonpan: '菠萝包', anpan: '红豆包', chocobun: '巧克力包',
  donut: '甜甜圈', baguette: '法棍', scone: '司康', focaccia: '佛卡夏', brioche: '布里欧修', eggtart: '蛋挞', rolls: '餐包', puff: '泡芙',
};
export const SHAPE_NAMES_EN = {
  loaf: 'Loaf', toast: 'Shokupan', croissant: 'Croissant', shiopan: 'Salt bread',
  cake: 'Cake', cookie: 'Cookie', muffin: 'Muffin', bagel: 'Bagel', pretzel: 'Pretzel', melonpan: 'Pineapple bun', anpan: 'Anpan', chocobun: 'Choco bun',
  donut: 'Donut', baguette: 'Baguette', scone: 'Scone', focaccia: 'Focaccia', brioche: 'Brioche', eggtart: 'Egg tart', rolls: 'Dinner rolls', puff: 'Cream puff',
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
  // 店务入口：手绘的齿轮——圆头的齿、线条抖一点、里面上一点蜡笔色
  gear: `<g class="crayon" transform="translate(1.4 1.6)" stroke="none"><path class="f-soft" fill-rule="evenodd" d="M27.6 16.1 L28.6 11.2 Q32.0 8.2 35.4 11.2 L36.4 16.1 Q38.8 17.9 41.7 18.7 L45.5 17.1 Q49.8 17.8 49.5 22.2 L47.2 25.5 Q47.3 28.5 48.5 31.3 L52.8 33.3 Q54.9 37.2 51.3 39.8 L46.5 39.8 Q44.3 41.8 42.9 44.4 L43.4 48.3 Q41.8 52.4 37.6 51.1 L34.9 48.2 Q32.0 47.7 29.1 48.2 L26.1 52.1 Q21.7 53.4 20.0 49.2 L21.1 44.4 Q19.7 41.8 17.5 39.8 L13.2 39.6 Q9.6 37.1 11.7 33.3 L15.5 31.3 Q16.7 28.5 16.8 25.5 L13.8 21.8 Q13.5 17.3 18.0 16.5 L22.3 18.7 Q25.2 17.9 28.2 15.7 Z M32 25 C36.5 25 39 27.5 39 32 C39 36.5 36.5 39 32 39 C27.5 39 25 36.5 25 32 C25 27.8 27.5 25.2 31 25 Z"/></g>
    <path d="M27.6 16.1 L28.6 11.2 Q32.0 8.2 35.4 11.2 L36.4 16.1 Q38.8 17.9 41.7 18.7 L45.5 17.1 Q49.8 17.8 49.5 22.2 L47.2 25.5 Q47.3 28.5 48.5 31.3 L52.8 33.3 Q54.9 37.2 51.3 39.8 L46.5 39.8 Q44.3 41.8 42.9 44.4 L43.4 48.3 Q41.8 52.4 37.6 51.1 L34.9 48.2 Q32.0 47.7 29.1 48.2 L26.1 52.1 Q21.7 53.4 20.0 49.2 L21.1 44.4 Q19.7 41.8 17.5 39.8 L13.2 39.6 Q9.6 37.1 11.7 33.3 L15.5 31.3 Q16.7 28.5 16.8 25.5 L13.8 21.8 Q13.5 17.3 18.0 16.5 L22.3 18.7 Q25.2 17.9 28.2 15.7"/>
    <path d="M32 25 C36.5 25 39 27.5 39 32 C39 36.5 36.5 39 32 39 C27.5 39 25 36.5 25 32 C25 27.8 27.5 25.2 31 25"/>`,
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

// 门店插画随店铺等级变化（8 级 + 4 个隐藏款，见文件后面的 HIDDEN），房子的建筑风格也跟着变：
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
  const h = HIDDEN[level];
  if (h) return { ...h.sign, vbW: h.W, vbH: h.H };
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


// ---------- 隐藏款（Lv9–13）：出炉 200 / 300 / 400 / 500 / 1000 次才解锁 ----------
// 每一款都是单独画的一栋，不再沿用前面的楼层叠加；地平线在 H - 12，店长站在左下角
const mascotAt = (x, y) => `<g transform="translate(${x} ${y}) scale(0.6)" stroke-width="2.5">${mascotBody('wave')}</g>`;
const smoke = (x, y) => `<path d="M${x} ${y} q-6 -6 0 -12 q6 -6 0 -12 q-5 -5 1 -10" stroke-width="1.3" opacity=".55"/><path d="M${x + 8} ${y - 6} q-4 -5 1 -9 q5 -4 1 -9" stroke-width="1.1" opacity=".4"/>`;
const flag = (x, y, c) => ({ fills: [[c, `M${x} ${y} L${x + 16} ${y + 5} L${x} ${y + 10} Z`]], lines: `<path d="M${x} ${y + 22} V${y - 2}"/><path d="M${x} ${y} L${x + 16} ${y + 5} L${x} ${y + 10} Z"/>` });
const bricks = (x0, x1, y0, y1, step = 9) => {
  let out = '';
  for (let y = y0 + step, r = 0; y < y1; y += step, r++) {
    out += `<path d="M${x0} ${y} H${x1}" stroke-width=".6" opacity=".4"/>`;
    for (let x = x0 + (r % 2 ? 9 : 18); x < x1; x += 18) out += `<path d="M${x} ${y - step} v${step}" stroke-width=".6" opacity=".4"/>`;
  }
  return out;
};
const loafRow = (x, y, n, gap = 15) => Array.from({ length: n }, (_, i) => `M${x + i * gap} ${y} c0 -7 4 -10 6 -10 c2 0 6 3 6 10 Z`).join(' ');

// 窗：外框 + 十字/多格窗棂；arch 为真时上沿是半圆
const pane = (x, y, w, h, cols = 2, rows = 2, arch = false) => {
  const top = arch ? `M${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}` : `M${x} ${y} H${x + w}`;
  const frame = arch ? `${top} V${y + h} H${x} Z` : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  let bars = '';
  for (let i = 1; i < cols; i++) bars += `M${x + w * i / cols} ${arch ? y + w / 2 - Math.sqrt(Math.max(0, (w / 2) ** 2 - (w * i / cols - w / 2) ** 2)) : y} V${y + h} `;
  for (let j = 1; j < rows; j++) bars += `M${x} ${y + (arch ? w / 2 : 0) + (h - (arch ? w / 2 : 0)) * j / rows} H${x + w} `;
  return { fill: frame, lines: `<path d="${frame}"/><path d="${bars}" stroke-width=".8"/>` };
};
const lamp = (x, y) => `<path d="M${x} ${y} v-6 M${x - 4} ${y} h8 l-1 9 h-6 Z" stroke-width="1"/><path d="M${x - 3} ${y + 1} h6 l-1 7 h-4 Z" class="glow" stroke="none"/>`;
const topiary = (x, g) => ({ fills: [['leaf', `M${x - 9} ${g - 22} a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z`], ['wood', `M${x - 7} ${g} L${x - 8} ${g - 10} H${x + 8} L${x + 7} ${g} Z`]],
  lines: `<path d="M${x - 9} ${g - 22} a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0"/><path d="M${x} ${g - 13} v3" stroke-width="1"/><path d="M${x - 7} ${g} L${x - 8} ${g - 10} H${x + 8} L${x + 7} ${g}"/>` });
const collect = (...parts) => ({ fills: parts.flatMap((p) => p.fills || []), lines: parts.map((p) => p.lines || '').join('') });


// ---------- 橱窗里的面包和甜点（底边 y，中心 x） ----------
const bakes = {
  baguette: (x, y) => ({ c: 'crust', d: `M${x - 9} ${y} q-2 -4 2 -6 l14 -6 q4 -1 4 2 q1 3 -3 5 l-14 6 q-2 1 -3 -1 Z`, l: `M${x - 4} ${y - 5} l3 2 M${x + 1} ${y - 7} l3 2 M${x + 6} ${y - 9} l3 2` }),
  croissant: (x, y) => ({ c: 'crust', d: `M${x - 9} ${y} q1 -9 9 -9 q8 0 9 9 q-3 -2 -5 -1 q-1 -5 -4 -5 q-3 0 -4 5 q-2 -1 -5 1 Z`, l: `M${x - 4} ${y - 1} q0 -4 2 -6 M${x + 4} ${y - 1} q0 -4 -2 -6` }),
  boule: (x, y) => ({ c: 'crust', d: `M${x - 8} ${y} a8 7 0 0 1 16 0 Z`, l: `M${x - 3} ${y - 6} l6 4 M${x + 3} ${y - 6} l-6 4` }),
  braid: (x, y) => ({ c: 'crust', d: `M${x - 10} ${y} q0 -6 4 -6 q2 -3 6 -2 q4 -2 6 1 q4 0 4 7 Z`, l: `M${x - 5} ${y} q1 -4 3 -5 M${x + 1} ${y} q1 -5 3 -6 M${x + 6} ${y} q1 -4 2 -5` }),
  roll: (x, y) => ({ c: 'crust', d: `M${x - 5} ${y} a5 5 0 0 1 10 0 Z`, l: `M${x - 2} ${y - 3} h4` }),
  cake: (x, y) => ({ c: 'pink', d: `M${x - 9} ${y} h18 v-11 h-18 Z`, l: `M${x - 9} ${y - 4} h18 M${x - 9} ${y - 8} h18 M${x - 9} ${y - 11} q2.25 2 4.5 0 q2.25 2 4.5 0 q2.25 2 4.5 0 q2.25 2 4.5 0`, extra: ['shu', dots([[x - 4, y - 13], [x + 3, y - 13]], 1.6)] }),
  tart: (x, y) => ({ c: 'custard', d: `M${x - 8} ${y} l2 -5 h12 l2 5 Z`, l: `M${x - 6} ${y - 5} q1 2 2 0 q1 2 2 0 q1 2 2 0 q1 2 2 0 q1 2 2 0 q1 2 2 0`, extra: ['shu', dots([[x - 3, y - 6], [x + 1, y - 7], [x + 4, y - 6]], 1.3)] }),
  macarons: (x, y) => ({ c: 'pink', d: `M${x - 6} ${y} a6 2.4 0 0 1 12 0 a6 2.4 0 0 1 -12 0 Z M${x - 6} ${y - 5} a6 2.4 0 0 1 12 0 a6 2.4 0 0 1 -12 0 Z M${x - 6} ${y - 10} a6 2.4 0 0 1 12 0 a6 2.4 0 0 1 -12 0 Z`, l: '', extra: ['leaf', `M${x - 6} ${y - 5} a6 2.4 0 0 1 12 0 a6 2.4 0 0 1 -12 0 Z`] }),
  cupcake: (x, y) => ({ c: 'wood', d: `M${x - 5} ${y} l-1 -6 h12 l-1 6 Z`, l: `M${x - 2} ${y} v-6 M${x + 2} ${y} v-6`, extra: ['pink', `M${x - 7} ${y - 6} q0 -7 7 -8 q7 1 7 8 Z`] }),
  eclair: (x, y) => ({ c: 'custard', d: `M${x - 9} ${y} q-2 -5 3 -5 h12 q5 0 3 5 Z`, l: '', extra: ['choco', `M${x - 8} ${y - 4} q0 -2 3 -2 h10 q3 0 3 2 Z`] }),
};
const display = (list, y) => {
  const items = list.map(([k, x]) => bakes[k](x, y));
  return `${crayon(items.map((it) => [it.c, it.d]))}${crayon(items.filter((it) => it.extra).map((it) => it.extra))}<path d="${items.map((it) => it.d).join(' ')}" stroke-width=".8"/><path d="${items.map((it) => it.l).join(' ')}" stroke-width=".6"/>`;
};
// 窗里的人：坐着的半身、桌子、杯子；kind: 'cup' 端着咖啡 / 'book' 看书 / 'chat' 两个人聊天
const windowScene = (x, y, w, h, kind, coat = 'sky') => {
  const ty = y + h - 7, cx = x + w / 2;
  const person = (px, c, flip = 1) => ({ f: [[c, `M${px - 5} ${ty} q0 -8 5 -9 q5 1 5 9 Z`], ['soft', `M${px - 3.5} ${ty - 12} a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 Z`]],
    l: `M${px - 5} ${ty} q0 -8 5 -9 q5 1 5 9 M${px - 3.5} ${ty - 12} a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 M${px - 3.5} ${ty - 14} q3.5 -4 7 0` });
  let ps = [], extra = '';
  if (kind === 'chat') { ps = [person(cx - 9, coat), person(cx + 9, 'pink')]; extra = `M${cx - 3} ${ty - 1} h2.5 v-2.5 h-2.5 Z M${cx + 1} ${ty - 1} h2.5 v-2.5 h-2.5 Z`; }
  else if (kind === 'book') { ps = [person(cx - 4, coat)]; extra = `M${cx + 1} ${ty - 6} l4 -3 l4 3 M${cx + 5} ${ty - 9} v3`; }
  else { ps = [person(cx - 5, coat)]; extra = `M${cx + 3} ${ty - 1} h3 v-3 h-3 Z M${cx + 6} ${ty - 3} q1.5 0 1.5 1.2`; }
  const lampL = `M${cx} ${y + 1} v5 M${cx - 4} ${y + 9} q4 -6 8 0 Z`;
  return `${crayon(ps.flatMap((p) => p.f))}${crayon([['custard', `M${cx - 4} ${y + 9} q4 -6 8 0 Z`]], 0, 0)}<path d="${ps.map((p) => p.l).join(' ')}" stroke-width=".7"/><path d="M${x + 3} ${ty} H${x + w - 3} M${cx - 8} ${ty} v6 M${cx + 8} ${ty} v6 ${extra} ${lampL}" stroke-width=".7"/>`;
};
const plantLampWin = (x, y, w, h) => { const cx = x + w / 2, by = y + h - 2; return `${crayon([['wood', `M${cx - 4} ${by} l-1 -6 h10 l-1 6 Z`], ['custard', `M${cx - 4} ${y + 9} q4 -6 8 0 Z`]], 0, 0)}${blob(bush([[cx, by - 11, 5], [cx - 4, by - 8, 3.5], [cx + 4, by - 8, 3.5]]), 'leaf', 1)}<path d="M${cx - 4} ${by} l-1 -6 h10 l-1 6 Z M${cx} ${y + 1} v5 M${cx - 4} ${y + 9} q4 -6 8 0 Z" stroke-width=".7"/>`; };
// ---------- 隐藏款的细节小件 ----------
// 窗里一对束起来的窗帘 + 顶上一道荷叶边
const curtains = (x, y, w, h) => `<path d="M${x + 1} ${y + 1} q${w * .22} ${h * .35} ${w * .06} ${h * .62} M${x + w - 1} ${y + 1} q${-w * .22} ${h * .35} ${-w * .06} ${h * .62}" stroke-width=".7"/><path d="M${x} ${y + 3} ${Array.from({ length: Math.max(2, Math.round(w / 6)) }, () => `q${(w / Math.max(2, Math.round(w / 6)) / 2).toFixed(1)} 3 ${(w / Math.max(2, Math.round(w / 6))).toFixed(1)} 0`).join(' ')}" stroke-width=".6"/>`;
// 窗台花箱：木箱 + 一溜叶团 + 几朵花
const flowerBox = (x, y, w, c = 'pink') => {
  const n = Math.max(2, Math.round(w / 8));
  const leaf = bush(Array.from({ length: n }, (_, i) => [x + 4 + i * (w - 8) / (n - 1), y - 2, 4.2]));
  return `${crayon([['wood', `M${x} ${y} H${x + w} V${y + 5} H${x} Z`]])}<path d="M${x} ${y} H${x + w} V${y + 5} H${x} Z" stroke-width=".8"/>${blob(leaf, 'leaf', 1.1)}${crayon([[c, dots(Array.from({ length: n }, (_, i) => [x + 4 + i * (w - 8) / (n - 1) + (i % 2 ? 1.5 : -1.5), y - 4]), 1.7)]], 0, 0)}`;
};
// 排队的客人，借用前面 Lv5 的画法，挪到这一栋的地平线上
const queue = (xs, G) => { const cs = xs.map(([x, c], i) => customer(x, c, i % 2 === 1)); return `<g transform="translate(0 ${G - 178})">${crayon(cs.flatMap((c) => c.fills))}${cs.map((c) => c.lines).join('')}</g>`; };
// 立式小黑板
const chalkboard = (x, G, l1, l2) => `${crayon([['choco', `M${x - 9} ${G - 4} L${x - 7} ${G - 28} H${x + 7} L${x + 9} ${G - 4} Z`]])}<path d="M${x - 11} ${G} L${x - 7} ${G - 28} H${x + 7} L${x + 11} ${G} M${x - 9} ${G - 4} H${x + 9}" stroke-width="1"/>
  <text x="${x}" y="${G - 18}" font-size="4.6" text-anchor="middle" stroke="none" fill="#fffcf5" font-family="Courier Prime, monospace">${l1}</text><text x="${x}" y="${G - 11}" font-size="4.2" text-anchor="middle" stroke="none" fill="#fffcf5" font-family="Courier Prime, monospace">${l2}</text>`;
// 一串小灯：从 (x0,y0) 垂到 (x1,y1)
const stringLights = (x0, y0, x1, y1, sag = 8, n = 9) => {
  const pts = Array.from({ length: n }, (_, i) => { const t = (i + .5) / n; return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag]; });
  return `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag * 2} ${x1} ${y1}" stroke-width=".7"/>${pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${(y + 1.5).toFixed(1)}" r="1.6" class="bulb"/>`).join('')}`;
};
// 门口的小圆桌和两把椅子 + 桌上的咖啡杯
const cafeSet = (x, G) => `${bistro(x, G)}${crayon([['paper', `M${x - 4} ${G - 20} h4 v-3 h-4 Z M${x + 2} ${G - 20} h4 v-3 h-4 Z`]])}<path d="M${x - 4} ${G - 20} h4 v-3 h-4 Z M${x + 2} ${G - 20} h4 v-3 h-4 Z" stroke-width=".6"/>`;
// 石材横缝
const stoneCourses = (x0, x1, y0, y1, step = 9) => { let d = ''; for (let y = y0 + step; y < y1; y += step) d += `M${x0} ${y} H${x1} `; return `<path d="${d}" stroke-width=".45" opacity=".35"/>`; };
const goldText = (x, y, t, size = 6) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" stroke="none" class="gold-text" font-family="Courier Prime, monospace">${t}</text>`;

// Lv9 百年老铺：三层的欧洲老面包店——墨绿色木门面、奶油色窗框、绿白条纹布篷、铸铁挂牌，二三楼挂着百叶窗
function oldBakery() {
  const W = 372, G = 258;
  const ups = [64, 140, 216].flatMap((x) => [pane(x, 52, 40, 34, 2, 2), pane(x, 100, 40, 34, 2, 2)]);
  const shutters = [64, 140, 216].map((x) => `M${x - 10} 52 h8 v34 h-8 Z M${x + 42} 52 h8 v34 h-8 Z M${x - 10} 100 h8 v34 h-8 Z M${x + 42} 100 h8 v34 h-8 Z`).join(' ');
  const win1 = pane(54, 190, 76, 52, 4, 2), win2 = pane(200, 190, 76, 52, 4, 2), door = pane(148, 186, 34, 46, 1, 2);
  let awn = 'M50 176'; for (let i = 0; i < 6; i++) awn += ' q7 6 14 0';
  let awn2 = 'M196 176'; for (let i = 0; i < 6; i++) awn2 += ' q7 6 14 0';
  const stripes = [0, 2, 4].map((i) => `M${50 + i * 14} 168 h14 v8 h-14 Z M${196 + i * 14} 168 h14 v8 h-14 Z`).join(' ');
  const ex = collect();
  return wrap(`
    ${crayon([
      ['soft', `M40 40 H290 V${G} H40 Z`], ['tile', 'M70 30 V14 H86 V30 Z M244 30 V10 H260 V30 Z'],
      ['tile', 'M34 30 H296 V40 H34 Z M38 140 H292 V146 H38 Z'],
      ['leaf', shutters],
      ['skysoft', ups.map((u) => u.fill).join(' ')],
      ['leaf', `M44 146 H286 V${G} H44 Z`],
      ['paper', 'M84 150 H246 V166 H84 Z'],
      ['crust', stripes], ['paper', stripes.replace(/M(\d+) 168/g, (m, x) => `M${+x + 14} 168`)],
      ['skysoft', `${win1.fill} ${win2.fill} ${door.fill}`],
      ['custard', 'M150 178 a15 8 0 0 1 30 0 Z'],
      ...ex.fills,
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="M70 30 V14 H86 V30 M244 30 V10 H260 V30" stroke-width="1.2"/><path d="M68 14 H88 M242 10 H262" stroke-width="1.6"/><path d="M74 14 v-4 h3 v4 M80 14 v-5 h3 v5 M248 10 v-4 h3 v4 M254 10 v-5 h3 v5" stroke-width=".8"/>${smoke(252, 6)}
    ${stoneCourses(40, 290, 40, 140, 8)}
    ${(() => {
      // 弧形卷涡山墙：两边 S 形卷涡往上收，顶上一段圆弧，正中圆形浮雕里是金色大碱水面包，底下一条「1925」小饰带
      const gable = 'M124 26 C124 18 134 18 136 12 C138 4 146 2 152 2 Q165 -6 178 2 C184 2 192 4 194 12 C196 18 206 18 206 26 Z';
      const medal = 'M152 13 a13 11 0 1 0 26 0 a13 11 0 1 0 -26 0 Z';
      return `${crayon([['soft', gable], ['paper', medal], ['custard', 'M150 22 H180 V27 H150 Z']])}
        <path d="${gable}" stroke-width="1.3"/><path d="M130 24 C130 20 138 20 140 14 M200 24 C200 20 192 20 190 14" stroke-width=".7"/>
        <path d="M124 26 q-4 -6 2 -9 q4 2 1 5 M206 26 q4 -6 -2 -9 q-4 2 -1 5" stroke-width=".9"/>
        <path d="${medal}" stroke-width="1"/>${pretzelAt(157, 4, 0.25)}
        <path d="M150 22 H180 V27 H150 Z" stroke-width=".7"/>${goldText(165, 26.2, '· 1925 ·', 4).replace('class="gold-text"', 'fill="currentColor"')}
        ${crayon([['custard', 'M162 -6 h6 v-3 q-3 -6 -6 0 Z M120 26 h6 v-4 q-3 -6 -6 0 Z M204 26 h6 v-4 q-3 -6 -6 0 Z']])}<path d="M162 -6 h6 v-3 q-3 -6 -6 0 Z M120 26 h6 v-4 q-3 -6 -6 0 Z M204 26 h6 v-4 q-3 -6 -6 0 Z" stroke-width=".8"/>`;
    })()}
    ${(() => {
      // 石头栏杆：胖胖的瓶形小柱子 + 一条压顶，遇到烟囱和中间山墙就断开，两头是方墩
      const segs = [[42, 70], [86, 120], [210, 244], [260, 288]];
      const vase = (c) => `M${c - 1.6} 26 h3.2 q-1.2 -1.2 -.2 -2.4 q1.8 -1.3 .2 -2.8 h-2.8 q-1.6 1.5 .2 2.8 q1 1.2 -.6 2.4 Z`;
      let bal = '', rail = '';
      for (const [a, b] of segs) {
        rail += `M${a} 17.6 H${b} V20.8 H${a} Z `;
        const n = Math.max(1, Math.round((b - a - 2) / 6));
        for (let i = 0; i < n; i++) bal += vase(a + (b - a) * (i + 0.5) / n) + ' ';
      }
      const posts = 'M34 26 V16 H42 V26 Z M288 26 V16 H296 V26 Z';
      const caps = 'M33 16 H43 V14 H33 Z M287 16 H297 V14 H287 Z';
      return `${crayon([['soft', `${rail} ${bal} ${posts} ${caps}`]])}
        <path d="${bal}" stroke-width=".6"/><path d="${rail}" stroke-width=".8"/><path d="${posts} ${caps}" stroke-width=".9"/>
        <path d="M36 14 q2 -5 4 0 M290 14 q2 -5 4 0" stroke-width=".8"/>`;
    })()}
    <path d="${Array.from({ length: 30 }, (_, i) => `M${36 + i * 8.5} 40 v3`).join(' ')}" stroke-width=".7"/>
    <path d="M34 30 H296 V40 H34 Z"/><path d="M40 26 H290" stroke-width="1"/>${[60, 100, 140, 180, 220, 260].map((x) => `<path d="M${x} 40 v4" stroke-width="1"/>`).join('')}
    <path d="M40 40 V146 M290 40 V146"/>
    ${ups.map((u) => u.lines).join('')}<path d="${shutters}" stroke-width="1"/><path d="${[64, 140, 216].map((x) => `M${x - 6} 56 v26 M${x + 46} 56 v26 M${x - 6} 104 v26 M${x + 46} 104 v26`).join(' ')}" stroke-width=".6" opacity=".6"/>
    <path d="M60 92 H108 M136 92 H184 M212 92 H260" stroke-width="1.6"/>
    ${windowScene(64, 52, 40, 34, 'cup', 'sky')}${plantLampWin(140, 52, 40, 34)}${windowScene(216, 52, 40, 34, 'book', 'leaf')}
    ${windowScene(64, 100, 40, 34, 'chat', 'crust')}${windowScene(140, 100, 40, 34, 'cup', 'shu')}${plantLampWin(216, 100, 40, 34)}
    ${[64, 140, 216].map((x) => curtains(x, 52, 40, 34) + curtains(x, 100, 40, 34)).join('')}
    ${[64, 140, 216].map((x, i) => flowerBox(x - 2, 88, 44, ['pink', 'custard', 'shu'][i])).join('')}
    ${goldText(165, 145, '· SINCE 1925 ·', 5)}
    <path d="M38 140 H292 V146 H38 Z"/>
    <path d="M44 146 V${G} M286 146 V${G}"/><path d="M84 150 H246 V166 H84 Z"/><path d="M80 146 V170 H250 V146" stroke-width="1"/>
    <path d="M50 168 H134 V176 M196 168 H280 V176" stroke-width="1"/><path d="${awn}"/><path d="${awn2}"/>
    ${win1.lines}${win2.lines}${goldText(92, 198, 'BOULANGERIE', 6)}${goldText(238, 198, 'PÂTISSERIE', 6)}
    ${display([['baguette', 66], ['croissant', 84], ['boule', 102], ['braid', 120]], 214)}
    ${display([['roll', 62], ['croissant', 76], ['boule', 92], ['roll', 106], ['baguette', 120]], 240)}
    <g transform="translate(-4 0)">${display([['cake', 214], ['tart', 236], ['macarons', 254], ['cupcake', 272]], 214)}</g>
    ${display([['eclair', 212], ['macarons', 228], ['tart', 246], ['cupcake', 264]], 240)}
    <path d="M144 ${G} V178 a21 12 0 0 1 42 0 V${G}"/><path d="M150 178 a15 8 0 0 1 30 0" stroke-width="1"/>${door.lines}<path d="M148 236 H182 V${G - 4} H148 Z" stroke-width="1"/><path d="M176 222 v6" stroke-width="2"/>${crayon([['paper', 'M156 200 h18 v8 h-18 Z']])}<path d="M160 196 L165 192 L170 196 M156 200 h18 v8 h-18 Z" stroke-width=".7"/><text x="165" y="206" font-size="4.6" text-anchor="middle" stroke="none" fill="currentColor" font-family="Courier Prime, monospace">OPEN</text><path d="M156 246 h18" stroke="#c9913a" stroke-width="1.6"/>
    <path d="M138 176 V${G} M192 176 V${G}" stroke-width="1"/>
    ${lamp(138, 182)}${lamp(192, 182)}
    <path d="M290 150 H314 M296 150 l-6 6" stroke-width="1.6"/><path d="M302 150 v4 M310 150 v4" stroke-width="1"/>${pretzelAt(296, 154, 0.32)}
    ${ex.lines}
    ${chalkboard(26, G, 'PAIN', 'FRAIS')}
    ${queue([[318, 'sky'], [336, 'crust'], [354, 'leaf']], G)}
    ${crayon([['wood', `M290 ${G} L292 ${G - 12} H306 L308 ${G} Z`]])}<path d="M290 ${G} L292 ${G - 12} H306 L308 ${G} Z" stroke-width="1"/>${blob(bush([[299, G - 18, 8], [293, G - 14, 5], [305, G - 14, 5]]), 'leaf', 1.4)}
    ${mascotAt(4, G - 33).replace('translate(4', 'translate(-30')}
  `, `-34 -18 ${W + 34} ${G + 30}`, 'store', 1.5);
}

// 一簇叶子 / 花：几个圆鼓鼓的叶团，points = [[x, y, r], ...]
const bush = (pts) => pts.map(([x, y, r]) => `M${x - r} ${y} a${r} ${r * 0.85} 0 1 0 ${r * 2} 0 a${r} ${r * 0.85} 0 1 0 ${-r * 2} 0 Z`).join(' ');
// 一团叶子：先描粗边，再用底色盖住里面的交叠线，最后上蜡笔色——只剩外轮廓，像一整团
const blob = (d, color, sw = 2.4) => `<path d="${d}" stroke-width="${sw}"/><path d="${d}" class="f-paper" stroke="none"/>${crayon([[color, d]], 1, 1.2)}`;
const dots = (pts, r = 1.8) => pts.map(([x, y]) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`).join(' ');
const bistro = (x, g) => `<path d="M${x - 9} ${g - 20} h18" stroke-width="1.4"/><path d="M${x} ${g - 20} V${g} M${x - 5} ${g} h10" stroke-width="1"/>
  <path d="M${x - 16} ${g} l2 -12 h5 M${x - 14} ${g - 12} v-8 M${x + 16} ${g} l-2 -12 h-5 M${x + 14} ${g - 12} v-8" stroke-width="1"/>`;

// 吊花篮：一根小链子 + 一团叶子 + 几朵花
const basket = (x, y) => {
  const leaf = bush([[x - 6, y + 10, 6], [x + 6, y + 10, 6], [x, y + 6, 6], [x, y + 15, 5]]);
  return `<path d="M${x} ${y - 8} V${y}" stroke-width=".8"/><path d="M${x - 8} ${y + 4} Q${x} ${y + 12} ${x + 8} ${y + 4}" stroke-width="1"/>${blob(leaf, 'leaf', 1.6)}${crayon([['pink', dots([[x - 7, y + 8], [x + 5, y + 6], [x, y + 14], [x + 8, y + 13]], 2)]], 0, 0)}`;
};
// 一层蛋糕架：底盘 + 两块小蛋糕
const cakeStand = (x, y) => `M${x - 12} ${y} h24 M${x} ${y} v-14 M${x - 8} ${y - 14} h16`;
const cakes = (x, y) => `M${x - 10} ${y} h8 v-6 h-8 Z M${x + 2} ${y} h8 v-6 h-8 Z M${x - 5} ${y - 14} h10 v-6 h-10 Z`;

// Lv10 伦敦茶室：乔治风格的红砖三层楼，白色推拉窗；一楼黑色木门面，金色招牌，两扇弧形凸窗里摆着蛋糕架和茶壶，招牌两头挂着花篮
function londonTearoom() {
  const W = 320, G = 268;
  const sash = (x, y) => pane(x, y, 30, 40, 3, 4);
  const ups = [52, 145, 238].flatMap((x) => [sash(x, 46), sash(x, 100)]);
  const bay = (x) => pane(x, 190, 74, 48, 4, 3);
  const b1 = bay(48), b2 = bay(198);
  const door = pane(141, 196, 38, 72, 1, 3);
  const cs = [[66, 232], [100, 232], [216, 232], [250, 232]];
  return wrap(`
    ${crayon([
      ['wood', `M40 34 H280 V150 H40 Z`],
      ['paper', 'M34 26 H286 V34 H34 Z M36 150 H284 V156 H36 Z'],
      ['paper', ups.map((u) => u.fill).join(' ')],
      ['skysoft', ups.map((u) => u.fill).join(' ')],
      ['choco', `M40 156 H280 V${G} H40 Z`],
      ['custard', 'M58 160 H262 V180 H58 Z'],
      ['skysoft', `${b1.fill} ${b2.fill} ${door.fill}`],
      ['pink', cs.map(([x, y]) => cakes(x, y)).join(' ')],
      ['paper', 'M136 192 a24 10 0 0 1 48 0 Z'],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="M34 26 H286 V34 H34 Z"/><path d="M40 22 H280" stroke-width="1.2"/><path d="M40 34 V150 M280 34 V150"/>
    ${bricks(40, 280, 34, 150, 8)}
    ${ups.map((u) => u.lines).join('')}<path d="${[52, 145, 238].map((x) => `M${x - 3} 88 h36 M${x - 3} 142 h36 M${x - 2} 44 h34 M${x - 2} 98 h34`).join(' ')}" stroke-width="1.6"/>
    <path d="M36 150 H284 V156 H36 Z"/>
    <path d="M40 156 V${G} M280 156 V${G}"/><path d="M58 160 H262 V180 H58 Z"/><path d="M54 156 V184 H266 V156" stroke-width="1"/>
    <path d="M44 186 H126 M194 186 H276" stroke-width="1.4"/>
    ${b1.lines}${b2.lines}<path d="M44 238 Q86 250 126 238 V${G - 4} H44 Z M194 238 Q236 250 276 238 V${G - 4} H194 Z" stroke-width="1"/>
    <path d="${cs.map(([x, y]) => cakeStand(x, y)).join(' ')}" stroke-width="1"/><path d="${cs.map(([x, y]) => cakes(x, y)).join(' ')}" stroke-width=".8"/>
    <path d="M136 ${G} V192 a24 10 0 0 1 48 0 V${G}"/><path d="M136 192 a24 10 0 0 1 48 0 M160 182 v10 M146 185 l4 8 M174 185 l-4 8" stroke-width=".8"/>
    ${door.lines}<path d="M172 232 v6" stroke-width="1.8"/><path d="M130 ${G} V188 M190 ${G} V188" stroke-width="1"/>
    ${basket(50, 160)}${basket(270, 160)}
    ${lamp(132, 192)}${lamp(188, 192)}
    <path d="M292 ${G} L298 238 H314 L320 ${G} M296 248 H316" stroke-width="1.1"/><path d="M298 238 H314 V246 H298 Z" stroke-width=".8"/>
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// Lv11 台南老街红砖店：两层红砖街屋——一楼是三个拱的骑楼（亭仔脚），拱下挂着红灯笼；二楼长窗配木百叶，屋顶一道巴洛克式的山头，中间一块大招牌
function tainanShophouse() {
  const W = 330, G = 268;
  const parapet = 'M40 74 H96 Q100 58 116 56 Q130 40 165 38 Q200 40 214 56 Q230 58 234 74 H290 V86 H40 Z';
  const longWin = (x) => pane(x, 104, 30, 50, 2, 3, true);
  const wins = [62, 150, 238].map(longWin);
  const shutters = [62, 150, 238].map((x) => `M${x - 10} 104 h9 v50 h-9 Z M${x + 31} 104 h9 v50 h-9 Z`).join(' ');
  const arches = [[48, 112], [128, 202], [218, 282]].map(([x0, x1]) => `M${x0} ${G} V212 Q${x0} 182 ${(x0 + x1) / 2} 182 Q${x1} 182 ${x1} 212 V${G}`).join(' ');
  const inner = [[48, 112], [128, 202], [218, 282]].map(([x0, x1]) => `M${x0} ${G} V212 Q${x0} 182 ${(x0 + x1) / 2} 182 Q${x1} 182 ${x1} 212 V${G} Z`).join(' ');
  const lanterns = [80, 165, 250].map((x) => `M${x - 7} 196 Q${x - 10} 205 ${x - 7} 214 H${x + 7} Q${x + 10} 205 ${x + 7} 196 Z`).join(' ');
  return wrap(`
    ${crayon([
      ['shu', `${parapet} M40 86 H290 V${G} H40 Z`],
      ['paper', 'M100 60 H230 V80 H100 Z'],
      ['leaf', shutters],
      ['skysoft', wins.map((w) => w.fill).join(' ')],
      ['soft', inner],
      ['wood', `M140 ${G} V214 H190 V${G} Z M60 236 H100 V244 H60 Z M230 236 H270 V244 H230 Z`],
      ['crust', `${loafRow(62, 236, 3, 13)} ${loafRow(232, 236, 3, 13)}`],
      ['custard', lanterns],
      ['paper', 'M36 166 H294 V174 H36 Z'],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="${parapet}"/><path d="M100 60 H230 V80 H100 Z"/><path d="M160 38 v-6 M165 30 a4 4 0 1 0 .1 0" stroke-width="1"/>
    <path d="M56 66 q6 -8 12 0 q6 -8 12 0 M250 66 q6 -8 12 0 q6 -8 12 0" stroke-width=".8"/>
    <path d="M40 86 V${G} M290 86 V${G}"/>${bricks(40, 290, 86, 166, 8)}
    ${wins.map((w) => w.lines).join('')}<path d="${shutters}" stroke-width="1"/><path d="M52 158 H102 M140 158 H190 M228 158 H278" stroke-width="1.6"/>
    <path d="M36 166 H294 V174 H36 Z"/>
    <path d="${arches}" stroke-width="1.6"/><path d="M40 174 V${G} M290 174 V${G} M112 174 V${G} M128 174 V${G} M202 174 V${G} M218 174 V${G}" stroke-width="1"/>
    ${bricks(40, 48, 174, G, 8)}${bricks(112, 128, 174, G, 8)}${bricks(202, 218, 174, G, 8)}${bricks(282, 290, 174, G, 8)}
    <path d="M140 ${G} V214 H190 V${G} M165 214 V${G}" stroke-width="1"/><path d="M160 240 v6 M170 240 v6" stroke-width="1.6"/>
    <path d="M60 236 H100 V244 H60 Z M230 236 H270 V244 H230 Z M64 244 V${G} M96 244 V${G} M234 244 V${G} M266 244 V${G}" stroke-width="1"/>
    <path d="${loafRow(62, 236, 3, 13)} ${loafRow(232, 236, 3, 13)}" stroke-width="1"/>
    <path d="${lanterns}" stroke-width="1"/><path d="${[80, 165, 250].map((x) => `M${x} 186 v10 M${x} 214 v5`).join(' ')}" stroke-width=".8"/>
    <path d="M298 ${G} v-26 h22 v26 M296 242 h26" stroke-width="1"/><path d="M302 238 q7 -8 14 0" stroke-width=".9"/>
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// Lv12 上海石库门老铺：青砖墙夹着红砖腰线的两层石库门——正中石头门框、黑漆双门配铜门环，门楣上一块山花；两边是带条纹雨篷的橱窗，二楼木百叶窗和铸铁小阳台
function shanghaiShikumen() {
  const W = 320, G = 278;
  const ups = [58, 144, 230].map((x) => pane(x, 74, 32, 44, 2, 3));
  const shut = [58, 144, 230].map((x) => `M${x - 10} 74 h9 v44 h-9 Z M${x + 33} 74 h9 v44 h-9 Z`).join(' ');
  const rail = (x) => `<path d="M${x - 12} 122 H${x + 44} M${x - 12} 132 H${x + 44}" stroke-width="1"/><path d="${Array.from({ length: 10 }, (_, i) => `M${x - 9 + i * 6} 122 v10`).join(' ')}" stroke-width=".7"/>`;
  const shop = (x) => pane(x, 204, 66, 52, 3, 2);
  const s1 = shop(44), s2 = shop(210);
  let aw1 = 'M40 196'; for (let i = 0; i < 6; i++) aw1 += ' q6 6 12 0';
  let aw2 = 'M206 196'; for (let i = 0; i < 6; i++) aw2 += ' q6 6 12 0';
  const st = [0, 2, 4].map((i) => `M${40 + i * 12} 186 h12 v10 h-12 Z M${206 + i * 12} 186 h12 v10 h-12 Z`).join(' ');
  return wrap(`
    ${crayon([
      ['tile', `M36 48 L48 36 H272 L284 48 Z M40 48 H280 V${G} H40 Z`],
      ['shu', 'M40 140 H280 V148 H40 Z M40 60 H280 V66 H40 Z'],
      ['wood', shut],
      ['skysoft', ups.map((u) => u.fill).join(' ')],
      ['paper', `M120 ${G} V190 H200 V${G} Z M114 190 L160 170 L206 190 Z`],
      ['choco', `M130 ${G} V206 H190 V${G} Z`],
      ['paper', 'M84 150 H236 V166 H84 Z'],
      ['ai', st], ['paper', st.replace(/M(\d+) 186/g, (m, x) => `M${+x + 12} 186`)],
      ['skysoft', `${s1.fill} ${s2.fill}`],
      ['crust', `${loafRow(48, 230, 4)} ${loafRow(48, 254, 4)} ${loafRow(214, 230, 4)} ${loafRow(214, 254, 4)}`],
      ['custard', 'M146 236 a5 5 0 1 0 .1 0 Z M174 236 a5 5 0 1 0 .1 0 Z'], ['ai', 'M288 124 H310 V176 H288 Z'],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="M36 48 L48 36 H272 L284 48 Z"/><path d="M60 36 V48 M90 36 V48 M120 36 V48 M150 36 V48 M180 36 V48 M210 36 V48 M240 36 V48" stroke-width=".6" opacity=".5"/>
    <path d="M40 48 V${G} M280 48 V${G}"/>${bricks(40, 280, 66, 140, 7)}
    <path d="M40 60 H280 V66 H40 Z M40 140 H280 V148 H40 Z" stroke-width="1"/>
    ${ups.map((u) => u.lines).join('')}<path d="${shut}" stroke-width="1"/>${[58, 144, 230].map(rail).join('')}
    <path d="M84 150 H236 V166 H84 Z"/>
    <path d="M114 190 L160 170 L206 190 Z" stroke-width="1.2"/><path d="M150 186 q10 -9 20 0" stroke-width=".9"/>
    <path d="M120 ${G} V190 H200 V${G}"/><path d="M126 ${G} V196 H194 V${G}" stroke-width="1"/>
    <path d="M130 ${G} V206 H190 V${G} M160 206 V${G}"/><path d="M146 236 a5 5 0 1 0 .1 0 M174 236 a5 5 0 1 0 .1 0" stroke-width="1"/>
    <path d="M40 186 H106 V196 M206 186 H272 V196" stroke-width="1"/><path d="${aw1}"/><path d="${aw2}"/>
    ${s1.lines}${s2.lines}<path d="${loafRow(48, 230, 4)} ${loafRow(48, 254, 4)} ${loafRow(214, 230, 4)} ${loafRow(214, 254, 4)}" stroke-width="1"/>
    <path d="M40 262 H112 V${G} M208 262 H280" stroke-width="1"/>${bricks(40, 112, 262, G, 8)}${bricks(208, 280, 262, G, 8)}
    ${lamp(116, 186)}${lamp(204, 186)}
    <path d="M292 120 V176 M286 120 H298" stroke-width="1.2"/><path d="M288 124 H310 V176 H288 Z" stroke-width="1"/><text x="299" y="143" font-size="10" text-anchor="middle" stroke="none" class="sk-text ink-fill">面</text><text x="299" y="160" font-size="10" text-anchor="middle" stroke="none" class="sk-text ink-fill">包</text>
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// Lv13 京都町家老店：两层的町家——一楼深色木格子、长长的藏青暖帘和一对灯笼，一楼檐上一溜瓦，二楼白墙虫笼窗，正中挂一块大木招牌；旁边竹篱笆、石灯笼和一棵红枫
function kyotoMachiya() {
  // 两层京町家：屋顶一排排瓦、两端鬼瓦；二楼白灰墙露木柱、两扇虫笼窗、正中挂木招牌；一楼浅色木格子、深色柱子、三幅藏青暖帘、
  // 墙根一排弯弯的竹犬矢来，两盏红灯笼；左边门口一条铺红毡的长凳和大红伞，右边石灯笼、盆栽和一棵红枫
  const W = 360, G = 268;
  const tiles = (x0, x1, y0, rows) => { let d = ''; for (let r = 0; r < rows; r++) { const y = y0 + r * 5; d += `M${x0} ${y}`; for (let x = x0; x < x1; x += 7) d += ` q3.5 -3 7 0`; d += ' '; } return d; };
  const roof1 = 'M30 70 L40 50 H320 L330 70 Z', roof2 = 'M22 162 L34 146 H326 L338 162 Z';
  const upper = 'M42 70 H318 V146 H42 Z', lower = `M42 162 H318 V${G} H42 Z`;
  const posts2 = [42, 100, 260, 318].map((x) => `M${x - 2} 70 H${x + 2} V146 H${x - 2} Z`).join(' ');
  const posts1 = [42, 142, 218, 318].map((x) => `M${x - 3} 162 H${x + 3} V${G} H${x - 3} Z`).join(' ');
  const mushi = (x) => `M${x} 92 H${x + 40} V124 H${x} Z`;
  const slats = (x) => Array.from({ length: 9 }, (_, i) => `M${x + 4 + i * 4} 92 V124`).join(' ');
  const koshi = (x0, x1) => { let d = ''; for (let x = x0 + 3; x < x1; x += 3) d += `M${x} 172 V${G - 20} `; return d + `M${x0} 172 H${x1} M${x0} 196 H${x1} M${x0} 220 H${x1} M${x0} ${G - 20} H${x1}`; };
  const yarai = (x0, x1) => { let d = ''; for (let x = x0; x < x1; x += 4) d += `M${x} ${G} Q${x - 1} ${G - 16} ${x + 6} ${G - 22} `; return d + `M${x0} ${G - 22} H${x1 + 6}`; };
  const norenPanels = [148, 172, 196].map((x) => `M${x} 168 H${x + 22} V206 H${x} Z`).join(' ');
  const chochin = (x, y) => `<path d="M${x} ${y - 6} v6"/><path d="M${x - 7} ${y} h14 M${x - 7} ${y + 22} h14" stroke-width="1.2"/><path d="M${x - 9} ${y + 8} h18 M${x - 9} ${y + 15} h18" stroke-width=".5" opacity=".6"/><path d="M${x - 7} ${y} Q${x - 11} ${y + 11} ${x - 7} ${y + 22} M${x + 7} ${y} Q${x + 11} ${y + 11} ${x + 7} ${y + 22}"/>`;
  const chochinFill = (x, y) => `M${x - 7} ${y} Q${x - 11} ${y + 11} ${x - 7} ${y + 22} H${x + 7} Q${x + 11} ${y + 11} ${x + 7} ${y} Z`;
  const maple = bush([[340, 104, 18], [328, 126, 15], [352, 130, 14], [338, 84, 12]]);
  const kasa = 'M-14 196 Q14 168 42 196 Z';
  return wrap(`
    <path d="${upper} ${lower} ${roof1} ${roof2}" class="f-paper" stroke="none"/>
    ${crayon([['tile', `${roof1} ${roof2}`], ['paper', upper], ['choco', `${posts2} ${posts1}`], ['wood', `${mushi(54)} ${mushi(266)}`], ['wood', `M42 162 H318 V${G} H42 Z`], ['ai', norenPanels], ['shu', `${chochinFill(122, 170)} ${chochinFill(238, 170)}`], ['skysoft', `M146 206 H214 V${G} H146 Z`]])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="${roof1}"/><path d="${tiles(42, 318, 56, 3)}" stroke-width=".6" opacity=".7"/><path d="M36 50 H324" stroke-width="2.4"/><path d="M28 70 H332" stroke-width="1.4"/>
    <path d="M36 50 q-6 -10 2 -16 q2 6 7 8 Z M324 50 q6 -10 -2 -16 q-2 6 -7 8 Z" stroke-width="1"/>
    <path d="${upper}"/><path d="${posts2}" stroke-width=".9"/><path d="M42 140 H318" stroke-width="1.1"/>
    <path d="${mushi(54)}" stroke-width="1"/><path d="${slats(54)}" stroke-width=".7"/><path d="${mushi(266)}" stroke-width="1"/><path d="${slats(266)}" stroke-width=".7"/>
    ${crayon([['wood', 'M112 96 H248 V124 H112 Z']])}<path d="M112 96 H248 V124 H112 Z"/><path d="M118 90 V96 M242 90 V96 M116 90 H244" stroke-width=".9"/>
    <path d="${roof2}"/><path d="${tiles(36, 324, 151, 2)}" stroke-width=".6" opacity=".7"/><path d="M20 162 H340" stroke-width="1.4"/>
    <path d="${lower}"/><path d="${posts1}" stroke-width=".9"/>
    <path d="${koshi(48, 136)} ${koshi(224, 312)}" stroke-width=".55"/><path d="M48 172 H136 V${G - 20} H48 Z M224 172 H312 V${G - 20} H224 Z" stroke-width="1"/>
    ${crayon([['wood', 'M150 226 H210 V229 H150 Z M150 248 H210 V251 H150 Z']])}<path d="M150 226 H210 M150 248 H210" stroke-width=".8"/>
    ${display([['boule', 158], ['croissant', 174], ['roll', 188], ['braid', 202]], 226)}${display([['roll', 156], ['baguette', 172], ['boule', 190], ['roll', 204]], 248)}
    <path d="M146 206 H214 V${G} M180 206 V${G} M146 ${G - 4} H214" stroke-width="1.1"/><path d="M163 206 V${G} M197 206 V${G}" stroke-width=".7"/>
    <path d="M144 166 H216" stroke-width="2"/><path d="${norenPanels}" stroke-width=".9"/><path d="M181 186 a8 8 0 1 0 0.1 0" stroke="#fffcf5" stroke-width="1.6"/>
    <text x="159" y="200" font-size="7" text-anchor="middle" stroke="none" class="sk-text ink-fill">ぱ</text><text x="207" y="200" font-size="7" text-anchor="middle" stroke="none" class="sk-text ink-fill">ん</text>
    ${chochin(122, 170)}${chochin(238, 170)}
    <text x="122" y="185" font-size="7" text-anchor="middle" stroke="none" class="sk-text ink-fill">麺</text><text x="238" y="185" font-size="7" text-anchor="middle" stroke="none" class="sk-text ink-fill">麭</text>
    <path d="${yarai(46, 132)} ${yarai(222, 308)}" stroke-width=".8"/>
    ${crayon([['wood', 'M292 176 h12 v40 h-12 Z']])}<path d="M298 166 v10 M292 176 h12 v40 h-12 Z" stroke-width="1"/>${['焼', 'き', 'た', 'て'].map((t, i) => `<text x="298" y="${186 + i * 9}" font-size="6.5" text-anchor="middle" stroke="none" class="sk-text" fill="currentColor">${t}</text>`).join('')}
    <path d="M60 162 v10" stroke-width=".7"/><path d="M56 172 q4 -6 8 0 Z" stroke-width=".9"/>${crayon([['sky', 'M56 172 q4 -6 8 0 Z']])}<path d="M60 172 v8" stroke-width=".6"/>
    ${cat(232, 50, 'paper').lines}

    <path d="M14 ${G} V196" stroke-width="1.6"/>${crayon([['shu', kasa]])}<path d="${kasa}" stroke-width="1.1"/><path d="M14 172 v-4 M0 196 L14 176 M28 196 L14 176" stroke-width=".7"/>
    ${crayon([['shu', `M-8 ${G - 14} H36 V${G - 10} H-8 Z`]])}<path d="M-8 ${G - 14} H36 V${G - 10} H-8 Z M-4 ${G - 10} V${G} M32 ${G - 10} V${G}" stroke-width="1"/>
    ${crayon([['paper', `M4 ${G - 14} h6 v-3 h-6 Z`], ['custard', `M14 ${G - 14} q4 -6 8 0 Z`]])}<path d="M4 ${G - 14} h6 v-3 h-6 Z M14 ${G - 14} q4 -6 8 0" stroke-width=".7"/>
    <path d="M340 ${G} V110 M340 150 l-10 -10 M340 136 l8 -8" stroke-width="2.4"/>${blob(maple, 'shu')}
    ${crayon([['tile', `M322 ${G} V258 H338 V${G} Z M324 244 H336 V256 H324 Z M318 236 L330 228 L342 236 Z`]])}<path d="M322 ${G} V258 H338 V${G} M324 244 H336 V256 H324 Z M318 236 L330 228 L342 236 Z" stroke-width="1"/><path d="M326 248 h8 v4 h-8 Z" class="glow" stroke="none"/>
    ${crayon([['wood', `M350 ${G} L352 ${G - 10} H364 L366 ${G} Z`]])}<path d="M350 ${G} L352 ${G - 10} H364 L366 ${G} Z" stroke-width=".9"/>${blob(bush([[358, G - 16, 7]]), 'leaf', 1.2)}${crayon([['ai', dots([[354, G - 20], [362, G - 18]], 2)]], 0, 0)}

    ${(() => {
      // 生活痕迹：电线杆和电线、空调外机、煤气表、灯箱招牌、盆栽一堆、自行车、灭火桶、墙上雨渍
      const pole = `<path d="M372 ${G} V18" stroke-width="3"/><path d="M362 30 H382 M364 40 H380" stroke-width="1.6"/>${crayon([['tile', 'M376 52 h10 v16 h-10 Z']])}<path d="M376 52 h10 v16 h-10 Z M372 58 h4" stroke-width=".9"/>
        <path d="M-38 36 Q170 52 362 30 M-38 46 Q180 64 364 40 M372 70 Q300 120 318 150" stroke-width=".6"/><path d="M366 120 h12 v6 h-12 Z" stroke-width=".7"/>`;
      const ac = `${crayon([['paper', 'M282 140 h26 v16 h-26 Z']])}<path d="M282 140 h26 v16 h-26 Z M286 158 v3 M304 158 v3" stroke-width=".9"/><path d="M294 148 a5 5 0 1 0 .1 0 M291 148 h6 M294 145 v6" stroke-width=".5"/><path d="M308 150 q8 0 8 12" stroke-width=".7"/>`;
      const meter = `${crayon([['paper', 'M30 176 h9 v10 h-9 Z']])}<path d="M30 176 h9 v10 h-9 Z M34.5 181 a2 2 0 1 0 .1 0 M34 186 V${G - 24} M34 ${G - 24} h-6" stroke-width=".7"/>`;
      const lightbox = `${crayon([['paper', 'M322 176 h12 v40 h-12 Z']])}<path d="M318 180 h4 M318 210 h4 M322 176 h12 v40 h-12 Z" stroke-width="1"/><text x="328" y="192" font-size="7" text-anchor="middle" stroke="none" fill="#c4513a" class="sk-text">パ</text><text x="328" y="206" font-size="7" text-anchor="middle" stroke="none" fill="#c4513a" class="sk-text">ン</text>`;
      const pot = (x, w, h, c, r) => `${crayon([[c, `M${x - w / 2} ${G} L${x - w / 2 - 1} ${G - h} H${x + w / 2 + 1} L${x + w / 2} ${G} Z`]])}<path d="M${x - w / 2} ${G} L${x - w / 2 - 1} ${G - h} H${x + w / 2 + 1} L${x + w / 2} ${G} Z" stroke-width=".8"/>${blob(bush([[x, G - h - r * .7, r], [x - r * .7, G - h - r * .2, r * .6], [x + r * .7, G - h - r * .2, r * .6]]), 'leaf', 1.1)}`;
      const pots = pot(54, 10, 8, 'wood', 6) + pot(68, 14, 6, 'paper', 7) + pot(84, 8, 9, 'shu', 5) + pot(98, 18, 8, 'paper', 8) + pot(116, 9, 7, 'wood', 5) + crayon([['pink', dots([[64, G - 14], [72, G - 16], [94, G - 18]], 2)], ['custard', dots([[100, G - 20], [52, G - 16]], 1.8)]], 0, 0);
      const can = `${crayon([['sky', `M126 ${G} v-8 h8 v8 Z`]])}<path d="M126 ${G} v-8 h8 v8 Z M134 ${G - 6} l5 -4 M127 ${G - 8} q3 -4 6 0" stroke-width=".7"/>`;
      const buckets = `${crayon([['shu', `M136 ${G} l-1 -8 h8 l-1 8 Z M136 ${G - 9} l-1 -7 h8 l-1 7 Z`]])}<path d="M136 ${G} l-1 -8 h8 l-1 8 Z M136 ${G - 9} l-1 -7 h8 l-1 7 Z" stroke-width=".7"/>`;
      const b = bike(246, G);
      const stains = `<path d="M70 72 v10 M150 72 v14 M232 72 v8 M300 72 v12 M120 164 v6 M250 164 v8" stroke-width=".5" opacity=".25"/>`;
      return pole + ac + meter + lightbox + pots + can + buckets + crayon(b.fills) + b.lines + stains;
    })()}
    ${mascotAt(-34, G - 33)}
  `, `-38 0 ${W + 64} ${G + 12}`, 'store', 1.5);
}

// Lv14 维也纳咖啡馆：四层的老派大楼——奶油色立面、壁柱、窗上交替的三角和弧形窗楣、二楼通长石栏杆阳台、屋顶铜绿小穹顶；
// 一楼深色木头咖啡馆门面配金色大招牌，拱形大窗里亮着水晶吊灯，门口一排小圆桌
function viennaCafe() {
  const W = 360, G = 330;
  const cols = [56, 106, 156, 204, 254, 304];
  const winRow = (y, arch) => cols.map((x) => pane(x - 12, y, 24, 34, 2, 2, arch));
  const r1 = winRow(118, false), r2 = winRow(172, false), r3 = winRow(66, true);
  const pedi = cols.map((x, i) => i % 2 ? `M${x - 15} 116 Q${x} 104 ${x + 15} 116` : `M${x - 15} 116 L${x} 106 L${x + 15} 116`).join(' ');
  const pil = [32, 80, 130, 180, 230, 280, 328].map((x) => `M${x} 62 V222`).join(' ');
  const big = [[40, 112], [248, 320]].map(([x0, x1]) => pane(x0, 262, x1 - x0, 58, 4, 2, true));
  const door = pane(160, 258, 40, 72, 2, 3, true);
  const chand = (x) => `<path d="M${x} 266 v10 M${x - 14} 282 q14 10 28 0 M${x - 8} 280 q8 6 16 0" stroke-width="1"/><path d="M${x - 14} 282 v5 M${x - 5} 286 v5 M${x + 5} 286 v5 M${x + 14} 282 v5" stroke-width=".8"/>
    <path d="M${x - 16.5} 290 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M${x - 7.5} 294 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M${x + 2.5} 294 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M${x + 11.5} 290 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0" class="glow" stroke="none"/>
    <path d="M${x - 22} 320 h44 M${x - 18} 312 h12 M${x + 6} 312 h12" stroke-width="1"/>`;
  const dome = 'M160 40 C160 20 200 20 200 40 Z';
  return wrap(`
    ${crayon([
      ['leaf', dome],
      ['tile', 'M24 52 L36 40 H324 L336 52 Z'],
      ['soft', `M28 52 H332 V228 H28 Z`],
      ['skysoft', [...r1, ...r2, ...r3].map((w) => w.fill).join(' ')],
      ['paper', 'M28 156 H332 V172 H28 Z'],
      ['choco', `M28 228 H332 V${G} H28 Z`],
      ['custard', 'M96 234 H264 V254 H96 Z'],
      ['soft', big.map((w) => w.fill).join(' ')],
      ['skysoft', door.fill],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="${dome}"/><path d="M180 22 v-8" stroke-width="1.2"/><path d="M177 11 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" class="glow"/><path d="M170 26 Q168 32 168 40 M190 26 Q192 32 192 40" stroke-width=".8"/>
    <path d="M24 52 L36 40 H324 L336 52 Z"/><path d="M28 52 V228 M332 52 V228"/><path d="M24 56 H336 M24 62 H336" stroke-width="1"/>
    <path d="${pil}" stroke-width=".7" opacity=".55"/>
    ${r3.map((w) => w.lines).join('')}${r1.map((w) => w.lines).join('')}${r2.map((w) => w.lines).join('')}
    <path d="${pedi}" stroke-width="1.2"/><path d="${cols.map((x) => `M${x - 14} 208 h28`).join(' ')}" stroke-width="1.4"/>
    <path d="M28 156 H332 V172 H28 Z" stroke-width="1.2"/><path d="${Array.from({ length: 36 }, (_, i) => `M${33 + i * 8.2} 158 V170`).join(' ')}" stroke-width=".8"/>
    <path d="M24 222 H336 V228 H24 Z" stroke-width="1.2"/>
    <path d="M28 228 V${G} M332 228 V${G}"/><path d="M96 234 H264 V254 H96 Z"/><path d="M92 230 V258 H268 V230" stroke-width="1"/>
    ${big.map((w) => w.lines).join('')}${chand(76)}${chand(284)}
    ${door.lines}<path d="M176 300 v6 M184 300 v6" stroke-width="1.6"/><path d="M152 ${G} V256 M208 ${G} V256" stroke-width="1"/>
    ${lamp(144, 262)}${lamp(216, 262)}
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// ---------- 日式隐藏款草稿 ----------
// 昭和喫茶店：一楼红砖、整幅绿色波浪帆布篷，屋顶立着一圈灯泡的「喫茶」圆招牌；橱窗里是蕾丝窗帘、奶油苏打和布丁，门边一个红邮筒
function showaKissa() {
  const W = 320, G = 268;
  let awn = 'M36 176'; for (let i = 0; i < 12; i++) awn += ' q10.3 9 20.6 0';
  const stripes = Array.from({ length: 6 }, (_, i) => `M${36 + i * 41.2} 160 h20.6 v16 h-20.6 Z`).join(' ');
  const ups = [64, 140, 216].map((x) => pane(x, 96, 40, 34, 4, 2));
  const win = pane(52, 196, 88, 50, 4, 2);
  const door = pane(178, 192, 36, 76, 1, 3);
  const bulbs = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return [160 + Math.cos(a) * 31, 46 + Math.sin(a) * 31]; });
  const glass = (x) => `M${x - 5} 238 l-2 -16 h14 l-2 16 Z`;
  return wrap(`
    ${crayon([
      ['custard', 'M160 15 a31 31 0 1 0 .1 0 Z'],
      ['paper', 'M142 46 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z'],
      ['paper', `M40 84 H280 V160 H40 Z`],
      ['skysoft', ups.map((u) => u.fill).join(' ')],
      ['leaf', `M32 160 H288 V176 H32 Z`], ['paper', stripes],
      ['shu', `M40 176 H280 V${G} H40 Z`],
      ['paper', `${win.fill} ${door.fill}`],
      ['pink', `${glass(78)} M100 238 h16 v-8 q-8 -8 -16 0 Z`], ['leaf', glass(126)], ['custard', 'M101 230 q7 -10 14 0 Z'],
      ['wood', `M174 ${G} V188 H218 V${G} Z`],
      ['skysoft', door.fill],
      ['shu', `M286 112 H304 V164 H286 Z M292 ${G} V226 Q292 216 302 216 Q312 216 312 226 V${G} Z`],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="M160 15 a31 31 0 1 0 .1 0"/><path d="M142 46 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0" stroke-width="1"/>
    <text x="160" y="44" font-size="11" text-anchor="middle" stroke="none" class="sk-text" fill="currentColor">喫茶</text><text x="160" y="57" font-size="7" text-anchor="middle" stroke="none" class="sk-text" fill="currentColor">KISSA</text>
    <path d="${dots(bulbs, 2.2)}" class="glow" stroke-width=".7"/><path d="M152 77 V84 M168 77 V84" stroke-width="1.6"/>
    <path d="M36 84 H284" stroke-width="2"/><path d="M40 84 V160 M280 84 V160"/><path d="M40 92 H280" stroke-width=".6" opacity=".5"/>
    ${ups.map((u) => u.lines).join('')}<path d="${[64, 140, 216].map((x) => `M${x - 3} 132 h46`).join(' ')}" stroke-width="1.6"/>
    <path d="M280 106 H302 M290 106 v6 M300 106 v6" stroke-width="1.2"/><path d="M286 112 H304 V164 H286 Z" stroke-width="1"/><text x="295" y="132" font-size="10" text-anchor="middle" stroke="none" class="sk-text ink-fill">珈</text><text x="295" y="150" font-size="10" text-anchor="middle" stroke="none" class="sk-text ink-fill">琲</text>
    <path d="M32 160 H288 V176"/><path d="M32 160 V176"/><path d="${awn}"/>
    <path d="M40 176 V${G} M280 176 V${G}"/>${bricks(40, 46, 182, G, 8)}${bricks(146, 174, 182, G, 8)}${bricks(218, 280, 182, G, 8)}${bricks(46, 146, 252, G, 8)}
    <path d="M46 190 H146 V252 H46 Z" stroke-width="1"/>${win.lines}<path d="M52 196 q11 8 22 0 q11 8 22 0 q11 8 22 0 q11 8 22 0" stroke-width=".8"/>
    <path d="${glass(78)} ${glass(126)}" stroke-width="1"/><path d="M76 222 l4 -10 M124 222 l4 -10" stroke-width=".8"/><path d="M100 238 h16 v-8 q-8 -8 -16 0 Z M101 230 q7 -10 14 0" stroke-width="1"/>
    <path d="M174 ${G} V188 H218 V${G}"/>${door.lines}<path d="M196 214 a6 6 0 1 0 .1 0" stroke-width=".9"/><path d="M208 232 v6" stroke-width="1.6"/>
    <path d="M156 ${G} V236 H166 V${G}" stroke-width="1"/>${blob(bush([[161, 228, 9], [155, 236, 6], [167, 236, 6]]), 'leaf', 1.6)}
    <path d="M292 ${G} V226 Q292 216 302 216 Q312 216 312 226 V${G}"/><path d="M296 230 h12" stroke-width="1.6"/>
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// 温泉旅馆面包坊：歇山顶的大屋顶，屋后冒着几缕热气；木造门面挂一排红纸灯笼，正中长长的藏青暖帘印着 ♨，门边石灯笼和一丛竹子
function onsenBakery() {
  const W = 360, G = 278;
  const roof = 'M20 136 Q60 128 84 106 L120 70 H240 L276 106 Q300 128 340 136 Q300 140 180 140 Q60 140 20 136 Z';
  const ribs = Array.from({ length: 22 }, (_, i) => { const x = 40 + i * 13.5; return `M${x} 136 L${x + (x < 180 ? 10 : -10) * 0} ${x < 120 || x > 240 ? 112 : 74}`; }).join(' ');
  const gable = 'M150 70 L180 44 L210 70 Z';
  const steam = [70, 120, 240, 290].map((x, i) => `<path d="M${x} ${66 - (i % 2) * 8} q-8 -8 0 -16 q8 -8 0 -16 q-6 -6 2 -14" stroke-width="1.3" opacity=".5"/>`).join('');
  const lanterns = [72, 112, 248, 288].map((x) => `M${x - 8} 156 Q${x - 12} 168 ${x - 8} 180 H${x + 8} Q${x + 12} 168 ${x + 8} 156 Z`).join(' ');
  const koshi = (x0, x1) => { let d = ''; for (let x = x0 + 5; x < x1; x += 5) d += `M${x} 194 V${G - 6} `; return d; };
  const bamboo = [328, 338, 348].map((x, i) => `M${x} ${G} V${150 + i * 10}`).join(' ');
  const bambooLeaf = [[322, 160], [336, 150], [344, 172], [330, 186], [350, 196]].map(([x, y]) => `M${x} ${y} q8 -6 14 -2 q-6 6 -14 2 Z`).join(' ');
  return wrap(`
    ${crayon([
      ['tile', `${roof} ${gable}`],
      ['paper', 'M128 82 H232 V106 H128 Z'],
      ['wood', `M44 140 H316 V${G} H44 Z`],
      ['ai', 'M136 150 H224 V212 H136 Z'],
      ['shu', lanterns],
      ['soft', `M146 ${G} V216 H214 V${G} Z`],
      ['tile', `M16 ${G} V262 H34 V${G} Z M18 244 H32 V258 H18 Z M12 236 L25 226 L38 236 Z`],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    ${steam}
    <path d="${gable}"/><path d="M180 44 v-8" stroke-width="1.2"/>
    <path d="${roof}"/><path d="${ribs}" stroke-width=".5" opacity=".45"/><path d="M84 106 H276" stroke-width="1"/>
    <path d="M128 82 H232 V106 H128 Z"/>
    <path d="M44 140 V${G} M316 140 V${G}"/><path d="M44 146 H316" stroke-width="1"/>
    <path d="M52 194 H130 V${G - 6} H52 Z M230 194 H308 V${G - 6} H230 Z" stroke-width="1"/><path d="${koshi(52, 130)} ${koshi(230, 308)}" stroke-width=".6"/>
    <path d="M136 150 H224 V212 H136 Z"/><path d="M158 150 V212 M180 150 V212 M202 150 V212" stroke-width=".9"/><path d="M132 148 H228" stroke-width="1.8"/>
    <path d="M166 186 q14 12 28 0 M168 188 q-2 8 12 8 q14 0 12 -8 M172 178 q-4 -6 0 -10 q4 -4 0 -8 M180 176 q-4 -6 0 -10 q4 -4 0 -8 M188 178 q-4 -6 0 -10 q4 -4 0 -8" stroke="#fffcf5" stroke-width="1.8"/>
    <path d="M146 ${G} V216 H214 V${G} M180 216 V${G}" stroke-width="1"/>
    <path d="${lanterns}" stroke-width="1"/><path d="${[72, 112, 248, 288].map((x) => `M${x} 146 v10 M${x - 10} 164 h20 M${x - 10} 172 h20`).join(' ')}" stroke-width=".6"/>
    <path d="M16 ${G} V262 H34 V${G} M18 244 H32 V258 H18 Z M12 236 L25 226 L38 236 Z"/>
    <path d="${bamboo}" stroke-width="2.4"/><path d="M326 200 h5 M336 214 h5 M346 228 h5 M326 236 h5 M336 248 h5" stroke-width="1.6"/>${blob(bush([[330, 150, 12], [344, 140, 10], [348, 166, 11], [326, 172, 9]]), 'leaf')}
    ${mascotAt(40, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// 神社参道老铺：参道边一间老铺，屋顶上探出一树樱花；门前一座朱红鸟居，红毡长椅和一把大红伞，门口铺着红布摆面包
function sandoShop() {
  const W = 360, G = 278;
  const torii = 'M262 150 Q306 142 352 150 L350 158 Q306 152 264 158 Z M270 166 H344 V171 H270 Z';
  const toriiLegs = `M278 158 L275 ${G} H284 L286 158 Z M328 158 L331 ${G} H340 L336 158 Z`;
  const sakura = bush([[236, 92, 26], [268, 78, 24], [298, 94, 22], [256, 112, 20], [212, 112, 18], [288, 118, 16]]);
  const petals = dots([[222, 90], [246, 80], [270, 70], [290, 88], [258, 104], [232, 108], [280, 112], [300, 140], [316, 170], [262, 190], [306, 210], [200, 140]], 1.5);
  const koshi = (x0, x1) => { let d = ''; for (let x = x0 + 5; x < x1; x += 5) d += `M${x} 186 V${G - 6} `; return d; };
  return wrap(`
    ${crayon([
      ['tile', 'M16 150 L36 128 H236 L256 150 Z'],
      ['wood', `M30 150 H242 V${G} H30 Z`],
      ['paper', 'M60 156 H210 V176 H60 Z'],
      ['ai', 'M116 182 H156 V218 H116 Z'],
      ['shu', `${torii} ${toriiLegs}`],
      ['choco', 'M264 158 H350 V161 H264 Z'],
      ['shu', `M44 ${G - 30} H104 V${G - 24} H44 Z M172 236 Q204 214 236 236 Z`],
      ['crust', loafRow(50, G - 30, 4, 14)],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="M256 ${G} C254 220 262 170 254 120 M256 170 q14 -16 30 -40 M255 140 q-16 -10 -30 -24" stroke-width="3"/>${blob(sakura, 'pink')}${crayon([['paper', petals]], 0, 0)}
    <path d="M16 150 L36 128 H236 L256 150 Z"/><path d="${Array.from({ length: 24 }, (_, i) => `M${40 + i * 8} 130 v18`).join(' ')}" stroke-width=".5" opacity=".45"/>
    <path d="M30 150 V${G} M242 150 V${G}"/><path d="M60 156 H210 V176 H60 Z"/>
    <path d="M36 186 H110 V${G - 6} H36 Z M162 186 H236 V${G - 6} H162 Z" stroke-width="1"/><path d="${koshi(36, 110)} ${koshi(162, 236)}" stroke-width=".6"/>
    <path d="M116 182 H156 V218 H116 Z M136 182 V218" stroke-width="1"/><path d="M112 180 H160" stroke-width="1.6"/><path d="M118 ${G} V222 H154 V${G}" stroke-width="1"/>
    <path d="M44 ${G - 30} H104 V${G - 24} H44 Z M48 ${G - 24} V${G} M100 ${G - 24} V${G}" stroke-width="1"/><path d="${loafRow(50, G - 30, 4, 14)}" stroke-width="1"/>
    <path d="M204 ${G} V236 M172 236 Q204 214 236 236 Z" stroke-width="1.2"/><path d="M184 236 L204 222 M224 236 L204 222" stroke-width=".7"/>
    <path d="${torii}"/><path d="${toriiLegs}"/><path d="M307 158 V166 M301 158 H313" stroke-width="1"/>
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// 银座老牌西点店：街角的石造洋楼，屋顶一座带大钟的圆塔；一楼墨绿帆布篷下是玻璃橱窗，里面一层层摆着蛋糕和饼干罐，门口一盏煤气路灯
function ginzaParlor() {
  const W = 340, G = 330;
  const towerTop = 'M140 64 Q170 36 200 64 Z';
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `M${(170 + Math.sin(a) * 14).toFixed(1)} ${(86 - Math.cos(a) * 14).toFixed(1)} L${(170 + Math.sin(a) * 17).toFixed(1)} ${(86 - Math.cos(a) * 17).toFixed(1)}`; }).join(' ');
  const wins = [];
  for (const y of [132, 184]) for (const x of [52, 94, 136, 182, 224, 266]) wins.push(pane(x, y, 22, 34, 2, 2, true));
  const show = (x) => pane(x, 262, 76, 54, 1, 3);
  const s1 = show(44), s2 = show(220);
  let a1 = 'M40 252'; for (let i = 0; i < 7; i++) a1 += ' q6 6 12 0';
  let a2 = 'M216 252'; for (let i = 0; i < 7; i++) a2 += ' q6 6 12 0';
  const cakeRow = (x, y) => `M${x} ${y} h10 v-7 h-10 Z M${x + 22} ${y} h10 v-7 h-10 Z M${x + 44} ${y} h10 v-7 h-10 Z`;
  const tins = (x, y) => `M${x} ${y} h10 v-10 h-10 Z M${x + 24} ${y} h10 v-10 h-10 Z M${x + 48} ${y} h10 v-10 h-10 Z`;
  return wrap(`
    ${crayon([
      ['leaf', towerTop],
      ['paper', 'M142 64 H198 V112 H142 Z'],
      ['card', 'M170 69 a17 17 0 1 0 .1 0 Z'],
      ['tile', 'M30 120 L40 112 H300 L310 120 Z'],
      ['soft', `M36 120 H304 V${G} H36 Z`],
      ['skysoft', wins.map((w) => w.fill).join(' ')],
      ['paper', 'M90 226 H250 V244 H90 Z'],
      ['leaf', 'M40 244 H124 V252 H40 Z M216 244 H300 V252 H216 Z'],
      ['skysoft', `${s1.fill} ${s2.fill}`],
      ['pink', `${cakeRow(52, 280)} ${cakeRow(228, 280)}`], ['crust', `${tins(50, 314)} ${tins(226, 314)}`],
      ['choco', `M146 ${G} V262 Q146 248 170 248 Q194 248 194 262 V${G} Z`],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="${towerTop}"/><path d="M170 40 v-12" stroke-width="1.2"/><path d="M167 25 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" class="glow"/>
    <path d="M142 64 V112 M198 64 V112 M138 64 H202"/><path d="M170 69 a17 17 0 1 0 .1 0"/><path d="${ticks}" stroke-width=".9"/><path d="M170 86 V76 M170 86 L177 91" stroke-width="1.6"/>
    <path d="M30 120 L40 112 H300 L310 120 Z"/><path d="M36 120 V${G} M304 120 V${G}"/><path d="M36 126 H304 M36 176 H304 M36 222 H304" stroke-width=".6" opacity=".45"/>
    ${wins.map((w) => w.lines).join('')}
    <path d="M90 226 H250 V244 H90 Z"/>
    <path d="M40 244 H124 V252 M216 244 H300 V252" stroke-width="1"/><path d="${a1}"/><path d="${a2}"/>
    ${s1.lines}${s2.lines}<path d="${cakeRow(52, 280)} ${cakeRow(228, 280)} ${tins(50, 314)} ${tins(226, 314)}" stroke-width=".8"/>
    <path d="M146 ${G} V262 Q146 248 170 248 Q194 248 194 262 V${G} M170 250 V${G}"/><path d="M164 292 v6 M176 292 v6" stroke-width="1.6"/>
    ${lamp(136, 256)}${lamp(204, 256)}
    <path d="M322 ${G} V244 M316 ${G} h12" stroke-width="2"/><path d="M314 244 h16 l-3 -14 h-10 Z" stroke-width="1.2"/><path d="M316 243 h12 l-2 -11 h-8 Z" class="glow" stroke="none"/>
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}
// ---------- 日式隐藏款草稿 2：元素更多的场景 ----------
const gull = (x, y, k = 1) => `<path d="M${x - 6 * k} ${y} q${3 * k} ${-4 * k} ${6 * k} 0 q${3 * k} ${-4 * k} ${6 * k} 0" stroke-width="1"/>`;
const cat = (x, g, c = 'choco') => ({ fills: [[c, `M${x - 7} ${g} q-1 -12 7 -12 q8 0 7 12 Z M${x - 5} ${g - 12} l1 -6 l3 4 h2 l3 -4 l1 6 Z`]], lines: `<path d="M${x - 7} ${g} q-1 -12 7 -12 q8 0 7 12 Z M${x - 5} ${g - 12} l1 -6 l3 4 h2 l3 -4 l1 6" stroke-width="1"/><path d="M${x + 7} ${g - 2} q8 0 6 -10" stroke-width="1"/>` });
const bike = (x, g, basket = true) => ({
  fills: basket ? [['wood', `M${x + 14} ${g - 22} h12 v7 h-12 Z`], ['crust', `M${x + 15} ${g - 22} q3 -6 6 0 Z M${x + 20} ${g - 22} q3 -5 5 0 Z`]] : [],
  lines: `<path d="M${x - 9} ${g - 9} a9 9 0 1 0 .1 0 M${x + 21} ${g - 9} a9 9 0 1 0 .1 0" stroke-width="1.1"/>
    <path d="M${x - 9} ${g - 9} L${x + 3} ${g - 22} H${x + 16} L${x + 21} ${g - 9} M${x + 3} ${g - 22} L${x + 8} ${g - 9} L${x - 9} ${g - 9} M${x + 8} ${g - 9} L${x + 16} ${g - 22} M${x + 1} ${g - 26} h6 M${x + 16} ${g - 22} l1 -6 h4" stroke-width="1"/>
    ${basket ? `<path d="M${x + 14} ${g - 22} h12 v7 h-12 Z" stroke-width=".9"/>` : ''}`,
});
const snowflakes = (pts) => pts.map(([x, y]) => `M${x - 2.5} ${y} h5 M${x} ${y - 2.5} v5 M${x - 1.8} ${y - 1.8} l3.6 3.6 M${x - 1.8} ${y + 1.8} l3.6 -3.6`).join(' ');

// 镰仓海边的小面包店：背后是海和江之岛，江之电从坡下开过；白色木板小屋配蓝白条纹棚、绣球花、靠在墙边的冲浪板、车篮装着面包的自行车，屋顶上一只猫，天上几只海鸥
function kamakuraShop() {
  const W = 380, G = 300, SEA = 168;
  // 分三层画，后面的永远被前面的挡住：远景（海、江之岛、灯塔、帆船）→ 中景（石墙和江之电、沙滩、消波块）→ 房子（先铺一层不透明的底）→ 门口的小东西
  let waves = ''; for (let x = 6; x < 374; x += 22) waves += `M${x} ${SEA + 9 + (x % 44 ? 0 : 9)} q5 -4 10 0 `;
  const enoshima = `M268 ${SEA} Q282 ${SEA - 18} 298 ${SEA - 20} Q312 ${SEA - 22} 326 ${SEA - 10} Q336 ${SEA - 4} 344 ${SEA} Z`;
  const pier = `M0 ${SEA + 4} H78 V${SEA + 10} H0 Z`;
  const lh = `M62 ${SEA + 4} L65 ${SEA - 44} H75 L78 ${SEA + 4} Z`;
  const lhBands = `M63.5 ${SEA - 14} H76.5 L77 ${SEA - 4} H63 Z M64.6 ${SEA - 34} H75.4 L75.8 ${SEA - 24} H64.2 Z`;
  const tetra = (x, y) => `M${x} ${y} l-8 7 M${x} ${y} l8 7 M${x} ${y} v-9`;
  const tps = [[292, 212], [312, 212], [332, 212], [302, 199], [322, 199], [312, 186]];
  const sand = `M250 ${SEA + 32} Q310 ${SEA + 26} ${W} ${SEA + 30} V${G} H250 Z`;
  const wall = `M0 216 H112 V${G} H0 Z`;
  const tram = 'M10 186 H96 Q102 186 102 192 V214 H10 Z';
  const tramWins = [16, 34, 52, 70].map((x) => `M${x} 190 h13 v10 h-13 Z`).join(' ');
  const house = `M118 146 H250 V${G} H118 Z`;
  const roof = 'M108 148 L178 112 L258 148 Z';
  // 屋顶：一排排鱼鳞瓦、厚厚的博风板、山墙圆窗、右边一根小烟囱、屋脊上一只海鸥风向标
  const lx = (y) => 108 + (148 - y) * 70 / 36, rx = (y) => 258 - (148 - y) * 80 / 36;
  let shingles = ''; for (let y = 118, r = 0; y < 148; y += 6, r++) { shingles += `M${102 + (r % 2) * 3} ${y}`; for (let x = 102 + (r % 2) * 3; x < 262; x += 6) shingles += ' q3 3 6 0'; shingles += ' '; }
  const chim = 'M138 134 V112 H148 V128 Z';
  const roofWin = 'M170 128 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z';
  const boards = Array.from({ length: 14 }, (_, i) => `M${127 + i * 9} 146 V${G}`).join(' ');
  let awn = 'M118 210'; for (let i = 0; i < 8; i++) awn += ' q8.25 7 16.5 0';
  const stripes = Array.from({ length: 4 }, (_, i) => `M${118 + i * 33} 198 h16.5 v12 q-8.25 7 -16.5 0 Z`).join(' ');
  const win = pane(130, 222, 58, 46, 3, 2), door = pane(208, 220, 32, 80, 1, 3), upw = pane(164, 153, 46, 24, 2, 2);
  const bed = bush([[128, 292, 8], [142, 289, 9], [156, 292, 8], [176, 293, 6]]);
  const bed2 = bush([[256, 292, 7], [268, 290, 8]]);
  const bk = bike(306, G); const kitty = cat(206, 136);
  // 紫阳花：一团圆圆的花球，上面点一圈四瓣小花
  // 紫阳花：花球边缘一圈小鼓包，里面挤满一朵朵四瓣小花（浅一号的颜色），下面垫两片尖叶子
  const ajisai = (list) => {
    const C = { p: ['#a58bd0', '#cbb8ec'], b: ['#7fa3dc', '#bcd0f2'] };
    const mop = (x, y, r) => {
      const n = 11, pt = (i) => [x + r * Math.cos(i / n * 2 * Math.PI), y + r * .86 * Math.sin(i / n * 2 * Math.PI)];
      let d = `M${pt(0).join(' ')}`;
      for (let i = 1; i <= n; i++) d += ` A${r * .32} ${r * .32} 0 0 1 ${pt(i).map((v) => v.toFixed(1)).join(' ')}`;
      return d + ' Z';
    };
    let out = '';
    for (const [x, y, r, c] of list) {
      const [base, light] = C[c === 'p' ? 'p' : 'b'];
      const leaf = `M${x - r * .4} ${y + r * .7} q${-r} ${r * .1} ${-r * 1.4} ${-r * .3} q${r * .7} ${-r * .2} ${r * 1.4} ${r * .3} Z M${x + r * .4} ${y + r * .7} q${r} ${r * .1} ${r * 1.4} ${-r * .3} q${-r * .7} ${-r * .2} ${-r * 1.4} ${r * .3} Z`;
      let fl = '', ctr = '';
      for (let dy = -r * .7; dy <= r * .7; dy += 3.4) for (let dx = -r * .8 + (Math.round(dy / 3.4) % 2 ? 1.7 : 0); dx <= r * .8; dx += 3.4) {
        if ((dx * dx) / (r * r * .72) + (dy * dy) / (r * r * .5) > 1) continue;
        const fx = x + dx, fy = y + dy;
                fl += ['M-1.25 0', 'M0 -1.25', 'M1.25 0', 'M0 1.25'].map((m) => { const [u, v] = m.slice(1).split(' ').map(Number); return `M${(fx + u - 1).toFixed(1)} ${(fy + v).toFixed(1)} a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z`; }).join(' ') + ' ';
        ctr += `M${fx.toFixed(1)} ${fy.toFixed(1)} h.01 `;
      }
      out += `${crayon([['leaf', leaf]], 0, 0)}<path d="${leaf}" stroke-width=".7"/>
        <path d="${mop(x, y, r)}" fill="${base}" stroke-width=".9"/><path d="${fl}" fill="${light}" stroke="none"/><path d="${ctr}" stroke="${base}" stroke-width=".9" stroke-linecap="round"/>`;
    }
    return out;
  };
  // 镰仓高校前的踏切：白柱子 + 黄黑叉形牌 + 两盏红灯 + 「→」指示牌，柱脚黄黑斜纹
  const fumikiri = (x) => {
    const xb = `M${x - 13} ${G - 104} l26 14 l-2 4 l-26 -14 Z M${x + 13} ${G - 104} l-26 14 l2 4 l26 -14 Z`;
    const stripes = `M${x - 2} ${G - 14} l4 -3 v3 l-4 3 Z M${x - 2} ${G - 6} l4 -3 v3 l-4 3 Z`;
    return `${crayon([['paper', `M${x - 2} ${G} V${G - 106} h4 V${G} Z`], ['custard', `${xb} M${x - 2} ${G - 18} h4 v18 h-4 Z`], ['shu', `M${x - 15} ${G - 76} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z M${x + 5} ${G - 76} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z`], ['paper', `M${x - 8} ${G - 60} h16 v10 h-16 Z`]], 0, 0)}
      <path d="M${x - 2} ${G} V${G - 106} h4 V${G}" stroke-width="1"/><path d="${xb}" stroke-width=".9"/>
      <path d="M${x - 13} ${G - 104} l7 3.8 M${x + 13} ${G - 104} l-7 3.8 M${x - 6} ${G - 94} l6 -3.2 M${x + 6} ${G - 94} l-6 -3.2" stroke-width="2.2"/>
      <path d="M${x - 16} ${G - 76} H${x + 16} M${x - 10} ${G - 76} v-7 h20 v7" stroke-width="1.1"/>
      <path d="M${x - 15} ${G - 76} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z M${x + 5} ${G - 76} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z" stroke-width="1"/>
      <path d="M${x - 13} ${G - 78} a2 2 0 0 1 3 -1 M${x + 7} ${G - 78} a2 2 0 0 1 3 -1" stroke="#fffcf5" stroke-width=".8"/>
      <path d="M${x - 8} ${G - 60} h16 v10 h-16 Z" stroke-width="1"/><path d="M${x - 5} ${G - 55} h9 m-3 -3 l3 3 l-3 3" stroke-width="1.1"/>
      <path d="M${x - 2} ${G - 18} h4" stroke-width=".9"/><path d="${stripes}" class="ink-fill" stroke="none"/>`;
  };
  return wrap(`
    ${crayon([['sea', `M0 ${SEA} H${W} V${SEA + 32} H0 Z`], ['leaf', enoshima]])}
    <path d="M0 ${SEA} H${W}" stroke-width="1.1"/><path d="${waves}" stroke-width=".7" opacity=".55"/>
    <path d="${enoshima}"/>${(() => {
      const shaft = `M303 ${SEA - 20} L305 ${SEA - 42} H309 L311 ${SEA - 20} Z`, deck = `M299 ${SEA - 45} H315 V${SEA - 41} H299 Z`, cap = `M302 ${SEA - 49} H312 L310 ${SEA - 45} H304 Z`;
      return `${crayon([['paper', shaft], ['skysoft', deck], ['shu', cap]], 0, 0)}<path d="${shaft} ${deck} ${cap}" stroke-width="1"/>
        <path d="M304 ${SEA - 26} L310 ${SEA - 33} M310 ${SEA - 26} L304 ${SEA - 33} M305 ${SEA - 33} L309 ${SEA - 40} M309 ${SEA - 33} L305 ${SEA - 40}" stroke-width=".5" opacity=".7"/>
        <path d="M303 ${SEA - 43} h8" stroke-width=".6"/><path d="M307 ${SEA - 49} v-6" stroke-width="1"/><path d="M305.5 ${SEA - 44} h3" class="glow" stroke-width="1.6"/>`;
    })()}
    ${(() => {
      const main = `M92 ${SEA - 4} V${SEA - 21} L102 ${SEA - 4} Z`, jib = `M90 ${SEA - 4} V${SEA - 17} L84 ${SEA - 4} Z`, hull = `M82 ${SEA - 3} H104 L101 ${SEA + 2} H85 Z`;
      return `${crayon([['paper', main], ['custard', jib], ['ai', hull], ['shu', `M92 ${SEA - 13} L97 ${SEA - 13} L99.3 ${SEA - 9} H92 Z M91 ${SEA - 21} l4 1.5 l-4 1.5 Z`]], 0, 0)}
        <path d="${main} ${jib} ${hull}" stroke-width=".9"/><path d="M91 ${SEA - 3} V${SEA - 23}" stroke-width="1"/><path d="M83 ${SEA + 4} q3 -2 6 0 M97 ${SEA + 4} q3 -2 6 0" stroke-width=".6" opacity=".6"/>`;
    })()}
    ${crayon([['tile', pier], ['paper', lh], ['shu', `${lhBands} M63 ${SEA - 44} H77 V${SEA - 50} H63 Z M64 ${SEA - 50} Q70 ${SEA - 60} 76 ${SEA - 50} Z`]])}
    <path d="${pier}" stroke-width="1"/><path d="${lh}"/><path d="${lhBands}" stroke-width=".8"/><path d="M61 ${SEA - 44} H79 M63 ${SEA - 44} V${SEA - 50} H77 V${SEA - 44} M64 ${SEA - 50} Q70 ${SEA - 60} 76 ${SEA - 50} M70 ${SEA - 57} v-4" stroke-width="1"/>
    <path d="M66.5 ${SEA - 49} h7 v4 h-7 Z" class="glow" stroke-width=".6"/><path d="M58 ${SEA - 48} L44 ${SEA - 54} M82 ${SEA - 48} L96 ${SEA - 54}" stroke-width=".7" opacity=".5"/>
    ${gull(70, 60)}${gull(96, 76, .8)}${gull(330, 54)}${gull(352, 70, .7)}

    <path d="${sand}" class="f-paper" stroke="none"/>${crayon([['soft', sand]])}<path d="M250 ${SEA + 32} Q310 ${SEA + 26} ${W} ${SEA + 30}" stroke-width="1"/>
    <path d="${tps.map(([x, y]) => tetra(x, y)).join(' ')}" stroke-width="7.4"/><path d="${tps.map(([x, y]) => tetra(x, y)).join(' ')}" stroke="#c8ccd3" stroke-width="4.6"/><path d="${tps.map(([x, y]) => `M${x - 2} ${y - 6} v3`).join(' ')}" stroke="#eef0f3" stroke-width="1.2"/>
    <path d="${wall}" class="f-paper" stroke="none"/>${crayon([['soft', wall]])}<path d="M0 216 H112 V${G}" stroke-width="1.1"/>${bricks(0, 112, 216, G, 10)}
    ${crayon([['leaf', tram], ['paper', 'M10 200 H102 V206 H10 Z'], ['skysoft', tramWins]])}
    <path d="${tram}"/><path d="${tramWins}" stroke-width=".8"/><path d="M10 200 H102 M10 206 H102" stroke-width=".7"/><path d="M28 186 L40 174 H60 M44 174 l6 -6" stroke-width=".9"/><path d="M22 214 a4 4 0 1 0 .1 0 M86 214 a4 4 0 1 0 .1 0" stroke-width=".9"/>
    ${blob(bush([[44, 225, 8], [62, 227, 8], [82, 225, 8], [98, 227, 7]]), 'leaf', 1.4)}${ajisai([[40, 219, 7.5, 'b'], [56, 221, 7, 'p'], [72, 218, 7.5, 'b'], [88, 220, 7, 'p'], [102, 222, 6.5, 'b']])}

    <path d="${house} ${roof}" class="f-paper" stroke="none"/>
    ${crayon([['tile', roof], ['paper', house], ['skysoft', `${win.fill} ${door.fill} ${upw.fill}`], ['ai', stripes], ['paper', stripes.replace(/M(\d+) 198/g, (m, x) => `M${+x + 16.5} 198`)], ['paper', 'M120 181 H248 V197 H120 Z'], ['crust', `${loafRow(136, 246, 3, 16)} ${loafRow(136, 268, 3, 16)}`], ...kitty.fills])}
    <clipPath id="kmk-roof"><path d="${roof}"/></clipPath><path d="${roof}"/><path d="${shingles}" clip-path="url(#kmk-roof)" stroke-width=".6" opacity=".55"/>
    ${crayon([['paper', 'M102 151 L178 107 L264 151 H258 L178 110.5 L108 151 Z'], ['skysoft', roofWin], ['tile', chim], ['shu', 'M136 112 H150 V108 H136 Z']])}
    <path d="M102 151 L178 107 L264 151 H258 L178 110.5 L108 151 Z" stroke-width="1.3"/>
    <path d="${roofWin}" stroke-width="1.2"/><path d="M178 120 v16 M170 128 h16" stroke-width=".8"/><path d="M168 138 h20" stroke-width="1.2"/>
    <path d="${chim} M136 112 H150 V108 H136 Z" stroke-width="1"/>${smoke(143, 104)}
    <path d="M178 107 V92" stroke-width="1.1"/><path d="M170 96 L186 96 M184 94 l3 2 l-3 2" stroke-width=".9"/><path d="M172 94 q3 -4 6 0 q3 -4 6 0" stroke-width="1"/>
    <path d="M118 146 V${G} M250 146 V${G}"/><path d="${boards}" stroke-width=".45" opacity=".3"/>
    ${upw.lines}${curtains(164, 153, 46, 24)}<path d="M158 179 H216" stroke-width="1.4"/>
    <path d="M120 181 H248 V197 H120 Z" stroke-width="1"/>
    <path d="M118 198 H250 V210" stroke-width="1"/><path d="M118 198 V210"/><path d="${awn}"/>
    ${win.lines}<path d="${loafRow(136, 246, 3, 16)} ${loafRow(136, 268, 3, 16)}" stroke-width="1"/>${goldText(159, 230.5, 'パンとコーヒー', 5.4).replace('class="gold-text"', 'class="gold-text sk-text"')}
    <path d="M126 268 H192" stroke-width="1.4"/>
    ${door.lines}<path d="M234 262 v6" stroke-width="1.6"/>
    ${crayon([['paper', 'M214 236 h20 v8 h-20 Z']])}<path d="M218 232 L224 228 L230 232 M214 236 h20 v8 h-20 Z" stroke-width=".7"/><text x="224" y="242" font-size="4.6" text-anchor="middle" stroke="none" fill="currentColor" class="sk-text">営業中</text>
    ${lamp(198, 214)}
    ${kitty.lines}

    ${(() => {
      // 冲浪板：尖头圆尾，中间一条木纹 stringer，一道红色色带，尾巴露一片小鳍
      const board = 'M106 226 C113 234 116 252 115.5 272 C115 290 111 300 106 300 C101 300 97 290 96.5 272 C96 252 99 234 106 226 Z';
      return `${crayon([['sky', board], ['shu', 'M97 254 H115.4 V260 H96.8 Z'], ['paper', 'M97.6 262 H115 V264 H97.4 Z']], 0, 0)}
        <path d="${board}" stroke-width="1.3"/><path d="M106 230 V297" stroke-width=".6" opacity=".7"/><path d="M96.8 254 H115.4 M96.8 260 H115.4" stroke-width=".7"/>
        <path d="M100 236 q-1 6 -1 12" stroke="#fffcf5" stroke-width="1.2"/>`;
    })()}
    ${blob(bed, 'leaf', 1.6)}${ajisai([[127, 284, 7, 'p'], [142, 280, 7.5, 'b'], [157, 284, 7, 'p'], [176, 287, 6, 'b']])}
    ${chalkboard(266, G, 'パン', '珈琲').replace(/font-family="Courier Prime, monospace"/g, 'class="sk-text"')}
    ${crayon(bk.fills)}${bk.lines}
    ${(() => {
      // 沙滩遮阳伞：直直的伞杆，伞面红白相间、下沿一圈小弧，顶上一个小球
      const bx = [341, 350.5, 360, 369.5, 379];
      const panel = (i) => `M360 236 L${bx[i]} 258 Q${(bx[i] + bx[i + 1]) / 2} 262 ${bx[i + 1]} 258 Z`;
      const canopy = `M341 258 Q344 236 360 236 Q376 236 379 258 ${[3, 2, 1, 0].map((i) => `Q${(bx[i] + bx[i + 1]) / 2} 262 ${bx[i]} 258`).join(' ')} Z`;
      return `<path d="M360 ${G} V234" stroke-width="1.6"/><path d="M357 ${G - 6} h6" stroke-width="1.2"/>
        ${crayon([['shu', `${panel(0)} ${panel(2)}`], ['paper', `${panel(1)} ${panel(3)}`]], 0, 0)}
        <path d="${canopy}" stroke-width="1.2"/><path d="M360 236 L350.5 258 M360 236 L360 258 M360 236 L369.5 258" stroke-width=".7"/><path d="M360 236 a1.6 1.6 0 1 0 .1 -3" stroke-width="1.2"/>`;
    })()}
    ${fumikiri(17)}
    ${mascotAt(40, G - 33)}
  `, `0 0 ${W + 6} ${G + 12}`, 'store', 1.5);
}

// 北海道雪地牧场面包房：雪山脚下的红色谷仓面包房，复斜屋顶积着厚雪、檐下挂着冰柱，旁边一座圆顶筒仓；
// 雪松、雪人、装满面包的雪橇、牛奶罐、积雪的木栅栏，烟囱冒烟，天上飘雪
function hokkaidoBarn() {
  const W = 380, G = 300;
  const mtn = 'M0 150 L60 92 L104 128 L160 70 L220 132 L270 96 L330 140 L380 118 V170 H0 Z';
  const mtnSnow = 'M48 104 L60 92 L72 102 L64 100 L58 106 Z M146 84 L160 70 L176 86 L166 82 L158 90 Z M258 106 L270 96 L282 106 L272 104 Z';
  const barn = 'M120 170 L130 132 L190 104 L250 132 L260 170 V300 H120 Z';
  const snowRoof = 'M116 172 Q118 160 128 132 Q160 116 190 100 Q222 116 252 132 Q262 160 264 172 Q258 166 254 140 Q222 124 190 110 Q158 124 126 140 Q122 166 116 172 Z';
  const icicles = Array.from({ length: 14 }, (_, i) => `M${124 + i * 10} 171 l1.5 ${5 + (i % 3) * 3} l1.5 ${-(5 + (i % 3) * 3)} Z`).join(' ');
  const planks = Array.from({ length: 13 }, (_, i) => `M${128 + i * 10} 172 V${G}`).join(' ');
  const xdoor = 'M162 300 V232 H218 V300 M162 232 L218 300 M218 232 L162 300';
  const silo = 'M270 300 V150 Q270 128 292 128 Q314 128 314 150 V300 Z';
  const pine = (x, h) => `M${x} ${G - h} L${x - 20} ${G - h * .45} H${x - 9} L${x - 24} ${G - 14} H${x + 24} L${x + 9} ${G - h * .45} H${x + 20} Z`;
  const pineSnow = (x, h) => `M${x} ${G - h} L${x - 10} ${G - h * .72} Q${x} ${G - h * .78} ${x + 10} ${G - h * .72} Z M${x - 18} ${G - h * .46} Q${x} ${G - h * .52} ${x + 18} ${G - h * .46} L${x + 14} ${G - h * .42} Q${x} ${G - h * .48} ${x - 14} ${G - h * .42} Z`;
  const flakes = snowflakes([[30, 40], [80, 24], [122, 56], [210, 40], [250, 66], [300, 30], [350, 60], [20, 190], [100, 226], [340, 196], [236, 84], [150, 30]]);
  const fence = Array.from({ length: 6 }, (_, i) => `M${326 + i * 9} ${G} V${G - 26}`).join(' ') + ` M322 ${G - 20} H376 M322 ${G - 10} H376`;
  const fenceSnow = Array.from({ length: 6 }, (_, i) => `M${323 + i * 9} ${G - 26} q3 -4 6 0 Z`).join(' ');
  const win = (x) => pane(x, 184, 26, 28, 2, 2);
  const w1 = win(134), w2 = win(220);
  return wrap(`
    ${crayon([
      ['sea', mtn], ['paper', mtnSnow],
      ['leaf', `${pine(62, 120)} ${pine(352, 110)}`],
      ['paper', `M0 ${G} Q40 ${G - 12} 90 ${G - 6} Q110 ${G - 2} 120 ${G} Z M260 ${G} Q300 ${G - 10} 380 ${G - 4} V${G} Z`],
      ['paper', 'M104 284 a10 10 0 1 0 .1 0 Z M106 266 a7 7 0 1 0 .1 0 Z'],
      ['wood', `M228 ${G - 4} H262 L266 ${G - 10} M228 ${G - 4} L226 ${G - 10}`], ['crust', `${loafRow(232, G - 10, 2, 13)}`],
      ['tile', `M240 ${G - 12} h10 v-14 h-10 Z`],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="${mtn.replace(' V170 H0 Z', '')}" stroke-width="1.1"/><path d="${mtnSnow}" stroke-width=".7"/>
    <path d="${pine(62, 120)} ${pine(352, 110)}"/>${crayon([['paper', `${pineSnow(62, 120)} ${pineSnow(352, 110)}`]], 0, 0)}
    <path d="${barn} ${silo} M136 104 H150 V128 H136 Z" class="f-paper" stroke="none"/>${crayon([['shu', barn], ['tile', silo], ['tile', 'M136 104 H150 V128 H136 Z']])}

    ${crayon([['paper', snowRoof], ['paper', 'M150 140 H230 V158 H150 Z'], ['custard', `${w1.fill} ${w2.fill} M182 112 h16 v16 h-16 Z`], ['wood', 'M162 232 H218 V300 H162 Z'], ['paper', 'M268 150 Q268 124 292 124 Q316 124 316 150 Q304 144 292 144 Q280 144 268 150 Z']])}
    <path d="M136 128 V104 H150 V120" stroke-width="1.2"/>${smoke(143, 100)}
    <path d="${barn}"/><path d="${planks}" stroke-width=".45" opacity=".4"/><path d="${snowRoof}" stroke-width="1"/>
    ${crayon([['paper', icicles]], 0, 0)}<path d="${icicles}" stroke-width=".6"/>
    <path d="M182 112 h16 v16 h-16 Z M190 112 v16 M182 120 h16" stroke-width=".9"/>
    <path d="M150 140 H230 V158 H150 Z"/>
    ${w1.lines}${w2.lines}<path d="M130 212 H164 M216 212 H250" stroke-width="1.4"/><path d="M134 184 q13 -6 26 0 M220 184 q13 -6 26 0" stroke-width="2" stroke="#fffcf5"/>
    <path d="${xdoor}" stroke-width="1.2"/><path d="M190 232 V300" stroke-width="1"/>
    <path d="${silo}"/><path d="M268 150 Q268 124 292 124 Q316 124 316 150" stroke-width="1"/><path d="M270 180 H314 M270 220 H314 M270 260 H314" stroke-width=".7" opacity=".6"/>
    <path d="${fence}" stroke-width="1"/>${crayon([['paper', fenceSnow]], 0, 0)}
    <path d="M0 ${G} Q40 ${G - 12} 90 ${G - 6} Q110 ${G - 2} 120 ${G} M260 ${G} Q300 ${G - 10} 380 ${G - 4}" stroke-width="1"/>
    <path d="M104 284 a10 10 0 1 0 .1 0 M106 266 a7 7 0 1 0 .1 0" stroke-width="1.1"/><path d="M103 271 h1 M109 271 h1" stroke-width="1.4"/><path d="M106 274 l5 1.5" stroke="#e8955a" stroke-width="1.6"/><path d="M99 262 h14 M102 262 v-6 h8 v6" stroke-width="1"/><path d="M98 284 l-10 -6 M114 284 l10 -6" stroke-width="1"/><path d="M101 270 q5 4 10 0" stroke-width="0" />
    <path d="M228 ${G - 4} H262 L266 ${G - 10} M228 ${G - 4} L226 ${G - 10} M230 ${G} H264 Q270 ${G} 270 ${G - 6}" stroke-width="1.1"/><path d="${loafRow(232, G - 10, 2, 13)}" stroke-width=".9"/>
    <path d="M240 ${G - 12} h10 v-14 h-10 Z M242 ${G - 26} h6 v-3 h-6 Z" stroke-width="1"/>
    <path d="${flakes}" stroke-width=".8" opacity=".7"/>
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}

// 东京下町商店街老铺：头顶一道写着「商店街」的拱门招牌和一串灯笼，左边电线杆上缠着电线；
// 正中是两层木造老铺，铁皮雨棚下一排玻璃柜摆着面包和手写价签，两边露出隔壁的菜摊和红色的烟草铺，门口自动贩卖机、自行车、一排盆栽和一只猫
function shitamachiShop() {
  const W = 380, G = 300;
  const arch = 'M20 40 Q190 0 360 40 V58 Q190 18 20 58 Z';
  const lanternsLine = 'M20 78 Q190 60 360 78';
  const lant = [50, 90, 130, 170, 210, 250, 290, 330].map((x, i) => { const y = 78 - Math.sin((x - 20) / 340 * Math.PI) * 14; return [x, y]; });
  const lantFill = lant.map(([x, y]) => `M${x - 5} ${y + 2} Q${x - 7} ${y + 8} ${x - 5} ${y + 14} H${x + 5} Q${x + 7} ${y + 8} ${x + 5} ${y + 2} Z`).join(' ');
  const pole = 'M26 300 V70 M14 92 H40 M16 104 H38';
  const wires = 'M26 92 Q120 100 380 90 M26 98 Q140 108 380 98 M26 104 Q90 112 200 106';
  const main = 'M110 110 H270 V300 H110 Z';
  const ups = [126, 172, 218].map((x) => pane(x, 120, 34, 32, 2, 2));
  const tin = 'M100 176 L280 176 L274 196 H106 Z';
  const tinRibs = Array.from({ length: 18 }, (_, i) => `M${108 + i * 9.6} 177 L${109 + i * 9.4} 195`).join(' ');
  const case1 = pane(116, 216, 52, 40, 1, 2), case2 = pane(212, 216, 52, 40, 1, 2);
  const tags = [[120, 234], [150, 234], [216, 234], [246, 234], [120, 254], [216, 254]].map(([x, y]) => `M${x} ${y} h10 v-6 h-10 Z`).join(' ');
  const veg = bush([[20, 238, 6], [32, 236, 7], [46, 238, 6], [60, 236, 6]]);
  const pots = [118, 134, 250, 266].map((x) => `M${x - 6} 300 L${x - 7} 290 H${x + 7} L${x + 6} 300 Z`).join(' ');
  const potLeaf = bush([[118, 284, 7], [134, 282, 8], [250, 282, 8], [266, 284, 7]]);
  const vend = pane(282, 236, 26, 30, 3, 2);
  const kitty = cat(160, 300, 'paper'); const bk = bike(334, G, false);
  return wrap(`
    ${crayon([
      ['shu', arch],
      ['shu', lantFill],
      ['leaf', 'M4 220 L20 204 H90 L104 220 Z'], ['wood', 'M10 222 H96 V244 H10 Z'],
      ['soft', 'M0 110 H104 V300 H0 Z'.replace('M0 110', 'M0 110')],
      ['sky', 'M276 120 H380 V300 H276 Z'], ['paper', 'M286 132 H370 V150 H286 Z'],
      ['wood', main],
      ['skysoft', ups.map((u) => u.fill).join(' ')],
      ['paper', 'M128 156 H252 V172 H128 Z'],
      ['tile', tin],
      ['ai', 'M172 200 H208 V236 H172 Z'], ['soft', `M174 ${G} V238 H206 V${G} Z`],
      ['skysoft', `${case1.fill} ${case2.fill}`],
      ['crust', `${loafRow(120, 234, 3, 15)} ${loafRow(216, 234, 3, 15)} ${loafRow(120, 254, 3, 15)} ${loafRow(216, 254, 3, 15)}`],
      ['paper', tags],
      ['wood', pots],
      ['shu', 'M280 226 H310 V300 H280 Z'], ['skysoft', vend.fill],
      ['custard', 'M6 150 h18 v24 h-18 Z'], ['ai', 'M78 150 h18 v24 h-18 Z'],
      ...kitty.fills,
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="M0 110 H104 V300 M0 140 H104" stroke-width="1"/><path d="M6 150 h18 v24 h-18 Z M78 150 h18 v24 h-18 Z" stroke-width=".9"/>
    <path d="M4 220 L20 204 H90 L104 220 Z M10 222 H96 V244 H10 Z M14 244 V300 M92 244 V300" stroke-width="1"/>${blob(veg, 'leaf', 1.6)}${crayon([['shu', dots([[26, 232], [52, 232]], 3)], ['custard', dots([[38, 230]], 3)]], 0, 0)}
    <path d="M276 120 H380 M276 120 V300" stroke-width="1"/><path d="M286 132 H370 V150 H286 Z" stroke-width="1"/><text x="328" y="145" font-size="10" text-anchor="middle" stroke="none" class="sk-text" fill="currentColor">たばこ</text>
    <path d="${main}"/><path d="M106 110 H274" stroke-width="1.8"/>
    ${ups.map((u) => u.lines).join('')}<path d="M128 156 H252 V172 H128 Z"/>
    <path d="${tin}"/><path d="${tinRibs}" stroke-width=".5" opacity=".5"/>
    <path d="M172 200 H208 V236 H172 Z M184 200 V236 M196 200 V236" stroke-width="1"/><path d="M168 198 H212" stroke-width="1.6"/>
    <path d="M112 212 H172 V262 H112 Z M208 212 H268 V262 H208 Z" stroke-width="1"/>${case1.lines}${case2.lines}<path d="${loafRow(120, 234, 3, 15)} ${loafRow(216, 234, 3, 15)} ${loafRow(120, 254, 3, 15)} ${loafRow(216, 254, 3, 15)}" stroke-width=".9"/><path d="${tags}" stroke-width=".6"/>
    <path d="M174 ${G} V238 H206 V${G} M190 238 V${G}" stroke-width="1"/><path d="M186 268 v6 M194 268 v6" stroke-width="1.6"/>
    <path d="${pots}" stroke-width="1"/>${blob(potLeaf, 'leaf', 1.6)}
    <path d="M280 226 H310 V300 H280 Z"/>${vend.lines}<path d="M284 274 h22 v8 h-22 Z M300 290 h6" stroke-width=".8"/>
    ${kitty.lines}${bk.lines}
    <path d="${pole}" stroke-width="2.4"/><path d="${wires}" stroke-width=".8"/>
    <path d="${arch}"/><text x="190" y="40" font-size="13" text-anchor="middle" stroke="none" class="sk-text ink-fill">下 町 銀 座 商 店 街</text>
    <path d="${lanternsLine}" stroke-width=".8"/><path d="${lantFill}" stroke-width=".9"/>
    ${mascotAt(40, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}
// 爱丽丝梦游仙境：整间店是一只大茶壶——壶盖上歪戴着疯帽子的高礼帽（帽带上插着 10/6 的价签），圆窗、拱门、壶嘴壶把；
// 门前一条黑白棋盘小路，两边巨大的红蘑菇、刷了一半红漆的玫瑰丛、靠着的红心扑克牌，天上飘着柴郡猫的笑，门边白兔拿着怀表
function aliceTeapot() {
  const W = 380, G = 300;
  const body = `M112 ${G} C88 256 94 178 190 170 C286 178 292 256 268 ${G} Z`;
  const lid = 'M134 172 Q190 136 246 172 Z';
  const spout = `M266 236 C298 230 316 206 334 162 L348 170 C332 220 314 254 272 268 Z`;
  const handle = 'M112 196 C66 190 60 268 106 264';
  const band = 'M100 200 Q190 188 280 200 L282 220 Q190 208 98 220 Z';
  const hat = '<g transform="translate(0 14) rotate(-14 190 130)"><path d="M168 132 h44 M174 132 l2 -30 h28 l2 30 Z" /><path d="M175 118 h30" stroke-width="3"/></g>';
  const hatFill = '<g transform="translate(0 14) rotate(-14 190 130)">' + crayon([['choco', 'M174 132 l2 -30 h28 l2 30 Z'], ['pink', 'M175 116 h30 v5 h-30 Z'], ['paper', 'M198 104 h10 v8 h-10 Z']]) + '<path d="M198 104 h10 v8 h-10 Z" stroke-width=".7"/><text x="203" y="110.5" font-size="4.6" text-anchor="middle" stroke="none" class="sk-text" fill="currentColor">10/6</text></g>';
  const checker = Array.from({ length: 12 }, (_, i) => `M${116 + i * 13} ${G - 8} h13 v8 h-13 Z`);
  const blackSq = checker.filter((_, i) => i % 2 === 0).join(' '), whiteSq = checker.filter((_, i) => i % 2).join(' ');
  const mush = (x, w, h) => ({ cap: `M${x - w} ${G - h} Q${x} ${G - h - w * 1.1} ${x + w} ${G - h} Q${x} ${G - h + 8} ${x - w} ${G - h} Z`, stem: `M${x - w * .28} ${G} Q${x - w * .2} ${G - h / 2} ${x - w * .3} ${G - h + 2} H${x + w * .3} Q${x + w * .2} ${G - h / 2} ${x + w * .28} ${G} Z`,
    spots: dots([[x - w * .5, G - h - w * .4], [x, G - h - w * .7], [x + w * .5, G - h - w * .35], [x - w * .15, G - h - w * .25]], w * .12) });
  const m1 = mush(52, 36, 66), m2 = mush(362, 16, 30);
  const roses = bush([[318, 286, 9], [332, 282, 10], [344, 288, 8]]);
  const roseDots = [[314, 280], [326, 274], [336, 278], [342, 284], [330, 290], [348, 282]];
  const card = '<g transform="translate(2 6) rotate(8 290 270)"><path d="M280 250 h26 v40 h-26 Z"/><path d="M293 266 c-3 -4 -8 0 0 7 c8 -7 3 -11 0 -7 Z" class="f-shu" stroke-width=".7"/><path d="M283 256 v4 M303 286 v-4" stroke-width=".8"/></g>';
  const grin = '<path d="M44 64 Q70 84 96 64" stroke-width="1.8"/><path d="M50 67 l2 5 M58 71 l1 5 M66 73 v5 M74 73 v5 M82 71 l-1 5 M90 67 l-2 5" stroke-width=".9"/><path d="M58 50 q4 -6 8 0 q-4 6 -8 0 Z M76 50 q4 -6 8 0 q-4 6 -8 0 Z" stroke-width="1"/><path d="M61 50 v0.1 M79 50 v0.1" stroke-width="2.4"/>';
  const rabbit = (x) => `<path d="M${x - 6} ${G} q-2 -14 6 -18 q8 4 6 18 Z" class="f-paper"/><path d="M${x - 4} ${G - 18} a6 6 0 1 0 8 0 a6 6 0 1 0 -8 0 Z" class="f-paper"/><path d="M${x - 3} ${G - 22} q-3 -14 1 -16 q3 4 1 15 M${x + 2} ${G - 22} q1 -14 5 -14 q2 6 -3 15" stroke-width="1"/>
    <path d="M${x + 5} ${G - 10} a4 4 0 1 0 .1 0" class="glow" stroke-width=".8"/><path d="M${x + 5} ${G - 14} v-3 M${x + 5} ${G - 10} l2 -2" stroke-width=".6"/><path d="M${x - 6} ${G - 6} h12" class="f-shu" stroke-width="0"/>`;
  return wrap(`
    ${grin}
    ${crayon([
      ['shu', `${m1.cap} ${m2.cap}`], ['paper', `${m1.stem} ${m2.stem}`],
      ['paper', `${spout} ${lid}`],
      ['custard', 'M182 150 a8 6 0 1 0 16 0 a8 6 0 1 0 -16 0 Z'],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="${m1.cap} ${m2.cap}"/><path d="${m1.stem} ${m2.stem}"/>${crayon([['paper', `${m1.spots} ${m2.spots}`]], 0, 0)}
    <path d="${handle}" stroke-width="7"/><path d="${handle}" stroke="#fffcf5" stroke-width="3.6"/>
    <path d="${spout}"/>
    <path d="${body}" class="f-paper" stroke="none"/>${crayon([['paper', body]])}
    <clipPath id="tea-body"><path d="${body}"/></clipPath>
    <g clip-path="url(#tea-body)">${crayon([['sky', band]])}<path d="${band}" stroke-width="1"/>
      ${crayon([['sky', dots([[124, 256], [148, 276], [236, 276], [258, 256], [116, 236], [266, 236]], 3.2)], ['custard', dots([[124, 256], [148, 276], [236, 276], [258, 256], [116, 236], [266, 236]], 1.2)]], 0, 0)}
      <path d="M90 228 Q190 216 290 228" stroke="#e0b25a" stroke-width="1.6"/><path d="M90 194 Q190 182 290 194" stroke="#e0b25a" stroke-width="1.6"/></g>
    <path d="${body}"/>${crayon([['skysoft', 'M132 240 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z M220 240 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z'], ['pink', `M174 ${G - 8} V246 Q174 228 190 228 Q206 228 206 246 V${G - 8} Z`], ['choco', blackSq], ['paper', whiteSq]])}<path d="${lid}"/><path d="M128 172 H252" stroke="#e0b25a" stroke-width="2.4"/><path d="M128 172 H252" stroke-width=".8"/><path d="M182 150 a8 6 0 1 0 16 0 a8 6 0 1 0 -16 0"/>
    ${hatFill}${hat}
    <path d="M118 182 q8 -6 16 0 q8 -6 16 0 M230 182 q8 -6 16 0 q8 -6 16 0 M112 274 q10 6 20 0 M248 274 q10 6 20 0" stroke-width=".8" opacity=".7"/>
    ${crayon([['pink', dots([[126, 178], [142, 178], [238, 178], [254, 178]], 2.2)]], 0, 0)}
    <path d="M132 240 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M220 240 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M146 226 V254 M132 240 H160 M234 226 V254 M220 240 H248" stroke-width="1"/>
    <path d="M174 ${G - 8} V246 Q174 228 190 228 Q206 228 206 246 V${G - 8}"/><path d="M200 266 a2 2 0 1 0 .1 0" stroke-width="1.4"/>
    <path d="${blackSq} ${whiteSq}" stroke-width=".6"/>
    ${card}
    ${blob(roses, 'leaf', 1.6)}${crayon([['shu', dots(roseDots.slice(0, 4), 3)], ['paper', dots(roseDots.slice(4), 3)]], 0, 0)}<path d="M352 294 l6 -10 M358 284 l2 -3" stroke-width="1.2"/><path d="M359 281 l3 -3" stroke="#c4513a" stroke-width="2.4"/>
    ${rabbit(222)}
    ${mascotAt(4, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}
// 兔子仙境：粉色鱼鳞瓦的童话小木屋，屋顶竖着一对兔耳朵，圆顶门上开着心形小窗；旁边接一间玻璃花房，里面开满花；
// 门前玫瑰拱门，花园里一张下午茶桌（三层点心架、茶壶、茶杯），白兔穿着小马甲举着怀表，屋檐之间挂一串三角旗
function bunnyCottage() {
  const W = 360, G = 300;
  const roof = 'M60 150 L135 84 L210 150 Z';
  const shingles = Array.from({ length: 4 }, (_, r) => { const y = 108 + r * 13, half = 24 + r * 15; let d = `M${135 - half} ${y}`; const n = Math.round(half * 2 / 10); for (let i = 0; i < n; i++) d += ` q${(half / n).toFixed(1)} 5 ${(half * 2 / n).toFixed(1)} 0`; return d; }).join(' ');
  const ear = (x, rot) => `<g transform="rotate(${rot} ${x} 94)"><path d="M${x - 7} 94 C${x - 10} 60 ${x - 4} 46 ${x} 46 C${x + 4} 46 ${x + 10} 60 ${x + 7} 94 Z"/><path d="M${x - 3} 90 C${x - 5} 66 ${x - 2} 56 ${x} 56 C${x + 2} 56 ${x + 5} 66 ${x + 3} 90 Z" stroke-width=".8"/></g>`;
  const earFill = (x, rot) => `<g transform="rotate(${rot} ${x} 94)">${crayon([['paper', `M${x - 7} 94 C${x - 10} 60 ${x - 4} 46 ${x} 46 C${x + 4} 46 ${x + 10} 60 ${x + 7} 94 Z`], ['pink', `M${x - 3} 90 C${x - 5} 66 ${x - 2} 56 ${x} 56 C${x + 2} 56 ${x + 5} 66 ${x + 3} 90 Z`]])}</g>`;
  const timber = 'M74 150 V300 M196 150 V300 M74 196 H196 M74 160 L96 196 M196 160 L174 196';
  const win = pane(86, 206, 36, 32, 2, 2);
  const heartWin = 'M135 132 c-4 -6 -12 -2 0 8 c12 -10 4 -14 0 -8 Z';
  const door = `M140 ${G} V244 Q140 222 160 222 Q180 222 180 244 V${G} Z`;
  const glassH = 'M204 300 V178 Q252 122 300 178 V300 Z';
  const gx = (x0, x1, step) => { let d = ''; for (let x = x0 + step; x < x1; x += step) d += `M${x} ${x < 245 ? 176 - (x - 210) * 0.9 : 176 - (280 - x) * 0.9} V300 `; return d; };
  const flowersIn = bush([[214, 288, 9], [230, 280, 12], [250, 284, 11], [270, 280, 12], [288, 288, 9], [222, 262, 9], [252, 258, 10], [282, 262, 9]]);
  const blooms = [[212, 282, 'pink'], [226, 272, 'custard'], [240, 278, 'pink'], [252, 270, 'shu'], [264, 276, 'custard'], [276, 272, 'pink'], [290, 282, 'shu'], [220, 254, 'shu'], [246, 250, 'pink'], [258, 254, 'custard'], [284, 256, 'pink']];
  const arch = 'M14 300 V236 Q38 204 62 236 V300';
  const archRoses = bush([[16, 240, 6], [22, 226, 7], [34, 216, 7], [48, 218, 7], [58, 230, 6], [62, 246, 5], [14, 258, 5]]);
  const roseDots = dots([[18, 236], [26, 222], [40, 214], [52, 222], [60, 238], [14, 252]], 2.6);
  const bunting = 'M196 156 Q248 178 304 164';
  const flags = [210, 230, 250, 270, 290].map((x, i) => { const y = 158 + Math.sin((x - 196) / 108 * Math.PI) * 14; return `M${x - 5} ${y} L${x + 5} ${y + 1} L${x} ${y + 11} Z`; });
  const cakeStand = 'M320 288 V236 M308 270 h24 M312 254 h16 M315 240 h10';
  const treats = 'M310 270 q3 -6 6 0 Z M318 270 q3 -6 6 0 Z M326 270 q3 -6 6 0 Z M313 254 q3 -5 6 0 Z M321 254 q3 -5 6 0 Z M316 240 q4 -6 8 0 Z';
  const teapot = 'M290 270 q0 -10 9 -10 q9 0 9 10 Z';
  const rabbit = (x) => ({ fills: [['paper', `M${x - 7} ${G} q-3 -18 7 -22 q10 4 7 22 Z M${x - 6} ${G - 22} a7 7 0 1 0 12 0 a7 7 0 1 0 -12 0 Z M${x - 5} ${G - 27} q-4 -18 1 -20 q4 4 2 19 Z M${x + 2} ${G - 28} q1 -18 6 -18 q3 6 -3 18 Z`], ['shu', `M${x - 6} ${G - 18} h12 v8 h-12 Z`], ['custard', `M${x + 7} ${G - 13} a4 4 0 1 0 .1 0 Z`]],
    lines: `<path d="M${x - 7} ${G} q-3 -18 7 -22 q10 4 7 22 M${x - 6} ${G - 22} a7 7 0 1 0 12 0 a7 7 0 1 0 -12 0 M${x - 5} ${G - 27} q-4 -18 1 -20 q4 4 2 19 M${x + 2} ${G - 28} q1 -18 6 -18 q3 6 -3 18" stroke-width="1"/>
      <path d="M${x - 6} ${G - 18} h12 v8 h-12 Z" stroke-width=".8"/><path d="M${x + 7} ${G - 13} a4 4 0 1 0 .1 0 M${x + 7} ${G - 17} v-3" stroke-width=".8"/><path d="M${x - 2} ${G - 23} h0.1 M${x + 3} ${G - 23} h0.1" stroke-width="1.8"/>` });
  const rb = rabbit(58);
  const groundFlowers = dots([[90, 296], [100, 293], [110, 297], [196, 296], [204, 292], [342, 296], [352, 293]], 2.4);
  return wrap(`
    ${earFill(116, -12)}${earFill(154, 12)}${ear(116, -12)}${ear(154, 12)}
    ${crayon([
      ['pink', roof],
      ['tile', 'M176 104 h12 v-22 h-12 Z'],
      ['paper', `M74 150 H196 V${G} H74 Z`],
      ['wood', 'M90 158 H180 V176 H90 Z'],
      ['skysoft', `${win.fill} ${glassH}`],
      ['pink', heartWin],
      ['leaf', door],
    ])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="M176 104 V82 H188 V92" stroke-width="1.2"/><path d="M182 78 q-6 -6 0 -10 q6 -6 0 -10" stroke-width="1" opacity=".5"/><path d="M186 56 c-2 -3 -6 -1 0 4 c6 -5 2 -7 0 -4 Z" stroke-width=".8" opacity=".6"/>
    <path d="${roof}"/><path d="${shingles}" stroke-width=".6" opacity=".55"/>
    <path d="${heartWin}" stroke-width="1"/>
    <path d="M74 150 V${G} M196 150 V${G}"/><path d="${timber}" stroke-width="1" opacity=".7"/>
    <path d="M90 158 H180 V176 H90 Z"/>
    ${win.lines}<path d="M82 238 H126 V246 H82 Z" stroke-width="1"/>${blob(bush([[88, 236, 5], [100, 234, 6], [112, 236, 5], [122, 235, 4]]), 'leaf', 1.3)}${crayon([['pink', dots([[90, 232], [104, 230], [118, 232]], 2.2)]], 0, 0)}
    <path d="${door}"/><path d="M160 236 c-3 -4 -8 0 0 6 c8 -6 3 -10 0 -6 Z" class="glow" stroke-width=".8"/><path d="M172 266 a2 2 0 1 0 .1 0" stroke-width="1.4"/>
    <path d="M136 ${G} h48" stroke-width="1.4"/>${lamp(132, 226)}
    <path d="${glassH}"/><clipPath id="bun-glass"><path d="${glassH}"/></clipPath><g clip-path="url(#bun-glass)"><path d="${Array.from({ length: 7 }, (_, i) => `M${216 + i * 12} 120 V300`).join(' ')} M204 216 H300 M204 254 H300 M204 178 Q252 150 300 178" stroke-width=".6"/></g><path d="M252 150 v-10" stroke-width="1.2"/><path d="M249 137 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" class="glow"/>
    ${blob(flowersIn, 'leaf', 1.6)}${crayon(blooms.map(([x, y, c]) => [c, dots([[x, y]], 3)]), 0, 0)}
    <path d="M228 176 v16 M252 160 v20 M276 176 v16" stroke-width=".7"/>${blob(bush([[228, 196, 6], [252, 184, 6], [276, 196, 6]]), 'leaf', 1.2)}
    <path d="${bunting}" stroke-width=".8"/>${crayon([['pink', flags[0] + flags[2] + flags[4]], ['custard', flags[1] + flags[3]]])}<path d="${flags.join(' ')}" stroke-width=".7"/>
    <path d="${arch}" stroke-width="2.4"/>${blob(archRoses, 'leaf', 1.6)}${crayon([['pink', roseDots]], 0, 0)}
    ${crayon([['paper', 'M292 272 H350 L346 282 H296 Z'], ['pink', `${teapot} M336 272 h8 v-6 h-8 Z`], ['custard', treats]])}
    <path d="M292 272 H350 L346 282 H296 Z" stroke-width="1"/><path d="M296 282 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0" stroke-width=".6"/><path d="M300 282 V${G} M342 282 V${G}" stroke-width="1"/>
    <path d="${cakeStand}" stroke-width="1"/><path d="${treats}" stroke-width=".7"/>
    <path d="${teapot}" stroke-width="1"/><path d="M308 266 q6 -2 6 -8 M290 266 q-5 0 -5 4 M297 260 h4" stroke-width=".9"/><path d="M336 272 h8 v-6 h-8 Z M344 268 q3 0 3 2" stroke-width=".8"/>
    <path d="M354 ${G} l2 -14 h6 M356 ${G - 14} v-10 M286 ${G} l-2 -14 h-6" stroke-width="1"/>
    ${crayon(rb.fills)}${rb.lines}
    ${crayon([['pink', groundFlowers]], 0, 0)}
    ${mascotAt(14, G - 33)}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}
// 兔子仙境 2：圆鼓鼓的粉色童话小屋（屋顶竖着兔耳、阁楼圆窗、歪烟囱冒心形烟），奶油墙、圆门、两扇圆窗配花箱；
// 右边一间带穹顶的维多利亚玻璃花房，穹顶下嵌着一只大怀表，里面开满花；两栋之间挂一串扑克牌小旗；
// 门前黑白棋盘小路，花房前一张下午茶桌（三层点心架、茶壶、茶杯、两把椅子），白兔举着怀表；左边一丛修成兔子形状的树篱、红白玫瑰和小蘑菇
function bunnyWonderland() {
  const W = 432, G = 318;
  const roof = 'M78 178 C76 126 116 80 160 78 C204 80 244 126 242 178 Q160 168 78 178 Z';
  const scal = Array.from({ length: 4 }, (_, r) => { const y = 112 + r * 16, half = 46 + r * 16; let d = `M${160 - half} ${y}`; const n = Math.round(half / 6); for (let i = 0; i < n; i++) d += ` q${(half / n).toFixed(1)} 5 ${(half * 2 / n).toFixed(1)} 0`; return d; }).join(' ');
  const ear = (x, rot) => [`M${x - 8} 90 C${x - 12} 50 ${x - 4} 34 ${x} 34 C${x + 4} 34 ${x + 12} 50 ${x + 8} 90 Z`, `M${x - 3.5} 84 C${x - 6} 58 ${x - 2} 46 ${x} 46 C${x + 2} 46 ${x + 6} 58 ${x + 3.5} 84 Z`, `rotate(${rot} ${x} 90)`];
  const e1 = ear(138, -14), e2 = ear(182, 14);
  const walls = `M90 176 L94 ${G} H226 L230 176 Z`;
  const round = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  const door = `M142 ${G} V256 Q142 230 160 230 Q178 230 178 256 V${G} Z`;
  const attic = round(160, 118, 12);
  const box = (x) => `M${x - 18} 268 H${x + 18} V276 H${x - 18} Z`;
  const boxLeaf = bush([[104, 266, 5], [114, 264, 6], [124, 266, 5], [196, 266, 5], [206, 264, 6], [216, 266, 5]]);
  const chimney = 'M206 104 L212 70 H226 L222 112 Z';
  // 花房
  const gh = 'M246 318 V196 H346 V318 Z';
  const dome = 'M246 196 C246 150 270 128 296 128 C322 128 346 150 346 196 Z';
  const ribs = 'M296 128 V196 M271 140 Q262 164 262 196 M321 140 Q330 164 330 196';
  const ghBars = Array.from({ length: 7 }, (_, i) => `M${258 + i * 13} 196 V318`).join(' ') + ' M246 236 H346 M246 276 H346';
  const flw = bush([[256, 306, 10], [272, 298, 12], [292, 304, 11], [312, 298, 12], [332, 304, 11], [262, 280, 8], [300, 278, 9], [336, 282, 8]]);
  const blooms = [[252, 300, 'pink'], [266, 290, 'shu'], [278, 298, 'custard'], [292, 294, 'pink'], [306, 290, 'paper'], [320, 296, 'shu'], [334, 300, 'pink'], [262, 274, 'custard'], [298, 272, 'pink'], [338, 276, 'shu']];
  // 扑克牌小旗
  const card = (x, y, suit) => `<g transform="translate(${x} ${y}) rotate(${(x % 3) * 4 - 4})"><path d="M-6 0 h12 v16 h-12 Z" class="f-paper"/><path d="${suit === 'h' ? 'M0 6 c-2 -3 -6 0 0 5 c6 -5 2 -8 0 -5 Z' : 'M0 4 c-4 4 -5 7 -2 8 h4 c3 -1 2 -4 -2 -8 Z M-1 11 h2 l1 3 h-4 Z'}" class="${suit === 'h' ? 'f-shu' : 'f-choco'}" stroke-width=".5"/></g>`;
  const cardLine = 'M226 160 Q262 186 300 148';
  // 下午茶
  const tbl = 'M254 296 H330 L326 304 H258 Z';
  const stand = 'M292 296 V258 M280 284 h24 M284 270 h16 M287 260 h10';
  const treats = 'M282 284 q3 -6 6 0 Z M290 284 q3 -6 6 0 Z M298 284 q3 -6 6 0 Z M285 270 q3 -5 6 0 Z M293 270 q3 -5 6 0 Z M288 260 q4 -6 8 0 Z';
  const pot = 'M262 296 q0 -12 10 -12 q10 0 10 12 Z';
  const cups = 'M310 296 h8 v-6 h-8 Z M320 296 h8 v-6 h-8 Z';
  // 兔子树篱
  const hedge = 'M18 318 C10 300 14 270 36 266 C58 270 62 300 54 318 Z M24 268 C20 240 26 226 30 226 C34 226 36 244 32 268 Z M40 268 C38 240 44 228 48 228 C52 230 50 250 44 268 Z';
  const rose = bush([[72, 306, 8], [84, 300, 9], [96, 306, 7]]);
  const rabbit = (x) => ({ fills: [['paper', `M${x - 7} ${G} q-3 -18 7 -22 q10 4 7 22 Z M${x - 6} ${G - 22} a7 7 0 1 0 12 0 a7 7 0 1 0 -12 0 Z M${x - 5} ${G - 27} q-4 -18 1 -20 q4 4 2 19 Z M${x + 2} ${G - 28} q1 -18 6 -18 q3 6 -3 18 Z`], ['shu', `M${x - 6} ${G - 18} h12 v8 h-12 Z`], ['custard', `M${x + 7} ${G - 13} a4 4 0 1 0 .1 0 Z`]],
    lines: `<path d="M${x - 7} ${G} q-3 -18 7 -22 q10 4 7 22 M${x - 6} ${G - 22} a7 7 0 1 0 12 0 a7 7 0 1 0 -12 0 M${x - 5} ${G - 27} q-4 -18 1 -20 q4 4 2 19 M${x + 2} ${G - 28} q1 -18 6 -18 q3 6 -3 18" stroke-width="1"/>
      <path d="M${x - 6} ${G - 18} h12 v8 h-12 Z" stroke-width=".8"/><path d="M${x + 7} ${G - 13} a4 4 0 1 0 .1 0 M${x + 7} ${G - 17} v-3" stroke-width=".8"/><path d="M${x - 2} ${G - 23} h0.1 M${x + 3} ${G - 23} h0.1" stroke-width="1.8"/>` });
  const rb = rabbit(236);
  const checker = Array.from({ length: 8 }, (_, i) => `M${130 + i * 7.5} ${G - 5} h7.5 v5 h-7.5 Z`);
  const mush = (x, w, h) => `M${x - w} ${G - h} Q${x} ${G - h - w} ${x + w} ${G - h} Z`;
  return wrap(`
    <g transform="${e1[2]}">${crayon([['paper', e1[0]], ['pink', e1[1]]])}<path d="${e1[0]}"/><path d="${e1[1]}" stroke-width=".8"/></g>
    <g transform="${e2[2]}">${crayon([['paper', e2[0]], ['pink', e2[1]]])}<path d="${e2[0]}"/><path d="${e2[1]}" stroke-width=".8"/></g>
    ${crayon([['tile', chimney]])}<path d="${chimney}"/><path d="M208 70 h20" stroke-width="1.4"/><path d="M220 64 q-6 -6 0 -12 q6 -6 0 -12" stroke-width="1" opacity=".5"/><path d="M222 34 c-2 -3 -7 -1 0 5 c7 -6 2 -8 0 -5 Z" stroke-width=".9" opacity=".7"/>
    ${crayon([['pink', roof], ['skysoft', attic], ['paper', walls]])}
    <path d="M4 ${G} Q${W / 2} ${G + 2} ${W - 4} ${G - 1}"/>
    <path d="${roof}"/><clipPath id="bw-roof"><path d="${roof}"/></clipPath><path d="${scal}" stroke-width=".6" opacity=".55" clip-path="url(#bw-roof)"/>
    <path d="${attic}"/><path d="M160 106 V130 M148 118 H172" stroke-width=".8"/><path d="M160 116 c-2 -3 -6 0 0 5 c6 -5 2 -8 0 -5 Z" class="f-pink" stroke-width=".6"/>
    <path d="${walls}"/><path d="M94 196 Q160 188 226 196" stroke-width=".7" opacity=".5"/>
    ${crayon([['wood', 'M96 180 H224 V196 H96 Z']])}<path d="M96 180 H224 V196 H96 Z"/><path d="M104 176 v4 M216 176 v4" stroke-width="1"/>
    ${crayon([['skysoft', `${round(114, 244, 16)} ${round(206, 244, 16)}`]])}<path d="${round(114, 244, 16)} ${round(206, 244, 16)} M114 228 V260 M98 244 H130 M206 228 V260 M190 244 H222" stroke-width="1"/>
    ${crayon([['wood', `${box(114)} ${box(206)}`]])}<path d="${box(114)} ${box(206)}" stroke-width=".9"/>${blob(boxLeaf, 'leaf', 1.3)}${crayon([['pink', dots([[106, 262], [116, 259], [126, 262], [198, 262], [208, 259], [218, 262]], 2.3)]], 0, 0)}
    ${crayon([['sky', door]])}<path d="${door}"/><path d="M160 246 c-3 -4 -8 0 0 6 c8 -6 3 -10 0 -6 Z" class="glow" stroke-width=".8"/><path d="M172 284 a2 2 0 1 0 .1 0" stroke-width="1.4"/>
    ${lamp(136, 236)}${lamp(184, 236)}
    ${crayon([['choco', checker.filter((_, i) => i % 2 === 0).join(' ')]])}<path d="${checker.join(' ')}" stroke-width=".5"/>
    ${crayon([['skysoft', `${gh} ${dome}`]])}
    <path d="${dome}"/><path d="${ribs}" stroke-width=".8"/><path d="M296 128 v-12" stroke-width="1.2"/><path d="M293 113 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" class="glow"/>
    ${crayon([['custard', round(296, 172, 13)], ['paper', round(296, 172, 10)]])}<path d="${round(296, 172, 13)}"/><path d="M296 162 V172 L302 176" stroke-width="1.2"/><path d="M296 159 v-3" stroke-width="1.6"/>
    <path d="${gh}"/><path d="${ghBars}" stroke-width=".6"/><path d="M242 196 H350" stroke-width="1.4"/>
    <path d="M268 196 v14 M296 196 v18 M324 196 v14" stroke-width=".7"/>${blob(bush([[268, 214, 6], [296, 218, 7], [324, 214, 6]]), 'leaf', 1.2)}
    ${blob(flw, 'leaf', 1.6)}${crayon(blooms.map(([x, y, c]) => [c, dots([[x, y]], 3.2)]), 0, 0)}
    <path d="${cardLine}" stroke-width=".7"/>${card(234, 166, 'h')}${card(248, 172, 's')}${card(262, 172, 'h')}${card(276, 166, 's')}
    <g transform="translate(96 0)">
    ${crayon([['paper', tbl], ['pink', pot], ['custard', treats], ['paper', cups]])}
    <path d="${tbl}" stroke-width="1"/><path d="M258 304 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0" stroke-width=".5"/><path d="M262 304 V${G} M322 304 V${G}" stroke-width="1"/>
    <path d="${stand}" stroke-width="1"/><path d="${treats}" stroke-width=".6"/><path d="${pot}" stroke-width="1"/><path d="M282 290 q6 -2 6 -8 M262 290 q-5 0 -5 4 M270 284 h4" stroke-width=".9"/><path d="${cups}" stroke-width=".8"/>
    <path d="M244 ${G} l-2 -16 h8 M242 ${G - 16} v-10 M336 ${G} l2 -16 h-8 M338 ${G - 16} v-10" stroke-width="1"/>
    </g>
    ${blob(hedge, 'leaf', 2)}<path d="M33 286 h.1 M41 286 h.1" stroke-width="2"/>
    ${blob(rose, 'leaf', 1.5)}${crayon([['shu', dots([[70, 300], [86, 294], [96, 302]], 3)], ['paper', dots([[78, 306], [90, 302]], 3)]], 0, 0)}
    ${crayon([['shu', `${mush(66, 7, 8)} ${mush(424, 6, 8)}`], ['paper', `M64 ${G} V${G - 8} H68 V${G} Z M422 ${G} V${G - 10} H410 V${G} Z`]])}<path d="${mush(66, 7, 8)} M64 ${G} V${G - 8} H68 V${G} ${mush(408, 9, 10)} M406 ${G} V${G - 10} H410 V${G}" stroke-width=".9"/>
    ${crayon(rb.fills)}${rb.lines}
    ${mascotAt(96, G - 33).replace('translate(96', 'translate(96')}
  `, `0 0 ${W} ${G + 12}`, 'store', 1.5);
}
// 巧克力面包工厂（借巧克力工厂的感觉，不画任何电影角色/商标）：红砖大楼、几根冒彩色烟的烟囱、玻璃穹顶；
// 红白条纹管道绕着楼、传送带从窗口送出一排面包；侧面巧克力瀑布流成一条巧克力河，河上糖果条纹小桥；
// 前面是糖果花园：大棒棒糖树、拐杖糖栏杆、软糖蘑菇；巧克力板大门、门口一张金色入场券，空中挂着一部玻璃电梯
function chocoFactory() {
  const W = 420, G = 320;
  const body = 'M120 120 H300 V320 H120 Z';
  const wing = 'M300 168 H372 V320 H300 Z';
  const dome = 'M168 120 C168 92 186 76 210 76 C234 76 252 92 252 120 Z';
  const chim = [[136, 52, 'pink'], [278, 40, 'leaf'], [352, 104, 'custard']];
  const puff = (x, y, c) => [c, bush([[x, y, 9], [x + 10, y - 12, 11], [x - 4, y - 26, 10], [x + 8, y - 38, 8]])];
  const rows = [[136, 140], [136, 186], [262, 140], [262, 186]].map(([x, y]) => pane(x, y, 26, 30, 2, 2, true));
  const wingWins = [[310, 184], [342, 184], [310, 230], [342, 230]].map(([x, y]) => pane(x, y, 20, 26, 2, 2));
  const door = 'M184 320 V262 Q184 246 210 246 Q236 246 236 262 V320 Z';
  const doorGrid = 'M197 250 V320 M210 246 V320 M223 250 V320 M184 274 H236 M184 296 H236';
  const pipe = 'M300 140 H322 Q334 140 334 152 V160';
  const pipeStripes = 'M306 135 v10 M314 135 v10 M329 150 h10';
  const belt = 'M120 176 H62 V184 H120 Z';
  const beltBreads = [68, 84, 100].map((x) => `M${x} 176 c0 -7 4 -10 6 -10 c2 0 6 3 6 10 Z`).join(' ');
  const fall = 'M392 226 Q390 260 394 292 Q396 300 404 302 H408 Q402 296 402 286 Q400 256 404 226 Z';
  const river = `M300 ${G} Q306 300 340 298 Q420 294 480 300 V${G} Z`;
  const bridge = 'M330 320 Q352 290 374 320';
  const lolli = (x, h, r, c) => ({ stick: `M${x} ${G} V${G - h}`, top: `M${x - r} ${G - h} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`, swirl: `M${x} ${G - h} m-${r * .6} 0 a${r * .6} ${r * .6} 0 1 1 ${r * .6} ${r * .6} a${r * .35} ${r * .35} 0 1 1 ${-r * .3} ${-r * .55}`, c });
  const L = [lolli(52, 96, 20, 'pink'), lolli(86, 70, 14, 'custard'), lolli(108, 50, 10, 'leaf')];
  const cane = (x) => `M${x} ${G} V${G - 26} q0 -8 7 -8 q7 0 7 6`;
  const gummy = (x, c) => [c, `M${x - 8} ${G} q-1 -10 8 -12 q9 2 8 12 Z`];
  const elevator = 'M44 116 h28 v32 h-28 Z';
  const ticket = 'M197 306 h26 v12 h-26 Z';
  return wrap(`
    ${chim.map(([x, y, c]) => { const [cc, d] = puff(x + 8, y - 6, c); return blob(d, cc, 1.6); }).join('')}
    ${chim.map(([x, y]) => `<path d="M${x} ${x === 352 ? 168 : 120} V${y} H${x + 16} V${x === 352 ? 168 : 120}"/>`).join('')}${crayon(chim.map(([x, y]) => ['shu', `M${x} ${x === 352 ? 168 : 120} V${y} H${x + 16} V${x === 352 ? 168 : 120} Z`]))}
    ${chim.map(([x, y]) => `<path d="M${x - 3} ${y} H${x + 19}" stroke-width="2"/>`).join('')}
    ${crayon([['skysoft', dome], ['shu', `${body} ${wing}`], ['tile', 'M114 120 H306 V112 H114 Z M296 168 H376 V160 H296 Z']])}
    <path d="M-96 ${G} H${W + 56}"/>
    <path d="${dome}"/><path d="M210 76 V120 M189 82 Q182 100 182 120 M231 82 Q238 100 238 120 M168 104 H252" stroke-width=".7"/><path d="M210 76 v-10" stroke-width="1.2"/><path d="M207 63 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" class="glow"/>
    <path d="M114 112 H306 V120 H114 Z M296 160 H376 V168 H296 Z" stroke-width="1"/>
    <path d="${body} ${wing}"/>${bricks(120, 300, 120, G, 9)}${bricks(300, 372, 168, G, 9)}
    ${crayon([['custard', rows.map((r) => r.fill).join(' ')], ['custard', wingWins.map((r) => r.fill).join(' ')]])}${rows.map((r) => r.lines).join('')}${wingWins.map((r) => r.lines).join('')}
    ${crayon([['paper', 'M150 226 H270 V242 H150 Z']])}<path d="M150 226 H270 V242 H150 Z"/>
    ${crayon([['choco', door]])}<path d="${door}"/><path d="${doorGrid}" stroke-width=".8"/><path d="M180 246 H240" stroke-width="1.6"/>
    ${crayon([['custard', ticket]])}<path d="${ticket}" stroke-width=".9"/><path d="M201 312 h18" stroke-width=".6" stroke-dasharray="1.5 1.5"/>
    <path d="${pipe}" stroke-width="9"/><path d="${pipe}" stroke="#fffcf5" stroke-width="6"/><path d="${pipeStripes}" stroke="#c4513a" stroke-width="3"/>
    <path d="M372 214 H392 Q398 214 398 222 V226" stroke-width="8"/><path d="M372 214 H392 Q398 214 398 222 V226" stroke="#fffcf5" stroke-width="5"/><path d="M378 210 v8 M386 210 v8" stroke="#c4513a" stroke-width="2.6"/>
    ${crayon([['wood', belt], ['crust', beltBreads]])}<path d="${belt}"/><path d="M66 188 a4 4 0 1 0 .1 0 M114 188 a4 4 0 1 0 .1 0" stroke-width="1"/><path d="${beltBreads}" stroke-width=".9"/><path d="M66 192 L60 214 M66 192 L72 214" stroke-width=".8"/>
    ${crayon([['choco', fall], ['choco', river]])}<path d="${fall}" stroke-width="1.1"/><path d="M397 236 v40" stroke="#e8c9a8" stroke-width=".8" opacity=".8"/><path d="${river}" stroke-width="1.1"/><path d="M326 310 q6 -3 12 0 M356 308 q6 -3 12 0 M386 310 q6 -3 12 0 M446 306 q6 -3 12 0 M466 312 q6 -3 12 0" stroke="#e8c9a8" stroke-width=".8"/>
    ${crayon([['pink', 'M408 304 Q412 316 440 316 Q468 316 472 304 Z'], ['paper', 'M428 304 V282 L452 298 Z'], ['custard', 'M418 306 h4 v-4 h-4 Z M456 306 h4 v-4 h-4 Z']])}
    <path d="M408 304 Q412 316 440 316 Q468 316 472 304 Z"/><path d="M412 308 Q440 312 468 308" stroke="#fffcf5" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M428 304 V276 M428 282 L452 298 H428" stroke-width="1.1"/><path d="M428 276 l8 3 l-8 3" class="f-shu" stroke-width=".8"/>
    <path d="M472 304 q8 -2 8 -10 q0 -6 -6 -6 q-4 0 -4 4" stroke-width="1.6"/><path d="M400 310 q-6 -2 -8 2" stroke-width=".8"/>
    <path d="${bridge}" stroke-width="5"/><path d="${bridge}" stroke="#fffcf5" stroke-width="3"/><path d="${bridge}" stroke="#e48a9a" stroke-width="3" stroke-dasharray="3 3"/>
    ${L.map((l) => `<path d="${l.stick}" stroke-width="2.2"/>`).join('')}${crayon(L.map((l) => [l.c, l.top]))}${L.map((l) => `<path d="${l.top}"/><path d="${l.swirl}" stroke-width="1" />`).join('')}
    <path d="${[244, 260, 276, 292].map(cane).join(' ')}" stroke-width="3.6"/><path d="${[244, 260, 276, 292].map(cane).join(' ')}" stroke="#fffcf5" stroke-width="2.2"/><path d="${[244, 260, 276, 292].map(cane).join(' ')}" stroke="#c4513a" stroke-width="2.2" stroke-dasharray="2.5 2.5"/>
    ${crayon([gummy(130, 'pink'), gummy(146, 'leaf'), gummy(162, 'custard')])}<path d="M122 ${G} q-1 -10 8 -12 q9 2 8 12 M138 ${G} q-1 -10 8 -12 q9 2 8 12 M154 ${G} q-1 -10 8 -12 q9 2 8 12" stroke-width="1"/>
    <path d="M-28 0 V54 M-6 0 V54" stroke-width=".8"/>
    ${crayon([['skysoft', 'M-40 54 H6 V96 H-40 Z'], ['custard', 'M-40 50 H6 V56 H-40 Z M-40 96 H6 V100 H-40 Z']])}
    <path d="M-40 54 H6 V96 H-40 Z M-40 50 H6 V56 H-40 Z M-40 96 H6 V100 H-40 Z"/><path d="M-17 56 V96 M-40 76 H6" stroke-width=".7"/>
    <path d="M-30 96 v-14 a4 4 0 1 1 6 0 v14 M-12 96 v-12 a4 4 0 1 1 6 0 v12" stroke-width=".9"/>
    <path d="M-44 70 l-8 -2 M-44 80 l-10 0 M10 70 l8 -2 M10 80 l10 0" stroke-width=".8" opacity=".6"/>
    ${(() => {
      const L2 = [lolli(-52, 80, 16, 'sky'), lolli(-20, 58, 12, 'shu'), lolli(14, 72, 13, 'pink')];
      const cup = (x, cc) => `<path d="M${x - 9} ${G} L${x - 11} ${G - 14} H${x + 11} L${x + 9} ${G} Z" class="f-wood"/>${crayon([[cc, `M${x - 13} ${G - 14} q0 -12 13 -14 q13 2 13 14 Z`]])}<path d="M${x - 9} ${G} L${x - 11} ${G - 14} H${x + 11} L${x + 9} ${G} Z M${x - 13} ${G - 14} q0 -12 13 -14 q13 2 13 14" stroke-width="1"/><path d="M${x - 5} ${G} V${G - 13} M${x} ${G} V${G - 13} M${x + 5} ${G} V${G - 13}" stroke-width=".6"/><path d="M${x} ${G - 30} a2.6 2.6 0 1 0 .1 0" class="f-shu" stroke-width=".8"/>`;
      const swirlCandy = (x, y) => `${crayon([['custard', `M${x - 9} ${y} a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z`]])}<path d="M${x - 9} ${y} a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M${x} ${y} m-5 0 a5 5 0 1 1 5 5 a3 3 0 1 1 -2 -4" stroke-width=".9"/><path d="M${x - 9} ${y} l-6 -5 v10 Z M${x + 9} ${y} l6 -5 v10 Z" class="f-pink" stroke-width=".9"/>`;
      const fence = Array.from({ length: 7 }, (_, i) => `M${-64 + i * 9} ${G} V${G - 22} q0 -5 4 -5`).join(' ');
      return `${L2.map((l) => `<path d="${l.stick}" stroke-width="2.2"/>`).join('')}${crayon(L2.map((l) => [l.c, l.top]))}${L2.map((l) => `<path d="${l.top}"/><path d="${l.swirl}" stroke-width="1"/>`).join('')}
        <path d="${fence}" stroke-width="3.4"/><path d="${fence}" stroke="#fffcf5" stroke-width="2"/><path d="${fence}" stroke="#7fae8a" stroke-width="2" stroke-dasharray="2.5 2.5"/><path d="M-66 ${G - 12} H0" stroke-width="1.6"/>
        ${cup(-4, 'pink')}${swirlCandy(-40, G - 36)}
        ${blob(bush([[-80, G - 10, 10], [-90, G - 22, 8], [-70, G - 24, 9]]), 'pink', 1.6)}${crayon([['paper', dots([[-84, G - 18], [-74, G - 26], [-78, G - 10]], 2.2)]], 0, 0)}`;
    })()}
    ${mascotAt(22, G - 33)}
  `, `-100 0 ${W + 160} ${G + 12}`, 'store', 1.5);
}
// Lv12 巴黎甜品沙龙：奥斯曼风格的石头楼——灰蓝色孟莎屋顶和老虎窗、铸铁小阳台，一楼是藏青门面、拱形橱窗里的蛋糕架
function patisserie() {
  // 奥斯曼式公寓楼：孟莎屋顶 + 牛眼老虎窗、齿状檐口、壁柱和柱头、三角/弧形窗楣、花环浮雕、拱心石、
  // 二楼通长铸铁阳台；一楼四根古典柱子分出三个拱，左右是甜点橱窗；街上一根莫里斯广告柱、巴黎路灯、咖啡座，远处一座小铁塔
  const W = 300, G = 340;
  const bays = [80, 140, 200, 260];
  const body = `M50 86 H290 V${G} H50 Z`;
  const roof = 'M44 86 Q50 54 64 40 H276 Q290 54 296 86 Z';
  const oeil = (x) => `M${x - 10} 74 V64 a10 10 0 0 1 20 0 V74 Z`;
  const chimneys = [70, 120, 220, 270].map((x) => `M${x} 40 V30 H${x + 10} V40 Z`).join(' ');
  const pots = [70, 120, 220, 270].map((x) => `M${x + 1} 30 v-4 h3 v4 M${x + 5} 30 v-5 h3 v5`).join(' ');
  const modillions = Array.from({ length: 30 }, (_, i) => `M${52 + i * 8} 92 v4 h3 v-4`).join(' ');
  const w3 = bays.map((x) => pane(x - 12, 106, 24, 40, 2, 3));
  const w2 = bays.map((x) => pane(x - 13, 166, 26, 52, 2, 4));
  const pil = [50, 110, 170, 230, 290].map((x) => `M${x - 3} 98 V232 M${x + 3} 98 V232`).join(' ');
  const caps = [50, 110, 170, 230, 290].map((x) => `M${x - 5} 98 h10 M${x - 5} 160 h10 M${x - 4} 162 q4 3 8 0`).join(' ');
  const pedis = bays.map((x, i) => i % 2 ? `M${x - 17} 162 Q${x} 150 ${x + 17} 162 Z` : `M${x - 17} 162 L${x} 152 L${x + 17} 162 Z`).join(' ');
  const swags = bays.map((x) => `M${x - 12} 102 q6 6 12 0 q6 6 12 0`).join(' ');
  const keys = bays.map((x) => `M${x - 3} 104 h6 l-1 5 h-4 Z`).join(' ');
  const balcony = 'M48 218 H292 M48 230 H292';
  const balusters = Array.from({ length: 31 }, (_, i) => `M${52 + i * 8} 218 v12`).join(' ');
  const scrolls = Array.from({ length: 30 }, (_, i) => `M${54 + i * 8} 224 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0`).join(' ');
  const bal3 = bays.map((x) => `M${x - 15} 140 H${x + 15} M${x - 15} 148 H${x + 15} ${Array.from({ length: 7 }, (_, i) => `M${x - 13 + i * 4.3} 140 v8`).join(' ')}`).join(' ');
  // 一楼
  const cols = [56, 128, 212, 284];
  const colFill = cols.map((x) => `M${x - 5} ${G} V272 H${x + 5} V${G} Z`).join(' ');
  const colLines = cols.map((x) => `M${x - 5} ${G} V272 H${x + 5} V${G} M${x - 7} 272 h14 M${x - 7} 268 h14 M${x - 6} ${G - 4} h12 M${x - 2} 274 V${G - 6} M${x + 2} 274 V${G - 6} M${x - 7} 272 q-2 -3 1 -4 M${x + 7} 272 q2 -3 -1 -4`).join(' ');
  const archWin = (x0, x1) => { const r = (x1 - x0) / 2; return `M${x0} ${G - 6} V${276 + r * .2} A${r} ${r * .8} 0 0 1 ${x1} ${276 + r * .2} V${G - 6} Z`; };
  const wl = archWin(66, 118), wr = archWin(222, 274), dr = archWin(144, 196);
  const archKeys = [92, 170, 248].map((x) => `M${x - 3} ${x === 170 ? 270 : 274} h6 l-1 6 h-4 Z`).join(' ');
  // 街景
  // 远处的埃菲尔铁塔：外轮廓、脚下大拱、两层平台、每段交叉的钢架、塔顶小屋和天线
  const eiffel = 'M-24 340 Q-14 292 -10 240 L-6 170 L-2.4 100 H2.4 L6 170 L10 240 Q14 292 24 340 H15 Q0 282 -15 340 Z';
  const eiffelLines = [
    'M-16 236 H16 V242 H-16 Z M-8 165 H8 V170 H-8 Z M-3.4 96 H3.4 V100 H-3.4 Z M0 96 V82 M-1.6 90 H1.6',
    'M-14 242 v-3 M-10 242 v-3 M-6 242 v-3 M-2 242 v-3 M2 242 v-3 M6 242 v-3 M10 242 v-3 M14 242 v-3',
    'M-19 314 L-8 268 M-8 314 L-12 268 M-11 262 L-4 244 M-4 262 L-9.5 244 M19 314 L8 268 M8 314 L12 268 M11 262 L4 244 M4 262 L9.5 244 M-12 266 H12',
    'M-9 236 L5 214 M-5 214 L9 236 M-7 214 H7 M-7 214 L4 192 M-4 192 L7 214 M-6 192 H6 M-6 192 L3 170 M-3 170 L6 192',
    'M-5 165 L1.5 140 M-1.5 140 L5 165 M-4 140 H4 M-4 140 L1 120 M-1 120 L4 140 M-3 120 H3',
  ].join(' ');
  const morris = 'M326 340 V262 H350 V340 Z';
  const morrisTop = 'M322 262 H354 L350 256 Q338 240 326 256 Z';
  return wrap(`
    <g opacity=".85" transform="translate(2 70) scale(.8)">${crayon([['crust', eiffel]])}<path d="${eiffel}" stroke-width="1.4"/><path d="${eiffelLines}" stroke-width=".8"/></g>
    <path d="${body} ${roof}" class="f-paper" stroke="none"/>
    ${crayon([['tile', roof], ['soft', `M50 86 H290 V240 H50 Z`], ['paper', oeil(140).replace(/Z$/, 'Z ') + oeil(200) + ' ' + oeil(80) + ' ' + oeil(260)], ['tile', chimneys], ['skysoft', [80, 140, 200, 260].map((x) => `M${x - 6} 72 V66 a6 6 0 0 1 12 0 V72 Z`).join(' ')], ['skysoft', [...w2, ...w3].map((w) => w.fill).join(' ')], ['ai', `M50 240 H290 V${G} H50 Z`], ['paper', colFill], ['skysoft', `${wl} ${wr} ${dr}`], ['custard', 'M88 246 H252 V262 H88 Z']])}
    <path d="M4 ${G} H${W + 106}"/>
    <path d="${roof}"/><path d="M60 50 H280 M54 66 H286" stroke-width=".5" opacity=".4"/><path d="${chimneys}" stroke-width="1"/><path d="${pots}" stroke-width=".7"/>${(() => {
      // 屋顶石栏杆：瓶形小柱子 + 压顶，遇到烟囱断开
      const segs = [[64, 70], [80, 120], [130, 220], [230, 270], [280, 276]].filter(([a, b]) => b - a > 4);
      const vase = (c) => `M${c - 1.6} 40 h3.2 q-1.2 -1.2 -.2 -2.4 q1.8 -1.3 .2 -2.8 h-2.8 q-1.6 1.5 .2 2.8 q1 1.2 -.6 2.4 Z`;
      let bal = '', rail = '';
      for (const [a, b] of segs) {
        rail += `M${a} 31.6 H${b} V34.8 H${a} Z `;
        const n = Math.max(1, Math.round((b - a - 2) / 6));
        for (let i = 0; i < n; i++) bal += vase(a + (b - a) * (i + 0.5) / n) + ' ';
      }
      return `${crayon([['soft', `${rail} ${bal}`]])}<path d="${bal}" stroke-width=".6"/><path d="${rail}" stroke-width=".8"/>`;
    })()}
    ${[80, 140, 200, 260].map((x) => `<path d="${oeil(x)}" stroke-width="1"/><path d="M${x - 6} 72 V66 a6 6 0 0 1 12 0 V72 Z M${x} 60 v12" stroke-width=".7"/><path d="M${x - 12} 62 q-3 -6 2 -9 M${x + 12} 62 q3 -6 -2 -9" stroke-width=".7"/>`).join('')}
    <path d="M42 86 H298 V92 H42 Z" stroke-width="1.2"/><path d="${modillions}" stroke-width=".6"/>
    <path d="M50 92 V240 M290 92 V240"/>${stoneCourses(50, 290, 96, 240, 8).replace('opacity=".35"', 'opacity=".22"')}
    <path d="${pil}" stroke-width=".7"/><path d="${caps}" stroke-width=".8"/>
    ${w3.map((w) => w.lines).join('')}${bays.map((x) => curtains(x - 12, 106, 24, 40)).join('')}<path d="${swags}" stroke-width=".8"/>${crayon([['custard', keys]])}<path d="${keys}" stroke-width=".6"/><path d="${bal3}" stroke-width=".7"/>
    ${crayon([['soft', pedis]])}<path d="${pedis}" stroke-width=".9"/>
    ${w2.map((w) => w.lines).join('')}${windowScene(67, 166, 26, 46, 'cup', 'shu')}${windowScene(187, 166, 26, 46, 'book', 'leaf')}${bays.map((x) => curtains(x - 13, 166, 26, 52)).join('')}
    <path d="${bays.map((x) => `M${x - 4} 178 q4 -5 8 0`).join(' ')}" stroke-width=".5" opacity=".5"/>
    <path d="${balcony}" stroke-width="1.1"/><path d="${balusters}" stroke-width=".6"/><path d="${scrolls}" stroke-width=".5"/>
    ${bays.map((x, i) => flowerBox(x - 14, 216, 28, ['pink', 'shu', 'custard', 'pink'][i])).join('')}
    <path d="M44 232 H296 V240 H44 Z" stroke-width="1.2"/><path d="${Array.from({ length: 31 }, (_, i) => `M${48 + i * 8} 240 v3`).join(' ')}" stroke-width=".6"/>
    <path d="M50 240 V${G} M290 240 V${G}"/><path d="M88 246 H252 V262 H88 Z"/><path d="M84 244 H256" stroke-width=".7"/>
    <path d="${wl} ${wr} ${dr}"/>${crayon([['custard', archKeys]])}<path d="${archKeys}" stroke-width=".7"/>
    <path d="M92 ${G - 6} V286 M66 300 H118 M248 ${G - 6} V286 M222 300 H274 M170 ${G - 6} V280 M144 296 H196" stroke-width=".8"/>
    ${display([['cake', 80], ['macarons', 104]], 300)}${display([['tart', 76], ['cupcake', 92], ['eclair', 108]], 330)}
    ${display([['macarons', 236], ['cake', 260]], 300)}${display([['eclair', 236], ['tart', 252], ['cupcake', 268]], 330)}
    ${goldText(92, 282, 'PÂTISSERIE', 5)}${goldText(248, 282, 'CHOCOLAT', 5)}
    <path d="M164 316 v6 M176 316 v6" stroke="#c9913a" stroke-width="1.6"/>
    ${crayon([['paper', colFill]])}<path d="${colLines}" stroke-width=".9"/>
    ${lamp(136, 268)}${lamp(204, 268)}
    ${cafeSet(312, G)}
    ${crayon([['leaf', `${morris} ${morrisTop}`], ['pink', 'M329 272 h9 v16 h-9 Z'], ['custard', 'M340 276 h8 v12 h-8 Z'], ['sky', 'M330 294 h16 v12 h-16 Z']])}
    <path d="${morris} ${morrisTop}" stroke-width="1.1"/><path d="M326 268 H350 M326 312 H350 M338 240 v-6" stroke-width=".8"/><path d="M329 272 h9 v16 h-9 Z M340 276 h8 v12 h-8 Z M330 294 h16 v12 h-16 Z" stroke-width=".6"/>
    <path d="M384 ${G} V240 M378 ${G} h12 M380 ${G - 6} h8" stroke-width="2"/><path d="M384 252 q-10 0 -12 -8 M384 252 q10 0 12 -8" stroke-width="1.1"/>
    <path d="M368 244 h8 l-1 -9 h-6 Z M392 244 h8 l-1 -9 h-6 Z M380 236 h8 l-1 -10 h-6 Z" stroke-width="1"/><path d="M369 243 h6 l-1 -7 h-4 Z M393 243 h6 l-1 -7 h-4 Z M381 235 h6 l-1 -8 h-4 Z" class="glow" stroke="none"/>
    ${chalkboard(37, G, 'CAFÉ', 'CRÊPES')}
    ${mascotAt(-36, G - 33)}
  `, `-40 0 ${W + 150} ${G + 12}`, 'store', 1.5);
}

export const JP_DRAFTS = { london: [londonTearoom, 320, 280], tainan: [tainanShophouse, 330, 280], shanghai: [shanghaiShikumen, 320, 290], vienna: [viennaCafe, 360, 342], paris: [patisserie, 450, 352], oldshop: [oldBakery, 406, 288], kyoto: [kyotoMachiya, 424, 280], choco: [chocoFactory, 580, 332], bunny2: [bunnyWonderland, 432, 330], bunny: [bunnyCottage, 360, 312], alice: [aliceTeapot, 380, 312], kamakura: [kamakuraShop, 380, 312], hokkaido: [hokkaidoBarn, 380, 312], shitamachi: [shitamachiShop, 380, 312], showa: [showaKissa, 320, 280, { x: 52, y: 196, w: 1, h: 1 }], onsen: [onsenBakery, 360, 290], sando: [sandoShop, 360, 290], ginza: [ginzaParlor, 340, 342] };

// 隐藏款的尺寸和招牌位置（招牌上的店名由 HTML 叠上去）
// fit：店名字号按招牌在画里的大小算
const HIDDEN = {
  9: { draw: oldBakery, W: 406, H: 288, sign: { x: 118, y: 168, w: 162, h: 16, fit: true } },
  10: { draw: kamakuraShop, W: 386, H: 312, sign: { x: 122, y: 182, w: 124, h: 14, fit: true } },
  11: { draw: kyotoMachiya, W: 424, H: 280, sign: { x: 150, y: 96, w: 136, h: 28, fit: true } },
  12: { draw: patisserie, W: 450, H: 352, sign: { x: 128, y: 246, w: 164, h: 16, fit: true } },
};
export const MAX_LEVEL = 12;

export function storefront(level = 3, cls = '') {
  const tag = (svg) => svg.replace('class="sk store', `class="sk store ${cls}`);
  if (HIDDEN[level]) return tag(HIDDEN[level].draw());
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

// 打分用的星星：圆胖、尖角是圆的，和面包一样的画法——可可色线条 + 错开一点的金黄蜡笔色块；
// 没点亮的只有淡淡的线稿
const STAR = 'M19.0 6.0 L24.3 14.0 L33.9 15.4 L28.0 23.0 L29.6 32.5 L20.6 29.2 L12.1 33.7 L12.4 24.1 L5.4 17.4 L14.7 14.7 Z';
export function rateStar(on, cls = '') {
  return on
    ? wrap(`${crayon([['crust', STAR]], 1.2, 1.4)}<path d="${STAR}" stroke-width="2.4"/><path d="M15 17 q2 -2 4 -2" stroke-width="1.4" opacity=".5"/>`, '0 0 40 40', `rate-star on ${cls}`)
    : wrap(`<path d="${STAR}" stroke-width="2"/>`, '0 0 40 40', `rate-star ${cls}`);
}

// 出炉印章：和其他图一样的画法——手抖的圈 + 蜡笔颗粒的朱红色块（像盖得不太匀的印泥），不是规整的双线圆
const wobble = (cx, cy, r, amp, seed) => {
  const pts = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const rr = r + Math.sin(a * 3 + seed) * amp + Math.cos(a * 5 + seed * 2) * amp * 0.5;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z`;
};
const HANKO_RING = `${wobble(32, 32, 28, 0.7, 1)} ${wobble(32, 32, 23.5, 0.6, 3)}`;
export function hanko(text, cls = '') {
  const small = text.length > 2;
  return wrap(`
    <path class="f-pink" d="${wobble(32, 32, 24, 0.5, 2)}" stroke="none" opacity=".35" filter="url(#crayon)"/>
    <path class="f-shu hanko-ink" d="${HANKO_RING}" fill-rule="evenodd" stroke="none" filter="url(#crayon)"/>
    <path d="${wobble(32, 32, 29.2, 0.5, 5)}" stroke-width="1.3" opacity=".55"/>
    <text x="32" y="${small ? 36 : 38}" text-anchor="middle" class="sk-text hanko-text" font-size="${small ? 12 : 16}" stroke="none">${text}</text>
  `, '0 0 64 64', `hanko ${cls}`, 1.6);
}

// 首页最下面的小房子：和 app 图标同一栋店（瓦檐、木招牌、藏青暖帘、门口挂着碱水面包），线条跟着主题色
export function houseLogo(cls = '') {
  return `<svg class="sk house-logo ${cls}" viewBox="56 56 410 384" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g class="crayon" transform="translate(6 7)" stroke="none">
      <path class="f-tile" d="M70 196 L96 150 H416 L442 196 Z"/>
      <path class="f-wood" d="M150 84 H362 V132 H150 Z M136 206 H150 V420 H136 Z M362 206 H376 V420 H362 Z"/>
      <path class="f-ai" d="M150 214 H230 V316 H150 Z M240 214 H272 V316 H240 Z M282 214 H362 V316 H282 Z"/>
    </g>
    <path d="M150 84 H362 V132 H150 Z"/><path d="M190 84 L200 66"/><path d="M322 84 L312 66"/>
    <path d="M70 196 L96 150 H416 L442 196"/>
    <path d="M70 196 ${'q9 10 18 0 '.repeat(20)}q9 10 4 0"/>
    <path d="M136 206 H150 V420 H136 Z"/><path d="M362 206 H376 V420 H362 Z"/>
    <path d="M126 210 H386" stroke-width="17"/>
    <path d="M150 214 H230 V316 H150 Z"/><path d="M240 214 H272 V316 H240 Z"/><path d="M282 214 H362 V316 H282 Z"/>
    <path d="M150 326 H362"/><path d="M256 326 V420"/>
    <path d="M150 372 H362 M203 326 V420 M309 326 V420" stroke-width="8"/>
    <path d="M86 424 Q256 432 426 422"/>
    <path d="M376 228 H456 M376 254 L406 228" stroke-width="10"/><path d="M425 228 V268" stroke-width="6"/>
    <g transform="translate(379 249) scale(1.45)">
      <path d="M18 43 C22 36 28 30 32 26 C36 22 40 16 46 16 C54 16 58 24 56 34 C54 46 44 54 32 54 C20 54 10 46 8 34 C6 24 10 16 18 16 C24 16 28 22 32 26 C36 30 42 36 46 43" stroke-width="12"/>
      <path class="pretzel-in" d="M18 43 C22 36 28 30 32 26 C36 22 40 16 46 16 C54 16 58 24 56 34 C54 46 44 54 32 54 C20 54 10 46 8 34 C6 24 10 16 18 16 C24 16 28 22 32 26 C36 30 42 36 46 43" stroke-width="6.5"/>
    </g>
  </svg>`;
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
