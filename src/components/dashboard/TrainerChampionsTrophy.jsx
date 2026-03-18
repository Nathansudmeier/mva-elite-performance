import React from "react";
import { useNavigate } from "react-router-dom";

const MEDALS = [
  { rank: 1, bg: "linear-gradient(135deg, #FFD700, #FFA500)", shadow: "0 4px 20px rgba(255,200,0,0.4)", label: "🥇", numColor: "#B8860B" },
  { rank: 2, bg: "linear-gradient(135deg, #C0C0C0, #A8A8A8)", shadow: "0 4px 16px rgba(180,180,180,0.4)", label: "🥈", numColor: "#808080" },
  { rank: 3, bg: "linear-gradient(135deg, #CD7F32, #A0522D)", shadow: "0 4px 16px rgba(160,100,50,0.4)", label: "🥉", numColor: "#8B4513" },
];

export default function TrainerChampionsTrophy({ players, winningTeams }) {
  const navigate = useNavigate();

  // Calculate win counts
  const playerWinCounts = {};
  players.forEach((p) => {
    playerWinCounts[p.id] = winningTeams.filter((w) => w.winning_player_ids?.includes(p.id)).length;
  });

  // Find players who won the last 3 trainingen
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-500 text-[#1A1A1A]">🏆 Champions Trophy</h2>
          <button onClick={() => navigate("/Leaderboard")} className="text-sm font-500 text-[#FF6B00] hover:text-[#E55A00]">
            Volledig leaderboard →
          </button>
        </div>
        <p className="text-sm text-[#888888]">Nog geen winnaars geregistreerd.</p>
      </div>
    );
  }

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeights = [top3[1] ? "h-24" : null, "h-32", top3[2] ? "h-16" : null];

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm border border-[#1A1F2E]"
      style={{ background: "linear-gradient(160deg, #1A1F2E 0%, #2C3350 60%, #1A1F2E 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">🏆 Champions Trophy</h2>
          <p className="text-xs text-white/50 mt-0.5">Seizoen 2025-26 · Intern toernooi</p>
        </div>
        <button
          onClick={() => navigate("/Leaderboard")}
          className="text-xs font-semibold text-[#FF6B00] hover:text-[#F0926E] transition-colors bg-white/10 px-3 py-1.5 rounded-full"
        >
          Volledig leaderboard →
        </button>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 px-6 pt-4 pb-2">
        {podiumOrder.map((player, idx) => {
          const originalRank = top3.indexOf(player); // 0=1st, 1=2nd, 2=3rd
          const medal = MEDALS[originalRank];
          const isCenter = idx === 1; // 1st place in center
          const isHot = recentWinnerIds.has(player.id);

          return (
            <div key={player.id} className="flex flex-col items-center" style={{ flex: isCenter ? "0 0 36%" : "0 0 28%" }}>
              {/* Flame badge */}
              {isHot && (
                <span className="text-lg mb-1 animate-bounce">🔥</span>
              )}
              {/* Avatar */}
              <div
                className="rounded-full overflow-hidden border-4 flex items-center justify-center text-white font-black relative"
                style={{
                  width: isCenter ? 72 : 56,
                  height: isCenter ? 72 : 56,
                  borderColor: medal.numColor,
                  boxShadow: medal.shadow,
                  background: player.photo_url ? "transparent" : medal.bg,
                  fontSize: isCenter ? 22 : 18,
                }}
              >
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  player.name?.charAt(0)
                )}
                {/* Medal badge */}
                <span
                  className="absolute -bottom-1 -right-1 text-sm leading-none"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                >
                  {medal.label}
                </span>
              </div>

              {/* Name */}
              <p
                className="text-white font-semibold text-center leading-tight mt-2 truncate w-full text-center"
                style={{ fontSize: isCenter ? 13 : 11 }}
              >
                {player.name?.split(" ")[0]}
              </p>

              {/* Wins */}
              <p className="text-[10px] font-bold mt-0.5" style={{ color: medal.numColor }}>
                {player.wins} win{player.wins !== 1 ? "s" : ""}
              </p>

              {/* Podium block */}
              <div
                className="w-full mt-2 rounded-t-xl flex items-center justify-center"
                style={{
                  height: isCenter ? 56 : idx === 0 ? 40 : 28,
                  background: medal.bg,
                  boxShadow: medal.shadow,
                  opacity: 0.85,
                }}
              >
                <span className="text-white font-black text-lg opacity-70">#{originalRank + 1}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-white/10 my-3" />

      {/* Rank 4 & 5 */}
      <div className="px-6 pb-5 space-y-2">
        {ranked.slice(3, 5).map((player, i) => {
          const isHot = recentWinnerIds.has(player.id);
          return (
            <div key={player.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
              <span className="text-white/40 font-bold text-sm w-5">#{i + 4}</span>
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                {player.photo_url
                  ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                  : player.name?.charAt(0)}
              </div>
              <span className="text-white/80 text-sm font-medium flex-1 truncate">
                {player.name?.split(" ")[0]} {isHot && "🔥"}
              </span>
              <span className="text-[#FF6B00] text-sm font-bold">{player.wins}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}