import React from "react";
import { Activity, Calendar, Timer, TrendingUp } from "lucide-react";

const CARD_COLORS = ["#00C2FF", "#FFD600", "#08D068", "#FF6800"];

function Delta({ value, unit = "", lowerIsBetter = false }) {
  if (value === null || value === undefined) return null;
  const positive = lowerIsBetter ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: positive ? "#05a050" : value === 0 ? "rgba(26,26,26,0.40)" : "#FF3DA8" }}>
      {sign}{value}{unit} t.o.v. M1
    </span>
  );
}

function MetricCard({ icon: IconComp, label, value, unit, delta, deltaUnit, lowerIsBetter, isSprint, confirmationPct, cardColor }) {
  return (
    <div style={{ background: cardColor, border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
      <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", letterSpacing: "0.10em" }}>{label}</p>
      {value !== null && value !== undefined ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, letterSpacing: "-2px" }}>{value}</span>
            {unit && <span style={{ fontSize: isSprint ? "15px" : "13px", color: "rgba(26,26,26,0.55)", fontWeight: 700 }}>{unit}</span>}
          </div>
          <Delta value={delta} unit={deltaUnit} lowerIsBetter={lowerIsBetter} />
          {confirmationPct !== null && confirmationPct !== undefined && (
            <span style={{ fontSize: 10, color: "rgba(26,26,26,0.50)", fontWeight: 600 }}>{confirmationPct}% bevestigd vooraf</span>
          )}
        </>
      ) : (
        <span style={{ fontSize: 12, color: "rgba(26,26,26,0.35)", fontWeight: 600 }}>Geen data</span>
      )}
    </div>
  );
}

export default function PlayerMetricGrid({ yoyo, physical, attendance, agendaAttendance = [], matches, playerId }) {
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

  // Aanwezigheidspercentage: puur op basis van handmatig geregistreerde aanwezigheid (Attendance)
  const trainingPresent = attendance.filter(a => a.present).length;
  const totalSessions = attendance.length;
  const attendancePct = totalSessions > 0 ? Math.round((trainingPresent / totalSessions) * 100) : null;

  // Bevestigingspercentage: aparte statistiek op basis van AgendaAttendance (vooraf bevestigd)
  const agendaConfirmed = agendaAttendance.filter(a => a.status === "aanwezig").length;
  const agendaTotal = agendaAttendance.filter(a => a.status !== "onbekend").length;
  const confirmationPct = agendaTotal > 0 ? Math.round((agendaConfirmed / agendaTotal) * 100) : null;

  // Speelminuten (total from finished matches with actual live_events data)
  let totalMinutes = null;
  if (matches && playerId) {
    const finished = matches.filter(m => m.live_status === "finished");
    let total = 0;
    let participated = false;
    finished.forEach(match => {
      const lineup = match.lineup || [];
      const events = match.live_events || [];
      // Only count matches that actually have live event data recorded
      if (events.length === 0 && lineup.length === 0) return;
      const startedInBasis = lineup.some(l => l.slot === "basis" && l.player_id === playerId);
      const subIn = events.find(e => e.type === "substitution" && e.player_in_id === playerId);
      const subOut = events.find(e => e.type === "substitution" && e.player_out_id === playerId);
      if (startedInBasis || subIn) {
        participated = true;
        const matchDuration = match.team === "MO17" ? 80 : 90;
        if (startedInBasis) {
          total += subOut ? subOut.minute : matchDuration;
        } else if (subIn) {
          const start = subIn.minute;
          total += Math.max(0, (subOut ? subOut.minute : matchDuration) - start);
        }
      }
    });
    totalMinutes = participated ? total : null;
  }

  const metrics = [
    { icon: TrendingUp, label: "Yo-Yo niveau", value: yoyoVal, unit: "", delta: yoyoDelta, deltaUnit: "", lowerIsBetter: false },
    { icon: Activity, label: "30m sprint", value: sprintVal, unit: "s", delta: sprintDelta, deltaUnit: "s", lowerIsBetter: true, isSprint: true },
    { icon: Calendar, label: "Aanwezigheid", value: attendancePct, unit: "%", delta: null, confirmationPct },
    { icon: Timer, label: "Speelminuten", value: totalMinutes, unit: "min", delta: null },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {metrics.map((m, i) => <MetricCard key={i} {...m} cardColor={CARD_COLORS[i]} />)}
    </div>
  );
}