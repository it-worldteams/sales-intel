import { useState, useEffect, useRef } from "react";
import { C } from "../lib/theme.js";
import { DIM_KEYS, DIM_LABELS, INITIATIVES } from "../lib/constants.js";
import { riskMeta, stageLbl, fmtAmt } from "../lib/risk.js";
import { Cap, Score, DimBar } from "./primitives.jsx";
import ClientBrief from "./ClientBrief.jsx";

export default function CallDetail({ call: c }) {
  const [tab, setTab] = useState("analisis");
  const [typed, setTyped] = useState("");
  const ivRef = useRef(null);
  const fbRef = useRef("");

  const safeAvg = typeof c.avg === "number" ? c.avg : 0;
  const rm = riskMeta(c.risk || 0);
  const crit = rm.label === "CRÍTICO";
  const wd = DIM_KEYS.reduce((best, k) => {
    const bv = typeof c[best] === "number" ? c[best] : 10;
    const kv = typeof c[k] === "number" ? c[k] : 10;
    return kv < bv ? k : best;
  }, DIM_KEYS[0]);

  // Use real AI feedback if available, else generic
  const feedbackText = c.feedback || [
    `✅ Mantuvo buena conexión y generó rapport desde el inicio de la reunión.`,
    `✅ Articuló el diferencial nearshore con claridad ante las preguntas técnicas.`,
    ``,
    `🎯 ${DIM_LABELS[wd]} fue la dimensión más débil (${(c[wd] || 0).toFixed(1)}/10).`,
    `🎯 Talk ratio: si superó el 60%, practicar preguntas abiertas antes de presentar soluciones.`,
    ``,
    `📋 Ejercicio: preparar 3 preguntas de ${(DIM_LABELS[wd] || "").toLowerCase()} específicas para la próxima reunión con ${c.prospect}.`,
  ].join("\n");

  fbRef.current = feedbackText;

  useEffect(() => {
    clearInterval(ivRef.current);
    if (tab !== "analisis") return;
    setTyped("");
    let i = 0;
    ivRef.current = setInterval(() => {
      i++;
      setTyped(fbRef.current.slice(0, i));
      if (i >= fbRef.current.length) clearInterval(ivRef.current);
    }, 8);
    return () => clearInterval(ivRef.current);
  }, [c.id, tab]);

  const TABS = [["analisis", "📊 Análisis de Call"], ["brief", "📋 Client Brief"]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {crit && (
        <div style={{ background: C.redDim, border: `1px solid ${C.redBd}`, borderLeft: `3px solid ${C.red}`, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Alerta crítica enviada — Slack + HubSpot</div>
          <div style={{ color: C.sub, fontSize: 11 }}>Lead {c.hs.potential || "No hay data"} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)} · Score {safeAvg}/10</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 2, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 9, padding: 3, alignSelf: "flex-start" }}>
        {TABS.map(([tid, lbl]) => (
          <button key={tid} onClick={() => setTab(tid)}
            style={{ background: tab === tid ? C.card : "transparent", color: tab === tid ? C.text : C.muted, border: `1px solid ${tab === tid ? C.border : "transparent"}`, borderRadius: 7, padding: "5px 14px", fontSize: 11, fontWeight: tab === tid ? 600 : 400, cursor: "pointer", transition: "all 0.12s" }}>
            {lbl}
          </button>
        ))}
      </div>
      {tab === "analisis" && <>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <Cap ch="Reunión" />
              <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{c.hunter}</div>
              <div style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{c.prospect}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{c.date} · {c.weekLabel}</div>
              {c.summary && <div style={{ color: C.sub, fontSize: 11, marginTop: 8, lineHeight: 1.6, fontStyle: "italic" }}>"{c.summary}"</div>}
            </div>
            <div style={{ textAlign: "right" }}><Score v={safeAvg} lg /><div style={{ color: C.muted, fontSize: 9, marginTop: 4 }}>/10</div></div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            {[["POTENTIAL", (c.hs.potential || "No hay data").toUpperCase()], ["PIPELINE", stageLbl(c.hs.stage)], ["DEAL", fmtAmt(c.hs.amount)], ["RIESGO", rm.label]].map(([l, v], i) => (
              <div key={l}>
                <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.06em", marginBottom: 3 }}>{l}</div>
                <div style={{ color: i === 3 && crit ? C.red : C.text, fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif" }}>{v}</div>
              </div>
            ))}
            {c.video && (
              <a href={c.video} target="_blank" rel="noreferrer" style={{ textDecoration: "none", marginLeft: "auto" }}>
                <div style={{ background: C.accentDim, border: `1px solid ${C.accentBd}`, borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: C.accent, fontSize: 11, fontWeight: 600, transition: "all 0.2s" }}>
                  <span>🎬</span> Ver Grabación
                </div>
              </a>
            )}
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch="Dimensiones" />
          {DIM_KEYS.map((k, i) => <DimBar key={k} label={DIM_LABELS[k]} value={typeof c[k] === "number" ? c[k] : 0} delay={i * 30} weak={k === wd} isPercent={k === "talkRatio"} />)}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch="Iniciativas mencionadas" />
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {INITIATIVES.map(ini => (
              <span key={ini.key} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, fontWeight: 500, background: c.initiatives[ini.key] ? C.accentDim : C.faint, color: c.initiatives[ini.key] ? C.accent : C.muted, border: `1px solid ${c.initiatives[ini.key] ? C.accentBd : C.border}` }}>
                {c.initiatives[ini.key] ? "✓" : "–"} {ini.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent }} />
            <Cap ch="Feedback AI" mb={0} />
          </div>
          <div style={{ color: C.sub, fontSize: 12.5, lineHeight: 2, whiteSpace: "pre-wrap" }}>
            {typed}
            {typed.length < fbRef.current.length && <span style={{ borderRight: `1.5px solid ${C.accent}`, animation: "blink 0.8s infinite" }}>&nbsp;</span>}
          </div>
        </div>
      </>}
      {tab === "brief" && <ClientBrief call={c} />}
    </div>
  );
}
