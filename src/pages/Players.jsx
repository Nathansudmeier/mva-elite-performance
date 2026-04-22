import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import RoleGuard from "@/components/auth/RoleGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Upload, Target, User, Camera, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { resizeImage } from "@/components/utils/imageResize";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { PLAYER_FALLBACK_PHOTO } from "@/lib/playerFallback";

const POSITIONS = ["Keeper", "Centrale Verdediger", "Linksback", "Rechtsback", "Controleur", "Middenvelder", "Aanvallende Middenvelder", "Linksbuiten", "Rechtsbuiten", "Spits"];

export default function Players() {
  return <RoleGuard allowedRoles={["trainer", "speelster"]}><PlayersContent /></RoleGuard>;
}

function PlayersContent() {
  const queryClient = useQueryClient();
  const { user, playerId, isTrainer } = useCurrentUser();
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

  const handleExportCSV = () => {
    const rows = [["Nummer", "Naam", "Positie", "Geboortedatum"]];
    activePlayers.forEach((p) => {
      rows.push([p.shirt_number || "", p.name || "", p.position || "", p.birth_date || ""]);
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speelsters.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const activePlayers = players.filter((p) => p.active !== false);
  const displayPlayers = isTrainer ? activePlayers : activePlayers.filter(p => p.id === playerId);

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
    <div>
      <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Speelsters</h1>
          <p className="t-secondary">{isTrainer ? activePlayers.length : displayPlayers.length} speelsters</p>
        </div>
        {isTrainer && (
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="btn-secondary">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={openNew} className="btn-secondary">
              <Plus size={14} /> Toevoegen
            </button>
          </div>
        )}
      </div>

      {!isTrainer && displayPlayers.length === 0 ? (
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "2rem", textAlign: "center" }}>
        <User size={32} style={{ color: "rgba(26,26,26,0.20)", margin: "0 auto 8px" }} />
        <p style={{ fontSize: 13, color: "rgba(26,26,26,0.40)" }}>Je profielpagina is nog niet beschikbaar.</p>
      </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayPlayers.map((player) => (
        <Link key={player.id} to={createPageUrl(`PlayerDetail?id=${player.id}`)}
          style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", display: "block", textDecoration: "none", transition: "opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 14 }}>
            <label
              onClick={(e) => e.stopPropagation()}
              style={{ position: "relative", width: 56, height: 56, borderRadius: 14, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", background: "rgba(255,104,0,0.10)", border: "2px solid #1a1a1a" }}
            >
              <img src={player.photo_url || PLAYER_FALLBACK_PHOTO} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, background: "rgba(0,0,0,0.40)", transition: "opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                <Camera size={14} color="#ffffff" />
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleQuickPhoto(e, player)} />
            </label>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {player.shirt_number && <span style={{ fontSize: 11, fontWeight: 800, color: "#FF6800" }}>#{player.shirt_number}</span>}
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</h3>
              </div>
              <p style={{ fontSize: 12, color: "rgba(26,26,26,0.55)", marginTop: 2 }}>{player.position || "Geen positie"}</p>
              {(player.iop_goal_1 || player.iop_goal_2 || player.iop_goal_3) && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Target size={10} style={{ color: "#FF6800" }} />
                  <span style={{ fontSize: 10, color: "rgba(26,26,26,0.45)", fontWeight: 700 }}>
                    {[player.iop_goal_1, player.iop_goal_2, player.iop_goal_3].filter(Boolean).length} IOP doelen
                  </span>
                </div>
              )}
            </div>
            {isTrainer && (
              <button onClick={(e) => { e.preventDefault(); openEdit(player); }}
                style={{ padding: "6px", borderRadius: 10, background: "rgba(26,26,26,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Edit2 size={14} style={{ color: "rgba(26,26,26,0.45)" }} />
              </button>
            )}
          </div>
        </Link>
        ))}
      </div>
      )}

      {isTrainer && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 20 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 900, color: "#1a1a1a" }}>{editing ? "Speelster Bewerken" : "Nieuwe Speelster"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "10px" }} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "10px" }}>
                  <SelectValue placeholder="Positie" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Rugnummer" value={form.shirt_number} onChange={(e) => setForm({ ...form, shirt_number: e.target.value })} style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "10px" }} />
            </div>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer" style={{ border: "2px dashed rgba(26,26,26,0.25)", background: "rgba(26,26,26,0.04)" }}>
              <Upload size={16} style={{ color: "#FF6800" }} />
              <span style={{ fontSize: 13, color: "rgba(26,26,26,0.55)" }}>{photoFile ? photoFile.name : "Upload foto"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </label>
            <div className="space-y-2">
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)" }}>IOP Doelen</p>
              <Input placeholder="Doel 1" value={form.iop_goal_1} onChange={(e) => setForm({ ...form, iop_goal_1: e.target.value })} style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "10px" }} />
              <Input placeholder="Doel 2" value={form.iop_goal_2} onChange={(e) => setForm({ ...form, iop_goal_2: e.target.value })} style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "10px" }} />
              <Input placeholder="Doel 3" value={form.iop_goal_3} onChange={(e) => setForm({ ...form, iop_goal_3: e.target.value })} style={{ background: "#ffffff", border: "2px solid #1a1a1a", color: "#1a1a1a", borderRadius: "10px" }} />
            </div>
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name} className="btn-primary">
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      )}
      </div>
    </div>
    );
  }