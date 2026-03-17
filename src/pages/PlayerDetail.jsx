import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, Activity, Calendar, Heart, ClipboardList, Zap, Brain, Shield, Dumbbell } from "lucide-react";
import PlayerMinutesBar from "@/components/minutes/PlayerMinutesBar";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Button } from "@/components/ui/button";
import WedstrijdbelevingChart from "@/components/checkin/WedstrijdbelevingChart";

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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/Players" className="p-2 rounded-xl bg-white border border-[#E8E6E1] hover:bg-[#F7F5F2]">
          <ArrowLeft size={18} className="text-[#1A1A1A]" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#E8E6E1]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#FFF3EB] flex items-center justify-center text-[#FF6B00] text-xl font-500">
              {player.name?.[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-500 text-[#1A1A1A]">{player.name}</h1>
            <p className="text-[#888888] text-sm">{player.position} · #{player.shirt_number}</p>
          </div>
          {isTrainer && (
            <Link to={`/PlayerRatingForm?player_id=${playerId}`}>
              <Button className="bg-[#FF6B00] hover:bg-[#E55A00] text-white gap-2">
                <ClipboardList size={16} />
                Beoordelen
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* IOP Goals */}
      {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] mb-3">IOP Doelen</h2>
          <div className="space-y-2">
            {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).map((goal, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 w-5 h-5 rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <p className="text-sm text-[#1A1A1A]">{goal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Ratings — only visible to trainer/admin or the player themselves */}
      {latestRating && (isTrainer || isOwnProfile) && (
        <div className="rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-sm">
          {/* Header with gradient */}
          <div className="relative p-5" style={{ background: "linear-gradient(135deg, #FF6B00 0%, #E55A00 100%)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider font-500">Laatste Beoordeling</p>
                <p className="text-white text-lg font-500 mt-0.5">{latestRating.meting} · {latestRating.date}</p>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                <p className="text-white text-2xl font-500">
                  {(() => {
                    const allKeys = [...technicalKeys, ...tacticalKeys, ...personalityKeys, ...physicalRatingKeys];
                    return calcAvg(latestRating, allKeys);
                  })()}
                </p>
                <p className="text-white/70 text-xs">totaal</p>
              </div>
            </div>
          </div>
          {/* Score grid */}
          <div className="bg-white p-4 grid grid-cols-2 gap-3">
            {[
              { label: "Technisch", keys: technicalKeys, icon: <Zap size={14} />, color: "#3B82F6", bg: "#EFF6FF" },
              { label: "Tactisch", keys: tacticalKeys, icon: <Brain size={14} />, color: "#8B5CF6", bg: "#F5F3FF" },
              { label: "Persoonlijkheid", keys: personalityKeys, icon: <Shield size={14} />, color: "#10B981", bg: "#ECFDF5" },
              { label: "Fysiek", keys: physicalRatingKeys, icon: <Dumbbell size={14} />, color: "#F59E0B", bg: "#FFFBEB" },
            ].map(({ label, keys, icon, color, bg }) => {
              const avg = calcAvg(latestRating, keys);
              const pct = avg !== "-" ? (parseFloat(avg) / 5) * 100 : 0;
              return (
                <div key={label} className="rounded-xl p-3" style={{ backgroundColor: bg }}>
                  <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
                    {icon}
                    <span className="text-xs font-500 uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="text-2xl font-500" style={{ color }}>{avg}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-black/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Physical Tests */}
      {(yoyoTests.length > 0 || physicalTests.length > 0) && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] mb-3 flex items-center gap-2">
            <Activity size={14} /> Fysieke Data
          </h2>
          <div className="space-y-2">
            {yoyoTests.slice(-3).map(t => (
              <div key={t.id} className="flex justify-between text-sm">
                <span className="text-[#888888]">Yo-Yo {t.date}</span>
                <span className="font-500 text-[#1A1A1A]">Level {t.level} · {t.distance}m</span>
              </div>
            ))}
            {physicalTests.slice(-3).map(t => (
              <div key={t.id} className="flex justify-between text-sm">
                <span className="text-[#888888]">Sprint 30m {t.date}</span>
                <span className="font-500 text-[#1A1A1A]">{t.sprint_30m}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance */}
      {attendance.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] mb-3 flex items-center gap-2">
            <Calendar size={14} /> Aanwezigheid
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-500 text-[#FF6B00]">{attendancePct}%</div>
            <div className="text-sm text-[#888888]">{presentCount} van {attendance.length} sessies aanwezig</div>
          </div>
        </div>
      )}

      {/* Playing Minutes */}
      <PlayerMinutesBar playerId={playerId} />

      {/* Wellness */}
      {wellness.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] mb-3 flex items-center gap-2">
            <Heart size={14} /> Belastbaarheid (laatste 5)
          </h2>
          <div className="space-y-2">
            {wellness.slice(-5).reverse().map(w => (
              <div key={w.id} className="flex justify-between text-sm">
                <span className="text-[#888888]">{w.date}</span>
                <span className="text-[#1A1A1A]">Slaap {w.sleep}/5 · Vermoeidheid {w.fatigue}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wedstrijdbeleving */}
      {(isTrainer || isOwnProfile) && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] mb-4 flex items-center gap-2">
            <Star size={14} /> Wedstrijdbeleving
          </h2>
          <p className="text-xs text-[#888888] mb-3">Pre-game mentaal vs. post-game tevredenheid per wedstrijd</p>
          <WedstrijdbelevingChart playerId={playerId} />
        </div>
      )}
    </div>
  );
}