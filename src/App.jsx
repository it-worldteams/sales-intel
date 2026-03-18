import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line, AreaChart, Area,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── FONTS ───────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');`;

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#f4f7fb", card:"#ffffff", faint:"#eef2f8",
  border:"#dde5f0", borderHi:"#b8cade",
  text:"#0e1823", sub:"#4a6478", muted:"#90a8bc",
  accent:"#009a56", accentDim:"rgba(0,154,86,0.08)", accentBd:"rgba(0,154,86,0.2)",
  red:"#cc2238", redDim:"rgba(204,34,56,0.06)", redBd:"rgba(204,34,56,0.22)",
  amber:"#9a6200", amberDim:"rgba(154,98,0,0.07)", amberBd:"rgba(154,98,0,0.2)",
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DIM_KEYS   = ["discovery","businessImpact","propuestaValor","objeciones","rapport","nextSteps","closing","talkRatio","openQuestions"];
const DIM_LABELS = {
  discovery:"Discovery", businessImpact:"Business Impact", propuestaValor:"Propuesta de Valor",
  objeciones:"Objeciones", rapport:"Rapport", nextSteps:"Next Steps",
  closing:"Closing", talkRatio:"Talk Ratio", openQuestions:"Preg. Abiertas",
};
const INITIATIVES = [
  {key:"timezone",   label:"Same time zone"},
  {key:"nearshore",  label:"Nearshore"},
  {key:"roi",        label:"ROI / ahorro"},
  {key:"top3",       label:"Top 3%"},
  {key:"garantia",   label:"Garantía"},
  {key:"onboarding", label:"Onboarding 72hs"},
];
const HUNTERS = [
  {name:"María Guigard",      ini:"MG"},
  {name:"Martina Zasjman",    ini:"MZ"},
  {name:"Estefania Lapenna", ini:"EL"},
];
const INI_MAP = Object.fromEntries(HUNTERS.map(h => [h.name, h.ini]));

// ─── DATA MAPPING ─────────────────────────────────────────────────────────────
// Maps Supabase snake_case → dashboard camelCase
function mapRow(row) {
  // Compute ISO week number from date string
  const dt   = new Date(row.date);
  const now  = new Date();
  const diffMs   = now - dt;
  const diffDays = Math.floor(diffMs / 86400000);
  const weekAgo  = Math.floor(diffDays / 7);  // 0 = this week, 1 = last week, …
  const week     = Math.max(1, 13 - weekAgo);  // map to S1-S12 window

  return {
    id:        row.id,
    hunter:    row.hunter,
    ini:       INI_MAP[row.hunter] || row.hunter.substring(0,2).toUpperCase(),
    week,
    weekLabel: `S${week}`,
    date:      dt.toLocaleDateString("es-AR", {day:"numeric", month:"short"}),
    isoDate:   row.date,
    prospect:  row.prospect,
    deal:      row.deal,
    avg:       row.avg_score || 0,
    // Dimensions
    discovery:       row.discovery       || 0,
    businessImpact:  row.business_impact  || 0,
    propuestaValor:  row.propuesta_valor  || 0,
    objeciones:      row.objeciones       || 0,
    rapport:         row.rapport          || 0,
    nextSteps:       row.next_steps       || 0,
    closing:         row.closing          || 0,
    talkRatio:       row.talk_ratio       || 0,
    openQuestions:   row.open_questions   || 0,
    // HubSpot
    hs: {
      potential: row.hs_potential || "low",
      stage:     row.hs_stage     || "discovery",
      amount:    row.hs_amount    || 0,
      dealId:    row.hs_deal_id,
    },
    // Initiatives
    initiatives: {
      timezone:   !!row.init_timezone,
      nearshore:  !!row.init_nearshore,
      roi:        !!row.init_roi,
      top3:       !!row.init_top3,
      garantia:   !!row.init_garantia,
      onboarding: !!row.init_onboarding,
    },
    // Brief & feedback (already JSON from Supabase)
    brief:    row.brief    || null,
    summary:  row.summary  || "",
    feedback: row.feedback || "",
    // Risk — use stored value if exists, else recompute
    risk: row.risk_score != null ? row.risk_score : riskOf({
      avg: row.avg_score || 0,
      hs: {potential: row.hs_potential||"low", stage: row.hs_stage||"discovery", amount: row.hs_amount||0},
    }),
  };
}

// ─── RISK ENGINE ─────────────────────────────────────────────────────────────
const POT_W   = {high:1.0, mid:0.6, low:0.3};
const STAGE_W = {cierre:1.0, propuesta:0.8, discovery:0.5};

function riskOf(c) {
  const gap = Math.max(0, 8.5 - (c.avg || 0));
  return +( gap * (
    (POT_W[c.hs.potential]  || 0.3) * 0.40 +
    (STAGE_W[c.hs.stage]    || 0.5) * 0.35 +
    Math.min((c.hs.amount || 0) / 50000, 1) * 0.25
  )).toFixed(2);
}
function riskMeta(r) {
  if (r >= 1.8) return {label:"CRÍTICO", col:C.red,   bg:C.redDim,   bd:C.redBd};
  if (r >= 1.0) return {label:"ALTO",    col:C.muted,  bg:C.faint,    bd:C.border};
  if (r >= 0.4) return {label:"MEDIO",   col:C.muted,  bg:"transparent", bd:C.border};
  return               {label:"OK",      col:C.muted,  bg:"transparent", bd:C.border};
}

const stageLbl  = s => ({cierre:"Cierre", propuesta:"Propuesta", discovery:"Discovery"})[s] || s;
const fmtAmt    = n => `$${((n||0)/1000).toFixed(0)}k`;
const scoreCol  = v => v < 6.5 ? C.red : v < 7.5 ? C.sub : C.text;

