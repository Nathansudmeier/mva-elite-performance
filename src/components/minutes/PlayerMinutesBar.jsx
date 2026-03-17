import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcPlayerSeasonStats } from "@/utils/calculateMinutes";
import { Clock, TrendingUp, AlertTriangle } from "lucide-react";

export default function PlayerMinutesBar({ playerId }) {
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const stats = calcPlayerSeasonStats(matches, playerId);

  if (stats.availableMinutes === 0) return null;

  const { totalMinutes, gamesStarted, gamesAsSubstitute, avgMinutes, mo17Minutes, dames1Minutes, matchData, minutesPct, isAttentionPoint } = stats;

  return (
    <div className={`bg-white rounded-2xl p-4 border shadow-sm ${isAttentionPoint ? "border-amber-300" : "border-[#E8E6E1]"}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] flex items-center gap-2">
          <Clock size={14} /> Speelminuten
        </h2>
        {isAttentionPoint && (
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
            <AlertTriangle size={11} /> Aandachtspunt
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Totaal", value: `${totalMinutes}'` },
          { label: "Basis", value: gamesStarted },
          { label: "Invaller", value: gamesAsSubstitute },
          { label: "Gem.", value: `${avgMinutes}'` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-lg font-500 text-[#1A1A1A]">{value}</div>
            <div className="text-xs text-[#888888]">{label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-[#888888] mb-1">
          <span>Speeltijd dit seizoen</span>
          <span>{Math.round(minutesPct)}%</span>
        </div>
        <div className="h-2 bg-[#F0EEE9] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(minutesPct, 100)}%`,
              backgroundColor: isAttentionPoint ? "#F59E0B" : "#FF6B00",
            }}
          />
        </div>
      </div>

      {/* Team split */}
      {mo17Minutes > 0 && dames1Minutes > 0 && (
        <div className="flex gap-3 mb-4 text-xs text-[#888888]">
          <span className="bg-[#FFF3EB] text-[#FF6B00] px-2 py-0.5 rounded-full">MO17: {mo17Minutes}'</span>
          <span className="bg-[#F0F4FF] text-[#3B82F6] px-2 py-0.5 rounded-full">Dames 1: {dames1Minutes}'</span>
        </div>
      )}

      {/* Per-match bars */}
      {matchData.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-[#888888] uppercase tracking-wide mb-2">Per wedstrijd</p>
          {matchData.map((m) => (
            <div key={m.matchId} className="flex items-center gap-2">
              <div className="w-20 text-xs text-[#888888] truncate shrink-0">{m.opponent}</div>
              <div className="flex-1 h-5 bg-[#F0EEE9] rounded-md overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${(m.minutes / 90) * 100}%`,
                    backgroundColor: m.started ? "#FF6B00" : "#3B82F6",
                    opacity: 0.85,
                  }}
                />
              </div>
              <div className="w-8 text-right text-xs font-500 text-[#1A1A1A] shrink-0">{m.minutes}'</div>
              <div className="w-14 text-xs shrink-0">
                {m.started ? (
                  <span className="text-[#FF6B00]">Basis</span>
                ) : (
                  <span className="text-[#3B82F6]">Invaller</span>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-3 mt-2 text-xs text-[#888888]">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[#FF6B00] inline-block" /> Basisspeler</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[#3B82F6] inline-block" /> Invaller</span>
          </div>
        </div>
      )}
    </div>
  );
}