import React from "react";
import { Link } from "react-router-dom";

function TrophyIcon() {
  return (
    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(234,179,8,0.15)", border: "0.5px solid rgba(234,179,8,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="tg-player" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#FF8C3A" />
          </linearGradient>
        </defs>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="url(#tg-player)" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="url(#tg-player)" />
        <path d="M4 22h16" stroke="url(#tg-player)" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="url(#tg-player)" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="url(#tg-player)" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" stroke="url(#tg-player)" />
      </svg>
    </div>
  );
}

const PODIUM = [
  {
    rank: 1,
    size: 58,
    border: "2.5px solid rgba(234,179,8,0.7)",
    platformH: 56,
    platformBg: "linear-gradient(180deg, rgba(234,179,8,0.40), rgba(234,179,8,0.15))",
    platformBorder: "rgba(234,179,8,0.45)",
    platformColor: "#fbbf24",
    label: "#1",
  },
  {
    rank: 2,
    size: 48,
    border: "2px solid rgba(148,163,184,0.5)",
    platformH: 40,
    platformBg: "linear-gradient(180deg, rgba(148,163,184,0.25), rgba(148,163,184,0.08))",
    platformBorder: "rgba(148,163,184,0.25)",
    platformColor: "#94a3b8",
    label: "#2",
  },
  {
    rank: 3,
    size: 44,
    border: "2px solid rgba(180,83,9,0.5)",
    platformH: 30,
    platformBg: "linear-gradient(180deg, rgba(180,83,9,0.25), rgba(180,83,9,0.08))",
    platformBorder: "rgba(180,83,9,0.30)",
    platformColor: "#c2846a",
    label: "#3",
  },
];

function Avatar({ player, size, border }) {
  const initials = player?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.10)", fontSize: size * 0.32, fontWeight: 700, color: "#fff",
      }}
    >
      {player?.photo_url
        ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}

export default function PlayerTrophySection({ players, winningTeams, currentPlayerId }) {
  if (!players.length || !winningTeams.length) return null;

  const sorted = [...winningTeams].sort((a, b) => a.date > b.date ? -1 : 1);
  const last3 = sorted.slice(0, 3);
  const recentWinnerIds = new Set(last3.flatMap(wt => wt.winning_player_ids || []));

  const leaderboard = players.map(p => ({
    ...p,
    wins: winningTeams.filter(wt => wt.winning_player_ids?.includes(p.id)).length,
    isRecentWinner: recentWinnerIds.has(p.id),
  })).sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name));

  const top3 = leaderboard.slice(0, 3);
  const rank4to6 = leaderboard.slice(3, 6);
  const myEntry = leaderboard.find(p => p.id === currentPlayerId);
  const myRank = leaderboard.findIndex(p => p.id === currentPlayerId) + 1;

  // Distance to next position
  const nextEntry = myRank > 1 ? leaderboard[myRank - 2] : null;
  const gapToNext = nextEntry ? nextEntry.wins - (myEntry?.wins || 0) : 0;

  // Podium order: #2 left, #1 center, #3 right
  const podiumOrder = [
    { meta: PODIUM[1], player: top3[1] },
    { meta: PODIUM[0], player: top3[0] },
    { meta: PODIUM[2], player: top3[2] },
  ];

  return (
    <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <img
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/fdbc19efe_Emvi-champion.png"
          alt="Emvi Champion"
          style={{ width: "52px", height: "52px", objectFit: "contain", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2 }}>Champions Trophy</p>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", fontWeight: 600, marginTop: "2px" }}>Seizoen 2025-26</p>
        </div>
        <Link to="/Leaderboard" style={{
          fontSize: "11px", fontWeight: 800, color: "#1a1a1a",
          background: "rgba(26,26,26,0.10)", border: "1.5px solid #1a1a1a",
          borderRadius: "20px", padding: "4px 12px",
          boxShadow: "2px 2px 0 #1a1a1a", textDecoration: "none", whiteSpace: "nowrap",
        }}>
          Ranking →
        </Link>
      </div>

      {/* Podium */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "12px", marginBottom: "4px" }}>
        {podiumOrder.map(({ meta, player }) => {
          if (!player) return <div key={meta.rank} style={{ flex: "0 0 28%" }} />;
          const isCenter = meta.rank === 1;
          const circleSize = isCenter ? 64 : 52;
          const circleBg = isCenter ? "#FF6800" : "#ffffff";
          const circleShadow = isCenter ? "3px 3px 0 #1a1a1a" : "2px 2px 0 #1a1a1a";
          return (
            <div key={meta.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: isCenter ? "0 0 36%" : "0 0 28%" }}>
              {player.isRecentWinner && (
                <i className="ti ti-flame" style={{ fontSize: "14px", color: "#FF6800", marginBottom: "3px" }} />
              )}
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
              <p style={{ fontSize: isCenter ? 12 : 11, fontWeight: 800, color: "#1a1a1a", marginTop: "8px", textAlign: "center" }}>
                {player.name?.split(" ")[0]}
              </p>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(26,26,26,0.55)", marginTop: "2px" }}>
                {player.wins} win{player.wins !== 1 ? "s" : ""}
              </p>
              <div style={{
                marginTop: "6px",
                background: isCenter ? "#FF6800" : "#ffffff",
                color: "#1a1a1a",
                border: "1.5px solid #1a1a1a",
                borderRadius: "20px", padding: "3px 10px",
                fontSize: "10px", fontWeight: 900,
                boxShadow: isCenter ? "2px 2px 0 #1a1a1a" : "none",
              }}>
                #{meta.rank}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1.5px solid rgba(26,26,26,0.15)", margin: "0.75rem 0" }} />

      {/* Rank 4-6 */}
      {rank4to6.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rank4to6.map((p, i) => {
            const rank = i + 4;
            const initials = p.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "6px 0",
                borderBottom: i < rank4to6.length - 1 ? "1px solid rgba(26,26,26,0.10)" : "none",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 900, color: "rgba(26,26,26,0.40)", width: "20px", flexShrink: 0 }}>#{rank}</span>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#ffffff", border: "1.5px solid #1a1a1a",
                  fontSize: "11px", fontWeight: 700, color: "#1a1a1a", flexShrink: 0,
                }}>
                  {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                </div>
                <span style={{ flex: 1, fontSize: "13px", fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name?.split(" ")[0]}
                  {p.isRecentWinner && <i className="ti ti-flame" style={{ fontSize: "12px", color: "#FF6800", marginLeft: "4px" }} />}
                </span>
                <div style={{
                  background: "#ffffff", border: "1.5px solid #1a1a1a",
                  borderRadius: "20px", padding: "2px 8px",
                  fontSize: "10px", fontWeight: 800, color: "#1a1a1a",
                }}>
                  {p.wins}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Own position pill */}
      {myEntry && (
        <div style={{
          background: "rgba(26,26,26,0.08)", border: "1.5px solid #1a1a1a",
          borderRadius: "14px", padding: "10px 12px", marginTop: "12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.50)", fontWeight: 600 }}>Jouw positie</p>
            <p style={{ fontSize: "18px", fontWeight: 900, color: "#FF6800", lineHeight: 1.2 }}>#{myRank}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>{myEntry.wins} wins</p>
            {nextEntry && myRank > 1 && (
              <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.50)", fontWeight: 600 }}>{gapToNext} {gapToNext === 1 ? "punt" : "punten"} van #{myRank - 1}</p>
            )}
            {myRank === 1 && (
              <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.50)", fontWeight: 600 }}>Jij staat aan kop 🏆</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}