// ─── DATA HOOK ────────────────────────────────────────────────────────────────
function useCallsData() {
  const [calls,   setCalls]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("calls")
        .select("*")
        .order("date", {ascending: false})
        .limit(600);

      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }

      const mapped = (data || []).map(mapRow);
      setCalls(mapped);
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true; };
  }, [lastRefresh]);

  // Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel("calls-realtime")
      .on("postgres_changes", {event:"INSERT", schema:"public", table:"calls"}, () => {
        setLastRefresh(Date.now());
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const refresh = () => setLastRefresh(Date.now());
  return { calls, loading, error, refresh };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getToday(calls) {
  if (!calls.length) return [];
  const todayStr = new Date().toLocaleDateString("es-AR", {day:"numeric", month:"short"});
  const todayCalls = calls.filter(c => c.date === todayStr);
  // If no calls today, show most recent day with calls
  if (todayCalls.length) return todayCalls.sort((a,b) => b.risk - a.risk);
  const recent = [...calls].sort((a,b) => new Date(b.isoDate) - new Date(a.isoDate));
  const latestDate = recent[0]?.date;
  return recent.filter(c => c.date === latestDate).sort((a,b) => b.risk - a.risk);
}

function getWeekGroups(calls) {
  // Group calls into 12 relative weeks
  const weeks = Array.from({length:12}, (_,i) => ({n:i+1, label:`S${i+1}`, calls:[]}));
  calls.forEach(c => {
    const w = weeks.find(w => w.n === c.week);
    if (w) w.calls.push(c);
  });
  return weeks;
}

function weekAgg(calls) {
  const weeks = getWeekGroups(calls);
  return weeks.map(w => {
    const wc  = w.calls;
    const avg = wc.length ? +(wc.reduce((s,c)=>s+c.avg,0)/wc.length).toFixed(1) : 0;
    const obj = {n:w.n, label:w.label, avg, calls:wc.length};
    for (const k of DIM_KEYS) obj[k] = wc.length ? +(wc.reduce((s,c)=>s+(c[k]||0),0)/wc.length).toFixed(1) : 0;
    for (const ini of INITIATIVES) obj[ini.key] = wc.length ? Math.round(wc.filter(c=>c.initiatives[ini.key]).length/wc.length*100) : 0;
    return obj;
  });
}

// ─── PRIMITIVE COMPONENTS ────────────────────────────────────────────────────
function Cap({ch, mb=10}) {
  return <div style={{color:C.muted,fontSize:9,letterSpacing:"0.09em",marginBottom:mb,fontWeight:700,textTransform:"uppercase"}}>{ch}</div>;
}
function Score({v, lg}) {
  const val = typeof v==="number"&&isFinite(v) ? v : 0;
  return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:lg?30:16,fontWeight:700,color:scoreCol(val),lineHeight:1}}>{val.toFixed(1)}</span>;
}
function Pill({risk}) {
  const m=riskMeta(risk); const crit=m.label==="CRÍTICO";
  return <span style={{background:crit?m.bg:C.faint,color:crit?m.col:C.muted,border:`1px solid ${crit?m.bd:C.border}`,borderRadius:4,padding:"1px 7px",fontSize:9,fontWeight:700,letterSpacing:"0.04em"}}>{m.label}</span>;
}

function DimBar({label, value, delay, weak}) {
  const safeVal = typeof value==="number"&&isFinite(value) ? value : 0;
  const [pct, setPct] = useState(0);
  const tmr = useRef(null);
  useEffect(() => {
    clearTimeout(tmr.current); setPct(0);
    tmr.current = setTimeout(()=>setPct(safeVal*10), 60+(delay||0));
    return ()=>clearTimeout(tmr.current);
  }, [safeVal, delay]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <div style={{width:126,fontSize:11,flexShrink:0,color:weak?C.sub:C.muted,fontWeight:weak?600:400}}>{label}</div>
      <div style={{flex:1,height:3,background:C.faint,borderRadius:99}}>
        <div style={{height:"100%",width:`${pct}%`,background:weak&&safeVal<6.5?C.red:C.borderHi,borderRadius:99,transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:weak&&safeVal<6.5?C.red:C.sub,width:28,textAlign:"right",fontWeight:weak?700:400}}>{safeVal.toFixed(1)}</div>
    </div>
  );
}

function CallRow({call:c, onClick, active}) {
  const m=riskMeta(c.risk); const crit=m.label==="CRÍTICO";
  return (
    <div onClick={onClick} style={{padding:"11px 13px",background:active?C.faint:C.card,border:`1px solid ${active?C.borderHi:crit?C.redBd:C.border}`,borderLeft:`3px solid ${crit?C.red:active?C.accent:C.border}`,borderRadius:10,cursor:"pointer",transition:"all 0.12s",marginBottom:5,boxShadow:active?"0 1px 6px rgba(0,0,0,0.06)":"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:2}}>
            <span style={{color:crit?C.red:C.sub}}>{c.hunter.split(" ")[0]}</span>
            <span style={{color:C.muted}}> → {c.prospect}</span>
          </div>
          <div style={{color:C.muted,fontSize:10,marginBottom:5}}>{c.date} · {c.deal}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <Pill risk={c.risk}/>
            <span style={{color:C.muted,fontSize:9}}>{c.hs.potential.toUpperCase()} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)}</span>
          </div>
        </div>
        <Score v={c.avg}/>
      </div>
    </div>
  );
}

