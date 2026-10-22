// 把网页 app 需要的文件拷到 www/，给 Capacitor 打包进 iOS 工程用（npm run build:www）
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'fonts', 'icons', 'catalog'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
// 乐米小奶泡体只授权了网页用（自有网站），嵌进 App 要另外向乐米申请授权：不打进 iOS 包，
// App 里的 AppFont 换成小赖字体（SIL OFL 1.1，可以随 App 分发；原生底部菜单和桌面小组件也用它）
const WEB_ONLY = ['xiaonaipao.ttf'];
for (const f of FILES) cpSync(join(root, f), join(out, f), { recursive: true, filter: (p) => !p.endsWith('.mjs') && !p.endsWith('.md') && !WEB_ONLY.some((w) => p.endsWith(w)) });
const swap = (file, pairs) => {
  let s = readFileSync(join(out, file), 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(`${file}: 找不到 ${a}`); s = s.replace(a, b); }
  writeFileSync(join(out, file), s);
};
swap('css/style.css', [
  ["url('../fonts/xiaonaipao.ttf') format('truetype')", "url('../fonts/xiaolai.ttf') format('truetype')"],
  ['size-adjust: 115%;', 'size-adjust: 100%;'],   // 小赖的字身正常大小，不用放大
]);
swap('index.html', [['href="fonts/xiaonaipao.ttf" as="font" type="font/ttf"', 'href="fonts/xiaolai.ttf" as="font" type="font/ttf"']]);
swap('sw.js', [["'fonts/xiaonaipao.ttf'", "'fonts/xiaolai.ttf'"]]);
console.log('www/ ready');
