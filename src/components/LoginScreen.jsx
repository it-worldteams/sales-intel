import { useState } from "react";
import { C, useTheme } from "../lib/theme.js";
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function LoginScreen({ onLogin }) {
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Completá email y contraseña."); return; }
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      const msg = err?.message || "Error al iniciar sesión";
      if (msg.includes("Invalid login")) setError("Email o contraseña incorrectos.");
      else if (msg.includes("Email not confirmed")) setError("Tu email no fue confirmado aún.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Manrope', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        top: -180,
        right: -180,
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, rgba(210,241,118,0.06) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(87,151,142,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: -120,
        left: -120,
        width: 340,
        height: 340,
        borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, rgba(255,192,252,0.05) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(251,0,170,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: 400,
        animation: "fadeUp 0.4s ease",
      }}>
        {/* Logo + branding */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="https://worldteams.com/wp-content/uploads/2023/11/worldteams-logo-light.svg"
            alt="WorldTeams"
            style={{ height: 26, filter: isDark ? "none" : "invert(1) brightness(0)", marginBottom: 12 }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 24, height: 1, background: C.border }} />
            <span style={{
              color: C.muted,
              fontSize: 11,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              Sales Intelligence
            </span>
            <div style={{ width: 24, height: 1, background: C.border }} />
          </div>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)"
            : "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)",
        }}>
          <h1 style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.text,
            marginBottom: 4,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Iniciar sesión
          </h1>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 24 }}>
            Ingresá tus credenciales para acceder al dashboard.
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: C.redDim,
              border: `1px solid ${C.redBd}`,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "fadeUp 0.2s ease",
            }}>
              <AlertCircle size={14} color={C.red} />
              <span style={{ color: C.red, fontSize: 11, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block",
              color: C.muted,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@worldteams.com"
                autoComplete="email"
                autoFocus
                style={{
                  width: "100%",
                  background: C.faint,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "11px 12px 11px 36px",
                  fontSize: 13,
                  color: C.text,
                  outline: "none",
                  transition: "border-color 0.15s",
                  fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block",
              color: C.muted,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: C.faint,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "11px 40px 11px 36px",
                  fontSize: 13,
                  color: C.text,
                  outline: "none",
                  transition: "border-color 0.15s",
                  fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: C.muted,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? C.borderHi : C.text,
              color: C.bg,
              border: "none",
              borderRadius: 10,
              padding: "12px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "0.02em",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${C.bg}`,
                  borderTop: `2px solid transparent`,
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }} />
                Verificando…
              </>
            ) : (
              <>
                <LogIn size={15} />
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ color: C.muted, fontSize: 10, opacity: 0.6 }}>
            WorldTeams © {new Date().getFullYear()} · Solo acceso autorizado
          </span>
        </div>
      </div>
    </div>
  );
}
