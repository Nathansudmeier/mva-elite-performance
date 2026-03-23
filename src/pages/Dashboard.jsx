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
import TrainerGreetingPill from "../components/dashboard/TrainerGreetingPill";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import { format, subDays, isAfter } from "date-fns";
import NextMatchGrid from "../components/dashboard/NextMatchGrid";
import TrainerWeekReflectieCard from "../components/dashboard/TrainerWeekReflectieCard";
import { nl } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, isSpeelster, isTrainer, isLoading: authLoading } = useCurrentUser();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && isSpeelster) {
      navigate("/PlayerDashboard", { replace: true });
    }
  }, [isSpeelster, authLoading]);

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });
   const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list() });
   const { data: agendaItems = [] } = useQuery({ queryKey: ["agendaItems-all"], queryFn: () => base44.entities.AgendaItem.list("-date") });
   const { data: agendaAttendance = [] } = useQuery({ queryKey: ["agendaAttendance-all"], queryFn: () => base44.entities.AgendaAttendance.list() });
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

   // Agenda only: Training type items in last 4 weeks
   const recentAgendaTrainings = agendaItems.filter(ai => 
     ai.type === "Training" && isAfter(new Date(ai.date), last4WeeksAgo)
   );
   const recentAgendaTrainingAttendance = agendaAttendance.filter(aa => {
     const item = recentAgendaTrainings.find(ai => ai.id === aa.agenda_item_id);
     return item && (aa.status === "aanwezig" || aa.status === "afwezig");
   });

   const totalRecentTrainings = recentAgendaTrainings.length;

   // Calculate attendance: per player, per training date
   const playerAttendanceByDate = {};
   activePlayers.forEach(p => {
     playerAttendanceByDate[p.id] = {};
     recentAgendaTrainings.forEach(ai => {
       const att = recentAgendaTrainingAttendance.find(aa => aa.player_id === p.id && aa.agenda_item_id === ai.id);
       if (att?.status === "aanwezig") {
         playerAttendanceByDate[p.id][ai.date] = "present";
       }
     });
   });

   // Count total presence across all players and dates
   let totalPlayerDateSessions = 0;
   let totalPresentPlayerDateSessions = 0;
   Object.keys(playerAttendanceByDate).forEach(playerId => {
     recentAgendaTrainings.forEach(ai => {
       totalPlayerDateSessions++;
       if (playerAttendanceByDate[playerId][ai.date] === "present") {
         totalPresentPlayerDateSessions++;
       }
     });
   });

   const avgAttendancePercent = totalPlayerDateSessions > 0
     ? Math.round((totalPresentPlayerDateSessions / totalPlayerDateSessions) * 100)
     : 0;

  const allMatches = matches.sort((a, b) => new Date(a.date) - new Date(b.date));

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
  // Use Agenda data only
  const recentPlayerAttendanceCombined = {};
  activePlayers.forEach(p => {
    const dates = playerAttendanceByDate[p.id] || {};
    let present = 0;
    recentAgendaTrainings.forEach(ai => {
      if (dates[ai.date] === "present") {
        present++;
      }
    });
    recentPlayerAttendanceCombined[p.id] = totalRecentTrainings > 0 ? (present / totalRecentTrainings) * 100 : 100;
  });

   const lowAttendancePlayers = activePlayers
     .filter(p => recentPlayerAttendanceCombined[p.id] < 60)
     .map(p => ({ name: p.name, percentage: Math.round(recentPlayerAttendanceCombined[p.id]) }));

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
    <div className="pb-20 lg:pb-6 relative" style={{ zIndex: 2, display: "flex", flexDirection: "column", gap: "12px" }}>
      <DashboardBackground />
      {/* Trainer greeting */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem 0.5rem", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px", margin: 0 }}>
              {(() => {
                const hour = new Date().getHours();
                let greeting = "Goedemorgen";
                if (hour >= 12 && hour < 18) greeting = "Goedemiddag";
                if (hour >= 18) greeting = "Goedenavond";
                return greeting;
              })()}, {currentUser?.full_name?.split(" ")[0] || "Trainer"}
            </h2>
          </div>
          <div>
            <TrainerGreetingPill />
          </div>
        </div>
      </div>

      {/* ── HERO STAT (alle viewports) ── */}
      <div style={{ padding: "0 1.25rem 0.75rem", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "42px", fontWeight: 700, color: "#ffffff", letterSpacing: "-1.5px", lineHeight: 1 }}>{winPct}%</span>
          <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.50)", fontWeight: 400, verticalAlign: "middle" }}>winst</span>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.40)", marginTop: "4px", margin: "4px 0 0 0" }}>
          {wins} overwinningen · {draws} gelijk · {losses} verlies · Seizoen 2025-26
        </p>
      </div>

      {/* ── VOLGENDE WEDSTRIJDEN ── */}
      <NextMatchGrid matches={matches} agendaItems={agendaItems} playerId={null} />

      {/* ── 4-KOLOMS METRIC GRID (2-col op mobiel) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", overflow: "hidden", height: "auto" }} className="mobile-grid-2col">

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

      {/* ── 3-KOLOMS GRID (1-col op mobiel) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "10px", overflow: "hidden", height: "auto" }} className="mobile-grid-1col">

        {/* Kolom 1: Wedstrijden */}
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>Wedstrijden</p>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/Planning")} style={{ fontSize: "12px", color: "#FF8C3A" }}>Planning →</button>
            </div>
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
                const agendaMatch = agendaItems.find(ai => ai.match_id === m.id);
                return (
                 <button key={m.id} onClick={() => agendaMatch ? navigate(`/Planning?id=${agendaMatch.id}`) : navigate(`/Planning`)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < displayMatches.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none", background: "none", border: "none", width: "100%", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>{m.opponent}</p>
                        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", marginTop: "2px" }}>{format(new Date(m.date), "d MMM", { locale: nl })}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px", background: badgeBg, color: badgeColor }}>
                      {isPlanned ? "gepland" : result}
                    </span>
                  </button>
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
          {/* Desktop: verticale lijst */}
          <div className="desktop-only">
            {[
              { icon: "ti-users", label: "Aanwezigheid registreren", sub: "Training van vandaag", action: () => navigate("/Planning") },
              { icon: "ti-upload", label: "Foto uploaden", sub: "Team of the Week", action: () => setUploadModalOpen(true) },
              { icon: "ti-clipboard-list", label: "Beoordeling invullen", sub: `${totalRatingsNeeded - meting1Count} spelers wachten`, action: () => navigate("/PlayerRatingForm") },
              { icon: "ti-player-play", label: "Wedstrijd starten", sub: "Live modus activeren", action: () => {
                const nextWedstrijd = agendaItems.find(ai => ai.type === "Wedstrijd" && ai.date >= new Date().toISOString().split("T")[0]);
                if (nextWedstrijd) navigate(`/PlanningWedstrijdDetail?id=${nextWedstrijd.id}`);
                else navigate("/Planning");
              } },
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
          {/* Mobiel: 2x2 grid */}
          <div className="mobile-only">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px" }}>
              {[
                { icon: "ti-users", label: "Aanwezigheid", sub: "Vandaag", action: () => navigate("/Planning") },
                { icon: "ti-upload", label: "Foto", sub: "Team of Week", action: () => setUploadModalOpen(true) },
                { icon: "ti-clipboard-list", label: "Beoordeling", sub: `${totalRatingsNeeded - meting1Count} wachten`, action: () => navigate("/PlayerRatingForm") },
                { icon: "ti-player-play", label: "Wedstrijd", sub: "Live modus", action: () => {
                  const nextWedstrijd = agendaItems.find(ai => ai.type === "Wedstrijd" && ai.date >= new Date().toISOString().split("T")[0]);
                  if (nextWedstrijd) navigate(`/PlanningWedstrijdDetail?id=${nextWedstrijd.id}`);
                  else navigate("/Planning");
                } },
              ].map((item, i) => (
                <button key={i} onClick={item.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", borderRadius: "10px", padding: "12px 8px", cursor: "pointer", textAlign: "center" }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: "20px", color: "#FF8C3A", marginBottom: "6px" }} />
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.2 }}>{item.label}</p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{item.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-KOLOMS GRID: Zelfreflecties (+ Activiteit inplannen verplaatst) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", overflow: "hidden", height: "auto" }} className="mobile-grid-1col">

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

        {/* Kolom 2: Trainer weekreflectie */}
        <TrainerWeekReflectieCard />

      </div>

      {winningTeamPhotos?.length > 0 && <TrainerChampionsTrophy players={activePlayers} winningTeams={winningTeamPhotos} />}

      {isTrainer && <PhotoUpload onSaved={() => refetchPhotos()} />}
      {teamPhotos?.length > 0 && <PhotoTimeline photos={teamPhotos} />}

    </div>
  );
}