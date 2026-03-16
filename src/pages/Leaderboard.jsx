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
    <div className="min-h-screen bg-gradient-to-b from-[#E8724A] to-[#D45A30] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8 text-center">🏆 Leaderboard</h1>

        {/* PODIUM */}
        {top3.length > 0 && (
          <div className="mb-12">
            <div className="flex items-end justify-center gap-6 mb-8">
              {podiumOrder.map((player, idx) => {
                const actualRank = leaderboard.indexOf(player) + 1;
                const heights = ["h-40", "h-48", "h-36"];
                const medalColors = ["#C0A060", "#FFD700", "#CD7F32"];
                const positions = ["2", "1", "3"];

                return (
                  <div key={player.id} className="flex flex-col items-center">
                    <div className="mb-3 text-center">
                      <Medal
                        size={32}
                        style={{ color: medalColors[idx] }}
                        className="mx-auto mb-2"
                      />
                      <p className="text-2xl font-black text-white">{positions[idx]}</p>
                    </div>
                    <div className={`flex flex-col items-center ${heights[idx]}`}>
                      {player.photo_url && (
                        <img
                          src={player.photo_url}
                          alt={player.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white mb-3"
                        />
                      )}
                      <div className={`flex-1 rounded-t-2xl px-4 py-6 flex flex-col items-center justify-end w-full`}
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
                        <p className="font-black text-white text-center text-sm">{player.name}</p>
                        <p className="text-lg font-black text-white mt-2">{player.wins} wins</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VOLLEDIGE LEADERBOARD */}
        <div className="elite-card p-6 mb-8">
          <h2 className="text-2xl font-black text-[#1A1F2E] mb-4">Volledige Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: "#FDE8DC" }}
              >
                <div className="flex items-center gap-4">
                  <span className="font-black text-lg text-[#D45A30] w-8 text-center">{i + 1}</span>
                  {p.photo_url && (
                    <img
                      src={p.photo_url}
                      alt={p.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <span className="font-semibold text-[#1A1F2E]">{p.name}</span>
                </div>
                <p className="font-black text-[#D45A30] text-lg">{p.wins} wins</p>
              </div>
            ))}
          </div>
          {leaderboard.length === 0 && (
            <p className="text-center text-[#2F3650] py-8">Geen winnaars geregistreerd</p>
          )}
        </div>

        {/* RECENTE WINNENDE TEAMS */}
        {winningTeams.length > 0 && (
          <div className="elite-card p-6">
            <h2 className="text-2xl font-black text-[#1A1F2E] mb-4">Recente Winnende Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {winningTeams.slice(0, 9).map((team) => (
                <div key={team.id} className="rounded-lg overflow-hidden border-2" style={{ borderColor: "#FDE8DC" }}>
                  {team.photo_url && (
                    <img
                      src={team.photo_url}
                      alt="Winning team"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-3 bg-white">
                    <p className="text-xs text-[#2F3650] mb-2">{new Date(team.date).toLocaleDateString("nl-NL")}</p>
                    <p className="text-sm font-semibold text-[#1A1F2E]">
                      {team.winning_player_ids.length} spelers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}