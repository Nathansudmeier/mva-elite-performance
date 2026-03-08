import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { BarChart3, TrendingUp, Users } from "lucide-react";

export default function Reports() {
  const [selectedPlayer, setSelectedPlayer] = useState("all");

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list() });
  const { data: winningTeams = [] } = useQuery({ queryKey: ["winningTeams"], queryFn: () => base44.entities.WinningTeam.list() });
  const { data: yoyoTests = [] } = useQuery({ queryKey: ["yoyoTests"], queryFn: () => base44.entities.YoYoTest.list() });
  const { data: reflections = [] } = useQuery({ queryKey: ["reflections"], queryFn: () => base44.entities.SelfReflection.list() });

  const activePlayers = players.filter((p) => p.active !== false);

  // Attendance overview data
  const attendanceData = activePlayers.map((p) => {
    const records = attendance.filter((a) => a.player_id === p.id);
    const present = records.filter((a) => a.present).length;
    const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    return { name: p.name?.split(" ")[0] || "", pct, present, total: records.length };
  }).sort((a, b) => b.pct - a.pct);

  // Yo-Yo comparison
  const yoyoData = activePlayers.map((p) => {
    const tests = yoyoTests.filter((t) => t.player_id === p.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    return { name: p.name?.split(" ")[0] || "", level: tests[0] ? parseFloat(tests[0].level) || 0 : 0 };
  }).sort((a, b) => b.level - a.level);

  // Win ratio data
  const winData = activePlayers.map((p) => {
    const timesPresent = attendance.filter((a) => a.player_id === p.id && a.present).length;
    const timesWon = winningTeams.filter((wt) => wt.winning_player_ids?.includes(p.id)).length;
    const ratio = timesPresent > 0 ? Math.round((timesWon / timesPresent) * 100) : 0;
    return { name: p.name?.split(" ")[0] || "", ratio, won: timesWon };
  }).sort((a, b) => b.ratio - a.ratio);

  // Player-specific data
  const playerYoyoProgression = selectedPlayer !== "all"
    ? yoyoTests
        .filter((t) => t.player_id === selectedPlayer)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((t) => ({ date: format(new Date(t.date), "d MMM", { locale: nl }), level: parseFloat(t.level) || 0 }))
    : [];

  const playerReflections = selectedPlayer !== "all"
    ? reflections.filter((r) => r.player_id === selectedPlayer)
    : [];

  const avgGoalRatings = playerReflections.length > 0 ? {
    goal1: playerReflections.reduce((sum, r) => sum + (r.goal_1_rating || 0), 0) / playerReflections.filter((r) => r.goal_1_rating).length || 0,
    goal2: playerReflections.reduce((sum, r) => sum + (r.goal_2_rating || 0), 0) / playerReflections.filter((r) => r.goal_2_rating).length || 0,
    goal3: playerReflections.reduce((sum, r) => sum + (r.goal_3_rating || 0), 0) / playerReflections.filter((r) => r.goal_3_rating).length || 0,
  } : null;

  const player = players.find((p) => p.id === selectedPlayer);
  const radarData = avgGoalRatings ? [
    { subject: player?.iop_goal_1 || "Doel 1", A: avgGoalRatings.goal1.toFixed(1), fullMark: 10 },
    { subject: player?.iop_goal_2 || "Doel 2", A: avgGoalRatings.goal2.toFixed(1), fullMark: 10 },
    { subject: player?.iop_goal_3 || "Doel 3", A: avgGoalRatings.goal3.toFixed(1), fullMark: 10 },
  ] : [];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">Rapporten</h1>
          <p className="text-sm text-[#a0a0a0]">Voortgangsgesprekken & data-overzicht</p>
        </div>
        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
          <SelectTrigger className="w-48 bg-[#141414] border-[#333]">
            <SelectValue placeholder="Selecteer speelster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Team Overzicht</SelectItem>
            {activePlayers.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlayer === "all" ? (
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="elite-card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-[#22c55e]" /> Aanwezigheidspercentage
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#141414", border: "1px solid #333", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="pct" fill="#22c55e" radius={[4, 4, 0, 0]} name="Aanwezigheid %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yo-Yo Comparison */}
          <div className="elite-card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#FF6B00]" /> Yo-Yo Niveau Vergelijking
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yoyoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#141414", border: "1px solid #333", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="level" fill="#FF6B00" radius={[4, 4, 0, 0]} name="Yo-Yo Niveau" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win Ratio */}
          <div className="elite-card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#1a3a8f]" /> Champions Trophy — Win Ratio
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#141414", border: "1px solid #333", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="ratio" fill="#1a3a8f" radius={[4, 4, 0, 0]} name="Win Ratio %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Player Header */}
          <div className="elite-card p-6">
            <h2 className="text-xl font-black">{player?.name}</h2>
            <p className="text-sm text-[#a0a0a0]">{player?.position} {player?.shirt_number ? `#${player.shirt_number}` : ""}</p>
          </div>

          {/* Yo-Yo Progression */}
          {playerYoyoProgression.length > 0 && (
            <div className="elite-card p-6">
              <h2 className="font-bold mb-4">Yo-Yo Progressie</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={playerYoyoProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#141414", border: "1px solid #333", borderRadius: 8, color: "#fff" }} />
                    <Line type="monotone" dataKey="level" stroke="#FF6B00" strokeWidth={2} dot={{ fill: "#FF6B00", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Radar - IOP Goals */}
          {radarData.length > 0 && (
            <div className="elite-card p-6">
              <h2 className="font-bold mb-4">Gemiddelde Zelfreflectie per IOP Doel</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#a0a0a0", fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#666", fontSize: 10 }} />
                    <Radar name="Score" dataKey="A" stroke="#FF6B00" fill="#FF6B00" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Reflection history */}
          {playerReflections.length > 0 && (
            <div className="elite-card p-6">
              <h2 className="font-bold mb-4">Reflectie Geschiedenis</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#a0a0a0] border-b border-[#222]">
                      <th className="text-left py-2">Datum</th>
                      <th className="text-left py-2">Wedstrijd</th>
                      <th className="text-center py-2">Doel 1</th>
                      <th className="text-center py-2">Doel 2</th>
                      <th className="text-center py-2">Doel 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerReflections.sort((a, b) => new Date(b.date) - new Date(a.date)).map((r) => (
                      <tr key={r.id} className="border-b border-[#111]">
                        <td className="py-2">{format(new Date(r.date), "d MMM", { locale: nl })}</td>
                        <td className="py-2">{r.match_opponent || "-"}</td>
                        <td className="py-2 text-center text-[#FF6B00] font-bold">{r.goal_1_rating || "-"}</td>
                        <td className="py-2 text-center text-[#1a3a8f] font-bold">{r.goal_2_rating || "-"}</td>
                        <td className="py-2 text-center text-[#22c55e] font-bold">{r.goal_3_rating || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}