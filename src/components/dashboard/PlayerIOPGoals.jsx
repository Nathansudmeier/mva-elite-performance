import React from "react";
import { Target } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "In progress", color: "#FF6B00" },
  { label: "Op schema", color: "#3B6D11" },
];

export default function PlayerIOPGoals({ player }) {
  if (!player) return null;
  const goals = [player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean);
  if (goals.length === 0) return null;

  const GOAL_COLORS = ["#FF6800", "#08D068", "#00C2FF"];

  return (
    <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "2px 2px 0 #1a1a1a" }}>
          <i className="ti ti-target" style={{ fontSize: "18px", color: "#ffffff" }} />
        </div>
        <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Mijn Leerdoelen</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {goals.map((goal, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "rgba(26,26,26,0.04)", border: "1.5px solid rgba(26,26,26,0.10)", borderRadius: "14px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: GOAL_COLORS[i] || "#FF6800", border: "1.5px solid #1a1a1a", flexShrink: 0, marginTop: "3px" }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.5, flex: 1 }}>{goal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}