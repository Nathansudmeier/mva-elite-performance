import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Plus, Youtube, BookOpen, Pencil, Trash2, X, ChevronDown } from "lucide-react";

const CATEGORIES = ["Alle", "Balbezit", "Verdediging", "Omschakeling", "Standaardsituaties", "Algemeen"];
const CATEGORY_COLORS = {
  Balbezit: { bg: "#EFF6FF", text: "#3B82F6", border: "#BFDBFE" },
  Verdediging: { bg: "#FEF2F2", text: "#EF4444", border: "#FECACA" },
  Omschakeling: { bg: "#FFFBEB", text: "#F59E0B", border: "#FDE68A" },
  Standaardsituaties: { bg: "#F5F3FF", text: "#8B5CF6", border: "#DDD6FE" },
  Algemeen: { bg: "#F0FDF4", text: "#10B981", border: "#A7F3D0" },
};

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function SpelprincipeModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { title: "", category: "Algemeen", content: "", video_url: "", published: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-[#E8E6E1]">
          <h2 className="font-500 text-[#1A1A1A]">{item ? "Bewerken" : "Nieuw spelprincipe"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F7F5F2]"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
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
            <textarea
              className="w-full border border-[#E8E6E1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
              rows={5}
              value={form.content}
              onChange={e => set("content", e.target.value)}
              placeholder="Beschrijf het spelprincipe..."
            />
          </div>
          <div>
            <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Video URL (YouTube/VEO)</label>
            <input
              className="w-full border border-[#E8E6E1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B00]"
              value={form.video_url}
              onChange={e => set("video_url", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub" checked={form.published} onChange={e => set("published", e.target.checked)} className="accent-[#FF6B00]" />
            <label htmlFor="pub" className="text-sm text-[#1A1A1A]">Zichtbaar voor spelers</label>
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-3">
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
  const embedUrl = getYouTubeEmbedUrl(item.video_url);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span
              className="inline-block text-xs font-500 px-2 py-0.5 rounded-full mb-2"
              style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              {item.category}
            </span>
            <h3 className="font-500 text-[#1A1A1A] text-base">{item.title}</h3>
          </div>
          {canEdit && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-[#FFF3EB] text-[#888888] hover:text-[#FF6B00]"><Pencil size={14} /></button>
              <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-[#FFF0F0] text-[#888888] hover:text-[#C0392B]"><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        {item.content && (
          <div className="mt-2">
            <p className={`text-sm text-[#555555] leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>{item.content}</p>
            {item.content.length > 120 && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#FF6B00] mt-1 flex items-center gap-1">
                {expanded ? "Minder" : "Meer lezen"}
                <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {(item.video_url) && (
        <div className="border-t border-[#E8E6E1]">
          {embedUrl ? (
            <div className="aspect-video">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={item.title} />
            </div>
          ) : (
            <a href={item.video_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-[#FF6B00] hover:bg-[#FFF3EB]">
              <Youtube size={16} /> Bekijk video
            </a>
          )}
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