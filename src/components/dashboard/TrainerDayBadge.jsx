import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { addDays } from "date-fns";

function getDayType(sessions, matches) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = addDays(new Date(), 1).toISOString().split("T")[0];

  const isMatchToday = matches.some(m => m.date === today);
  const isTrainingToday = sessions.some(s => s.date === today && s.type === "Training");
  const isMatchTomorrow = matches.some(m => m.date === tomorrow);

  if (isMatchToday) return "match";
  if (isTrainingToday) return "training";
  if (isMatchTomorrow) return "matchmorgen";
  return "rust";
}

export default function TrainerDayBadge() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["trainingSessions"],
    queryFn: () => base44.entities.TrainingSession.list(),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list(),
  });

  const dayType = getDayType(sessions, matches);

  const configs = {
    training: {
      label: "Trainingsdag",
      subline: "Vandaag staat er een training gepland",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.25)",
      color: "#4ade80",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#4ade80">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    match: {
      label: "Matchday",
      subline: "Vandaag is het wedstrijddag — succes!",
      bg: "rgba(255,107,0,0.15)",
      border: "rgba(255,107,0,0.30)",
      color: "#FF8C3A",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#FF8C3A">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
    },
    matchmorgen: {
      label: "Trainingsdag",
      subline: "Morgen is er een wedstrijd — goede voorbereiding!",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.25)",
      color: "#4ade80",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#4ade80">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    rust: {
      label: "Rustdag",
      subline: "Geen training of wedstrijd vandaag",
      bg: "rgba(96,165,250,0.12)",
      border: "rgba(96,165,250,0.25)",
      color: "#60a5fa",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#60a5fa">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ),
    },
  };

  const c = configs[dayType];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: "16px" }}>
      {c.icon}
      <span style={{ fontSize: "13px", fontWeight: 600, color: c.color }}>{c.label}</span>
      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.50)" }}>{c.subline}</span>
    </div>
  );
}