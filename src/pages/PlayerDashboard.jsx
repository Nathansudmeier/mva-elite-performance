import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Star, Save } from "lucide-react";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import PlayerGreetingHeader from "../components/dashboard/PlayerGreetingHeader";
import PlayerMetricGrid from "../components/dashboard/PlayerMetricGrid";
import PlayerIOPGoals from "../components/dashboard/PlayerIOPGoals";
import AttendanceDots from "../components/dashboard/AttendanceDots";
import NextMatchGrid from "../components/dashboard/NextMatchGrid";
import PlayerTrophySection from "../components/dashboard/PlayerTrophySection";
import PhotoTimeline from "../components/photos/PhotoTimeline";
import TodayTrainingCard from "../components/trainingsplanner/TodayTrainingCard";
import UpcomingActivitiesCompact from "../components/agenda/UpcomingActivitiesCompact";
import PlayerSeasonStats from "../components/stats/PlayerSeasonStats";
import LiveMatchBanner from "@/components/dashboard/LiveMatchBanner";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import PlayerAttendanceCard from "@/components/dashboard/PlayerAttendanceCard";
import { subDays, isAfter } from "date-fns";

const TECHNICAL = ["pass_kort", "pass_lang", "koppen", "scorend_vermogen", "duel_aanvallend", "duel_verdedigend", "balaanname"];
const TACTICAL = ["speelveld_groot", "omschakeling_balverlies", "speelveld_klein", "omschakeling_balbezit", "kijkgedrag"];
const PERSONALITY = ["winnaarsmentaliteit", "leergierig", "opkomst_trainingen", "komt_afspraken_na", "doorzetter"];
const PHYSICAL_R = ["startsnelheid", "snelheid_lang", "postuur", "blessuregevoeligheid", "duelkracht", "motorische_vaardigheden"];

const avg = (obj, keys) => {
  const vals = keys.map(k => obj[k]).filter(v => v != null && v > 0);
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
};

