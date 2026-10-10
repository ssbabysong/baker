import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDuration, parseIngredient, parseRecipeText, guessStepKind, formatMinutes, parseNumber,
} from '../js/parser.js';

test('parseDuration: 中文与英文时长', () => {
  assert.equal(parseDuration('一次发酵 1.5小时'), 90);
  assert.equal(parseDuration('静置30分钟'), 30);
  assert.equal(parseDuration('冷藏 1小时30分钟'), 90);
  assert.equal(parseDuration('Bake for 25 min'), 25);
  assert.equal(parseDuration('bulk ferment 2 hours'), 120);
  assert.equal(parseDuration('1h30m'), 90);
  assert.equal(parseDuration('半小时'), 30);
  assert.equal(parseDuration('揉 90秒'), 1.5);
});

test('parseDuration: 不把温度和用量当成时间', () => {
  assert.equal(parseDuration('烤箱预热 230°C'), null);
  assert.equal(parseDuration('水 250ml'), null);
  assert.equal(parseDuration('三分之一的面团'), null);
});

test('parseIngredient: 常见写法', () => {
  assert.deepEqual(parseIngredient('高筋面粉 250g'), { name: '高筋面粉', amount: 250, unit: 'g', note: '' });
  assert.deepEqual(parseIngredient('- 水 180 ml'), { name: '水', amount: 180, unit: 'ml', note: '' });
  assert.deepEqual(parseIngredient('黄油 30g（软化）'), { name: '黄油', amount: 30, unit: 'g', note: '软化' });
  assert.deepEqual(parseIngredient('500g T65面粉'), { name: 'T65面粉', amount: 500, unit: 'g', note: '' });
  assert.deepEqual(parseIngredient('酵母 1小勺'), { name: '酵母', amount: 1, unit: '小勺', note: '' });
  assert.deepEqual(parseIngredient('1/2 cup milk'), { name: 'milk', amount: 0.5, unit: 'cup', note: '' });
  assert.deepEqual(parseIngredient('2 eggs'), { name: 'eggs', amount: 2, unit: '', note: '' });
  assert.deepEqual(parseIngredient('盐 适量'), { name: '盐', amount: null, unit: '适量', note: '' });
  assert.equal(parseIngredient('鸡蛋 2个').amount, 2);
});

test('parseRecipeText: 带分区的完整食谱', () => {
  const r = parseRecipeText(`法式乡村面包

材料：
高筋面粉 400g
全麦粉 100g
水 350g
盐 10g
酵母 3g

步骤：
1. 混合面粉和水，静置30分钟
2. 加盐和酵母，揉面10分钟
3. 一次发酵 2小时
4. 整形后二次发酵 45分钟
5. 230°C 烤 35 分钟

备注：水量可以根据面粉调整`);
  assert.equal(r.name, '法式乡村面包');
  assert.equal(r.ingredients.length, 5);
  assert.equal(r.ingredients[2].name, '水');
  assert.equal(r.steps.length, 5);
  assert.deepEqual(r.steps.map((s) => s.minutes), [30, 10, 120, 45, 35]);
  assert.equal(r.steps[2].kind, 'ferment');
  assert.equal(r.steps[4].kind, 'bake');
  assert.match(r.notes, /水量/);
});

test('parseRecipeText: 没有分区标题时自动判断', () => {
  const r = parseRecipeText(`Focaccia
500g bread flour
400 ml water
10 g salt
Mix everything and rest 20 min
Bulk ferment 2 hours with folds
Bake 25 min at 220C`);
  assert.equal(r.name, 'Focaccia');
  assert.equal(r.ingredients.length, 3);
  assert.equal(r.steps.length, 3);
  assert.equal(r.steps[1].minutes, 120);
});

test('parseRecipeText: 一行多个材料', () => {
  const r = parseRecipeText(`贝果\n材料\n面粉 250g、水 140g、盐 4g`);
  assert.equal(r.ingredients.length, 3);
});

test('辅助函数', () => {
  assert.equal(guessStepKind('冷藏一夜'), 'chill');
  assert.equal(formatMinutes(90), '1小时30分钟');
  assert.equal(formatMinutes(1.5), '1分钟30秒');
  assert.equal(parseNumber('½'), 0.5);
});

