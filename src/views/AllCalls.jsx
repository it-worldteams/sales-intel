import { useState, useMemo } from "react";
import { C } from "../lib/theme.js";
import { CallRow, Btn } from "../components/primitives.jsx";
import CallDetail from "../components/CallDetail.jsx";

export default function AllCalls({ calls, initial }) {
  const [sel,    setSel]    = useState(initial || (calls && calls.length > 0 ? calls[0] : null));
  const [filter, setFilter] = useState("todo");
  const [search, setSearch] = useState("");
  const [start,  setStart]  = useState("");
  const [end,    setEnd]    = useState("");

  const vis = useMemo(() => {
    const q = search.toLowerCase();
    return calls
      .filter(c => !q || c.hunter.toLowerCase().includes(q) || c.prospect.toLowerCase().includes(q) || (c.deal && c.deal.toLowerCase().includes(q)))
      .filter(c => filter === "criticas" ? (c.risk || 0) >= 1.8 : filter === "high" ? c.hs.potential === "high" : filter === "cierre" ? c.hs.stage === "cierre" : true)
      .filter(c => (!start || c.isoDate >= start) && (!end || c.isoDate <= end))
      .slice(0, 100);
  }, [calls, filter, search, start, end]);

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

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input 
            type="text" 
            placeholder="Buscar por hunter, prospect o negocio..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: "100%", 
              background: C.card, 
              border: `1px solid ${C.border}`, 
              borderRadius: 10, 
              padding: "10px 12px 10px 36px", 
              fontSize: 12, 
              color: C.text, 
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s"
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          {search && (
            <button 
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
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
