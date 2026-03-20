import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
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
    <div className="space-y-5 pb-20 lg:pb-6">
      <MatchDayBanner />

      {/* ── HERO STAT (alle viewports) ── */}
      <div className="px-1 pt-2">
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: "48px", fontWeight: 700, color: "#ffffff", letterSpacing: "-2px", lineHeight: 1 }}>{winPct}%</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.50)" }}>winst</span>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
          {wins} overwinningen · {draws} gelijk · {losses} verlies · Seizoen 2025-26
        </p>
      </div>

      {/* ── VOLGENDE WEDSTRIJD ── */}
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
          <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.50) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
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

      {/* ── 4-KOLOMS METRIC GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>

        {/* Card 1: Aanwezigheid */}
        <div style={{ position: "relative", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.13)", borderRadius: "20px", padding: "14px", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }} />
          <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Aanwezigheid (4w)</p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#FF8C3A", lineHeight: 1, marginTop: "6px" }}>{avgAttendancePercent}%</p>
          <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", marginTop: "8px" }}>
            <div style={{ height: "100%", width: `${avgAttendancePercent}%`, background: "linear-gradient(90deg, #FF6B00, #FF9500)", borderRadius: "2px" }} />
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>{activePlayers.length} spelers</p>
        </div>

        {/* Card 2: Yo-Yo */}
        <div style={{ position: "relative", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.13)", borderRadius: "20px", padding: "14px", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }} />
          <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Yo-Yo niveau</p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", lineHeight: 1, marginTop: "6px" }}>{avgLatestYoyo}</p>
          <p style={{ fontSize: "11px", color: "#6ee7b7", marginTop: "8px" }}>
            {yoyoDiff ? (parseFloat(yoyoDiff) >= 0 ? `+${yoyoDiff}` : yoyoDiff) : "stabiel"}
          </p>
        </div>

        {/* Card 3: Sprint */}
        <div style={{ position: "relative", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.13)", borderRadius: "20px", padding: "14px", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }} />
          <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.07em" }}>30m sprint</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginTop: "6px" }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{avgLatestSprint}</p>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.30)" }}>s</span>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "8px" }}>gemiddeld</p>
        </div>

        {/* Card 4: Beoordelingen */}
        <div style={{ position: "relative", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.13)", borderRadius: "20px", padding: "14px", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }} />
          <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Beoordelingen</p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", lineHeight: 1, marginTop: "6px" }}>{meting1Count}/{totalRatingsNeeded}</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "8px" }}>meting 1 lopend</p>
        </div>
      </div>

      {/* ── ALERTS ── */}
      <div className="space-y-2">
        {lowAttendancePlayers.length > 0 && (
          <div style={{ background: "rgba(251,191,36,0.08)", border: "0.5px solid rgba(251,191,36,0.20)", borderRadius: "16px", padding: "0.75rem 1rem", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <i className="ti ti-alert-triangle flex-shrink-0 mt-0.5" style={{ fontSize: "14px", color: "#fbbf24" }} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#fbbf24" }}>{lowAttendancePlayers.length} spelers onder 60% aanwezigheid</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>{lowAttendancePlayers.map(p => p.name).join(", ")}</p>
            </div>
          </div>
        )}
        {fatigueOrPainPlayers.length > 0 && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "0.5px solid rgba(248,113,113,0.20)", borderRadius: "16px", padding: "0.75rem 1rem", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <i className="ti ti-alert-triangle flex-shrink-0 mt-0.5" style={{ fontSize: "14px", color: "#f87171" }} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#f87171" }}>Vermoeidheid / pijn gemeld</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>{fatigueOrPainPlayers.join(", ")}</p>
            </div>
          </div>
        )}
      </div>

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

      {/* ── 3-KOLOMS GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "10px" }}>

        {/* Kolom 1: Wedstrijden */}
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>Wedstrijden</p>
            <button onClick={() => navigate("/Wedstrijden")} style={{ fontSize: "12px", color: "#FF8C3A" }}>Alle →</button>
          </div>
          <div>
            {(() => {
              const displayMatches = allMatches.slice(-4).reverse();
              return displayMatches.map((m, i) => {
                const hasScore = m.score_home !== null && m.score_away !== null && m.score_home !== undefined && m.score_away !== undefined;
                const isPlanned = !hasScore;
                let result = "–";
                let dotColor = "#60a5fa";
                let badgeBg = "rgba(96,165,250,0.12)";
                let badgeColor = "#60a5fa";
                if (hasScore) {
                  const isWin = m.home_away === "Thuis" ? m.score_home > m.score_away : m.score_away > m.score_home;
                  const isDraw = m.score_home === m.score_away;
                  result = isWin ? "W" : isDraw ? "G" : "V";
                  dotColor = isWin ? "#4ade80" : isDraw ? "#fbbf24" : "#f87171";
                  badgeBg = isWin ? "rgba(74,222,128,0.12)" : isDraw ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.12)";
                  badgeColor = isWin ? "#4ade80" : isDraw ? "#fbbf24" : "#f87171";
                }
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < displayMatches.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>{m.opponent}</p>
                        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", marginTop: "2px" }}>{format(new Date(m.date), "d MMM", { locale: nl })}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px", background: badgeBg, color: badgeColor }}>
                      {isPlanned ? "gepland" : result}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Kolom 2: Seizoensresultaten */}
        <div className="glass p-4" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "10px" }}>Seizoensresultaten</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{winPct}%</span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.40)" }}>winst</span>
            </div>
            <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", marginBottom: "14px" }}>
              <div style={{ height: "100%", width: `${winPct}%`, background: "linear-gradient(90deg, #FF6B00, #FF9500)", borderRadius: "2px" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ flex: 1, textAlign: "center", background: "rgba(74,222,128,0.10)", border: "0.5px solid rgba(74,222,128,0.18)", borderRadius: "10px", padding: "8px 6px" }}>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#4ade80", lineHeight: 1 }}>{wins}</p>
              <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>WINST</p>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: "rgba(251,191,36,0.10)", border: "0.5px solid rgba(251,191,36,0.18)", borderRadius: "10px", padding: "8px 6px" }}>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#fbbf24", lineHeight: 1 }}>{draws}</p>
              <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>GELIJK</p>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: "rgba(248,113,113,0.10)", border: "0.5px solid rgba(248,113,113,0.18)", borderRadius: "10px", padding: "8px 6px" }}>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#f87171", lineHeight: 1 }}>{losses}</p>
              <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>VERLIES</p>
            </div>
          </div>
        </div>

        {/* Kolom 3: Snelle acties */}
        <div className="glass p-4">
          <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "10px", letterSpacing: "0.05em" }}>Snelle acties</p>
          {[
            { icon: "ti-users", label: "Aanwezigheid registreren", sub: "Training van vandaag", action: () => navigate("/Trainingen") },
            { icon: "ti-upload", label: "Foto uploaden", sub: "Team of the Week", action: () => setUploadModalOpen(true) },
            { icon: "ti-clipboard-list", label: "Beoordeling invullen", sub: `${totalRatingsNeeded - meting1Count} spelers wachten`, action: () => navigate("/PlayerRatingForm") },
            { icon: "ti-player-play", label: "Wedstrijd starten", sub: "Live modus activeren", action: () => navigate("/Wedstrijden") },
          ].map((item, i) => (
            <button key={i} onClick={item.action} style={{ display: "flex", gap: "8px", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", borderRadius: "10px", padding: "8px 10px", marginBottom: "6px", width: "100%", textAlign: "left", cursor: "pointer" }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: "14px", color: "#FF8C3A", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.70)", lineHeight: 1.2 }}>{item.label}</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2-KOLOMS GRID: Zelfreflecties + Seizoensresultaten ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>

        {/* Kolom 1: Zelfreflecties */}
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>Zelfreflecties deze week</p>
            <button onClick={() => navigate("/SelfReflection")} style={{ fontSize: "12px", color: "#FF8C3A" }}>Alle →</button>
          </div>
          {thisWeekReflections.length > 0 ? (
            <div>
              {thisWeekReflections.map((r, i) => {
                const player = activePlayers.find(p => p.id === r.player_id);
                const initials = player?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
                const avgScore = [r.goal_1_rating, r.goal_2_rating, r.goal_3_rating].filter(Boolean);
                const scoreAvg = avgScore.length > 0 ? (avgScore.reduce((a, b) => a + b, 0) / avgScore.length).toFixed(1) : null;
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 0", borderBottom: i < thisWeekReflections.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#FF8C3A" }}>{initials}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.80)", lineHeight: 1.2 }}>{player?.name || "–"}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", lineHeight: 1.4, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.general_notes || r.goal_1_notes || "Reflectie ingevuld"}</p>
                    </div>
                    {scoreAvg && <p style={{ fontSize: "13px", fontWeight: 700, color: "#FF8C3A", flexShrink: 0 }}>{scoreAvg}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 0" }}>
              <i className="ti ti-message-2" style={{ fontSize: "24px", color: "rgba(255,255,255,0.20)" }} />
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>Nog geen reflecties deze week</p>
            </div>
          )}
        </div>

      </div>

      <TrainerChampionsTrophy players={activePlayers} winningTeams={winningTeamPhotos} />

      {isTrainer && <PhotoUpload onSaved={() => refetchPhotos()} />}
      <PhotoTimeline photos={teamPhotos} />
    </div>
  );
}