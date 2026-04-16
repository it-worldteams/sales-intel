import { C } from "./theme.js";

const POT_W   = { high: 1.0, mid: 0.6, low: 0.3 };
const STAGE_W = { cierre: 1.0, propuesta: 0.8, discovery: 0.5 };

export function riskOf(c) {
  const gap = Math.max(0, 8.5 - (c.avg || 0));
  return +(gap * (
    (POT_W[c.hs.potential]  || 0.3) * 0.40 +
    (STAGE_W[c.hs.stage]    || 0.5) * 0.35 +
    Math.min((c.hs.amount || 0) / 50000, 1) * 0.25
  )).toFixed(2);
}

export function riskMeta(r) {
  if (r == null) return { label: "SIN DATA", col: C.muted, bg: "transparent", bd: C.border };
  if (r >= 1.8) return { label: "CRÍTICO", col: C.red,   bg: C.redDim,      bd: C.redBd };
  if (r >= 1.0) return { label: "ALTO",    col: C.muted,  bg: C.faint,       bd: C.border };
  if (r >= 0.4) return { label: "MEDIO",   col: C.muted,  bg: "transparent", bd: C.border };
  return               { label: "OK",      col: C.muted,  bg: "transparent", bd: C.border };
}

export const stageLbl  = s => s ? (({ cierre: "Cierre", propuesta: "Propuesta", discovery: "Discovery" })[s] || s) : "No hay data";
export const fmtAmt    = n => n != null ? `$${((n || 0) / 1000).toFixed(0)}k` : "No hay data";
export const scoreCol  = v => v < 6.5 ? C.red : v < 7.5 ? C.sub : C.text;
