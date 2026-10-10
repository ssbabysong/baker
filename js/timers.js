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

export async function askNotifyPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

export async function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'baker-timer', renotify: true, vibrate: [300, 150, 300] };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification(title, opts);
    new Notification(title, opts);
  } catch { /* 部分浏览器在非安全上下文下会抛错 */ }
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
