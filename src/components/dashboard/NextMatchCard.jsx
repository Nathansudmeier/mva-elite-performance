import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import { MapPin, Clock } from "lucide-react";
import CheckInFlow from "@/components/checkin/CheckInFlow";

export default function NextMatchCard({ matches, playerId }) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);

  const { data: checkIns = [] } = useQuery({
    queryKey: ["myCheckIns", playerId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ player_id: playerId, type: "pre" }),
    enabled: !!playerId,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7days = new Date(today);
  in7days.setDate(in7days.getDate() + 7);

  const nextMatch = [...matches]
    .filter(m => {
      const d = parseISO(m.date);
      return d >= today && d <= in7days;
    })
    .sort((a, b) => a.date > b.date ? 1 : -1)[0];

  if (!nextMatch) return null;

  const matchDate = parseISO(nextMatch.date);
  const daysUntil = differenceInDays(matchDate, today);
  const alreadyCheckedIn = checkIns.some(c => c.match_id === nextMatch.id) || checkInDone;

  const dayLabel = daysUntil === 0 ? "Vandaag" : daysUntil === 1 ? "Morgen" : `Over ${daysUntil} dagen`;

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-sm bg-white">
        <div className="bg-[#FF6B00] px-4 py-2 flex items-center justify-between">
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Volgende Wedstrijd</span>
          <span className="text-white text-xs opacity-80">{dayLabel}</span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">vs. {nextMatch.opponent}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#888888]">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {format(matchDate, "EEEE d MMMM", { locale: nl })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {nextMatch.home_away || "Thuis"}
                </span>
              </div>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#FFF3EB] text-[#FF6B00] whitespace-nowrap">
              {nextMatch.team}
            </span>
          </div>
          {alreadyCheckedIn ? (
            <div className="w-full py-2.5 rounded-xl bg-[#F0F7EB] text-[#3B6D11] text-sm font-medium text-center">
              ✓ Check-in ingevuld
            </div>
          ) : (
            <button
              onClick={() => setShowCheckIn(true)}
              className="w-full py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              Check-in →
            </button>
          )}
        </div>
      </div>

      {showCheckIn && (
        <CheckInFlow
          matchId={nextMatch.id}
          type="pre"
          onClose={() => setShowCheckIn(false)}
          onCompleted={() => { setShowCheckIn(false); setCheckInDone(true); }}
        />
      )}
    </>
  );
}