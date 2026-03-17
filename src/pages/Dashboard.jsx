import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, TrendingUp, TrendingDown, Upload } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import ChampionsTrophy from "../components/dashboard/ChampionsTrophy";
import WinningTeamUpload from "../components/dashboard/WinningTeamUpload";
import { format, subDays, isAfter } from "date-fns";
import { nl } from "date-fns/locale";

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
  const { data: winningTeamPhotos = [] } = useQuery({ queryKey: ["winningTeamPhotos"], queryFn: () => base44.entities.WinningTeam.list() });
  const { data: yoyoTests = [] } = useQuery({ queryKey: ["yoyoTests"], queryFn: () => base44.entities.YoYoTest.list("-date") });
  const { data: physicalTests = [] } = useQuery({ queryKey: ["physicalTests"], queryFn: () => base44.entities.PhysicalTest.list("-date") });
  const { data: playerRatings = [] } = useQuery({ queryKey: ["playerRatings"], queryFn: () => base44.entities.PlayerRating.list("-date") });
  const { data: wellnessLogs = [] } = useQuery({ queryKey: ["wellnessLogs"], queryFn: () => base44.entities.WellnessLog.list("-date") });
  const { data: selfReflections = [] } = useQuery({ queryKey: ["selfReflections"], queryFn: () => base44.entities.SelfReflection.list("-date") });

  const activePlayers = players.filter((p) => p.active !== false);

  // === BLOK 1: QUICK STATS ===
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

  const teamPlayers = activePlayers;
  const meting1Count = playerRatings.filter(r => r.meting === "Meting 1").length;
  const meting2Count = playerRatings.filter(r => r.meting === "Meting 2").length;
  const meting3Count = playerRatings.filter(r => r.meting === "Meting 3").length;
  const totalRatingsNeeded = teamPlayers.length;

  // === BLOK 2: ALERTS ===
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
          <p className="text-xs font-500 uppercase tracking-wider text-[#888888] mb-2">Aanwezigheid (4w)</p>
          <p className="text-4xl font-500 text-[#FF6B00]">{avgAttendancePercent}%</p>
          <p className="text-sm text-[#888888] mt-2">{activePlayers.length} speelsters</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E8E6E1] min-h-[130px]">
          {/* Football field background */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(160deg, #2d6a2d 0%, #1e4d1e 50%, #163d16 100%)",
          }}>
            {/* Field markings */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice">
              <rect x="1" y="1" width="298" height="128" fill="none" stroke="white" strokeWidth="2"/>
              <line x1="150" y1="1" x2="150" y2="129" stroke="white" strokeWidth="1.5"/>
              <circle cx="150" cy="65" r="25" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="150" cy="65" r="2" fill="white"/>
              <rect x="1" y="35" width="40" height="60" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="259" y="35" width="40" height="60" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="1" y="50" width="18" height="30" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="281" y="50" width="18" height="30" fill="none" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          {/* Content */}
          <div className="relative z-10 p-5">
            <p className="text-xs font-500 uppercase tracking-wider text-white/70 mb-3">Volgende Wedstrijd</p>
            {nextMatch ? (
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-1">{nextMatch.home_away === "Uit" ? "Uitwedstrijd" : "Thuiswedstrijd"}</p>
                  <p className="text-2xl font-500 text-white leading-tight">vs. {nextMatch.opponent}</p>
                </div>
                <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-xl p-2.5 min-w-[52px]">
                  <span className="text-white/80 text-xs font-500 uppercase">{format(new Date(nextMatch.date), "MMM", { locale: nl })}</span>
                  <span className="text-white text-2xl font-500 leading-tight">{format(new Date(nextMatch.date), "d")}</span>
                  <span className="text-white/70 text-xs">{format(new Date(nextMatch.date), "EEE", { locale: nl })}</span>
                </div>
              </div>
            ) : (
              <p className="text-white/70 text-sm mt-2">Geen geplande wedstrijden</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
          <p className="text-xs font-500 uppercase tracking-wider text-[#888888] mb-2">Beoordelingen</p>
          <div className="space-y-2 text-sm">
            <p className="text-[#1A1A1A]">M1: <span className="text-[#888888]">{meting1Count}/{totalRatingsNeeded}</span></p>
            <p className="text-[#1A1A1A]">M2: <span className="text-[#888888]">{meting2Count}/{totalRatingsNeeded}</span></p>
            <p className="text-[#1A1A1A]">M3: <span className="text-[#888888]">{meting3Count}/{totalRatingsNeeded}</span></p>
          </div>
        </div>
      </div>

      {/* BLOK 2: Alerts */}
      <div className="space-y-3">
        {lowAttendancePlayers.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border-l-4 border-[#FF6B00] shadow-sm">
            <div className="flex gap-3">
              <AlertCircle size={20} color="#FF6B00" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-500 text-[#FF6B00] text-sm">Lage aanwezigheid</p>
                <p className="text-sm text-[#888888] mt-1">
                  {lowAttendancePlayers.map(p => `${p.name} (${p.percentage}%)`).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
        {fatigueOrPainPlayers.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border-l-4 border-[#C0392B] shadow-sm">
            <div className="flex gap-3">
              <AlertCircle size={20} color="#C0392B" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-500 text-[#C0392B] text-sm">Vermoeidheid/Pijn gemeld</p>
                <p className="text-sm text-[#888888] mt-1">
                  {fatigueOrPainPlayers.join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team of the Week Upload Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1] cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setUploadModalOpen(true)}
      >
        <div className="flex items-center justify-center text-center">
          <div>
            <Upload size={32} color="#FF6B00" className="mx-auto mb-3" />
            <p className="font-500 text-[#1A1A1A] text-base">Team of the Week</p>
            <p className="text-sm text-[#888888] mt-1">Klik om foto toe te voegen</p>
          </div>
        </div>
      </div>

      {/* Team of the Week Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-lg">
            <h2 className="text-2xl font-500 text-[#1A1A1A] mb-4">Team of the Week</h2>
            <WinningTeamUpload 
              players={activePlayers} 
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["winningTeamPhotos"] });
                setUploadModalOpen(false);
              }} 
            />
            <button 
              onClick={() => setUploadModalOpen(false)}
              className="mt-4 w-full px-4 py-3 rounded-xl text-sm font-500 text-white bg-[#FF6B00] hover:bg-[#E55A00] transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {/* BLOK 3: Champions Trophy Top 5 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-500 text-[#1A1A1A]">Top 5 Winnaars</h2>
          <button 
            onClick={() => navigate("/Leaderboard")} 
            className="text-sm font-500 text-[#FF6B00] hover:text-[#E55A00] transition-colors"
          >
            Volledig leaderboard →
          </button>
        </div>
        <div className="space-y-2">
          {topWinners.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-[#F7F5F2]">
              <div className="flex items-center gap-4">
                <span className="font-500 text-lg text-[#FF6B00] w-6">{i + 1}</span>
                <span className="font-500 text-[#1A1A1A]">{p.name}</span>
              </div>
              <div className="text-right">
                <p className="font-500 text-[#FF6B00]">{p.wins}</p>
                <p className="text-xs text-[#888888]">{p.total > 0 ? ((p.wins / p.total) * 100).toFixed(0) : 0}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BLOK 4: Groepsfysiek */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
          <p className="text-xs font-500 uppercase tracking-wider text-[#888888] mb-3">Gemiddeld Yo-Yo Niveau</p>
          <p className="text-4xl font-500 text-[#FF6B00]">{avgLatestYoyo}</p>
          {yoyoDiff && (
            <div className="flex items-center gap-2 mt-3">
              {parseFloat(yoyoDiff) >= 0 ? (
                <TrendingUp size={16} color="#3B6D11" />
              ) : (
                <TrendingDown size={16} color="#C0392B" />
              )}
              <p className={`text-sm font-500 ${parseFloat(yoyoDiff) >= 0 ? "text-[#3B6D11]" : "text-[#C0392B]"}`}>
                {parseFloat(yoyoDiff) >= 0 ? "+" : ""}{yoyoDiff}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
          <p className="text-xs font-500 uppercase tracking-wider text-[#888888] mb-3">Gemiddelde 30m Sprint (sec)</p>
          <p className="text-4xl font-500 text-[#FF6B00]">{avgLatestSprint}</p>
          {sprintDiff && (
            <div className="flex items-center gap-2 mt-3">
              {parseFloat(sprintDiff) <= 0 ? (
                <TrendingUp size={16} color="#3B6D11" />
              ) : (
                <TrendingDown size={16} color="#C0392B" />
              )}
              <p className={`text-sm font-500 ${parseFloat(sprintDiff) <= 0 ? "text-[#3B6D11]" : "text-[#C0392B]"}`}>
                {parseFloat(sprintDiff) > 0 ? "+" : ""}{sprintDiff}s
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BLOK 5: Recente Wedstrijden */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-500 text-[#1A1A1A]">Recente Wedstrijden</h2>
          <button 
            onClick={() => navigate("/Wedstrijden")} 
            className="text-sm font-500 text-[#FF6B00] hover:text-[#E55A00] transition-colors"
          >
            Alle wedstrijden →
          </button>
        </div>
        <div className="space-y-2">
          {recentMatches.map((m) => {
            let badge = "–";
            if (m.score_home !== undefined && m.score_away !== undefined) {
              badge = m.score_home > m.score_away ? "W" : m.score_home < m.score_away ? "V" : "G";
            }
            const badgeColor = badge === "W" ? "#3B6D11" : badge === "V" ? "#C0392B" : "#FF6B00";
            return (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-[#F7F5F2]">
                <div>
                  <p className="font-500 text-[#1A1A1A]">{m.home_away === "Uit" ? "@ " : ""}{m.opponent}</p>
                  <p className="text-xs text-[#888888] mt-1">{format(new Date(m.date), "d MMM", { locale: nl })}</p>
                </div>
                <div className="flex items-center gap-3">
                  {m.score_home !== undefined && m.score_away !== undefined && (
                    <p className="font-500 text-[#FF6B00]">{m.score_home}–{m.score_away}</p>
                  )}
                  <p className="font-500 text-white px-3 py-1.5 rounded-lg text-sm" style={{ backgroundColor: badgeColor }}>{badge}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOK 6: Zelfreflecties */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-500 text-[#1A1A1A]">Zelfreflecties (deze week)</h2>
          <button 
            onClick={() => navigate("/SelfReflection")} 
            className="text-sm font-500 text-[#FF6B00] hover:text-[#E55A00] transition-colors"
          >
            Alle reflecties →
          </button>
        </div>
        {thisWeekReflections.length > 0 ? (
          <div className="space-y-3">
            {thisWeekReflections.map((r) => {
              const player = activePlayers.find(p => p.id === r.player_id);
              return (
                <div key={r.id} className="p-4 rounded-xl bg-[#F7F5F2]">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-500 text-[#1A1A1A]">{player?.name || "–"}</p>
                    <p className="text-xs text-[#888888]">{format(new Date(r.date), "d MMM", { locale: nl })}</p>
                  </div>
                  <p className="text-sm text-[#888888] line-clamp-2">
                    {r.general_notes || r.goal_1_notes || "Reflectie ingevuld"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#888888]">Geen reflecties deze week</p>
        )}
      </div>
    </div>
  );
}