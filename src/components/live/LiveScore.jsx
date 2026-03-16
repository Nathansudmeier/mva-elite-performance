import React from "react";

export default function LiveScore({ scoreHome, scoreAway, opponent }) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2F3650" }}>MVA Noord</p>
        <span className="text-6xl font-black" style={{ color: "#D45A30" }}>{scoreHome}</span>
      </div>
      <span className="text-4xl font-black" style={{ color: "#1A1F2E" }}>—</span>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2F3650" }}>{opponent}</p>
        <span className="text-6xl font-black" style={{ color: "#1A1F2E" }}>{scoreAway}</span>
      </div>
    </div>
  );
}