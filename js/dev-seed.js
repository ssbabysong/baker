// 开发用：往配方架和作品墙里塞一批假数据，看页面满了以后的样子。
// 只有调试版 App 用启动参数触发（xcrun simctl launch … -seed 50、-seed 100 8（100 款配方、8 个作品）/ -unseed，见 NativeTabs.swift 的 devSeed），正式版不会调用。
// 店铺等级按作品数算：Lv3 要 5–11 个、Lv4 12–24、Lv5 25–44、Lv6 45–69、Lv7 70–99、Lv8 100+
// 每条假数据都带 devSeed: true，unseed() 只删这些，用户自己的数据不动。
import { db, uid, saveRecipe, listRecipes, listBakes, saveBake, deleteBake, randomPrice } from './store.js';

const BREADS = [
  ['北海道吐司', 'toast'], ['全麦吐司', 'toast'], ['黑芝麻吐司', 'toast'], ['抹茶红豆吐司', 'toast'], ['肉松吐司', 'toast'],
  ['原味可颂', 'croissant'], ['巧克力可颂', 'croissant'], ['杏仁可颂', 'croissant'], ['盐可颂', 'shiopan'], ['海盐卷', 'shiopan'],
  ['明太子盐面包', 'shiopan'], ['法式长棍', 'baguette'], ['迷你法棍', 'baguette'], ['蒜香法棍', 'baguette'], ['恰巴塔', 'loaf'],
  ['核桃欧包', 'loaf'], ['蔓越莓乳酪欧包', 'loaf'], ['黑麦欧包', 'loaf'], ['无花果欧包', 'loaf'], ['碱水结', 'pretzel'],
  ['碱水球', 'pretzel'], ['原味贝果', 'bagel'], ['芝麻贝果', 'bagel'], ['蓝莓贝果', 'bagel'], ['菠萝包', 'melonpan'],
  ['抹茶菠萝包', 'melonpan'], ['日式红豆包', 'anpan'], ['奶黄包', 'anpan'], ['巧克力软欧', 'chocobun'], ['可可脏脏包', 'chocobun'],
  ['老式甜甜圈', 'donut'], ['糖霜甜甜圈', 'donut'], ['英式司康', 'scone'], ['红茶司康', 'scone'], ['迷迭香佛卡夏', 'focaccia'],
  ['番茄橄榄佛卡夏', 'focaccia'], ['布里欧修', 'brioche'], ['辫子布里欧修', 'brioche'], ['葡式蛋挞', 'eggtart'], ['港式蛋挞', 'eggtart'],
  ['牛奶餐包', 'rolls'], ['葱香餐包', 'rolls'], ['卡仕达泡芙', 'puff'], ['闪电泡芙', 'puff'], ['巧克力玛芬', 'muffin'],
  ['蓝莓玛芬', 'muffin'], ['黄油曲奇', 'cookie'], ['燕麦曲奇', 'cookie'], ['戚风蛋糕', 'cake'], ['巴斯克芝士蛋糕', 'cake'],
];
// 50 个名字不够用时，拿口味和面包拼新名字（抹茶可颂、黑糖贝果……）
const FLAVORS = ['抹茶', '黑糖', '伯爵茶', '可可', '芝士', '红豆', '蜂蜜', '海盐', '焦糖', '椰香', '咖啡', '柚子', '桂花', '紫薯', '南瓜'];
const BASES = [['可颂', 'croissant'], ['贝果', 'bagel'], ['吐司', 'toast'], ['司康', 'scone'], ['玛芬', 'muffin'], ['餐包', 'rolls'], ['欧包', 'loaf'], ['甜甜圈', 'donut'], ['布里欧修', 'brioche'], ['蛋糕卷', 'cake']];
const MORE = FLAVORS.flatMap((f) => BASES.map(([b, shape]) => [f + b, shape]));
const ALL_BREADS = [...BREADS, ...MORE.filter(([n]) => !BREADS.some(([x]) => x === n))];

const STEPS = [
  ['除黄油外的材料混合揉成团', 15, 'knead'], ['加入黄油揉到能拉出薄膜', 12, 'knead'], ['室温一次发酵到两倍大', 60, 'ferment'],
  ['分割滚圆，盖保鲜膜松弛', 15, 'shape'], ['整形后放进模具', 10, 'shape'], ['二次发酵到八分满', 45, 'ferment'],
  ['表面刷蛋液，撒装饰', 5, 'decorate'], ['预热好的烤箱 180°C 烤', 30, 'bake'], ['出炉震一下，放凉', 10, 'other'],
];
const NOTES = ['这次组织特别软', '颜色烤得有点深，下次降 10 度', '家里人一下子就吃完了', '发酵有点过头', '形状不太圆，味道很好',
  '加了一点蜂蜜，更香', '第一次成功拉出手套膜！', '冷藏一晚再烤，风味更足', '', '', ''];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export async function seed(nRecipes = 50, nBakes = 50) {
  const have = await listRecipes();
  const names = new Set(have.map((r) => r.name));
  const todo = ALL_BREADS.filter(([n]) => !names.has(n)).slice(0, Math.max(0, nRecipes - have.length));
  for (const [name, shape] of todo) {
    const steps = STEPS.slice(0, 5 + Math.floor(Math.random() * 5)).map(([text, minutes, kind]) => ({ text, minutes, kind }));
    const rec = await saveRecipe({
      name, shape, yield: `${4 + Math.floor(Math.random() * 8)} 个`,
      ingredients: [['高筋面粉', 250], ['牛奶', 150], ['细砂糖', 25], ['盐', 3], ['酵母', 3], ['黄油', 20]].map(([n, a]) => ({ name: n, amount: a, unit: 'g' })),
      steps,
      prices: { CNY: randomPrice(shape, 'CNY'), USD: randomPrice(shape, 'USD') },
    });
    await db.put('recipes', { ...rec, devSeed: true });
  }

  const recipes = await listRecipes();
  let bakes = await listBakes();
  // 作品比要的多：从最早的假作品开始删，删到 nBakes 为止（用来切到低等级看效果；用户自己的作品不删）
  for (const b of bakes.filter((x) => x.devSeed).reverse()) {
    if (bakes.length <= nBakes) break;
    await deleteBake(b.id);
    bakes = bakes.filter((x) => x !== b);
  }
  const now = Date.now();
  for (let i = bakes.length; i < nBakes; i++) {
    const r = pick(recipes);
    const finishedAt = now - Math.floor(Math.random() * 90) * 86400000 - Math.floor(Math.random() * 10) * 3600000;
    await saveBake({
      id: uid(), recipeId: r.id, recipeName: r.name, shape: r.shape, snapshot: r, scale: 1,
      changes: [], changeMode: 'none',
      startedAt: finishedAt - (2 + Math.random() * 3) * 3600000, finishedAt,
      photoId: null, rating: 3 + Math.floor(Math.random() * 3), notes: pick(NOTES), devSeed: true,
    });
  }
}

export async function unseed() {
  for (const r of await listRecipes()) if (r.devSeed) await db.del('recipes', r.id);
  for (const b of await listBakes()) if (b.devSeed) await deleteBake(b.id);
}
