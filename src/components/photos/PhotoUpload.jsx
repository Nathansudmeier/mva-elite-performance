import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const MAX_WIDTH = 800;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ onSaved }) {
  const { user } = useCurrentUser();
  const fileRef = useRef();
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Training",
    label: "",
    team: "MO17",
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const compressed = await compressImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
    await base44.entities.TeamPhoto.create({
      photo_url: file_url,
      date: form.date,
      type: form.type,
      label: form.label || form.type,
      team: form.team,
      uploaded_by: user?.email || "",
    });
    setUploading(false);
    fileRef.current.value = "";
    if (onSaved) onSaved();
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm space-y-3">
      <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00]">📤 Foto Uploaden</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Datum</label>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="border-[#E8E6E1]" />
        </div>
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Team</label>
          <select
            value={form.team}
            onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
            className="w-full border border-[#E8E6E1] rounded-md px-3 py-2 text-sm text-[#1A1A1A] bg-white"
          >
            <option value="MO17">MO17</option>
            <option value="Dames 1">Dames 1</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full border border-[#E8E6E1] rounded-md px-3 py-2 text-sm text-[#1A1A1A] bg-white"
          >
            <option value="Training">Training</option>
            <option value="Wedstrijd">Wedstrijd</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Label (optioneel)</label>
          <Input
            placeholder={form.type === "Wedstrijd" ? "bijv. AFC" : ""}
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            className="border-[#E8E6E1]"
          />
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => fileRef.current.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
        style={{ background: uploading ? "#CCAA88" : "#FF6B00" }}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        {uploading ? "Uploaden..." : "Foto kiezen & uploaden"}
      </button>
    </div>
  );
}