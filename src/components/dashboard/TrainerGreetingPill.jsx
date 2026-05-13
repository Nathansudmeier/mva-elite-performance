import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { addDays } from "date-fns";

function getDayType(agendaItems) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = addDays(new Date(), 1).toISOString().split("T")[0];

  const isMatchToday = agendaItems.some(ai => ai.date === today && (ai.type === "Wedstrijd" || ai.type === "Toernooi") && !ai.cancelled);
  const isTrainingToday = agendaItems.some(ai => ai.date === today && ai.type === "Training" && !ai.cancelled);
  const isMatchTomorrow = agendaItems.some(ai => ai.date === tomorrow && (ai.type === "Wedstrijd" || ai.type === "Toernooi") && !ai.cancelled);

  if (isMatchToday) return "match";
  if (isTrainingToday) return "training";
  if (isMatchTomorrow) return "matchmorgen";
  return "rust";
}

export default function TrainerGreetingPill() {
  const { data: agendaItems = [] } = useQuery({
    queryKey: ["agenda-items"],
    queryFn: () => base44.entities.AgendaItem.list(),
  });

  const dayType = getDayType(agendaItems);

  const configs = {
    training: {
      label: "Training",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.25)",
      color: "#4ade80",
      icon: "ti-clock",
    },
    match: {
      label: "Matchday",
      bg: "rgba(255,107,0,0.15)",
      border: "rgba(255,107,0,0.30)",
      color: "#FF8C3A",
      icon: "ti-trophy",
    },
    matchmorgen: {
      label: "Training",
      bg: "rgba(74,222,128,0.12)",
      border: "rgba(74,222,128,0.25)",
      color: "#4ade80",
      icon: "ti-clock",
    },
    rust: {
      label: "Rustdag",
      bg: "rgba(96,165,250,0.12)",
      border: "rgba(96,165,250,0.25)",
      color: "#60a5fa",
      icon: "ti-moon",
    },
  };

  const c = configs[dayType];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      borderRadius: "20px",
      padding: "5px 14px",
      background: "#1A6FFF",
      border: "2px solid #1a1a1a",
      fontSize: "12px",
      fontWeight: 800,
      color: "#ffffff"
    }}>
      <i className={`ti ${c.icon}`} style={{ fontSize: "12px" }} />
      {c.label}
    </span>
  );
}