// ─── CLIENT BRIEF ────────────────────────────────────────────────────────────
function Kv({k,v}) {
  if (!v && v!==false) return null;
  const display = typeof v==="boolean"?(v?"Sí":"No"):String(v);
  return (
    <div style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
      <span style={{fontSize:9,color:C.muted,fontWeight:700,minWidth:76,flexShrink:0,paddingTop:1,textTransform:"uppercase"}}>{k}</span>
      <span style={{fontSize:11,color:C.sub,flex:1,lineHeight:1.6}}>{display}</span>
    </div>
  );
}
function Tag({k,v,hl}) {
  if (!v) return null;
  return (
    <span style={{display:"inline-flex",gap:4,padding:"3px 9px",borderRadius:6,border:`1px solid ${hl?C.accentBd:C.border}`,background:hl?C.accentDim:C.faint,marginRight:4,marginBottom:4}}>
      <span style={{fontSize:9,color:C.muted,fontWeight:600}}>{k}</span>
      <span style={{fontSize:11,color:hl?C.accent:C.text,fontWeight:500}}>{v}</span>
    </span>
  );
}
function BList({items,color}) {
  const list = Array.isArray(items)?items.filter(Boolean):[];
  if(!list.length) return null;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      {list.map((item,i)=>(
        <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
          <span style={{color:color||C.accent,fontSize:9,marginTop:3,flexShrink:0}}>●</span>
          <span style={{fontSize:11,color:C.sub,lineHeight:1.6}}>{item}</span>
        </div>
      ))}
    </div>
  );
}
function Blk({num,icon,title,accent,children}) {
  return (
    <div style={{background:C.card,border:`1px solid ${accent?C.accentBd:C.border}`,borderLeft:accent?`3px solid ${C.accent}`:undefined,borderRadius:12,padding:"13px 15px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:9}}>
        <span style={{fontSize:11}}>{icon}</span>
        <span style={{fontSize:9,fontWeight:700,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>{num}. {title}</span>
      </div>
      {children}
    </div>
  );
}

function ClientBrief({call:c}) {
  const b = c?.brief;
  if (!b) return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,textAlign:"center",color:C.muted,fontSize:12}}>
      Brief no disponible aún.<br/>
      <span style={{fontSize:11}}>Se genera automáticamente en la primera call real procesada por Claude.</span>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>Client Intelligence Brief</div>
            <div style={{fontSize:10,color:C.muted}}>Hunting → Activation · generado por Claude AI</div>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {b.seccion_1_contexto?.como_llego && <Tag k="FUENTE" v={b.seccion_1_contexto.como_llego}/>}
            <Tag k="SCORE"    v={`${c.avg}/10`}/>
            <Tag k="DEAL"     v={fmtAmt(c.hs.amount)}/>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <Tag k="POTENTIAL" v={c.hs.potential.toUpperCase()} hl={c.hs.potential==="high"}/>
          <Tag k="STAGE"     v={stageLbl(c.hs.stage)}/>
          {b.seccion_1_contexto?.usaron_outsourcing!=null && <Tag k="OUTSOURCING PREVIO" v={b.seccion_1_contexto.usaron_outsourcing?"Sí":"No"}/>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <Blk num="1" icon="🏢" title="Contexto del Cliente">
            <Kv k="Situación" v={b.seccion_1_contexto?.situacion_actual}/>
          </Blk>
          <Blk num="2" icon="⚠️" title="Pain Points">
            {b.seccion_2_pain_points?.problema_principal && (
              <div style={{marginBottom:7}}>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>PRINCIPAL</div>
                <div style={{fontSize:11.5,color:C.text,fontWeight:600,lineHeight:1.6}}>{b.seccion_2_pain_points.problema_principal}</div>
              </div>
            )}
            {b.seccion_2_pain_points?.problemas_secundarios?.length > 0 && (
              <div style={{marginBottom:7}}>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>SECUNDARIOS</div>
                <BList items={b.seccion_2_pain_points.problemas_secundarios}/>
              </div>
            )}
            {b.seccion_2_pain_points?.frustraciones_previas && (
              <div>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>FRUSTRACIONES PREVIAS</div>
                <BList items={[b.seccion_2_pain_points.frustraciones_previas]} color={C.amber}/>
              </div>
            )}
          </Blk>
          <Blk num="3" icon="✨" title="Qué Valoró de WorldTeams">
            <div style={{marginBottom:7}}>
              <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>DIFERENCIADORES</div>
              <BList items={b.seccion_3_valor_percibido?.aspectos_destacados}/>
            </div>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>OBJECIONES SUPERADAS</div>
            <BList items={b.seccion_3_valor_percibido?.objeciones_superadas} color={C.accent}/>
          </Blk>
          <Blk num="4" icon="📋" title="Servicio Contratado" accent>
            {b.seccion_4_servicio_contratado?.descripcion && (
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>{b.seccion_4_servicio_contratado.descripcion}</div>
            )}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
              {b.seccion_4_servicio_contratado?.perfiles?.map((p,i)=>(
                <Tag key={i} k="PERFIL" v={`${p.cantidad||1}x ${p.rol} ${p.seniority}`} hl/>
              ))}
            </div>
            {b.seccion_4_servicio_contratado?.escalamiento_mencionado && (
              <div style={{fontSize:11,color:C.muted}}>{b.seccion_4_servicio_contratado.escalamiento_mencionado}</div>
            )}
          </Blk>
          <Blk num="7" icon="🏗️" title="Dinámica del Cliente">
            <Kv k="Decide" v={b.seccion_7_dinamica_cliente?.quien_decide}/>
            <Kv k="Opera"  v={b.seccion_7_dinamica_cliente?.quien_opera}/>
            {b.seccion_7_dinamica_cliente?.quien_bloquea && (
              <div style={{display:"flex",gap:6,marginTop:4,alignItems:"flex-start"}}>
                <span style={{fontSize:9,marginTop:2}}>⚠️</span>
                <span style={{fontSize:11,color:C.amber,fontWeight:500}}>Blocker: {b.seccion_7_dinamica_cliente.quien_bloquea}</span>
              </div>
            )}
          </Blk>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <Blk num="5" icon="📈" title="Oportunidades de Expansión">
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(b.seccion_5_oportunidades_expansion||[]).map((e,i)=>(
                <span key={i} style={{background:C.accentDim,color:C.accent,border:`1px solid ${C.accentBd}`,borderRadius:6,padding:"3px 9px",fontSize:11}}>{e}</span>
              ))}
            </div>
          </Blk>
          <Blk num="6" icon="👥" title="Posiciones Mencionadas">
            <BList items={b.seccion_6_posiciones_mencionadas?.map(p=>`${p.rol}: ${p.contexto}`)}/>
          </Blk>
          <Blk num="8" icon="🤝" title="Información Relacional">
            {b.seccion_8_informacion_relacional?.personalidad && (
              <div style={{fontSize:11.5,color:C.sub,lineHeight:1.7,marginBottom:8}}>{b.seccion_8_informacion_relacional.personalidad}</div>
            )}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {b.seccion_8_informacion_relacional?.datos_personales?.map((d,i)=><Tag key={i} k="INFO" v={d}/>)}
              {b.seccion_8_informacion_relacional?.mejor_momento_contacto && <Tag k="CONTACTO" v={b.seccion_8_informacion_relacional.mejor_momento_contacto}/>}
            </div>
          </Blk>
          <Blk num="9" icon={b.seccion_9_riesgos_alertas?.length?"🚨":"✅"} title="Riesgos / Alertas">
            {b.seccion_9_riesgos_alertas?.length
              ? <BList items={b.seccion_9_riesgos_alertas} color={C.red}/>
              : <div style={{fontSize:11,color:C.muted}}>Sin alertas críticas identificadas.</div>
            }
          </Blk>
          <Blk num="10" icon="⚡" title="Momentos Clave">
            <BList items={b.seccion_10_momentos_clave}/>
          </Blk>
          <Blk num="11" icon="💡" title="Recomendaciones para Activation" accent>
            <BList items={b.seccion_11_recomendaciones_hunter?.para_activation} color={C.accent}/>
            {b.seccion_11_recomendaciones_hunter?.cosas_a_evitar?.length > 0 && (
              <div style={{marginTop:6}}>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>EVITAR</div>
                <BList items={b.seccion_11_recomendaciones_hunter.cosas_a_evitar} color={C.red}/>
              </div>
            )}
          </Blk>
          <Blk num="12" icon="🗓️" title="Próximos Pasos">
            {(b.seccion_12_proximos_pasos||[]).map((p,i)=>(
              <div key={i} style={{display:"flex",gap:8,paddingBottom:7,borderBottom:`1px solid ${C.border}`,marginBottom:7}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.muted,paddingTop:1,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:2}}>{p.accion}</div>
                  <div style={{fontSize:10,color:C.muted}}>{p.responsable} · {p.timeline}</div>
                </div>
              </div>
            ))}
          </Blk>
        </div>
      </div>
    </div>
  );
}

