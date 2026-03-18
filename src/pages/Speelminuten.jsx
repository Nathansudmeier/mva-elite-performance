import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcPlayerSeasonStats } from "@/utils/calculateMinutes";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, AlertTriangle, Users } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

function TeamFilter({ value, onChange }) {
  const options = [
    { label: "Alle wedstrijden", value: "all" },
    { label: "MO17", value: "MO17" },
    { label: "Dames 1", value: "Dames 1" },
  ];
  return (
    <div className="flex gap-2">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            value === o.value
              ? "bg-[#FF6B00] text-white"
              : "bg-white text-[#888888] border border-[#E8E6E1] hover:border-[#FF6B00] hover:text-[#FF6B00]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Speelminuten() {
  const [teamFilter, setTeamFilter] = useState("all");
  const { isTrainer, user: currentUser, playerId: myPlayerId } = useCurrentUser();
  const isReadOnly = !isTrainer && currentUser?.role !== "admin";

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const activePlayers = players.filter(p => p.active !== false);
  const finishedCount = matches.filter(m => m.live_status === "finished" && (teamFilter === "all" || m.team === teamFilter)).length;

  const playerStats = activePlayers
    .map(player => ({
      player,
      stats: calcPlayerSeasonStats(matches, player.id, teamFilter),
    }))
    .filter(({ stats }) => stats.availableMinutes > 0 || stats.totalMinutes > 0)
    .sort((a, b) => b.stats.totalMinutes - a.stats.totalMinutes);

  const maxMinutes = playerStats[0]?.stats.totalMinutes || 1;
  const attentionCount = playerStats.filter(p => p.stats.isAttentionPoint).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#E8E6E1] border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["trainer", "admin"]}>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/Players" className="p-2 rounded-xl bg-white border border-[#E8E6E1] hover:bg-[#F7F5F2]">
            <ArrowLeft size={18} className="text-[#1A1A1A]" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-500 text-[#1A1A1A] flex items-center gap-2">
              <Clock size={22} className="text-[#FF6B00]" /> Speelminuten Overzicht
            </h1>
            <p className="text-sm text-[#888888]">{finishedCount} gespeelde wedstrijd{finishedCount !== 1 ? "en" : ""}</p>
          </div>
        </div>

        {/* Filter */}
        <TeamFilter value={teamFilter} onChange={setTeamFilter} />

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm text-center">
            <div className="text-2xl font-500 text-[#FF6B00]">{playerStats.length}</div>
            <div className="text-xs text-[#888888] mt-0.5">Speelsters</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm text-center">
            <div className="text-2xl font-500 text-[#FF6B00]">{finishedCount}</div>
            <div className="text-xs text-[#888888] mt-0.5">Wedstrijden</div>
          </div>
          <div className={`rounded-2xl p-4 border shadow-sm text-center ${attentionCount > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-[#E8E6E1]"}`}>
            <div className={`text-2xl font-500 ${attentionCount > 0 ? "text-amber-500" : "text-[#888888]"}`}>{attentionCount}</div>
            <div className="text-xs text-[#888888] mt-0.5 flex items-center justify-center gap-1">
              {attentionCount > 0 && <AlertTriangle size={10} className="text-amber-500" />}
              Aandachtspunten
            </div>
          </div>
        </div>

        {/* Player list */}
        {playerStats.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E8E6E1] shadow-sm text-center text-[#888888]">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p>Nog geen voltooide wedstrijden gevonden.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden">
            {playerStats.map(({ player, stats }, index) => (
              <Link
                key={player.id}
                to={`/PlayerDetail?id=${player.id}`}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-[#FFF8F4] transition-colors ${
                  index !== playerStats.length - 1 ? "border-b border-[#F0EEE9]" : ""
                } ${stats.isAttentionPoint ? "bg-amber-50 hover:bg-amber-100" : ""}`}
              >
                {/* Rank */}
                <div className="w-6 text-center text-sm font-500 text-[#888888] shrink-0">{index + 1}</div>

                {/* Photo */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FFF3EB] flex items-center justify-center shrink-0">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-500 text-[#FF6B00]">{player.name?.[0]}</span>
                  )}
                </div>

                {/* Name & position */}
                <div className="w-28 shrink-0">
                  <div className="text-sm font-500 text-[#1A1A1A] truncate">{player.name}</div>
                  <div className="text-xs text-[#888888] truncate">{player.position || "—"}</div>
                </div>

                {/* Bar */}
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-[#F0EEE9] rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all"
                      style={{
                        width: `${(stats.totalMinutes / (finishedCount * 90)) * 100}%`,
                        backgroundColor: stats.isAttentionPoint ? "#F59E0B" : "#FF6B00",
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>

                {/* Minutes */}
                <div className="w-10 text-right shrink-0">
                  <span className="text-sm font-500 text-[#1A1A1A]">{stats.totalMinutes}'</span>
                </div>

                {/* Stats mini */}
                <div className="hidden sm:flex gap-3 text-xs text-[#888888] shrink-0 w-32">
                  <span title="Basis">{stats.gamesStarted}× basis</span>
                  <span title="Invaller">{stats.gamesAsSubstitute}× inv.</span>
                </div>

                {/* Attention */}
                {stats.isAttentionPoint && (
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                )}
              </Link>
            ))}
          </div>
        )}

        {attentionCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{attentionCount} speelster{attentionCount !== 1 ? "s" : ""}</strong> {attentionCount !== 1 ? "hebben" : "heeft"} minder dan 30% van de beschikbare speelminuten gemaakt. Dit zijn aandachtspunten voor de trainer.
            </p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}