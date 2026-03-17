import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";

export default function MatchCheckInOverview({ matchId, totalInSelectie = 0 }) {
  const { data: checkIns = [] } = useQuery({
    queryKey: ["matchCheckIns", matchId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ match_id: matchId }),
    enabled: !!matchId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const preIns = checkIns.filter((c) => c.type === "pre");
  const postIns = checkIns.filter((c) => c.type === "post");

  const getPlayer = (id) => players.find((p) => p.id === id);

  const sortedPre = [...preIns].sort((a, b) => {
    const minA = Math.min(a.physical_score ?? 5, a.mental_score ?? 5);
    const minB = Math.min(b.physical_score ?? 5, b.mental_score ?? 5);
    return minA - minB;
  });

  const avgPost = postIns.length
    ? (postIns.reduce((s, c) => s + (c.performance_score ?? 0), 0) / postIns.length).toFixed(1)
    : null;

  function ScoreDot({ score, size = 8 }) {
    const color =
      score <= 2 ? "#EF4444" : score === 3 ? "#F59E0B" : "#22C55E";
    return (
      <span
        className="inline-flex items-center justify-center rounded-full text-white font-500 text-xs"
        style={{ backgroundColor: color, width: size * 4, height: size * 4 }}
      >
        {score}
      </span>
    );
  }

  if (preIns.length === 0 && postIns.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] text-center text-sm text-[#888888] py-6">
        Nog geen check-ins ingevuld voor deze wedstrijd.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pre-game section */}
      {preIns.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00]">Pre-game Check-ins</h3>
            <span className="text-xs bg-[#FFF3EB] text-[#FF6B00] rounded-full px-2 py-1 font-500">
              {preIns.length}{totalInSelectie > 0 ? `/${totalInSelectie}` : ""} ingevuld
            </span>
          </div>

          <div className="space-y-2">
            {sortedPre.map((ci) => {
              const player = getPlayer(ci.player_id);
              const isAlert = (ci.physical_score ?? 5) <= 2 || (ci.mental_score ?? 5) <= 2;
              return (
                <div
                  key={ci.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: isAlert ? "#FFF3EB" : "#F7F5F2" }}
                >
                  {isAlert && <AlertTriangle size={14} className="text-[#FF6B00] flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-500 text-[#1A1A1A] truncate">
                      {player?.name ?? "Onbekend"}
                    </p>
                    {ci.focus_point && (
                      <p className="text-xs text-[#888888] truncate">{ci.focus_point}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-[#888888]">Fysiek</span>
                      <ScoreDot score={ci.physical_score ?? 0} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-[#888888]">Mentaal</span>
                      <ScoreDot score={ci.mental_score ?? 0} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-game section */}
      {postIns.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00]">Post-game Reflecties</h3>
            <div className="flex items-center gap-2">
              {avgPost && (
                <span className="text-2xl font-500 text-[#FF6B00]">{avgPost}</span>
              )}
              <span className="text-xs text-[#888888]">gem. tevredenheid</span>
            </div>
          </div>

          <div className="space-y-3">
            {postIns.map((ci) => {
              const player = getPlayer(ci.player_id);
              const preIn = preIns.find((p) => p.player_id === ci.player_id);
              return (
                <div key={ci.id} className="p-3 rounded-xl bg-[#F7F5F2] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-500 text-[#1A1A1A] flex-1 truncate">
                      {player?.name ?? "Onbekend"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {preIn?.mental_score && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-[#888888]">Pre</span>
                          <ScoreDot score={preIn.mental_score} size={7} />
                        </div>
                      )}
                      {ci.performance_score && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-[#888888]">Post</span>
                          <ScoreDot score={ci.performance_score} size={7} />
                        </div>
                      )}
                    </div>
                  </div>
                  {ci.what_went_well && (
                    <p className="text-xs text-[#1A1A1A]">
                      <span className="text-[#22C55E] font-500">✓ </span>{ci.what_went_well}
                    </p>
                  )}
                  {ci.what_to_improve && (
                    <p className="text-xs text-[#888888]">
                      <span className="font-500">→ </span>{ci.what_to_improve}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}