// ─── CALL DETAIL ─────────────────────────────────────────────────────────────
function CallDetail({call:c}) {
  const [tab,   setTab]   = useState("analisis");
  const [typed, setTyped] = useState("");
  const ivRef = useRef(null);
  const fbRef = useRef("");

  const safeAvg = typeof c.avg==="number" ? c.avg : 0;
  const rm      = riskMeta(c.risk||0);
  const crit    = rm.label==="CRÍTICO";
  const wd      = DIM_KEYS.reduce((best,k) => {
    const bv = typeof c[best]==="number" ? c[best] : 10;
    const kv = typeof c[k]==="number"    ? c[k]    : 10;
    return kv < bv ? k : best;
  }, DIM_KEYS[0]);

  // Use real AI feedback if available, else generic
  const feedbackText = c.feedback || [
    `✅ Mantuvo buena conexión y generó rapport desde el inicio de la reunión.`,
    `✅ Articuló el diferencial nearshore con claridad ante las preguntas técnicas.`,
    ``,
    `🎯 ${DIM_LABELS[wd]} fue la dimensión más débil (${(c[wd]||0).toFixed(1)}/10).`,
    `🎯 Talk ratio: si superó el 60%, practicar preguntas abiertas antes de presentar soluciones.`,
    ``,
    `📋 Ejercicio: preparar 3 preguntas de ${(DIM_LABELS[wd]||"").toLowerCase()} específicas para la próxima reunión con ${c.prospect}.`,
  ].join("\n");

  fbRef.current = feedbackText;

  useEffect(() => {
    clearInterval(ivRef.current);
    if (tab !== "analisis") return;
    setTyped(""); let i = 0;
    ivRef.current = setInterval(()=>{ i++; setTyped(fbRef.current.slice(0,i)); if(i>=fbRef.current.length) clearInterval(ivRef.current); }, 8);
    return ()=>clearInterval(ivRef.current);
  }, [c.id, tab]);

  const TABS = [["analisis","📊 Análisis de Call"],["brief","📋 Client Brief"]];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {crit && (
        <div style={{background:C.redDim,border:`1px solid ${C.redBd}`,borderLeft:`3px solid ${C.red}`,borderRadius:10,padding:"12px 16px"}}>
          <div style={{color:C.red,fontWeight:700,fontSize:13,marginBottom:3}}>Alerta crítica enviada — Slack + HubSpot</div>
          <div style={{color:C.sub,fontSize:11}}>Lead {c.hs.potential} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)} · Score {safeAvg}/10</div>
        </div>
      )}
      <div style={{display:"flex",gap:2,background:C.faint,border:`1px solid ${C.border}`,borderRadius:9,padding:3,alignSelf:"flex-start"}}>
        {TABS.map(([tid,lbl])=>(
          <button key={tid} onClick={()=>setTab(tid)}
            style={{background:tab===tid?C.card:"transparent",color:tab===tid?C.text:C.muted,border:`1px solid ${tab===tid?C.border:"transparent"}`,borderRadius:7,padding:"5px 14px",fontSize:11,fontWeight:tab===tid?600:400,cursor:"pointer",transition:"all 0.12s"}}>
            {lbl}
          </button>
        ))}
      </div>
      {tab==="analisis" && <>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <Cap ch="Reunión"/>
              <div style={{color:C.text,fontWeight:700,fontSize:16}}>{c.hunter}</div>
              <div style={{color:C.sub,fontSize:13,marginTop:2}}>{c.prospect}</div>
              <div style={{color:C.muted,fontSize:11,marginTop:2}}>{c.date} · {c.weekLabel}</div>
              {c.summary && <div style={{color:C.sub,fontSize:11,marginTop:8,lineHeight:1.6,fontStyle:"italic"}}>"{c.summary}"</div>}
            </div>
            <div style={{textAlign:"right"}}><Score v={safeAvg} lg/><div style={{color:C.muted,fontSize:9,marginTop:4}}>/10</div></div>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,display:"flex",gap:20,flexWrap:"wrap"}}>
            {[["POTENTIAL",c.hs.potential.toUpperCase()],["PIPELINE",stageLbl(c.hs.stage)],["DEAL",fmtAmt(c.hs.amount)],["RIESGO",rm.label]].map(([l,v],i)=>(
              <div key={l}>
                <div style={{color:C.muted,fontSize:9,letterSpacing:"0.06em",marginBottom:3}}>{l}</div>
                <div style={{color:i===3&&crit?C.red:C.text,fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch="Dimensiones"/>
          {DIM_KEYS.map((k,i)=><DimBar key={k} label={DIM_LABELS[k]} value={typeof c[k]==="number"?c[k]:0} delay={i*30} weak={k===wd}/>)}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch="Iniciativas mencionadas"/>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {INITIATIVES.map(ini=>(
              <span key={ini.key} style={{fontSize:11,padding:"3px 10px",borderRadius:6,fontWeight:500,background:c.initiatives[ini.key]?C.accentDim:C.faint,color:c.initiatives[ini.key]?C.accent:C.muted,border:`1px solid ${c.initiatives[ini.key]?C.accentBd:C.border}`}}>
                {c.initiatives[ini.key]?"✓":"–"} {ini.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.accent}}/>
            <Cap ch="Feedback · Claude AI" mb={0}/>
          </div>
          <div style={{color:C.sub,fontSize:12.5,lineHeight:2,whiteSpace:"pre-wrap"}}>
            {typed}
            {typed.length < fbRef.current.length && <span style={{borderRight:`1.5px solid ${C.accent}`,animation:"blink 0.8s infinite"}}>&nbsp;</span>}
          </div>
        </div>
      </>}
      {tab==="brief" && <ClientBrief call={c}/>}
    </div>
  );
}

// ─── DIGEST ──────────────────────────────────────────────────────────────────
function Digest({calls, onSelect}) {
  const today = useMemo(()=>getToday(calls), [calls]);
  const crits = today.filter(c=>c.risk>=1.8);
  const avg   = today.length ? +(today.reduce((s,c)=>s+c.avg,0)/today.length).toFixed(1) : 0;
  const allWk = useMemo(()=>weekAgg(calls), [calls]);
  const trend = allWk.slice(-5).map(w=>({d:w.label,v:w.avg}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[[`REUNIONES${calls.length?" (hoy)":""}`,today.length,false,false],["SCORE PROMEDIO",avg.toFixed(1),true,avg>0&&avg<7],["ALERTAS CRÍTICAS",crits.length,false,crits.length>0],["SLACK ENVIADOS",crits.length,false,crits.length>0]].map(([l,v,mono,alert],i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${alert?C.redBd:C.border}`,borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <Cap ch={l}/>
            <div style={{fontFamily:mono?"'JetBrains Mono',monospace":"inherit",fontSize:30,fontWeight:700,color:alert?C.red:C.text,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>
      {crits.length>0&&(
        <div style={{background:C.redDim,border:`1px solid ${C.redBd}`,borderLeft:`3px solid ${C.red}`,borderRadius:12,padding:16}}>
          <div style={{color:C.red,fontWeight:700,fontSize:13,marginBottom:12}}>{crits.length} alerta{crits.length>1?"s":""} crítica{crits.length>1?"s":""} — Slack + HubSpot enviados</div>
          {crits.map(c=>(
            <div key={c.id} onClick={()=>onSelect(c)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 13px",background:C.card,border:`1px solid ${C.redBd}`,borderRadius:9,cursor:"pointer",marginBottom:5}}>
              <div>
                <div style={{color:C.text,fontSize:12,fontWeight:600,marginBottom:3}}>{c.hunter.split(" ")[0]} → {c.prospect}</div>
                <div style={{color:C.muted,fontSize:10}}>{c.hs.potential.toUpperCase()} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)} · {c.deal}</div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:C.red}}>{c.avg.toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:12}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch={today.length?"Reuniones de hoy — por riesgo":"Reuniones más recientes — por riesgo"}/>
          {today.length===0 && <div style={{color:C.muted,fontSize:12,padding:"8px 0"}}>No hay reuniones para mostrar.</div>}
          {today.map(c=>{const ct=c.risk>=1.8;return(
            <div key={c.id} onClick={()=>onSelect(c)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.faint,border:`1px solid ${ct?C.redBd:C.border}`,borderLeft:`3px solid ${ct?C.red:C.border}`,borderRadius:9,cursor:"pointer",marginBottom:5}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,marginBottom:2}}><span style={{color:ct?C.red:C.sub}}>{c.hunter.split(" ")[0]}</span><span style={{color:C.muted}}> → {c.prospect}</span></div>
                <div style={{color:C.muted,fontSize:10}}>{c.hs.potential.toUpperCase()} · {stageLbl(c.hs.stage)} · {fmtAmt(c.hs.amount)}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Pill risk={c.risk}/><Score v={c.avg}/></div>
            </div>
          );})}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch="Últimas 5 semanas — equipo"/>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={trend} margin={{top:4,right:4,bottom:0,left:-22}}>
              <defs><linearGradient id="ag0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.15}/><stop offset="100%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="d" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis domain={[5,10]} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:11}} cursor={{stroke:C.border}}/>
              <Area type="monotone" dataKey="v" stroke={C.accent} strokeWidth={1.5} fill="url(#ag0)" dot={{fill:C.accent,r:2.5}}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{borderTop:`1px solid ${C.border}`,marginTop:14,paddingTop:14}}>
            <Cap ch="Hoy por hunter"/>
            {HUNTERS.map(h=>{
              const hc=today.filter(c=>c.hunter===h.name);
              const av=hc.length?+(hc.reduce((s,c)=>s+c.avg,0)/hc.length).toFixed(1):0;
              return(
                <div key={h.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{color:C.muted,fontSize:10,width:20}}>{h.ini}</span>
                  <div style={{flex:1,height:3,background:C.faint,borderRadius:99}}><div style={{height:"100%",width:`${av*10}%`,background:C.borderHi,borderRadius:99}}/></div>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:av&&av<7?C.red:C.sub,fontWeight:600}}>{av||"—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WEEKLY VIEW ─────────────────────────────────────────────────────────────
function WeeklyView({calls}) {
  const [activeDim, setActiveDim] = useState(null);
  const agg = useMemo(()=>weekAgg(calls), [calls]);

  const trendData = agg.map(w=>{
    const row={name:w.label,team:w.avg};
    if(activeDim) row[activeDim]=w[activeDim];
    for(const h of HUNTERS){
      const hc=calls.filter(c=>c.week===w.n&&c.hunter===h.name);
      row[h.ini]=hc.length?+(hc.reduce((s,c)=>s+c.avg,0)/hc.length).toFixed(1):null;
    }
    return row;
  });

  const curr=agg[11]||{}; const prev=agg[7]||{};
  const dimD=DIM_KEYS.map(k=>({key:k,label:DIM_LABELS[k],curr:curr[k]||0,delta:+((curr[k]||0)-((prev[k])||curr[k]||0)).toFixed(1)})).sort((a,b)=>a.curr-b.curr);
  const LC=["#4a7a8a","#5a6a7a","#3a7a6a"];
  const delta=+((curr.avg||0)-((agg[10]?.avg)||curr.avg||0)).toFixed(1);
  const wd=dimD[0]; const sd=dimD[dimD.length-1];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{l:"SCORE ESTA SEMANA",v:(curr.avg||0).toFixed(1),mono:true,sub:`${delta>=0?"+":""}${delta} vs sem. anterior`,sc:delta>=0?C.accent:C.red},
          {l:"CALLS ESTA SEMANA",v:curr.calls||0,mono:false,sub:"equipo completo",sc:C.muted},
          {l:"MÁS FUERTE",v:sd?.label||"—",mono:false,sub:`${sd?.curr||0}/10`,sc:C.sub},
          {l:"A MEJORAR",v:wd?.label||"—",mono:false,sub:`${wd?.curr||0}/10`,sc:(wd?.curr||0)<6.5?C.red:C.sub}].map((k,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <Cap ch={k.l}/>
            <div style={{fontSize:k.v.toString().length>8?15:k.v.toString().length>5?20:28,fontFamily:k.mono?"'JetBrains Mono',monospace":"inherit",fontWeight:700,color:C.text,lineHeight:1,marginBottom:6}}>{k.v}</div>
            <div style={{color:k.sc,fontSize:10}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:12}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <Cap ch="Score equipo — 12 semanas" mb={0}/>
            <span style={{color:C.muted,fontSize:10}}>{activeDim?`Mostrando: ${DIM_LABELS[activeDim]}`:"Clic en dimensión →"}</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trendData} margin={{top:4,right:8,bottom:0,left:-20}}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3"/>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis domain={[4,10]} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:11}} cursor={{stroke:C.border}}/>
              <Line type="monotone" dataKey="team" name="Equipo" stroke={C.accent} strokeWidth={2} dot={false} connectNulls/>
              {activeDim&&<Line type="monotone" dataKey={activeDim} name={DIM_LABELS[activeDim]} stroke={C.sub} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls/>}
              {HUNTERS.map((h,i)=><Line key={h.ini} type="monotone" dataKey={h.ini} name={h.name.split(" ")[0]} stroke={LC[i]} strokeWidth={1.5} strokeDasharray="3 2" dot={false} connectNulls/>)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch="Dimensiones — clic para aislar"/>
          {dimD.map(d=>(
            <div key={d.key} onClick={()=>setActiveDim(activeDim===d.key?null:d.key)}
              style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,cursor:"pointer",opacity:activeDim&&activeDim!==d.key?0.4:1,transition:"opacity 0.15s"}}>
              <div style={{width:100,fontSize:11,color:activeDim===d.key?C.text:C.muted,flexShrink:0}}>{d.label}</div>
              <div style={{flex:1,height:3,background:C.faint,borderRadius:99}}><div style={{height:"100%",width:`${d.curr*10}%`,background:d.curr<6.5?C.red:activeDim===d.key?C.accent:C.borderHi,borderRadius:99}}/></div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:d.curr<6.5?C.red:C.sub,width:28,textAlign:"right"}}>{d.curr}</div>
              <div style={{fontSize:10,fontWeight:700,width:32,textAlign:"right",color:d.delta>0.1?C.accent:d.delta<-0.1?C.red:C.muted}}>{d.delta>0.1?`+${d.delta}`:d.delta<-0.1?d.delta:"·"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Cap ch="Tracker de iniciativas — % calls mencionando cada tema" mb={0}/>
          <span style={{color:C.muted,fontSize:10}}>Objetivo: &gt;70%</span>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr>
            <th style={{color:C.muted,fontWeight:600,textAlign:"left",padding:"4px 8px 10px 0",fontSize:9,letterSpacing:"0.06em"}}>SEMANA</th>
            {INITIATIVES.map(ini=><th key={ini.key} style={{color:C.muted,fontWeight:600,textAlign:"center",padding:"4px 8px 10px",minWidth:90,fontSize:9,letterSpacing:"0.06em"}}>{ini.label.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>{agg.slice(-6).map((w,i)=>(
            <tr key={w.n} style={{borderTop:`1px solid ${C.border}`}}>
              <td style={{color:i===5?C.text:C.muted,padding:"8px 8px 8px 0",fontWeight:i===5?600:400}}>{i===5?"Esta semana":w.label}</td>
              {INITIATIVES.map(ini=>{const p=w[ini.key]||0;const col=p>=70?C.accent:p>=50?C.sub:C.red;return(
                <td key={ini.key} style={{textAlign:"center",padding:"8px"}}>
                  <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:col}}>{p}%</span>
                    <div style={{width:40,height:2,background:C.faint,borderRadius:99}}><div style={{height:"100%",width:`${p}%`,background:col,borderRadius:99}}/></div>
                  </div>
                </td>
              );})}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── HUNTER VIEW ─────────────────────────────────────────────────────────────
function HunterView({calls}) {
  const [name, setName] = useState(HUNTERS[0].name);
  const [sel,  setSel]  = useState(null);
  useEffect(()=>setSel(null), [name]);

  const hc = useMemo(()=>calls.filter(c=>c.hunter===name).sort((a,b)=>b.week-a.week||b.risk-a.risk), [calls,name]);
  const wkData = useMemo(()=>weekAgg(hc), [hc]);

  const dimAvgs = DIM_KEYS.map(k=>{
    const avg=hc.length?+(hc.reduce((s,c)=>s+(c[k]||0),0)/hc.length).toFixed(1):0;
    const recent=hc.filter(c=>c.week>=10); const older=hc.filter(c=>c.week>=3&&c.week<=6);
    const trend=recent.length&&older.length?+((recent.reduce((s,c)=>s+(c[k]||0),0)/recent.length)-(older.reduce((s,c)=>s+(c[k]||0),0)/older.length)).toFixed(1):0;
    return {key:k,label:DIM_LABELS[k],avg:+avg,trend};
  }).sort((a,b)=>a.avg-b.avg);

  const initAvgs = INITIATIVES.map(ini=>({...ini,pct:hc.length?Math.round(hc.filter(c=>c.initiatives[ini.key]).length/hc.length*100):0}));
  const overall  = hc.length?+(hc.reduce((s,c)=>s+c.avg,0)/hc.length).toFixed(1):0;
  const thisW    = hc.filter(c=>c.week===12);
  const thisWavg = thisW.length?+(thisW.reduce((s,c)=>s+c.avg,0)/thisW.length).toFixed(1):0;
  const critN    = hc.filter(c=>c.risk>=1.8).length;
  const wd=dimAvgs[0]; const sd=dimAvgs[dimAvgs.length-1];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Cap ch="Ver perfil de:" mb={0}/>
        <div style={{display:"flex",gap:6,marginLeft:8}}>
          {HUNTERS.map(h=>(
            <button key={h.name} onClick={()=>setName(h.name)}
              style={{background:name===h.name?C.text:C.card,color:name===h.name?C.card:C.muted,border:`1px solid ${name===h.name?C.text:C.border}`,borderRadius:8,padding:"6px 16px",fontSize:12,fontWeight:name===h.name?700:400,cursor:"pointer",transition:"all 0.12s"}}>
              {h.name.split(" ")[0]} <span style={{opacity:0.5,fontSize:10}}>{h.ini}</span>
            </button>
          ))}
        </div>
        <div style={{marginLeft:"auto",color:C.muted,fontSize:11}}>Cada hunter solo ve su propia vista</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[["SCORE ESTA SEMANA",thisWavg.toFixed(1),true,thisWavg>0&&thisWavg<7],["PROMEDIO 12 SEM.",overall.toFixed(1),true,false],["TOTAL CALLS",hc.length,false,false],["ALERTAS CRÍTICAS",critN,false,critN>0]].map(([l,v,mono,alert],i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${alert?C.redBd:C.border}`,borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <Cap ch={l}/><div style={{fontFamily:mono?"'JetBrains Mono',monospace":"inherit",fontSize:30,fontWeight:700,color:alert?C.red:C.text,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:12}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch="Evolución personal — 12 semanas"/>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={wkData} margin={{top:4,right:8,bottom:0,left:-20}}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3"/>
              <XAxis dataKey="label" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis domain={[4,10]} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:11}} cursor={{stroke:C.border}}/>
              <Line type="monotone" dataKey="avg" name="Score promedio" stroke={C.accent} strokeWidth={2} dot={{r:3,fill:C.accent}} connectNulls/>
              {wd&&<Line type="monotone" dataKey={wd.key} name={`Débil: ${wd.label}`} stroke={C.red} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls/>}
              {sd&&<Line type="monotone" dataKey={sd.key} name={`Fuerte: ${sd.label}`} stroke={C.borderHi} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls/>}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch="Dimensiones — promedio 12 sem."/>
          {dimAvgs.map(d=>(
            <div key={d.key} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <div style={{width:100,fontSize:11,color:C.muted}}>{d.label}</div>
              <div style={{flex:1,height:3,background:C.faint,borderRadius:99}}><div style={{height:"100%",width:`${d.avg*10}%`,background:d.avg<6.5?C.red:C.borderHi,borderRadius:99}}/></div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:d.avg<6.5?C.red:C.sub,width:28,textAlign:"right"}}>{d.avg}</div>
              <div style={{fontSize:11,fontWeight:700,width:18,textAlign:"center",color:d.trend>0.2?C.accent:d.trend<-0.2?C.red:C.muted}}>{d.trend>0.2?"↑":d.trend<-0.2?"↓":"·"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Cap ch="Iniciativas — cobertura personal" mb={0}/>
          <span style={{color:C.muted,fontSize:10}}>Objetivo: &gt;70%</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
          {initAvgs.map(ini=>{const col=ini.pct>=70?C.accent:ini.pct>=50?C.sub:C.red;return(
            <div key={ini.key} style={{background:ini.pct>=70?C.accentDim:ini.pct<50?C.redDim:C.faint,border:`1px solid ${ini.pct>=70?C.accentBd:ini.pct<50?C.redBd:C.border}`,borderRadius:10,padding:"12px 14px"}}>
              <div style={{color:C.muted,fontSize:9,marginBottom:8}}>{ini.label}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:col,lineHeight:1}}>{ini.pct}%</div>
              <div style={{width:"100%",height:2,background:C.border,borderRadius:99,marginTop:8}}><div style={{height:"100%",width:`${ini.pct}%`,background:col,borderRadius:99}}/></div>
            </div>
          );})}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:12}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <Cap ch="Reuniones recientes"/>
          <div style={{overflowY:"auto",maxHeight:480}}>
            {hc.slice(0,20).map(c=><CallRow key={c.id} call={c} onClick={()=>setSel(c)} active={sel?.id===c.id}/>)}
          </div>
        </div>
        <div style={{overflowY:"auto"}}>
          {sel?<CallDetail call={sel}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:C.muted,fontSize:13}}>Seleccioná una reunión para ver el detalle</div>}
        </div>
      </div>
    </div>
  );
}

// ─── ALL CALLS ────────────────────────────────────────────────────────────────
function AllCalls({calls, initial}) {
  const [sel,    setSel]    = useState(initial || calls[0]);
  const [filter, setFilter] = useState("todo");
  const [hunter, setHunter] = useState("todas");

  const vis = useMemo(()=>
    calls
      .filter(c=>hunter==="todas"||c.hunter.includes(hunter))
      .filter(c=>filter==="criticas"?c.risk>=1.8:filter==="high"?c.hs.potential==="high":filter==="cierre"?c.hs.stage==="cierre":true)
      .slice(0,100),
  [calls,filter,hunter]);

  const Btn=({label,active,onClick})=>(
    <button onClick={onClick} style={{background:active?C.text:C.card,color:active?C.card:C.muted,border:`1px solid ${active?C.text:C.border}`,borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:active?600:400,cursor:"pointer",transition:"all 0.12s"}}>{label}</button>
  );
  return (
    <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:14,height:"calc(100vh - 116px)"}}>
      <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
          <Btn label="Todas"         active={filter==="todo"}     onClick={()=>setFilter("todo")}/>
          <Btn label="Críticas"      active={filter==="criticas"} onClick={()=>setFilter("criticas")}/>
          <Btn label="High Potential"active={filter==="high"}     onClick={()=>setFilter("high")}/>
          <Btn label="En cierre"     active={filter==="cierre"}   onClick={()=>setFilter("cierre")}/>
        </div>
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          <Btn label="Todas"       active={hunter==="todas"}       onClick={()=>setHunter("todas")}/>
          <Btn label="María"       active={hunter==="María"}       onClick={()=>setHunter("María")}/>
          <Btn label="Martina"     active={hunter==="Martina"}     onClick={()=>setHunter("Martina")}/>
          <Btn label="Estefania"  active={hunter==="Estefania"}  onClick={()=>setHunter("Estefania")}/>
        </div>
        <div style={{overflowY:"auto",paddingRight:2}}>
          {vis.map(c=><CallRow key={c.id} call={c} onClick={()=>setSel(c)} active={sel?.id===c.id}/>)}
          {vis.length===0&&<div style={{color:C.muted,fontSize:12,padding:"12px 0"}}>No hay reuniones con estos filtros.</div>}
        </div>
      </div>
      <div style={{overflowY:"auto",paddingRight:2}}>
        {sel?<CallDetail call={sel}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:C.muted,fontSize:13}}>Seleccioná una reunión.</div>}
      </div>
    </div>
  );
}

