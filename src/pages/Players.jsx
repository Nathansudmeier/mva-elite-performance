import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Upload, Target, User, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const POSITIONS = ["Keeper", "Centrale Verdediger", "Linksback", "Rechtsback", "Controleur", "Middenvelder", "Aanvallende Middenvelder", "Linksbuiten", "Rechtsbuiten", "Spits"];

export default function Players() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", position: "", shirt_number: "", iop_goal_1: "", iop_goal_2: "", iop_goal_3: "" });
  const [photoFile, setPhotoFile] = useState(null);

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let photo_url = data.photo_url || "";
      if (photoFile) {
        const res = await base44.integrations.Core.UploadFile({ file: photoFile });
        photo_url = res.file_url;
      }
      const payload = { ...data, photo_url, shirt_number: data.shirt_number ? Number(data.shirt_number) : undefined };
      if (editing) {
        return base44.entities.Player.update(editing.id, payload);
      }
      return base44.entities.Player.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: "", position: "", shirt_number: "", iop_goal_1: "", iop_goal_2: "", iop_goal_3: "" });
      setPhotoFile(null);
    },
  });

  const openEdit = (player) => {
    setEditing(player);
    setForm({
      name: player.name || "",
      position: player.position || "",
      shirt_number: player.shirt_number || "",
      iop_goal_1: player.iop_goal_1 || "",
      iop_goal_2: player.iop_goal_2 || "",
      iop_goal_3: player.iop_goal_3 || "",
      photo_url: player.photo_url || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", position: "", shirt_number: "", iop_goal_1: "", iop_goal_2: "", iop_goal_3: "" });
    setDialogOpen(true);
  };

  const activePlayers = players.filter((p) => p.active !== false);

  const handleQuickPhoto = async (e, player) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;
    const res = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Player.update(player.id, { photo_url: res.file_url });
    queryClient.invalidateQueries({ queryKey: ["players"] });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Speelsters</h1>
          <p className="text-sm text-[#a0a0a0]">{activePlayers.length} speelsters in selectie</p>
        </div>
        <Button onClick={openNew} className="bg-[#FF6B00] hover:bg-[#e06000]">
          <Plus size={16} className="mr-1" /> Toevoegen
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePlayers.map((player) => (
          <Link
            key={player.id}
            to={createPageUrl(`PlayerDetail?id=${player.id}`)}
            className="elite-card elite-card-hover p-4 block"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#222] overflow-hidden flex items-center justify-center text-lg font-bold shrink-0">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-[#666]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {player.shirt_number && (
                    <span className="text-[#FF6B00] font-black text-sm">#{player.shirt_number}</span>
                  )}
                  <h3 className="font-bold text-sm truncate">{player.name}</h3>
                </div>
                <p className="text-xs text-[#a0a0a0] mt-0.5">{player.position || "Geen positie"}</p>
                {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
                  <div className="flex items-center gap-1 mt-2">
                    <Target size={10} className="text-[#1a3a8f]" />
                    <span className="text-[10px] text-[#666]">
                      {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).length} IOP doelen
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => { e.preventDefault(); openEdit(player); }}
                className="p-2 rounded-lg hover:bg-[#222] transition-colors"
              >
                <Edit2 size={14} className="text-[#666]" />
              </button>
            </div>
          </Link>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141414] border-[#222] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Speelster Bewerken" : "Nieuwe Speelster"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Naam"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#0a0a0a] border-[#333]"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#333]">
                  <SelectValue placeholder="Positie" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Rugnummer"
                value={form.shirt_number}
                onChange={(e) => setForm({ ...form, shirt_number: e.target.value })}
                className="bg-[#0a0a0a] border-[#333]"
              />
            </div>
            <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#333] bg-[#0a0a0a] cursor-pointer hover:border-[#FF6B00] transition-colors">
              <Upload size={16} className="text-[#a0a0a0]" />
              <span className="text-sm text-[#a0a0a0]">
                {photoFile ? photoFile.name : "Upload foto"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </label>
            <div className="space-y-2">
              <p className="text-xs text-[#FF6B00] font-semibold uppercase tracking-wider">IOP Doelen</p>
              <Input placeholder="Doel 1" value={form.iop_goal_1} onChange={(e) => setForm({ ...form, iop_goal_1: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
              <Input placeholder="Doel 2" value={form.iop_goal_2} onChange={(e) => setForm({ ...form, iop_goal_2: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
              <Input placeholder="Doel 3" value={form.iop_goal_3} onChange={(e) => setForm({ ...form, iop_goal_3: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
            </div>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.name}
              className="w-full bg-[#FF6B00] hover:bg-[#e06000]"
            >
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}