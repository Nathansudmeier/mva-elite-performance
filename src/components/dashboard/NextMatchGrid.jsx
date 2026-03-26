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

  // Fetch all matches to find the linked one (by match_id or by date+team fallback)
  const { data: allMatchesForCard = [] } = useQuery({
    queryKey: ["matches-for-card"],
    queryFn: () => base44.entities.Match.list("-date"),
    enabled: !!nextMatch,
  });

  const linkedMatch = nextMatch?.match_id
    ? allMatchesForCard.find(m => m.id === nextMatch.match_id)
    : allMatchesForCard.find(m => m.date === nextMatch?.date && m.team === team);

  const isInSelection = !!playerId && !!(linkedMatch?.selection?.includes(playerId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isMO17 = team === "MO17";
  const cardBg = isMO17 ? "#00C2FF" : "#FF3DA8";

  if (!nextMatch) {
    return (
      <div style={{
        background: cardBg, border: "2.5px solid #1a1a1a", borderRadius: "22px",
        boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem", minHeight: "180px",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "8px",
      }}>
        <i className="ti ti-calendar" style={{ fontSize: "28px", color: "rgba(26,26,26,0.25)" }} />
        <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.40)", fontWeight: 700 }}>Geen wedstrijd gepland</p>
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
          background: cardBg, border: "2.5px solid #1a1a1a", borderRadius: "22px",
          boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem",
          cursor: "pointer", display: "block", width: "100%", textAlign: "left",
          transition: "box-shadow 0.1s, transform 0.1s",
        }}
        onMouseDown={e => { e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a"; e.currentTarget.style.transform = "translate(2px,2px)"; }}
        onMouseUp={e => { e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a"; e.currentTarget.style.transform = ""; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a"; e.currentTarget.style.transform = ""; }}
      >
        {/* Top pills */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{
            background: "#1a1a1a", color: "#ffffff",
            borderRadius: "20px", padding: "4px 12px",
            fontSize: "10px", fontWeight: 800,
          }}>
            {teamLabel}
          </div>
          <div style={{
            background: "#ffffff", color: "#1a1a1a",
            border: "1.5px solid #1a1a1a",
            borderRadius: "20px", padding: "4px 12px",
            fontSize: "10px", fontWeight: 700,
          }}>
            {dayLabel}
          </div>
        </div>

        {/* Field area */}
        <div style={{
          background: "#08D068", border: "2px solid #1a1a1a", borderRadius: "16px",
          padding: "0.75rem", position: "relative", overflow: "hidden", marginBottom: "10px",
        }}>
          {/* SVG field lines */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 300 120" preserveAspectRatio="none">
            <rect x="1" y="1" width="298" height="118" rx="12" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <line x1="150" y1="1" x2="150" y2="119" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <circle cx="150" cy="60" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <rect x="1" y="35" width="30" height="50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <rect x="269" y="35" width="30" height="50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          </svg>

          {/* Three columns: MVA | VS | Opponent */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
            {/* MVA Noord */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flex: "0 0 36%" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "#ffffff", border: "2px solid #1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                <img src={MVA_LOGO_URL} alt="MVA Noord" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#ffffff", textAlign: "center" }}>MVA Noord</span>
            </div>

            {/* VS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: "0 0 28%" }}>
              <span style={{ fontSize: "26px", fontWeight: 900, color: "#ffffff", letterSpacing: "-1px", lineHeight: 1 }}>VS</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.80)", fontWeight: 700, textAlign: "center" }}>
                {format(matchDate, "d MMM", { locale: nl })}
              </span>
              {nextMatch.start_time && (
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.80)", fontWeight: 700 }}>{nextMatch.start_time}</span>
              )}
            </div>

            {/* Opponent */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flex: "0 0 36%" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "#FFD600", border: "2px solid #1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {(nextMatch.opponent_logo_url || nextMatch.opponent_logo) ? (
                  <img src={nextMatch.opponent_logo_url || nextMatch.opponent_logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "#1a1a1a" }}>
                    {(nextMatch.opponent || nextMatch.title || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                  </span>
                )}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#ffffff", textAlign: "center", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nextMatch.title || nextMatch.opponent || ""}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: location + pills */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: isHome ? "#08D068" : "#FFD600",
              border: "1.5px solid #1a1a1a", flexShrink: 0,
            }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a" }}>
              {isHome ? "Thuis" : "Uit"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {isInSelection && (
              <div style={{
                background: "#08D068", border: "1.5px solid #1a1a1a",
                color: "#ffffff", borderRadius: "20px", padding: "3px 10px",
                fontSize: "10px", fontWeight: 800, boxShadow: "1px 1px 0 #1a1a1a",
              }}>
                ✓ Ingedeeld
              </div>
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