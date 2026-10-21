// 把网页 app 需要的文件拷到 www/，给 Capacitor 打包进 iOS 工程用（npm run build:www）
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'fonts', 'icons', 'catalog'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
// 乐米小奶泡体只授权了网页用（自有网站），嵌进 App 要另外向乐米申请授权：先不打进 iOS 包，App 里自动退回小石头
const WEB_ONLY = ['xiaonaipao.ttf'];
for (const f of FILES) cpSync(join(root, f), join(out, f), { recursive: true, filter: (p) => !p.endsWith('.mjs') && !p.endsWith('.md') && !WEB_ONLY.some((w) => p.endsWith(w)) });
console.log('www/ ready');
