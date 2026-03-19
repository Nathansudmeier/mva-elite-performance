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
        <button key={o.value} onClick={() => onChange(o.value)}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={value === o.value ? { background: "#FF6B00", color: "#fff" } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "0.5px solid rgba(255,255,255,0.15)" }}
        >{o.label}</button>
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

  const activePlayers = players.filter(p => p.active !== false && (!isReadOnly || p.id === myPlayerId));
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/Players" className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
          <ArrowLeft size={18} className="text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="t-page-title flex items-center gap-2">
            <Clock size={18} style={{ color: "#FF8C3A" }} /> Speelminuten Overzicht
          </h1>
          <p className="t-secondary">{finishedCount} gespeelde wedstrijd{finishedCount !== 1 ? "en" : ""}</p>
        </div>
      </div>

      {/* Filter */}
      <TeamFilter value={teamFilter} onChange={setTeamFilter} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 text-center">
          <p className="t-metric-orange">{playerStats.length}</p>
          <p className="t-label mt-0.5">Speelsters</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="t-metric-orange">{finishedCount}</p>
          <p className="t-label mt-0.5">Wedstrijden</p>
        </div>
        <div className="p-4 text-center rounded-[22px]" style={attentionCount > 0 ? { background: "rgba(251,191,36,0.12)", border: "0.5px solid rgba(251,191,36,0.3)" } : { background: "rgba(255,255,255,0.09)", border: "0.5px solid rgba(255,255,255,0.18)" }}>
          <p className="t-metric" style={{ color: attentionCount > 0 ? "#fbbf24" : "rgba(255,255,255,0.5)" }}>{attentionCount}</p>
          <p className="t-label mt-0.5 flex items-center justify-center gap-1">
            {attentionCount > 0 && <AlertTriangle size={9} style={{ color: "#fbbf24" }} />}
            Aandacht
          </p>
        </div>
      </div>

      {/* Player list */}
      {playerStats.length === 0 ? (
        <div className="glass p-8 text-center">
          <Users size={32} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="t-tertiary">Nog geen voltooide wedstrijden gevonden.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {playerStats.map(({ player, stats }, index) => (
            <Link key={player.id} to={`/PlayerDetail?id=${player.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-opacity hover:opacity-80"
              style={{ borderBottom: index !== playerStats.length - 1 ? "0.5px solid rgba(255,255,255,0.08)" : "none", background: stats.isAttentionPoint ? "rgba(251,191,36,0.06)" : "transparent" }}
            >
              <div className="w-6 text-center t-tertiary shrink-0">{index + 1}</div>

              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}>
                {player.photo_url ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{player.name?.[0]}</span>}
              </div>

              <div className="w-28 shrink-0">
                <div className="t-card-title truncate">{player.name}</div>
                <div className="t-tertiary truncate">{player.position || "—"}</div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="h-5 rounded-md overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-md transition-all" style={{ width: `${(stats.totalMinutes / (finishedCount * 90)) * 100}%`, backgroundColor: stats.isAttentionPoint ? "#fbbf24" : "#FF6B00" }} />
                </div>
              </div>

              <div className="w-10 text-right shrink-0">
                <span className="t-card-title">{stats.totalMinutes}'</span>
              </div>

              <div className="hidden sm:flex gap-3 shrink-0 w-32">
                <span className="t-tertiary">{stats.gamesStarted}× basis</span>
                <span className="t-tertiary">{stats.gamesAsSubstitute}× inv.</span>
              </div>

              {stats.isAttentionPoint && <AlertTriangle size={14} style={{ color: "#fbbf24" }} className="shrink-0" />}
            </Link>
          ))}
        </div>
      )}

      {attentionCount > 0 && (
        <div className="glass-alert p-4 flex items-start gap-3">
          <AlertTriangle size={16} style={{ color: "#fbbf24" }} className="mt-0.5 shrink-0" />
          <p className="t-secondary" style={{ color: "#fbbf24" }}>
            <strong>{attentionCount} speelster{attentionCount !== 1 ? "s" : ""}</strong> {attentionCount !== 1 ? "hebben" : "heeft"} minder dan 30% van de beschikbare speelminuten gemaakt.
          </p>
        </div>
      )}
    </div>
  );
}