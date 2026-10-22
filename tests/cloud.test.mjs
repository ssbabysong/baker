// iCloud 同步的合并规则：两台设备各自按这些规则合并，结果要一样
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remoteWins, unionList, planDedupe } from '../js/cloud.js';

test('以后改的为准，一样晚算对面的', () => {
  assert.equal(remoteWins(undefined, 5), true, '本地没有');
  assert.equal(remoteWins(3, 5), true);
  assert.equal(remoteWins(5, 5), true, '两边结果一致');
  assert.equal(remoteWins(7, 5), false);
  assert.equal(remoteWins(0, undefined), true, '默认店名（时间 0）让给别的设备');
});

test('放上架过的内置配方取并集', () => {
  assert.deepEqual(unionList(['a', 'b'], ['b', 'c']), ['a', 'b', 'c']);
  assert.deepEqual(unionList(undefined, ['x']), ['x']);
  assert.deepEqual(unionList(['x'], null), ['x']);
});

test('同一款内置配方两份：留 id 小的，没改过的删掉，改过的不动', () => {
  const pristine = (r) => !r.edited;
  const recipes = [
    { id: 's-anpan', sample: 'anpan' },
    { id: 'mv2abc', sample: 'anpan' },
    { id: 'mv9zzz', sample: 'anpan', edited: true },
    { id: 's-milk', sample: 'milk' },
    { id: 'mine', name: '我自己的' },
  ];
  assert.deepEqual(planDedupe(recipes, pristine), { remove: ['s-anpan'], remap: { 's-anpan': 'mv2abc' } });
  // 换一个顺序（另一台设备读出来的顺序不同）结果一样
  assert.deepEqual(planDedupe([...recipes].reverse(), pristine), { remove: ['s-anpan'], remap: { 's-anpan': 'mv2abc' } });
  assert.deepEqual(planDedupe([{ id: 'a', sample: 'k' }], pristine), { remove: [], remap: {} });
});
