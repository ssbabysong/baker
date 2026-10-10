import { getLang } from './i18n.js';

// 把一段随手粘贴的食谱文字解析成结构化配方。
// 兼容中英文：「高筋面粉 250g」「250 g bread flour」「一次发酵 1.5小时」「Bake 25 min」等。

const UNITS = [
  'kg', 'g', 'mg', 'ml', 'l', 'L', 'oz', 'lb', 'lbs', 'tsp', 'tbsp', 'cup', 'cups', 'pinch',
  '千克', '公斤', '克', '毫升', '升', '个', '颗', '只', '片', '根', '杯', '小勺', '大勺', '茶匙', '汤匙', '勺', '撮', '小撮', '包', '袋', '盒',
];
// 长的单位优先匹配（"小勺" 先于 "勺"，"kg" 先于 "g"）
const UNIT_RE = UNITS.slice().sort((a, b) => b.length - a.length).map(escapeRe).join('|');
const NUM = '(\\d+(?:\\.\\d+)?(?:\\s*\\/\\s*\\d+)?|[½¼¾⅓⅔])';
const NUM_TAIL = new RegExp(`^(.*?)[\\s:：]*${NUM}\\s*(${UNIT_RE})?\\s*(?:[（(](.*)[)）])?$`, 'i');
const NUM_HEAD = new RegExp(`^${NUM}\\s*(?:(${UNIT_RE})(?![a-z]))?\\s*(.+)$`, 'i');
const FUZZY = /^(.*?)\s*(适量|少许|少量|to taste|as needed)$/i;

const SECTION_ING = /^(材料|配料|原料|用料|食材|主料|辅料|ingredients?)\b|^(材料|配料|原料|用料|食材)/i;
const SECTION_STEP = /^(步骤|做法|方法|制作|流程|steps?|method|instructions?|directions?)\b|^(步骤|做法|方法|制作过程|流程)/i;
const LIST_MARK = /^\s*(?:\d+\s*[.、)）:：]|[-*•·]|第[一二三四五六七八九十\d]+步[:：、]?|step\s*\d+[:：.]?)\s*/i;

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseNumber(str) {
  if (str == null) return null;
  const s = String(str).trim();
  if (FRACTIONS[s] != null) return FRACTIONS[s];
  const frac = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// 识别一句话中的时长，返回分钟数；支持 "1小时30分钟"、"1.5h"、"45 min"、"1h30m"、"90秒"、"半小时"
export function parseDuration(text) {
  if (!text) return null;
  const t = String(text);
  if (/半\s*(个)?\s*小时/.test(t)) return 30;
  const re = /(\d+(?:\.\d+)?)\s*(?:个)?\s*(小时|钟头|hours?|hrs?|h)(?![a-z])\s*(?:(\d+)\s*(分钟|分|minutes?|mins?|m)(?![a-z]))?|(\d+(?:\.\d+)?)\s*(分钟|分(?![之])|minutes?|mins?|m)(?![a-z])|(\d+)\s*(秒钟|秒|seconds?|secs?)(?![a-z])/i;
  const m = t.match(re);
  if (!m) return null;
  if (m[1]) return round(Number(m[1]) * 60 + (m[3] ? Number(m[3]) : 0));
  if (m[5]) return round(Number(m[5]));
  if (m[7]) return round(Number(m[7]) / 60);
  return null;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function guessStepKind(text) {
  const t = String(text || '').toLowerCase();
  if (/发酵|醒发|ferment|proof|rise|bulk/.test(t)) return 'ferment';
  if (/冷藏|冷冻|chill|fridge|refrigerat/.test(t)) return 'chill';
  if (/烤|烘|bake|oven/.test(t)) return 'bake';
  if (/静置|松弛|休息|rest|autolyse|autolyze|水合/.test(t)) return 'rest';
  if (/揉|搅拌|混合|knead|mix|fold|折叠/.test(t)) return 'knead';
  return 'other';
}

export function parseIngredient(line) {
  const raw = line.replace(LIST_MARK, '').trim();
  if (!raw) return null;
  let m = raw.match(NUM_HEAD);
  if (m && m[3] && !/^\d/.test(m[3])) {
    return { name: m[3].trim(), amount: parseNumber(m[1]), unit: m[2] || '', note: '' };
  }
  m = raw.match(NUM_TAIL);
  if (m && m[1].trim()) {
    return {
      name: m[1].trim().replace(/[:：]$/, ''),
      amount: parseNumber(m[2]),
      unit: m[3] || '',
      note: (m[4] || '').trim(),
    };
  }
  m = raw.match(FUZZY);
  if (m && m[1]) return { name: m[1].trim(), amount: null, unit: m[2], note: '' };
  return { name: raw, amount: null, unit: '', note: '' };
}

function looksLikeIngredient(line) {
  const raw = line.replace(LIST_MARK, '').trim();
  if (raw.length > 30) return false;
  return new RegExp(`${NUM}\\s*(${UNIT_RE})`, 'i').test(raw) && parseDuration(raw) == null;
}

export function parseStep(line) {
  const text = line.replace(LIST_MARK, '').trim();
  if (!text) return null;
  return { text, minutes: parseDuration(text), kind: guessStepKind(text) };
}

// 从下厨房、小红书之类的网页 / app 复制出来的文字，常见两种排版：
// 用料是「名字」一行、「用量」下一行；做法前面单独一行步骤序号「1」。先把它们整理成一行一条。
const AMOUNT_ONLY = new RegExp(`^(?:${NUM}\\s*(?:${UNIT_RE})?|适量|少许|少量|一小撮|若干|to taste|as needed)$`, 'i');
const SITE_JUNK = /^(?:\d+(?:\.\d+)?\s*)?(?:综合评分|人做过这道菜|收藏|分享|举报|下厨房|做过这道菜|上传我做的|加入菜单)$/;
function tidyLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\d{1,2}$/.test(line) || /^(?:步骤|step)\s*\d{1,2}$/i.test(line) || SITE_JUNK.test(line)) continue;
    const next = lines[i + 1];
    const isHeader = SECTION_ING.test(line) || SECTION_STEP.test(line);
    if (next && !isHeader && !/\d/.test(line) && line.length <= 20 && AMOUNT_ONLY.test(next)) {
      out.push(`${line} ${next}`);
      i++;
      continue;
    }
    out.push(line);
  }
  return out;
}

