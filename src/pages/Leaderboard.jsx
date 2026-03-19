import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Medal } from "lucide-react";

export default function Leaderboard() {
  const { data: winningTeams } = useQuery({
    queryKey: ["winningTeams"],
    queryFn: () => base44.entities.WinningTeam.list('-date', 100),
    initialData: [],
  });

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
    initialData: [],
  });

  // Bereken wins per speler
  const playerWins = {};
  winningTeams.forEach((team) => {
    team.winning_player_ids?.forEach((playerId) => {
      playerWins[playerId] = (playerWins[playerId] || 0) + 1;
    });
  });

  // Maak leaderboard met speler info
  const leaderboard = players
    .map((p) => ({
      ...p,
      wins: playerWins[p.id] || 0,
    }))
    .sort((a, b) => b.wins - a.wins)
    .filter((p) => p.wins > 0);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="space-y-6 pb-20">
      <h1 className="t-page-title text-center text-2xl">Leaderboard</h1>

      {/* PODIUM */}
      {top3.length > 0 && (
        <div className="glass p-6">
          <div className="flex items-end justify-center gap-6 mb-4">
            {podiumOrder.map((player, idx) => {
              const medalColors = ["#C0A060", "#FFD700", "#CD7F32"];
              const positions = ["2", "1", "3"];
              const isCenter = idx === 1;

              return (
                <div key={player.id} className="flex flex-col items-center" style={{ flex: isCenter ? "0 0 34%" : "0 0 26%" }}>
                  <Medal size={isCenter ? 28 : 22} style={{ color: medalColors[idx] }} className="mb-1" />
                  <p className="t-metric-orange mb-2" style={{ fontSize: isCenter ? "24px" : "18px" }}>#{positions[idx]}</p>
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} className="rounded-full object-cover mb-2" style={{ width: isCenter ? 72 : 52, height: isCenter ? 72 : 52, border: `3px solid ${medalColors[idx]}` }} />
                  ) : (
                    <div className="rounded-full flex items-center justify-center text-white font-black mb-2" style={{ width: isCenter ? 72 : 52, height: isCenter ? 72 : 52, background: `linear-gradient(135deg, ${medalColors[idx]}, rgba(0,0,0,0.3))`, border: `2px solid ${medalColors[idx]}`, fontSize: isCenter ? 22 : 16 }}>
                      {player.name?.[0]}
                    </div>
                  )}
                  <div className="w-full rounded-t-xl flex flex-col items-center justify-end pt-2 pb-3" style={{ background: `linear-gradient(135deg, ${medalColors[idx]}33, ${medalColors[idx]}11)`, border: `0.5px solid ${medalColors[idx]}55`, minHeight: isCenter ? 56 : 36 }}>
                    <p className="t-card-title text-center truncate w-full px-1" style={{ fontSize: isCenter ? 12 : 10 }}>{player.name?.split(" ")[0]}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: medalColors[idx] }}>{player.wins} wins</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VOLLEDIGE LEADERBOARD */}
      <div className="glass p-6">
        <p className="t-section-title mb-4">Volledige Leaderboard</p>
        <div className="space-y-2">
          {leaderboard.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-4">
                <span className="t-metric-orange w-8 text-center" style={{ fontSize: "18px" }}>{i + 1}</span>
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" style={{ border: "1.5px solid rgba(255,107,0,0.3)" }} />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}>{p.name?.[0]}</div>
                )}
                <span className="t-card-title">{p.name}</span>
              </div>
              <p className="t-metric-orange" style={{ fontSize: "16px" }}>{p.wins} wins</p>
            </div>
          ))}
        </div>
        {leaderboard.length === 0 && <p className="t-tertiary text-center py-8">Geen winnaars geregistreerd</p>}
      </div>

      {/* RECENTE WINNENDE TEAMS */}
      {winningTeams.length > 0 && (
        <div className="glass p-6">
          <p className="t-section-title mb-4">Recente Winnende Teams</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {winningTeams.slice(0, 9).map((team) => (
              <div key={team.id} className="rounded-xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}>
                {team.photo_url && <img src={team.photo_url} alt="Winning team" className="w-full h-48 object-cover" />}
                <div className="p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <p className="t-tertiary mb-1">{new Date(team.date).toLocaleDateString("nl-NL")}</p>
                  <p className="t-secondary">{team.winning_player_ids.length} spelers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}