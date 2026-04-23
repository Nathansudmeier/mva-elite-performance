import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isFuture, isPast, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import WebsiteHero from "@/components/website/WebsiteHero";

const TEAMS = ["Alle", "MO17", "MO20", "Vrouwen 1"];

export default function WebsiteWedstrijden() {
  const [activeTeam, setActiveTeam] = useState("Alle");

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["public-wedstrijden"],
    queryFn: () => base44.entities.AgendaItem.list("-date", 100),
  });

  const wedstrijden = agendaItems.filter(a => a.type === "Wedstrijd" && !a.cancelled);

  const filtered = activeTeam === "Alle"
    ? wedstrijden
    : wedstrijden.filter(m => m.team === activeTeam || m.team === "Beide");

  const programma = filtered.filter(m => isFuture(parseISO(m.date))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const resultaten = filtered.filter(m => isPast(parseISO(m.date))).sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (d) => format(parseISO(d), "EEEE d MMMM yyyy", { locale: nl });

  const MatchCard = ({ match, isResult }) => (
    <div style={{
      background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)",
      padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px"
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ fontSize: "11px", color: "#FF6800", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {formatDate(match.date)} · {match.start_time || ""}
        </div>
        <div style={{ fontSize: "16px", color: "#fff", fontWeight: 700 }}>{match.title}</div>
        {match.location && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{match.location}</div>}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{
          background: match.home_away === "Thuis" ? "#1B2A5E" : "rgba(255,255,255,0.08)",
          color: match.home_away === "Thuis" ? "#FF6800" : "rgba(255,255,255,0.6)",
          borderRadius: "3px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase"
        }}>
          {match.home_away || ""}
        </span>
        <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: "3px", padding: "4px 10px", fontSize: "11px", fontWeight: 700 }}>
          {match.team}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#10121A" }}>
      <WebsiteHero title="WEDSTRIJDEN" minHeight="40vh" />

      <section style={{ padding: "60px 32px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "48px", flexWrap: "wrap" }}>
          {TEAMS.map((t) => (
            <button key={t} onClick={() => setActiveTeam(t)} style={{
              background: activeTeam === t ? "#FF6800" : "#202840",
              color: activeTeam === t ? "#fff" : "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px",
              padding: "8px 18px", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Programma */}
        {programma.length > 0 && (
          <div style={{ marginBottom: "56px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "20px" }}>Programma</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {programma.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {/* Resultaten */}
        {resultaten.length > 0 && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>Resultaten</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {resultaten.map(m => <MatchCard key={m.id} match={m} isResult />)}
            </div>
          </div>
        )}

        {programma.length === 0 && resultaten.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>
            Geen wedstrijden gevonden
          </div>
        )}
      </section>
    </div>
  );
}