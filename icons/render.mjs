// 用 Playwright 把 icon.svg 栅格化成各尺寸 PNG：node icons/render.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(dir, 'icon.svg'), 'utf8');
// maskable 图标需要安全区：把图案缩到 80%，背景铺满
const maskable = svg
  .replace('<rect width="512" height="512" rx="112" fill="#f7f2e8"/>', '<rect width="512" height="512" fill="#f7f2e8"/><g transform="translate(51.2 51.2) scale(0.8)">')
  .replace('</svg>', '</g></svg>');

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const [name, size, src, bg] of [
  ['icon-192.png', 192, svg, false],
  ['icon-512.png', 512, svg, false],
  ['icon-maskable-512.png', 512, maskable, false],
  ['apple-touch-icon.png', 180, maskable, true],
  // iOS 原生 app 图标：1024、不透明，圆角由系统来切
  ['../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, maskable, true],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:${bg ? '#f7f2e8' : 'transparent'}}svg{width:${size}px;height:${size}px;display:block}</style>${src}`);
  await page.screenshot({ path: join(dir, name), omitBackground: !bg });
  console.log('wrote', name);
}
// 启动画面：生成色的纸，中间一个小店图标
const splash = `<div style="width:2732px;height:2732px;background:#f7f2e8;display:flex;align-items:center;justify-content:center">
  <div style="width:520px;height:520px">${svg.replace('<svg ', '<svg style="width:100%;height:100%" ')}</div></div>`;
await page.setViewportSize({ width: 2732, height: 2732 });
await page.setContent(`<style>html,body{margin:0}</style>${splash}`);
for (const n of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await page.screenshot({ path: join(dir, '../ios/App/App/Assets.xcassets/Splash.imageset', n) });
  console.log('wrote', n);
}
await browser.close();
