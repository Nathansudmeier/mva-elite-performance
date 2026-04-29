import React from "react";
import { MapPin } from "@phosphor-icons/react";

const TIJDEN_STANDAARD = [
  { dag: "Maandag", tijd: "18:45 – 20:15", omschrijving: "Loop- & performancetraining (eerste blok)" },
  { dag: "Woensdag", tijd: "19:30 – 21:00", omschrijving: null },
  { dag: "Vrijdag", tijd: "18:30 – 20:00", omschrijving: null },
];

const TIJDEN_MO15 = [
  { dag: "Maandag", tijd: "17:30 – 18:30", omschrijving: "Loop- & performancetraining" },
  { dag: "Woensdag", tijd: "18:15 – 19:45", omschrijving: null },
  { dag: "Vrijdag", tijd: "17:00 – 18:15", omschrijving: null },
];

export { TIJDEN_STANDAARD, TIJDEN_MO15 };

export default function TrainingsTijdenBlok({ tijden = TIJDEN_STANDAARD }) {
  return (
    <div style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "24px" }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#FF6800", marginBottom: "6px" }}>TRAININGEN</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#fff", marginBottom: "20px" }}>WANNEER TRAINEN WE?</div>

      {tijden.map((rij, i, arr) => (
        <div key={i} style={{
          paddingBottom: i < arr.length - 1 ? "12px" : 0,
          marginBottom: i < arr.length - 1 ? "12px" : 0,
          borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{rij.dag}</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{rij.tijd}</div>
          {rij.omschrijving && (
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginTop: "2px" }}>{rij.omschrijving}</div>
          )}
        </div>
      ))}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px", marginTop: "16px" }}>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Sportpark+Douwekamp+Healwei+2+Opeinde"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#fff" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#FF6800"; e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.textDecoration = "none"; }}
        >
          <MapPin weight="bold" size={16} color="#FF6800" style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 500 }}>Sportpark Douwekamp, Opeinde</span>
        </a>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px", paddingLeft: "24px" }}>Klik voor routebeschrijving →</div>
      </div>
    </div>
  );
}