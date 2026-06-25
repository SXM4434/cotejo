// Haptics — subtle vibration feedback on touch devices (progressive enhancement).
// No-op on desktop (no Vibration API) and when the user prefers reduced motion. Patterns
// are deliberately SHORT + soft: a type instrument should feel quiet, not buzzy. Pair with
// the visual press (scale 0.96) so touch interactions land with a faint physical "tick".
const supported = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.vibrate === "function" &&
  !(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

const fire = (p: number | number[]) => { if (supported()) { try { navigator.vibrate(p); } catch { /* ignore */ } } };

export const haptic = {
  tap: () => fire(14),          // select / toggle / mode switch — a clear tick
  soft: () => fire(9),          // the softer one — incidental confirms
  bump: () => fire([10, 22, 14]),// success (copy landed) — a felt double
};
