import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Trophy, ClipboardCheck, Activity } from "lucide-react";
import StatCard from "../components/common/StatCard";
import ChampionsTrophy from "../components/dashboard/ChampionsTrophy";
import WinningTeamUpload from "../components/dashboard/WinningTeamUpload";
import RecentWins from "../components/dashboard/RecentWins";

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list() });
  const { data: winningTeams = [] } = useQuery({ queryKey: ["winningTeams"], queryFn: () => base44.entities.WinningTeam.list() });

  const activePlayers = players.filter((p) => p.active !== false);
  const totalPresent = attendance.filter((a) => a.present).length;
  const avgAttendance = activePlayers.length > 0 && sessions.length > 0
    ? ((totalPresent / (activePlayers.length * sessions.length)) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-black text-white">The Winning Team</h1>
        <p className="text-sm text-white/70">MVA Noord MO17 — Dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Selectie" value={activePlayers.length} icon={Users} />
        <StatCard title="Trainingen" value={sessions.length} icon={ClipboardCheck} />
        <StatCard title="Aanwezigheid" value={`${avgAttendance}%`} icon={Activity} />
        <StatCard title="Winnaars" value={winningTeams.length} subtitle="geregistreerd" icon={Trophy} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChampionsTrophy players={activePlayers} attendanceData={attendance} winningTeams={winningTeams} />
        </div>
        <div className="space-y-6">
          <WinningTeamUpload players={activePlayers} onSaved={() => queryClient.invalidateQueries({ queryKey: ["winningTeams"] })} />
          <RecentWins winningTeams={winningTeams} players={players} />
        </div>
      </div>
    </div>
  );
}