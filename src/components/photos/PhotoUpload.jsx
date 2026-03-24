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
    const compressedFile = new File([compressed], file.name, { type: "image/jpeg" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
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

  const selectStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    color: "#ffffff",
    outline: "none",
  };

  return (
    <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }} className="space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FFD600", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="uploadGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#FF8C3A" />
              </linearGradient>
            </defs>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>Foto Uploaden</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
         <div>
           <label className="t-label mb-1 block text-xs">Datum</label>
           <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
             style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px", fontSize: "12px", padding: "6px 10px" }} />
         </div>
         <div>
           <label className="t-label mb-1 block text-xs">Team</label>
           <select value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} style={{ ...selectStyle, fontSize: "12px", padding: "6px 10px" }}>
             <option value="MO17" style={{ background: "#1c0e04" }}>MO17</option>
             <option value="Dames 1" style={{ background: "#1c0e04" }}>Dames 1</option>
           </select>
         </div>
         <div className="col-span-2 xl:col-span-1">
           <label className="t-label mb-1 block text-xs">Type</label>
           <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...selectStyle, fontSize: "12px", padding: "6px 10px" }}>
             <option value="Training" style={{ background: "#1c0e04" }}>Training</option>
             <option value="Wedstrijd" style={{ background: "#1c0e04" }}>Wedstrijd</option>
           </select>
         </div>
         <div className="col-span-2">
           <label className="t-label mb-1 block text-xs">Label (optioneel)</label>
           <Input
             placeholder={form.type === "Wedstrijd" ? "bijv. AFC" : ""}
             value={form.label}
             onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
             style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px", fontSize: "12px", padding: "6px 10px" }}
           />
         </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current.click()} disabled={uploading} className="btn-primary">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        {uploading ? "Uploaden..." : "Foto kiezen & uploaden"}
      </button>
    </div>
  );
}