import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const GROUP_COLOR_MAP = {
  red: "#f87171",
  orange: "#FF8C3A",
  yellow: "#fbbf24",
  green: "#4ade80",
  blue: "#60a5fa",
  white: "#ffffff",
};

export default function TodayTrainingCard({ playerId }) {
  const today = new Date().toISOString().split("T")[0];

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["agendaItems"],
    queryFn: () => base44.entities.AgendaItem.filter({ type: "Training", date: today }),
  });

  const todayTraining = agendaItems[0];

  if (!todayTraining) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", borderRadius: "18px" }}>
        <i className="ti ti-moon" style={{ fontSize: "20px", color: "rgba(255,255,255,0.30)" }} />
        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.40)" }}>Geen training vandaag</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", background: "rgba(255,107,0,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "0.5px solid rgba(255,107,0,0.35)", borderRadius: "22px", overflow: "hidden", padding: "16px" }}>
      {/* Shine line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", pointerEvents: "none" }} />

      <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Vandaag op de training</p>

      <p style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", marginBottom: "12px", lineHeight: 1.3 }}>{todayTraining.title}</p>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>
        <i className="ti ti-clock" style={{ fontSize: "16px" }} />
        {todayTraining.start_time}
        {todayTraining.location && (
          <>
            <span>•</span>
            <i className="ti ti-map-pin" style={{ fontSize: "16px" }} />
            {todayTraining.location}
          </>
        )}
      </div>
    </div>
  );
}