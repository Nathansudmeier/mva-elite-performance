import React from "react";
import { useNavigate } from "react-router-dom";

export default function TrainerChampionsTrophy({ players, winningTeams }) {
  const navigate = useNavigate();

  const playerWinCounts = {};
  players.forEach((p) => {
    playerWinCounts[p.id] = winningTeams.filter((w) => w.winning_player_ids?.includes(p.id)).length;
  });

  const recentWinnerIds = new Set(
    winningTeams
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .flatMap((w) => w.winning_player_ids || [])
  );

  const ranked = players
    .map((p) => ({ ...p, wins: playerWinCounts[p.id] || 0 }))
    .sort((a, b) => b.wins - a.wins);

  const top3 = ranked.slice(0, 3);

  if (top3.length === 0 || top3.every((p) => p.wins === 0)) {
    return (
      <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem" }}>
        <p style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a" }}>Champions Trophy</p>
        <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.45)", marginTop: "8px" }}>Nog geen winnaars geregistreerd.</p>
      </div>
    );
  }

  // podium order: #2 left, #1 center, #3 right
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "#FF6800", border: "2px solid #1a1a1a",
          boxShadow: "2px 2px 0 #1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <i className="ti ti-trophy" style={{ fontSize: "20px", color: "#ffffff" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2 }}>Champions Trophy</p>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", fontWeight: 600, marginTop: "2px" }}>Seizoen 2025-26</p>
        </div>
        <button
          onClick={() => navigate("/Leaderboard")}
          style={{
            fontSize: "11px", fontWeight: 800, color: "#1a1a1a",
            background: "rgba(26,26,26,0.10)", border: "1.5px solid #1a1a1a",
            borderRadius: "20px", padding: "4px 12px", cursor: "pointer",
            boxShadow: "2px 2px 0 #1a1a1a",
          }}
        >
          Ranking →
        </button>
      </div>

      {/* Podium */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "12px", marginBottom: "4px" }}>
        {podiumOrder.map((player, idx) => {
          const originalRank = top3.indexOf(player);
          const isCenter = idx === 1; // #1 in center
          const isHot = recentWinnerIds.has(player.id);

          const circleSize = isCenter ? 64 : 52;
          const circleBg = isCenter ? "#FF6800" : "#ffffff";
          const circleShadow = isCenter ? "3px 3px 0 #1a1a1a" : "2px 2px 0 #1a1a1a";

          const badgeBg = isCenter ? "#FF6800" : "#ffffff";
          const badgeColor = "#1a1a1a";

          return (
            <div key={player.id} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              flex: isCenter ? "0 0 36%" : "0 0 28%",
              paddingBottom: isCenter ? 0 : "0px",
            }}>
              {isHot && <i className="ti ti-flame" style={{ fontSize: "14px", color: "#FF6800", marginBottom: "3px" }} />}

              {/* Avatar circle */}
              <div style={{
                width: circleSize, height: circleSize, borderRadius: "50%",
                border: "2.5px solid #1a1a1a", boxShadow: circleShadow,
                background: player.photo_url ? "transparent" : circleBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                fontSize: isCenter ? 20 : 16, fontWeight: 900,
                color: isCenter ? "#ffffff" : "#1a1a1a",
              }}>
                {player.photo_url
                  ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : player.name?.charAt(0)}
              </div>

              {/* Name */}
              <p style={{ fontSize: isCenter ? 12 : 11, fontWeight: 800, color: "#1a1a1a", marginTop: "8px", textAlign: "center" }}>
                {player.name?.split(" ")[0]}
              </p>

              {/* Wins */}
              <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(26,26,26,0.55)", marginTop: "2px" }}>
                {player.wins} win{player.wins !== 1 ? "s" : ""}
              </p>

              {/* Position badge */}
              <div style={{
                marginTop: "6px",
                background: badgeBg, color: badgeColor,
                border: "1.5px solid #1a1a1a",
                borderRadius: "20px", padding: "3px 10px",
                fontSize: "10px", fontWeight: 900,
                boxShadow: isCenter ? "2px 2px 0 #1a1a1a" : "none",
              }}>
                #{originalRank + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1.5px solid rgba(26,26,26,0.15)", margin: "0.75rem 0" }} />

      {/* Rank 4+ list */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {ranked.slice(3, 8).map((player, i) => {
          const isHot = recentWinnerIds.has(player.id);
          return (
            <div key={player.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "6px 0",
              borderBottom: i < ranked.slice(3, 8).length - 1 ? "1px solid rgba(26,26,26,0.10)" : "none",
            }}>
              <span style={{ fontSize: "12px", fontWeight: 900, color: "rgba(26,26,26,0.40)", width: "20px", flexShrink: 0 }}>
                #{i + 4}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#ffffff", border: "1.5px solid #1a1a1a",
                fontSize: "11px", fontWeight: 700, color: "#1a1a1a", flexShrink: 0,
              }}>
                {player.photo_url
                  ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : player.name?.charAt(0)}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", flex: 1 }}>
                {player.name?.split(" ")[0]} {isHot && <i className="ti ti-flame" style={{ fontSize: "12px", color: "#FF6800" }} />}
              </span>
              <div style={{
                background: "#ffffff", border: "1.5px solid #1a1a1a",
                borderRadius: "20px", padding: "2px 8px",
                fontSize: "10px", fontWeight: 800, color: "#1a1a1a",
              }}>
                {player.wins}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}