import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, BookOpen, Target } from "lucide-react";

export default function SelfReflection() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    match_opponent: "", goal_1_rating: "", goal_1_notes: "",
    goal_2_rating: "", goal_2_notes: "", goal_3_rating: "", goal_3_notes: "", general_notes: "",
  });

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: reflections = [] } = useQuery({ queryKey: ["reflections"], queryFn: () => base44.entities.SelfReflection.list("-date") });

  const activePlayers = players.filter((p) => p.active !== false);
  const selectedPlayerData = activePlayers.find((p) => p.id === selectedPlayer);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.SelfReflection.create({
      ...form, player_id: selectedPlayer,
      goal_1_rating: form.goal_1_rating ? Number(form.goal_1_rating) : undefined,
      goal_2_rating: form.goal_2_rating ? Number(form.goal_2_rating) : undefined,
      goal_3_rating: form.goal_3_rating ? Number(form.goal_3_rating) : undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["reflections"] }); setDialogOpen(false); },
  });

  const filteredReflections = filterPlayer === "all" ? reflections : reflections.filter((r) => r.player_id === filterPlayer);

  const goalColors = ['#D45A30', '#1A1F2E', '#4CAF82'];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Zelfreflectie</h1>
          <p className="text-sm text-white/70">Wekelijkse wedstrijdbeoordeling</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
          <Plus size={16} className="mr-1" /> Nieuwe Reflectie
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterPlayer} onValueChange={setFilterPlayer}>
          <SelectTrigger className="w-48 border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFF5F0' }}>
            <SelectValue placeholder="Filter op speelster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle speelsters</SelectItem>
            {activePlayers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReflections.map((r) => {
          const player = players.find((p) => p.id === r.player_id);
          return (
            <div key={r.id} className="elite-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-[#1A1F2E]">{player?.name || "Onbekend"}</p>
                  <p className="text-xs" style={{ color: '#2F3650' }}>vs. {r.match_opponent || "-"}</p>
                </div>
                <span className="text-xs" style={{ color: '#2F3650' }}>{format(new Date(r.date), "d MMM", { locale: nl })}</span>
              </div>
              <div className="space-y-2">
                {r.goal_1_rating && <GoalRating label={player?.iop_goal_1 || "Doel 1"} rating={r.goal_1_rating} notes={r.goal_1_notes} color={goalColors[0]} />}
                {r.goal_2_rating && <GoalRating label={player?.iop_goal_2 || "Doel 2"} rating={r.goal_2_rating} notes={r.goal_2_notes} color={goalColors[1]} />}
                {r.goal_3_rating && <GoalRating label={player?.iop_goal_3 || "Doel 3"} rating={r.goal_3_rating} notes={r.goal_3_notes} color={goalColors[2]} />}
              </div>
              {r.general_notes && (
                <p className="text-xs mt-3 border-t border-[#FDE8DC] pt-2" style={{ color: '#2F3650' }}>{r.general_notes}</p>
              )}
            </div>
          );
        })}
      </div>
      {filteredReflections.length === 0 && (
        <div className="elite-card p-12 text-center">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: '#FDE8DC' }} />
          <p style={{ color: '#2F3650' }}>Nog geen reflecties ingevoerd</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-[#FDE8DC]" style={{ backgroundColor: '#FFF5F0', color: '#1A1F2E' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1F2E' }}>Nieuwe Zelfreflectie</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
              <Input placeholder="Tegenstander" value={form.match_opponent} onChange={(e) => setForm({ ...form, match_opponent: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
            </div>

            {selectedPlayerData && (
              <div className="space-y-4">
                {[[selectedPlayerData.iop_goal_1,'goal_1_rating','goal_1_notes',goalColors[0]],
                  [selectedPlayerData.iop_goal_2,'goal_2_rating','goal_2_notes',goalColors[1]],
                  [selectedPlayerData.iop_goal_3,'goal_3_rating','goal_3_notes',goalColors[2]]].map(([goal, ratingKey, notesKey, color]) => goal && (
                  <div key={ratingKey} className="rounded-lg p-3 space-y-2 border border-[#FDE8DC]" style={{ backgroundColor: '#FFFFFF' }}>
                    <div className="flex items-center gap-2">
                      <Target size={12} style={{ color }} />
                      <span className="text-xs font-semibold" style={{ color }}>{goal}</span>
                    </div>
                    <Input type="number" min="1" max="10" placeholder="Score (1-10)" value={form[ratingKey]} onChange={(e) => setForm({ ...form, [ratingKey]: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFF5F0' }} />
                    <Textarea placeholder="Toelichting..." value={form[notesKey]} onChange={(e) => setForm({ ...form, [notesKey]: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E] h-16" style={{ backgroundColor: '#FFF5F0' }} />
                  </div>
                ))}
              </div>
            )}

            <Textarea placeholder="Algemene notities..." value={form.general_notes} onChange={(e) => setForm({ ...form, general_notes: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E] h-20" style={{ backgroundColor: '#FFFFFF' }} />
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedPlayer} className="w-full text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalRating({ label, rating, notes, color }) {
  return (
    <div className="rounded-lg p-2.5" style={{ backgroundColor: '#FDE8DC' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs truncate flex-1" style={{ color }}>{label}</span>
        <span className="text-sm font-black ml-2" style={{ color }}>{rating}/10</span>
      </div>
      {notes && <p className="text-[10px] mt-1" style={{ color: '#2F3650' }}>{notes}</p>}
    </div>
  );
}