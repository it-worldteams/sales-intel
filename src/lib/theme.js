import { useState, useEffect, useCallback } from "react";

const LIGHT = {
  bg:       "#f4f7fb",
  card:     "#ffffff",
  faint:    "#eef2f8",
  border:   "#dde5f0",
  borderHi: "#b8cade",
  text:     "#0e1823",
  sub:      "#4a6478",
  muted:    "#90a8bc",
  accent:   "#009a56",
  accentDim:"rgba(0,154,86,0.08)",
  accentBd: "rgba(0,154,86,0.2)",
  red:      "#cc2238",
  redDim:   "rgba(204,34,56,0.06)",
  redBd:    "rgba(204,34,56,0.22)",
  amber:    "#9a6200",
  amberDim: "rgba(154,98,0,0.07)",
  amberBd:  "rgba(154,98,0,0.2)",
};

const DARK = {
  bg:       "#0c1017",
  card:     "#151b25",
  faint:    "#1a2230",
  border:   "#253040",
  borderHi: "#3a4d65",
  text:     "#e4eaf2",
  sub:      "#94a8be",
  muted:    "#5c7590",
  accent:   "#2dd47a",
  accentDim:"rgba(45,212,122,0.1)",
  accentBd: "rgba(45,212,122,0.22)",
  red:      "#f0465a",
  redDim:   "rgba(240,70,90,0.1)",
  redBd:    "rgba(240,70,90,0.25)",
  amber:    "#e5a220",
  amberDim: "rgba(229,162,32,0.1)",
  amberBd:  "rgba(229,162,32,0.22)",
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
