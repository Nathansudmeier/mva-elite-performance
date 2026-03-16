import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, TrendingUp, TrendingDown, Calendar, Users, CheckSquare, Link as LinkIcon, Upload } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import StatCard from "../components/common/StatCard";
import ChampionsTrophy from "../components/dashboard/ChampionsTrophy";
import WinningTeamUpload from "../components/dashboard/WinningTeamUpload";
import { format, subDays, isAfter } from "date-fns";
import { nl } from "date-fns/locale";

const TEAMS = ["MO17", "Dames 1"];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSpeelster, isLoading: authLoading } = useCurrentUser();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);


  useEffect(() => {
    if (!authLoading && isSpeelster) {
      navigate("/PlayerDashboard", { replace: true });
    }
  }, [isSpeelster, authLoading]);

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list() });
  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-date") });
  const { data: winningTeams = [] } = useQuery({ queryKey: ["winningTeams"], queryFn: () => base44.entities.WinningTeam.list() });
  const { data: yoyoTests = [] } = useQuery({ queryKey: ["yoyoTests"], queryFn: () => base44.entities.YoYoTest.list("-date") });
  const { data: physicalTests = [] } = useQuery({ queryKey: ["physicalTests"], queryFn: () => base44.entities.PhysicalTest.list("-date") });
  const { data: playerRatings = [] } = useQuery({ queryKey: ["playerRatings"], queryFn: () => base44.entities.PlayerRating.list("-date") });
  const { data: wellnessLogs = [] } = useQuery({ queryKey: ["wellnessLogs"], queryFn: () => base44.entities.WellnessLog.list("-date") });
  const { data: selfReflections = [] } = useQuery({ queryKey: ["selfReflections"], queryFn: () => base44.entities.SelfReflection.list("-date") });
  const { data: winningTeamPhotos = [] } = useQuery({ queryKey: ["winningTeamPhotos"], queryFn: () => base44.entities.WinningTeam.list() });

  const activePlayers = players.filter((p) => p.active !== false);

  // === BLOK 1: SNEL OVERZICHT ===
  const last4WeeksAgo = subDays(new Date(), 28);
  const recentSessions = sessions.filter(s => isAfter(new Date(s.date), last4WeeksAgo));
  const recentAttendance = attendance.filter(a => {
    const session = sessions.find(s => s.id === a.session_id);
    return session && isAfter(new Date(session.date), last4WeeksAgo);
  });
  const avgAttendancePercent = recentSessions.length > 0 && activePlayers.length > 0
    ? Math.round((recentAttendance.filter(a => a.present).length / (activePlayers.length * recentSessions.length)) * 100)
    : 0;

  const allMatches = matches.sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextMatch = allMatches.find(m => isAfter(new Date(m.date), new Date())) || null;

  const teamPlayers = activePlayers; // All active players for rating counts
  const meting1Count = playerRatings.filter(r => r.meting === "Meting 1").length;
  const meting2Count = playerRatings.filter(r => r.meting === "Meting 2").length;
  const meting3Count = playerRatings.filter(r => r.meting === "Meting 3").length;
  const totalRatingsNeeded = teamPlayers.length;

  // === BLOK 2: AANDACHTSPUNTEN ===
  const last4Weeks = subDays(new Date(), 28);
  const recentPlayerAttendance = {};
  activePlayers.forEach(p => {
    const playerAttendance = recentAttendance.filter(a => a.player_id === p.id);
    const attended = playerAttendance.filter(a => a.present).length;
    const total = recentSessions.length;
    recentPlayerAttendance[p.id] = total > 0 ? (attended / total) * 100 : 100;
  });

  const lowAttendancePlayers = activePlayers
    .filter(p => recentPlayerAttendance[p.id] < 60)
    .map(p => ({ name: p.name, percentage: Math.round(recentPlayerAttendance[p.id]) }));

  const last7Days = subDays(new Date(), 7);
  const recentWellnessLogs = wellnessLogs.filter(w => isAfter(new Date(w.date), last7Days));
  const fatigueOrPainPlayers = activePlayers
    .filter(p => {
      const logs = recentWellnessLogs.filter(w => w.player_id === p.id);
      return logs.some(l => (l.fatigue >= 4 || l.muscle_pain >= 4));
    })
    .map(p => p.name);

  // === BLOK 3: CHAMPIONS TROPHY TOP 5 ===
  const playerWinCounts = {};
  activePlayers.forEach(p => {
    playerWinCounts[p.id] = winningTeamPhotos.filter(w => w.winning_player_ids?.includes(p.id)).length;
  });
  const topWinners = activePlayers
    .map(p => ({ id: p.id, name: p.name, wins: playerWinCounts[p.id] || 0, total: winningTeamPhotos.length }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5);

  // === BLOK 4: GROEPSFYSIEK ===
  const teamYoyoTests = yoyoTests.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestYoyoDate = teamYoyoTests.length > 0 ? teamYoyoTests[0].date : null;
  const previousYoyoDate = teamYoyoTests.length > 1 ? teamYoyoTests.slice(1).find(t => t.date !== latestYoyoDate)?.date : null;

  const latestYoyoLevels = teamYoyoTests.filter(t => t.date === latestYoyoDate).map(t => parseFloat(t.level || 0));
  const previousYoyoLevels = previousYoyoDate ? teamYoyoTests.filter(t => t.date === previousYoyoDate).map(t => parseFloat(t.level || 0)) : [];

  const avgLatestYoyo = latestYoyoLevels.length > 0 ? (latestYoyoLevels.reduce((a, b) => a + b, 0) / latestYoyoLevels.length).toFixed(1) : "–";
  const avgPreviousYoyo = previousYoyoLevels.length > 0 ? (previousYoyoLevels.reduce((a, b) => a + b, 0) / previousYoyoLevels.length).toFixed(1) : null;
  const yoyoDiff = avgPreviousYoyo ? (parseFloat(avgLatestYoyo) - parseFloat(avgPreviousYoyo)).toFixed(2) : null;

  const teamSprintTests = physicalTests.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestSprintDate = teamSprintTests.length > 0 ? teamSprintTests[0].date : null;
  const previousSprintDate = teamSprintTests.length > 1 ? teamSprintTests.slice(1).find(t => t.date !== latestSprintDate)?.date : null;

  const latestSprints = teamSprintTests.filter(t => t.date === latestSprintDate && t.sprint_30m).map(t => t.sprint_30m);
  const previousSprints = previousSprintDate ? teamSprintTests.filter(t => t.date === previousSprintDate && t.sprint_30m).map(t => t.sprint_30m) : [];

  const avgLatestSprint = latestSprints.length > 0 ? (latestSprints.reduce((a, b) => a + b, 0) / latestSprints.length).toFixed(2) : "–";
  const avgPreviousSprint = previousSprints.length > 0 ? (previousSprints.reduce((a, b) => a + b, 0) / previousSprints.length).toFixed(2) : null;
  const sprintDiff = avgPreviousSprint ? (parseFloat(avgLatestSprint) - parseFloat(avgPreviousSprint)).toFixed(2) : null;

  // === BLOK 5: RECENTE WEDSTRIJDEN ===
  const recentMatches = allMatches.slice(-3).reverse();

  // === BLOK 6: ZELFREFLECTIES DEZE WEEK ===
  const thisWeekReflections = selfReflections
    .filter(r => isAfter(new Date(r.date), last7Days))
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* BLOK 1: Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-white mb-2">Aanwezigheid (4w)</p>
          <p className="text-3xl font-black text-white">{avgAttendancePercent}%</p>
          <p className="text-xs text-white/70 mt-1">{activePlayers.length} speelsters</p>
        </div>
        <div className="p-5 rounded-xl backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-white mb-2">Volgende Wedstrijd</p>
          {nextMatch ? (
            <>
              <p className="text-lg font-black text-white">vs. {nextMatch.opponent}</p>
              <p className="text-xs text-white/70 mt-1">{format(new Date(nextMatch.date), "d MMM yyyy", { locale: nl })}</p>
            </>
          ) : (
            <p className="text-sm text-white/70">Geen geplande wedstrijden</p>
          )}
        </div>
        <div className="p-5 rounded-xl backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-white mb-2">Beoordelingen</p>
          <div className="space-y-1 text-sm">
            <p className="text-white font-semibold">M1: <span className="text-white/80">{meting1Count}/{totalRatingsNeeded}</span></p>
            <p className="text-white font-semibold">M2: <span className="text-white/80">{meting2Count}/{totalRatingsNeeded}</span></p>
            <p className="text-white font-semibold">M3: <span className="text-white/80">{meting3Count}/{totalRatingsNeeded}</span></p>
          </div>
        </div>
      </div>

      {/* BLOK 2: Alerts */}
      <div className="space-y-3">
        {lowAttendancePlayers.length > 0 && (
          <div className="p-4 rounded-xl border-l-4" style={{ backgroundColor: "#FFF5F0", borderColor: "#F0926E" }}>
            <div className="flex gap-3">
              <AlertCircle size={20} style={{ color: "#F0926E" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#D45A30] text-sm">Lage aanwezigheid</p>
                <p className="text-sm text-[#2F3650] mt-1">
                  {lowAttendancePlayers.map(p => `${p.name} (${p.percentage}%)`).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
        {fatigueOrPainPlayers.length > 0 && (
          <div className="p-4 rounded-xl border-l-4" style={{ backgroundColor: "#FFF5F0", borderColor: "#C0392B" }}>
            <div className="flex gap-3">
              <AlertCircle size={20} style={{ color: "#C0392B" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#C0392B] text-sm">Vermoeidheid/Pijn gemeld</p>
                <p className="text-sm text-[#2F3650] mt-1">
                  {fatigueOrPainPlayers.join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team of the Week Upload Card */}
      <div className="p-5 rounded-xl backdrop-blur-sm cursor-pointer hover:shadow-lg transition-shadow" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)" }} onClick={() => setUploadModalOpen(true)}>
        <div className="flex items-center justify-center text-center">
          <div>
            <Upload size={32} className="mx-auto mb-2 text-white" />
            <p className="font-semibold text-white text-sm">Team of the Week</p>
            <p className="text-xs text-white/70">Klik om foto toe te voegen</p>
          </div>
        </div>
      </div>

      {/* Team of the Week Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold text-[#1A1F2E] mb-4">Team of the Week</h2>
            <WinningTeamUpload 
              players={activePlayers} 
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["winningTeams"] });
                setUploadModalOpen(false);
              }} 
            />
            <button 
              onClick={() => setUploadModalOpen(false)}
              className="mt-4 w-full px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: "#D45A30" }}
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {/* BLOK 3: Champions Trophy Top 5 */}
      <div className="elite-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#1A1F2E]">🏆 Top 5 Winnaars</h2>
          <button onClick={() => navigate("/Dashboard#leaderboard")} className="text-xs font-semibold text-white hover:underline flex items-center gap-1">
            Volledig leaderboard <LinkIcon size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {topWinners.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#FDE8DC" }}>
              <div className="flex items-center gap-3">
                <span className="font-black text-lg text-[#D45A30] w-6">{i + 1}</span>
                <span className="font-semibold text-[#1A1F2E]">{p.name}</span>
              </div>
              <div className="text-right">
                <p className="font-black text-[#D45A30]">{p.wins}</p>
                <p className="text-xs text-[#2F3650]">{p.total > 0 ? ((p.wins / p.total) * 100).toFixed(0) : 0}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BLOK 4: Groepsfysiek */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Avg. Yo-Yo Niveau</p>
          <p className="text-3xl font-black text-white">{avgLatestYoyo}</p>
          {yoyoDiff && (
            <div className="flex items-center gap-1 mt-2">
              {parseFloat(yoyoDiff) >= 0 ? (
                <TrendingUp size={16} style={{ color: "#4CAF82" }} />
              ) : (
                <TrendingDown size={16} style={{ color: "#C0392B" }} />
              )}
              <p className={`text-sm font-semibold ${parseFloat(yoyoDiff) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {parseFloat(yoyoDiff) >= 0 ? "+" : ""}{yoyoDiff}
              </p>
            </div>
          )}
        </div>
        <div className="p-5 rounded-xl backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Avg. 30m Sprint (sec)</p>
          <p className="text-3xl font-black text-white">{avgLatestSprint}</p>
          {sprintDiff && (
            <div className="flex items-center gap-1 mt-2">
              {parseFloat(sprintDiff) <= 0 ? (
                <TrendingUp size={16} style={{ color: "#4CAF82" }} />
              ) : (
                <TrendingDown size={16} style={{ color: "#C0392B" }} />
              )}
              <p className={`text-sm font-semibold ${parseFloat(sprintDiff) <= 0 ? "text-green-600" : "text-red-600"}`}>
                {parseFloat(sprintDiff) > 0 ? "+" : ""}{sprintDiff}s
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BLOK 5: Recente Wedstrijden */}
      <div className="elite-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#1A1F2E]">Recente Wedstrijden</h2>
          <button onClick={() => navigate("/Wedstrijden")} className="text-xs font-semibold text-[#D45A30] hover:underline flex items-center gap-1">
            Alle wedstrijden <LinkIcon size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {recentMatches.map((m) => {
            let badge = "–";
            if (m.score_home !== undefined && m.score_away !== undefined) {
              badge = m.score_home > m.score_away ? "W" : m.score_home < m.score_away ? "V" : "G";
            }
            const badgeColor = badge === "W" ? "#4CAF82" : badge === "V" ? "#C0392B" : "#F0926E";
            return (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#FDE8DC" }}>
                <div>
                  <p className="font-semibold text-[#1A1F2E]">{m.home_away === "Uit" ? "@ " : ""}{m.opponent}</p>
                  <p className="text-xs text-[#2F3650]">{format(new Date(m.date), "d MMM", { locale: nl })}</p>
                </div>
                <div className="flex items-center gap-3">
                  {m.score_home !== undefined && m.score_away !== undefined && (
                    <p className="font-black text-[#D45A30]">{m.score_home}–{m.score_away}</p>
                  )}
                  <p className="font-black text-white px-2.5 py-1 rounded text-sm" style={{ backgroundColor: badgeColor }}>{badge}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOK 6: Zelfreflecties */}
      <div className="elite-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#1A1F2E]">Zelfreflecties (deze week)</h2>
          <button onClick={() => navigate("/SelfReflection")} className="text-xs font-semibold text-[#D45A30] hover:underline flex items-center gap-1">
            Alle reflecties <LinkIcon size={12} />
          </button>
        </div>
        {thisWeekReflections.length > 0 ? (
          <div className="space-y-3">
            {thisWeekReflections.map((r) => {
              const player = activePlayers.find(p => p.id === r.player_id);
              return (
                <div key={r.id} className="p-3 rounded-lg" style={{ backgroundColor: "#FDE8DC" }}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-[#1A1F2E]">{player?.name || "–"}</p>
                    <p className="text-xs text-[#2F3650]">{format(new Date(r.date), "d MMM", { locale: nl })}</p>
                  </div>
                  <p className="text-xs text-[#2F3650] line-clamp-2">
                    {r.general_notes || r.goal_1_notes || "Reflectie ingevuld"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#2F3650]">Geen reflecties deze week</p>
        )}
      </div>
    </div>
  );
}