import React from "react";

const EMVI_TOP  = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/872aa9a59_Emvi-top.png";
const EMVI_MWA  = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/a5e42083e_Emvi-mwa.png";
const EMVI_FLOP = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/1e4a3ca9b_Emvi-flop.png";

export default function PlayerAttendanceCard({ percentage, present, total }) {
  let bg, textColor, title, subtitle, emvi;

  if (percentage >= 85) {
    bg = "#08D068"; textColor = "#1a1a1a";
    title = "Je bent er bijna altijd. Dat maakt het verschil. 🔥";
    subtitle = null;
    emvi = EMVI_TOP;
  } else if (percentage >= 60) {
    bg = "#FFD600"; textColor = "#1a1a1a";
    title = "Elke training telt. Kom je volgende keer?";
    subtitle = "Meer trainingen = meer groei. Je zit op de goede weg.";
    emvi = EMVI_MWA;
  } else {
    bg = "#FF3DA8"; textColor = "#ffffff";
    title = "We missen je op de training.";
    subtitle = "Je team wordt sterker als jij er bent.";
    emvi = EMVI_FLOP;
  }

  return (
    <div style={{
      background: bg, border: "2.5px solid #1a1a1a",
      borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a",
      padding: "1rem", overflow: "hidden", position: "relative",
    }}>
      {/* Emvi karakter */}
      <img
        src={emvi}
        alt="Emvi"
        style={{
          position: "absolute", bottom: 0, right: "-8px",
          height: "130px", width: "auto", objectFit: "contain",
          pointerEvents: "none",
        }}
      />

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
      <div style={{ height: "5px", background: "rgba(26,26,26,0.15)", borderRadius: "3px", marginBottom: "14px", overflow: "hidden", maxWidth: "70%" }}>
        <div style={{
          height: "100%", width: `${Math.round(percentage)}%`,
          background: textColor === "#ffffff" ? "rgba(255,255,255,0.80)" : "rgba(26,26,26,0.50)",
          borderRadius: "3px", transition: "width 0.3s ease",
        }} />
      </div>

      <p style={{ fontSize: "14px", fontWeight: 700, color: textColor, marginBottom: "4px", lineHeight: 1.4, maxWidth: "65%" }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: "12px", color: textColor, opacity: 0.7, lineHeight: 1.4, maxWidth: "65%" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}