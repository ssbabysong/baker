// 计时器 & 提醒
// 每个计时器只记 "结束时刻"，所以关掉 app / 锁屏再回来，剩余时间依然准确。

let audioCtx = null;
let ringing = null;

export function remainingMs(t, now = Date.now()) {
  if (t.pausedRemaining != null) return t.pausedRemaining;
  return Math.max(0, t.endsAt - now);
}

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function createTimer({ label, minutes, stepId = null }) {
  const durationMs = Math.round(minutes * 60000);
  return {
    id: Math.random().toString(36).slice(2, 10),
    label,
    stepId,
    durationMs,
    endsAt: Date.now() + durationMs,
    pausedRemaining: null,
    done: false,
  };
}

export function pauseTimer(t) {
  if (t.pausedRemaining == null) t.pausedRemaining = remainingMs(t);
}

export function resumeTimer(t) {
  if (t.pausedRemaining != null) {
    t.endsAt = Date.now() + t.pausedRemaining;
    t.pausedRemaining = null;
  }
}

export function addMinutes(t, min) {
  if (t.pausedRemaining != null) t.pausedRemaining += min * 60000;
  else t.endsAt = Math.max(Date.now(), t.endsAt) + min * 60000;
  t.durationMs += min * 60000;
  t.done = false;
}

// ---------- 声音：用 WebAudio 合成一段"叮~叮~"，不依赖音频文件 ----------

export function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* 浏览器不支持就算了 */ }
}

function ding(at, freq) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
  o.connect(g).connect(audioCtx.destination);
  o.start(at);
  o.stop(at + 1);
}

export function playChime() {
  unlockAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime + 0.05;
  ding(t, 880);
  ding(t + 0.35, 1175);
  ding(t + 0.7, 1568);
}

// 小店升级：店门口的铃铛「叮铃铃」+ 一段往上走的小号角，最后落在一个和弦上，和计时提醒听得出不一样
function note(at, freq, { type = 'triangle', vol = 0.28, len = 0.5 } = {}) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  o.connect(g).connect(audioCtx.destination);
  o.start(at);
  o.stop(at + len + 0.05);
}

export function playLevelUp() {
  unlockAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime + 0.05;
  // 门铃：两个高音快速交替几下
  [2637, 3136, 2637, 3136, 2637].forEach((f, i) => note(t + i * 0.06, f, { type: 'sine', vol: 0.12, len: 0.25 }));
  // 往上走：C5 E5 G5
  [523, 659, 784].forEach((f, i) => note(t + 0.4 + i * 0.13, f, { len: 0.3 }));
  // 落在 C 大三和弦上，拖长一点
  [1047, 1319, 1568].forEach((f) => note(t + 0.8, f, { vol: 0.18, len: 1.4 }));
  note(t + 0.8, 523, { type: 'sine', vol: 0.2, len: 1.4 });
}

export function startRinging() {
  stopRinging();
  playChime();
  if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 600]);
  ringing = setInterval(() => {
    playChime();
    if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
  }, 4000);
}

export function stopRinging() {
  if (ringing) clearInterval(ringing);
  ringing = null;
  if (navigator.vibrate) navigator.vibrate(0);
}

// ---------- 系统通知 ----------
// 网页 / 主屏幕 PWA：用浏览器通知，时间到那一刻由页面自己弹。
// iOS 原生 app（Capacitor 打包）：网页通知不可用，而且切到后台 JS 就停了，
// 所以开始计时时就把「几点几分响」交给系统的本地通知，锁屏、杀掉 app 也会准时响。

export const isNative = () => !!window.Capacitor?.isNativePlatform?.();
let localNotif = null;
const LN = () => (localNotif ||= window.Capacitor.Plugins.LocalNotifications);
let nativePerm = 'default';

// 当前的通知权限：granted / denied / default / unsupported
export function permissionState() {
  if (isNative()) return nativePerm;
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

export async function refreshPermission() {
  if (!isNative()) return permissionState();
  try {
    const r = await LN().checkPermissions();
    nativePerm = r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'default';
  } catch { nativePerm = 'unsupported'; }
  return nativePerm;
}

export async function askNotifyPermission() {
  if (isNative()) {
    try {
      const r = await LN().requestPermissions();
      nativePerm = r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'default';
    } catch { nativePerm = 'unsupported'; }
    return nativePerm;
  }
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

export async function notify(title, body) {
  if (isNative()) {
    // 原生 app 里只用来「试听」：一秒后弹一条
    try { await LN().schedule({ notifications: [{ id: 1, title, body, schedule: { at: new Date(Date.now() + 1000) } }] }); } catch { /* 没权限 */ }
    return;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'baker-timer', renotify: true, vibrate: [300, 150, 300] };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification(title, opts);
    new Notification(title, opts);
  } catch { /* 部分浏览器在非安全上下文下会抛错 */ }
}

// 计时器 id 是字符串，系统通知要一个整数 id
const numId = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 2000000000) + 10; };
let alarmSig = null;

// 把所有正在走的计时器同步成系统闹钟：alarms = [{ id, at, title, body }]。没变化就什么都不做
export async function syncNativeAlarms(alarms) {
  if (!isNative()) return;
  const future = alarms.filter((a) => a.at > Date.now() + 500);
  const sig = future.map((a) => `${a.id}@${a.at}`).join('|');
  if (sig === alarmSig) return;
  alarmSig = sig;
  try {
    const { notifications } = await LN().getPending();
    const ours = notifications.filter((n) => n.extra?.baker);
    if (ours.length) await LN().cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    if (future.length) {
      await LN().schedule({
        notifications: future.map((a) => ({
          id: numId(a.id), title: a.title, body: a.body, extra: { baker: true },
          schedule: { at: new Date(a.at), allowWhileIdle: true },
        })),
      });
    }
  } catch { alarmSig = null; /* 没权限或插件不可用，下次再试 */ }
}

// ---------- 常亮屏幕：揉面时手上全是面粉，不想一直点亮屏幕 ----------

let wakeLock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { wakeLock = null; }
}
