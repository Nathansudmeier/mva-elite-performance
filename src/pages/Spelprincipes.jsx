import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Plus, BookOpen, Pencil, Trash2, X, ChevronDown, Upload, Video, ImageIcon, Loader2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const CATEGORIES = ["Alle", "Balbezit", "Verdediging", "Omschakeling", "Standaardsituaties", "Algemeen"];
const CATEGORY_COLORS = {
  Balbezit: { bg: "#EFF6FF", text: "#3B82F6", border: "#BFDBFE" },
  Verdediging: { bg: "#FEF2F2", text: "#EF4444", border: "#FECACA" },
  Omschakeling: { bg: "#FFFBEB", text: "#F59E0B", border: "#FDE68A" },
  Standaardsituaties: { bg: "#F5F3FF", text: "#8B5CF6", border: "#DDD6FE" },
  Algemeen: { bg: "#F0FDF4", text: "#10B981", border: "#A7F3D0" },
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

function SpelprincipeModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { title: "", category: "Algemeen", content: "", video_url: "", image_url: "", published: true });
  const [uploading, setUploading] = useState(null); // null | "video" | "image"
  const videoRef = useRef();
  const imageRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(type);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(type === "video" ? "video_url" : "image_url", file_url);
    setUploading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#E8E6E1] shrink-0">
          <h2 className="font-500 text-[#1A1A1A]">{item ? "Bewerken" : "Nieuw spelprincipe"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F7F5F2]"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Titel *</label>
            <input
              className="w-full border border-[#E8E6E1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B00]"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Bijv. Hoog druk zetten"
            />
          </div>
          <div>
            <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Categorie</label>
            <select
              className="w-full border border-[#E8E6E1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B00] bg-white"
              value={form.category}
              onChange={e => set("category", e.target.value)}
            >
              {CATEGORIES.filter(c => c !== "Alle").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Inhoud</label>
            <div className="border border-[#E8E6E1] rounded-xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={v => set("content", v)}
                modules={QUILL_MODULES}
                placeholder="Beschrijf het spelprincipe, voeg kopjes toe..."
              />
            </div>
          </div>

          {/* Video upload */}
          <div>
            <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Video</label>
            {form.video_url ? (
              <div className="flex items-center gap-3 p-3 bg-[#F7F5F2] rounded-xl border border-[#E8E6E1]">
                <Video size={18} className="text-[#FF6B00] shrink-0" />
                <span className="text-sm text-[#1A1A1A] truncate flex-1">Video geüpload</span>
                <button onClick={() => set("video_url", "")} className="p-1 hover:bg-[#E8E6E1] rounded-lg">
                  <X size={14} className="text-[#888888]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoRef.current.click()}
                disabled={!!uploading}
                className="w-full border-2 border-dashed border-[#E8E6E1] rounded-xl py-4 flex flex-col items-center gap-2 hover:border-[#FF6B00] hover:bg-[#FFF3EB] transition-colors"
              >
                {uploading === "video" ? <Loader2 size={20} className="text-[#FF6B00] animate-spin" /> : <Upload size={20} className="text-[#888888]" />}
                <span className="text-sm text-[#888888]">{uploading === "video" ? "Uploaden..." : "Klik om video te uploaden"}</span>
                <span className="text-xs text-[#AAAAAA]">MP4, MOV, AVI</span>
              </button>
            )}
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleUpload(e, "video")} />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Afbeelding</label>
            {form.image_url ? (
              <div className="relative rounded-xl overflow-hidden border border-[#E8E6E1]">
                <img src={form.image_url} alt="preview" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => set("image_url", "")}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg hover:bg-white shadow-sm"
                >
                  <X size={14} className="text-[#888888]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageRef.current.click()}
                disabled={!!uploading}
                className="w-full border-2 border-dashed border-[#E8E6E1] rounded-xl py-4 flex flex-col items-center gap-2 hover:border-[#FF6B00] hover:bg-[#FFF3EB] transition-colors"
              >
                {uploading === "image" ? <Loader2 size={20} className="text-[#FF6B00] animate-spin" /> : <ImageIcon size={20} className="text-[#888888]" />}
                <span className="text-sm text-[#888888]">{uploading === "image" ? "Uploaden..." : "Klik om afbeelding te uploaden"}</span>
                <span className="text-xs text-[#AAAAAA]">JPG, PNG, GIF</span>
              </button>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, "image")} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub" checked={form.published} onChange={e => set("published", e.target.checked)} className="accent-[#FF6B00]" />
            <label htmlFor="pub" className="text-sm text-[#1A1A1A]">Zichtbaar voor spelers</label>
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 border border-[#E8E6E1] rounded-xl py-2.5 text-sm text-[#888888] hover:bg-[#F7F5F2]">Annuleren</button>
          <button
            onClick={() => form.title && onSave(form)}
            className="flex-1 bg-[#FF6B00] text-white rounded-xl py-2.5 text-sm font-500 hover:bg-[#E55A00]"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

function SpelprincipeCard({ item, canEdit, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Algemeen;
  const plainText = item.content?.replace(/<[^>]+>/g, "") || "";
  const isLong = plainText.length > 200;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="inline-block text-xs font-500 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            {item.category}
          </span>
          {canEdit && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-[#FFF3EB] text-[#888888] hover:text-[#FF6B00]"><Pencil size={14} /></button>
              <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-[#FFF0F0] text-[#888888] hover:text-[#C0392B]"><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        <h3 className="font-600 text-[#1A1A1A] text-lg mb-3">{item.title}</h3>

        {item.content && (
          <div>
            <div
              className={`prose prose-sm max-w-none text-[#555555] ${!expanded && isLong ? "line-clamp-4" : ""}`}
              style={{ fontSize: 14, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
            {isLong && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#FF6B00] mt-2 flex items-center gap-1 font-500">
                {expanded ? "Minder tonen" : "Alles lezen"}
                <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {item.video_url && (
        <div className="border-t border-[#E8E6E1]">
          <video
            src={item.video_url}
            controls
            className="w-full max-h-64 bg-black"
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}

export default function Spelprincipes() {
  const { isTrainer, user } = useCurrentUser();
  const canEdit = isTrainer || user?.role === "admin";
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [modal, setModal] = useState(null); // null | "new" | item
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["spelprincipes"],
    queryFn: () => base44.entities.Spelprincipe.list("-created_date", 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Spelprincipe.create(data),
    onSuccess: () => { qc.invalidateQueries(["spelprincipes"]); setModal(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }) => base44.entities.Spelprincipe.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["spelprincipes"]); setModal(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Spelprincipe.delete(id),
    onSuccess: () => qc.invalidateQueries(["spelprincipes"]),
  });

  const handleSave = (form) => {
    if (modal?.id) updateMut.mutate({ id: modal.id, ...form });
    else createMut.mutate(form);
  };

  const visible = items.filter(i => {
    if (!canEdit && !i.published) return false;
    if (activeCategory !== "Alle" && i.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-500 text-[#1A1A1A]">Spelprincipes</h1>
          <p className="text-sm text-[#888888] mt-0.5">Onze manier van voetballen</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModal("new")}
            className="flex items-center gap-2 bg-[#FF6B00] text-white rounded-xl px-4 py-2.5 text-sm font-500 hover:bg-[#E55A00]"
          >
            <Plus size={16} /> Toevoegen
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-500 border transition-colors ${
              activeCategory === cat
                ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                : "bg-white text-[#888888] border-[#E8E6E1] hover:border-[#FF6B00] hover:text-[#FF6B00]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E8E6E1]">
          <BookOpen size={32} className="mx-auto text-[#E8E6E1] mb-3" />
          <p className="text-[#888888] text-sm">Nog geen spelprincipes toegevoegd.</p>
          {canEdit && <p className="text-xs text-[#AAAAAA] mt-1">Klik op "Toevoegen" om te beginnen.</p>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map(item => (
            <SpelprincipeCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              onEdit={(i) => setModal(i)}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <SpelprincipeModal
          item={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}