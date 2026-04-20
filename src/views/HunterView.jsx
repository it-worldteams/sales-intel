import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { C } from "../lib/theme.js";
import { DIM_KEYS, DIM_LABELS, INITIATIVES, HUNTERS } from "../lib/constants.js";
import { scoreCol, stageLbl, fmtAmt } from "../lib/risk.js";
import { weekAgg } from "../lib/data.js";
import { Cap, CallRow } from "../components/primitives.jsx";
import CallDetail from "../components/CallDetail.jsx";

export default function HunterView({ calls }) {
  const [name, setName] = useState(HUNTERS[0].name);
  const [sel,  setSel]  = useState(null);
  useEffect(() => setSel(null), [name]);

  const hc     = useMemo(() => calls.filter(c => c.hunter === name).sort((a, b) => b.week - a.week || (b.risk || 0) - (a.risk || 0)), [calls, name]);
  const wkData = useMemo(() => weekAgg(hc), [hc]);

  const dimAvgs = DIM_KEYS.map(k => {
    const avg    = hc.length ? +(hc.reduce((s, c) => s + (c[k] || 0), 0) / hc.length).toFixed(1) : 0;
    const recent = hc.filter(c => c.week >= 10);
    const older  = hc.filter(c => c.week >= 3 && c.week <= 6);
    const trend  = recent.length && older.length
      ? +((recent.reduce((s, c) => s + (c[k] || 0), 0) / recent.length) - (older.reduce((s, c) => s + (c[k] || 0), 0) / older.length)).toFixed(1)
      : 0;
    return { key: k, label: DIM_LABELS[k], avg: +avg, trend };
  }).sort((a, b) => a.avg - b.avg);

  const initAvgs = INITIATIVES.map(ini => ({ ...ini, pct: hc.length ? Math.round(hc.filter(c => c.initiatives[ini.key]).length / hc.length * 100) : 0 }));
  const overall  = hc.length ? +(hc.reduce((s, c) => s + c.avg, 0) / hc.length).toFixed(1) : 0;
  const thisW    = hc.filter(c => c.week === 12);
  const thisWavg = thisW.length ? +(thisW.reduce((s, c) => s + c.avg, 0) / thisW.length).toFixed(1) : 0;
  const critN    = hc.filter(c => c.risk >= 1.8).length;
  const wd = dimAvgs[0];
  const sd = dimAvgs[dimAvgs.length - 1];

  const monthlyData = useMemo(() => {
    const m = {};
    hc.forEach(c => {
      if (c.isoDate && c.isoDate >= "2026-01-01") {
        const mm = c.isoDate.substring(0, 7);
        if (!m[mm]) m[mm] = { count: 0, sum: 0 };
        m[mm].count += 1;
        m[mm].sum += (c.avg || 0);
      }
    });
    return Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const [y, mStr] = k.split("-");
        const dt = new Date(y, parseInt(mStr, 10) - 1, 1);
        const label = dt.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
        return { 
          key: k, 
          label: label.charAt(0).toUpperCase() + label.slice(1), 
          count: v.count,
          avgScore: v.count > 0 ? +(v.sum / v.count).toFixed(1) : 0
        };
      });
  }, [hc]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Cap ch="Ver perfil de:" mb={0} />
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          {HUNTERS.map(h => (
            <button key={h.name} onClick={() => setName(h.name)}
              style={{ background: name === h.name ? C.text : C.card, color: name === h.name ? C.card : C.muted, border: `1px solid ${name === h.name ? C.text : C.border}`, borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: name === h.name ? 700 : 400, cursor: "pointer", transition: "all 0.12s" }}>
              {h.name.split(" ")[0]} <span style={{ opacity: 0.5, fontSize: 10 }}>{h.ini}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", color: C.muted, fontSize: 11 }}>Cada hunter solo ve su propia vista</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[["SCORE ESTA SEMANA", thisWavg.toFixed(1), true, thisWavg > 0 ? (thisWavg < 7 ? "bad" : "good") : null], ["PROMEDIO 12 SEM.", overall.toFixed(1), true, overall > 0 ? (overall < 7 ? "bad" : "good") : null], ["TOTAL CALLS", hc.length, false, null], ["ALERTAS CRÍTICAS", critN, false, critN > 0 ? "bad" : null]].map(([l, v, mono, state], i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${state === "bad" ? C.redBd : state === "good" ? C.accentBd : C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Cap ch={l} /><div style={{ fontFamily: mono ? "'JetBrains Mono',monospace" : "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: state === "bad" ? C.red : state === "good" ? C.accent : C.text, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch="Evolución personal — 12 semanas" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={wkData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={(wd?.key === "talkRatio" || sd?.key === "talkRatio") ? [0, 100] : [4, 10]} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11 }} cursor={{ stroke: C.border }} />
              <Line type="monotone" dataKey="avg" name="Score promedio" stroke={C.accent} strokeWidth={2} dot={{ r: 3, fill: C.accent }} connectNulls />
              {wd && <Line type="monotone" dataKey={wd.key} name={`Débil: ${wd.label}`} stroke={C.red} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />}
              {sd && <Line type="monotone" dataKey={sd.key} name={`Fuerte: ${sd.label}`} stroke={C.borderHi} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch="Dimensiones — promedio 12 sem." />
          {dimAvgs.map(d => (
            <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 100, fontSize: 11, color: C.muted }}>{d.label}</div>
              <div style={{ flex: 1, height: 3, background: C.faint, borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${d.key === "talkRatio" ? d.avg : d.avg * 10}%`, background: d.key !== "talkRatio" ? scoreCol(d.avg) : C.borderHi, borderRadius: 99 }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: d.key !== "talkRatio" ? scoreCol(d.avg) : C.sub, width: 34, textAlign: "right" }}>{d.avg}{d.key === "talkRatio" ? "%" : ""}</div>
              <div style={{ fontSize: 11, fontWeight: 700, width: 18, textAlign: "center", color: d.trend > 0.2 ? C.accent : d.trend < -0.2 ? C.red : C.muted }}>{d.trend > 0.2 ? "↑" : d.trend < -0.2 ? "↓" : "·"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Cap ch="Iniciativas — cobertura personal" mb={0} />
          <span style={{ color: C.muted, fontSize: 10 }}>Objetivo: &gt;70%</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
          {initAvgs.map(ini => { const col = ini.pct >= 70 ? C.accent : ini.pct >= 50 ? C.sub : C.red; return (
            <div key={ini.key} style={{ background: ini.pct >= 70 ? C.accentDim : ini.pct < 50 ? C.redDim : C.faint, border: `1px solid ${ini.pct >= 70 ? C.accentBd : ini.pct < 50 ? C.redBd : C.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: C.muted, fontSize: 9, marginBottom: 8 }}>{ini.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: col, lineHeight: 1 }}>{ini.pct}%</div>
              <div style={{ width: "100%", height: 2, background: C.border, borderRadius: 99, marginTop: 8 }}><div style={{ height: "100%", width: `${ini.pct}%`, background: col, borderRadius: 99 }} /></div>
            </div>
          ); })}
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Cap ch="Reuniones mensuales — desde enero 2026" mb={0} />
          <span style={{ color: C.muted, fontSize: 10 }}>Total y puntaje promedio</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {monthlyData.length > 0 ? monthlyData.map(m => (
            <div key={m.key} style={{ flex: 1, minWidth: 110, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4, textTransform: "capitalize" }}>{m.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1 }}>{m.count} <span style={{ fontSize: 10, color: C.muted, fontWeight: 400, fontFamily: "inherit" }}>calls</span></div>
              <div style={{ fontSize: 12, fontWeight: 600, color: scoreCol(m.avgScore), background: m.avgScore < 7 ? C.redDim : C.accentDim, padding: "2px 8px", borderRadius: 20 }}>{m.avgScore.toFixed(1)} <span style={{ fontSize: 9, opacity: 0.8 }}>promedio</span></div>
            </div>
          )) : (
            <div style={{ color: C.muted, fontSize: 12, padding: "10px 0" }}>No hay reuniones registradas desde enero 2026.</div>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch="Reuniones recientes" />
          <div style={{ overflowY: "auto", maxHeight: 480 }}>
            {hc.slice(0, 20).map(c => <CallRow key={c.id} call={c} onClick={() => setSel(c)} active={sel?.id === c.id} />)}
          </div>
        </div>
        <div style={{ overflowY: "auto" }}>
          {sel ? <CallDetail call={sel} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontSize: 13 }}>Seleccioná una reunión para ver el detalle</div>}
        </div>
      </div>
    </div>
  );
}
