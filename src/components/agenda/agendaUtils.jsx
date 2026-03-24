export const TYPE_CONFIG = {
  Training:  { color: "#08D068", bg: "#08D068",  border: "#1a1a1a"  },
  Wedstrijd: { color: "#FF6800", bg: "#FF6800",  border: "#1a1a1a"  },
  Toernooi:  { color: "#FFD600", bg: "#FFD600",  border: "#1a1a1a"  },
  Evenement: { color: "#9B5CFF", bg: "#9B5CFF",  border: "#1a1a1a"  },
};

// Team-specific card backgrounds voor wedstrijden
export const TEAM_MATCH_COLORS = {
  "MO17":    { cardBg: "#00C2FF", labelBg: "#1a1a1a", labelColor: "#ffffff" },
  "Dames 1": { cardBg: "#FF3DA8", labelBg: "#1a1a1a", labelColor: "#ffffff" },
  "Beide":   { cardBg: "#FF6800", labelBg: "#1a1a1a", labelColor: "#ffffff" },
};

export const TEAM_COLORS = {
  "MO17":    { bg: "#00C2FF", color: "#1a1a1a" },
  "Dames 1": { bg: "#FF3DA8", color: "#ffffff" },
  "Beide":   { bg: "rgba(26,26,26,0.10)", color: "#1a1a1a" },
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