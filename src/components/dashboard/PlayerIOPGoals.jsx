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

  return (
    <div className="glass p-4">
      <p className="t-label mb-3">Mijn Leerdoelen</p>
      <div className="space-y-3">
        {goals.map((goal, i) => {
          const status = STATUS_OPTIONS[i % STATUS_OPTIONS.length];
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: status.color }} />
              <div>
                <p style={{ fontSize: 13, color: "#ffffff", lineHeight: 1.5 }}>{goal}</p>
                <p style={{ fontSize: 11, color: status.color, marginTop: "2px", fontWeight: 600 }}>{status.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}