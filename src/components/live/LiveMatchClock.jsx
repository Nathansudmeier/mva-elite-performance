import React from "react";
import { Pause, Play, Square } from "lucide-react";

export default function LiveMatchClock({ seconds, running, onToggle, onStop }) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-7xl font-black tracking-tighter" style={{ color: "#1A1F2E", fontVariantNumeric: "tabular-nums" }}>
        {mins}:{secs}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all"
          style={{ backgroundColor: running ? "#F0926E" : "#4CAF82" }}
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pauze" : "Hervatten"}
        </button>
        <button
          onClick={onStop}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all"
          style={{ backgroundColor: "#C0392B" }}
        >
          <Square size={18} />
          Stop
        </button>
      </div>
    </div>
  );
}