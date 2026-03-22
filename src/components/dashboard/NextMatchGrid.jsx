import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import CheckInFlow from "@/components/checkin/CheckInFlow";

// MVA Noord logo URL
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
  const glowColor = isMO17 ? "rgba(255,107,0,0.45)" : "rgba(96,165,250,0.35)";
  const borderColor = isMO17 ? "rgba(255,107,0,0.25)" : "rgba(96,165,250,0.20)";
  const pillColor = isMO17 ? { bg: "rgba(255,107,0,0.25)", border: "rgba(255,107,0,0.50)", text: "#FF8C3A" } : { bg: "rgba(96,165,250,0.20)", border: "rgba(96,165,250,0.45)", text: "#60a5fa" };

  if (!nextMatch) {
    return (
      <div style={{
        borderRadius: "22px",
        overflow: "hidden",
        height: "160px",
        position: "relative",
        border: `0.5px solid ${borderColor}`,
      }}>
        {/* Background image */}
        <img
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/e47690dd6_wedstrijd.jpg"
          alt="Wedstrijd veld"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            zIndex: 0,
          }}
        />

        {/* Overlay 1 */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1,
        }} />

        {/* Overlay 2 - diagonal gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.40) 100%)",
          zIndex: 2,
        }} />

        {/* SVG field lines */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 3,
          }}
          viewBox="0 0 400 150"
          preserveAspectRatio="xMidYMid slice"
        >
          <line x1="200" y1="0" x2="200" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <ellipse cx="200" cy="75" rx="25" ry="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="20" y="45" width="35" height="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="345" y="45" width="35" height="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </svg>

        {/* Glow */}
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-30px",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          background: `radial-gradient(${glowColor} 0%, transparent 70%)`,
          zIndex: 4,
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{
          position: "relative",
          zIndex: 5,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}>
          <i className="ti ti-calendar" style={{ fontSize: "32px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }} />
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
            Geen wedstrijd gepland
          </p>
        </div>
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
        onClick={() => navigate(`/Wedstrijden?matchId=${nextMatch.id}`)}
        style={{
          borderRadius: "22px",
          overflow: "hidden",
          height: "160px",
          position: "relative",
          border: `0.5px solid ${borderColor}`,
          background: "transparent",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {/* Background image */}
        <img
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/e47690dd6_wedstrijd.jpg"
          alt="Wedstrijd veld"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            zIndex: 0,
          }}
        />

        {/* Overlay 1 */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1,
        }} />

        {/* Overlay 2 - diagonal gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.40) 100%)",
          zIndex: 2,
        }} />

        {/* SVG field lines */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 3,
          }}
          viewBox="0 0 400 150"
          preserveAspectRatio="xMidYMid slice"
        >
          <line x1="200" y1="0" x2="200" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <ellipse cx="200" cy="75" rx="25" ry="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="20" y="45" width="35" height="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="345" y="45" width="35" height="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </svg>

        {/* Glow */}
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-30px",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          background: `radial-gradient(${glowColor} 0%, transparent 70%)`,
          zIndex: 4,
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{
          position: "relative",
          zIndex: 5,
          height: "100%",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          {/* Top: Team pill + Time pill */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{
              background: pillColor.bg,
              border: `0.5px solid ${pillColor.border}`,
              color: pillColor.text,
              borderRadius: "20px",
              padding: "3px 10px",
              fontSize: "10px",
              fontWeight: 700,
            }}>
              {teamLabel}
            </div>
            <div style={{
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.65)",
              borderRadius: "20px",
              padding: "4px 10px",
              fontSize: "10px",
              fontWeight: 600,
            }}>
              {dayLabel}
            </div>
          </div>

          {/* Middle: Logo + vs + Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            {/* Left logo */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: isMO17 ? "rgba(255,107,0,0.30)" : "rgba(96,165,250,0.20)",
                border: `1.5px solid ${isMO17 ? "rgba(255,107,0,0.50)" : "rgba(96,165,250,0.45)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isMO17 ? "#FF8C3A" : "#60a5fa",
                fontSize: "12px",
                fontWeight: 700,
                overflow: "hidden",
              }}>
                {isMO17 ? (
                  <img src={MVA_LOGO_URL} alt="MVA Noord" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "VR1"
                )}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: "50px" }}>
                {teamLabel}
              </div>
            </div>

            {/* Center VS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: "0 0 auto" }}>
              <div style={{ fontSize: "18px", fontWeight: 300, color: "rgba(255,255,255,0.35)" }}>
                vs
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.50)" }}>
                {format(matchDate, "d MMM", { locale: nl })}
              </div>
            </div>

            {/* Right logo */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.70)",
                fontSize: "12px",
                fontWeight: 700,
                overflow: "hidden",
              }}>
                {nextMatch.opponent_logo ? (
                  <img src={nextMatch.opponent_logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  nextMatch.opponent
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                )}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: "50px" }}>
                {nextMatch.opponent.split(" ")[0]}
              </div>
            </div>
          </div>

          {/* Bottom: Location + Check-in */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: isHome ? "#4ade80" : "#fbbf24",
                }}
              />
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                {isHome ? "Thuis" : "Uit"}
              </span>
            </div>

            {showCheckInProp && (
              alreadyCheckedIn ? (
                <div style={{
                  background: "rgba(74,222,128,0.15)",
                  border: "0.5px solid rgba(74,222,128,0.30)",
                  color: "#4ade80",
                  borderRadius: "20px",
                  padding: "4px 10px",
                  fontSize: "10px",
                  fontWeight: 600,
                }}>
                  ✓ Ingevuld
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCheckIn(true);
                  }}
                  style={{
                    background: "rgba(255,107,0,0.25)",
                    border: "0.5px solid rgba(255,107,0,0.45)",
                    color: "#FF8C3A",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    fontSize: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
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
          onCompleted={() => {
            setShowCheckIn(false);
            setCheckInDone(true);
          }}
        />
      )}
    </>
  );
}

/**
 * NextMatchGrid — shows next match for MO17 and Dames 1 side by side.
 * @param {Array} matches - all matches
 * @param {string|null} playerId - if provided, shows check-in button
 */
export default function NextMatchGrid({ matches, playerId = null }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureMatches = matches.filter((m) => parseISO(m.date) >= today);

  const nextMO17 = futureMatches
    .filter((m) => m.team === "MO17")
    .sort((a, b) => (a.date > b.date ? 1 : -1))[0] || null;

  const nextDames = futureMatches
    .filter((m) => m.team === "Dames 1")
    .sort((a, b) => (a.date > b.date ? 1 : -1))[0] || null;

  const showCheckIn = !!playerId;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
      }}
      className="mobile-grid-1col"
    >
      <MatchCard team="MO17" teamLabel="MO17" nextMatch={nextMO17} showCheckIn={showCheckIn} playerId={playerId} />
      <MatchCard team="Dames 1" teamLabel="VR1" nextMatch={nextDames} showCheckIn={showCheckIn} playerId={playerId} />
    </div>
  );
}