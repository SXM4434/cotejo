// Sound — subtle UI feedback via @web-kits/audio (Web Audio, desktop). The
// "tactile" layer the desktop tool can actually fire (haptics can't). Everything
// is guarded: if the API shape shifts or audio is blocked, it degrades to silence,
// never throws. AudioContext needs a user gesture → armAudio() on first pointer.
import { sine, triangle, ensureReady } from "@web-kits/audio";

// swallow BOTH sync throws and async rejections (AudioContext.resume() rejects with
// "Navigated away from page" if the tab navigates before it settles — harmless, silence it).
const hush = (fn: () => unknown) => {
  try {
    const r = fn() as unknown;
    if (r && typeof (r as Promise<unknown>).then === "function") (r as Promise<unknown>).catch(() => {});
  } catch { /* blocked — stay silent */ }
};

// @web-kits/audio calls AudioContext.resume() internally without returning the promise,
// so when the tab navigates before it settles the rejection escapes as an unhandled one
// ("Navigated away from page" / InvalidStateError). It's harmless — swallow exactly that
// class of audio rejection (scoped by message) so it never reaches the console.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    const m = String((e as PromiseRejectionEvent)?.reason?.message ?? (e as PromiseRejectionEvent)?.reason ?? "");
    if (/Navigated away|InvalidStateError|AudioContext|user gesture|not allowed to start/i.test(m)) e.preventDefault();
  });
}

let armed = false;
export function armAudio() {
  if (armed) return;
  armed = true;
  hush(ensureReady);
}

// sine(frequency, decay, gain). Tuned to the quiet instrument: very low gain, low
// dull tones — a whisper, not a beep. The end-thunk is soft, not a hard triangle.
type Play = (opts?: unknown) => unknown;
let _tick: Play | null = null;
let _bound: Play | null = null;
try {
  _tick = sine({ start: 470, end: 430 }, 0.04, 0.06) as unknown as Play;     // an audible step-tick
  _bound = triangle({ start: 160, end: 116 }, 0.13, 0.11) as unknown as Play;  // a clear, low "end" thunk
} catch { /* leave null */ }

let on = true;
export function setSoundOn(v: boolean) { on = v; }
export function isSoundOn() { return on; }

// Throttle the step-tick: a slider can fire hundreds of steps in one drag, which
// machine-guns into a buzz. Cap it so it reads as a gentle texture, not noise.
let lastTick = 0;
export function playTick() {
  if (!on || !_tick) return;
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (now - lastTick < 42) return;
  lastTick = now;
  hush(_tick);
}
export function playBound() { if (on && _bound) hush(_bound); }
