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
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a4a2e, #0d2b1a)", border: "0.5px solid rgba(255,107,0,0.30)", borderRadius: "22px", height: "150px" }}>
        {/* Field lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.10 }} viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
          <rect x="1" y="1" width="398" height="148" fill="none" stroke="white" strokeWidth="2"/>
          <line x1="200" y1="1" x2="200" y2="149" stroke="white" strokeWidth="1.5"/>
          <circle cx="200" cy="75" r="28" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="1" y="40" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
          <rect x="357" y="40" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
        </svg>
        {/* Orange glow top-right */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.45) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,107,0,0.10)" }} />

        <div className="relative z-10 p-4 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.07em" }}>VOLGENDE WEDSTRIJD</p>
            <span style={{ background: "rgba(255,255,255,0.10)", border: "0.5px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)", borderRadius: "20px", padding: "4px 12px", fontSize: "11px" }}>
              {dayLabel}
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px", lineHeight: 1.2 }}>vs. {nextMatch.opponent}</h3>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "3px" }}>
              {format(matchDate, "EEEE d MMMM", { locale: nl })} · {nextMatch.home_away || "Thuis"}
            </p>
          </div>
          {alreadyCheckedIn ? (
            <div className="flex items-center justify-center gap-2" style={{ background: "rgba(74,222,128,0.15)", border: "0.5px solid rgba(74,222,128,0.25)", borderRadius: "12px", height: "42px", color: "#4ade80", fontSize: "13px", fontWeight: 600 }}>
              ✓ Check-in ingevuld
            </div>
          ) : (
            <button onClick={() => setShowCheckIn(true)} style={{ width: "100%", background: "rgba(255,107,0,0.30)", border: "0.5px solid rgba(255,107,0,0.50)", color: "#ffffff", borderRadius: "12px", height: "42px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
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