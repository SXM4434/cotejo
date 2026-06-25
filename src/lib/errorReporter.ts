// errorReporter — lightweight client-side bug-watch. Listens for uncaught errors +
// unhandled promise rejections and fires a compact JSON report at /api/error
// (fire-and-forget, keepalive so it survives a navigating/closing tab). Mirrors the
// best-effort posture of /api/collect: never throws back at the app, no-ops without a
// window, and is heavily throttled so a render loop can't spam the blob store —
// dedupe by message + a hard cap of MAX_SENDS reports per page session.

const MAX_SENDS = 10;
const seen = new Set<string>();
let sent = 0;

type ErrorPayload = {
  ts: number;
  message: string;
  stack: string;
  source: string;
  url: string;
  ua: string;
};

function report(message: string, stack: string | undefined, source: string) {
  try {
    const msg = message || "(no message)";
    // dedupe by message within the session, and cap total sends
    if (seen.has(msg)) return;
    if (sent >= MAX_SENDS) return;
    seen.add(msg);
    sent += 1;

    const payload: ErrorPayload = {
      ts: Date.now(),
      message: msg,
      stack: (stack || "").slice(0, 800),
      source,
      url: location.href,
      ua: navigator.userAgent,
    };

    fetch("/api/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never throw from the error handler itself
  }
}

export function installErrorReporter() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (e) => {
    const err = e.error as Error | undefined;
    report(e.message || (err && err.message) || "", err && err.stack, "error");
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason as unknown;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : (() => {
              try {
                return JSON.stringify(reason);
              } catch {
                return String(reason);
              }
            })();
    const stack = reason instanceof Error ? reason.stack : undefined;
    report(message, stack, "unhandledrejection");
  });
}