export function parseRecipeText(input) {
  const lines = tidyLines(String(input || '').split(/\r?\n/).map((l) => l.trim()));
  const recipe = { name: '', ingredients: [], steps: [], notes: '' };
  let mode = null;
  const notes = [];

  for (const line of lines) {
    if (!line) continue;
    const header = line.replace(/[:：\s]+$/, '');
    if (SECTION_ING.test(header) && header.length <= 12) { mode = 'ing'; continue; }
    if (SECTION_STEP.test(header) && header.length <= 12) { mode = 'step'; continue; }
    if (/^(备注|笔记|小贴士|tips?|notes?)[:：]?/i.test(header)) {
      mode = 'note';
      const rest = line.replace(/^(备注|笔记|小贴士|tips?|notes?)[:：]?\s*/i, '');
      if (rest) notes.push(rest);
      continue;
    }

    if (!recipe.name && mode == null && !looksLikeIngredient(line) && !LIST_MARK.test(line)) {
      recipe.name = line.replace(/^#+\s*/, '');
      continue;
    }

    if (mode === 'note') { notes.push(line); continue; }
    const asIng = mode === 'ing' || (mode == null && looksLikeIngredient(line));
    if (asIng) {
      // 同一行里写了多个材料，比如 "面粉 250g、水 160g"
      const parts = line.split(/[，,、;；]\s*/).filter(Boolean);
      const splittable = parts.length > 1 && parts.every(looksLikeIngredient);
      for (const p of splittable ? parts : [line]) {
        const ing = parseIngredient(p);
        if (ing) recipe.ingredients.push(ing);
      }
    } else {
      const step = parseStep(line);
      if (step) recipe.steps.push(step);
    }
  }
  recipe.notes = notes.join('\n');
  if (!recipe.name) recipe.name = getLang() === 'en' ? 'Untitled recipe' : '未命名配方';
  return recipe;
}

export function formatAmount(n) {
  if (n == null || n === '') return '';
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return String(Math.round(v * 10) / 10);
}

export function formatMinutes(min) {
  if (min == null) return '';
  const total = Math.round(min * 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const en = getLang() === 'en';
  const parts = [];
  if (h) parts.push(en ? `${h} h` : `${h}小时`);
  if (m) parts.push(en ? `${m} min` : `${m}分钟`);
  if (s && !h) parts.push(en ? `${s} s` : `${s}秒`);
  return parts.join(en ? ' ' : '') || (en ? '0 min' : '0分钟');
}
