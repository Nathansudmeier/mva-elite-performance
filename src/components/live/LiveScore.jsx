import React from "react";

export default function LiveScore({ scoreHome, scoreAway, opponent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "8px 0" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.50)", marginBottom: 4 }}>MVA Noord</p>
        <span style={{ fontSize: 56, fontWeight: 800, color: "#fff", letterSpacing: "-2px", lineHeight: 1 }}>{scoreHome}</span>
      </div>
      <span style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.30)", letterSpacing: "-1px" }}>—</span>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.50)", marginBottom: 4 }}>{opponent || "Tegenstander"}</p>
        <span style={{ fontSize: 56, fontWeight: 800, color: "#fff", letterSpacing: "-2px", lineHeight: 1 }}>{scoreAway}</span>
      </div>
    </div>
  );
}