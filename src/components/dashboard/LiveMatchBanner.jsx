import React from "react";
import { useNavigate } from "react-router-dom";

export default function LiveMatchBanner({ liveMatches, isTrainer }) {
  const navigate = useNavigate();

  if (!liveMatches || liveMatches.length === 0) return null;

  return (
    <div style={{ margin: "0 1rem", marginBottom: "1.5rem" }}>
      {liveMatches.map((match, idx) => {
        // Get current minute from last event
        let minute = 0;
        if (match.live_events && match.live_events.length > 0) {
          minute = match.live_events[match.live_events.length - 1].minute || 0;
        }

        // Team pill color
        const teamColor = match.team === "MO17" ? "rgba(255,107,0,0.20)" : "rgba(59,102,205,0.20)";
        const teamBorder = match.team === "MO17" ? "rgba(255,107,0,0.40)" : "rgba(59,102,205,0.40)";
        const teamTextColor = match.team === "MO17" ? "#FF8C3A" : "#3B66CD";

        return (
          <div
            key={match.id}
            style={{
              background: "linear-gradient(135deg, rgba(248,113,113,0.20) 0%, rgba(248,113,113,0.08) 100%)",
              border: "0.5px solid rgba(248,113,113,0.35)",
              borderRadius: "16px",
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              animation: "slideDown 0.3s ease-out",
              marginBottom: idx < liveMatches.length - 1 ? "0.75rem" : "0",
            }}
          >
            {/* Left section */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#f87171",
                animation: "pulse 1.5s ease-in-out infinite",
                flexShrink: 0,
              }} />
              
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  {liveMatches.length > 1 && (
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: teamTextColor,
                      background: teamColor,
                      border: `0.5px solid ${teamBorder}`,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      flexShrink: 0,
                    }}>
                      {match.team}
                    </span>
                  )}
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#f87171",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}>
                    NU LIVE
                  </span>
                </div>
                <p style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  MVA Noord vs. {match.opponent || "Tegenstander"}
                </p>
              </div>

              {/* Score and minute */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {match.score_home !== undefined && match.score_away !== undefined && (
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#4ade80",
                  }}>
                    {match.score_home} - {match.score_away}
                  </span>
                )}
                {minute > 0 && (
                  <span style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.55)",
                  }}>
                    {minute}'
                  </span>
                )}
              </div>
            </div>

            {/* Right section - button */}
            <button
              onClick={() => {
                if (isTrainer) {
                  window.location.href = `/LiveMatch?matchId=${match.id}`;
                } else {
                  window.location.href = `/live?match_id=${match.id}`;
                }
              }}
              style={{
                background: "rgba(248,113,113,0.20)",
                border: "0.5px solid rgba(248,113,113,0.35)",
                borderRadius: "20px",
                padding: "5px 14px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#f87171",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => e.target.style.opacity = "0.8"}
              onMouseLeave={(e) => e.target.style.opacity = "1"}
            >
              Volg live
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}