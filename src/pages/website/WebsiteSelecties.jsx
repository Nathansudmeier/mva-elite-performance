import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import WebsiteHero from "@/components/website/WebsiteHero";

const TEAMS = [
  { naam: "MO17", slug: "/mo17", omschrijving: "Onder 17. Hoog niveau competitie, individuele ontwikkeling centraal." },
  { naam: "MO20", slug: "/mo20", omschrijving: "Onder 20. Brug tussen jeugd en seniorenvoetbal." },
  { naam: "Vrouwen 1", slug: "/vrouwen-1", omschrijving: "Eerste selectie. 3e Klasse, op weg naar de top." },
];

export default function WebsiteSelecties() {
  const { data: players = [] } = useQuery({
    queryKey: ["public-players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const playerCount = (team) => players.filter(p => p.team === team && p.active !== false).length;

  return (
    <div style={{ background: "#10121A" }}>
      <WebsiteHero
        title="DRIE TEAMS."
        subtitle="ÉÉN FILOSOFIE."
        minHeight="55vh"
      />

      <section style={{ background: "#151D35", padding: "80px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Selecties</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(32px, 5vw, 48px)", color: "#fff", margin: 0 }}>KIES JE TEAM</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
            {TEAMS.map((team) => (
              <Link key={team.naam} to={team.slug} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)",
                  padding: "40px 32px", cursor: "pointer"
                }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "42px", color: "#FF6800", letterSpacing: "1px", marginBottom: "8px" }}>{team.naam}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>{playerCount(team.naam)} speelsters</div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: "24px" }}>{team.omschrijving}</div>
                  <div style={{ fontSize: "13px", color: "#FF6800", fontWeight: 700 }}>Bekijk selectie en wedstrijden →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}