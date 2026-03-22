import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import RoleGuard from "@/components/auth/RoleGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Upload, Target, User, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { resizeImage } from "@/components/utils/imageResize";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

const POSITIONS = ["Keeper", "Centrale Verdediger", "Linksback", "Rechtsback", "Controleur", "Middenvelder", "Aanvallende Middenvelder", "Linksbuiten", "Rechtsbuiten", "Spits"];

export default function Players() {
  return <RoleGuard allowedRoles={["trainer", "speelster"]}><PlayersContent /></RoleGuard>;
}

function PlayersContent() {
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
        const resized = await resizeImage(photoFile);
        const res = await base44.integrations.Core.UploadFile({ file: resized });
        photo_url = res.file_url;
      }
      const payload = { ...data, photo_url, shirt_number: data.shirt_number ? Number(data.shirt_number) : undefined };
      if (editing) return base44.entities.Player.update(editing.id, payload);
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
    setForm({ name: player.name || "", position: player.position || "", shirt_number: player.shirt_number || "", iop_goal_1: player.iop_goal_1 || "", iop_goal_2: player.iop_goal_2 || "", iop_goal_3: player.iop_goal_3 || "", photo_url: player.photo_url || "" });
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
    const resized = await resizeImage(file);
    const res = await base44.integrations.Core.UploadFile({ file: resized });
    await base44.entities.Player.update(player.id, { photo_url: res.file_url });
    queryClient.invalidateQueries({ queryKey: ["players"] });
  };

  return (
    <div className="relative">
      {/* Background image — fixed */}
      <img
        src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png"
        alt=""
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
        }}
      />

      <div className="space-y-6 pb-20 lg:pb-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Speelsters</h1>
          <p className="t-secondary">{activePlayers.length} speelsters in selectie</p>
        </div>
        <button onClick={openNew} className="btn-secondary">
          <Plus size={14} /> Toevoegen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePlayers.map((player) => (
          <Link key={player.id} to={createPageUrl(`PlayerDetail?id=${player.id}`)} className="glass block transition-opacity hover:opacity-80">
            <div className="flex items-start gap-4 p-4">
              <label
                onClick={(e) => e.stopPropagation()}
                className="relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group"
                style={{ background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.3)" }}
              >
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={22} style={{ color: "#FF8C3A" }} />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Camera size={14} className="text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickPhoto(e, player)} />
              </label>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {player.shirt_number && <span className="t-secondary" style={{ color: "#FF8C3A" }}>#{player.shirt_number}</span>}
                  <h3 className="t-card-title truncate">{player.name}</h3>
                </div>
                <p className="t-secondary-sm mt-0.5">{player.position || "Geen positie"}</p>
                {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
                  <div className="flex items-center gap-1 mt-2">
                    <Target size={10} style={{ color: "#FF8C3A" }} />
                    <span className="t-tertiary">
                      {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).length} IOP doelen
                    </span>
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.preventDefault(); openEdit(player); }} className="p-2 rounded-lg transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
                <Edit2 size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>
          </Link>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" style={{ background: "rgba(20,10,2,0.97)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
          <DialogHeader>
            <DialogTitle className="t-page-title">{editing ? "Speelster Bewerken" : "Nieuwe Speelster"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }}>
                  <SelectValue placeholder="Positie" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Rugnummer" value={form.shirt_number} onChange={(e) => setForm({ ...form, shirt_number: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            </div>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer" style={{ border: "1px dashed rgba(255,107,0,0.5)", background: "rgba(255,107,0,0.08)" }}>
              <Upload size={16} style={{ color: "#FF8C3A" }} />
              <span className="t-secondary">{photoFile ? photoFile.name : "Upload foto"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </label>
            <div className="space-y-2">
              <p className="t-label">IOP Doelen</p>
              <Input placeholder="Doel 1" value={form.iop_goal_1} onChange={(e) => setForm({ ...form, iop_goal_1: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
              <Input placeholder="Doel 2" value={form.iop_goal_2} onChange={(e) => setForm({ ...form, iop_goal_2: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
              <Input placeholder="Doel 3" value={form.iop_goal_3} onChange={(e) => setForm({ ...form, iop_goal_3: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            </div>
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name} className="btn-primary">
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      </div>
      );
      }