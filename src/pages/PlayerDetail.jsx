import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, Activity, Calendar, Heart, ClipboardList, Zap, Brain, Shield, Dumbbell, TrendingUp } from "lucide-react";
import PlayerMinutesBar from "@/components/minutes/PlayerMinutesBar";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Button } from "@/components/ui/button";
import WedstrijdbelevingChart from "@/components/checkin/WedstrijdbelevingChart";
import PlayerSeasonStats from "@/components/stats/PlayerSeasonStats";

export default function PlayerDetail() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("id");
  const { isTrainer, playerId: myPlayerId } = useCurrentUser();
  const isOwnProfile = myPlayerId === playerId;

  const { data: player } = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => base44.entities.Player.filter({ id: playerId }),
    enabled: !!playerId,
    select: (data) => data[0],
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["ratings", playerId],
    queryFn: () => base44.entities.PlayerRating.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: yoyoTests = [] } = useQuery({
    queryKey: ["yoyo", playerId],
    queryFn: () => base44.entities.YoYoTest.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: physicalTests = [] } = useQuery({
    queryKey: ["physical", playerId],
    queryFn: () => base44.entities.PhysicalTest.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", playerId],
    queryFn: () => base44.entities.Attendance.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: wellness = [] } = useQuery({
    queryKey: ["wellness", playerId],
    queryFn: () => base44.entities.WellnessLog.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  if (!player) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#E8E6E1] border-t-[#FF6B00] rounded-full animate-spin" />
    </div>
  );

  const presentCount = attendance.filter(a => a.present).length;
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null;
  const latestRating = ratings.sort((a, b) => a.meting > b.meting ? -1 : 1)[0];

  const calcAvg = (obj, keys) => {
    const vals = keys.map(k => obj[k]).filter(v => v != null);
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "-";
  };

  const technicalKeys = ["pass_kort", "pass_lang", "koppen", "scorend_vermogen", "duel_aanvallend", "duel_verdedigend", "balaanname"];
  const tacticalKeys = ["speelveld_groot", "omschakeling_balverlies", "speelveld_klein", "omschakeling_balbezit", "kijkgedrag"];
  const personalityKeys = ["winnaarsmentaliteit", "leergierig", "opkomst_trainingen", "komt_afspraken_na", "doorzetter"];
  const physicalRatingKeys = ["startsnelheid", "snelheid_lang", "postuur", "blessuregevoeligheid", "duelkracht", "motorische_vaardigheden"];

  return (
    <div className="relative">
      <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png" alt=""
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
      
      <div className="relative z-10 space-y-4 md:space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/Players" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
            <ArrowLeft size={18} color="#fff" />
          </Link>
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="w-12 md:w-16 h-12 md:h-16 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid rgba(255,107,0,0.4)" }} />
            ) : (
              <div className="w-12 md:w-16 h-12 md:h-16 rounded-full flex items-center justify-center text-lg md:text-xl font-bold flex-shrink-0" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A", border: "2px solid rgba(255,107,0,0.3)" }}>
                {player.name?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="t-page-title truncate">{player.name}</h1>
              <p className="t-secondary text-xs md:text-sm">{player.position} · #{player.shirt_number}</p>
            </div>
          </div>
          {isTrainer && (
            <Link to={`/PlayerRatingForm?player_id=${playerId}`} className="flex-shrink-0">
              <button className="btn-secondary px-3 md:px-4 py-2 text-xs md:text-sm h-auto">
                <ClipboardList size={14} />
              </button>
            </Link>
          )}
        </div>

      {/* IOP Goals */}
      {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
        <div className="glass-dark rounded-2xl p-4">
          <p className="t-label mb-3">IOP Doelen</p>
          <div className="space-y-2">
            {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).map((goal, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#FF6B00" }}>{i + 1}</span>
                <p className="t-secondary text-sm">{goal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Ratings */}
      {latestRating && (isTrainer || isOwnProfile) && (
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="relative p-4 md:p-5" style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.20) 0%, rgba(229,90,0,0.15) 100%)", borderBottom: "0.5px solid rgba(255,107,0,0.25)" }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
              <div>
                <p className="t-label">Laatste Beoordeling</p>
                <p className="t-card-title mt-0.5 text-sm">{latestRating.meting} · {latestRating.date}</p>
              </div>
              <div className="rounded-xl px-3 md:px-4 py-2 text-center" style={{ background: "rgba(255,255,255,0.10)" }}>
                <p className="t-metric-orange text-2xl md:text-3xl">
                  {(() => { const allKeys = [...technicalKeys, ...tacticalKeys, ...personalityKeys, ...physicalRatingKeys]; return calcAvg(latestRating, allKeys); })()}
                </p>
                <p className="t-tertiary text-xs">totaal</p>
              </div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Technisch", keys: technicalKeys, icon: <Zap size={14} />, color: "#60a5fa" },
              { label: "Tactisch", keys: tacticalKeys, icon: <Brain size={14} />, color: "#a78bfa" },
              { label: "Persoonlijkheid", keys: personalityKeys, icon: <Shield size={14} />, color: "#4ade80" },
              { label: "Fysiek", keys: physicalRatingKeys, icon: <Dumbbell size={14} />, color: "#fbbf24" },
            ].map(({ label, keys, icon, color }) => {
              const avg = calcAvg(latestRating, keys);
              const pct = avg !== "-" ? (parseFloat(avg) / 5) * 100 : 0;
              return (
                <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
                  <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
                    {icon}
                    <span className="text-xs font-semibold uppercase tracking-tight">{label}</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold" style={{ color }}>{avg}</p>
                  <div className="progress-track mt-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Physical Tests */}
      {(yoyoTests.length > 0 || physicalTests.length > 0) && (
        <div className="glass-dark rounded-2xl p-4">
          <p className="t-label mb-3 flex items-center gap-2"><Activity size={12} /> Fysieke Data</p>
          <div className="space-y-2">
            {yoyoTests.slice(-3).map(t => (
              <div key={t.id} className="flex justify-between items-center gap-2">
                <span className="t-secondary text-sm">Yo-Yo {t.date}</span>
                <span className="t-card-title text-sm">Level {t.level} · {t.distance}m</span>
              </div>
            ))}
            {physicalTests.slice(-3).map(t => (
              <div key={t.id} className="flex justify-between items-center gap-2">
                <span className="t-secondary text-sm">Sprint 30m {t.date}</span>
                <span className="t-card-title text-sm">{t.sprint_30m}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seizoensstatistieken */}
      <PlayerSeasonStats playerId={playerId} variant="compact" />

      {/* Attendance */}
      {attendance.length > 0 && (
        <div className="glass-dark rounded-2xl p-4">
          <p className="t-label mb-3 flex items-center gap-2"><Calendar size={12} /> Aanwezigheid</p>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <p className="t-metric-orange text-3xl">{attendancePct}%</p>
            <p className="t-secondary text-sm">{presentCount} van {attendance.length} sessies aanwezig</p>
          </div>
        </div>
      )}

      {/* Playing Minutes */}
      <PlayerMinutesBar playerId={playerId} />

      {/* Wellness */}
      {wellness.length > 0 && (
        <div className="glass p-4">
          <p className="t-label mb-3 flex items-center gap-2"><Heart size={12} /> Belastbaarheid (laatste 5)</p>
          <div className="space-y-2">
            {wellness.slice(-5).reverse().map(w => (
              <div key={w.id} className="flex justify-between">
                <span className="t-secondary">{w.date}</span>
                <span className="t-card-title">Slaap {w.sleep}/5 · Vermoeidheid {w.fatigue}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wedstrijdbeleving */}
      {(isTrainer || isOwnProfile) && (
        <div className="glass p-4">
          <p className="t-label mb-1 flex items-center gap-2"><Star size={12} /> Wedstrijdbeleving</p>
          <p className="t-tertiary mb-4">Pre-game mentaal vs. post-game tevredenheid per wedstrijd</p>
          <WedstrijdbelevingChart playerId={playerId} />
        </div>
      )}
    </div>
  );
}