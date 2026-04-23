import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isFuture, isPast, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const TEAM_CONFIG = {
  mo17: { naam: "MO17", dbNaam: "MO17", competitie: "Landelijke Divisie 1", seizoen: "2025/26" },
  mo20: { naam: "MO20", dbNaam: "MO20", competitie: "Regio Friesland", seizoen: "2025/26" },
  "vrouwen-1": { naam: "Vrouwen 1", dbNaam: "Vrouwen 1", competitie: "3e Klasse", seizoen: "2025/26" },
};

export default function WebsiteTeamPage({ teamSlug }) {
  const config = TEAM_CONFIG[teamSlug] || TEAM_CONFIG["mo17"];

  const { data: players = [] } = useQuery({
    queryKey: ["public-players", config.dbNaam],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["public-agenda", config.dbNaam],
    queryFn: () => base44.entities.AgendaItem.list("-date", 50),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["public-staff"],
    queryFn: () => base44.entities.Trainer.list(),
  });

  const teamPlayers = players
    .filter(p => p.team === config.dbNaam && p.active !== false)
    .sort((a, b) => (a.shirt_number || 99) - (b.shirt_number || 99));

  const teamMatches = agendaItems
    .filter(a => a.type === "Wedstrijd" && (a.team === config.dbNaam || a.team === "Beide"))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcoming = teamMatches.filter(m => isFuture(parseISO(m.date)));
  const results = teamMatches.filter(m => isPast(parseISO(m.date))).reverse().slice(0, 5);

  const formatDate = (d) => format(parseISO(d), "d MMM", { locale: nl });

  return (
    <div style={{ background: "#10121A", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(to bottom, #1B2A5E, #10121A)",
        padding: "80px 32px 60px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(56px, 10vw, 96px)", color: "#fff", lineHeight: 0.95, letterSpacing: "2px" }}>
            {config.naam}
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
            <span style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{config.competitie}</span>
            <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", borderRadius: "3px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{config.seizoen}</span>
            <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", borderRadius: "3px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{teamPlayers.length} speelsters</span>
          </div>
        </div>
      </div>

      {/* Content 70/30 */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 32px", display: "grid", gridTemplateColumns: "1fr", gap: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,7fr) minmax(0,3fr)", gap: "40px" }} className="team-grid">

          {/* Spelerstabel */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "20px" }}>Selectie</div>
            <div style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>#</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>Naam</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>Positie</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPlayers.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < teamPlayers.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 700, color: "#FF6800", fontFamily: "'Bebas Neue', cursive", fontSize: "18px" }}>
                        {p.shirt_number || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "14px", color: "#fff", fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{p.position || "—"}</td>
                    </tr>
                  ))}
                  {teamPlayers.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: "32px 16px", textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>Nog geen spelers</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wedstrijden + Staff */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Programma */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "16px" }}>Programma</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {upcoming.slice(0, 5).map((m) => (
                  <div key={m.id} style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
                    <div style={{ fontSize: "10px", color: "#FF6800", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{formatDate(m.date)}</div>
                    <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>{m.title}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{m.home_away || ""} · {m.start_time || ""}</div>
                  </div>
                ))}
                {upcoming.length === 0 && <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", padding: "12px 0" }}>Geen wedstrijden gepland</div>}
              </div>
            </div>

            {/* Recente uitslagen */}
            {results.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "16px" }}>Uitslagen</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {results.map((m) => (
                    <div key={m.id} style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{formatDate(m.date)}</div>
                      <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>{m.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technische staf */}
            {staff.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "16px" }}>Technische Staf</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {staff.filter(s => s.active !== false).map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FF6800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                          {s.name?.[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{s.role_title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}