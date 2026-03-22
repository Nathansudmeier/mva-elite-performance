import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle2, Users } from "lucide-react";

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
    <div className="space-y-5">
      {/* Pre-game section */}
      <div className="space-y-3">
        <p className="t-label">PRE-GAME ({preCheckIns.length} van ~{totalInSelectie})</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {preCheckInsSorted.length === 0 ? (
            <div className="flex flex-col items-center py-5 gap-2">
              <AlertCircle size={22} style={{ color: "rgba(255,255,255,0.25)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Nog geen pre-game check-ins</p>
            </div>
          ) : (
            preCheckInsSorted.map(c => {
              const player = players.find(p => p.id === c.player_id);
              const isLow = c.mental_score <= 2;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl text-sm"
                  style={{
                    background: isLow ? "rgba(248,113,113,0.10)" : "rgba(255,107,0,0.10)",
                    border: isLow ? "0.5px solid rgba(248,113,113,0.25)" : "0.5px solid rgba(255,107,0,0.20)",
                    borderLeft: isLow ? "2px solid #f87171" : "2px solid #FF6B00",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isLow && <AlertCircle size={14} style={{ color: "#f87171" }} />}
                    <span className="t-card-title">{player?.name || "–"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="t-label">Mentaal</p>
                      <p className="font-semibold text-sm" style={{ color: isLow ? "#f87171" : "#FF8C3A" }}>{c.mental_score}/5</p>
                    </div>
                    <div className="text-right">
                      <p className="t-label">Fysiek</p>
                      <p className="font-semibold text-sm text-white">{c.physical_score}/5</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Post-game section */}
      <div className="space-y-3 pt-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.10)" }}>
        <p className="t-label">POST-GAME ({postCheckIns.length})</p>
        {postCheckIns.length === 0 ? (
          <div className="flex flex-col items-center py-5 gap-2">
            <CheckCircle2 size={22} style={{ color: "rgba(255,255,255,0.25)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Nog geen post-game check-ins</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {postCheckIns.map(c => {
              const player = players.find(p => p.id === c.player_id);
              const avgScore = ((c.performance_score || 0) + (c.focus_execution_score || 0)) / 2;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl text-sm"
                  style={{ background: "rgba(74,222,128,0.08)", border: "0.5px solid rgba(74,222,128,0.20)", borderLeft: "2px solid #4ade80" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
                    <span className="t-card-title">{player?.name || "–"}</span>
                  </div>
                  <div className="text-right">
                    <p className="t-label">Gemiddeld</p>
                    <p className="font-semibold text-sm" style={{ color: "#4ade80" }}>{avgScore.toFixed(1)}/5</p>
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