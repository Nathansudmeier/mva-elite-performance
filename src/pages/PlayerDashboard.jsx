import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Star, Heart, Save } from "lucide-react";
import PlayerGreetingHeader from "../components/dashboard/PlayerGreetingHeader";
import PlayerMetricGrid from "../components/dashboard/PlayerMetricGrid";
import PlayerIOPGoals from "../components/dashboard/PlayerIOPGoals";
import AttendanceDots from "../components/dashboard/AttendanceDots";
import NextMatchCard from "../components/dashboard/NextMatchCard";
import PlayerTrophySection from "../components/dashboard/PlayerTrophySection";
import PhotoTimeline from "../components/photos/PhotoTimeline";

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
  const [reflectionForm, setReflectionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    match_opponent: "",
    goal_1_rating: "", goal_1_notes: "",
    goal_2_rating: "", goal_2_notes: "",
    goal_3_rating: "", goal_3_notes: "",
    general_notes: ""
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

  const saveReflection = useMutation({
    mutationFn: () => base44.entities.SelfReflection.create({ ...reflectionForm, player_id: playerId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["myReflections"]);
      setReflectionForm({ date: new Date().toISOString().split("T")[0], match_opponent: "", goal_1_rating: "", goal_1_notes: "", goal_2_rating: "", goal_2_notes: "", goal_3_rating: "", goal_3_notes: "", general_notes: "" });
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

      {/* Next Match Card */}
      <NextMatchCard matches={matches} playerId={playerId} />

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
          <p className="t-label mb-3">Mijn Beoordelingen</p>
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
        <p className="t-label mb-3">Belastbaarheid Invullen</p>
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

      {/* Self Reflection */}
      <div className="glass p-4">
        <p className="t-label mb-3">Zelfreflectie Wedstrijd</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={reflectionForm.date} onChange={e => setReflectionForm(f => ({ ...f, date: e.target.value }))}
              style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <Input placeholder="Tegenstander" value={reflectionForm.match_opponent} onChange={e => setReflectionForm(f => ({ ...f, match_opponent: e.target.value }))}
              style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
          </div>
          {player && [player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).map((goal, i) => (
            <div key={i} className="relative" style={{ background: "rgba(255,107,0,0.10)", border: "0.5px solid rgba(255,107,0,0.25)", borderRadius: "14px", padding: "12px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#FF8C3A", marginBottom: "8px" }}>Doel {i + 1}: {goal}</p>
              <div className="flex items-center gap-2 mb-2">
                <label className="t-label whitespace-nowrap">Cijfer (1-10):</label>
                <Input type="number" min="1" max="10" value={reflectionForm[`goal_${i + 1}_rating`]} onChange={e => setReflectionForm(f => ({ ...f, [`goal_${i + 1}_rating`]: e.target.value }))}
                  style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px", width: "80px" }} />
              </div>
              <Textarea placeholder="Toelichting..." value={reflectionForm[`goal_${i + 1}_notes`]} onChange={e => setReflectionForm(f => ({ ...f, [`goal_${i + 1}_notes`]: e.target.value }))}
                style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} rows={2} />
            </div>
          ))}
          <Textarea placeholder="Algemene reflectie..." value={reflectionForm.general_notes} onChange={e => setReflectionForm(f => ({ ...f, general_notes: e.target.value }))}
            style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} rows={3} />
          <button onClick={() => saveReflection.mutate()} disabled={saveReflection.isPending} className="btn-primary">
            <Save size={14} />
            {saveReflection.isPending ? "Opslaan..." : "Reflectie Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}