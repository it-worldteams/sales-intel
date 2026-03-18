import { useState, useMemo } from "react";
import { C } from "./lib/theme.js";
import { getToday } from "./lib/data.js";
import { useCallsData } from "./hooks/useCallsData.js";
import LoadingScreen from "./components/LoadingScreen.jsx";
import ErrorScreen from "./components/ErrorScreen.jsx";
import Digest from "./views/Digest.jsx";
import WeeklyView from "./views/WeeklyView.jsx";
import HunterView from "./views/HunterView.jsx";
import AllCalls from "./views/AllCalls.jsx";

const TABS = [
  { id: "digest",  label: "Resumen del día" },
  { id: "weekly",  label: "Semana del equipo" },
  { id: "hunter",  label: "Por hunter" },
  { id: "all",     label: "Todas las reuniones" },
];

export default function App() {
  const { calls, loading, error, refresh } = useCallsData();
  const [tab,    setTab]    = useState("digest");
  const [passed, setPassed] = useState(null);
  const crits = useMemo(() => getToday(calls).filter(c => c.risk >= 1.8), [calls]);

  const goToCall = c => { setPassed(c); setTab("all"); };

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen msg={error} onRetry={refresh} />;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <header style={{ background: "rgba(244,247,251,0.94)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="https://worldteams.com/wp-content/uploads/2023/11/worldteams-logo-light.svg" alt="WorldTeams" style={{ height: 18, filter: "invert(1) brightness(0)" }} />
          <span style={{ width: 1, height: 16, background: C.border, display: "block" }} />
          <span style={{ color: C.muted, fontSize: 12 }}>Sales Intelligence</span>
          {crits.length > 0 && <span style={{ background: C.redDim, color: C.red, border: `1px solid ${C.redBd}`, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>{crits.length} crítica{crits.length > 1 ? "s" : ""}</span>}
        </div>
        <div style={{ display: "flex", gap: 1, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: tab === t.id ? C.card : "transparent", color: tab === t.id ? C.text : C.muted, border: `1px solid ${tab === t.id ? C.border : "transparent"}`, borderRadius: 7, padding: "6px 16px", fontSize: 12, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", transition: "all 0.12s", boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.muted, fontSize: 11 }}>{new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</span>
          <button onClick={refresh} title="Actualizar datos" style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: C.muted, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>↻</button>
        </div>
      </header>
      <main style={{ padding: "18px 24px", maxWidth: 1440, margin: "0 auto", animation: "fadeUp 0.3s ease" }} key={tab}>
        {tab === "digest" && <Digest calls={calls} onSelect={goToCall} />}
        {tab === "weekly" && <WeeklyView calls={calls} />}
        {tab === "hunter" && <HunterView calls={calls} />}
        {tab === "all"    && <AllCalls calls={calls} initial={passed} />}
      </main>
    </div>
  );
}
