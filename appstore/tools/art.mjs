// 生成 App Store 的详情页顶部图（3840×1646）和搜索结果图（3840×2560），中英文各一张
// 先 npm start（8080），再把 capture.mjs 截的原始画面用另一个服务放在 8081
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = new URL('../creative/', import.meta.url).pathname;   // 存成 PNG；上传前转成 JPEG（去掉透明通道）
// iOS 包里的样式（npm run build:www 生成，AppFont 换成了小赖字体）
const APP_CSS = new URL('../../www/css/style.css', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const lang of ['zh', 'en']) {
  const dir = `${OUT}${lang === 'zh' ? 'zh-Hans' : 'en-US'}`;
  mkdirSync(dir, { recursive: true });
  for (const [kind, h] of [['header', 823], ['search', 1280]]) {
    const p = await (await b.newContext({ viewport: { width: 1920, height: h }, deviceScaleFactor: 2 })).newPage();
    await p.route('**/css/style.css', (r) => r.fulfill({ path: APP_CSS }));   // 和 App 一样用小赖字体
    await p.goto(`http://localhost:8080/appstore/tools/art.html?kind=${kind}&lang=${lang}&shots=http://localhost:8081`);
    await p.waitForSelector('body[data-ready]'); await p.waitForTimeout(800);
    await p.screenshot({ path: `${dir}/${kind}.png` });
    console.log('wrote', lang, kind);
  }
}
await b.close();
