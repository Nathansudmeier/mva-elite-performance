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

      {todayPlan.objective && (
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", marginBottom: "12px", lineHeight: 1.3 }}>{todayPlan.objective}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {(todayPlan.exercises || []).map((ex, i) => {
          const playerGroup = (ex.groups || []).find(g => g.player_ids?.includes(playerId));
          const groupColor = playerGroup ? (GROUP_COLOR_MAP[playerGroup.color] || "#FF8C3A") : null;

          return (
            <div key={ex.id || i} style={{ background: "rgba(0,0,0,0.18)", borderRadius: "12px", overflow: "hidden" }}>
              {/* Foto bovenaan als aanwezig */}
              {ex.field_photo && (
                <img src={ex.field_photo} alt="" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", display: "block" }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>{ex.name || "Oefenvorm"}</span>
                    {playerGroup ? (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: groupColor + "30", border: `0.5px solid ${groupColor}`, color: groupColor, whiteSpace: "nowrap" }}>
                        {playerGroup.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
                        Niet ingedeeld
                      </span>
                    )}
                  </div>
                </div>
                {ex.duration_minutes > 0 && (
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>{ex.duration_minutes} min</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}