import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Star, Save } from "lucide-react";
import PlayerGreetingHeader from "../components/dashboard/PlayerGreetingHeader";
import PlayerMetricGrid from "../components/dashboard/PlayerMetricGrid";
import PlayerIOPGoals from "../components/dashboard/PlayerIOPGoals";
import AttendanceDots from "../components/dashboard/AttendanceDots";
import NextMatchGrid from "../components/dashboard/NextMatchGrid";
import PlayerTrophySection from "../components/dashboard/PlayerTrophySection";
import PhotoTimeline from "../components/photos/PhotoTimeline";
import TodayTrainingCard from "../components/trainingsplanner/TodayTrainingCard";
import UpcomingConfirmations from "../components/agenda/UpcomingConfirmations";

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
      {/* Header */}
      <PlayerGreetingHeader
        user={user}
        player={player}
        attendance={attendance}
        ratings={ratings}
        yoyo={yoyo}
      />

      {/* Aanwezigheidsbevestiging agenda */}
      <UpcomingConfirmations playerId={playerId} />

      {/* Today Training Card */}
      <TodayTrainingCard playerId={playerId} />

      {/* Next Match Grid */}
      <NextMatchGrid matches={matches} playerId={playerId} />

      {/* Attendance Dots */}
      <AttendanceDots attendance={attendance} />

      {/* Metric Grid */}
      <PlayerMetricGrid yoyo={yoyo} physical={physical} attendance={attendance} matches={matches} playerId={playerId} />

      {/* IOP Goals */}
      <PlayerIOPGoals player={player} />

      {/* Champions Trophy */}
      <PlayerTrophySection players={allPlayers} winningTeams={winningTeams} currentPlayerId={playerId} />

      {/* Foto Tijdlijn */}
      <PhotoTimeline photos={teamPhotos} />

      {/* Radar Chart */}
      {chartData.length > 0 && radarData.length > 0 && (
        <div className="glass p-4">
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(234,179,8,0.15)", border: "0.5px solid rgba(234,179,8,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs><linearGradient id="ratingGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#FF8C3A"/></linearGradient></defs>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="url(#ratingGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="t-label">Mijn Beoordelingen</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.50)" }} />
              <Tooltip contentStyle={{ background: "rgba(20,10,2,0.95)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "12px", color: "#fff" }} />
              {radarData.map((r, i) => (
                <Radar key={r.meting} name={r.meting} dataKey={r.meting} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            {radarData.map((r, i) => (
              <div key={r.meting} className="flex items-center gap-1.5" style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {r.meting}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wellness Log */}
      <div className="glass p-4">
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(234,179,8,0.15)", border: "0.5px solid rgba(234,179,8,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="wellnessGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#FF8C3A"/></linearGradient></defs>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="url(#wellnessGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="t-label">Belastbaarheid Invullen</p>
        </div>
        <div className="space-y-3">
          <Input type="date" value={wellnessForm.date} onChange={e => setWellnessForm(f => ({ ...f, date: e.target.value }))}
            style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "sleep", label: "Slaap (1-5)" },
              { key: "fatigue", label: "Vermoeidheid (1-5)" },
              { key: "muscle_pain", label: "Spierpijn (1-5)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="t-label mb-1 block">{label}</label>
                <Input type="number" min="1" max="5" value={wellnessForm[key]} onChange={e => setWellnessForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
              </div>
            ))}
          </div>
          <Textarea placeholder="Opmerkingen (optioneel)" value={wellnessForm.notes} onChange={e => setWellnessForm(f => ({ ...f, notes: e.target.value }))}
            style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} rows={2} />
          <button onClick={() => saveWellness.mutate()} disabled={saveWellness.isPending || !wellnessForm.sleep} className="btn-primary">
            <Save size={14} />
            {saveWellness.isPending ? "Opslaan..." : "Belastbaarheid Opslaan"}
          </button>
        </div>
      </div>

    </div>
  );
}