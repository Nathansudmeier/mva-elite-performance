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
import LiveMatchBanner from "@/components/dashboard/LiveMatchBanner";
import { useLiveMatches } from "@/hooks/useLiveMatches";


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
  const { data: teamPhotos = [], refetch: refetchPhotos } = useQuery({ queryKey: ["teamPhotos"], queryFn: () => base44.entities.TeamPhoto.list("-date") });


  const activePlayers = players.filter((p) => p.active !== false);

  // === BLOK 1: QUICK STATS ===
   const last4WeeksAgo = subDays(new Date(), 28);
   const today = new Date().toISOString().split("T")[0];

   // Agenda only: Training type items in last 4 weeks (from past to now)
   const recentAgendaTrainings = agendaItems.filter(ai => 
     ai.type === "Training" && isAfter(new Date(ai.date), last4WeeksAgo) && ai.date <= today
   );
   const recentAgendaTrainingAttendance = agendaAttendance.filter(aa => {
     const item = recentAgendaTrainings.find(ai => ai.id === aa.agenda_item_id);
     return item && aa.status !== undefined && aa.status !== null;
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
    recentPlayerAttendanceCombined[p.id] = totalRecentTrainings > 0 ? (present / totalRecentTrainings) * 100 : 0;
  });

   const lowAttendancePlayers = activePlayers
     .filter(p => {
       const attendance = recentPlayerAttendanceCombined[p.id];
       return attendance > 0 && attendance < 60;
     })
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
    <div className="pb-20 lg:pb-6" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <LiveMatchBanner liveMatches={liveMatches} isTrainer={isTrainer} />

      {/* Hero card — winratio */}
      <div style={{ background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", minHeight: "120px" }}>
        <div>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Seizoen 2025-26</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "42px", fontWeight: 900, color: "#ffffff", letterSpacing: "-2px", lineHeight: 1 }}>{winPct}%</span>
            <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>winst</span>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "4px" }}>
            {wins}W · {draws}G · {losses}V
          </p>
        </div>
        <div>
          <TrainerGreetingPill />
        </div>
      </div>

      {/* ── VOLGENDE WEDSTRIJDEN ── */}
      <NextMatchGrid matches={matches} agendaItems={agendaItems} playerId={null} />

      {/* ── 4-KOLOMS METRIC GRID (2-col op mobiel) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }} className="mobile-grid-2col">

        {/* Card 1: Aanwezigheid */}
        <div style={{ background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Aanwezigheid (4w)</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginTop: "6px", letterSpacing: "-2px" }}>{avgAttendancePercent}%</p>
          <div style={{ height: "4px", background: "rgba(26,26,26,0.15)", borderRadius: "2px", marginTop: "8px" }}>
            <div style={{ height: "100%", width: `${avgAttendancePercent}%`, background: "rgba(26,26,26,0.50)", borderRadius: "2px" }} />
          </div>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", marginTop: "6px" }}>{activePlayers.length} spelers</p>
        </div>

        {/* Card 2: Yo-Yo */}
        <div style={{ background: "#00C2FF", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Yo-Yo niveau</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginTop: "6px", letterSpacing: "-2px" }}>{avgLatestYoyo}</p>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", marginTop: "8px" }}>
            {yoyoDiff ? (parseFloat(yoyoDiff) >= 0 ? `+${yoyoDiff} ↑` : `${yoyoDiff} ↓`) : "stabiel"}
          </p>
        </div>

        {/* Card 3: Sprint */}
        <div style={{ background: "#00C2FF", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", letterSpacing: "0.10em" }}>30m sprint</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "3px", marginTop: "6px" }}>
            <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, letterSpacing: "-2px" }}>{avgLatestSprint}</p>
            <span style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)", fontWeight: 700 }}>s</span>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", marginTop: "8px" }}>gemiddeld</p>
        </div>

        {/* Card 4: Beoordelingen */}
        <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Beoordelingen</p>
          <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginTop: "6px", letterSpacing: "-2px" }}>{meting1Count}/{totalRatingsNeeded}</p>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", marginTop: "8px" }}>meting 1 lopend</p>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "10px" }} className="mobile-grid-1col">

        {/* Kolom 1: Wedstrijden */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>Wedstrijden</p>
            <button onClick={() => navigate("/Planning")} style={{ fontSize: "12px", color: "#FF6800", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Planning →</button>
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
                 <button key={m.id} onClick={() => agendaMatch ? navigate(`/Planning?id=${agendaMatch.id}`) : navigate(`/Planning`)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < displayMatches.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none", background: "none", border: "none", width: "100%", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                       <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                       <div style={{ textAlign: "left" }}>
                         <p style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{m.opponent}</p>
                         <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.40)", marginTop: "2px" }}>{format(new Date(m.date), "d MMM", { locale: nl })}</p>
                       </div>
                     </div>
                     <span style={{ fontSize: "10px", fontWeight: 800, padding: "3px 9px", borderRadius: "20px", background: badgeBg, color: badgeColor, border: `1.5px solid ${badgeColor}` }}>
                       {isPlanned ? "gepland" : result}
                     </span>
                   </button>
                );
              });
            })()}
          </div>
        </div>

        {/* Kolom 2: Seizoensresultaten */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a", marginBottom: "10px" }}>Seizoensresultaten</p>
          <button onClick={() => navigate("/MatchResults")} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
              <span style={{ fontSize: "34px", fontWeight: 900, color: "#FF6800", lineHeight: 1, letterSpacing: "-2px" }}>{winPct}%</span>
              <span style={{ fontSize: "13px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>winst</span>
            </div>
          </button>
          <div style={{ height: "4px", background: "rgba(26,26,26,0.10)", borderRadius: "2px", marginBottom: "14px" }}>
            <div style={{ height: "100%", width: `${winPct}%`, background: "#FF6800", borderRadius: "2px" }} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ flex: 1, textAlign: "center", background: "rgba(8,208,104,0.10)", border: "1.5px solid rgba(8,208,104,0.25)", borderRadius: "12px", padding: "8px 6px" }}>
              <p style={{ fontSize: "20px", fontWeight: 900, color: "#05a050", lineHeight: 1, letterSpacing: "-1px" }}>{wins}</p>
              <p style={{ fontSize: "8px", color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "3px", fontWeight: 800 }}>WINST</p>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: "rgba(255,214,0,0.15)", border: "1.5px solid rgba(255,214,0,0.35)", borderRadius: "12px", padding: "8px 6px" }}>
              <p style={{ fontSize: "20px", fontWeight: 900, color: "#cc9900", lineHeight: 1, letterSpacing: "-1px" }}>{draws}</p>
              <p style={{ fontSize: "8px", color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "3px", fontWeight: 800 }}>GELIJK</p>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: "rgba(255,61,168,0.10)", border: "1.5px solid rgba(255,61,168,0.25)", borderRadius: "12px", padding: "8px 6px" }}>
              <p style={{ fontSize: "20px", fontWeight: 900, color: "#FF3DA8", lineHeight: 1, letterSpacing: "-1px" }}>{losses}</p>
              <p style={{ fontSize: "8px", color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "3px", fontWeight: 800 }}>VERLIES</p>
            </div>
          </div>
        </div>

        {/* Kolom 3: Snelle acties */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", marginBottom: "10px", letterSpacing: "0.10em" }}>Snelle acties</p>
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
              <button key={i} onClick={item.action} style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(26,26,26,0.04)", border: "1px solid rgba(26,26,26,0.10)", borderRadius: "12px", padding: "9px 12px", marginBottom: "6px", width: "100%", textAlign: "left", cursor: "pointer" }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: "16px", color: "#FF6800", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "12px", color: "#1a1a1a", lineHeight: 1.2, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.40)", marginTop: "2px" }}>{item.sub}</p>
                </div>
              </button>
            ))}
          </div>
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
                <button key={i} onClick={item.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(26,26,26,0.04)", border: "1px solid rgba(26,26,26,0.10)", borderRadius: "12px", padding: "12px 8px", cursor: "pointer", textAlign: "center" }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: "20px", color: "#FF6800", marginBottom: "6px" }} />
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{item.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-KOLOMS GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="mobile-grid-1col">

        {/* Kolom 1: Zelfreflecties */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>Zelfreflecties</p>
            <button onClick={() => navigate("/SelfReflection")} style={{ fontSize: "12px", color: "#FF6800", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Alle →</button>
          </div>

          {thisWeekReflections.length > 0 ? (
            <div>
              {thisWeekReflections.map((r, i) => {
                const player = activePlayers.find(p => p.id === r.player_id);
                const initials = player?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
                const avgScore = [r.goal_1_rating, r.goal_2_rating, r.goal_3_rating].filter(Boolean);
                const scoreAvg = avgScore.length > 0 ? (avgScore.reduce((a, b) => a + b, 0) / avgScore.length).toFixed(1) : null;
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 0", borderBottom: i < thisWeekReflections.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,104,0,0.10)", border: "1.5px solid rgba(255,104,0,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "#FF6800" }}>{initials}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{player?.name || "–"}</p>
                      <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", lineHeight: 1.4, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.general_notes || r.goal_1_notes || "Reflectie ingevuld"}</p>
                    </div>
                    {scoreAvg && <p style={{ fontSize: "13px", fontWeight: 900, color: "#FF6800", flexShrink: 0 }}>{scoreAvg}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
              <i className="ti ti-message-2" style={{ fontSize: "24px", color: "rgba(26,26,26,0.18)" }} />
              <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.35)", marginTop: "8px" }}>Nog geen reflecties deze week</p>
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