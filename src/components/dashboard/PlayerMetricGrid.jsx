import React from "react";
import { Activity, Calendar, Timer, TrendingUp } from "lucide-react";

function Delta({ value, unit = "", lowerIsBetter = false }) {
  if (value === null || value === undefined) return null;
  const positive = lowerIsBetter ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span style={{ fontSize: 11 }} className={positive ? "text-[#3B6D11]" : value === 0 ? "text-[#888888]" : "text-[#C0392B]"}>
      {sign}{value}{unit} t.o.v. M1
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, unit, delta, deltaUnit, lowerIsBetter }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} className="text-[#FF6B00]" />
        <span style={{ fontSize: 11 }} className="text-[#888888] uppercase tracking-wide font-medium">{label}</span>
      </div>
      {value !== null && value !== undefined ? (
        <>
          <div className="text-2xl font-bold text-[#1A1A1A]">
            {value}<span className="text-base font-normal text-[#888888]">{unit}</span>
          </div>
          <Delta value={delta} unit={deltaUnit} lowerIsBetter={lowerIsBetter} />
        </>
      ) : (
        <span style={{ fontSize: 12 }} className="text-[#BBBBBB]">Geen data</span>
      )}
    </div>
  );
}

export default function PlayerMetricGrid({ yoyo, physical, attendance, matches, playerId }) {
  // Yo-Yo
  const sortedYoyo = [...yoyo].sort((a, b) => a.date > b.date ? 1 : -1);
  const firstYoyo = sortedYoyo[0];
  const lastYoyo = sortedYoyo[sortedYoyo.length - 1];
  const yoyoVal = lastYoyo?.level ?? null;
  const yoyoDelta = (firstYoyo && lastYoyo && firstYoyo.id !== lastYoyo.id)
    ? +(parseFloat(lastYoyo.level) - parseFloat(firstYoyo.level)).toFixed(1)
    : null;

  // Sprint
  const sortedSprint = [...physical].filter(p => p.sprint_30m != null).sort((a, b) => a.date > b.date ? 1 : -1);
  const firstSprint = sortedSprint[0];
  const lastSprint = sortedSprint[sortedSprint.length - 1];
  const sprintVal = lastSprint?.sprint_30m ?? null;
  const sprintDelta = (firstSprint && lastSprint && firstSprint.id !== lastSprint.id)
    ? +(lastSprint.sprint_30m - firstSprint.sprint_30m).toFixed(2)
    : null;

  // Attendance
  const presentCount = attendance.filter(a => a.present).length;
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null;

  // Speelminuten (total from finished matches)
  let totalMinutes = null;
  let firstMatchMinutes = null;
  if (matches && playerId) {
    const finished = matches.filter(m => m.live_status === "finished");
    let total = 0;
    finished.forEach(match => {
      const lineup = match.lineup || [];
      const events = match.live_events || [];
      const started = lineup.some(l => l.player_id === playerId);
      const subIn = events.find(e => e.type === "substitution" && e.player_in_id === playerId);
      const subOut = events.find(e => e.type === "substitution" && e.player_out_id === playerId);
      if (started) {
        total += subOut ? Math.floor(subOut.minute / 60) : 90;
      } else if (subIn) {
        const start = Math.floor(subIn.minute / 60);
        total += Math.max(0, (subOut ? Math.floor(subOut.minute / 60) : 90) - start);
      }
    });
    totalMinutes = finished.length > 0 ? total : null;
  }

  const metrics = [
    { icon: TrendingUp, label: "Yo-Yo niveau", value: yoyoVal, unit: "", delta: yoyoDelta, deltaUnit: "", lowerIsBetter: false },
    { icon: Activity, label: "30m sprint", value: sprintVal, unit: "s", delta: sprintDelta, deltaUnit: "s", lowerIsBetter: true },
    { icon: Calendar, label: "Aanwezigheid", value: attendancePct, unit: "%", delta: null },
    { icon: Timer, label: "Speelminuten", value: totalMinutes, unit: "min", delta: null },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
    </div>
  );
}