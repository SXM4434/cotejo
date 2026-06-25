// WORKSPACE + SESSIONS (BUILD-LIST §3) — multiple NAMED setups. Each session's WORK persists under
// its own per-session localStorage key (SessionContext). This layer only tracks the LIST + which is
// active, and renders SessionProvider KEYED by the active id, so switching remounts + re-hydrates
// from that session's keys (the live state swaps wholesale, no per-field reset). No backend.
import React from "react";
import { SessionProvider, workKeyFor, imgKeyFor } from "./SessionContext";

const WS_KEY = "cotejo.workspace.v1";
type SessionMeta = { id: string; name: string };
type WS = { activeId: string; sessions: SessionMeta[] };

const copyKey = (from: string, to: string) => {
  try { const v = window.localStorage.getItem(from); if (v != null) window.localStorage.setItem(to, v); } catch { /* quota — non-fatal */ }
};

// first run: adopt the legacy single-key session ("v1") as "My setup" — its keys already hold any
// existing work, so there's nothing to migrate. Otherwise restore the saved workspace.
function initWorkspace(): WS {
  if (typeof window === "undefined") return { activeId: "v1", sessions: [{ id: "v1", name: "My setup" }] };
  try { const raw = window.localStorage.getItem(WS_KEY); if (raw) return JSON.parse(raw) as WS; } catch { /* fall through */ }
  return { activeId: "v1", sessions: [{ id: "v1", name: "My setup" }] };
}

// s-N, past any numeric suffix already in the list (browser; ids only need to be unique)
const newId = (existing: SessionMeta[]): string => {
  let max = 0;
  for (const s of existing) { const m = s.id.match(/^s-(\d+)$/); if (m) max = Math.max(max, Number(m[1])); }
  return `s-${max + 1}`;
};

// EXPORT / SHARE format (BUILD-LIST §2). The work blob is exactly SessionContext's Persisted shape.
type ExportBlob = { format: "cotejo"; v: 1; name: string; work: unknown; images?: unknown };
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cotejo";
// base64URL — +/= aren't safe in a URL fragment, so map them out (and back) so the share link
// survives copy/paste + the browser's address bar intact.
const encodeShare = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decodeShare = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));

// FIRST-RUN DEMO — a ready-to-record setup so Cotejo opens considered, not blank. Built-in faces only
// (always render): a geometric-sans display cap-matched to a serif body, two candidates mid-audition,
// a partial stack already decided. Seeded ONCE (flag-guarded); never clobbers your own sessions.
const DEMO_ID = "demo";
const DEMO_FLAG = "cotejo.demo-seeded.v1";
const DEMO_WORK = {
  roles: [
    { id: "role-display", name: "Display", fontId: "unbounded", step: 5, kind: "display" },
    { id: "role-heading", name: "Heading", fontId: "unbounded", step: 3, kind: "heading" },
    { id: "role-body", name: "Body", fontId: "newsreader", step: 0, kind: "body" },
    { id: "role-caption", name: "Caption", fontId: "mona", step: -1, kind: "caption" },
  ],
  scale: { base: 16, ratio: 1.333 },
  text: "Hamburgefonstiv",
  candidateIds: ["anybody", "hubot"],
  winners: { "role-display": "unbounded", "role-body": "newsreader" },
  userDirs: [],
  focusRoleId: "role-display",
  surfaceContent: {},
  tunes: {},
  measure: 66,
};

