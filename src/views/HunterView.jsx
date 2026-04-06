import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { C } from "../lib/theme.js";
import { DIM_KEYS, DIM_LABELS, INITIATIVES, HUNTERS } from "../lib/constants.js";
import { weekAgg } from "../lib/data.js";
import { Cap, CallRow } from "../components/primitives.jsx";
import CallDetail from "../components/CallDetail.jsx";

export default function HunterView({ calls }) {
  const [name, setName] = useState(HUNTERS[0].name);
  const [sel,  setSel]  = useState(null);
  useEffect(() => setSel(null), [name]);

  const hc     = useMemo(() => calls.filter(c => c.hunter === name).sort((a, b) => b.week - a.week || b.risk - a.risk), [calls, name]);
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
        {[["SCORE ESTA SEMANA", thisWavg.toFixed(1), true, thisWavg > 0 && thisWavg < 7], ["PROMEDIO 12 SEM.", overall.toFixed(1), true, false], ["TOTAL CALLS", hc.length, false, false], ["ALERTAS CRÍTICAS", critN, false, critN > 0]].map(([l, v, mono, alert], i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${alert ? C.redBd : C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Cap ch={l} /><div style={{ fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit", fontSize: 30, fontWeight: 700, color: alert ? C.red : C.text, lineHeight: 1 }}>{v}</div>
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
                <div style={{ height: "100%", width: `${d.key === "talkRatio" ? d.avg : d.avg * 10}%`, background: d.avg < 6.5 && d.key !== "talkRatio" ? C.red : C.borderHi, borderRadius: 99 }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: d.avg < 6.5 && d.key !== "talkRatio" ? C.red : C.sub, width: 34, textAlign: "right" }}>{d.avg}{d.key === "talkRatio" ? "%" : ""}</div>
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
