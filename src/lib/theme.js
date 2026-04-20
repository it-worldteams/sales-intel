import { useState, useEffect, useCallback } from "react";

const LIGHT = {
  bg:       "#FFF9F5",
  card:     "#FFFFFF",
  faint:    "rgba(214,183,172,0.15)",
  border:   "rgba(20,45,43,0.08)",
  borderHi: "rgba(20,45,43,0.18)",
  text:     "#131313",
  sub:      "#142D2B",
  muted:    "#57978E",
  accent:   "#57978E",
  accentDim:"rgba(87,151,142,0.12)",
  accentBd: "rgba(87,151,142,0.3)",
  red:      "#FB00AA",
  redDim:   "rgba(251,0,170,0.08)",
  redBd:    "rgba(251,0,170,0.25)",
  amber:    "#3E0D2A",
  amberDim: "rgba(62,13,42,0.06)",
  amberBd:  "rgba(62,13,42,0.2)",
};

const DARK = {
  bg:       "#131313",
  card:     "rgba(20,45,43,0.4)",
  faint:    "rgba(62,13,42,0.5)",
  border:   "rgba(87,151,142,0.2)",
  borderHi: "rgba(87,151,142,0.4)",
  text:     "#FFF9F5",
  sub:      "#D6B7AC",
  muted:    "rgba(255,249,245,0.6)",
  accent:   "#D2F176",
  accentDim:"rgba(210,241,118,0.15)",
  accentBd: "rgba(210,241,118,0.3)",
  red:      "#FFC0FC",
  redDim:   "rgba(255,192,252,0.15)",
  redBd:    "rgba(255,192,252,0.3)",
  amber:    "#D6B7AC",
  amberDim: "rgba(214,183,172,0.15)",
  amberBd:  "rgba(214,183,172,0.3)",
};

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');`;

// Mutable reference — updated by useTheme hook
export let C = { ...LIGHT };

// Listeners for re-renders
let listeners = [];

function notify() {
  listeners.forEach(fn => fn());
}

export function useTheme() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);

  const isDark = C.bg === DARK.bg;

  const toggle = useCallback(() => {
    const next = isDark ? LIGHT : DARK;
    Object.assign(C, next);
    localStorage.setItem("sales-intel-theme", isDark ? "light" : "dark");
    notify();
  }, [isDark]);

  // Init from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem("sales-intel-theme");
    if (saved === "dark" && !isDark) {
      Object.assign(C, DARK);
      notify();
    }
  }, []);

  return { isDark, toggle };
}