// ─── LOADING / ERROR STATES ───────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <img src="https://worldteams.com/wp-content/uploads/2023/11/worldteams-logo-light.svg" alt="WorldTeams" style={{height:24,filter:"invert(1) brightness(0)",opacity:0.4}}/>
      <div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{color:C.muted,fontSize:12}}>Cargando datos…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorScreen({msg, onRetry}) {
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <img src="https://worldteams.com/wp-content/uploads/2023/11/worldteams-logo-light.svg" alt="WorldTeams" style={{height:24,filter:"invert(1) brightness(0)",opacity:0.4}}/>
      <div style={{color:C.red,fontSize:13,fontWeight:600}}>Error al conectar con la base de datos</div>
      <div style={{color:C.muted,fontSize:11,maxWidth:340,textAlign:"center"}}>{msg}</div>
      <button onClick={onRetry} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Reintentar</button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const {calls, loading, error, refresh} = useCallsData();
  const [tab,    setTab]    = useState("digest");
  const [passed, setPassed] = useState(null);
  const crits = useMemo(()=>getToday(calls).filter(c=>c.risk>=1.8), [calls]);

  const goToCall = c => { setPassed(c); setTab("all"); };
  const TABS = [{id:"digest",label:"Resumen del día"},{id:"weekly",label:"Semana del equipo"},{id:"hunter",label:"Por hunter"},{id:"all",label:"Todas las reuniones"}];

  if (loading) return <LoadingScreen/>;
  if (error)   return <ErrorScreen msg={error} onRetry={refresh}/>;

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`
        ${FONTS}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}
        button{font-family:'Plus Jakarta Sans',sans-serif}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      `}</style>
      <header style={{background:"rgba(244,247,251,0.94)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:20,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="https://worldteams.com/wp-content/uploads/2023/11/worldteams-logo-light.svg" alt="WorldTeams" style={{height:18,filter:"invert(1) brightness(0)"}}/>
          <span style={{width:1,height:16,background:C.border,display:"block"}}/>
          <span style={{color:C.muted,fontSize:12}}>Sales Intelligence</span>
          {crits.length>0&&<span style={{background:C.redDim,color:C.red,border:`1px solid ${C.redBd}`,borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>{crits.length} crítica{crits.length>1?"s":""}</span>}
        </div>
        <div style={{display:"flex",gap:1,background:C.faint,border:`1px solid ${C.border}`,borderRadius:10,padding:3}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{background:tab===t.id?C.card:"transparent",color:tab===t.id?C.text:C.muted,border:`1px solid ${tab===t.id?C.border:"transparent"}`,borderRadius:7,padding:"6px 16px",fontSize:12,fontWeight:tab===t.id?600:400,cursor:"pointer",transition:"all 0.12s",boxShadow:tab===t.id?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:C.muted,fontSize:11}}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</span>
          <button onClick={refresh} title="Actualizar datos" style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:7,width:28,height:28,cursor:"pointer",color:C.muted,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>↻</button>
        </div>
      </header>
      <main style={{padding:"18px 24px",maxWidth:1440,margin:"0 auto",animation:"fadeUp 0.3s ease"}} key={tab}>
        {tab==="digest"&&<Digest calls={calls} onSelect={goToCall}/>}
        {tab==="weekly"&&<WeeklyView calls={calls}/>}
        {tab==="hunter"&&<HunterView calls={calls}/>}
        {tab==="all"   &&<AllCalls calls={calls} initial={passed}/>}
      </main>
    </div>
  );
}
