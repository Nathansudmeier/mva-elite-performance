import React from "react";
import { useNavigate } from "react-router-dom";

const MEDALS = [
  { rank: 1, bg: "#FFD600", border: "#1a1a1a", shadow: "4px 4px 0 #1a1a1a", label: "🥇", textColor: "#1a1a1a" },
  { rank: 2, bg: "#ffffff", border: "#1a1a1a", shadow: "3px 3px 0 #1a1a1a", label: "🥈", textColor: "#1a1a1a" },
  { rank: 3, bg: "rgba(255,104,0,0.15)", border: "#FF6800", shadow: "2px 2px 0 #FF6800", label: "🥉", textColor: "#1a1a1a" },
];

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
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>Champions Trophy</h2>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.40)" }}>Nog geen winnaars geregistreerd.</p>
      </div>
    );
  }

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem 0.5rem" }}>
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>Champions Trophy</h2>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.40)", marginTop: "2px" }}>Seizoen 2025-26 · Intern toernooi</p>
        </div>
        <button
          onClick={() => navigate("/Leaderboard")}
          style={{
            fontSize: "12px", fontWeight: 700, color: "#FF6800",
            background: "rgba(255,104,0,0.10)", border: "1.5px solid rgba(255,104,0,0.30)",
            borderRadius: "20px", padding: "4px 12px", cursor: "pointer",
          }}
        >
          Leaderboard →
        </button>
      </div>

      {/* Podium */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "10px", padding: "12px 20px 8px" }}>
        {podiumOrder.map((player, idx) => {
          const originalRank = top3.indexOf(player);
          const medal = MEDALS[originalRank];
          const isCenter = idx === 1;
          const isHot = recentWinnerIds.has(player.id);

          return (
            <div key={player.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: isCenter ? "0 0 36%" : "0 0 28%" }}>
              {isHot && <i className="ti ti-flame" style={{ fontSize: "16px", color: "#FF6800", marginBottom: "4px" }} />}
              <div style={{
                width: isCenter ? 68 : 52, height: isCenter ? 68 : 52,
                borderRadius: "50%", overflow: "hidden",
                border: `3px solid ${medal.border}`,
                boxShadow: medal.shadow,
                background: player.photo_url ? "transparent" : medal.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isCenter ? 22 : 18, fontWeight: 900, color: medal.textColor,
                position: "relative",
              }}>
                {player.photo_url
                  ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : player.name?.charAt(0)}
                <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: "14px" }}>{medal.label}</span>
              </div>
              <p style={{ fontSize: isCenter ? 13 : 11, fontWeight: 800, color: "#1a1a1a", marginTop: "8px", textAlign: "center" }}>
                {player.name?.split(" ")[0]}
              </p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: originalRank === 0 ? "#cc9900" : "rgba(26,26,26,0.45)", marginTop: "1px" }}>
                {player.wins} win{player.wins !== 1 ? "s" : ""}
              </p>
              <div style={{
                width: "100%", marginTop: "8px", borderRadius: "8px 8px 0 0",
                height: isCenter ? 52 : idx === 0 ? 36 : 24,
                background: medal.bg, border: `2px solid ${medal.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "14px", fontWeight: 900, color: medal.textColor, opacity: 0.7 }}>#{originalRank + 1}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: "1.5px", background: "rgba(26,26,26,0.08)", margin: "4px 16px 0" }} />

      {/* Rank 4 & 5 */}
      <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {ranked.slice(3, 5).map((player, i) => {
          const isHot = recentWinnerIds.has(player.id);
          return (
            <div key={player.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "rgba(26,26,26,0.04)", borderRadius: "12px",
              padding: "10px 12px", border: "1px solid rgba(26,26,26,0.08)",
            }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(26,26,26,0.35)", width: "20px" }}>#{i + 4}</span>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#FFF3E8", border: "2px solid #1a1a1a",
                fontSize: "12px", fontWeight: 700, color: "#1a1a1a", flexShrink: 0,
              }}>
                {player.photo_url
                  ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : player.name?.charAt(0)}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", flex: 1 }}>
                {player.name?.split(" ")[0]} {isHot && <i className="ti ti-flame" style={{ fontSize: "13px", color: "#FF6800" }} />}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF6800" }}>{player.wins}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}