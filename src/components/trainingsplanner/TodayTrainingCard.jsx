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

  const { data: plans = [] } = useQuery({
    queryKey: ["trainingPlans"],
    queryFn: () => base44.entities.TrainingPlan.list(),
  });

  const todayPlan = plans.find(p => p.date === today);

  if (!todayPlan || !(todayPlan.exercises?.length > 0)) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a" }}>
        <i className="ti ti-moon" style={{ fontSize: "20px", color: "rgba(26,26,26,0.30)" }} />
        <span style={{ fontSize: "13px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>Geen training vandaag</span>
      </div>
    );
  }

  return (
    <div style={{ background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

      <div>
        <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "4px" }}>Vandaag op de training</p>
        {todayPlan.objective && (
          <p style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3 }}>{todayPlan.objective}</p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {(todayPlan.exercises || []).map((ex, i) => {
          const playerGroup = (ex.groups || []).find(g => g.player_ids?.includes(playerId));
          const groupColor = playerGroup ? (GROUP_COLOR_MAP[playerGroup.color] || "#FF8C3A") : null;

          return (
            <div key={ex.id || i} style={{ background: "rgba(0,0,0,0.10)", border: "1.5px solid rgba(26,26,26,0.15)", borderRadius: "12px", overflow: "hidden" }}>
              {ex.field_photo && (
                <img src={ex.field_photo} alt="" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", display: "block" }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(26,26,26,0.15)", border: "1.5px solid rgba(26,26,26,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "#1a1a1a" }}>{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{ex.name || "Oefenvorm"}</span>
                    {playerGroup ? (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "rgba(26,26,26,0.15)", border: "1px solid rgba(26,26,26,0.25)", color: "#1a1a1a", whiteSpace: "nowrap" }}>
                        {playerGroup.name}
                      </span>
                    ) : null}
                  </div>
                </div>
                {ex.duration_minutes > 0 && (
                  <span style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", fontWeight: 600, flexShrink: 0 }}>{ex.duration_minutes} min</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}