import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { C } from "../lib/theme.js";
import { HUNTERS } from "../lib/constants.js";
import { riskMeta, stageLbl, fmtAmt } from "../lib/risk.js";
import { getToday, weekAgg } from "../lib/data.js";
import { Cap, Score, Pill } from "../components/primitives.jsx";

export default function Digest({ calls, onSelect }) {
  const today = useMemo(() => getToday(calls), [calls]);
  const crits = today.filter(c => c.risk >= 1.8);
  const avg   = today.length ? +(today.reduce((s, c) => s + c.avg, 0) / today.length).toFixed(1) : 0;
  const allWk = useMemo(() => weekAgg(calls), [calls]);
  const trend = allWk.slice(-5).map(w => ({ d: w.label, v: w.avg }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[[`REUNIONES (hoy)`, today.length, false, false], ["SCORE PROMEDIO", avg.toFixed(1), true, avg > 0 && avg < 7], ["ALERTAS CRÍTICAS", crits.length, false, crits.length > 0], ["SLACK ENVIADOS", crits.length, false, crits.length > 0]].map(([l, v, mono, alert], i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${alert ? C.redBd : C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Cap ch={l} />
            <div style={{ fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit", fontSize: 30, fontWeight: 700, color: alert ? C.red : C.text, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>
      {crits.length > 0 && (
        <div style={{ background: C.redDim, border: `1px solid ${C.redBd}`, borderLeft: `3px solid ${C.red}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{crits.length} alerta{crits.length > 1 ? "s" : ""} crítica{crits.length > 1 ? "s" : ""} — Slack + HubSpot enviados</div>
          {crits.map(c => (
            <div key={c.id} onClick={() => onSelect(c)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", background: C.card, border: `1px solid ${C.redBd}`, borderRadius: 9, cursor: "pointer", marginBottom: 5 }}>
              <div>
                <div style={{ color: C.text, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{c.hunter.split(" ")[0]} → {c.prospect}</div>
                <div style={{ color: C.muted, fontSize: 10 }}>{(c.hs.potential || "—").toUpperCase()} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)} · {c.deal}</div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: C.red }}>{c.avg.toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch={today.length ? "Reuniones de hoy — por riesgo" : "Sin reuniones hoy"} />
          {today.length === 0 && <div style={{ color: C.muted, fontSize: 12, padding: "8px 0" }}>No hay reuniones para mostrar hoy.</div>}
          {today.map(c => { const ct = c.risk >= 1.8; return (
            <div key={c.id} onClick={() => onSelect(c)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.faint, border: `1px solid ${ct ? C.redBd : C.border}`, borderLeft: `3px solid ${ct ? C.red : C.border}`, borderRadius: 9, cursor: "pointer", marginBottom: 5 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}><span style={{ color: ct ? C.red : C.sub }}>{c.hunter.split(" ")[0]}</span><span style={{ color: C.muted }}> → {c.prospect}</span></div>
                <div style={{ color: C.muted, fontSize: 10 }}>{(c.hs.potential || "—").toUpperCase()} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Pill risk={c.risk} /><Score v={c.avg} /></div>
            </div>
          ); })}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Cap ch="Últimas 5 semanas — equipo" />
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
              <defs><linearGradient id="ag0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.15} /><stop offset="100%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="d" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[5, 10]} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11 }} cursor={{ stroke: C.border }} />
              <Area type="monotone" dataKey="v" stroke={C.accent} strokeWidth={1.5} fill="url(#ag0)" dot={{ fill: C.accent, r: 2.5 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 14 }}>
            <Cap ch="Hoy por hunter" />
            {HUNTERS.map(h => {
              const hc = today.filter(c => c.hunter === h.name);
              const av = hc.length ? +(hc.reduce((s, c) => s + c.avg, 0) / hc.length).toFixed(1) : 0;
              return (
                <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: C.muted, fontSize: 10, width: 20 }}>{h.ini}</span>
                  <div style={{ flex: 1, height: 3, background: C.faint, borderRadius: 99 }}><div style={{ height: "100%", width: `${av * 10}%`, background: C.borderHi, borderRadius: 99 }} /></div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: av && av < 7 ? C.red : C.sub, fontWeight: 600 }}>{av || "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
