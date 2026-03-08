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
    match_opponent: "",
    goal_1_rating: "",
    goal_1_notes: "",
    goal_2_rating: "",
    goal_2_notes: "",
    goal_3_rating: "",
    goal_3_notes: "",
    general_notes: "",
  });

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: reflections = [] } = useQuery({ queryKey: ["reflections"], queryFn: () => base44.entities.SelfReflection.list("-date") });

  const activePlayers = players.filter((p) => p.active !== false);

  const selectedPlayerData = activePlayers.find((p) => p.id === selectedPlayer);

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        ...form,
        player_id: selectedPlayer,
        goal_1_rating: form.goal_1_rating ? Number(form.goal_1_rating) : undefined,
        goal_2_rating: form.goal_2_rating ? Number(form.goal_2_rating) : undefined,
        goal_3_rating: form.goal_3_rating ? Number(form.goal_3_rating) : undefined,
      };
      return base44.entities.SelfReflection.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      setDialogOpen(false);
    },
  });

  const filteredReflections = filterPlayer === "all"
    ? reflections
    : reflections.filter((r) => r.player_id === filterPlayer);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Zelfreflectie</h1>
          <p className="text-sm text-[#a0a0a0]">Wekelijkse wedstrijdbeoordeling</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[#FF6B00] hover:bg-[#e06000]">
          <Plus size={16} className="mr-1" /> Nieuwe Reflectie
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filterPlayer} onValueChange={setFilterPlayer}>
          <SelectTrigger className="w-48 bg-[#141414] border-[#333]">
            <SelectValue placeholder="Filter op speelster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle speelsters</SelectItem>
            {activePlayers.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reflections grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReflections.map((r) => {
          const player = players.find((p) => p.id === r.player_id);
          return (
            <div key={r.id} className="elite-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold">{player?.name || "Onbekend"}</p>
                  <p className="text-xs text-[#a0a0a0]">vs. {r.match_opponent || "-"}</p>
                </div>
                <span className="text-xs text-[#666]">{format(new Date(r.date), "d MMM", { locale: nl })}</span>
              </div>

              <div className="space-y-2">
                {r.goal_1_rating && (
                  <GoalRating label={player?.iop_goal_1 || "Doel 1"} rating={r.goal_1_rating} notes={r.goal_1_notes} color="#FF6B00" />
                )}
                {r.goal_2_rating && (
                  <GoalRating label={player?.iop_goal_2 || "Doel 2"} rating={r.goal_2_rating} notes={r.goal_2_notes} color="#1a3a8f" />
                )}
                {r.goal_3_rating && (
                  <GoalRating label={player?.iop_goal_3 || "Doel 3"} rating={r.goal_3_rating} notes={r.goal_3_notes} color="#22c55e" />
                )}
              </div>

              {r.general_notes && (
                <p className="text-xs text-[#666] mt-3 border-t border-[#222] pt-2">{r.general_notes}</p>
              )}
            </div>
          );
        })}
      </div>
      {filteredReflections.length === 0 && (
        <div className="elite-card p-12 text-center">
          <BookOpen size={40} className="text-[#333] mx-auto mb-3" />
          <p className="text-[#666]">Nog geen reflecties ingevoerd</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141414] border-[#222] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe Zelfreflectie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#333]">
                <SelectValue placeholder="Selecteer speelster" />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
              <Input placeholder="Tegenstander" value={form.match_opponent} onChange={(e) => setForm({ ...form, match_opponent: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
            </div>

            {selectedPlayerData && (
              <div className="space-y-4">
                {selectedPlayerData.iop_goal_1 && (
                  <div className="bg-[#0a0a0a] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target size={12} className="text-[#FF6B00]" />
                      <span className="text-xs font-semibold text-[#FF6B00]">{selectedPlayerData.iop_goal_1}</span>
                    </div>
                    <Input type="number" min="1" max="10" placeholder="Score (1-10)" value={form.goal_1_rating} onChange={(e) => setForm({ ...form, goal_1_rating: e.target.value })} className="bg-[#141414] border-[#333]" />
                    <Textarea placeholder="Toelichting..." value={form.goal_1_notes} onChange={(e) => setForm({ ...form, goal_1_notes: e.target.value })} className="bg-[#141414] border-[#333] h-16" />
                  </div>
                )}
                {selectedPlayerData.iop_goal_2 && (
                  <div className="bg-[#0a0a0a] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target size={12} className="text-[#1a3a8f]" />
                      <span className="text-xs font-semibold text-[#1a3a8f]">{selectedPlayerData.iop_goal_2}</span>
                    </div>
                    <Input type="number" min="1" max="10" placeholder="Score (1-10)" value={form.goal_2_rating} onChange={(e) => setForm({ ...form, goal_2_rating: e.target.value })} className="bg-[#141414] border-[#333]" />
                    <Textarea placeholder="Toelichting..." value={form.goal_2_notes} onChange={(e) => setForm({ ...form, goal_2_notes: e.target.value })} className="bg-[#141414] border-[#333] h-16" />
                  </div>
                )}
                {selectedPlayerData.iop_goal_3 && (
                  <div className="bg-[#0a0a0a] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target size={12} className="text-[#22c55e]" />
                      <span className="text-xs font-semibold text-[#22c55e]">{selectedPlayerData.iop_goal_3}</span>
                    </div>
                    <Input type="number" min="1" max="10" placeholder="Score (1-10)" value={form.goal_3_rating} onChange={(e) => setForm({ ...form, goal_3_rating: e.target.value })} className="bg-[#141414] border-[#333]" />
                    <Textarea placeholder="Toelichting..." value={form.goal_3_notes} onChange={(e) => setForm({ ...form, goal_3_notes: e.target.value })} className="bg-[#141414] border-[#333] h-16" />
                  </div>
                )}
              </div>
            )}

            <Textarea placeholder="Algemene notities..." value={form.general_notes} onChange={(e) => setForm({ ...form, general_notes: e.target.value })} className="bg-[#0a0a0a] border-[#333] h-20" />

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedPlayer} className="w-full bg-[#FF6B00] hover:bg-[#e06000]">
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
    <div className="bg-[#0a0a0a] rounded-lg p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs truncate flex-1" style={{ color }}>{label}</span>
        <span className="text-sm font-black ml-2" style={{ color }}>{rating}/10</span>
      </div>
      {notes && <p className="text-[10px] text-[#666] mt-1">{notes}</p>}
    </div>
  );
}