import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function MatchCheckInOverview({ matchId, totalInSelectie }) {
  const { data: checkIns = [] } = useQuery({
    queryKey: ["matchCheckIns", matchId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ match_id: matchId }),
    enabled: !!matchId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  // Group by type
  const preCheckIns = checkIns.filter(c => c.type === "pre");
  const postCheckIns = checkIns.filter(c => c.type === "post");

  // Sort pre-check-ins by lowest mental score first
  const preCheckInsSorted = preCheckIns.sort((a, b) => (a.mental_score || 5) - (b.mental_score || 5));

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E6E1] shadow-sm space-y-5">
      <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00]">Check-in Status</h2>

      {/* Pre-game section */}
      <div className="space-y-3">
        <p className="text-xs font-500 text-[#1A1A1A] uppercase tracking-wide">
          Pre-game ({preCheckIns.length} van ~{totalInSelectie})
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {preCheckInsSorted.length === 0 ? (
            <p className="text-sm text-[#888888]">Nog geen pre-game check-ins</p>
          ) : (
            preCheckInsSorted.map(c => {
              const player = players.find(p => p.id === c.player_id);
              const isLow = c.mental_score <= 2;
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                    isLow ? "bg-[#FDECEA] border-l-2 border-[#C0392B]" : "bg-[#FFF3EB] border-l-2 border-[#FF6B00]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isLow && <AlertCircle size={14} color="#C0392B" />}
                    <span className="font-500 text-[#1A1A1A]">{player?.name || "–"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-[#888888]">Mentaal</p>
                      <p className={`font-500 ${isLow ? "text-[#C0392B]" : "text-[#FF6B00]"}`}>
                        {c.mental_score}/5
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#888888]">Fysiek</p>
                      <p className="font-500 text-[#1A1A1A]">{c.physical_score}/5</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Post-game section */}
      <div className="space-y-3 border-t border-[#E8E6E1] pt-4">
        <p className="text-xs font-500 text-[#1A1A1A] uppercase tracking-wide">
          Post-game ({postCheckIns.length})
        </p>
        {postCheckIns.length === 0 ? (
          <p className="text-sm text-[#888888]">Nog geen post-game check-ins</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {postCheckIns.map(c => {
              const player = players.find(p => p.id === c.player_id);
              const avgScore = ((c.performance_score || 0) + (c.focus_execution_score || 0)) / 2;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-[#EBF5E1] border-l-2 border-[#3B6D11] text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} color="#3B6D11" />
                    <span className="font-500 text-[#1A1A1A]">{player?.name || "–"}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#888888]">Gemiddeld</p>
                    <p className="font-500 text-[#3B6D11]">{avgScore.toFixed(1)}/5</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}