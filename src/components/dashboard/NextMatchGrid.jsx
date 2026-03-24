import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import CheckInFlow from "@/components/checkin/CheckInFlow";

const MVA_LOGO_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/c0045a171_MVAlogo.png";

function MatchCard({ team, teamLabel, nextMatch, showCheckIn: showCheckInProp, playerId }) {
  const navigate = useNavigate();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);

  const { data: checkIns = [] } = useQuery({
    queryKey: ["myCheckIns", playerId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ player_id: playerId, type: "pre" }),
    enabled: !!playerId,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isMO17 = team === "MO17";

  if (!nextMatch) {
    return (
      <div style={{
        borderRadius: "18px", height: "160px",
        border: "2.5px solid #1a1a1a", background: "#1a1a1a",
        boxShadow: "3px 3px 0 #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "8px",
      }}>
        <i className="ti ti-calendar" style={{ fontSize: "28px", color: "rgba(255,255,255,0.25)" }} />
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.30)", fontWeight: 600 }}>Geen wedstrijd gepland</p>
      </div>
    );
  }

  const matchDate = parseISO(nextMatch.date);
  const daysUntil = differenceInDays(matchDate, today);
  const dayLabel = daysUntil === 0 ? "Vandaag" : daysUntil === 1 ? "Morgen" : `Over ${daysUntil}d`;
  const alreadyCheckedIn = checkIns.some(c => c.match_id === nextMatch.id) || checkInDone;
  const isHome = nextMatch.home_away === "Thuis";

  return (
    <>
      <button
        onClick={() => navigate(`/Planning?id=${nextMatch.id}`)}
        style={{
          borderRadius: "18px", height: "160px", position: "relative",
          border: "2.5px solid #1a1a1a", background: "#1a1a1a",
          boxShadow: "3px 3px 0 #1a1a1a",
          padding: 0, cursor: "pointer", overflow: "hidden", display: "block", width: "100%",
        }}
      >
        {/* Content */}
        <div style={{ padding: "12px 14px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Top: pills */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{
              background: isMO17 ? "#FF6800" : "#00C2FF",
              border: "1.5px solid white",
              color: isMO17 ? "#ffffff" : "#1a1a1a",
              borderRadius: "20px", padding: "3px 10px",
              fontSize: "10px", fontWeight: 800,
            }}>
              {teamLabel}
            </div>
            <div style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)",
              color: "rgba(255,255,255,0.65)", borderRadius: "20px", padding: "3px 10px",
              fontSize: "10px", fontWeight: 700,
            }}>
              {dayLabel}
            </div>
          </div>

          {/* Middle: logos + VS */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "rgba(255,255,255,0.12)", overflow: "hidden",
                border: "1.5px solid rgba(255,255,255,0.25)",
              }}>
                <img src={MVA_LOGO_URL} alt="MVA Noord" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff", textAlign: "center" }}>MVA Noord</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-1px", lineHeight: 1 }}>VS</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.50)", fontWeight: 600 }}>
                {format(matchDate, "d MMM", { locale: nl })}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "rgba(255,255,255,0.12)", overflow: "hidden",
                border: "1.5px solid rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.70)", fontSize: "12px", fontWeight: 700,
              }}>
                {(nextMatch.opponent_logo_url || nextMatch.opponent_logo) ? (
                  <img src={nextMatch.opponent_logo_url || nextMatch.opponent_logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (nextMatch.opponent || nextMatch.title || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
                )}
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff", textAlign: "center", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nextMatch.title || nextMatch.opponent || ""}
              </span>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isHome ? "#08D068" : "#FFD600" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.60)" }}>
                {isHome ? "Thuis" : "Uit"}
              </span>
            </div>

            {showCheckInProp && (
              alreadyCheckedIn ? (
                <div style={{
                  background: "rgba(8,208,104,0.20)", border: "1px solid rgba(8,208,104,0.40)",
                  color: "#08D068", borderRadius: "20px", padding: "3px 10px",
                  fontSize: "10px", fontWeight: 700,
                }}>
                  ✓ Ingevuld
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCheckIn(true); }}
                  style={{
                    background: "#FF6800", border: "1.5px solid #ffffff",
                    color: "#ffffff", borderRadius: "20px", padding: "3px 12px",
                    fontSize: "10px", fontWeight: 800, cursor: "pointer",
                  }}
                >
                  Check-in
                </button>
              )
            )}
          </div>
        </div>
      </button>

      {showCheckIn && (
        <CheckInFlow
          matchId={nextMatch.id}
          type="pre"
          onClose={() => setShowCheckIn(false)}
          onCompleted={() => { setShowCheckIn(false); setCheckInDone(true); }}
        />
      )}
    </>
  );
}

export default function NextMatchGrid({ matches = [], agendaItems: agendaItemsProp = [], playerId = null }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: fetchedAgendaItems = [] } = useQuery({
    queryKey: ["agenda-wedstrijden"],
    queryFn: () => base44.entities.AgendaItem.filter({ type: "Wedstrijd" }),
  });

  const agendaWedstrijden = fetchedAgendaItems.length > 0
    ? fetchedAgendaItems
    : agendaItemsProp.filter(ai => ai.type === "Wedstrijd");

  const source = agendaWedstrijden.length > 0 ? agendaWedstrijden : matches;
  const futureMatches = source.filter((m) => parseISO(m.date) >= today);

  const nextMO17 = futureMatches.filter((m) => m.team === "MO17").sort((a, b) => a.date > b.date ? 1 : -1)[0] || null;
  const nextDames = futureMatches.filter((m) => m.team === "Dames 1").sort((a, b) => a.date > b.date ? 1 : -1)[0] || null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="mobile-grid-1col">
      <MatchCard team="MO17" teamLabel="MO17" nextMatch={nextMO17} showCheckIn={!!playerId} playerId={playerId} />
      <MatchCard team="Dames 1" teamLabel="VR1" nextMatch={nextDames} showCheckIn={!!playerId} playerId={playerId} />
    </div>
  );
}