import React from "react";

export default function LiveMatchBanner({ liveMatches, isTrainer }) {
  if (!liveMatches || liveMatches.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      {liveMatches.map((match, idx) => {
        let minute = 0;
        if (match.live_events && match.live_events.length > 0) {
          minute = match.live_events[match.live_events.length - 1].minute || 0;
        }

        return (
          <div
            key={match.id}
            style={{
              background: "#FF3DA8",
              border: "2.5px solid #1a1a1a",
              borderRadius: "16px",
              boxShadow: "3px 3px 0 #1a1a1a",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: idx < liveMatches.length - 1 ? "8px" : "0",
              animation: "slideDown 0.3s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#ffffff", animation: "pulseWhite 1.5s ease-in-out infinite",
                flexShrink: 0,
              }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  NU LIVE
                </span>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: "2px 0 0" }}>
                  MVA Noord vs. {match.opponent || "Tegenstander"}
                  {match.score_home !== undefined && match.score_away !== undefined && (
                    <span style={{ marginLeft: "8px", fontWeight: 900 }}>
                      {match.score_home}–{match.score_away}
                    </span>
                  )}
                  {minute > 0 && (
                    <span style={{ marginLeft: "6px", fontSize: "11px", opacity: 0.75 }}>{minute}'</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (isTrainer) {
                  window.location.href = `/LiveMatch?matchId=${match.id}`;
                } else {
                  window.location.href = `/live?match_id=${match.id}`;
                }
              }}
              style={{
                background: "#ffffff", border: "2px solid #1a1a1a",
                borderRadius: "20px", padding: "5px 14px",
                fontSize: "11px", fontWeight: 800, color: "#1a1a1a",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              Volg live
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseWhite {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}