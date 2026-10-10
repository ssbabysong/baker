// 中英文 + 货币。文案就地写成 L('中文', 'English')，两种语言挨在一起，改的时候不用来回找。
// 语言和货币都存在 localStorage 里，启动时同步读出来，第一屏就是对的语言。

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* 无痕模式 */ } };

function detectLang() {
  const saved = read('baker-lang');
  if (saved === 'zh' || saved === 'en') return saved;
  if (typeof document === 'undefined') return 'zh'; // node 里跑单测
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  return langs.some((l) => /^zh/i.test(l)) ? 'zh' : 'en';
}

let lang = detectLang();
let currency = read('baker-currency') || (lang === 'zh' ? 'CNY' : 'USD');

export const getLang = () => lang;
export const isEn = () => lang === 'en';
export function setLang(v) {
  lang = v === 'en' ? 'en' : 'zh';
  write('baker-lang', lang);
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
}

export const L = (zh, en) => (lang === 'en' ? en : zh);

// ---------- 货币 ----------

export const CURRENCIES = { CNY: '¥', USD: '$' };
export const getCurrency = () => currency;
export function setCurrency(v) {
  currency = CURRENCIES[v] ? v : 'CNY';
  write('baker-currency', currency);
}
export const currencySymbol = (c = currency) => CURRENCIES[c] || '¥';

// 人民币取整数；美元保留到角（$3.50）
export function formatPrice(n, c = currency) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '';
  const v = Number(n);
  const text = c === 'USD' && !Number.isInteger(v) ? v.toFixed(2) : String(Math.round(v * 100) / 100);
  return `${currencySymbol(c)}${text}`;
}

// 应用名：配方以前在英文里就叫 receipt，正好也是一张面包小票
export const APP_NAME = () => L('面包小票', 'Bread Receipt');
