export const DIM_KEYS = [
  "discovery","businessImpact","propuestaValor","objeciones",
  "rapport","nextSteps","closing","talkRatio","openQuestions"
];

export const DIM_LABELS = {
  discovery:      "Discovery",
  businessImpact: "Business Impact",
  propuestaValor: "Propuesta de Valor",
  objeciones:     "Objeciones",
  rapport:        "Rapport",
  nextSteps:      "Next Steps",
  closing:        "Closing",
  talkRatio:      "Talk Ratio",
  openQuestions:  "Preg. Abiertas",
};

export const INITIATIVES = [
  { key: "timezone",   label: "Same time zone" },
  { key: "nearshore",  label: "Nearshore" },
  { key: "roi",        label: "ROI / ahorro" },
  { key: "top3",       label: "Top 3%" },
  { key: "garantia",   label: "Garantía" },
  { key: "onboarding", label: "Onboarding 72hs" },
];

export const HUNTERS = [
  { name: "Martina Zajdman",    ini: "MZ" },
  { name: "Estefania Lapenna",  ini: "EL" },
];

export const INI_MAP = Object.fromEntries(
  HUNTERS.map(h => [h.name, h.ini])
);
