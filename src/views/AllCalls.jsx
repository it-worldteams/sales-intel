import { useState, useMemo } from "react";
import { C } from "../lib/theme.js";
import { CallRow, Btn } from "../components/primitives.jsx";
import CallDetail from "../components/CallDetail.jsx";

export default function AllCalls({ calls, initial }) {
  const [sel,    setSel]    = useState(initial || (calls && calls.length > 0 ? calls[0] : null));
  const [filter, setFilter] = useState("todo");
  const [hunter, setHunter] = useState("todas");
  const [start,  setStart]  = useState("");
  const [end,    setEnd]    = useState("");

  const vis = useMemo(() =>
    calls
      .filter(c => hunter === "todas" || c.hunter.includes(hunter))
      .filter(c => filter === "criticas" ? c.risk >= 1.8 : filter === "high" ? c.hs.potential === "high" : filter === "cierre" ? c.hs.stage === "cierre" : true)
      .filter(c => (!start || c.isoDate >= start) && (!end || c.isoDate <= end))
      .slice(0, 100),
    [calls, filter, hunter, start, end]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14, height: "calc(100vh - 116px)" }}>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          <Btn label="Todas"          active={filter === "todo"}     onClick={() => setFilter("todo")} />
          <Btn label="Críticas"       active={filter === "criticas"} onClick={() => setFilter("criticas")} />
          <Btn label="High Potential" active={filter === "high"}     onClick={() => setFilter("high")} />
          <Btn label="En cierre"      active={filter === "cierre"}   onClick={() => setFilter("cierre")} />
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: 8, color: C.muted, fontWeight: 700, letterSpacing: "0.05em" }}>DESDE</span>
            <input type="date" value={start} onChange={e => setStart(e.target.value)}
              style={{ background: "transparent", border: "none", color: C.text, fontSize: 11, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: 8, color: C.muted, fontWeight: 700, letterSpacing: "0.05em" }}>HASTA</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
              style={{ background: "transparent", border: "none", color: C.text, fontSize: 11, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />
          </div>
          {(start || end) && (
            <button onClick={() => { setStart(""); setEnd(""); }}
              style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: C.red, cursor: "pointer", transition: "all 0.1s", padding: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          <Btn label="Todas"      active={hunter === "todas"}      onClick={() => setHunter("todas")} />
          <Btn label="Maria"      active={hunter === "Maria"}      onClick={() => setHunter("Maria")} />
          <Btn label="Martina"    active={hunter === "Martina"}    onClick={() => setHunter("Martina")} />
          <Btn label="Estefania"  active={hunter === "Estefania"}  onClick={() => setHunter("Estefania")} />
        </div>

        <div style={{ overflowY: "auto", paddingRight: 2 }}>
          {vis.map(c => <CallRow key={c.id} call={c} onClick={() => setSel(c)} active={sel?.id === c.id} />)}
          {vis.length === 0 && <div style={{ color: C.muted, fontSize: 12, padding: "24px 0", textAlign: "center", background: C.faint, borderRadius: 12, border: `1px dashed ${C.border}` }}>No hay reuniones en este rango.</div>}
        </div>
      </div>
      <div style={{ overflowY: "auto", paddingRight: 2 }}>
        {sel ? <CallDetail call={sel} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontSize: 13, background: C.faint, borderRadius: 14, border: `1px dashed ${C.border}` }}>Seleccioná una reunión para ver el detalle.</div>}
      </div>
    </div>
  );
}
