import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function ScoreBar({ bericht, settings }) {
  const [match, setMatch] = useState(null);

  useEffect(() => {
    if (!bericht || bericht.team === "Alle" || bericht.categorie !== "Wedstrijdverslag") return;

    base44.functions.invoke('getWebsiteData', {}).then(res => {
      const items = res?.data?.wedstrijden || [];
      const berichtDatum = new Date(bericht.datum);
      const found = items.find(item => {
        if (item.type !== "Wedstrijd") return false;
        const itemDatum = new Date(item.date);
        const verschil = Math.abs((itemDatum - berichtDatum) / (1000 * 60 * 60 * 24));
        if (verschil > 3) return false;
        const titelLower = (item.title || "").toLowerCase();
        return titelLower.length > 0;
      });
      setMatch(found || null);
    }).catch(() => setMatch(null));
  }, [bericht]);

  if (!bericht || bericht.team === "Alle" || bericht.categorie !== "Wedstrijdverslag" || !match) {
    return null;
  }

  // Probeer score te vinden in titel of notes
  const scoreMatch = (bericht.titel + " " + (bericht.inhoud || "")).match(/(\d+)\s*[-–]\s*(\d+)/);
  const score = scoreMatch ? `${scoreMatch[1]} - ${scoreMatch[2]}` : "- : -";

  const tegenstander = match.title.replace(/MV Artemis/i, "").replace(/[-–vs.]/g, "").trim() || match.title;
  const datum = new Date(match.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{
      background: "#1B2A5E",
      padding: "16px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "32px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {settings?.logo_url && <img src={settings.logo_url} alt="MV Artemis" style={{ width: "28px", height: "28px", objectFit: "contain" }} />}
        <span style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "18px", color: "#fff" }}>MV Artemis</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <span style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "36px", color: "#fff", lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase" }}>
          {bericht.team} · {datum}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: "row-reverse" }}>
        {match.opponent_logo_url && <img src={match.opponent_logo_url} alt={tegenstander} style={{ width: "28px", height: "28px", objectFit: "contain" }} />}
        <span style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "18px", color: "rgba(255,255,255,0.6)" }}>{tegenstander}</span>
      </div>
    </div>
  );
}