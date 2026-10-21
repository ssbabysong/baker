import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
const S = '/tmp/claude-0/-home-user-baker/6583190b-5320-5847-a2a7-e600064ec0a1/scratchpad/appstore';
const OUT = '/home/user/baker/appstore/screenshots';
const COPY = {
  zh: [
    ['1-shop', '经营你的小面包店', '每烤一炉，小店就长大一点'],
    ['2-proof', '发酵、烘烤自动计时', '锁屏也会准时叫你'],
    ['3-ovens', '几炉一起烤也不乱', '一台烤箱一张卡，进度一眼看清'],
    ['4-rack', '配方都摆上架', '粘贴食谱或让 AI 整理，自动认出材料和步骤'],
    ['5-steps', '每一步清清楚楚', '发酵、烘烤一眼认出，关键数字最醒目'],
    ['6-calendar', '每一炉都记进日历', '拍照、打分、写下小心得'],
    ['7-roadmap', '从小推车到旗舰店', '8 种店面跟着升级，还藏着 4 家隐藏款'],
  ],
  en: [
    ['1-shop', 'Run your own little bakery', 'Every batch helps your shop grow'],
    ['2-proof', 'Proof & bake timers', 'Rings right on time, even when locked'],
    ['3-ovens', 'Many batches, no mess', 'One oven card per batch, all at a glance'],
    ['4-rack', 'Your recipe shelf', 'Paste any recipe; amounts and steps are picked up'],
    ['5-steps', 'Every step, crystal clear', 'Proof and bake stand out, numbers pop'],
    ['6-calendar', 'A diary for every bake', 'Photos, stars and little notes'],
    ['7-roadmap', 'From cart to flagship', '8 shopfronts to grow into, plus 4 secret ones'],
  ],
};
const b = await chromium.launch();
const q = await (await b.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 })).newPage();
for (const [lang, dir] of [['zh', 'zh-Hans'], ['en', 'en-US']]) {
  mkdirSync(`${OUT}/${dir}`, { recursive: true });
  for (const [i, [name, h, s]] of COPY[lang].entries()) {
    const u = new URL(`file://${S}/compose.html`);
    u.searchParams.set('h', h); u.searchParams.set('s', s); u.searchParams.set('lang', lang);
    u.searchParams.set('img', `file://${S}/raw-${lang}/${name}.png`);
    await q.goto(u.href); await q.waitForFunction(() => document.getElementById('img').complete && document.fonts.status === 'loaded');
    await q.waitForTimeout(300);
    await q.screenshot({ path: `${OUT}/${dir}/${String(i + 1).padStart(2, '0')}-${name.slice(2)}.png` });
  }
}
await b.close(); console.log('done');
