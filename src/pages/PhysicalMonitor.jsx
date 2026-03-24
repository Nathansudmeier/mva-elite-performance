import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

const TABS = [
  { key: "yoyo", label: "Yo-Yo Test" },
  { key: "physical", label: "Sprint & Sprong" },
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
        await base44.entities.PhysicalTest.create({ ...data, sprint_30m: data.sprint_30m ? Number(data.sprint_30m) : undefined, jump_height: data.jump_height ? Number(data.jump_height) : undefined });
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

  const yoyoProgression = [...yoyoTests]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((t) => ({
      date: format(new Date(t.date), "d MMM", { locale: nl }),
      level: parseFloat(t.level) || 0,
    }));

  const chartTick = { fill: "rgba(26,26,26,0.35)", fontSize: 11, fontWeight: 600 };
  const chartGrid = "rgba(26,26,26,0.07)";
  const chartTooltipStyle = { backgroundColor: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 12, color: "#1a1a1a", fontWeight: 700, boxShadow: "3px 3px 0 #1a1a1a" };

  const inputStyle = { background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", color: "#1a1a1a", fontWeight: 600, height: "44px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="t-page-title">Fysieke Monitor</h1>
          <p className="t-secondary" style={{ marginTop: "2px" }}>Yo-Yo, Sprint, Sprongkracht & Belastbaarheid</p>
        </div>
        {isTrainer && (
          <button
            onClick={() => openDialog(tab)}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FF6800", color: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", padding: "0 16px", height: "44px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
          >
            <Plus size={15} /> Invoeren
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "6px" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "2px solid #1a1a1a",
              background: tab === t.key ? "#1a1a1a" : "#ffffff",
              color: tab === t.key ? "#ffffff" : "#1a1a1a",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.1s",
              boxShadow: tab === t.key ? "2px 2px 0 rgba(26,26,26,0.2)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── YO-YO ── */}
      {tab === "yoyo" && (
        <>
          {/* Ranking */}
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px" }}>
            <p className="t-section-title" style={{ marginBottom: "14px" }}>Huidig Yo-Yo Niveau</p>
            {yoyoByPlayer.length === 0 ? (
              <p className="t-secondary" style={{ textAlign: "center", padding: "24px 0" }}>Nog geen Yo-Yo resultaten</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {yoyoByPlayer.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.25)", width: "18px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", width: "80px", flexShrink: 0 }}>{p.name}</span>
                    <div style={{ flex: 1, height: "8px", background: "rgba(26,26,26,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min((p.level / 23) * 100, 100)}%`, background: p.level >= 18 ? "#08D068" : p.level >= 15 ? "#FFD600" : "#FF6800", borderRadius: "4px", transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#FF6800", width: "36px", textAlign: "right", flexShrink: 0 }}>{p.level || "–"}</span>
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

      {/* ── SPRINT & SPRONG ── */}
      {tab === "physical" && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px" }}>
          <p className="t-section-title" style={{ marginBottom: "14px" }}>Sprint & Sprongkracht Resultaten</p>
          {physicalTests.length === 0 ? (
            <p className="t-secondary" style={{ textAlign: "center", padding: "24px 0" }}>Nog geen testresultaten</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.08)" }}>
                    {["Speelster", "Datum", "Sprint 30m", "Sprongkracht"].map((h, i) => (
                      <th key={h} style={{ padding: "8px 6px", fontSize: "10px", fontWeight: 800, color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i >= 2 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...physicalTests].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i, arr) => (
                    <tr key={t.id} style={{ borderBottom: i < arr.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none" }}>
                      <td style={{ padding: "10px 6px", fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{players.find((p) => p.id === t.player_id)?.name || "–"}</td>
                      <td style={{ padding: "10px 6px", fontSize: "12px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{format(new Date(t.date), "d MMM", { locale: nl })}</td>
                      <td style={{ padding: "10px 6px", textAlign: "right", fontSize: "13px", fontWeight: 900, color: "#9B5CFF" }}>{t.sprint_30m ? `${t.sprint_30m}s` : "–"}</td>
                      <td style={{ padding: "10px 6px", textAlign: "right", fontSize: "13px", fontWeight: 900, color: "#FF6800" }}>{t.jump_height ? `${t.jump_height}cm` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── BELASTBAARHEID ── */}
      {tab === "wellness" && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px" }}>
          <p className="t-section-title" style={{ marginBottom: "14px" }}>Belastbaarheidslogboek</p>
          {wellness.length === 0 ? (
            <p className="t-secondary" style={{ textAlign: "center", padding: "24px 0" }}>Nog geen logs</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.08)" }}>
                    {["Speelster", "Datum", "Slaap", "Vermoeidheid", "Spierpijn"].map((h, i) => (
                      <th key={h} style={{ padding: "8px 6px", fontSize: "10px", fontWeight: 800, color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i >= 2 ? "center" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...wellness].sort((a, b) => new Date(b.date) - new Date(a.date)).map((w, i, arr) => (
                    <tr key={w.id} style={{ borderBottom: i < arr.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none" }}>
                      <td style={{ padding: "10px 6px", fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{players.find((p) => p.id === w.player_id)?.name || "–"}</td>
                      <td style={{ padding: "10px 6px", fontSize: "12px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{format(new Date(w.date), "d MMM", { locale: nl })}</td>
                      <td style={{ padding: "10px 6px", textAlign: "center" }}>{renderScore(w.sleep)}</td>
                      <td style={{ padding: "10px 6px", textAlign: "center" }}>{renderScore(w.fatigue)}</td>
                      <td style={{ padding: "10px 6px", textAlign: "center" }}>{renderScore(w.muscle_pain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <Input type="number" placeholder="Sprongkracht (cm)" value={form.jump_height || ""} onChange={(e) => setForm({ ...form, jump_height: e.target.value })} style={inputStyle} />
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