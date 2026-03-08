import React from "react";
import { Trophy, TrendingUp, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function ChampionsTrophy({ players, attendanceData, winningTeams }) {
  // Calculate win ratio for each player
  const leaderboard = players.map((player) => {
    const timesPresent = attendanceData.filter(
      (a) => a.player_id === player.id && a.present
    ).length;

    const timesWon = winningTeams.filter(
      (wt) => wt.winning_player_ids && wt.winning_player_ids.includes(player.id)
    ).length;

    const winRatio = timesPresent > 0 ? timesWon / timesPresent : 0;

    return {
      ...player,
      timesPresent,
      timesWon,
      winRatio,
    };
  }).sort((a, b) => b.winRatio - a.winRatio || b.timesWon - a.timesWon);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="elite-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/20 flex items-center justify-center">
          <Trophy size={20} className="text-[#FF6B00]" />
        </div>
        <div>
          <h2 className="text-lg font-bold">MVA Champions Trophy</h2>
          <p className="text-xs text-[#a0a0a0]">Interne Competitie Ranglijst</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-3 mb-8">
        {[1, 0, 2].map((idx) => {
          const p = topThree[idx];
          if (!p) return <div key={idx} className="w-24" />;
          const heights = ["h-32", "h-24", "h-20"];
          const bgColors = ["bg-[#FF6B00]", "bg-[#1a3a8f]", "bg-[#333]"];
          const rank = idx === 0 ? 1 : idx === 1 ? 2 : 3;
          return (
            <motion.div
              key={p.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                {rank === 1 && <Crown size={16} className="text-[#FF6B00] absolute -top-5 left-1/2 -translate-x-1/2" />}
                <div className="w-12 h-12 rounded-full bg-[#222] border-2 border-[#333] overflow-hidden flex items-center justify-center text-sm font-bold">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.name?.charAt(0)
                  )}
                </div>
              </div>
              <p className="text-xs font-medium mb-1 text-center truncate w-20">{p.name?.split(" ")[0]}</p>
              <div className={`${heights[idx]} w-20 ${bgColors[idx]} rounded-t-lg flex flex-col items-center justify-start pt-3`}>
                <span className="text-xl font-black">{rank}</span>
                <span className="text-[10px] mt-1 opacity-80">{(p.winRatio * 100).toFixed(0)}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {leaderboard.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-colors"
          >
            <span className={`w-6 text-center text-sm font-bold ${i < 3 ? "text-[#FF6B00]" : "text-[#666]"}`}>
              {i + 1}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#222] overflow-hidden flex items-center justify-center text-xs font-bold">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                p.name?.charAt(0)
              )}
            </div>
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            <div className="text-right">
              <span className="text-sm font-bold text-[#FF6B00]">{(p.winRatio * 100).toFixed(0)}%</span>
              <span className="text-xs text-[#666] ml-2">{p.timesWon}W / {p.timesPresent}P</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}