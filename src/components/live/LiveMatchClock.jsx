import React from "react";

export default function LiveMatchClock({ seconds, running, onToggle, onStop }) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-5">
      <div style={{ fontSize: 56, fontWeight: 700, color: "#fff", letterSpacing: "-2px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {mins}:{secs}
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={onToggle}
          style={{
            flex: 1,
            height: 44,
            background: "rgba(255,255,255,0.12)",
            border: "0.5px solid rgba(255,255,255,0.20)",
            color: "#fff",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <i className={`ti ti-${running ? "player-pause" : "player-play"}`} style={{ fontSize: 18 }} />
          {running ? "Pauze" : "Hervatten"}
        </button>
        <button
          onClick={onStop}
          style={{
            flex: 1,
            height: 44,
            background: "rgba(248,113,113,0.20)",
            border: "0.5px solid rgba(248,113,113,0.35)",
            color: "#f87171",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <i className="ti ti-player-stop" style={{ fontSize: 18 }} />
          Stop
        </button>
      </div>
    </div>
  );
}