import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, Activity, Calendar, Heart, ClipboardList, Zap, Brain, Shield, Dumbbell } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Button } from "@/components/ui/button";

export default function PlayerDetail() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("id");
  const { isTrainer } = useCurrentUser();

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

      {/* Latest Ratings */}
      {latestRating && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00]">Beoordeling ({latestRating.meting})</h2>
            <Link to={`/PlayerRatingForm?player_id=${playerId}`} className="text-xs text-[#FF6B00] underline">+ Nieuwe meting</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Technisch", keys: technicalKeys },
              { label: "Tactisch", keys: tacticalKeys },
              { label: "Persoonlijkheid", keys: personalityKeys },
              { label: "Fysiek", keys: physicalRatingKeys },
            ].map(({ label, keys }) => (
              <div key={label} className="bg-[#FFF3EB] rounded-xl p-3 text-center">
                <div className="text-2xl font-500 text-[#FF6B00]">{calcAvg(latestRating, keys)}</div>
                <div className="text-xs text-[#888888] mt-1">{label}</div>
              </div>
            ))}
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
    </div>
  );
}