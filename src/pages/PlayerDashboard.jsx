import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Star } from "lucide-react";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import PlayerGreetingHeader from "../components/dashboard/PlayerGreetingHeader";
import PlayerMetricGrid from "../components/dashboard/PlayerMetricGrid";
import PlayerIOPGoals from "../components/dashboard/PlayerIOPGoals";
import AttendanceDots from "../components/dashboard/AttendanceDots";
import NextMatchGrid from "../components/dashboard/NextMatchGrid";
import PlayerTrophySection from "../components/dashboard/PlayerTrophySection";
import TodayTrainingCard from "../components/trainingsplanner/TodayTrainingCard";
import UpcomingActivitiesCompact from "../components/agenda/UpcomingActivitiesCompact";
import PlayerSeasonStats from "../components/stats/PlayerSeasonStats";
import LiveMatchBanner from "@/components/dashboard/LiveMatchBanner";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import PlayerAttendanceCard from "@/components/dashboard/PlayerAttendanceCard";
import PlayerMergedGreeting from "@/components/dashboard/PlayerMergedGreeting";
import DailyFeelingCheck from "@/components/dashboard/DailyFeelingCheck";
import { subDays, isAfter } from "date-fns";

const TECHNICAL = ["pass_kort", "pass_lang", "koppen", "scorend_vermogen", "duel_aanvallend", "duel_verdedigend", "balaanname"];
const TACTICAL = ["speelveld_groot", "omschakeling_balverlies", "speelveld_klein", "omschakeling_balbezit", "kijkgedrag"];
const PERSONALITY = ["winnaarsmentaliteit", "leergierig", "opkomst_trainingen", "komt_afspraken_na", "doorzetter"];
const PHYSICAL_R = ["startsnelheid", "snelheid_lang", "postuur", "blessuregevoeligheid", "duelkracht", "motorische_vaardigheden"];

const avg = (obj, keys) => {
  const vals = keys.map(k => obj[k]).filter(v => v != null && v > 0);
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
};

export default function PlayerDashboard() {
  const { user, playerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: liveMatches = [] } = useLiveMatches();

  const { data: player } = useQuery({
    queryKey: ["myPlayer", playerId],
    queryFn: () => base44.entities.Player.filter({ id: playerId }),
    enabled: !!playerId,
    select: d => d[0],
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["myRatings", playerId],
    queryFn: () => base44.entities.PlayerRating.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["myAttendance", playerId],
    queryFn: () => base44.entities.Attendance.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: agendaAttendance = [] } = useQuery({
    queryKey: ["agenda-attendance-player", playerId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: yoyo = [] } = useQuery({
    queryKey: ["myYoyo", playerId],
    queryFn: () => base44.entities.YoYoTest.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: physical = [] } = useQuery({
    queryKey: ["myPhysical", playerId],
    queryFn: () => base44.entities.PhysicalTest.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["allMatches"],
    queryFn: () => base44.entities.Match.list(),
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["allPlayers"],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: winningTeams = [] } = useQuery({
    queryKey: ["winningTeams"],
    queryFn: () => base44.entities.WinningTeam.list(),
  });



  const { data: agendaItems = [] } = useQuery({
    queryKey: ["agendaItems-all"],
    queryFn: () => base44.entities.AgendaItem.list(),
  });

  // Calculate attendance based on AgendaItem trainings
  const seasonStart = subDays(new Date(), 180); // Approximate season start (6 months)
  const allSeasonTrainings = agendaItems.filter(ai => 
    ai.type === "Training" && isAfter(new Date(ai.date), seasonStart)
  );
  const playerSeasonAttendance = agendaAttendance.filter(aa =>
    aa.player_id === playerId && aa.status === "aanwezig" && 
    allSeasonTrainings.find(ai => ai.id === aa.agenda_item_id)
  );
  const attendancePercentage = allSeasonTrainings.length > 0
    ? (playerSeasonAttendance.length / allSeasonTrainings.length) * 100
    : 0;
  const totalSeasonTrainings = allSeasonTrainings.length;

  const radarData = ["Meting 1", "Meting 2", "Meting 3"].map(m => {
    const r = ratings.find(x => x.meting === m);
    if (!r) return null;
    return {
      meting: m,
      Technisch: avg(r, TECHNICAL),
      Tactisch: avg(r, TACTICAL),
      Persoonlijkheid: avg(r, PERSONALITY),
      Fysiek: avg(r, PHYSICAL_R),
    };
  }).filter(Boolean);

  const chartData = [
    { subject: "Technisch", ...Object.fromEntries(radarData.map(r => [r.meting, r.Technisch])) },
    { subject: "Tactisch", ...Object.fromEntries(radarData.map(r => [r.meting, r.Tactisch])) },
    { subject: "Persoonlijk", ...Object.fromEntries(radarData.map(r => [r.meting, r.Persoonlijkheid])) },
    { subject: "Fysiek", ...Object.fromEntries(radarData.map(r => [r.meting, r.Fysiek])) },
  ];

  const COLORS = ["#FF6B00", "#1A1A1A", "#E55A00"];

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <Star size={40} className="text-[#E8E6E1]" />
        <p className="text-[#1A1A1A] font-500">Jouw account is nog niet gekoppeld aan een spelersprofiel.</p>
        <p className="text-[#888888] text-sm">Vraag de trainer om dit in te stellen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PlayerMergedGreeting
        player={player}
        attendance={attendance}
        ratings={ratings}
        yoyo={yoyo}
      />
      <LiveMatchBanner liveMatches={liveMatches} isTrainer={false} />

      {/* Upcoming Activities Compact */}
      <UpcomingActivitiesCompact playerId={playerId} />

      {/* Daily Feeling Check - Only on training days */}
      <DailyFeelingCheck playerId={playerId} agendaItems={agendaItems} />

      {/* Attendance Card */}
      <PlayerAttendanceCard 
        percentage={attendancePercentage} 
        present={playerSeasonAttendance.length} 
        total={totalSeasonTrainings} 
      />

      {/* Today Training Card */}
      <TodayTrainingCard playerId={playerId} />

      {/* Next Matches */}
      <NextMatchGrid matches={matches} playerId={playerId} />

      {/* IOP Goals */}
      <PlayerIOPGoals player={player} />

      {/* Champions Trophy */}
      <PlayerTrophySection players={allPlayers} winningTeams={winningTeams} currentPlayerId={playerId} />

    </div>
  );
}