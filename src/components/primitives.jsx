import { useState, useEffect, useRef } from "react";
import { C } from "../lib/theme.js";
import { riskMeta, scoreCol, stageLbl, fmtAmt } from "../lib/risk.js";

export function Cap({ ch, mb = 10 }) {
  return (
    <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.09em", marginBottom: mb, fontWeight: 700, textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>
      {ch}
    </div>
  );
}

export function Score({ v, lg }) {
  const val = typeof v === "number" && isFinite(v) ? v : 0;
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: lg ? 30 : 16, fontWeight: 700, color: scoreCol(val), lineHeight: 1 }}>
      {val.toFixed(1)}
    </span>
  );
}

export function Pill({ risk }) {
  const m = riskMeta(risk);
  const crit = m.label === "CRÍTICO";
  return (
    <span style={{ background: crit ? m.bg : C.faint, color: crit ? m.col : C.muted, border: `1px solid ${crit ? m.bd : C.border}`, borderRadius: 4, padding: "1px 7px", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>
      {m.label}
    </span>
  );
}

export function DimBar({ label, value, delay, weak, isPercent }) {
  const safeVal = typeof value === "number" && isFinite(value) ? value : 0;
  const [pct, setPct] = useState(0);
  const tmr = useRef(null);
  useEffect(() => {
    clearTimeout(tmr.current);
    setPct(0);
    tmr.current = setTimeout(() => setPct(isPercent ? safeVal : safeVal * 10), 60 + (delay || 0));
    return () => clearTimeout(tmr.current);
  }, [safeVal, delay]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <div style={{ width: 126, fontSize: 11, flexShrink: 0, color: weak ? C.sub : C.muted, fontWeight: weak ? 600 : 400 }}>{label}</div>
      <div style={{ flex: 1, height: 3, background: C.faint, borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: weak && !isPercent ? scoreCol(safeVal) : C.borderHi, borderRadius: 99, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: weak && !isPercent ? scoreCol(safeVal) : C.sub, width: 34, textAlign: "right", fontWeight: weak ? 700 : 400 }}>{safeVal.toFixed(isPercent ? 0 : 1)}{isPercent ? "%" : ""}</div>
    </div>
  );
}

export function CallRow({ call: c, onClick, active }) {
  const m = riskMeta(c.risk);
  const crit = m.label === "CRÍTICO";
  return (
    <div onClick={onClick} style={{ padding: "11px 13px", background: active ? C.faint : C.card, border: `1px solid ${active ? C.borderHi : crit ? C.redBd : C.border}`, borderLeft: `3px solid ${crit ? C.red : active ? C.accent : C.border}`, borderRadius: 10, cursor: "pointer", transition: "all 0.12s", marginBottom: 5, boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
            <span style={{ color: crit ? C.red : C.sub }}>{c.hunter.split(" ")[0]}</span>
            <span style={{ color: C.muted }}> → {c.prospect}</span>
          </div>
          <div style={{ color: C.muted, fontSize: 10, marginBottom: 5 }}>{c.date} · {c.deal}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Pill risk={c.risk} />
            <span style={{ color: C.muted, fontSize: 9 }}>{(c.hs.potential || "—").toUpperCase()} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)}</span>
          </div>
        </div>
        <Score v={c.avg} />
      </div>
    </div>
  );
}

export function Btn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? C.text : C.card, color: active ? C.card : C.muted, border: `1px solid ${active ? C.text : C.border}`, borderRadius: 7, padding: "4px 10px", fontSize: 10, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.12s" }}>
      {label}
    </button>
  );
}
