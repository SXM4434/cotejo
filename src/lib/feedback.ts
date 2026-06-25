// feedback — the unified "tactile" layer: a whisper of sound + a faint haptic on the
// interactions that should feel physical. Desktop gets the sound, touch gets the buzz,
// both stay quiet (the instrument should feel soft, never noisy/buzzy). All guarded —
// degrades to silence. armAudio() runs inside the gesture so the AudioContext unlocks.
import { haptic } from "./haptics";
import { armAudio, playBound } from "./sound";

// a discrete select: tabs, dropdowns, toggles, removes, mode switch — HAPTIC ONLY (a faint
// mobile tap). NO desktop sound: these are high-frequency, and sound on every click turns
// noisy/annoying (less-is-more — fewer, better cues). Sound is reserved for the moments that
// earn it: a landed save (below) and the stretchy slider's own tick/bound (its signature).
export function tactileSelect() { haptic.tap(); }
// a landed action: save a direction / copy succeeded — a soft low thunk + a gentle
// double-tap. THIS one earns the sound (rare, meaningful).
export function tactileSuccess() { armAudio(); playBound(); haptic.bump(); }
