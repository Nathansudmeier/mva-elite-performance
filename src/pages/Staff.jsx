import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import RoleGuard from "@/components/auth/RoleGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Upload, User, Camera, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { resizeImage } from "@/components/utils/imageResize";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

export default function Staff() {
  return <RoleGuard allowedRoles={["trainer", "speelster", "admin"]}><StaffContent /></RoleGuard>;
}

function StaffContent() {
  const queryClient = useQueryClient();
  const { isTrainer } = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", role_title: "", phone: "", email: "", photo_url: "" });
  const [photoFile, setPhotoFile] = useState(null);

  const { data: trainers = [] } = useQuery({
    queryKey: ["trainers"],
    queryFn: () => base44.entities.Trainer.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let photo_url = data.photo_url || "";
      if (photoFile) {
        const resized = await resizeImage(photoFile);
        const res = await base44.integrations.Core.UploadFile({ file: resized });
        photo_url = res.file_url;
      }
      const payload = { ...data, photo_url };
      if (editing) return base44.entities.Trainer.update(editing.id, payload);
      return base44.entities.Trainer.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: "", role_title: "", phone: "", email: "", photo_url: "" });
      setPhotoFile(null);
    },
  });

  const openEdit = (trainer) => {
    setEditing(trainer);
    setPhotoFile(null);
    setForm({
      name: trainer.name || "",
      role_title: trainer.role_title || "",
      phone: trainer.phone || "",
      email: trainer.email || "",
      photo_url: trainer.photo_url || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", role_title: "", phone: "", email: "", photo_url: "" });
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const handleQuickPhoto = async (e, trainer) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;
    const resized = await resizeImage(file);
    const res = await base44.integrations.Core.UploadFile({ file: resized });
    await base44.entities.Trainer.update(trainer.id, { photo_url: res.file_url });
    queryClient.invalidateQueries({ queryKey: ["trainers"] });
  };

  const activeTrainers = trainers.filter(t => t.active !== false);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Staff</h1>
          <p className="t-secondary">{activeTrainers.length} stafleden</p>
        </div>
        {isTrainer && (
          <button onClick={openNew} className="btn-secondary">
            <Plus size={14} /> Toevoegen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTrainers.map((trainer) => (
          <Link key={trainer.id} to={createPageUrl(`TrainerDetail?id=${trainer.id}`)} className="glass block transition-opacity hover:opacity-80">
            <div className="flex items-start gap-4 p-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.10)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
                {trainer.photo_url ? (
                  <img src={trainer.photo_url} alt={trainer.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={22} style={{ color: "#FF8C3A" }} />
                )}
                {isTrainer && (
                  <div
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.querySelector('input').click(); }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40 cursor-pointer"
                  >
                    <Camera size={14} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { e.stopPropagation(); handleQuickPhoto(e, trainer); }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="t-card-title truncate">{trainer.name}</h3>
                {trainer.role_title && <p className="t-secondary-sm mt-0.5" style={{ color: "#FF8C3A" }}>{trainer.role_title}</p>}
                {!isTrainer && trainer.phone && <p className="t-tertiary flex items-center gap-1 mt-1"><Phone size={10} /> {trainer.phone}</p>}
                {!isTrainer && trainer.email && <p className="t-tertiary flex items-center gap-1 mt-1"><Mail size={10} /> {trainer.email}</p>}
              </div>
              {isTrainer && (
                <button onClick={(e) => { e.preventDefault(); openEdit(trainer); }} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Edit2 size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>

      {activeTrainers.length === 0 && (
        <div className="glass p-8 text-center">
          <User size={32} className="mx-auto mb-2 ic-muted" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="t-tertiary">Nog geen stafleden toegevoegd.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" style={{ background: "rgba(20,10,2,0.97)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
          <DialogHeader>
            <DialogTitle className="t-page-title">{editing ? "Staflid Bewerken" : "Nieuw Staflid"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Naam *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <Input placeholder="Functietitel (bijv. Hoofdtrainer, Assistent)" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <Input placeholder="Telefoonnummer" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <Input placeholder="E-mailadres" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer" style={{ border: "1px dashed rgba(255,107,0,0.5)", background: "rgba(255,107,0,0.08)" }}>
              <Upload size={16} style={{ color: "#FF8C3A" }} />
              <span className="t-secondary">{photoFile ? photoFile.name : "Upload foto"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </label>
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name} className="btn-primary">
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}