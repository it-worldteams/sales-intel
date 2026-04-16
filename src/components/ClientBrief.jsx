import { C } from "../lib/theme.js";
import { fmtAmt, stageLbl } from "../lib/risk.js";

function Kv({ k, v }) {
  if (!v && v !== false) return null;
  const display = typeof v === "boolean" ? (v ? "Sí" : "No") : String(v);
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
      <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, minWidth: 76, flexShrink: 0, paddingTop: 1, textTransform: "uppercase" }}>{k}</span>
      <span style={{ fontSize: 11, color: C.sub, flex: 1, lineHeight: 1.6 }}>{display}</span>
    </div>
  );
}

function Tag({ k, v, hl }) {
  if (!v) return null;
  return (
    <span style={{ display: "inline-flex", gap: 4, padding: "3px 9px", borderRadius: 6, border: `1px solid ${hl ? C.accentBd : C.border}`, background: hl ? C.accentDim : C.faint, marginRight: 4, marginBottom: 4 }}>
      <span style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>{k}</span>
      <span style={{ fontSize: 11, color: hl ? C.accent : C.text, fontWeight: 500 }}>{v}</span>
    </span>
  );
}

function BList({ items, color }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {list.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color: color || C.accent, fontSize: 9, marginTop: 3, flexShrink: 0 }}>●</span>
          <span style={{ fontSize: 11, color: C.sub, lineHeight: 1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function Blk({ num, icon, title, accent, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${accent ? C.accentBd : C.border}`, borderLeft: accent ? `3px solid ${C.accent}` : undefined, borderRadius: 12, padding: "13px 15px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase" }}>{num}. {title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ClientBrief({ call: c }) {
  const b = c?.brief;
  if (!b) return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>
      Brief no disponible aún.<br />
      <span style={{ fontSize: 11 }}>Se genera automáticamente en la primera call real procesada por Claude.</span>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Client Intelligence Brief</div>
            <div style={{ fontSize: 10, color: C.muted }}>Hunting → Activation · generado por Claude AI</div>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {b.seccion_1_contexto?.como_llego && <Tag k="FUENTE" v={b.seccion_1_contexto.como_llego} />}
            <Tag k="SCORE" v={`${c.avg}/10`} />
            <Tag k="DEAL" v={fmtAmt(c.hs.amount)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Tag k="POTENTIAL" v={c.hs.potential ? c.hs.potential.toUpperCase() : "—"} hl={c.hs.potential === "high"} />
          <Tag k="STAGE" v={stageLbl(c.hs.stage)} />
          {b.seccion_1_contexto?.usaron_outsourcing != null && <Tag k="OUTSOURCING PREVIO" v={b.seccion_1_contexto.usaron_outsourcing ? "Sí" : "No"} />}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Blk num="1" icon="🏢" title="Contexto del Cliente">
            <Kv k="Situación" v={b.seccion_1_contexto?.situacion_actual} />
          </Blk>
          <Blk num="2" icon="⚠️" title="Pain Points">
            {b.seccion_2_pain_points?.problema_principal && (
              <div style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>PRINCIPAL</div>
                <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600, lineHeight: 1.6 }}>{b.seccion_2_pain_points.problema_principal}</div>
              </div>
            )}
            {b.seccion_2_pain_points?.problemas_secundarios?.length > 0 && (
              <div style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>SECUNDARIOS</div>
                <BList items={b.seccion_2_pain_points.problemas_secundarios} />
              </div>
            )}
            {b.seccion_2_pain_points?.frustraciones_previas && (
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>FRUSTRACIONES PREVIAS</div>
                <BList items={[b.seccion_2_pain_points.frustraciones_previas]} color={C.amber} />
              </div>
            )}
          </Blk>
          <Blk num="3" icon="✨" title="Qué Valoró de WorldTeams">
            <div style={{ marginBottom: 7 }}>
              <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>DIFERENCIADORES</div>
              <BList items={b.seccion_3_valor_percibido?.aspectos_destacados} />
            </div>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>OBJECIONES SUPERADAS</div>
            <BList items={b.seccion_3_valor_percibido?.objeciones_superadas} color={C.accent} />
          </Blk>
          <Blk num="4" icon="📋" title="Servicio Contratado" accent>
            {b.seccion_4_servicio_contratado?.descripcion && (
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>{b.seccion_4_servicio_contratado.descripcion}</div>
            )}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
              {b.seccion_4_servicio_contratado?.perfiles?.map((p, i) => (
                <Tag key={i} k="PERFIL" v={`${p.cantidad || 1}x ${p.rol} ${p.seniority}`} hl />
              ))}
            </div>
            {b.seccion_4_servicio_contratado?.escalamiento_mencionado && (
              <div style={{ fontSize: 11, color: C.muted }}>{b.seccion_4_servicio_contratado.escalamiento_mencionado}</div>
            )}
          </Blk>
          <Blk num="7" icon="🏗️" title="Dinámica del Cliente">
            <Kv k="Decide" v={b.seccion_7_dinamica_cliente?.quien_decide} />
            <Kv k="Opera" v={b.seccion_7_dinamica_cliente?.quien_opera} />
            {b.seccion_7_dinamica_cliente?.quien_bloquea && (
              <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "flex-start" }}>
                <span style={{ fontSize: 9, marginTop: 2 }}>⚠️</span>
                <span style={{ fontSize: 11, color: C.amber, fontWeight: 500 }}>Blocker: {b.seccion_7_dinamica_cliente.quien_bloquea}</span>
              </div>
            )}
          </Blk>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Blk num="5" icon="📈" title="Oportunidades de Expansión">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(b.seccion_5_oportunidades_expansion || []).map((e, i) => (
                <span key={i} style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accentBd}`, borderRadius: 6, padding: "3px 9px", fontSize: 11 }}>{e}</span>
              ))}
            </div>
          </Blk>
          <Blk num="6" icon="👥" title="Posiciones Mencionadas">
            <BList items={b.seccion_6_posiciones_mencionadas?.map(p => `${p.rol}: ${p.contexto}`)} />
          </Blk>
          <Blk num="8" icon="🤝" title="Información Relacional">
            {b.seccion_8_informacion_relacional?.personalidad && (
              <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.7, marginBottom: 8 }}>{b.seccion_8_informacion_relacional.personalidad}</div>
            )}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {b.seccion_8_informacion_relacional?.datos_personales?.map((d, i) => <Tag key={i} k="INFO" v={d} />)}
              {b.seccion_8_informacion_relacional?.mejor_momento_contacto && <Tag k="CONTACTO" v={b.seccion_8_informacion_relacional.mejor_momento_contacto} />}
            </div>
          </Blk>
          <Blk num="9" icon={b.seccion_9_riesgos_alertas?.length ? "🚨" : "✅"} title="Riesgos / Alertas">
            {b.seccion_9_riesgos_alertas?.length
              ? <BList items={b.seccion_9_riesgos_alertas} color={C.red} />
              : <div style={{ fontSize: 11, color: C.muted }}>Sin alertas críticas identificadas.</div>
            }
          </Blk>
          <Blk num="10" icon="⚡" title="Momentos Clave">
            <BList items={b.seccion_10_momentos_clave} />
          </Blk>
          <Blk num="11" icon="💡" title="Recomendaciones para Activation" accent>
            <BList items={b.seccion_11_recomendaciones_hunter?.para_activation} color={C.accent} />
            {b.seccion_11_recomendaciones_hunter?.cosas_a_evitar?.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>EVITAR</div>
                <BList items={b.seccion_11_recomendaciones_hunter.cosas_a_evitar} color={C.red} />
              </div>
            )}
          </Blk>
          <Blk num="12" icon="🗓️" title="Próximos Pasos">
            {(b.seccion_12_proximos_pasos || []).map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 8, paddingBottom: 7, borderBottom: `1px solid ${C.border}`, marginBottom: 7 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, paddingTop: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 2 }}>{p.accion}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{p.responsable} · {p.timeline}</div>
                </div>
              </div>
            ))}
          </Blk>
        </div>
      </div>
    </div>
  );
}
