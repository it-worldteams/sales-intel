import { DIM_KEYS, INITIATIVES, INI_MAP } from "./constants.js";
import { riskOf } from "./risk.js";

// Maps Supabase snake_case → dashboard camelCase
export function mapRow(row) {
  // Parse YYYY-MM-DD safely to avoid UTC shift
  const [y, m, d] = row.date.split("-").map(Number);
  const dt       = new Date(y, m - 1, d);
  const now      = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now - dt) / 86400000);
  const weekAgo  = Math.floor(diffDays / 7);
  const week     = Math.max(1, 13 - weekAgo);

  return {
    id:        row.id,
    hunter:    row.hunter,
    ini:       INI_MAP[row.hunter] || row.hunter.substring(0, 2).toUpperCase(),
    week,
    weekLabel: `S${week}`,
    date:      dt.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
    isoDate:   row.date,
    prospect:  row.prospect,
    deal:      row.deal,
    avg:       row.avg_score || 0,
    // Dimensions
    discovery:      row.discovery       || 0,
    businessImpact: row.business_impact  || 0,
    propuestaValor: row.propuesta_valor  || 0,
    objeciones:     row.objeciones       || 0,
    rapport:        row.rapport          || 0,
    nextSteps:      row.next_steps       || 0,
    closing:        row.closing          || 0,
    talkRatio:      row.talk_ratio       || 0,
    openQuestions:  row.open_questions   || 0,
    // HubSpot
    hs: {
      potential: row.hs_potential || null,
      stage:     row.hs_stage     || null,
      amount:    row.hs_amount    != null ? row.hs_amount : null,
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
    // Brief & feedback
    brief:    row.brief    || null,
    summary:  row.summary  || "",
    feedback: row.feedback || "",
    video:    row.link_video || "",
    // Risk
    risk: row.risk_score != null ? row.risk_score : null,
  };
}

export function getToday(calls) {
  if (!calls.length) return [];
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return calls.filter(c => c.isoDate === todayISO).sort((a, b) => (b.risk || 0) - (a.risk || 0));
}

export function getWeekGroups(calls) {
  const weeks = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, label: `S${i + 1}`, calls: [] }));
  calls.forEach(c => {
    const w = weeks.find(w => w.n === c.week);
    if (w) w.calls.push(c);
  });
  return weeks;
}

export function weekAgg(calls) {
  const weeks = getWeekGroups(calls);
  return weeks.map(w => {
    const wc  = w.calls;
    const avg = wc.length ? +(wc.reduce((s, c) => s + c.avg, 0) / wc.length).toFixed(1) : 0;
    const obj = { n: w.n, label: w.label, avg, calls: wc.length };
    for (const k of DIM_KEYS) {
      obj[k] = wc.length ? +(wc.reduce((s, c) => s + (c[k] || 0), 0) / wc.length).toFixed(1) : 0;
    }
    for (const ini of INITIATIVES) {
      obj[ini.key] = wc.length ? Math.round(wc.filter(c => c.initiatives[ini.key]).length / wc.length * 100) : 0;
    }
    return obj;
  });
}