export default function PlayerDashboard() {
  const { user, playerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: liveMatches = [] } = useLiveMatches();

  const [wellnessForm, setWellnessForm] = useState({
    date: new Date().toISOString().split("T")[0],
    sleep: "", fatigue: "", muscle_pain: "", notes: ""
  });

  const { data: player } = useQuery({
    queryKey: ["myPlayer", playerId],
    queryFn: () => base44.entities.Player.filter({ id: playerId }),
    enabled: !!playerId,
    select: d => d[0],
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["myRatings", playerId],
    queryFn: () => base44.entities.PlayerRating.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["myAttendance", playerId],
    queryFn: () => base44.entities.Attendance.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: agendaAttendance = [] } = useQuery({
    queryKey: ["agenda-attendance-player", playerId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: yoyo = [] } = useQuery({
    queryKey: ["myYoyo", playerId],
    queryFn: () => base44.entities.YoYoTest.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: physical = [] } = useQuery({
    queryKey: ["myPhysical", playerId],
    queryFn: () => base44.entities.PhysicalTest.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["allMatches"],
    queryFn: () => base44.entities.Match.list(),
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["allPlayers"],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: winningTeams = [] } = useQuery({
    queryKey: ["winningTeams"],
    queryFn: () => base44.entities.WinningTeam.list(),
  });

  const { data: teamPhotos = [] } = useQuery({
    queryKey: ["teamPhotos"],
    queryFn: () => base44.entities.TeamPhoto.list("-date"),
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["agendaItems-all"],
    queryFn: () => base44.entities.AgendaItem.list(),
  });

  // Calculate attendance based on AgendaItem trainings
  const seasonStart = subDays(new Date(), 180); // Approximate season start (6 months)
  const allSeasonTrainings = agendaItems.filter(ai => 
    ai.type === "Training" && isAfter(new Date(ai.date), seasonStart)
  );
  const playerSeasonAttendance = agendaAttendance.filter(aa =>
    aa.player_id === playerId && aa.status === "aanwezig" && 
    allSeasonTrainings.find(ai => ai.id === aa.agenda_item_id)
  );
  const attendancePercentage = allSeasonTrainings.length > 0
    ? (playerSeasonAttendance.length / allSeasonTrainings.length) * 100
    : 0;
  const totalSeasonTrainings = allSeasonTrainings.length;

  const saveWellness = useMutation({
    mutationFn: () => base44.entities.WellnessLog.create({ ...wellnessForm, player_id: playerId, sleep: Number(wellnessForm.sleep), fatigue: Number(wellnessForm.fatigue), muscle_pain: Number(wellnessForm.muscle_pain) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["myWellness"]);
      setWellnessForm({ date: new Date().toISOString().split("T")[0], sleep: "", fatigue: "", muscle_pain: "", notes: "" });
    }
  });

  const radarData = ["Meting 1", "Meting 2", "Meting 3"].map(m => {
    const r = ratings.find(x => x.meting === m);
    if (!r) return null;
    return {
      meting: m,
      Technisch: avg(r, TECHNICAL),
      Tactisch: avg(r, TACTICAL),
      Persoonlijkheid: avg(r, PERSONALITY),
      Fysiek: avg(r, PHYSICAL_R),
    };
  }).filter(Boolean);

  const chartData = [
    { subject: "Technisch", ...Object.fromEntries(radarData.map(r => [r.meting, r.Technisch])) },
    { subject: "Tactisch", ...Object.fromEntries(radarData.map(r => [r.meting, r.Tactisch])) },
    { subject: "Persoonlijk", ...Object.fromEntries(radarData.map(r => [r.meting, r.Persoonlijkheid])) },
    { subject: "Fysiek", ...Object.fromEntries(radarData.map(r => [r.meting, r.Fysiek])) },
  ];

  const COLORS = ["#FF6B00", "#1A1A1A", "#E55A00"];

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <Star size={40} className="text-[#E8E6E1]" />
        <p className="text-[#1A1A1A] font-500">Jouw account is nog niet gekoppeld aan een spelersprofiel.</p>
        <p className="text-[#888888] text-sm">Vraag de trainer om dit in te stellen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <LiveMatchBanner liveMatches={liveMatches} isTrainer={false} />
      {/* Header */}
      <PlayerGreetingHeader
        user={user}
        player={player}
        attendance={attendance}
        ratings={ratings}
        yoyo={yoyo}
      />

      {/* Upcoming Activities Compact */}
      <UpcomingActivitiesCompact playerId={playerId} />

      {/* Seizoensstatistieken */}
      <PlayerSeasonStats playerId={playerId} variant="grid" />

      {/* Today Training Card */}
      <TodayTrainingCard playerId={playerId} />

      {/* Next Matches */}
      <NextMatchGrid matches={matches} />

      {/* Metric Grid */}
      <PlayerMetricGrid yoyo={yoyo} physical={physical} attendance={attendance} agendaAttendance={agendaAttendance} matches={matches} playerId={playerId} />

      {/* Attendance Card */}
      <PlayerAttendanceCard 
        percentage={attendancePercentage} 
        present={playerSeasonAttendance.length} 
        total={totalSeasonTrainings} 
      />

      {/* Attendance Dots */}
      <AttendanceDots attendance={attendance} />

      {/* IOP Goals */}
      <PlayerIOPGoals player={player} />

      {/* Champions Trophy */}
      <PlayerTrophySection players={allPlayers} winningTeams={winningTeams} currentPlayerId={playerId} />

      {/* Foto Tijdlijn */}
      <PhotoTimeline photos={teamPhotos} />

      {/* Radar Chart */}
      {chartData.length > 0 && radarData.length > 0 && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "12px" }}>Mijn Beoordelingen</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="rgba(26,26,26,0.10)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "rgba(26,26,26,0.55)", fontWeight: 700 }} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", color: "#1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }} />
              {radarData.map((r, i) => (
                <Radar key={r.meting} name={r.meting} dataKey={r.meting} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            {radarData.map((r, i) => (
              <div key={r.meting} className="flex items-center gap-1.5" style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", fontWeight: 700 }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {r.meting}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wellness Log */}
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
        <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "14px" }}>Belastbaarheid Invullen</p>
        <div className="space-y-3">
          <Input type="date" value={wellnessForm.date} onChange={e => setWellnessForm(f => ({ ...f, date: e.target.value }))}
            style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "12px", padding: "10px 14px", fontSize: "14px" }} />
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "sleep", label: "Slaap (1-5)" },
              { key: "fatigue", label: "Vermoeidheid" },
              { key: "muscle_pain", label: "Spierpijn" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>{label}</label>
                <Input type="number" min="1" max="5" value={wellnessForm[key]} onChange={e => setWellnessForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "12px" }} />
              </div>
            ))}
          </div>
          <Textarea placeholder="Opmerkingen (optioneel)" value={wellnessForm.notes} onChange={e => setWellnessForm(f => ({ ...f, notes: e.target.value }))}
            style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "12px" }} rows={2} />
          <button onClick={() => saveWellness.mutate()} disabled={saveWellness.isPending || !wellnessForm.sleep} className="btn-primary">
            <Save size={14} />
            {saveWellness.isPending ? "Opslaan..." : "Belastbaarheid Opslaan"}
          </button>
        </div>
      </div>

    </div>
  );
}