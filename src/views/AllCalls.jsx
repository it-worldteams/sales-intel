import { useState, useMemo } from "react";
import { C } from "../lib/theme.js";
import { CallRow, Btn } from "../components/primitives.jsx";
import CallDetail from "../components/CallDetail.jsx";

export default function AllCalls({ calls, initial }) {
  const [sel,    setSel]    = useState(initial || calls[0]);
  const [filter, setFilter] = useState("todo");
  const [hunter, setHunter] = useState("todas");

  const vis = useMemo(() =>
    calls
      .filter(c => hunter === "todas" || c.hunter.includes(hunter))
      .filter(c => filter === "criticas" ? c.risk >= 1.8 : filter === "high" ? c.hs.potential === "high" : filter === "cierre" ? c.hs.stage === "cierre" : true)
      .slice(0, 100),
    [calls, filter, hunter]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14, height: "calc(100vh - 116px)" }}>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
          <Btn label="Todas"          active={filter === "todo"}     onClick={() => setFilter("todo")} />
          <Btn label="Críticas"       active={filter === "criticas"} onClick={() => setFilter("criticas")} />
          <Btn label="High Potential" active={filter === "high"}     onClick={() => setFilter("high")} />
          <Btn label="En cierre"      active={filter === "cierre"}   onClick={() => setFilter("cierre")} />
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          <Btn label="Todas"      active={hunter === "todas"}      onClick={() => setHunter("todas")} />
          <Btn label="Maria"      active={hunter === "Maria"}      onClick={() => setHunter("Maria")} />
          <Btn label="Martina"    active={hunter === "Martina"}    onClick={() => setHunter("Martina")} />
          <Btn label="Estefania"  active={hunter === "Estefania"}  onClick={() => setHunter("Estefania")} />
        </div>
        <div style={{ overflowY: "auto", paddingRight: 2 }}>
          {vis.map(c => <CallRow key={c.id} call={c} onClick={() => setSel(c)} active={sel?.id === c.id} />)}
          {vis.length === 0 && <div style={{ color: C.muted, fontSize: 12, padding: "12px 0" }}>No hay reuniones con estos filtros.</div>}
        </div>
      </div>
      <div style={{ overflowY: "auto", paddingRight: 2 }}>
        {sel ? <CallDetail call={sel} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontSize: 13 }}>Seleccioná una reunión.</div>}
      </div>
    </div>
  );
}
