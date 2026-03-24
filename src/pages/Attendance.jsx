import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { isAfter, subDays } from "date-fns";

const PERIODS = [
  { label: "4 weken", days: 28 },
  { label: "8 weken", days: 56 },
  { label: "Heel seizoen", days: 365 },
];

function getColor(pct) {
  if (pct >= 80) return { bg: "#08D068", text: "#1a1a1a" };
  if (pct >= 60) return { bg: "#FFD600", text: "#1a1a1a" };
  return { bg: "#FF3DA8", text: "#ffffff" };
}

function Avatar({ player }) {
  const initials = player?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  if (player?.photo_url) {
    return (
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", border: "2px solid #1a1a1a", flexShrink: 0 }}>
        <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1a1a1a", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: "11px", fontWeight: 800, color: "#ffffff" }}>{initials}</span>
    </div>
  );
}

export default function Attendance() {
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);

  const { data: players = [] } = useQuery({
    queryKey: ["players-active"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["agenda-trainingen"],
    queryFn: () => base44.entities.AgendaItem.filter({ type: "Training" }),
  });

  const { data: agendaAttendance = [] } = useQuery({
    queryKey: ["agenda-attendance-all"],
    queryFn: () => base44.entities.AgendaAttendance.list(),
  });

  const period = PERIODS[selectedPeriodIndex];
  const cutoffDate = subDays(new Date(), period.days);
  const today = new Date().toISOString().split("T")[0];

  // Trainingen in de geselecteerde periode (alleen in het verleden)
  const periodTrainings = agendaItems.filter(ai =>
    ai.date <= today && isAfter(new Date(ai.date), cutoffDate)
  );

  const totalSessions = periodTrainings.length;

  // Per speler: bereken aanwezigheidspercentage
  const playerStats = players
    .map(player => {
      const attended = agendaAttendance.filter(aa =>
        aa.player_id === player.id &&
        aa.status === "aanwezig" &&
        periodTrainings.some(t => t.id === aa.agenda_item_id)
      ).length;
      const pct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      return { player, attended, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  const avgPct = playerStats.length > 0
    ? Math.round(playerStats.reduce((sum, s) => sum + s.pct, 0) / playerStats.length)
    : 0;

  const above80 = playerStats.filter(s => s.pct >= 80).length;
  const below60 = playerStats.filter(s => s.pct < 60).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "80px" }}>

      {/* Header */}
      <div>
        <h1 className="t-page-title">Aanwezigheid</h1>
        <p className="t-secondary" style={{ marginTop: "2px" }}>Overzicht per speler uit de Planning</p>
      </div>

      {/* Periode selector */}
      <div style={{ display: "flex", gap: "6px" }}>
        {PERIODS.map((p, i) => (
          <button
            key={i}
            onClick={() => setSelectedPeriodIndex(i)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "2px solid #1a1a1a",
              background: selectedPeriodIndex === i ? "#1a1a1a" : "#ffffff",
              color: selectedPeriodIndex === i ? "#ffffff" : "#1a1a1a",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: selectedPeriodIndex === i ? "2px 2px 0 rgba(26,26,26,0.20)" : "none",
              transition: "all 0.1s",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        <div style={{ background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px" }}>
          <p className="t-label" style={{ color: "rgba(255,255,255,0.65)" }}>Gem. aanwezigheid</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginTop: "6px", letterSpacing: "-2px" }}>{avgPct}%</p>
        </div>
        <div style={{ background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px" }}>
          <p className="t-label" style={{ color: "rgba(26,26,26,0.65)" }}>≥ 80%</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginTop: "6px", letterSpacing: "-2px" }}>{above80}</p>
          <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", marginTop: "4px", fontWeight: 600 }}>spelers</p>
        </div>
        <div style={{ background: "#FF3DA8", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px" }}>
          <p className="t-label" style={{ color: "rgba(255,255,255,0.65)" }}>&lt; 60%</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginTop: "6px", letterSpacing: "-2px" }}>{below60}</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "4px", fontWeight: 600 }}>spelers</p>
        </div>
      </div>

      {/* Speler overzicht */}
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <p className="t-section-title">Spelers</p>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.45)" }}>{totalSessions} trainingen</span>
        </div>

        {totalSessions === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: "10px" }}>
            <i className="ti ti-calendar-off" style={{ fontSize: "32px", color: "rgba(26,26,26,0.15)" }} />
            <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.35)", fontWeight: 600 }}>Geen trainingen gevonden in deze periode</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {playerStats.map(({ player, attended, pct }, i) => {
              const col = getColor(pct);
              return (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 0",
                    borderBottom: i < playerStats.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none",
                  }}
                >
                  {/* Rank */}
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.25)", width: "18px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>

                  <Avatar player={player} />

                  {/* Name + bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{player.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                      <div style={{ flex: 1, height: "5px", background: "rgba(26,26,26,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: col.bg, borderRadius: "3px", transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ fontSize: "10px", color: "rgba(26,26,26,0.40)", fontWeight: 600, flexShrink: 0 }}>{attended}/{totalSessions}</span>
                    </div>
                  </div>

                  {/* Percentage badge */}
                  <div style={{
                    background: col.bg,
                    border: "2px solid #1a1a1a",
                    borderRadius: "10px",
                    padding: "4px 10px",
                    flexShrink: 0,
                    minWidth: "48px",
                    textAlign: "center",
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: col.text }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}