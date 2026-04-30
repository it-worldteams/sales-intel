import { useState, useMemo } from "react";
import { C } from "../lib/theme.js";
import { CallRow, Btn } from "../components/primitives.jsx";
import CallDetail from "../components/CallDetail.jsx";
import { Search, Trash2, X } from "lucide-react";

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
              <Trash2 size={16} />
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
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} size={16} />
          {search && (
            <button 
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            >
              <X size={14} strokeWidth={3} />
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

