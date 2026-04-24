import React from "react";

const STATS = [
  { waarde: "3×", label: "Training per week" },
  { waarde: "100%", label: "Meidenvoetbal" },
  { waarde: "2025", label: "Opgericht" },
  { waarde: "∞", label: "Ambitie" },
];

export default function AmbitieSectie() {
  return (
    <section style={{ background: "#10121A", padding: "64px 28px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>ONZE AMBITIE</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", color: "#fff", marginBottom: "32px" }}>
          BOUWEN AAN IETS GROTERS.
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: "40px", maxWidth: "720px" }}>
          MV Artemis is meer dan een club. We bouwen een platform waar meiden zich als voetballer én als mens ontwikkelen, met structuur, ambitie en een heldere koers richting de top van het Nederlandse meidenvoetbal.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: "#1B2036", borderRadius: "8px", padding: "24px 20px", borderLeft: "3px solid #FF6800" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "44px", color: "#fff", lineHeight: 1, marginBottom: "6px" }}>{s.waarde}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}