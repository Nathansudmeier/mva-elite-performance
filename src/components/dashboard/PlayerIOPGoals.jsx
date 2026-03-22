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
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(234,179,8,0.15)", border: "0.5px solid rgba(234,179,8,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#FF8C3A"/></linearGradient></defs>
            <circle cx="12" cy="12" r="10" stroke="url(#goalGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="6" stroke="url(#goalGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="2" stroke="url(#goalGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="t-label">Mijn Leerdoelen</p>
      </div>
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