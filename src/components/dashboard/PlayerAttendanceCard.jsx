import React from "react";

export default function PlayerAttendanceCard({ percentage, present, total }) {
  let bg, border, textColor, title, subtitle;

  if (percentage >= 85) {
    bg = "#08D068"; border = "#1a1a1a"; textColor = "#1a1a1a";
    title = "Je bent er bijna altijd. Dat maakt het verschil. 🔥";
    subtitle = null;
  } else if (percentage >= 60) {
    bg = "#FFD600"; border = "#1a1a1a"; textColor = "#1a1a1a";
    title = "Elke training telt. Kom je volgende keer?";
    subtitle = "Meer trainingen = meer groei. Je zit op de goede weg.";
  } else {
    bg = "#FF3DA8"; border = "#1a1a1a"; textColor = "#ffffff";
    title = "We missen je op de training.";
    subtitle = "Je team wordt sterker als jij er bent.";
  }

  return (
    <div style={{
      background: bg, border: `2.5px solid ${border}`,
      borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a",
      padding: "1rem", overflow: "hidden",
    }}>
      <p style={{ fontSize: "9px", fontWeight: 800, color: textColor, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "8px" }}>
        Jouw aanwezigheid
      </p>

      <p style={{ fontSize: "42px", fontWeight: 900, color: textColor, letterSpacing: "-2px", lineHeight: 1, marginBottom: "4px" }}>
        {Math.round(percentage)}%
      </p>

      <p style={{ fontSize: "12px", color: textColor, opacity: 0.65, marginBottom: "14px" }}>
        {present} van de {total} trainingen
      </p>

      {/* Progress bar */}
      <div style={{ height: "5px", background: "rgba(26,26,26,0.15)", borderRadius: "3px", marginBottom: "14px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.round(percentage)}%`,
          background: textColor === "#ffffff" ? "rgba(255,255,255,0.80)" : "rgba(26,26,26,0.50)",
          borderRadius: "3px", transition: "width 0.3s ease",
        }} />
      </div>

      <p style={{ fontSize: "14px", fontWeight: 700, color: textColor, marginBottom: "4px", lineHeight: 1.4 }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: "12px", color: textColor, opacity: 0.7, lineHeight: 1.4 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}