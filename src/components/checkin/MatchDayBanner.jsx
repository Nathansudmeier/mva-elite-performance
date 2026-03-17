import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { AlertCircle, X } from "lucide-react";
import CheckInFlow from "./CheckInFlow";

export default function MatchDayBanner() {
  const { playerId } = useCurrentUser();
  const [showCheckIn, setShowCheckIn] = useState(false);

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["myCheckIns", playerId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  if (!playerId) return null;

  const today = new Date().toISOString().split("T")[0];
  const todayMatch = matches.find(m => m.date === today);

  if (!todayMatch) return null;

  // Check if pre-check-in exists
  const preCheckIn = checkIns.find(c => c.match_id === todayMatch.id && c.type === "pre");

  if (preCheckIn) {
    // Already checked in, don't show banner
    return null;
  }

  return (
    <>
      <div className="bg-[#FFF3EB] border-l-4 border-[#FF6B00] rounded-xl p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} color="#FF6B00" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-500 text-[#FF6B00] text-sm">Matchdag vandaag!</p>
            <p className="text-sm text-[#888888] mt-1">
              Wedstrijd tegen {todayMatch.opponent} ({todayMatch.home_away === "Thuis" ? "thuis" : "uit"})
            </p>
            <button
              onClick={() => setShowCheckIn(true)}
              className="text-sm font-500 text-[#FF6B00] hover:text-[#E55A00] mt-2 underline"
            >
              Vul pre-game check-in in →
            </button>
          </div>
        </div>
        <button onClick={() => setShowCheckIn(false)} className="text-[#888888] hover:text-[#FF6B00]">
          <X size={18} />
        </button>
      </div>

      {showCheckIn && (
        <CheckInFlow
          matchId={todayMatch.id}
          type="pre"
          onClose={() => setShowCheckIn(false)}
          onCompleted={() => setShowCheckIn(false)}
        />
      )}
    </>
  );
}