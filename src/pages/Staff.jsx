import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import RoleGuard from "@/components/auth/RoleGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Upload, User, Camera, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { resizeImage } from "@/components/utils/imageResize";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

export default function Staff() {
  return <RoleGuard allowedRoles={["trainer", "speelster", "admin"]}><StaffContent /></RoleGuard>;
}

function StaffContent() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", role_title: "", phone: "", photo_url: "" });
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
      setForm({ name: "", role_title: "", phone: "", photo_url: "" });
      setPhotoFile(null);
    },
  });

  const openEdit = (trainer) => {
    setEditing(trainer);
    setForm({
      name: trainer.name || "",
      role_title: trainer.role_title || "",
      phone: trainer.phone || "",
      photo_url: trainer.photo_url || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", role_title: "", phone: "", photo_url: "" });
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
          <h1 className="text-2xl font-500 text-[#FF6B00]">Staff</h1>
          <p className="text-sm text-[#888888]">{activeTrainers.length} stafleden</p>
        </div>
        <Button onClick={openNew} className="bg-[#FF6B00] hover:bg-[#E55A00] text-white">
          <Plus size={16} className="mr-1" /> Toevoegen
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTrainers.map((trainer) => (
          <Link key={trainer.id} to={createPageUrl(`TrainerDetail?id=${trainer.id}`)} className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm hover:shadow-md transition-shadow block">
            <div className="flex items-start gap-4">
              <label
                onClick={(e) => e.preventDefault()}
                className="relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group bg-[#1A1A1A]"
              >
                {trainer.photo_url ? (
                  <img src={trainer.photo_url} alt={trainer.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-[#FF6B00]" />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Camera size={16} className="text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { e.stopPropagation(); handleQuickPhoto(e, trainer); }} />
              </label>
              <div className="flex-1 min-w-0">
                <h3 className="font-500 text-sm text-[#1A1A1A] truncate">{trainer.name}</h3>
                {trainer.role_title && (
                  <p className="text-xs mt-0.5 text-[#FF6B00]">{trainer.role_title}</p>
                )}
                {trainer.phone && (
                  <p className="text-xs mt-1 text-[#888888] flex items-center gap-1">
                    <Phone size={10} /> {trainer.phone}
                  </p>
                )}
              </div>
              <button onClick={(e) => { e.preventDefault(); openEdit(trainer); }} className="p-2 rounded-lg transition-colors hover:bg-[#FFF3EB]">
                <Edit2 size={14} className="text-[#888888]" />
              </button>
            </div>
          </Link>
        ))}
      </div>

      {activeTrainers.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#E8E6E1] text-center">
          <User size={32} className="text-[#E8E6E1] mx-auto mb-2" />
          <p className="text-sm text-[#888888]">Nog geen stafleden toegevoegd.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-[#E8E6E1] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">{editing ? "Staflid Bewerken" : "Nieuw Staflid"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Naam *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-[#E8E6E1] text-[#1A1A1A] bg-white"
            />
            <Input
              placeholder="Functietitel (bijv. Hoofdtrainer, Assistent)"
              value={form.role_title}
              onChange={(e) => setForm({ ...form, role_title: e.target.value })}
              className="border-[#E8E6E1] text-[#1A1A1A] bg-white"
            />
            <Input
              placeholder="Telefoonnummer"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border-[#E8E6E1] text-[#1A1A1A] bg-white"
            />
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#FF6B00] cursor-pointer bg-[#FFF3EB]">
              <Upload size={16} className="text-[#FF6B00]" />
              <span className="text-sm text-[#888888]">{photoFile ? photoFile.name : "Upload foto"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </label>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.name}
              className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-white"
            >
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}