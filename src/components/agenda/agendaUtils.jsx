export const TYPE_CONFIG = {
  Training:  { color: "#4ade80", bg: "rgba(74,222,128,0.15)",  border: "rgba(74,222,128,0.3)"  },
  Wedstrijd: { color: "#FF8C3A", bg: "rgba(255,140,58,0.15)",  border: "rgba(255,140,58,0.3)"  },
  Toernooi:  { color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.3)"  },
  Evenement: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.3)"  },
};

export const TEAM_COLORS = {
  "MO17":    { bg: "rgba(255,140,58,0.15)", color: "#FF8C3A" },
  "Dames 1": { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
  "Beide":   { bg: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)" },
};

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}