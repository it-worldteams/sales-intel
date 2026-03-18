import { useState, useMemo } from "react";
import {
  LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { C } from "../lib/theme.js";
import { DIM_KEYS, DIM_LABELS, INITIATIVES, HUNTERS } from "../lib/constants.js";
import { weekAgg } from "../lib/data.js";
import { Cap } from "../components/primitives.jsx";

export default function WeeklyView({ calls }) {
  const [activeDim, setActiveDim] = useState(null);
  const agg = useMemo(() => weekAgg(calls), [calls]);

  const trendData = agg.map(w => {
    const row = { name: w.label, team: w.avg };
    if (activeDim) row[activeDim] = w[activeDim];
    for (const h of HUNTERS) {
      const hc = calls.filter(c => c.week === w.n && c.hunter === h.name);
      row[h.ini] = hc.length ? +(hc.reduce((s, c) => s + c.avg, 0) / hc.length).toFixed(1) : null;
    }
    return row;
  });

  const curr = agg[11] || {};
  const prev = agg[7] || {};
  const dimD = DIM_KEYS.map(k => ({
    key: k, label: DIM_LABELS[k], curr: curr[k] || 0,
    delta: +((curr[k] || 0) - ((prev[k]) || curr[k] || 0)).toFixed(1),
  })).sort((a, b) => a.curr - b.curr);
  const LC = ["#4a7a8a", "#5a6a7a", "#3a7a6a"];
  const delta = +((curr.avg || 0) - ((agg[10]?.avg) || curr.avg || 0)).toFixed(1);
  const wd = dimD[0];
  const sd = dimD[dimD.length - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { l: "SCORE ESTA SEMANA", v: (curr.avg || 0).toFixed(1), mono: true, sub: `${delta >= 0 ? "+" : ""}${delta} vs sem. anterior`, sc: delta >= 0 ? C.accent : C.red },
          { l: "CALLS ESTA SEMANA", v: curr.calls || 0, mono: false, sub: "equipo completo", sc: C.muted },
          { l: "MÁS FUERTE", v: sd?.label || "—", mono: false, sub: `${sd?.curr || 0}/10`, sc: C.sub },
          { l: "A MEJORAR", v: wd?.label || "—", mono: false, sub: `${wd?.curr || 0}/10`, sc: (wd?.curr || 0) < 6.5 ? C.red : C.sub },
        ].map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Cap ch={k.l} />
            <div style={{ fontSize: k.v.toString().length > 8 ? 15 : k.v.toString().length > 5 ? 20 : 28, fontFamily: k.mono ? "'JetBrains Mono',monospace" : "inherit", fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 6 }}>{k.v}</div>
            <div style={{ color: k.sc, fontSize: 10 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Cap ch="Score equipo — 12 semanas" mb={0} />
            <span style={{ color: C.muted, fontSize: 10 }}>{activeDim ? `Mostrando: ${DIM_LABELS[activeDim]}` : "Clic en dimensión →"}</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[4, 10]} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11 }} cursor={{ stroke: C.border }} />
              <Line type="monotone" dataKey="team" name="Equipo" stroke={C.accent} strokeWidth={2} dot={false} connectNulls />
              {activeDim && <Line type="monotone" dataKey={activeDim} name={DIM_LABELS[activeDim]} stroke={C.sub} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />}
              {HUNTERS.map((h, i) => <Line key={h.ini} type="monotone" dataKey={h.ini} name={h.name.split(" ")[0]} stroke={LC[i]} strokeWidth={1.5} strokeDasharray="3 2" dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch="Dimensiones — clic para aislar" />
          {dimD.map(d => (
            <div key={d.key} onClick={() => setActiveDim(activeDim === d.key ? null : d.key)}
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, cursor: "pointer", opacity: activeDim && activeDim !== d.key ? 0.4 : 1, transition: "opacity 0.15s" }}>
              <div style={{ width: 100, fontSize: 11, color: activeDim === d.key ? C.text : C.muted, flexShrink: 0 }}>{d.label}</div>
              <div style={{ flex: 1, height: 3, background: C.faint, borderRadius: 99 }}><div style={{ height: "100%", width: `${d.curr * 10}%`, background: d.curr < 6.5 ? C.red : activeDim === d.key ? C.accent : C.borderHi, borderRadius: 99 }} /></div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: d.curr < 6.5 ? C.red : C.sub, width: 28, textAlign: "right" }}>{d.curr}</div>
              <div style={{ fontSize: 10, fontWeight: 700, width: 32, textAlign: "right", color: d.delta > 0.1 ? C.accent : d.delta < -0.1 ? C.red : C.muted }}>{d.delta > 0.1 ? `+${d.delta}` : d.delta < -0.1 ? d.delta : "·"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Cap ch="Tracker de iniciativas — % calls mencionando cada tema" mb={0} />
          <span style={{ color: C.muted, fontSize: 10 }}>Objetivo: &gt;70%</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr>
            <th style={{ color: C.muted, fontWeight: 600, textAlign: "left", padding: "4px 8px 10px 0", fontSize: 9, letterSpacing: "0.06em" }}>SEMANA</th>
            {INITIATIVES.map(ini => <th key={ini.key} style={{ color: C.muted, fontWeight: 600, textAlign: "center", padding: "4px 8px 10px", minWidth: 90, fontSize: 9, letterSpacing: "0.06em" }}>{ini.label.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>{agg.slice(-6).map((w, i) => (
            <tr key={w.n} style={{ borderTop: `1px solid ${C.border}` }}>
              <td style={{ color: i === 5 ? C.text : C.muted, padding: "8px 8px 8px 0", fontWeight: i === 5 ? 600 : 400 }}>{i === 5 ? "Esta semana" : w.label}</td>
              {INITIATIVES.map(ini => { const p = w[ini.key] || 0; const col = p >= 70 ? C.accent : p >= 50 ? C.sub : C.red; return (
                <td key={ini.key} style={{ textAlign: "center", padding: "8px" }}>
                  <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: col }}>{p}%</span>
                    <div style={{ width: 40, height: 2, background: C.faint, borderRadius: 99 }}><div style={{ height: "100%", width: `${p}%`, background: col, borderRadius: 99 }} /></div>
                  </div>
                </td>
              ); })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
