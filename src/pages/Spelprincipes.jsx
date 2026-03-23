import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import YouTubeEmbed, { isYouTubeUrl } from "@/components/common/YouTubeEmbed";
import { useScrollLock } from "@/hooks/useScrollLock";
import RichTextEditor from "@/components/spelprincipes/RichTextEditor";

const CATEGORIES = ["Alles", "Balbezit", "Verdediging", "Omschakeling", "Standaardsituaties", "Algemeen"];
const MODAL_CATEGORIES = ["Algemeen", "Balbezit", "Balverlies", "Omschakeling", "Dode spelmomenten"];

const EMPTY = {
  title: "",
  category: "Algemeen",
  content: "",
  video_url: "",
  image_url: "",
  published: true,
};

function SpelprincipeModal({ initial, onSave, onClose, isSaving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  useScrollLock(true);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("video_url", file_url);
    setUploading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-hidden">
      <div
        className="glass-dark modal-scroll-content w-full my-8"
        style={{
          maxWidth: "720px",
          borderRadius: "24px",
          padding: "2rem",
          overflowY: "auto",
          maxHeight: "90vh",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between mb-6"
        >
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
            {initial?.id ? "Spelprincipe bewerken" : "Spelprincipe toevoegen"}
          </h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <i className="ti ti-x" style={{ fontSize: "20px", color: "rgba(255,255,255,0.7)" }} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Titel */}
          <input
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="Naam van het spelprincipe"
            style={{ width: "100%", fontSize: "18px", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "14px", padding: "12px 16px", color: "#ffffff", outline: "none" }}
          />

          {/* Categorie pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {MODAL_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => set("category", cat)}
                style={{
                  borderRadius: "20px",
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: form.category === cat ? "#FF6B00" : "rgba(255,255,255,0.08)",
                  color: form.category === cat ? "#ffffff" : "rgba(255,255,255,0.55)",
                  transition: "all 0.15s",
                }}
              >{cat}</button>
            ))}
          </div>

          {/* Inhoud rich text */}
          <RichTextEditor
            value={form.content}
            onChange={(val) => set("content", val)}
            placeholder="Beschrijf het spelprincipe..."
          />

          {/* Media sectie — uitklapbaar */}
          <div>
            <button
              type="button"
              onClick={() => setMediaOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "10px 14px", cursor: "pointer" }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Media toevoegen (optioneel)</span>
              <i className="ti ti-chevron-down" style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)", transform: mediaOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>

            {mediaOpen && (
              <div className="space-y-3 mt-3">
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>YouTube URL</label>
                  <input
                    value={form.video_url}
                    onChange={e => set("video_url", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    style={{ width: "100%", fontSize: "13px", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "9px 12px", color: "#ffffff", outline: "none" }}
                  />
                  {form.video_url && isYouTubeUrl(form.video_url) && (
                    <div className="mt-2"><YouTubeEmbed url={form.video_url} /></div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>Afbeelding</label>
                  <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleImageUpload} />
                  <label
                    htmlFor="image-upload"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", border: "1.5px dashed rgba(255,107,0,0.4)", color: "rgba(255,255,255,0.5)" }}
                  >
                    <i className="ti ti-upload" style={{ fontSize: "16px" }} />
                    {uploading ? "Uploaden..." : form.image_url ? "Afbeelding geüpload ✓" : "Klik om afbeelding te kiezen"}
                  </label>
                  {form.image_url && (
                    <img src={form.image_url} alt="" className="mt-2 rounded-xl max-h-40 object-cover w-full" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Zichtbaar voor spelers */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              id="published"
              checked={form.published !== false}
              onChange={e => set("published", e.target.checked)}
              className="w-4 h-4 accent-[#FF6B00]"
            />
            <label htmlFor="published" style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>Zichtbaar voor spelers</label>
          </div>

          {/* Actieknoppen */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{ flex: 1, height: "48px", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}
            >Annuleren</button>
            <button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.title || uploading}
              style={{ flex: 1, height: "48px", borderRadius: "14px", fontSize: "14px", fontWeight: 600, cursor: (isSaving || !form.title || uploading) ? "not-allowed" : "pointer", background: "#FF6B00", border: "none", color: "#ffffff", opacity: (isSaving || !form.title || uploading) ? 0.5 : 1 }}
            >{isSaving ? "Opslaan..." : "Opslaan"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpelprincipeCard({ item, isTrainer, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  useScrollLock(open);

  const categoryColors = {
    Balbezit: "#3B6D11",
    Verdediging: "#C0392B",
    Omschakeling: "#FF6B00",
    Standaardsituaties: "#2471A3",
    Algemeen: "#888888",
  };

  return (
    <>
      <div
        className="glass cursor-pointer hover:scale-[1.01] transition-transform"
        onClick={() => setOpen(true)}
      >
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" style={{ borderRadius: "22px 22px 0 0" }} />
        ) : item.video_url && isYouTubeUrl(item.video_url) ? (
          <div className="w-full h-40 flex items-center justify-center relative overflow-hidden" style={{ borderRadius: "22px 22px 0 0" }}>
            <img
              src={`https://img.youtube.com/vi/${item.video_url.match(/[a-zA-Z0-9_-]{11}/)?.[0]}/hqdefault.jpg`}
              alt={item.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center shadow-lg">
                <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-white ml-1" />
              </div>
            </div>
          </div>
        ) : item.video_url ? (
          <div className="w-full h-40 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", borderRadius: "22px 22px 0 0" }}>
            <div className="w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-white ml-1" />
            </div>
          </div>
        ) : (
          <div className="w-full h-40 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "22px 22px 0 0" }}>
            <span className="text-4xl">⚽</span>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-white leading-tight">{item.title}</h3>
            {isTrainer && (
              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <i className="ti ti-pencil" style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }} />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg" style={{ background: "rgba(248,113,113,0.12)" }}>
                  <i className="ti ti-trash" style={{ fontSize: "14px", color: "#f87171" }} />
                </button>
              </div>
            )}
          </div>
          <span
            className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: categoryColors[item.category] || "#888888" }}
          >
            {item.category}
          </span>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-dark modal-scroll-content w-full max-w-2xl my-8"
            style={{ overflowY: "auto", maxHeight: "90vh", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-5"
              style={{ borderBottom: "0.5px solid rgba(255,255,255,0.10)" }}
            >
              <div>
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
                <span
                  className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white mt-1"
                  style={{ background: categoryColors[item.category] || "#888888" }}
                >
                  {item.category}
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
                <i className="ti ti-x" style={{ fontSize: "20px", color: "rgba(255,255,255,0.7)" }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {item.video_url && isYouTubeUrl(item.video_url) ? (
                <YouTubeEmbed url={item.video_url} />
              ) : item.video_url ? (
                <video src={item.video_url} controls className="w-full rounded-xl max-h-64 bg-black" />
              ) : null}

              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="w-full rounded-xl object-cover max-h-64" />
              )}

              {item.content && (
                <div
                  className="prose prose-sm max-w-none text-white/80"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Spelprincipes() {
  const { isTrainer } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("Alles");
  const [editItem, setEditItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["spelprincipes"],
    queryFn: () => base44.entities.Spelprincipe.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (form) =>
      form.id
        ? base44.entities.Spelprincipe.update(form.id, form)
        : base44.entities.Spelprincipe.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries(["spelprincipes"]);
      setShowModal(false);
      setEditItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Spelprincipe.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["spelprincipes"]),
  });

  const visible = items.filter(i => {
    if (!isTrainer && !i.published) return false;
    if (activeCategory !== "Alles" && i.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#1c0e04" }}>
      <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/1c0b85909_Tacticsbackground.jpg" alt=""
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Spelprincipes</h1>
        {isTrainer && (
          <Button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="bg-[#FF6B00] hover:bg-[#E55A00] text-white gap-2 flex items-center"
          >
            <i className="ti ti-plus" style={{ fontSize: "16px", color: "white" }} /> Toevoegen
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 text-sm font-bold transition-colors"
            style={{
              borderRadius: 20,
              background: activeCategory === cat ? "#FF6B00" : "rgba(255,107,0,0.12)",
              color: activeCategory === cat ? "#FFFFFF" : "#FF8C3A",
              border: activeCategory === cat ? "0.5px solid #FF6B00" : "0.5px solid rgba(255,107,0,0.35)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="glass flex items-center justify-center h-40">
          <p className="text-sm text-white/40">Nog geen spelprincipes in deze categorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(item => (
            <SpelprincipeCard
              key={item.id}
              item={item}
              isTrainer={isTrainer}
              onEdit={(item) => { setEditItem(item); setShowModal(true); }}
              onDelete={(id) => { if (window.confirm("Spelprincipe verwijderen?")) deleteMutation.mutate(id); }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <SpelprincipeModal
          initial={editItem}
          onSave={(form) => saveMutation.mutate(form)}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          isSaving={saveMutation.isPending}
        />
      )}
      </div>
    </div>
  );
}