import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Activity, Timer, Heart, Plus } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

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
    return { name: p.name?.split(" ")[0], level: tests[0] ? parseFloat(tests[0].level) || 0 : 0 };
  }).sort((a, b) => b.level - a.level);

  const yoyoProgression = yoyoTests
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((t) => ({
      date: format(new Date(t.date), "d MMM", { locale: nl }),
      level: parseFloat(t.level) || 0,
      player: players.find((p) => p.id === t.player_id)?.name?.split(" ")[0] || "",
    }));

  const chartTooltipStyle = { backgroundColor: 'rgba(20,10,2,0.95)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff' };
  const chartTick = { fill: 'rgba(255,255,255,0.45)', fontSize: 11 };
  const chartGrid = "rgba(255,255,255,0.08)";

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Fysieke Monitor</h1>
          <p className="t-secondary">Yo-Yo, Sprint, Sprongkracht & Belastbaarheid</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
          <TabsTrigger value="yoyo" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>Yo-Yo Test</TabsTrigger>
          <TabsTrigger value="physical" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>Sprint & Sprong</TabsTrigger>
          <TabsTrigger value="wellness" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>Belastbaarheid</TabsTrigger>
        </TabsList>

        <TabsContent value="yoyo" className="space-y-4 mt-4">
          {isTrainer && <div className="flex justify-end"><button onClick={() => openDialog("yoyo")} className="btn-secondary"><Plus size={14} /> Yo-Yo Test</button></div>}
          <div className="glass p-6">
            <p className="t-label mb-4 flex items-center gap-2"><Activity size={14} /> Huidig Yo-Yo Niveau</p>
            <div className="space-y-2">
              {yoyoByPlayer.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="t-secondary w-20 truncate">{p.name}</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full flex items-center justify-end pr-2 text-white" style={{ width: `${Math.min((p.level / 23) * 100, 100)}%`, background: "linear-gradient(90deg, #FF6B00, #FF9500)" }}>
                      <span className="text-[10px] font-bold">{p.level || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {yoyoProgression.length > 0 && (
            <div className="glass p-6">
              <p className="t-label mb-4">Yo-Yo Progressie</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yoyoProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="date" tick={chartTick} />
                    <YAxis tick={chartTick} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="level" stroke="#FF6B00" strokeWidth={2} dot={{ fill: '#FF6B00', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="physical" className="space-y-4 mt-4">
          {isTrainer && <div className="flex justify-end"><button onClick={() => openDialog("physical")} className="btn-secondary"><Plus size={14} /> Test Invoeren</button></div>}
          <div className="glass p-6">
            <p className="t-label mb-4 flex items-center gap-2"><Timer size={14} /> Sprint & Sprongkracht Resultaten</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.45)" }}>
                    <th className="text-left py-2">Speelster</th>
                    <th className="text-left py-2">Datum</th>
                    <th className="text-right py-2">Sprint 30m</th>
                    <th className="text-right py-2">Sprongkracht</th>
                  </tr>
                </thead>
                <tbody>
                  {physicalTests.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                    <tr key={t.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                      <td className="py-2 t-card-title">{players.find((p) => p.id === t.player_id)?.name || "-"}</td>
                      <td className="py-2 t-secondary">{format(new Date(t.date), "d MMM", { locale: nl })}</td>
                      <td className="py-2 text-right font-bold" style={{ color: "#FF8C3A" }}>{t.sprint_30m ? `${t.sprint_30m}s` : "-"}</td>
                      <td className="py-2 text-right t-card-title">{t.jump_height ? `${t.jump_height}cm` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wellness" className="space-y-4 mt-4">
          {isTrainer && <div className="flex justify-end"><button onClick={() => openDialog("wellness")} className="btn-secondary"><Plus size={14} /> Log Invoeren</button></div>}
          <div className="glass p-6">
            <p className="t-label mb-4 flex items-center gap-2"><Heart size={14} /> Belastbaarheidslogboek</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.45)" }}>
                    <th className="text-left py-2">Speelster</th>
                    <th className="text-left py-2">Datum</th>
                    <th className="text-center py-2">Slaap</th>
                    <th className="text-center py-2">Vermoeidheid</th>
                    <th className="text-center py-2">Spierpijn</th>
                  </tr>
                </thead>
                <tbody>
                  {wellness.sort((a, b) => new Date(b.date) - new Date(a.date)).map((w) => (
                    <tr key={w.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                      <td className="py-2 t-card-title">{players.find((p) => p.id === w.player_id)?.name || "-"}</td>
                      <td className="py-2 t-secondary">{format(new Date(w.date), "d MMM", { locale: nl })}</td>
                      <td className="py-2 text-center">{renderScore(w.sleep)}</td>
                      <td className="py-2 text-center">{renderScore(w.fatigue)}</td>
                      <td className="py-2 text-center">{renderScore(w.muscle_pain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" style={{ background: "rgba(20,10,2,0.97)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
          <DialogHeader>
            <DialogTitle className="t-page-title">
              {dialogType === "yoyo" ? "Yo-Yo Test" : dialogType === "physical" ? "Sprint & Sprong Test" : "Belastbaarheid Log"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }}>
                <SelectValue placeholder="Selecteer speelster" />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            {dialogType === "yoyo" && (
              <>
                <Input placeholder="Yo-Yo niveau (bijv. 16.2)" value={form.level || ""} onChange={(e) => setForm({ ...form, level: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
                <Input type="number" placeholder="Afstand (m)" value={form.distance || ""} onChange={(e) => setForm({ ...form, distance: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
              </>
            )}
            {dialogType === "physical" && (
              <>
                <Input type="number" step="0.01" placeholder="Sprint 30m (sec)" value={form.sprint_30m || ""} onChange={(e) => setForm({ ...form, sprint_30m: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
                <Input type="number" placeholder="Sprongkracht (cm)" value={form.jump_height || ""} onChange={(e) => setForm({ ...form, jump_height: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
              </>
            )}
            {dialogType === "wellness" && (
              <>
                {[["sleep","Slaapkwaliteit"],["fatigue","Vermoeidheid"],["muscle_pain","Spierpijn"]].map(([key, label]) => (
                  <div key={key}>
                    <label className="t-label mb-1 block">{label} (1-5)</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map((v) => (
                        <button key={v} onClick={() => setForm({ ...form, [key]: v })} className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
                          style={form[key] === v ? { backgroundColor: '#FF6B00', color: '#fff' } : { background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedPlayer} className="btn-primary">
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderScore(score) {
  if (!score) return <span className="t-tertiary">-</span>;
  const colors = ["", "#f87171", "#fbbf24", "#fbbf24", "#4ade80", "#4ade80"];
  return <span className="font-bold" style={{ color: colors[score] || 'rgba(255,255,255,0.5)' }}>{score}</span>;
}