type Ctx = WS & {
  active: SessionMeta;
  newSession: () => void;
  duplicateSession: (id: string) => void;
  switchSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
  exportActive: () => void;          // download the active session as a .cotejo.json file
  importFile: (file: File) => void;  // open a .cotejo.json as a NEW session (never clobbers current)
  shareActive: () => string;         // copy a share URL (the setup, no images) + return it
};
const WorkspaceCtx = React.createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = React.useState<WS>(initWorkspace);
  React.useEffect(() => { try { window.localStorage.setItem(WS_KEY, JSON.stringify(ws)); } catch { /* quota */ } }, [ws]);

  const active = ws.sessions.find((s) => s.id === ws.activeId) ?? ws.sessions[0];
  const switchSession = (id: string) => setWs((w) => (w.activeId === id ? w : { ...w, activeId: id }));
  const newSession = () => setWs((w) => {
    const id = newId(w.sessions); // a fresh id has no stored keys → SessionProvider hydrates to defaults (blank)
    return { activeId: id, sessions: [...w.sessions, { id, name: `Setup ${id.replace("s-", "")}` }] };
  });
  const duplicateSession = (id: string) => setWs((w) => {
    const src = w.sessions.find((s) => s.id === id); if (!src) return w;
    const nid = newId(w.sessions);
    copyKey(workKeyFor(id), workKeyFor(nid));
    copyKey(imgKeyFor(id), imgKeyFor(nid));
    return { activeId: nid, sessions: [...w.sessions, { id: nid, name: `${src.name} copy` }] };
  });
  const renameSession = (id: string, name: string) =>
    setWs((w) => ({ ...w, sessions: w.sessions.map((s) => (s.id === id ? { ...s, name } : s)) }));
  const deleteSession = (id: string) => setWs((w) => {
    if (w.sessions.length <= 1) return w; // keep at least one
    try { window.localStorage.removeItem(workKeyFor(id)); window.localStorage.removeItem(imgKeyFor(id)); } catch { /* non-fatal */ }
    const sessions = w.sessions.filter((s) => s.id !== id);
    return { activeId: w.activeId === id ? sessions[0].id : w.activeId, sessions };
  });

  // open imported/shared DATA as a NEW session (writes its keys, then switches → remount hydrates).
  const importData = (name: string, work: unknown, images?: unknown) => setWs((w) => {
    const id = newId(w.sessions);
    try {
      if (work) window.localStorage.setItem(workKeyFor(id), JSON.stringify(work));
      if (images) window.localStorage.setItem(imgKeyFor(id), JSON.stringify(images));
    } catch { /* quota */ }
    return { activeId: id, sessions: [...w.sessions, { id, name: name || "Imported" }] };
  });

  const exportActive = () => {
    if (typeof window === "undefined") return;
    const work = window.localStorage.getItem(workKeyFor(ws.activeId));
    const images = window.localStorage.getItem(imgKeyFor(ws.activeId));
    const blob: ExportBlob = { format: "cotejo", v: 1, name: active.name, work: work ? JSON.parse(work) : {}, ...(images ? { images: JSON.parse(images) } : {}) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(blob, null, 2)], { type: "application/json" }));
    a.download = `${slug(active.name)}.cotejo.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  };
  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { const blob = JSON.parse(String(reader.result)) as ExportBlob; if (blob?.work) importData(`${blob.name || "Imported"}`, blob.work, blob.images); } catch { /* invalid file */ }
    };
    reader.readAsText(file);
  };
  const shareActive = (): string => {
    const work = window.localStorage.getItem(workKeyFor(ws.activeId));
    // share the SETUP only (no images — too big for a URL); images stay local to your machine
    const code = encodeShare({ format: "cotejo", v: 1, name: active.name, work: work ? JSON.parse(work) : {} } as ExportBlob);
    const url = `${location.origin}${location.pathname}#share=${code}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    return url;
  };

  // SHARED-LINK ON LOAD — a #share=… hash opens the encoded setup as a NEW session, then clears.
  React.useEffect(() => {
    const m = typeof window !== "undefined" ? window.location.hash.match(/[#&]share=([^&]+)/) : null;
    if (!m) return;
    try { const blob = decodeShare(m[1]) as ExportBlob; if (blob?.work) importData(blob.name ? `${blob.name} (shared)` : "Shared", blob.work); } catch { /* bad link */ }
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIRST-RUN DEMO — seed the ready-to-record "Demo" session once, then make it active (so the app
  // opens on a real, considered setup). A share link takes precedence; the flag stops it ever re-adding.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("share=")) return;
    try {
      if (window.localStorage.getItem(DEMO_FLAG)) return;
      window.localStorage.setItem(workKeyFor(DEMO_ID), JSON.stringify(DEMO_WORK));
      window.localStorage.setItem(DEMO_FLAG, "1");
      setWs((w) => (w.sessions.some((s) => s.id === DEMO_ID) ? w
        : { activeId: DEMO_ID, sessions: [{ id: DEMO_ID, name: "Demo — start here" }, ...w.sessions] }));
    } catch { /* quota */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceCtx.Provider value={{ ...ws, active, newSession, duplicateSession, switchSession, renameSession, deleteSession, exportActive, importFile, shareActive }}>
      {/* KEY on the active id → switching remounts SessionProvider, which re-hydrates that session */}
      <SessionProvider key={ws.activeId} sessionId={ws.activeId}>{children}</SessionProvider>
    </WorkspaceCtx.Provider>
  );
}

export function useWorkspace(): Ctx {
  const v = React.useContext(WorkspaceCtx);
  if (!v) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return v;
}
