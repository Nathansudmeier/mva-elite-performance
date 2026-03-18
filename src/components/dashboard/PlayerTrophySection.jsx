import React from "react";
import { Trophy } from "lucide-react";

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#D4AF37", "#A8A9AD", "#CD7F32"];

export default function PlayerTrophySection({ players, winningTeams, currentPlayerId }) {
  if (!players.length || !winningTeams.length) return null;

  // Last 3 winning team records by date
  const sorted = [...winningTeams].sort((a, b) => a.date > b.date ? -1 : 1);
  const last3 = sorted.slice(0, 3);
  const recentWinnerIds = new Set(last3.flatMap(wt => wt.winning_player_ids || []));

  // Build leaderboard
  const leaderboard = players.map(p => ({
    ...p,
    wins: winningTeams.filter(wt => wt.winning_player_ids?.includes(p.id)).length,
    isRecentWinner: recentWinnerIds.has(p.id),
  })).sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name));

  const top3 = leaderboard.slice(0, 3);
  const myEntry = leaderboard.find(p => p.id === currentPlayerId);
  const myRank = leaderboard.findIndex(p => p.id === currentPlayerId) + 1;
  const myInTop3 = myRank <= 3;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
      <h2 className="font-medium text-sm uppercase tracking-wide text-[#FF6B00] mb-4 flex items-center gap-2">
        <Trophy size={14} /> Champions Trophy
      </h2>

      {/* Top 3 */}
      <div className="space-y-2 mb-3">
        {top3.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: p.id === currentPlayerId ? "#FFF3EB" : "#F7F5F2" }}
          >
            <span className="text-xl w-7 text-center">{MEDALS[i]}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: MEDAL_COLORS[i] }}>
              {p.photo_url
                ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                : p.name?.charAt(0)
              }
            </div>
            <span className="flex-1 text-sm font-medium text-[#1A1A1A] truncate">
              {p.name?.split(" ")[0]}
              {p.isRecentWinner && <span className="ml-1">🔥</span>}
            </span>
            <span className="text-sm font-bold text-[#FF6B00]">{p.wins}W</span>
          </div>
        ))}
      </div>

      {/* Own position if not in top 3 */}
      {!myInTop3 && myEntry && (
        <>
          <div className="border-t border-dashed border-[#E8E6E1] my-2" />
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#FFF3EB]">
            <span className="text-sm font-bold text-[#888888] w-7 text-center">#{myRank}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white bg-[#FF6B00]">
              {myEntry.photo_url
                ? <img src={myEntry.photo_url} alt={myEntry.name} className="w-full h-full object-cover" />
                : myEntry.name?.charAt(0)
              }
            </div>
            <span className="flex-1 text-sm font-medium text-[#FF6B00] truncate">
              {myEntry.name?.split(" ")[0]} (jij)
              {myEntry.isRecentWinner && <span className="ml-1">🔥</span>}
            </span>
            <span className="text-sm font-bold text-[#FF6B00]">{myEntry.wins}W</span>
          </div>
        </>
      )}
    </div>
  );
}