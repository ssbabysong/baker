// 内置配方目录 catalog/recipes.json 的格式检查：改完 JSON 推上去之前跑 npm test，免得一份坏数据发到所有人手机上
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cat = JSON.parse(readFileSync(new URL('../catalog/recipes.json', import.meta.url), 'utf8'));
const KINDS = new Set(['ferment', 'bake', 'rest', 'chill', 'knead', 'other']);
const SHAPES = new Set(['loaf', 'toast', 'croissant', 'baguette', 'cake', 'cookie', 'muffin', 'bagel', 'pretzel', 'melonpan', 'anpan', 'chocobun']);

test('目录头：schema / version / recipes / removed', () => {
  assert.equal(cat.schema, 1, 'schema 改了的话，老版本 app 会忽略这份目录');
  assert.ok(Number.isInteger(cat.version) && cat.version > 0, 'version 是正整数，每次改内容都要加 1');
  assert.ok(Array.isArray(cat.recipes) && cat.recipes.length > 0);
  assert.ok(Array.isArray(cat.removed));
});

test('每份配方：key 唯一、rev、样子、中英文内容', () => {
  const keys = new Set();
  for (const r of cat.recipes) {
    assert.match(r.key, /^[a-z0-9-]+$/, `key 只用小写字母、数字和横线：${r.key}`);
    assert.ok(!keys.has(r.key), `key 重复：${r.key}`); keys.add(r.key);
    assert.ok(Number.isInteger(r.rev) && r.rev > 0, `${r.key} 的 rev 要是正整数`);
    assert.ok(SHAPES.has(r.shape), `${r.key} 的 shape 不认识：${r.shape}`);
    for (const lang of ['zh', 'en']) {
      const b = r[lang];
      assert.ok(b && b.name?.trim(), `${r.key}.${lang} 缺名字`);
      assert.ok(b.ingredients.length && b.steps.length, `${r.key}.${lang} 缺材料或步骤`);
      for (const i of b.ingredients) {
        assert.ok(i.name?.trim(), `${r.key}.${lang} 有材料没名字`);
        assert.ok(i.amount === null || typeof i.amount === 'number', `${r.key}.${lang} ${i.name} 的用量要是数字或 null`);
      }
      for (const st of b.steps) {
        assert.ok(st.text?.trim(), `${r.key}.${lang} 有空步骤`);
        assert.ok(st.minutes === null || typeof st.minutes === 'number', `${r.key}.${lang} 步骤分钟要是数字或 null`);
        assert.ok(KINDS.has(st.kind), `${r.key}.${lang} 步骤类型不认识：${st.kind}`);
      }
    }
    // 中英文的材料、步骤条数一致，切换语言时一一对应
    assert.equal(r.zh.ingredients.length, r.en.ingredients.length, `${r.key} 中英文材料条数不一样`);
    assert.equal(r.zh.steps.length, r.en.steps.length, `${r.key} 中英文步骤条数不一样`);
  }
});
