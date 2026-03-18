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
    <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
      <h2 className="font-medium text-sm uppercase tracking-wide text-[#FF6B00] mb-3 flex items-center gap-2">
        <Target size={14} /> Mijn Leerdoelen
      </h2>
      <div className="space-y-3">
        {goals.map((goal, i) => {
          const status = STATUS_OPTIONS[i % STATUS_OPTIONS.length];
          return (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: status.color }}
              />
              <div>
                <p style={{ fontSize: 13 }} className="text-[#1A1A1A] leading-snug">{goal}</p>
                <p style={{ fontSize: 11, color: status.color }} className="mt-0.5 font-medium">
                  {status.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}