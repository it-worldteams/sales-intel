import { C } from "../lib/theme.js";

export default function ErrorScreen({ msg, onRetry }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src="https://worldteams.com/wp-content/uploads/2023/11/worldteams-logo-light.svg" alt="WorldTeams" style={{ height: 24, filter: "invert(1) brightness(0)", opacity: 0.4 }} />
      <div style={{ color: C.red, fontSize: 13, fontWeight: 600 }}>Error al conectar con la base de datos</div>
      <div style={{ color: C.muted, fontSize: 11, maxWidth: 340, textAlign: "center" }}>{msg}</div>
      <button onClick={onRetry} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reintentar</button>
    </div>
  );
}
