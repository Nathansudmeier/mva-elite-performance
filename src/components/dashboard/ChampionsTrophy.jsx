import React from "react";
import { Trophy, TrendingUp, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function ChampionsTrophy({ players, winningTeams }) {
  // Calculate wins per player based solely on WinningTeam records
  const leaderboard = players.map((player) => {
    const timesWon = winningTeams.filter(
      (wt) => wt.winning_player_ids && wt.winning_player_ids.includes(player.id)
    ).length;

    return {
      ...player,
      timesWon,
    };
  }).sort((a, b) => b.timesWon - a.timesWon);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="elite-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor:'#FDE8DC'}}>
          <Trophy size={20} style={{color:'#D45A30'}} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1A1F2E]">MVA Champions Trophy</h2>
          <p className="text-xs text-[#2F3650]">Interne Competitie Ranglijst</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-3 mb-8">
        {[1, 0, 2].map((idx) => {
          const p = topThree[idx];
          if (!p) return <div key={idx} className="w-24" />;
          const heights = ["h-32", "h-24", "h-20"];
          const bgColors = ["bg-[#D45A30]", "bg-[#2F3650]", "bg-[#F0926E]"];
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
                {rank === 1 && <Crown size={16} className="text-[#D45A30] absolute -top-5 left-1/2 -translate-x-1/2" />}
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white" style={{backgroundColor:'#2F3650', border:'2px solid #FDE8DC'}}>
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{backgroundColor:'#FDE8DC'}}
          onMouseEnter={e => e.currentTarget.style.backgroundColor='#FFF5F0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor='#FDE8DC'}
          >
            <span className={`w-6 text-center text-sm font-bold ${i < 3 ? "text-[#D45A30]" : "text-[#2F3650]"}`}>
              {i + 1}
            </span>
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white" style={{backgroundColor:'#2F3650'}}>
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                p.name?.charAt(0)
              )}
            </div>
            <span className="flex-1 text-sm font-medium text-[#1A1F2E]">{p.name}</span>
            <div className="text-right">
              <span className="text-sm font-bold text-[#D45A30]">{(p.winRatio * 100).toFixed(0)}%</span>
              <span className="text-xs text-[#2F3650] ml-2">{p.timesWon}W / {p.timesPresent}P</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}