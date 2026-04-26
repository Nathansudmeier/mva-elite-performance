import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function AuteurBlok({ auteur }) {
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    if (!auteur) return;
    base44.entities.Trainer?.list?.().then(list => {
      const found = (list || []).find(t => (t.naam || "").toLowerCase() === auteur.toLowerCase());
      setStaff(found || null);
    }).catch(() => setStaff(null));
  }, [auteur]);

  if (!auteur) return null;

  const initialen = auteur.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const fotoUrl = staff?.foto_url;
  const functie = staff?.functie;
  const diploma = staff?.diploma;

  return (
    <div style={{
      background: "#161A24",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "6px",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginTop: "16px",
    }}>
      {fotoUrl ? (
        <img
          src={fotoUrl}
          alt={auteur}
          style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "#1B2A5E",
          border: "2px solid rgba(255,104,0,0.3)",
          fontFamily: "'Bebas Neue', serif",
          fontSize: "20px",
          color: "#FF6800",
          textAlign: "center",
          lineHeight: "48px",
          flexShrink: 0,
        }}>
          {initialen}
        </div>
      )}

      <div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "2px",
          marginBottom: "4px",
        }}>
          GESCHREVEN DOOR
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
          {auteur}
        </div>
        {functie && (
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
            {functie}
          </div>
        )}
        {diploma && (
          <span style={{
            fontSize: "10px",
            fontWeight: 700,
            background: "rgba(255,104,0,0.12)",
            color: "#FF6800",
            padding: "2px 7px",
            borderRadius: "3px",
            display: "inline-block",
            marginTop: "4px",
          }}>
            {diploma}
          </span>
        )}
      </div>
    </div>
  );
}