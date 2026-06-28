// DockRow — one calm labeled line for the MOBILE controls sheet (quiet label left, control right), so
// the phone Controls panel reads as a real settings list instead of the desktop pill-row wrapped into
// a pile. Shared by Compare + Tune. (module-level → stable identity, no remount.)
import React from "react";

const MONO = "var(--t-mono)";

export function DockRow({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", minHeight: 36 }}>
      {label != null
        ? <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t-ink-3)", flexShrink: 0 }}>{label}</span>
        : <span />}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{children}</div>
    </div>
  );
}
