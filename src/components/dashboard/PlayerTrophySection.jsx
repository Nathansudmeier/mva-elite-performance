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
    <div className="relative overflow-hidden" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "0.5px solid rgba(255,255,255,0.14)", borderRadius: "26px", padding: "20px" }}>
      {/* Shine */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", pointerEvents: "none" }} />
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(234,179,8,0.28)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,107,0,0.20)", filter: "blur(50px)", pointerEvents: "none" }} />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <TrophyIcon />
          <div>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, letterSpacing: "-0.3px" }}>Champions Trophy</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", marginTop: "2px" }}>Seizoen 2025-26 · Intern toernooi</p>
          </div>
        </div>
        <Link to="/Leaderboard" style={{ background: "rgba(255,107,0,0.18)", border: "0.5px solid rgba(255,107,0,0.35)", color: "#FF8C3A", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none" }}>
          Volledig →
        </Link>
      </div>

      {/* Podium */}
      <div className="relative flex items-end gap-2 mb-4">
        {podiumOrder.map(({ meta, player }) => {
          if (!player) return <div key={meta.rank} style={{ flex: 1 }} />;
          return (
            <div key={meta.rank} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Flame */}
              {player.isRecentWinner && (meta.rank === 1 || meta.rank === 2) && (
                <i className="ti ti-flame" style={{ fontSize: "16px", color: "#FF8C3A", marginBottom: "2px" }} />
              )}
              {/* Avatar */}
              <Avatar player={player} size={meta.size} border={meta.border} />
              {/* Name */}
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", marginTop: "6px", textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {player.name?.split(" ")[0]}
              </p>
              {/* Wins */}
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "6px" }}>{player.wins}W</p>
              {/* Platform */}
              <div style={{ width: "100%", height: meta.platformH, background: meta.platformBg, border: `0.5px solid ${meta.platformBorder}`, borderRadius: "14px 14px 0 0", display: "flex", alignItems: "center", justifyContent: "center", color: meta.platformColor, fontSize: meta.rank === 1 ? "20px" : "14px", fontWeight: 800 }}>
                {meta.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rank 4-6 */}
      {rank4to6.length > 0 && (
        <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "0" }}>
          {rank4to6.map((p, i) => {
            const rank = i + 4;
            const initials = p.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i < rank4to6.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", width: "22px", flexShrink: 0 }}>#{rank}</span>
                <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                  {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                </div>
                <span style={{ flex: 1, fontSize: "13px", color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name?.split(" ")[0]}
                  {p.isRecentWinner && <i className="ti ti-flame" style={{ fontSize: "14px", color: "#FF8C3A", marginLeft: "4px" }} />}
                </span>
                <span style={{ background: "rgba(255,107,0,0.12)", border: "0.5px solid rgba(255,107,0,0.20)", color: "#FF8C3A", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600 }}>
                  {p.wins}W
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Own position pill */}
      {myEntry && (
        <div style={{ background: "rgba(255,107,0,0.12)", border: "0.5px solid rgba(255,107,0,0.25)", borderRadius: "14px", padding: "10px 12px", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>Jouw positie</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#FF8C3A", lineHeight: 1.2 }}>#{myRank}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{myEntry.wins} wins</p>
            {nextEntry && myRank > 1 && (
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)" }}>{gapToNext} {gapToNext === 1 ? "punt" : "punten"} van #{myRank - 1}</p>
            )}
            {myRank === 1 && (
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)" }}>Jij staat aan kop 🏆</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}