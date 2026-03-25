import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, Zap } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TABS = [
  { key: "yoyo", label: "Yo-Yo Test" },
  { key: "physical", label: "Sprint" },
  { key: "wellness", label: "Belastbaarheid" },
];

function renderScore(score) {
  if (!score) return <span className="t-tertiary">–</span>;
  const colors = ["", "#FF3DA8", "#FFD600", "#FFD600", "#08D068", "#08D068"];
  return (
    <span style={{ fontWeight: 800, fontSize: "13px", color: colors[score] || "rgba(26,26,26,0.4)" }}>
      {score}
    </span>
  );
}

export default function PhysicalMonitor() {
  const queryClient = useQueryClient();
  const { isTrainer } = useCurrentUser();
  const [tab, setTab] = useState("yoyo");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("yoyo");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [form, setForm] = useState({});

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: yoyoTests = [] } = useQuery({ queryKey: ["yoyoTests"], queryFn: () => base44.entities.YoYoTest.list() });
  const { data: physicalTests = [] } = useQuery({ queryKey: ["physicalTests"], queryFn: () => base44.entities.PhysicalTest.list() });
  const { data: wellness = [] } = useQuery({ queryKey: ["wellness"], queryFn: () => base44.entities.WellnessLog.list() });

  const activePlayers = players.filter((p) => p.active !== false);

  const openDialog = (type) => {
    setDialogType(type);
    setForm({ date: new Date().toISOString().split("T")[0] });
    setSelectedPlayer("");
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { ...form, player_id: selectedPlayer };
      if (dialogType === "yoyo") {
        await base44.entities.YoYoTest.create(data);
      } else if (dialogType === "physical") {
        await base44.entities.PhysicalTest.create({ ...data, sprint_30m: data.sprint_30m ? Number(data.sprint_30m) : undefined });
      } else {
        await base44.entities.WellnessLog.create({ ...data, sleep: Number(data.sleep), fatigue: Number(data.fatigue), muscle_pain: Number(data.muscle_pain) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yoyoTests"] });
      queryClient.invalidateQueries({ queryKey: ["physicalTests"] });
      queryClient.invalidateQueries({ queryKey: ["wellness"] });
      setDialogOpen(false);
    },
  });

  const yoyoByPlayer = activePlayers.map((p) => {
    const tests = yoyoTests.filter((t) => t.player_id === p.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    return { id: p.id, name: p.name?.split(" ")[0], level: tests[0] ? parseFloat(tests[0].level) || 0 : 0 };
  }).sort((a, b) => b.level - a.level);

  const yoyoProgression = Object.entries(
    [...yoyoTests]
      .filter(t => t.level && !isNaN(parseFloat(t.level)))
      .reduce((acc, t) => {
        if (!acc[t.date]) acc[t.date] = [];
        acc[t.date].push(parseFloat(t.level));
        return acc;
      }, {})
  ).sort((a, b) => new Date(a[0]) - new Date(b[0]))
   .map(([date, levels]) => ({
      date: format(new Date(date), "d MMM", { locale: nl }),
      level: levels.reduce((a, b) => a + b, 0) / levels.length,
    }));

  const chartTick = { fill: "rgba(26,26,26,0.35)", fontSize: 11, fontWeight: 600 };
  const chartGrid = "rgba(26,26,26,0.07)";
  const chartTooltipStyle = { backgroundColor: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 12, color: "#1a1a1a", fontWeight: 700, boxShadow: "3px 3px 0 #1a1a1a" };

  const inputStyle = { background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", color: "#1a1a1a", fontWeight: 600, height: "44px" };

  const tabLabels = { yoyo: "Yo-Yo Test", physical: "Sprint", wellness: "Belastbaarheid" };
  const currentTabLabel = tabLabels[tab];

  const getTopPlayers = () => {
    if (tab === "yoyo") return yoyoByPlayer.slice(0, 3);
    if (tab === "physical") {
      const byPlayer = {};
      physicalTests.forEach(t => {
        if (!byPlayer[t.player_id]) byPlayer[t.player_id] = [];
        byPlayer[t.player_id].push(t);
      });
      const latest = Object.entries(byPlayer).map(([id, tests]) => ({
        id,
        name: players.find(p => p.id === id)?.name?.split(" ")[0] || "–",
        score: tests.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.sprint_30m || 0
      })).sort((a, b) => a.score - b.score).slice(0, 3);
      return latest;
    }
    if (tab === "wellness") {
      const byPlayer = {};
      wellness.forEach(w => {
        if (!byPlayer[w.player_id]) byPlayer[w.player_id] = [];
        byPlayer[w.player_id].push(w);
      });
      const avgScore = Object.entries(byPlayer).map(([id, logs]) => {
        const latest = logs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const avg = latest ? (latest.sleep + latest.fatigue + latest.muscle_pain) / 3 : 0;
        return { id, name: players.find(p => p.id === id)?.name?.split(" ")[0] || "–", score: avg };
      }).sort((a, b) => b.score - a.score).slice(0, 3);
      return avgScore;
    }
  };

  const topPlayers = getTopPlayers();
  const maxScore = Math.max(...(tab === "yoyo" ? yoyoByPlayer : tab === "physical" ? (Object.values(physicalTests.reduce((acc, t) => {
    if (!acc[t.player_id]) acc[t.player_id] = [];
    acc[t.player_id].push(t.sprint_30m);
    return acc;
  }, {})).flat()) : (Object.values(wellness.reduce((acc, w) => {
    if (!acc[w.player_id]) acc[w.player_id] = [];
    acc[w.player_id].push((w.sleep + w.fatigue + w.muscle_pain) / 3);
    return acc;
  }, {})).flat())).map(p => typeof p === 'object' ? p.level || p.score : p), 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px", padding: "1rem" }}>

      {/* Header */}
      <div style={{
        background: "#FF6800", 
        border: "2.5px solid #1a1a1a",
        borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a",
        padding: "1rem 0 1rem 1.25rem",
        margin: 0,
        position: "relative",
        overflow: "hidden",
        minHeight: "90px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute",
          width: "130px",
          height: "130px",
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.15)",
          top: "-40px",
          right: "90px",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.15)",
          bottom: "-15px",
          right: "180px",
          pointerEvents: "none",
        }} />
        
        {/* Left section */}
        <div style={{ zIndex: 2 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.5px", margin: 0 }}>Fysieke Monitor</h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", fontWeight: 600, margin: "3px 0 0 0" }}>Yo-Yo, Sprint & Belastbaarheid</p>
        </div>
        
        {/* Emvi illustration */}
        <img 
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/0857bc46e_Emvi-sweat.png" 
          alt="Emvi" 
          style={{ 
            position: "relative",
            height: "110px",
            width: "auto",
            objectFit: "contain",
            objectPosition: "bottom",
            marginLeft: "12px",
            marginBottom: "-4px",
            flexShrink: 0,
            zIndex: 3,
            alignSelf: "flex-end",
          }} 
        />
      </div>

      {/* Tab pills */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "2.5px solid #1a1a1a",
              background: tab === t.key ? "#1a1a1a" : "#ffffff",
              color: tab === t.key ? "#ffffff" : "rgba(26,26,26,0.50)",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.1s",
              boxShadow: tab === t.key ? "3px 3px 0 #FF6800" : "2px 2px 0 #1a1a1a",
              flex: "1 1 auto",
              minWidth: "80px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      {isTrainer && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          <Link to={createPageUrl("YoYoTestLive")} style={{ textDecoration: "none" }}>
            <button style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", 
              background: "#08D068", color: "#1a1a1a", border: "2.5px solid #1a1a1a", 
              borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", 
              height: "44px", fontWeight: 800, fontSize: "13px", cursor: "pointer", width: "100%"
            }}>
              <Zap size={14} /> Live
            </button>
          </Link>
          <button
            onClick={() => openDialog(tab)}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", 
              background: "#FF6800", color: "#ffffff", border: "2.5px solid #1a1a1a", 
              borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", 
              height: "44px", fontWeight: 800, fontSize: "13px", cursor: "pointer"
            }}
          >
            <Plus size={14} /> Invoeren
          </button>
        </div>
      )}

      {/* Top 3 bento cards */}
      {topPlayers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "8px", marginBottom: "12px" }}>
          {topPlayers.map((p, i) => (
            <div
              key={p.id}
              style={{
                background: i === 0 ? "#FF6800" : "#ffffff",
                border: "2.5px solid #1a1a1a",
                borderRadius: "14px",
                boxShadow: i === 0 ? "3px 3px 0 #1a1a1a" : "2px 2px 0 #1a1a1a",
                padding: "0.75rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: i === 0 ? "rgba(255,255,255,0.60)" : "rgba(26,26,26,0.40)", margin: 0 }}>#{i + 1}</p>
              <p style={{ fontSize: "12px", fontWeight: 900, color: i === 0 ? "#ffffff" : "#1a1a1a", margin: "4px 0 0 0" }}>{p.name}</p>
              <p style={{ fontSize: "18px", fontWeight: 900, color: i === 0 ? "#ffffff" : "#FF6800", letterSpacing: "-1px", margin: "4px 0 0 0" }}>{typeof p.level !== 'undefined' ? p.level : p.score}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── YO-YO ── */}
      {tab === "yoyo" && (
        <>
          {/* Ranking */}
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "14px", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Huidig {currentTabLabel} Niveau</p>
              <div style={{ background: "#00C2FF", border: "1.5px solid #1a1a1a", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, color: "#1a1a1a" }}>
                {yoyoByPlayer.length}
              </div>
            </div>
            {yoyoByPlayer.length === 0 ? (
              <p className="t-secondary" style={{ textAlign: "center", padding: "24px 1rem" }}>Nog geen Yo-Yo resultaten</p>
            ) : (
              <div>
                {yoyoByPlayer.map((p, i, arr) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 1rem", borderBottom: i < arr.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none", fontSize: "12px" }}>
                    <span style={{ fontWeight: 800, color: i < 3 ? "#FF6800" : "rgba(26,26,26,0.35)", width: "16px", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontWeight: 700, color: "#1a1a1a", width: "70px", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                    <div style={{ flex: 1, minWidth: 0, height: "8px", background: "rgba(26,26,26,0.08)", borderRadius: "20px", border: "1.5px solid #1a1a1a", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(p.level / maxScore) * 100}%`, background: p.level >= 18 ? "#08D068" : p.level >= 15 ? "#FFD600" : "#FF3DA8", borderRadius: "20px" }} />
                    </div>
                    <span style={{ fontWeight: 900, color: "#FF6800", width: "32px", textAlign: "right", flexShrink: 0 }}>{p.level || "–"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progressie grafiek */}
          {yoyoProgression.length > 0 && (
            <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px" }}>
              <p className="t-section-title" style={{ marginBottom: "14px" }}>Yo-Yo Progressie (team)</p>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yoyoProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="date" tick={chartTick} />
                    <YAxis tick={chartTick} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="level" stroke="#FF6800" strokeWidth={2.5} dot={{ fill: "#FF6800", r: 4, stroke: "#1a1a1a", strokeWidth: 1.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SPRINT ── */}
      {tab === "physical" && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "14px", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Huidig {currentTabLabel} Niveau</p>
            <div style={{ background: "#00C2FF", border: "1.5px solid #1a1a1a", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, color: "#1a1a1a" }}>
              {physicalTests.length}
            </div>
          </div>
          {physicalTests.length === 0 ? (
            <p className="t-secondary" style={{ textAlign: "center", padding: "24px 1rem" }}>Nog geen testresultaten</p>
          ) : (
            <div>
              {[...physicalTests].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i, arr) => {
                const playerName = players.find((p) => p.id === t.player_id)?.name?.split(" ")[0] || "–";
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 1rem", borderBottom: i < arr.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none", fontSize: "12px" }}>
                    <span style={{ fontWeight: 800, color: "rgba(26,26,26,0.35)", width: "16px", textAlign: "center", flexShrink: 0 }}>–</span>
                    <span style={{ fontWeight: 700, color: "#1a1a1a", width: "70px", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{playerName}</span>
                    <div style={{ flex: 1, minWidth: 0, height: "8px", background: "rgba(26,26,26,0.08)", borderRadius: "20px", border: "1.5px solid #1a1a1a", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(t.sprint_30m / maxScore) * 100}%`, background: t.sprint_30m <= 4.5 ? "#08D068" : t.sprint_30m <= 5 ? "#FFD600" : "#FF3DA8", borderRadius: "20px" }} />
                    </div>
                    <span style={{ fontWeight: 900, color: "#FF6800", width: "32px", textAlign: "right", flexShrink: 0 }}>{t.sprint_30m || "–"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BELASTBAARHEID ── */}
      {tab === "wellness" && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "14px", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Huidig {currentTabLabel} Niveau</p>
            <div style={{ background: "#00C2FF", border: "1.5px solid #1a1a1a", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, color: "#1a1a1a" }}>
              {wellness.length}
            </div>
          </div>
          {wellness.length === 0 ? (
            <p className="t-secondary" style={{ textAlign: "center", padding: "24px 1rem" }}>Nog geen logs</p>
          ) : (
            <div>
              {[...wellness].sort((a, b) => new Date(b.date) - new Date(a.date)).map((w, i, arr) => {
                const playerName = players.find((p) => p.id === w.player_id)?.name?.split(" ")[0] || "–";
                const avg = (w.sleep + w.fatigue + w.muscle_pain) / 3;
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 1rem", borderBottom: i < arr.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none", fontSize: "12px" }}>
                    <span style={{ fontWeight: 800, color: "rgba(26,26,26,0.35)", width: "16px", textAlign: "center", flexShrink: 0 }}>–</span>
                    <span style={{ fontWeight: 700, color: "#1a1a1a", width: "70px", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{playerName}</span>
                    <div style={{ flex: 1, minWidth: 0, height: "8px", background: "rgba(26,26,26,0.08)", borderRadius: "20px", border: "1.5px solid #1a1a1a", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(avg / maxScore) * 100}%`, background: avg >= 4 ? "#08D068" : avg >= 3 ? "#FFD600" : "#FF3DA8", borderRadius: "20px" }} />
                    </div>
                    <span style={{ fontWeight: 900, color: "#FF6800", width: "32px", textAlign: "right", flexShrink: 0 }}>{avg.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DIALOG ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "20px", boxShadow: "4px 4px 0 #1a1a1a" }}>
          <DialogHeader>
            <DialogTitle className="t-page-title">
              {dialogType === "yoyo" ? "Yo-Yo Test" : dialogType === "physical" ? "Sprint & Sprong" : "Belastbaarheid"}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger style={inputStyle}>
                <SelectValue placeholder="Selecteer speelster" />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />

            {dialogType === "yoyo" && (
              <>
                <Input placeholder="Yo-Yo niveau (bijv. 16.2)" value={form.level || ""} onChange={(e) => setForm({ ...form, level: e.target.value })} style={inputStyle} />
                <Input type="number" placeholder="Afstand (m)" value={form.distance || ""} onChange={(e) => setForm({ ...form, distance: e.target.value })} style={inputStyle} />
              </>
            )}
            {dialogType === "physical" && (
              <>
                <Input type="number" step="0.01" placeholder="Sprint 30m (sec)" value={form.sprint_30m || ""} onChange={(e) => setForm({ ...form, sprint_30m: e.target.value })} style={inputStyle} />
              </>
            )}
            {dialogType === "wellness" && (
              [["sleep", "Slaapkwaliteit"], ["fatigue", "Vermoeidheid"], ["muscle_pain", "Spierpijn"]].map(([key, label]) => (
                <div key={key}>
                  <p className="t-label" style={{ marginBottom: "6px" }}>{label} (1–5)</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setForm({ ...form, [key]: v })}
                        style={{
                          width: "40px", height: "40px", borderRadius: "12px",
                          border: "2px solid #1a1a1a",
                          background: form[key] === v ? "#FF6800" : "#ffffff",
                          color: form[key] === v ? "#ffffff" : "#1a1a1a",
                          fontWeight: 800, fontSize: "14px",
                          cursor: "pointer",
                          boxShadow: form[key] === v ? "2px 2px 0 #1a1a1a" : "none",
                          transition: "all 0.1s",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !selectedPlayer}
              className="btn-primary"
              style={{ marginTop: "4px" }}
            >
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}