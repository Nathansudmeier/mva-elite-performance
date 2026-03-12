import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { User, Target, Trophy, ClipboardCheck, Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import StatCard from "../components/common/StatCard";

export default function PlayerDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get("id");

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });
  const { data: winningTeams = [] } = useQuery({ queryKey: ["winningTeams"], queryFn: () => base44.entities.WinningTeam.list() });
  const { data: yoyoTests = [] } = useQuery({ queryKey: ["yoyoTests"], queryFn: () => base44.entities.YoYoTest.list() });
  const { data: physicalTests = [] } = useQuery({ queryKey: ["physicalTests"], queryFn: () => base44.entities.PhysicalTest.list() });
  const { data: wellness = [] } = useQuery({ queryKey: ["wellness"], queryFn: () => base44.entities.WellnessLog.list() });
  const { data: reflections = [] } = useQuery({ queryKey: ["reflections"], queryFn: () => base44.entities.SelfReflection.list() });

  const player = players.find((p) => p.id === playerId);
  if (!player) return <div className="text-center py-20 text-white/60">Speelster niet gevonden</div>;

  const playerAttendance = attendance.filter((a) => a.player_id === playerId);
  const totalPresent = playerAttendance.filter((a) => a.present).length;
  const totalSessions = playerAttendance.length;
  const attendancePct = totalSessions > 0 ? ((totalPresent / totalSessions) * 100).toFixed(0) : 0;

  const timesWon = winningTeams.filter((wt) => wt.winning_player_ids?.includes(playerId)).length;
  const winRatio = totalPresent > 0 ? ((timesWon / totalPresent) * 100).toFixed(0) : 0;

  const playerYoyo = yoyoTests.filter((t) => t.player_id === playerId).sort((a, b) => new Date(a.date) - new Date(b.date));
  const yoyoChartData = playerYoyo.map((t) => ({ date: format(new Date(t.date), "d MMM", { locale: nl }), level: parseFloat(t.level) || 0, distance: t.distance || 0 }));

  const playerPhysical = physicalTests.filter((t) => t.player_id === playerId).sort((a, b) => new Date(a.date) - new Date(b.date));
  const playerWellness = wellness.filter((w) => w.player_id === playerId).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
  const playerReflections = reflections.filter((r) => r.player_id === playerId).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const chartTooltipStyle = { backgroundColor: '#FFF5F0', border: '1px solid #FDE8DC', borderRadius: 8, color: '#1A1F2E' };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="elite-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold shrink-0" style={{ backgroundColor: '#FDE8DC' }}>
            {player.photo_url ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" /> : <User size={32} style={{ color: '#2F3650' }} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {player.shirt_number && <span className="font-black text-xl" style={{ color: '#D45A30' }}>#{player.shirt_number}</span>}
              <h1 className="text-xl font-black text-[#1A1F2E]">{player.name}</h1>
            </div>
            <p className="text-sm" style={{ color: '#2F3650' }}>{player.position || "Geen positie"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Aanwezigheid" value={`${attendancePct}%`} subtitle={`${totalPresent}/${totalSessions}`} icon={ClipboardCheck} />
        <StatCard title="Win Ratio" value={`${winRatio}%`} subtitle={`${timesWon} overwinningen`} icon={Trophy} />
        <StatCard title="Yo-Yo Niveau" value={playerYoyo.length > 0 ? playerYoyo[playerYoyo.length - 1].level : "-"} icon={Activity} />
        <StatCard title="Sprint 30m" value={playerPhysical.length > 0 && playerPhysical[playerPhysical.length - 1].sprint_30m ? `${playerPhysical[playerPhysical.length - 1].sprint_30m}s` : "-"} icon={TrendingUp} />
      </div>

      {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
        <div className="elite-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} style={{ color: '#D45A30' }} />
            <h2 className="font-bold text-[#1A1F2E]">Individuele Ontwikkeldoelen (IOP)</h2>
          </div>
          <div className="space-y-2">
            {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).map((goal, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#FDE8DC' }}>
                <span className="font-black text-sm" style={{ color: '#D45A30' }}>{i + 1}</span>
                <span className="text-sm text-[#1A1F2E]">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {yoyoChartData.length > 0 && (
        <div className="elite-card p-6">
          <h2 className="font-bold mb-4 text-[#1A1F2E]">Yo-Yo Progressie</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yoyoChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FDE8DC" />
                <XAxis dataKey="date" tick={{ fill: '#2F3650', fontSize: 11 }} />
                <YAxis tick={{ fill: '#2F3650', fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="level" stroke="#D45A30" strokeWidth={2} dot={{ fill: '#D45A30', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {playerWellness.length > 0 && (
        <div className="elite-card p-6">
          <h2 className="font-bold mb-4 text-[#1A1F2E]">Recente Belastbaarheid</h2>
          <div className="space-y-2">
            {playerWellness.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#FDE8DC' }}>
                <span className="text-xs" style={{ color: '#2F3650' }}>{format(new Date(w.date), "d MMM", { locale: nl })}</span>
                <div className="flex gap-4">
                  <span className="text-xs text-[#1A1F2E]">😴 {w.sleep}/5</span>
                  <span className="text-xs text-[#1A1F2E]">💪 {w.fatigue}/5</span>
                  <span className="text-xs text-[#1A1F2E]">🤕 {w.muscle_pain}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {playerReflections.length > 0 && (
        <div className="elite-card p-6">
          <h2 className="font-bold mb-4 text-[#1A1F2E]">Zelfreflecties</h2>
          <div className="space-y-3">
            {playerReflections.map((r) => (
              <div key={r.id} className="rounded-lg p-4" style={{ backgroundColor: '#FDE8DC' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#1A1F2E]">{r.match_opponent || "Wedstrijd"}</span>
                  <span className="text-xs" style={{ color: '#2F3650' }}>{format(new Date(r.date), "d MMM yyyy", { locale: nl })}</span>
                </div>
                <div className="flex gap-4 text-xs">
                  {r.goal_1_rating && <span style={{ color: '#D45A30' }}>Doel 1: {r.goal_1_rating}/10</span>}
                  {r.goal_2_rating && <span style={{ color: '#1A1F2E' }}>Doel 2: {r.goal_2_rating}/10</span>}
                  {r.goal_3_rating && <span style={{ color: '#4CAF82' }}>Doel 3: {r.goal_3_rating}/10</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}