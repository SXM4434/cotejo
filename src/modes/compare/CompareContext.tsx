// Compare mode state — lifted so the mode-bar controls (in the Global bar) and
// the specimen content share one source of truth. Engine unchanged.
import React from "react";
import {
  measureFont, deriveTune, verifyCapMatch,
  type RawMetrics, type DeriveResult, type VerifyResult, type RoleConfig,
} from "../../lib/autofinetune";
import { useSession, FACES, sizeAtViewport, type Face } from "../../state/SessionContext";
import { useViewport } from "../../state/ViewportContext";
import { readParam, writeParams } from "../../lib/urlState";

export { FACES, type Face }; // re-export so existing importers keep working

export const WEIGHT = 500;
export const DISPLAY_ROLE: RoleConfig = { key: "display", anchor: "cap" };

export function useFaceMetrics(name: string) {
  const [m, setM] = React.useState<RawMetrics | null>(null);
  React.useEffect(() => {
    let live = true;
    setM(null);
    measureFont(name, { weight: WEIGHT }).then((r) => live && setM(r));
    return () => { live = false; };
  }, [name]);
  return m;
}

type RoleOpt = { id: string; name: string };
type Ctx = {
  baseId: string; setBaseId: (v: string) => void;
  candId: string; setCandId: (v: string) => void;
  autoTune: boolean; setAutoTune: (v: boolean) => void;
  text: string; setText: (v: string) => void;
  base: Face; cand: Face;
  baseM: RawMetrics | null; candM: RawMetrics | null;
  tune: DeriveResult | null; baseSize: number; candSize: number; verify: VerifyResult | null;
  // the comparison FRAME — which role you're auditioning (drives base font + size)
  roleOpts: RoleOpt[]; focusRoleId: string; setFocusRoleId: (id: string) => void; roleName: string;
  // the candidate POOL — every font being auditioned vs the base, cap-matched
  candidateIds: string[]; addCandidate: (id: string) => void; removeCandidate: (id: string) => void; replaceCandidate: (oldId: string, newId: string) => void;
  // the DECISION — chosen font per role
  winners: Record<string, string>; setWinner: (roleId: string, fontId: string) => void;
};
const CompareCtx = React.createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  // selection comes from the shared session; auto-tune stays Compare's. The focus role's
  // SIZE is resolved at the GLOBAL viewport lens, so Compare previews the type at the
  // chosen Mobile/Tablet/Desktop width (Auto = real screen) — the same lens Set Up uses.
  const { baseId, setBaseId, candId, setCandId, text, setText, base, cand, roles, focusRoleId, setFocusRoleId, scale, candidateIds, addCandidate, removeCandidate, replaceCandidate, winners, setWinner } = useSession();
  const { vw } = useViewport();
  // cap-match defaults ON; ?cap=0 (from a shared link / refresh) turns it off. Synced back to the URL.
  const [autoTune, setAutoTune] = React.useState(() => readParam("cap") !== "0");
  React.useEffect(() => { writeParams({ cap: autoTune ? null : "0" }); }, [autoTune]);
  const roleOpts = roles.map((r) => ({ id: r.id, name: r.name }));
  const focusRole = roles.find((r) => r.id === focusRoleId) ?? roles[0];
  const roleName = focusRole?.name ?? "";
  const baseSize = sizeAtViewport(focusRole, scale, vw);

  // measure by the REGISTERED family token, never the label (uploads measured the label fell back to
  // a system font + cap-matched a fiction — the root font-pipeline bug).
  const baseM = useFaceMetrics(base.measureFamily);
  const candM = useFaceMetrics(cand.measureFamily);

  const tune = React.useMemo(
    () => (baseM && candM ? deriveTune(DISPLAY_ROLE, baseM, candM) : null),
    [baseM, candM],
  );
  const candSize = autoTune && tune ? baseSize * tune.size : baseSize;

  const [verify, setVerify] = React.useState<VerifyResult | null>(null);
  React.useEffect(() => {
    let live = true;
    if (!baseM) return;
    const applied = autoTune && tune ? tune : { size: 1, lh: 1, track: 0 };
    verifyCapMatch(cand.measureFamily, baseM, applied, baseSize, { tolerance: 0.02, candWeight: WEIGHT })
      .then((r) => live && setVerify(r));
    return () => { live = false; };
  }, [baseM, cand.name, autoTune, tune, baseSize]);

  return (
    <CompareCtx.Provider value={{ baseId, setBaseId, candId, setCandId, autoTune, setAutoTune, text, setText, base, cand, baseM, candM, tune, baseSize, candSize, verify, roleOpts, focusRoleId, setFocusRoleId, roleName, candidateIds, addCandidate, removeCandidate, replaceCandidate, winners, setWinner }}>
      {children}
    </CompareCtx.Provider>
  );
}

export function useCompare(): Ctx {
  const v = React.useContext(CompareCtx);
  if (!v) throw new Error("useCompare must be used inside CompareProvider");
  return v;
}
