// 生成小店升级路线的宣传图：一张总图（3840×2160）+ 每个等级一张方图（2048×2048），中英文各一套；
// 加一张隐藏款总图；另外中文多两张小红书竖图（3:4，2484×3312）：8 个等级一张、隐藏款一张
// 先 npm start（8080）再跑：node appstore/tools/levels.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = new URL('../levels/', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const lang of ['zh', 'en']) {
  const dir = `${OUT}${lang === 'zh' ? 'zh-Hans' : 'en-US'}`;
  mkdirSync(dir, { recursive: true });
  const jobs = [['all', '', 1920, 1080, 'levels-all'], ['hidden', '', 1920, 1080, 'levels-hidden'], ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((lv) => ['one', lv, 1024, 1024, `level-${lv}`])];
  if (lang === 'zh') jobs.push(['xhs', '', 1242, 1656, 'xiaohongshu'], ['xhs-hidden', '', 1242, 1656, 'xiaohongshu-hidden']);
  for (const [kind, lv, w, h, file] of jobs) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })).newPage();
    await p.goto(`http://localhost:8080/appstore/tools/levels.html?kind=${kind}&lv=${lv}&lang=${lang}`);
    await p.waitForSelector('body[data-ready]'); await p.waitForTimeout(600);
    await p.screenshot({ path: `${dir}/${file}.png` });
    console.log('wrote', lang, file);
  }
}
await b.close();
