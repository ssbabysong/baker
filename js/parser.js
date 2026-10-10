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

// ---------- 小标题 ----------
// 各家写法五花八门：「材料」「原材料」「所需材料」「材料清单」「【用料】」「一、食材：」「面团材料」
// 「步骤」「操作步骤」「制作过程」「做法：」「Method」「How to make」「小贴士」「注意事项」……
// 先把标题外面的装饰去掉（#、序号、【】、emoji、冒号、括号里的份量），再看剩下的几个字是不是小标题。
const ING_WORD = '原材料|材料|用料|原料|配料|食材|主料|辅料|ingredients?';
const ING_HEAD = new RegExp(`^(.{0,6}?)\\s*(?:${ING_WORD})\\s*(?:清单|表|准备|如下|明细|列表|一览|list)?$`, 'i');
const ING_EXACT = /^(配方|配方表|配比|you(?:'ll| will)? need|what you(?:'ll)? need|shopping list)$/i;
const STEP_HEAD = new RegExp('^(?:操作|制作|详细|具体|烘焙|烘烤|烤制|做|详细的|具体的|制作的|操作的|基本|简单|主要|全部)?\\s*'
  + '(?:步骤|做法|方法|制作|流程|过程|教程|工序|操作|steps?|method|instructions?|directions?|preparation|procedure|how to make(?: it)?|step[- ]by[- ]step)'
  + '\\s*(?:说明|如下|详解|流程|过程|步骤|图解|方法)?$', 'i');
const NOTE_HEAD = /^(备注|笔记|小贴士|贴士|提示|小提示|温馨提示|注意事项|注意|小技巧|技巧|心得|小心得|经验|tips?|notes?|cook'?s notes?)$/i;
const GROUP_FILLER = /^(所需|需要|准备|全部|基础|主要|必备|的)+|的$/g;

function cleanHeader(text) {
  return String(text)
    .replace(/^#+\s*/, '')
    .replace(/^(?:[一二三四五六七八九十]+|\d+)\s*[、.．)）]\s*/, '')
    .replace(/^[（(][一二三四五六七八九十\d]+[)）]\s*/, '')
    .replace(/[（(][^)）]*[)）]/g, '')
    .replace(/[【】\[\]「」『』《》<>〈〉*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s'-]/gu, '')   // emoji、符号
    .replace(/\s+/g, ' ')
    .trim();
}

// 一行是不是小标题：返回 { mode: 'ing' | 'step' | 'note', group, rest }，不是就返回 null。
// rest 是冒号后面直接跟着的内容（「材料：面粉 250g、水 160g」）
export function sectionOf(line) {
  const m = String(line).match(/^([^:：]{1,24})[:：]\s*(.*)$/);
  const head = cleanHeader(m ? m[1] : line);
  const rest = m ? m[2].trim() : '';
  // 标题都很短：中文不超过 14 个字，英文不超过 24 个字母；带句号逗号、带数字的是正文
  const cjk = (head.match(/[\u3400-\u9fff]/g) || []).length;
  if (!head || cjk > 14 || head.length > 24 || /[，。,.;；!?！？]/.test(head) || /\d/.test(head)) return null;
  if (ING_EXACT.test(head)) return { mode: 'ing', group: '', rest };
  const ing = head.match(ING_HEAD);
  if (ing) {
    const group = ing[1].replace(GROUP_FILLER, '').replace(/\s*for( the)?$/i, '').trim();
    return { mode: 'ing', group, rest };
  }
  if (STEP_HEAD.test(head)) return { mode: 'step', group: '', rest };
  if (NOTE_HEAD.test(head)) return { mode: 'note', group: '', rest };
  return null;
}
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
  if (/揉|搅拌|混合|厨师机|打面|面包机|knead|mix|fold|折叠|stand mixer/.test(t)) return 'knead';
  return 'other';
}

// 用量写成范围「130-150克」「130~150g」：取小的那个当用量，范围记在备注里
const RANGE = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*[-~～–—至到]\\s*(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})?\\s*$`, 'i');

export function parseIngredient(line) {
  let raw = line.replace(LIST_MARK, '').replace(/\t+/g, ' ').trim();
  if (!raw) return null;
  const range = raw.match(RANGE);
  if (range) {
    const name = raw.slice(0, range.index).trim().replace(/[:：]$/, '');
    return { name, amount: parseNumber(range[1]), unit: range[3] || '', note: `${range[1]}-${range[2]}${range[3] || ''}` };
  }
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

const GROUP_WORDS = /^(面包体|面团|主面团|馅料|内馅|夹馅|馅|表面装饰|表面|装饰|酥皮|酥粒|淋面|中种|中种面团|波兰种|液种|汤种|老面|蛋液|刷面|for the |dough|filling|topping|glaze|streusel|poolish|starter)/i;
function isGroupHeader(line) {
  const raw = line.replace(LIST_MARK, '').trim();
  if (raw.length > 16) return false;
  const bare = raw.replace(/[（(].*?[)）]/g, '').replace(/[:：]\s*$/, '').trim();
  if (!bare || /\d/.test(bare)) return false;
  return GROUP_WORDS.test(bare) || /[:：]\s*$/.test(raw);
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
    const isHeader = !!sectionOf(line);
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
  let group = '';
  const notes = [];

  for (let line of lines) {
    if (!line) continue;
    const sec = sectionOf(line);
    if (sec) {
      mode = sec.mode;
      group = sec.mode === 'ing' ? sec.group : '';
      if (!sec.rest) continue;
      if (mode === 'note') { notes.push(sec.rest); continue; }
      line = sec.rest; // 冒号后面直接写了内容：当成这一段的第一行接着处理
    }

    if (!recipe.name && mode == null && !looksLikeIngredient(line) && !LIST_MARK.test(line)) {
      recipe.name = line.replace(/^#+\s*/, '');
      continue;
    }

    if (mode === 'note') { notes.push(line); continue; }
    // 材料里的小分组：「面包体（10个）」「馅料」「表面装饰：」，记下来当后面材料的备注
    if (mode === 'ing' && isGroupHeader(line)) { group = line.replace(/[（(].*?[)）]/g, '').replace(/[:：]\s*$/, '').trim(); continue; }
    const asIng = mode === 'ing' || (mode == null && looksLikeIngredient(line));
    if (asIng) {
      // 同一行里写了多个材料，比如 "面粉 250g、水 160g"
      const parts = line.split(/[，,、;；]\s*/).filter(Boolean);
      const splittable = parts.length > 1 && parts.every(looksLikeIngredient);
      for (const p of splittable ? parts : [line]) {
        const ing = parseIngredient(p);
        if (ing && group && !ing.note) ing.note = group;
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
