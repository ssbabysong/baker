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
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:${bg ? '#f7f2e8' : 'transparent'}}svg{width:${size}px;height:${size}px;display:block}</style>${src}`);
  await page.screenshot({ path: join(dir, name), omitBackground: !bg });
  console.log('wrote', name);
}
await browser.close();
