import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
// Tabler Icons zijn beschikbaar via CDN
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import YouTubeEmbed, { isYouTubeUrl } from "@/components/common/YouTubeEmbed";

const CATEGORIES = ["Alles", "Balbezit", "Verdediging", "Omschakeling", "Standaardsituaties", "Algemeen"];

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
  const [videoMode, setVideoMode] = useState(
    initial?.video_url ? (isYouTubeUrl(initial.video_url) ? "youtube" : "upload") : "youtube"
  );
  const [uploading, setUploading] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-500 text-[#1A1A1A]">
            {initial?.id ? "Spelprincipe bewerken" : "Spelprincipe toevoegen"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F7F5F2] rounded-lg">
            <i className="ti ti-x" style={{ fontSize: "20px", color: "#888888", strokeWidth: 1.5 }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-500 text-[#888888] uppercase tracking-wide mb-1 block">Titel</label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Naam van het spelprincipe" className="border-[#E8E6E1]" />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-500 text-[#888888] uppercase tracking-wide mb-1 block">Categorie</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full border border-[#E8E6E1] rounded-md px-3 py-2 text-sm text-[#1A1A1A] bg-white"
            >
              {CATEGORIES.filter(c => c !== "Alles").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-500 text-[#888888] uppercase tracking-wide mb-1 block">Inhoud</label>
            <div className="border border-[#E8E6E1] rounded-xl overflow-hidden">
              <ReactQuill value={form.content} onChange={val => set("content", val)} theme="snow" />
            </div>
          </div>

          {/* Video section */}
          <div>
            <label className="text-xs font-500 text-[#888888] uppercase tracking-wide mb-2 block">Video (optioneel)</label>
            {/* Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setVideoMode("youtube"); set("video_url", ""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  background: videoMode === "youtube" ? "#FF6B00" : "#fff",
                  color: videoMode === "youtube" ? "#fff" : "#FF6B00",
                  borderColor: "#FF6B00",
                }}
              >
                <i className="ti ti-link" style={{ fontSize: "12px", color: "inherit", strokeWidth: 1.5 }} /> YouTube URL
              </button>
              <button
                type="button"
                onClick={() => { setVideoMode("upload"); set("video_url", ""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  background: videoMode === "upload" ? "#FF6B00" : "#fff",
                  color: videoMode === "upload" ? "#fff" : "#FF6B00",
                  borderColor: "#FF6B00",
                }}
              >
                <Upload size={12} /> Bestand uploaden
              </button>
            </div>

            {videoMode === "youtube" ? (
              <div className="space-y-2">
                <Input
                  value={form.video_url}
                  onChange={e => set("video_url", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="border-[#E8E6E1]"
                />
                {form.video_url && isYouTubeUrl(form.video_url) && (
                  <YouTubeEmbed url={form.video_url} />
                )}
              </div>
            ) : (
              <div>
                <input type="file" accept="video/*" className="hidden" id="video-upload" onChange={handleVideoUpload} />
                <label
                  htmlFor="video-upload"
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#E8E6E1] rounded-xl cursor-pointer hover:border-[#FF6B00] text-sm text-[#888888] hover:text-[#FF6B00] transition-colors"
                >
                  <Upload size={16} />
                  {uploading ? "Uploaden..." : form.video_url ? "Video geüpload ✓" : "Klik om video te kiezen"}
                </label>
              </div>
            )}
          </div>

          {/* Image */}
          <div>
            <label className="text-xs font-500 text-[#888888] uppercase tracking-wide mb-2 block">Afbeelding (optioneel)</label>
            <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleImageUpload} />
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#E8E6E1] rounded-xl cursor-pointer hover:border-[#FF6B00] text-sm text-[#888888] hover:text-[#FF6B00] transition-colors"
            >
              <Upload size={16} />
              {uploading ? "Uploaden..." : form.image_url ? "Afbeelding geüpload ✓" : "Klik om afbeelding te kiezen"}
            </label>
            {form.image_url && (
              <img src={form.image_url} alt="" className="mt-2 rounded-xl max-h-40 object-cover w-full" />
            )}
          </div>

          {/* Published */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={form.published !== false}
              onChange={e => set("published", e.target.checked)}
              className="w-4 h-4 accent-[#FF6B00]"
            />
            <label htmlFor="published" className="text-sm text-[#1A1A1A]">Zichtbaar voor spelers</label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuleren</Button>
            <Button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.title || uploading}
              className="flex-1 bg-[#FF6B00] hover:bg-[#E55A00] text-white"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpelprincipeCard({ item, isTrainer, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

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
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8E6E1] cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setOpen(true)}
      >
        {/* Image or video thumbnail */}
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
        ) : item.video_url && isYouTubeUrl(item.video_url) ? (
          <div className="w-full h-40 bg-black flex items-center justify-center relative overflow-hidden">
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
          <div className="w-full h-40 bg-[#1A1A1A] flex items-center justify-center">
            <div className="w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-white ml-1" />
            </div>
          </div>
        ) : (
          <div className="w-full h-40 bg-[#F7F5F2] flex items-center justify-center">
            <span className="text-4xl">⚽</span>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-500 text-[#1A1A1A] leading-tight">{item.title}</h3>
            {isTrainer && (
              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-[#F7F5F2] rounded-lg">
                  <Pencil size={14} color="#888888" />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-[#FDE8E8] rounded-lg">
                  <Trash2 size={14} color="#C0392B" />
                </button>
              </div>
            )}
          </div>
          <span
            className="inline-block text-xs font-500 px-2 py-0.5 rounded-full text-white"
            style={{ background: categoryColors[item.category] || "#888888" }}
          >
            {item.category}
          </span>
        </div>
      </div>

      {/* Detail Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E6E1]">
              <div>
                <h2 className="text-xl font-500 text-[#1A1A1A]">{item.title}</h2>
                <span
                  className="inline-block text-xs font-500 px-2 py-0.5 rounded-full text-white mt-1"
                  style={{ background: categoryColors[item.category] || "#888888" }}
                >
                  {item.category}
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-[#F7F5F2] rounded-lg">
                <X size={20} color="#888888" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* YouTube embed or video */}
              {item.video_url && isYouTubeUrl(item.video_url) ? (
                <YouTubeEmbed url={item.video_url} />
              ) : item.video_url ? (
                <video src={item.video_url} controls className="w-full rounded-xl max-h-64 bg-black" />
              ) : null}

              {/* Image */}
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="w-full rounded-xl object-cover max-h-64" />
              )}

              {/* Content */}
              {item.content && (
                <div
                  className="prose prose-sm max-w-none text-[#1A1A1A]"
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-500 text-[#1A1A1A]">Spelprincipes</h1>
        {isTrainer && (
          <Button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="bg-[#FF6B00] hover:bg-[#E55A00] text-white gap-2"
          >
            <Plus size={16} /> Toevoegen
          </Button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 text-sm font-500 transition-colors"
            style={{
              borderRadius: 20,
              background: activeCategory === cat ? "#FF6B00" : "#FFFFFF",
              color: activeCategory === cat ? "#FFFFFF" : "#FF6B00",
              border: "1.5px solid #FF6B00",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-[#D0CDC8] h-40">
          <p className="text-sm text-[#888888]">Nog geen spelprincipes in deze categorie</p>
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

      {/* Modal */}
      {showModal && (
        <SpelprincipeModal
          initial={editItem}
          onSave={(form) => saveMutation.mutate(form)}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}