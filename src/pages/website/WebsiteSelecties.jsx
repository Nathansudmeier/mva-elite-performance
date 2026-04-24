import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

async function fetchWebsiteData() {
  const res = await base44.functions.invoke('getWebsiteData', {});
  return res.data;
}

const TEAMS = [
  { team: "MO17", href: "/mo17", accent: "#FF6800", titel: "Hier begin je.", sub: "Jongenscompetitie. Maximale intensiteit. Hier wordt talent gevormd dat elders niet gemaakt wordt.", footer: "Landelijke Divisie 1" },
  { team: "MO20", href: "/mo20", accent: "#FFD600", titel: "De schakel omhoog.", sub: "Je hebt de basis. Nu gaat het om consistentie onder druk.", footer: "Seizoen 2026/27" },
  { team: "Vrouwen 1", href: "/vrouwen-1", accent: "#FFFFFF", titel: "Hier speel je het.", sub: "Het vlaggenschip. Tactische flexibiliteit, winnen als het niet loopt.", footer: "3e klasse · Groeiende selectie" },
];

export default function WebsiteSelecties() {
  const [instellingen, setInstellingen] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetchWebsiteData().then(data => {
      if (data?.instellingen) setInstellingen(data.instellingen);
    });
    base44.entities.Player.filter({ active: true }).then(pl => setPlayers(pl || []));
  }, []);

  const countFor = (team) => {
    if (team === "Vrouwen 1") return players.filter(p => p.team === "Dames 1" || p.team === "Vrouwen 1").length;
    return players.filter(p => p.team === team).length;
  };

  const heroStyle = {
    height: "800px", position: "relative", overflow: "hidden",
    background: instellingen?.selecties_image_url
      ? `url(${instellingen.selecties_image_url}) top center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex", alignItems: "flex-end",
  };

  return (
    <WebsiteLayout>
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px", maxWidth: "1200px", width: "100%" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "10px" }}>MV ARTEMIS</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 58px)", color: "#fff", lineHeight: 1 }}>DRIE TEAMS.</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 58px)", color: "#FF6800", lineHeight: 1, marginBottom: "16px" }}>ÉÉN FILOSOFIE.</div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "500px", lineHeight: 1.6 }}>Doorstroom van MO17 naar MO20 naar V1 is gebaseerd op kwaliteit, niet op leeftijd.</p>
        </div>
      </section>
      <section style={{ background: "#10121A", padding: "48px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          {TEAMS.map((t) => (
            <Link key={t.team} to={t.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#0F1630", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", minHeight: "260px", display: "flex", flexDirection: "column", overflow: "hidden", borderTop: `3px solid ${t.accent}` }}>
                <div style={{ padding: "20px 20px 16px", flex: 1 }}>
                  <span style={{ background: "rgba(255,255,255,0.1)", color: t.accent, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "3px", letterSpacing: "1px" }}>{t.team}</span>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "34px", color: t.accent, marginTop: "12px", lineHeight: 1 }}>{t.titel}</div>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "10px", lineHeight: 1.5 }}>{t.sub}</p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{countFor(t.team)} spelers</div>
                </div>
                <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: t.accent }} />
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>{t.footer}</span>
                  </div>
                  <span style={{ color: t.accent, fontSize: "16px" }}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </WebsiteLayout>
  );
}