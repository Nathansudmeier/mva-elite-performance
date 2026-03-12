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

export default function PhysicalMonitor() {
  const queryClient = useQueryClient();
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

  const chartTooltipStyle = { backgroundColor: '#FFF5F0', border: '1px solid #FDE8DC', borderRadius: 8, color: '#1A1F2E' };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Fysieke Monitor</h1>
          <p className="text-sm text-white/70">Yo-Yo, Sprint, Sprongkracht & Belastbaarheid</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="border border-[#FDE8DC]" style={{ backgroundColor: '#FFF5F0' }}>
          <TabsTrigger value="yoyo" className="data-[state=active]:text-white" style={{ '--tw-active-bg': '#1A1F2E' }} data-state={tab === 'yoyo' ? 'active' : undefined}>
            <span style={tab === 'yoyo' ? { backgroundColor: '#1A1F2E', color: '#fff', borderRadius: '0.375rem', padding: '0.25rem 0.75rem' } : { color: '#2F3650' }}>Yo-Yo Test</span>
          </TabsTrigger>
          <TabsTrigger value="physical">
            <span style={tab === 'physical' ? { backgroundColor: '#1A1F2E', color: '#fff', borderRadius: '0.375rem', padding: '0.25rem 0.75rem' } : { color: '#2F3650' }}>Sprint & Sprong</span>
          </TabsTrigger>
          <TabsTrigger value="wellness">
            <span style={tab === 'wellness' ? { backgroundColor: '#1A1F2E', color: '#fff', borderRadius: '0.375rem', padding: '0.25rem 0.75rem' } : { color: '#2F3650' }}>Belastbaarheid</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yoyo" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => openDialog("yoyo")} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              <Plus size={16} className="mr-1" /> Yo-Yo Test
            </Button>
          </div>
          <div className="elite-card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-[#1A1F2E]">
              <Activity size={18} style={{ color: '#D45A30' }} /> Huidig Yo-Yo Niveau
            </h2>
            <div className="space-y-2">
              {yoyoByPlayer.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-sm w-20 truncate text-[#1A1F2E]">{p.name}</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: '#FDE8DC' }}>
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 text-white"
                      style={{ width: `${Math.min((p.level / 23) * 100, 100)}%`, background: 'linear-gradient(90deg,#1A1F2E,#D45A30)' }}
                    >
                      <span className="text-[10px] font-bold">{p.level || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {yoyoProgression.length > 0 && (
            <div className="elite-card p-6">
              <h2 className="font-bold mb-4 text-[#1A1F2E]">Yo-Yo Progressie</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yoyoProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FDE8DC" />
                    <XAxis dataKey="date" tick={{ fill: '#2F3650', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#2F3650', fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="level" stroke="#D45A30" strokeWidth={2} dot={{ fill: '#D45A30', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="physical" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => openDialog("physical")} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              <Plus size={16} className="mr-1" /> Test Invoeren
            </Button>
          </div>
          <div className="elite-card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-[#1A1F2E]">
              <Timer size={18} style={{ color: '#1A1F2E' }} /> Sprint & Sprongkracht Resultaten
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#FDE8DC]" style={{ color: '#2F3650' }}>
                    <th className="text-left py-2">Speelster</th>
                    <th className="text-left py-2">Datum</th>
                    <th className="text-right py-2">Sprint 30m</th>
                    <th className="text-right py-2">Sprongkracht</th>
                  </tr>
                </thead>
                <tbody>
                  {physicalTests.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                    <tr key={t.id} className="border-b border-[#FDE8DC]">
                      <td className="py-2 font-medium text-[#1A1F2E]">{players.find((p) => p.id === t.player_id)?.name || "-"}</td>
                      <td className="py-2" style={{ color: '#2F3650' }}>{format(new Date(t.date), "d MMM", { locale: nl })}</td>
                      <td className="py-2 text-right font-bold" style={{ color: '#D45A30' }}>{t.sprint_30m ? `${t.sprint_30m}s` : "-"}</td>
                      <td className="py-2 text-right font-bold" style={{ color: '#1A1F2E' }}>{t.jump_height ? `${t.jump_height}cm` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wellness" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => openDialog("wellness")} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              <Plus size={16} className="mr-1" /> Log Invoeren
            </Button>
          </div>
          <div className="elite-card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-[#1A1F2E]">
              <Heart size={18} style={{ color: '#C0392B' }} /> Belastbaarheidslogboek
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#FDE8DC]" style={{ color: '#2F3650' }}>
                    <th className="text-left py-2">Speelster</th>
                    <th className="text-left py-2">Datum</th>
                    <th className="text-center py-2">Slaap</th>
                    <th className="text-center py-2">Vermoeidheid</th>
                    <th className="text-center py-2">Spierpijn</th>
                  </tr>
                </thead>
                <tbody>
                  {wellness.sort((a, b) => new Date(b.date) - new Date(a.date)).map((w) => (
                    <tr key={w.id} className="border-b border-[#FDE8DC]">
                      <td className="py-2 font-medium text-[#1A1F2E]">{players.find((p) => p.id === w.player_id)?.name || "-"}</td>
                      <td className="py-2" style={{ color: '#2F3650' }}>{format(new Date(w.date), "d MMM", { locale: nl })}</td>
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
        <DialogContent className="max-w-sm border-[#FDE8DC]" style={{ backgroundColor: '#FFF5F0', color: '#1A1F2E' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1F2E' }}>
              {dialogType === "yoyo" ? "Yo-Yo Test" : dialogType === "physical" ? "Sprint & Sprong Test" : "Belastbaarheid Log"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }}>
                <SelectValue placeholder="Selecteer speelster" />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />

            {dialogType === "yoyo" && (
              <>
                <Input placeholder="Yo-Yo niveau (bijv. 16.2)" value={form.level || ""} onChange={(e) => setForm({ ...form, level: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
                <Input type="number" placeholder="Afstand (m)" value={form.distance || ""} onChange={(e) => setForm({ ...form, distance: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
              </>
            )}
            {dialogType === "physical" && (
              <>
                <Input type="number" step="0.01" placeholder="Sprint 30m (sec)" value={form.sprint_30m || ""} onChange={(e) => setForm({ ...form, sprint_30m: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
                <Input type="number" placeholder="Sprongkracht (cm)" value={form.jump_height || ""} onChange={(e) => setForm({ ...form, jump_height: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
              </>
            )}
            {dialogType === "wellness" && (
              <>
                {[["sleep","Slaapkwaliteit"],["fatigue","Vermoeidheid"],["muscle_pain","Spierpijn"]].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs mb-1 block font-medium" style={{ color: '#2F3650' }}>{label} (1-5)</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map((v) => (
                        <button key={v} onClick={() => setForm({ ...form, [key]: v })}
                          className="w-10 h-10 rounded-lg font-bold text-sm transition-all"
                          style={form[key] === v ? { backgroundColor: '#D45A30', color: '#fff' } : { backgroundColor: '#FDE8DC', color: '#1A1F2E' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedPlayer} className="w-full text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderScore(score) {
  if (!score) return <span style={{ color: '#2F3650' }}>-</span>;
  const colors = ["", "#C0392B", "#F0926E", "#eab308", "#4CAF82", "#10b981"];
  return <span className="font-bold" style={{ color: colors[score] || '#2F3650' }}>{score}</span>;
}