test('parseRecipeText: 下厨房复制出来的排版（名字和用量分两行、步骤序号单独一行）', () => {
  const r = parseRecipeText(`北海道吐司
9.1 综合评分
128 人做过这道菜
用料
高筋面粉
270g
细砂糖
40g
盐
3g
黄油
25g
炼乳
适量
做法
1
除黄油外所有材料揉成团，加入黄油揉出膜
2
一次发酵 60分钟
3
170°C 烤 35分钟
小贴士
出炉马上脱模`);
  assert.equal(r.name, '北海道吐司');
  assert.equal(r.ingredients.length, 5);
  assert.deepEqual(r.ingredients[0], { name: '高筋面粉', amount: 270, unit: 'g', note: '' });
  assert.equal(r.ingredients[4].name, '炼乳');
  assert.equal(r.steps.length, 3);
  assert.equal(r.steps[1].minutes, 60);
  assert.equal(r.steps[1].kind, 'ferment');
  assert.equal(r.steps[2].kind, 'bake');
  assert.equal(r.notes, '出炉马上脱模');
});

test('parseRecipeText: 材料分组、用量范围、厨师机揉面', () => {
  const r = parseRecipeText(`巧克力面包
材料：
面包体（10个）
高筋面粉 250克
牛奶\t130- 150克
淡奶油 100克
馅料（10个的量）
淡奶油 190克
巧克力脆脆珠 适量
步骤：
1. 面团材料全部加入厨师机，定时13分钟
2. 一次发酵至2倍大`);
  assert.equal(r.ingredients.length, 5);
  assert.deepEqual(r.ingredients[1], { name: '牛奶', amount: 130, unit: '克', note: '130-150克' });
  assert.equal(r.ingredients[0].note, '面包体');
  assert.equal(r.ingredients[3].note, '馅料');
  assert.equal(r.ingredients[4].name, '巧克力脆脆珠');
  assert.equal(r.steps[0].kind, 'knead');
  assert.equal(r.steps[0].minutes, 13);
});

test('sectionOf: 各种写法的小标题都认得', async () => {
  const { sectionOf } = await import('../js/parser.js');
  const ing = ['材料', '材料：', '原材料', '所需材料', '准备材料：', '材料清单', '用料', '【用料】', '一、食材', '## 配料', '🥣 材料：', '材料（8个）', '主料', '配方', 'Ingredients', "What you'll need", 'INGREDIENTS:'];
  for (const h of ing) assert.equal(sectionOf(h)?.mode, 'ing', `材料标题没认出来：${h}`);
  const step = ['步骤', '操作步骤', '制作步骤', '制作过程', '做法', '做法：', '具体做法', '制作方法', '【步骤】', '二、做法', '流程', '详细步骤', 'Method', 'Directions:', 'Instructions', 'Steps', 'How to make'];
  for (const h of step) assert.equal(sectionOf(h)?.mode, 'step', `步骤标题没认出来：${h}`);
  const note = ['小贴士', '备注：', '注意事项', '小技巧', 'Tips', 'Notes:'];
  for (const h of note) assert.equal(sectionOf(h)?.mode, 'note', `备注标题没认出来：${h}`);
  // 不是标题的不能误认
  const not = ['高筋面粉 250g', '制作面团，揉 10 分钟', '一次发酵 60分钟', '巧克力脆脆珠面包', '加入材料揉成团，静置', 'Mix the flour and water'];
  for (const h of not) assert.equal(sectionOf(h), null, `误认成标题：${h}`);
  // 前缀变成材料分组；冒号后面的内容留下来
  assert.equal(sectionOf('面团材料：').group, '面团');
  assert.equal(sectionOf('所需材料').group, '');
  assert.equal(sectionOf('Dough ingredients').group, 'Dough');
  assert.equal(sectionOf('材料：面粉 250g、水 160g').rest, '面粉 250g、水 160g');
});

test('parseRecipeText: 换一套小标题写法也能完整认出来', () => {
  const r = parseRecipeText(`奶香小餐包

【原材料】
高筋面粉 250g
牛奶 150g

一、操作步骤：
1. 所有材料揉成团 15分钟
2. 一次发酵 1小时
3. 180°C 烤 15分钟

注意事项：
牛奶温度不要太高`);
  assert.equal(r.name, '奶香小餐包');
  assert.equal(r.ingredients.length, 2);
  assert.equal(r.steps.length, 3);
  assert.equal(r.steps[1].kind, 'ferment');
  assert.equal(r.notes, '牛奶温度不要太高');
});

test('parseRecipeText: 标题后面冒号直接跟内容，前缀当分组', () => {
  const r = parseRecipeText(`菠萝包
面团材料：高筋面粉 250g、水 140g
酥皮材料：
黄油 50g
糖粉 40g
制作过程：揉面 10分钟
烤 15分钟`);
  assert.equal(r.ingredients.length, 4);
  assert.equal(r.ingredients[0].note, '面团');
  assert.equal(r.ingredients[2].name, '黄油');
  assert.equal(r.ingredients[2].note, '酥皮');
  assert.equal(r.steps.length, 2);
  assert.equal(r.steps[0].minutes, 10);
});
