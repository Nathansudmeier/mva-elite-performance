import React from "react";

export default function PlayerAttendanceCard({ percentage, present, total }) {
  let bgColor, borderColor, percentColor, gradientStart, gradientEnd, title, subtitle;

  if (percentage >= 85) {
    bgColor = "rgba(74,222,128,0.10)";
    borderColor = "rgba(74,222,128,0.22)";
    percentColor = "#4ade80";
    gradientStart = "#4ade80";
    gradientEnd = "#22d3ee";
    title = "Je bent er bijna altijd. Dat maakt het verschil.";
    subtitle = null;
  } else if (percentage >= 60) {
    bgColor = "rgba(255,107,0,0.12)";
    borderColor = "rgba(255,107,0,0.25)";
    percentColor = "#FF8C3A";
    gradientStart = "#FF6B00";
    gradientEnd = "#FF9500";
    title = "Elke training telt. Kom je volgende keer?";
    subtitle = "Meer trainingen = meer groei. Je zit op de goede weg.";
  } else {
    bgColor = "rgba(251,191,36,0.10)";
    borderColor = "rgba(251,191,36,0.22)";
    percentColor = "#fbbf24";
    gradientStart = "#fbbf24";
    gradientEnd = "#f59e0b";
    title = "We missen je op de training.";
    subtitle = "Je team wordt sterker als jij er bent. Probeer de komende weken wat vaker aan te sluiten.";
  }

  return (
    <div style={{
      position: "relative",
      background: bgColor,
      border: `0.5px solid ${borderColor}`,
      borderRadius: "18px",
      padding: "16px",
      overflow: "hidden"
    }}>
      {/* Shine line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", pointerEvents: "none" }} />

      <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Jouw aanwezigheid</p>

      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
        <p style={{ fontSize: "32px", fontWeight: 800, color: percentColor, lineHeight: 1 }}>{Math.round(percentage)}%</p>
      </div>

      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "12px" }}>{present} van de {total} trainingen</p>

      {/* Progress bar */}
      <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", marginBottom: "12px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${Math.round(percentage)}%`,
          background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
          borderRadius: "2px",
          transition: "width 0.3s ease"
        }} />
      </div>

      {/* Last 10 trainings dots */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", alignItems: "center" }}>
        {/* This would be populated with actual attendance data */}
        {[...Array(Math.min(10, total))].map((_, i) => (
          <div
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: i < present ? "#4ade80" : "rgba(255,255,255,0.15)",
              flexShrink: 0
            }}
          />
        ))}
      </div>

      <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", marginBottom: "6px", lineHeight: 1.4 }}>
        {title}
      </p>

      {subtitle && (
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.60)", lineHeight: 1.4 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}