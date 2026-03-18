import { C } from "../lib/theme.js";

export default function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src="https://worldteams.com/wp-content/uploads/2023/11/worldteams-logo-light.svg" alt="WorldTeams" style={{ height: 24, filter: "invert(1) brightness(0)", opacity: 0.4 }} />
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: C.muted, fontSize: 12 }}>Cargando datos…</div>
    </div>
  );
}
