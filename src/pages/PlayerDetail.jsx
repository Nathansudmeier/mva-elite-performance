import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Target, Trophy, ClipboardCheck, Activity, TrendingUp, Plus, Edit2, Star } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import RatingRadarChart from "@/components/ratings/RatingRadarChart";
import RatingProgressTable from "@/components/ratings/RatingProgressTable";

export default function PlayerDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get("id");
  const navigate = useNavigate();

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list() });
  const { data: yoyoTests = [] } = useQuery({ queryKey: ["yoyoTests"], queryFn: () => base44.entities.YoYoTest.list() });
  const { data: physicalTests = [] } = useQuery({ queryKey: ["physicalTests"], queryFn: () => base44.entities.PhysicalTest.list() });
  const { data: wellness = [] } = useQuery({ queryKey: ["wellness"], queryFn: () => base44.entities.WellnessLog.list() });
  const { data: ratings = [] } = useQuery({
    queryKey: ["playerRatings", playerId],
    queryFn: () => base44.entities.PlayerRating.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const player = players.find((p) => p.id === playerId);
  if (!player) return <div className="text-center py-20 text-white/60">Speelster niet gevonden</div>;

  // Attendance
  const playerAttendance = attendance.filter((a) => a.player_id === playerId);
  const totalPresent = playerAttendance.filter((a) => a.present).length;
  const totalSessions = playerAttendance.length;
  const attendancePct = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  // Last 10 sessions visual
  const last10Sessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).reverse();
  const last10Attendance = last10Sessions.map((s) => {
    const rec = playerAttendance.find((a) => a.session_id === s.id);
    return { date: s.date, present: rec ? rec.present : null };
  });

  // Yo-Yo
  const playerYoyo = yoyoTests.filter((t) => t.player_id === playerId).sort((a, b) => new Date(a.date) - new Date(b.date));
  const yoyoChartData = playerYoyo.map((t) => ({
    date: format(new Date(t.date), "d MMM", { locale: nl }),
    level: parseFloat(t.level) || 0,
  }));

  // Physical
  const playerPhysical = physicalTests.filter((t) => t.player_id === playerId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestPhysical = playerPhysical[0];

  // Wellness last 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentWellness = wellness
    .filter((w) => w.player_id === playerId && new Date(w.date) >= fourWeeksAgo)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const avgWellness = (key) => {
    const vals = recentWellness.map((w) => w[key]).filter(Boolean);
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };

  // Ratings
  const playerRatings = ratings.filter((r) => r.player_id === playerId);

  const chartTooltipStyle = { backgroundColor: "#FFF5F0", border: "1px solid #FDE8DC", borderRadius: 8, color: "#1A1F2E" };

  return (
    <div className="space-y-5 pb-24 lg:pb-8 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="elite-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: "#FDE8DC" }}>
            {player.photo_url
              ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
              : <User size={32} style={{ color: "#2F3650" }} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {player.shirt_number && <span className="font-black text-xl" style={{ color: "#D45A30" }}>#{player.shirt_number}</span>}
              <h1 className="text-xl font-black text-[#1A1F2E]">{player.name}</h1>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#2F3650" }}>{player.position || "Geen positie"}</p>
            {player.team && (
              <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FDE8DC", color: "#D45A30" }}>
                {player.team}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Sectie 1: Ontwikkeling (IOP) ── */}
      {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
        <div className="elite-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} style={{ color: "#D45A30" }} />
              <h2 className="font-bold text-[#1A1F2E]">Ontwikkeling (IOP)</h2>
            </div>
            <Link to={createPageUrl(`Players`)} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: "#FDE8DC", color: "#D45A30" }}>
              <Edit2 size={12} /> Bewerken
            </Link>
          </div>
          <div className="space-y-2">
            {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).map((goal, i) => (
              <div key={i} className="rounded-lg px-4 py-3" style={{ backgroundColor: "#FDE8DC" }}>
                <div className="flex items-start gap-3">
                  <span className="font-black text-sm mt-0.5 shrink-0" style={{ color: "#D45A30" }}>{i + 1}</span>
                  <span className="text-sm text-[#1A1F2E]">{goal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sectie 2: Beoordelingsoverzicht ── */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "#1A1F2E" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star size={18} style={{ color: "#E8724A" }} />
            <h2 className="font-bold text-white">Beoordelingsoverzicht</h2>
          </div>
          <Button
            onClick={() => navigate(createPageUrl(`PlayerRatingForm?id=${playerId}`))}
            size="sm"
            className="text-white text-xs font-semibold px-3 py-1.5"
            style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}
          >
            <Plus size={12} className="mr-1" />
            Nieuwe meting
          </Button>
        </div>

        {playerRatings.length > 0 ? (
          <>
            <RatingRadarChart ratings={playerRatings} />
            <RatingProgressTable ratings={playerRatings} />
            <div className="mt-3 flex flex-wrap gap-2">
              {["Meting 1", "Meting 2", "Meting 3"].map((m) => {
                const r = playerRatings.find((x) => x.meting === m);
                if (!r) return null;
                return (
                  <button
                    key={m}
                    onClick={() => navigate(createPageUrl(`PlayerRatingForm?id=${playerId}&ratingId=${r.id}`))}
                    className="text-xs px-3 py-1.5 rounded-lg text-white/70 hover:text-white transition-colors"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    <Edit2 size={10} className="inline mr-1" />{m} bewerken
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-white/40 text-sm text-center py-8">Nog geen beoordelingen. Voeg een meting toe.</p>
        )}
      </div>

      {/* ── Sectie 3: Fysieke data ── */}
      <div className="elite-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} style={{ color: "#D45A30" }} />
          <h2 className="font-bold text-[#1A1F2E]">Fysieke Data</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#FDE8DC" }}>
            <p className="text-xs text-[#2F3650] mb-1">Sprint 30m</p>
            <p className="text-xl font-black" style={{ color: "#1A1F2E" }}>
              {latestPhysical?.sprint_30m ? `${latestPhysical.sprint_30m}s` : "—"}
            </p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#FDE8DC" }}>
            <p className="text-xs text-[#2F3650] mb-1">Sprongkracht</p>
            <p className="text-xl font-black" style={{ color: "#1A1F2E" }}>
              {latestPhysical?.jump_height ? `${latestPhysical.jump_height}cm` : "—"}
            </p>
          </div>
        </div>
        {yoyoChartData.length > 0 && (
          <>
            <p className="text-xs font-semibold text-[#2F3650] uppercase tracking-wider mb-2">Yo-Yo Progressie</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yoyoChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE8DC" />
                  <XAxis dataKey="date" tick={{ fill: "#2F3650", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#2F3650", fontSize: 10 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="level" stroke="#D45A30" strokeWidth={2} dot={{ fill: "#D45A30", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {yoyoChartData.length === 0 && !latestPhysical && (
          <p className="text-sm text-[#2F3650] text-center py-4">Nog geen fysieke data.</p>
        )}
      </div>

      {/* ── Sectie 4: Aanwezigheid ── */}
      <div className="elite-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} style={{ color: "#D45A30" }} />
            <h2 className="font-bold text-[#1A1F2E]">Aanwezigheid</h2>
          </div>
          <span className="text-2xl font-black" style={{ color: "#D45A30" }}>{attendancePct}%</span>
        </div>
        <p className="text-xs text-[#2F3650] mb-3">{totalPresent} van {totalSessions} sessies aanwezig</p>
        {last10Attendance.length > 0 && (
          <div>
            <p className="text-xs text-[#2F3650] font-semibold uppercase tracking-wider mb-2">Laatste 10 trainingen</p>
            <div className="flex gap-1.5 flex-wrap">
              {last10Attendance.map((s, i) => (
                <div
                  key={i}
                  title={s.date}
                  className="w-6 h-6 rounded-full"
                  style={{
                    backgroundColor: s.present === true ? "#22c55e" : s.present === false ? "#ef4444" : "#e5e7eb",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sectie 5: Belastbaarheid ── */}
      {recentWellness.length > 0 && (
        <div className="elite-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} style={{ color: "#D45A30" }} />
            <h2 className="font-bold text-[#1A1F2E]">Belastbaarheid (laatste 4 weken)</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "sleep", label: "Slaap", emoji: "😴" },
              { key: "fatigue", label: "Vermoeidheid", emoji: "💪" },
              { key: "muscle_pain", label: "Spierpijn", emoji: "🤕" },
            ].map(({ key, label, emoji }) => {
              const avg = avgWellness(key);
              const pct = avg ? (parseFloat(avg) / 5) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1A1F2E]">{emoji} {label}</span>
                    <span className="text-sm font-bold" style={{ color: "#D45A30" }}>{avg ?? "—"}/5</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: "#FDE8DC" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#D45A30" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}