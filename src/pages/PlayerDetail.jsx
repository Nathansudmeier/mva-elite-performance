import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, Activity, Calendar, Heart, ClipboardList, Zap, Brain, Shield, Dumbbell, TrendingUp } from "lucide-react";

import { useCurrentUser } from "@/components/auth/useCurrentUser";
import RoleGuard from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import WedstrijdbelevingChart from "@/components/checkin/WedstrijdbelevingChart";
import PlayerSeasonStats from "@/components/stats/PlayerSeasonStats";

export default function PlayerDetail() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("id");
  const { isTrainer, playerId: myPlayerId, isOuder } = useCurrentUser();
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
    <div className="pb-20 xl:pb-8" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Header with back button */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px"
      }}>
        <Link to="/Players" style={{
          width: "44px", height: "44px", borderRadius: "12px", display: "flex",
          alignItems: "center", justifyContent: "center", background: "#ffffff",
          border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a"
        }}>
          <ArrowLeft size={20} color="#1a1a1a" />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#1a1a1a" }}>{player.name}</h1>
          <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", marginTop: "2px" }}>{player.position} · #{player.shirt_number}</p>
        </div>
        {isTrainer && (
          <Link to={`/PlayerRatingForm?player_id=${playerId}`}>
            <button style={{
              background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "12px",
              padding: "10px", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "transform 0.1s", boxShadow: "2px 2px 0 #1a1a1a"
            }} onMouseDown={e => e.currentTarget.style.transform = "translate(1px, 1px)"}>
              <ClipboardList size={18} color="#ffffff" />
            </button>
          </Link>
        )}
      </div>

      {/* IOP Goals */}
      {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
        <div className="glass" style={{ padding: "16px", borderRadius: "18px" }}>
          <p className="t-label" style={{ marginBottom: "12px" }}>IOP Doelen</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).map((goal, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{
                  width: "28px", height: "28px", borderRadius: "50%", background: "#FF6800",
                  border: "2px solid #1a1a1a", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#ffffff", fontWeight: 800, fontSize: "12px", flexShrink: 0
                }}>{i + 1}</span>
                <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.70)", lineHeight: 1.4, paddingTop: "2px" }}>{goal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Ratings */}
      {latestRating && (isTrainer || isOwnProfile) && (
        <div className="glass" style={{ borderRadius: "18px", overflow: "hidden" }}>
          <div style={{
            background: "linear-gradient(135deg, #FF6800 0%, #FF8C00 100%)",
            padding: "16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px",
            position: "relative", overflow: "hidden"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <p className="t-label" style={{ color: "rgba(255,255,255,0.75)" }}>Laatste Beoordeling</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>{latestRating.meting} · {latestRating.date}</p>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "34px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                  {(() => { const allKeys = [...technicalKeys, ...tacticalKeys, ...personalityKeys, ...physicalRatingKeys]; return calcAvg(latestRating, allKeys); })()}
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>totaal</span>
              </div>
            </div>
            <img
              src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/cd3abaf70_Emvi-tactics.png"
              alt="Emvi"
              style={{ height: "110px", objectFit: "contain", marginBottom: "-16px", flexShrink: 0 }}
            />
          </div>
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }} className="mobile-grid-2col">
            {[
              { label: "Technisch", keys: technicalKeys, icon: "⚡", color: "#60a5fa" },
              { label: "Tactisch", keys: tacticalKeys, icon: "🧠", color: "#a78bfa" },
              { label: "Persoonlijkheid", keys: personalityKeys, icon: "🛡️", color: "#4ade80" },
              { label: "Fysiek", keys: physicalRatingKeys, icon: "💪", color: "#fbbf24" },
            ].map(({ label, keys, color }) => {
              const avg = calcAvg(latestRating, keys);
              const pct = avg !== "-" ? (parseFloat(avg) / 5) * 100 : 0;
              return (
                <div key={label} style={{
                  background: "rgba(26,26,26,0.04)", border: "2px solid rgba(26,26,26,0.08)",
                  borderRadius: "14px", padding: "12px"
                }}>
                  <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", letterSpacing: "0.05em", marginBottom: "6px" }}>{label}</p>
                  <p style={{ fontSize: "22px", fontWeight: 900, color }}>{avg}</p>
                  <div style={{ height: "4px", background: "rgba(26,26,26,0.10)", borderRadius: "2px", marginTop: "8px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Physical Tests */}
      {(yoyoTests.length > 0 || physicalTests.length > 0) && (
        <div className="glass" style={{ padding: "16px", borderRadius: "18px" }}>
          <p className="t-label" style={{ marginBottom: "12px" }}>Fysieke Data</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {yoyoTests.slice(-3).map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1.5px solid rgba(26,26,26,0.07)" }}>
                <span style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>Yo-Yo {t.date}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Level {t.level} · {t.distance}m</span>
              </div>
            ))}
            {physicalTests.slice(-3).map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1.5px solid rgba(26,26,26,0.07)" }}>
                <span style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>Sprint 30m {t.date}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{t.sprint_30m}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seizoensstatistieken */}
      <PlayerSeasonStats playerId={playerId} variant="compact" />

      {/* Attendance */}
      {attendance.length > 0 && (
        <div className="glass" style={{ padding: "16px", borderRadius: "18px" }}>
          <p className="t-label" style={{ marginBottom: "12px" }}>Aanwezigheid</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#FF6800", lineHeight: 1 }}>{attendancePct}%</span>
            <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>{presentCount} van {attendance.length} sessies</p>
          </div>
        </div>
      )}

      {/* Wellness */}
      {wellness.length > 0 && (
        <div className="glass" style={{ padding: "16px", borderRadius: "18px" }}>
          <p className="t-label" style={{ marginBottom: "12px" }}>Belastbaarheid (laatste 5)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {wellness.slice(-5).reverse().map((w, i) => (
              <div key={w.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingBottom: "8px", borderBottom: i < 4 ? "1.5px solid rgba(26,26,26,0.07)" : "none"
              }}>
                <span style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>{w.date}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a" }}>Slaap {w.sleep}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wedstrijdbeleving - only for trainer or own profile */}
      {(isTrainer || isOwnProfile) && !isOuder && (
        <div className="glass" style={{ padding: "16px", borderRadius: "18px" }}>
          <p className="t-label" style={{ marginBottom: "4px" }}>Wedstrijdbeleving</p>
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.40)", marginBottom: "12px" }}>Pre-game vs. post-game per wedstrijd</p>
          <WedstrijdbelevingChart playerId={playerId} />
        </div>
      )}
      </div>
      );
      }