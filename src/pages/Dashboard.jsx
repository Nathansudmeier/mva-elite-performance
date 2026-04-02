import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import MatchDayBanner from "@/components/checkin/MatchDayBanner";
import TrainerChampionsTrophy from "../components/dashboard/TrainerChampionsTrophy";
import WinningTeamUpload from "../components/dashboard/WinningTeamUpload";
import TrainerGreetingPill from "../components/dashboard/TrainerGreetingPill";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import { format, subDays, isAfter } from "date-fns";
import NextMatchGrid from "../components/dashboard/NextMatchGrid";
import TodayActivityCard from "../components/dashboard/TodayActivityCard";
import TrainerWeekReflectieCard from "../components/dashboard/TrainerWeekReflectieCard";
import { nl } from "date-fns/locale";
import LiveMatchBanner from "@/components/dashboard/LiveMatchBanner";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import GreetingWithEmvi from "@/components/dashboard/GreetingWithEmvi";
import DailyFeelingOverview from "@/components/dashboard/DailyFeelingOverview";
import UrgenteBanners from "@/components/prikbord/UrgenteBanners";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, isSpeelster, isTrainer, isLoading: authLoading } = useCurrentUser();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { data: liveMatches = [] } = useLiveMatches();

  useEffect(() => {
    if (!authLoading && isSpeelster) {
      navigate("/PlayerDashboard", { replace: true });
    }
  }, [isSpeelster, authLoading]);

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: agendaItems = [] } = useQuery({ queryKey: ["agendaItems-all"], queryFn: () => base44.entities.AgendaItem.list("-date") });
  const { data: agendaAttendance = [] } = useQuery({ queryKey: ["agendaAttendance-all"], queryFn: () => base44.entities.AgendaAttendance.list() });
  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-date") });
  const { data: winningTeamPhotos = [] } = useQuery({ queryKey: ["winningTeamPhotos"], queryFn: () => base44.entities.WinningTeam.list() });
  const { data: yoyoTests = [] } = useQuery({ queryKey: ["yoyoTests"], queryFn: () => base44.entities.YoYoTest.list("-date") });
  const { data: physicalTests = [] } = useQuery({ queryKey: ["physicalTests"], queryFn: () => base44.entities.PhysicalTest.list("-date") });
  const { data: playerRatings = [] } = useQuery({ queryKey: ["playerRatings"], queryFn: () => base44.entities.PlayerRating.list("-date") });
  const { data: wellnessLogs = [] } = useQuery({ queryKey: ["wellnessLogs"], queryFn: () => base44.entities.WellnessLog.list("-date") });
  const { data: selfReflections = [] } = useQuery({ queryKey: ["selfReflections"], queryFn: () => base44.entities.SelfReflection.list("-date") });
  const { data: teamPhotos = [] } = useQuery({ queryKey: ["teamPhotos"], queryFn: () => base44.entities.TeamPhoto.list("-date") });


  const activePlayers = players.filter((p) => p.active !== false);

  // === BLOK 1: QUICK STATS ===
  const last4WeeksAgo = subDays(new Date(), 28);
  const today = new Date().toISOString().split("T")[0];

  // Agenda only: Training type items in last 4 weeks (from past to now)
  const recentAgendaTrainings = agendaItems.filter((ai) =>
  ai.type === "Training" && isAfter(new Date(ai.date), last4WeeksAgo) && ai.date <= today
  );
  const recentAgendaTrainingAttendance = agendaAttendance.filter((aa) => {
    const item = recentAgendaTrainings.find((ai) => ai.id === aa.agenda_item_id);
    return item && aa.status !== undefined && aa.status !== null;
  });

  const totalRecentTrainings = recentAgendaTrainings.length;

  // Calculate attendance: per player, per training date
  const playerAttendanceByDate = {};
  activePlayers.forEach((p) => {
    playerAttendanceByDate[p.id] = {};
    recentAgendaTrainings.forEach((ai) => {
      const att = recentAgendaTrainingAttendance.find((aa) => aa.player_id === p.id && aa.agenda_item_id === ai.id);
      if (att?.status === "aanwezig") {
        playerAttendanceByDate[p.id][ai.date] = "present";
      }
    });
  });

  // Count total presence across all players and dates
  let totalPlayerDateSessions = 0;
  let totalPresentPlayerDateSessions = 0;
  Object.keys(playerAttendanceByDate).forEach((playerId) => {
    recentAgendaTrainings.forEach((ai) => {
      totalPlayerDateSessions++;
      if (playerAttendanceByDate[playerId][ai.date] === "present") {
        totalPresentPlayerDateSessions++;
      }
    });
  });

  const avgAttendancePercent = totalPlayerDateSessions > 0 ?
  Math.round(totalPresentPlayerDateSessions / totalPlayerDateSessions * 100) :
  0;

  const allMatches = matches.sort((a, b) => new Date(a.date) - new Date(b.date));

  const teamPlayers = activePlayers;
  const meting1Count = playerRatings.filter((r) => r.meting === "Meting 1").length;
  const meting2Count = playerRatings.filter((r) => r.meting === "Meting 2").length;
  const meting3Count = playerRatings.filter((r) => r.meting === "Meting 3").length;
  const totalRatingsNeeded = teamPlayers.length;

  // === WIN/LOSS STATS ===
  const playedMatches = matches.filter((m) => m.score_home !== undefined && m.score_away !== undefined && m.score_home !== null && m.score_away !== null);
  const wins = playedMatches.filter((m) => m.home_away === "Thuis" ? m.score_home > m.score_away : m.score_away > m.score_home).length;
  const losses = playedMatches.filter((m) => m.home_away === "Thuis" ? m.score_home < m.score_away : m.score_away < m.score_home).length;
  const draws = playedMatches.filter((m) => m.score_home === m.score_away).length;
  const winPct = playedMatches.length > 0 ? Math.round(wins / playedMatches.length * 100) : 0;

  // === BLOK 2: ALERTS ===
  // Use Agenda data only
  const recentPlayerAttendanceCombined = {};
  activePlayers.forEach((p) => {
    const dates = playerAttendanceByDate[p.id] || {};
    let present = 0;
    recentAgendaTrainings.forEach((ai) => {
      if (dates[ai.date] === "present") {
        present++;
      }
    });
    recentPlayerAttendanceCombined[p.id] = totalRecentTrainings > 0 ? present / totalRecentTrainings * 100 : 0;
  });

  const lowAttendancePlayers = activePlayers.
  filter((p) => {
    const attendance = recentPlayerAttendanceCombined[p.id];
    return attendance > 0 && attendance < 60;
  }).
  map((p) => ({ name: p.name, percentage: Math.round(recentPlayerAttendanceCombined[p.id]) }));

  const last7Days = subDays(new Date(), 7);
  const recentWellnessLogs = wellnessLogs.filter((w) => isAfter(new Date(w.date), last7Days));
  const fatigueOrPainPlayers = activePlayers.
  filter((p) => {
    const logs = recentWellnessLogs.filter((w) => w.player_id === p.id);
    return logs.some((l) => l.fatigue >= 4 || l.muscle_pain >= 4);
  }).
  map((p) => p.name);

  // === BLOK 3: CHAMPIONS TROPHY TOP 5 ===
  const playerWinCounts = {};
  activePlayers.forEach((p) => {
    playerWinCounts[p.id] = winningTeamPhotos.filter((w) => w.winning_player_ids?.includes(p.id)).length;
  });
  const topWinners = activePlayers.
  map((p) => ({ id: p.id, name: p.name, wins: playerWinCounts[p.id] || 0, total: winningTeamPhotos.length })).
  sort((a, b) => b.wins - a.wins).
  slice(0, 5);

  // === BLOK 4: GROEPSFYSIEK ===
  const teamYoyoTests = yoyoTests.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestYoyoDate = teamYoyoTests.length > 0 ? teamYoyoTests[0].date : null;
  const previousYoyoDate = teamYoyoTests.length > 1 ? teamYoyoTests.slice(1).find((t) => t.date !== latestYoyoDate)?.date : null;

  const latestYoyoLevels = teamYoyoTests.filter((t) => t.date === latestYoyoDate).map((t) => parseFloat(t.level || 0));
  const previousYoyoLevels = previousYoyoDate ? teamYoyoTests.filter((t) => t.date === previousYoyoDate).map((t) => parseFloat(t.level || 0)) : [];

  const avgLatestYoyo = latestYoyoLevels.length > 0 ? (latestYoyoLevels.reduce((a, b) => a + b, 0) / latestYoyoLevels.length).toFixed(1) : "–";
  const avgPreviousYoyo = previousYoyoLevels.length > 0 ? (previousYoyoLevels.reduce((a, b) => a + b, 0) / previousYoyoLevels.length).toFixed(1) : null;
  const yoyoDiff = avgPreviousYoyo ? (parseFloat(avgLatestYoyo) - parseFloat(avgPreviousYoyo)).toFixed(2) : null;

  const teamSprintTests = physicalTests.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestSprintDate = teamSprintTests.length > 0 ? teamSprintTests[0].date : null;
  const previousSprintDate = teamSprintTests.length > 1 ? teamSprintTests.slice(1).find((t) => t.date !== latestSprintDate)?.date : null;

  const latestSprints = teamSprintTests.filter((t) => t.date === latestSprintDate && t.sprint_30m).map((t) => t.sprint_30m);
  const previousSprints = previousSprintDate ? teamSprintTests.filter((t) => t.date === previousSprintDate && t.sprint_30m).map((t) => t.sprint_30m) : [];

  const avgLatestSprint = latestSprints.length > 0 ? (latestSprints.reduce((a, b) => a + b, 0) / latestSprints.length).toFixed(2) : "–";
  const avgPreviousSprint = previousSprints.length > 0 ? (previousSprints.reduce((a, b) => a + b, 0) / previousSprints.length).toFixed(2) : null;
  const sprintDiff = avgPreviousSprint ? (parseFloat(avgLatestSprint) - parseFloat(avgPreviousSprint)).toFixed(2) : null;

  // === BLOK 5: RECENTE WEDSTRIJDEN ===
  const recentMatches = allMatches.slice(-3).reverse();

  // === BLOK 6: ZELFREFLECTIES DEZE WEEK ===
  const thisWeekReflections = selfReflections.
  filter((r) => isAfter(new Date(r.date), last7Days)).
  slice(0, 3);

  return (
    <div className="pb-20 lg:pb-6" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <GreetingWithEmvi />
      <UrgenteBanners />
      <LiveMatchBanner liveMatches={liveMatches} isTrainer={isTrainer} />

      {/* ── SNELLE ACTIES (mobiel-vriendelijk) ── */}
      <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
        <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", marginBottom: "12px", letterSpacing: "0.10em" }}>Snelle acties</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }} className="mobile-grid-2col">
          {[
          { icon: "ti-users", label: "Aanwezigheid", sub: "Training vandaag", action: () => navigate("/Planning") },
          { icon: "ti-upload", label: "Team foto", sub: "Team of the Week", action: () => setUploadModalOpen(true) },
          { icon: "ti-clipboard-list", label: "Beoordeling", sub: `${totalRatingsNeeded - meting1Count} wachten`, action: () => navigate("/PlayerRatingForm") },
          { icon: "ti-player-play", label: "Wedstrijd", sub: "Live modus", action: () => {
              const nextWedstrijd = agendaItems.find((ai) => ai.type === "Wedstrijd" && ai.date >= new Date().toISOString().split("T")[0]);
              if (nextWedstrijd) navigate(`/PlanningWedstrijdDetail?id=${nextWedstrijd.id}`);else
              navigate("/Planning");
            } }].
          map((item, i) =>
          <button key={i} onClick={item.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(26,26,26,0.08)", border: "2px solid rgba(26,26,26,0.15)", borderRadius: "14px", padding: "14px 8px", cursor: "pointer", textAlign: "center", gap: "6px", transition: "all 0.15s" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: "18px", color: "#ffffff" }} />
              </div>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>{item.label}</p>
              <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.55)", lineHeight: 1.2 }}>{item.sub}</p>
            </button>
          )}
        </div>
      </div>

      {/* Hero card — winratio */}
      <div style={{ background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem", position: "relative", overflow: "hidden", minHeight: "120px" }} className="bg-[#ffd500] text-gray-50">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Seizoen 2025-26</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "42px", fontWeight: 900, color: "#ffffff", letterSpacing: "-2px", lineHeight: 1 }}>{winPct}%</span>
              <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>winst</span>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.70)", marginTop: "4px", fontWeight: 600 }}>
              {wins} gewonnen · {draws} gelijk · {losses} verloren
            </p>
          </div>
          <TrainerGreetingPill />
        </div>
        {/* Progress bar */}
        <div style={{ height: "4px", background: "rgba(255,255,255,0.20)", borderRadius: "2px", marginTop: "14px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${winPct}%`, background: "rgba(255,255,255,0.80)", borderRadius: "2px", transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* ── VOLGENDE WEDSTRIJDEN ── */}
      <NextMatchGrid matches={matches} agendaItems={agendaItems} playerId={null} />

      {/* Daily Feeling Overview */}
      <DailyFeelingOverview />

      {/* ── 4-KOLOMS METRIC GRID (2-col op mobiel) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }} className="mobile-grid-2col">

        {/* Card 1: Aanwezigheid → /Attendance */}
        <button
          onClick={() => navigate("/Attendance")}
          style={{ background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", textAlign: "left", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = "";e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a";}}
          onMouseDown={(e) => {e.currentTarget.style.transform = "translate(2px, 2px)";e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a";}}
          onMouseUp={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}>
          
          <p className="t-label" style={{ color: "rgba(26,26,26,0.65)" }}>Aanwezigheid (4w)</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginTop: "8px", letterSpacing: "-2px" }}>{avgAttendancePercent}%</p>
          <div style={{ height: "4px", background: "rgba(26,26,26,0.15)", borderRadius: "2px", marginTop: "10px" }}>
            <div style={{ height: "100%", width: `${avgAttendancePercent}%`, background: "rgba(26,26,26,0.45)", borderRadius: "2px" }} />
          </div>
          <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.65)", marginTop: "8px", fontWeight: 600 }}>{activePlayers.length} spelers</p>
        </button>

        {/* Card 2: Yo-Yo → /PhysicalMonitor */}
        <button
          onClick={() => navigate("/PhysicalMonitor")}
          style={{ background: "#00C2FF", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", textAlign: "left", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = "";e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a";}}
          onMouseDown={(e) => {e.currentTarget.style.transform = "translate(2px, 2px)";e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a";}}
          onMouseUp={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}>
          
          <p className="t-label" style={{ color: "rgba(26,26,26,0.65)" }}>Yo-Yo niveau</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginTop: "8px", letterSpacing: "-2px" }}>{avgLatestYoyo}</p>
          <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.65)", marginTop: "10px", fontWeight: 600 }}>
            {yoyoDiff ? parseFloat(yoyoDiff) >= 0 ? `↑ +${yoyoDiff}` : `↓ ${yoyoDiff}` : "stabiel"}
          </p>
        </button>

        {/* Card 3: Sprint → /PhysicalMonitor */}
        <button
          onClick={() => navigate("/PhysicalMonitor")}
          style={{ background: "#9B5CFF", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", textAlign: "left", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = "";e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a";}}
          onMouseDown={(e) => {e.currentTarget.style.transform = "translate(2px, 2px)";e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a";}}
          onMouseUp={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}>
          
          <p className="t-label" style={{ color: "rgba(255,255,255,0.65)" }}>30m sprint</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "3px", marginTop: "8px" }}>
            <p style={{ fontSize: "34px", fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-2px" }}>{avgLatestSprint}</p>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>s</span>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "10px", fontWeight: 600 }}>gemiddeld</p>
        </button>

        {/* Card 4: Beoordelingen → /PlayerRatingForm */}
        <button
          onClick={() => navigate("/PlayerRatingForm")}
          style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", textAlign: "left", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = "";e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a";}}
          onMouseDown={(e) => {e.currentTarget.style.transform = "translate(2px, 2px)";e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a";}}
          onMouseUp={(e) => {e.currentTarget.style.transform = "translateY(-2px)";e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a";}}>
          
          <p className="t-label" style={{ color: "rgba(26,26,26,0.65)" }}>Beoordelingen</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginTop: "8px", letterSpacing: "-2px" }}>{meting1Count}<span style={{ fontSize: "18px", opacity: 0.5 }}>/{totalRatingsNeeded}</span></p>
          <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.65)", marginTop: "10px", fontWeight: 600 }}>meting 1 lopend</p>
        </button>
      </div>



      {uploadModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(26,26,26,0.40)", overflowY: "auto" }}>
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "4px 4px 0 #1a1a1a", padding: "1.5rem", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto", margin: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Team of the Week</h2>
              <button onClick={() => setUploadModalOpen(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#1a1a1a", padding: 0, width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <WinningTeamUpload players={activePlayers} onSaved={() => {queryClient.invalidateQueries({ queryKey: ["winningTeamPhotos"] });setUploadModalOpen(false);}} />
            <button onClick={() => setUploadModalOpen(false)} className="btn-primary" style={{ marginTop: "16px", width: "100%" }}>
              Sluiten
            </button>
          </div>
        </div>
      }

      {/* ── WEDSTRIJDEN + SEIZOENSRESULTATEN ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="mobile-grid-1col">

        {/* Wedstrijden */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>Recente wedstrijden</p>
            <button onClick={() => navigate("/Planning")} style={{ fontSize: "12px", color: "#FF6800", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Planning →</button>
          </div>
          <div>
            {(() => {
              const displayMatches = allMatches.slice(-4).reverse();
              if (displayMatches.length === 0) return (
                <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.35)", padding: "12px 0" }}>Nog geen wedstrijden</p>);

              return displayMatches.map((m, i) => {
                const hasScore = m.score_home !== null && m.score_away !== null && m.score_home !== undefined && m.score_away !== undefined;
                let result = "gepland";
                let badgeBg = "rgba(96,165,250,0.12)";
                let badgeColor = "#60a5fa";
                let dotColor = "#60a5fa";
                if (hasScore) {
                  const isWin = m.home_away === "Thuis" ? m.score_home > m.score_away : m.score_away > m.score_home;
                  const isDraw = m.score_home === m.score_away;
                  result = isWin ? "W" : isDraw ? "G" : "V";
                  dotColor = isWin ? "#08D068" : isDraw ? "#FFD600" : "#FF3DA8";
                  badgeBg = isWin ? "rgba(8,208,104,0.12)" : isDraw ? "rgba(255,214,0,0.15)" : "rgba(255,61,168,0.10)";
                  badgeColor = isWin ? "#05a050" : isDraw ? "#cc9900" : "#FF3DA8";
                }
                const agendaMatch = agendaItems.find((ai) => ai.match_id === m.id);
                return (
                  <button key={m.id} onClick={() => agendaMatch ? navigate(`/Planning?id=${agendaMatch.id}`) : navigate(`/Planning`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < displayMatches.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none", background: "none", border: "none", width: "100%", cursor: "pointer", borderBottom: i < displayMatches.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, border: "1.5px solid #1a1a1a", flexShrink: 0 }} />
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{m.opponent}</p>
                        <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", marginTop: "2px" }}>{format(new Date(m.date), "d MMM", { locale: nl })} · {m.home_away}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "20px", background: badgeBg, color: badgeColor, border: `1.5px solid ${badgeColor}`, flexShrink: 0 }}>
                      {result}
                    </span>
                  </button>);

              });
            })()}
          </div>
        </div>

        {/* Training of wedstrijd vandaag */}
        <TodayActivityCard agendaItems={agendaItems} matches={matches} players={activePlayers} />
      </div>

      {/* ── ZELFREFLECTIES + WEEKREFLECTIE ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="mobile-grid-1col">

        {/* Zelfreflecties */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>Zelfreflecties</p>
            <button onClick={() => navigate("/SelfReflection")} style={{ fontSize: "12px", color: "#FF6800", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Alle →</button>
          </div>

          {thisWeekReflections.length > 0 ?
          <div>
              {thisWeekReflections.map((r, i) => {
              const player = activePlayers.find((p) => p.id === r.player_id);
              const initials = player?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
              const avgScore = [r.goal_1_rating, r.goal_2_rating, r.goal_3_rating].filter(Boolean);
              const scoreAvg = avgScore.length > 0 ? (avgScore.reduce((a, b) => a + b, 0) / avgScore.length).toFixed(1) : null;
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: i < thisWeekReflections.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#ffffff" }}>{initials}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{player?.name || "–"}</p>
                      <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", lineHeight: 1.4, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.general_notes || r.goal_1_notes || "Reflectie ingevuld"}</p>
                    </div>
                    {scoreAvg &&
                  <div style={{ background: "#FF6800", border: "1.5px solid #1a1a1a", borderRadius: "8px", padding: "3px 8px", flexShrink: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 900, color: "#ffffff" }}>{scoreAvg}</p>
                      </div>
                  }
                  </div>);

            })}
            </div> :

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
              <i className="ti ti-message-2" style={{ fontSize: "28px", color: "rgba(26,26,26,0.15)" }} />
              <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.35)", marginTop: "10px", fontWeight: 600 }}>Nog geen reflecties deze week</p>
            </div>
          }
        </div>

        {/* Trainer weekreflectie */}
        <TrainerWeekReflectieCard />

      </div>

      {winningTeamPhotos?.length > 0 && <TrainerChampionsTrophy players={activePlayers} winningTeams={winningTeamPhotos} />}



    </div>);

}