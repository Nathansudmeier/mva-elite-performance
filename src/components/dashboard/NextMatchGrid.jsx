import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import CheckInFlow from "@/components/checkin/CheckInFlow";

function MatchCard({ team, teamLabel, teamPill, nextMatch, showCheckIn: showCheckInProp, playerId }) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);

  const { data: checkIns = [] } = useQuery({
    queryKey: ["myCheckIns", playerId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ player_id: playerId, type: "pre" }),
    enabled: !!playerId,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!nextMatch) {
    return (
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a4a2e, #0d2b1a)", border: "0.5px solid rgba(255,107,0,0.28)", borderRadius: "22px", minHeight: "140px", display: "flex", flexDirection: "column" }}>
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }} viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
          <rect x="1" y="1" width="398" height="148" fill="none" stroke="white" strokeWidth="2"/>
          <line x1="200" y1="1" x2="200" y2="149" stroke="white" strokeWidth="1.5"/>
          <circle cx="200" cy="75" r="28" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="1" y="40" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="357" y="40" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
        </svg>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.45) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,107,0,0.10)" }} />
        <div className="relative z-10 p-4 flex flex-col h-full" style={{ minHeight: "140px" }}>
          <span style={teamPill}>{teamLabel}</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <i className="ti ti-calendar" style={{ fontSize: "22px", color: "rgba(255,255,255,0.30)" }} />
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>Geen wedstrijd gepland</p>
          </div>
        </div>
      </div>
    );
  }

  const matchDate = parseISO(nextMatch.date);
  const daysUntil = differenceInDays(matchDate, today);
  const dayLabel = daysUntil === 0 ? "Vandaag" : daysUntil === 1 ? "Morgen" : `Over ${daysUntil}d`;
  const alreadyCheckedIn = checkIns.some(c => c.match_id === nextMatch.id) || checkInDone;

  return (
    <>
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a4a2e, #0d2b1a)", border: "0.5px solid rgba(255,107,0,0.28)", borderRadius: "22px", minHeight: "140px" }}>
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }} viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
          <rect x="1" y="1" width="398" height="148" fill="none" stroke="white" strokeWidth="2"/>
          <line x1="200" y1="1" x2="200" y2="149" stroke="white" strokeWidth="1.5"/>
          <circle cx="200" cy="75" r="28" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="1" y="40" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="357" y="40" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
        </svg>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.45) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,107,0,0.10)" }} />

        <div className="relative z-10 p-4 flex flex-col justify-between" style={{ minHeight: "140px" }}>
          <div className="flex items-start justify-between">
            <span style={teamPill}>{teamLabel}</span>
            <span style={{ background: "rgba(255,255,255,0.10)", border: "0.5px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px" }}>
              {dayLabel}
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px", lineHeight: 1.2 }}>vs. {nextMatch.opponent}</h3>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>
              {format(matchDate, "EEE d MMM", { locale: nl })} · {nextMatch.home_away || "Thuis"}
            </p>
          </div>
          {showCheckInProp && (
            alreadyCheckedIn ? (
              <div className="flex items-center justify-center gap-2" style={{ background: "rgba(74,222,128,0.15)", border: "0.5px solid rgba(74,222,128,0.25)", borderRadius: "12px", height: "38px", color: "#4ade80", fontSize: "12px", fontWeight: 600 }}>
                ✓ Check-in ingevuld
              </div>
            ) : (
              <button onClick={() => setShowCheckIn(true)} style={{ width: "100%", background: "rgba(255,107,0,0.25)", border: "0.5px solid rgba(255,107,0,0.45)", color: "#ffffff", borderRadius: "12px", height: "38px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Check-in →
              </button>
            )
          )}
        </div>
      </div>

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

const MO17_PILL = {
  display: "inline-flex", alignItems: "center",
  background: "rgba(255,107,0,0.25)", border: "0.5px solid rgba(255,107,0,0.45)",
  color: "#FF8C3A", borderRadius: "20px", padding: "3px 10px",
  fontSize: "10px", fontWeight: 600,
};

const VR1_PILL = {
  display: "inline-flex", alignItems: "center",
  background: "rgba(96,165,250,0.15)", border: "0.5px solid rgba(96,165,250,0.30)",
  color: "#60a5fa", borderRadius: "20px", padding: "3px 10px",
  fontSize: "10px", fontWeight: 600,
};

/**
 * NextMatchGrid — shows next match for MO17 and Dames 1 side by side.
 * @param {Array} matches - all matches
 * @param {string|null} playerId - if provided, shows check-in button
 */
export default function NextMatchGrid({ matches, playerId = null }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureMatches = matches.filter(m => parseISO(m.date) >= today);

  const nextMO17 = futureMatches
    .filter(m => m.team === "MO17")
    .sort((a, b) => a.date > b.date ? 1 : -1)[0] || null;

  const nextDames = futureMatches
    .filter(m => m.team === "Dames 1")
    .sort((a, b) => a.date > b.date ? 1 : -1)[0] || null;

  const showCheckIn = !!playerId;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="mobile-grid-1col">
      <MatchCard team="MO17" teamLabel="MO17" teamPill={MO17_PILL} nextMatch={nextMO17} showCheckIn={showCheckIn} playerId={playerId} />
      <MatchCard team="Dames 1" teamLabel="VR1" teamPill={VR1_PILL} nextMatch={nextDames} showCheckIn={showCheckIn} playerId={playerId} />
    </div>
  );
}