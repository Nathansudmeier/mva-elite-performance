import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, TrendingUp, TrendingDown, Upload, Trophy, Minus } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import MatchDayBanner from "@/components/checkin/MatchDayBanner";
import TrainerChampionsTrophy from "../components/dashboard/TrainerChampionsTrophy";
import PhotoTimeline from "../components/photos/PhotoTimeline";
import PhotoUpload from "../components/photos/PhotoUpload";
import WinningTeamUpload from "../components/dashboard/WinningTeamUpload";
import { format, subDays, isAfter } from "date-fns";
import { nl } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSpeelster, isTrainer, isLoading: authLoading } = useCurrentUser();
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
  const { data: teamPhotos = [], refetch: refetchPhotos } = useQuery({ queryKey: ["teamPhotos"], queryFn: () => base44.entities.TeamPhoto.list("-date") });

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

  // === WIN/LOSS STATS ===
  const playedMatches = matches.filter(m => m.score_home !== undefined && m.score_away !== undefined && m.score_home !== null && m.score_away !== null);
  const wins = playedMatches.filter(m => m.home_away === "Thuis" ? m.score_home > m.score_away : m.score_away > m.score_home).length;
  const losses = playedMatches.filter(m => m.home_away === "Thuis" ? m.score_home < m.score_away : m.score_away < m.score_home).length;
  const draws = playedMatches.filter(m => m.score_home === m.score_away).length;
  const winPct = playedMatches.length > 0 ? Math.round((wins / playedMatches.length) * 100) : 0;

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
      <MatchDayBanner />

      {/* BLOK 1: Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Aanwezigheid */}
        <div className="glass p-6">
          <p className="t-label mb-2">Aanwezigheid (4w)</p>
          <p className="t-metric-orange">{avgAttendancePercent}%</p>
          <p className="t-secondary mt-2">{activePlayers.length} speelsters</p>
        </div>

        {/* Volgende wedstrijd */}
        <div className="match-hero-card cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate("/Wedstrijden")}>
          <div className="absolute inset-0">
            <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice">
              <rect x="1" y="1" width="298" height="158" fill="none" stroke="white" strokeWidth="2"/>
              <line x1="150" y1="1" x2="150" y2="159" stroke="white" strokeWidth="1.5"/>
              <circle cx="150" cy="80" r="28" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="150" cy="80" r="2" fill="white"/>
              <rect x="1" y="45" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="257" y="45" width="42" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
            </svg>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(255,107,0,0.15) 0%, rgba(0,0,0,0.10) 100%)" }} />
          </div>
          <div className="relative z-10 p-5">
            <p className="t-label mb-3">Volgende Wedstrijd</p>
            {nextMatch ? (
              <div className="flex items-end justify-between">
                <div>
                  <p className="t-secondary-sm mb-1">{nextMatch.home_away === "Uit" ? "Uitwedstrijd" : "Thuiswedstrijd"}</p>
                  <p className="text-xl font-bold text-white leading-tight" style={{ letterSpacing: "-0.3px" }}>vs. {nextMatch.opponent}</p>
                </div>
                <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-xl p-2.5 min-w-[52px]">
                  <span className="t-label uppercase">{format(new Date(nextMatch.date), "MMM", { locale: nl })}</span>
                  <span className="t-metric text-white leading-tight">{format(new Date(nextMatch.date), "d")}</span>
                  <span className="t-tertiary">{format(new Date(nextMatch.date), "EEE", { locale: nl })}</span>
                </div>
              </div>
            ) : (
              <p className="t-secondary mt-2">Geen geplande wedstrijden</p>
            )}
          </div>
        </div>

        {/* Seizoensresultaten */}
        <div
          className="relative cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => navigate("/Wedstrijden")}
          style={{
            background: "rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "0.5px solid rgba(255,255,255,0.18)",
            borderRadius: "22px",
            padding: "24px",
            overflow: "hidden",
          }}
        >
          {/* Shine */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }} />

          <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            SEIZOENSRESULTATEN
          </p>

          {playedMatches.length === 0 ? (
            <p className="t-secondary mt-3">Nog geen wedstrijden gespeeld</p>
          ) : (
            <>
              <div className="flex items-baseline mt-2" style={{ gap: "8px" }}>
                <span style={{ fontSize: "32px", fontWeight: 700, color: "#FF8C3A", lineHeight: 1 }}>{winPct}%</span>
                <span style={{ fontSize: "14px", fontWeight: 400, color: "rgba(255,255,255,0.50)" }}>winst</span>
              </div>

              {/* Progress bar */}
              <div style={{ height: "3px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "2px", marginTop: "8px", marginBottom: "12px" }}>
                <div style={{ height: "100%", width: `${winPct}%`, background: "linear-gradient(90deg, #FF6B00, #FF9500)", borderRadius: "2px" }} />
              </div>

              {/* Pills */}
              <div className="flex" style={{ gap: "8px" }}>
                <div className="flex-1 text-center" style={{ background: "rgba(74,222,128,0.10)", border: "0.5px solid rgba(74,222,128,0.20)", borderRadius: "10px", padding: "8px 6px" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#4ade80", lineHeight: 1 }}>{wins}</p>
                  <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "3px" }}>WINST</p>
                </div>
                <div className="flex-1 text-center" style={{ background: "rgba(251,191,36,0.10)", border: "0.5px solid rgba(251,191,36,0.20)", borderRadius: "10px", padding: "8px 6px" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#fbbf24", lineHeight: 1 }}>{draws}</p>
                  <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "3px" }}>GELIJK</p>
                </div>
                <div className="flex-1 text-center" style={{ background: "rgba(248,113,113,0.10)", border: "0.5px solid rgba(248,113,113,0.20)", borderRadius: "10px", padding: "8px 6px" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#f87171", lineHeight: 1 }}>{losses}</p>
                  <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "3px" }}>VERLIES</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BLOK 2: Alerts */}
      <div className="space-y-3">
        {lowAttendancePlayers.length > 0 && (
          <div className="glass-alert p-4" style={{ borderLeftWidth: "3px", borderLeftColor: "#FF8C3A", borderRadius: "18px" }}>
            <div className="flex gap-3">
              <AlertCircle size={18} color="#FF8C3A" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="t-card-title" style={{ color: "#FF8C3A" }}>Lage aanwezigheid</p>
                <p className="t-secondary mt-1">{lowAttendancePlayers.map(p => `${p.name} (${p.percentage}%)`).join(", ")}</p>
              </div>
            </div>
          </div>
        )}
        {fatigueOrPainPlayers.length > 0 && (
          <div className="glass p-4" style={{ borderLeftWidth: "3px", borderLeftColor: "#f87171", borderRadius: "18px" }}>
            <div className="flex gap-3">
              <AlertCircle size={18} color="#f87171" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="t-card-title" style={{ color: "#f87171" }}>Vermoeidheid/Pijn gemeld</p>
                <p className="t-secondary mt-1">{fatigueOrPainPlayers.join(", ")}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team of the Week Upload */}
      {isTrainer && (
        <div className="glass p-6 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setUploadModalOpen(true)}>
          <div className="flex items-center justify-center text-center">
            <div>
              <Upload size={28} color="#FF8C3A" className="mx-auto mb-3" />
              <p className="t-section-title">Team of the Week</p>
              <p className="t-secondary mt-1">Klik om foto toe te voegen</p>
            </div>
          </div>
        </div>
      )}

      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="glass-dark p-6 max-w-lg w-full">
            <h2 className="t-page-title mb-4">Team of the Week</h2>
            <WinningTeamUpload players={activePlayers} onSaved={() => { queryClient.invalidateQueries({ queryKey: ["winningTeamPhotos"] }); setUploadModalOpen(false); }} />
            <button onClick={() => setUploadModalOpen(false)} className="mt-4 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#FF6B00] hover:bg-[#E55A00] transition-colors">
              Sluiten
            </button>
          </div>
        </div>
      )}

      <TrainerChampionsTrophy players={activePlayers} winningTeams={winningTeamPhotos} />

      {/* BLOK 4: Groepsfysiek */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-6">
          <p className="t-label mb-3">Gemiddeld Yo-Yo Niveau</p>
          <p className="t-metric-orange">{avgLatestYoyo}</p>
          {yoyoDiff && (
            <div className="flex items-center gap-2 mt-3">
              {parseFloat(yoyoDiff) >= 0 ? <TrendingUp size={15} color="#4ade80" /> : <TrendingDown size={15} color="#f87171" />}
              <p className="t-secondary" style={{ color: parseFloat(yoyoDiff) >= 0 ? "#4ade80" : "#f87171" }}>
                {parseFloat(yoyoDiff) >= 0 ? "+" : ""}{yoyoDiff}
              </p>
            </div>
          )}
        </div>
        <div className="glass p-6">
          <p className="t-label mb-3">Gemiddelde 30m Sprint (sec)</p>
          <p className="t-metric-orange">{avgLatestSprint}</p>
          {sprintDiff && (
            <div className="flex items-center gap-2 mt-3">
              {parseFloat(sprintDiff) <= 0 ? <TrendingUp size={15} color="#4ade80" /> : <TrendingDown size={15} color="#f87171" />}
              <p className="t-secondary" style={{ color: parseFloat(sprintDiff) <= 0 ? "#4ade80" : "#f87171" }}>
                {parseFloat(sprintDiff) > 0 ? "+" : ""}{sprintDiff}s
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BLOK 5: Recente Wedstrijden */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="t-section-title">Recente Wedstrijden</h2>
          <button onClick={() => navigate("/Wedstrijden")} className="t-secondary" style={{ color: "#FF8C3A" }}>Alle →</button>
        </div>
        <div className="space-y-2">
          {recentMatches.map((m) => {
            let badge = "–";
            if (m.score_home !== undefined && m.score_away !== undefined) {
              badge = m.score_home > m.score_away ? "W" : m.score_home < m.score_away ? "V" : "G";
            }
            const badgeClass = badge === "W" ? "badge badge-win" : badge === "V" ? "badge badge-loss" : badge === "G" ? "badge badge-draw" : "badge";
            return (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2.5">
                  <span className={badge === "W" ? "dot-green" : badge === "V" ? "dot-red" : "dot-yellow"} />
                  <div>
                    <p className="t-card-title">{m.home_away === "Uit" ? "@ " : ""}{m.opponent}</p>
                    <p className="t-secondary-sm mt-0.5">{format(new Date(m.date), "d MMM", { locale: nl })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {m.score_home !== undefined && m.score_away !== undefined && (
                    <p className="text-sm font-bold" style={{ color: "#FF8C3A" }}>{m.score_home}–{m.score_away}</p>
                  )}
                  <span className={badgeClass}>{badge}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isTrainer && <PhotoUpload onSaved={() => refetchPhotos()} />}
      <PhotoTimeline photos={teamPhotos} />

      {/* BLOK 6: Zelfreflecties */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="t-section-title">Zelfreflecties (deze week)</h2>
          <button onClick={() => navigate("/SelfReflection")} className="t-secondary" style={{ color: "#FF8C3A" }}>Alle →</button>
        </div>
        {thisWeekReflections.length > 0 ? (
          <div className="space-y-3">
            {thisWeekReflections.map((r) => {
              const player = activePlayers.find(p => p.id === r.player_id);
              return (
                <div key={r.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="t-card-title">{player?.name || "–"}</p>
                    <p className="t-secondary-sm">{format(new Date(r.date), "d MMM", { locale: nl })}</p>
                  </div>
                  <p className="t-secondary line-clamp-2">{r.general_notes || r.goal_1_notes || "Reflectie ingevuld"}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="t-tertiary">Geen reflecties deze week</p>
        )}
      </div>
    </div>
  );
}