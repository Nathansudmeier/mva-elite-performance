import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import YouTubeEmbed, { isYouTubeUrl } from "@/components/common/YouTubeEmbed";
import { useScrollLock } from "@/hooks/useScrollLock";
import RichTextEditor from "@/components/spelprincipes/RichTextEditor";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const CATEGORIES = ["Alles", "Balbezit", "Verdediging", "Omschakeling", "Standaardsituaties", "Algemeen"];
const MODAL_CATEGORIES = ["Algemeen", "Balbezit", "Balverlies", "Omschakeling", "Dode spelmomenten"];

const CATEGORY_COLORS = {
  Balbezit:          { bg: "#08D068", text: "#1a1a1a" },
  Verdediging:       { bg: "#FF3DA8", text: "#ffffff" },
  Omschakeling:      { bg: "#FF6800", text: "#ffffff" },
  Standaardsituaties:{ bg: "#00C2FF", text: "#1a1a1a" },
  Balverlies:        { bg: "#FFD600", text: "#1a1a1a" },
  "Dode spelmomenten":{ bg: "#9B5CFF", text: "#ffffff" },
  Algemeen:          { bg: "#1a1a1a", text: "#ffffff" },
};

const EMPTY = { title: "", category: "Algemeen", content: "", video_url: "", image_url: "", published: true };

function CategoryBadge({ category }) {
  const col = CATEGORY_COLORS[category] || { bg: "#1a1a1a", text: "#ffffff" };
  return (
    <span style={{ background: col.bg, color: col.text, border: "1.5px solid #1a1a1a", borderRadius: "10px", padding: "3px 10px", fontSize: "11px", fontWeight: 800 }}>
      {category}
    </span>
  );
}

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

  const inputStyle = { width: "100%", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", padding: "11px 14px", fontSize: "14px", fontWeight: 600, color: "#1a1a1a", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
      <div
        style={{ background: "#FFF3E8", border: "2.5px solid #1a1a1a", borderRadius: "24px 24px 0 0", boxShadow: "0 -4px 0 #1a1a1a", width: "100%", maxWidth: "720px", maxHeight: "95vh", overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overscrollBehavior: "contain" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="t-section-title">{initial?.id ? "Spelprincipe bewerken" : "Spelprincipe toevoegen"}</h2>
          <button onClick={onClose} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ffffff", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="#1a1a1a" />
          </button>
        </div>

        {/* Titel */}
        <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Naam van het spelprincipe" style={inputStyle} />

        {/* Categorie */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {MODAL_CATEGORIES.map(cat => {
            const col = CATEGORY_COLORS[cat] || { bg: "#1a1a1a", text: "#ffffff" };
            return (
              <button key={cat} type="button" onClick={() => set("category", cat)}
                style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 800, cursor: "pointer", border: "2px solid #1a1a1a", background: form.category === cat ? col.bg : "#ffffff", color: form.category === cat ? col.text : "#1a1a1a", boxShadow: form.category === cat ? "2px 2px 0 #1a1a1a" : "none", transition: "all 0.1s" }}
              >{cat}</button>
            );
          })}
        </div>

        {/* Rich text */}
        <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
          <RichTextEditor value={form.content} onChange={val => set("content", val)} placeholder="Beschrijf het spelprincipe..." />
        </div>

        {/* Media */}
        <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "14px", overflow: "hidden" }}>
          <button type="button" onClick={() => setMediaOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "none", padding: "12px 14px", cursor: "pointer" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(26,26,26,0.55)" }}>Media toevoegen (optioneel)</span>
            <i className="ti ti-chevron-down" style={{ fontSize: "16px", color: "rgba(26,26,26,0.35)", transform: mediaOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {mediaOpen && (
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: "12px", borderTop: "1.5px solid rgba(26,26,26,0.08)" }}>
              <div style={{ paddingTop: "12px" }}>
                <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>YouTube URL</label>
                <input value={form.video_url} onChange={e => set("video_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{ ...inputStyle }} />
                {form.video_url && isYouTubeUrl(form.video_url) && <div style={{ marginTop: "8px" }}><YouTubeEmbed url={form.video_url} /></div>}
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>Afbeelding</label>
                <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleImageUpload} />
                <label htmlFor="image-upload" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 700, border: "2px dashed rgba(255,104,0,0.35)", color: "rgba(26,26,26,0.45)" }}>
                  <i className="ti ti-upload" style={{ fontSize: "16px" }} />
                  {uploading ? "Uploaden..." : form.image_url ? "Afbeelding geüpload ✓" : "Klik om afbeelding te kiezen"}
                </label>
                {form.image_url && <img src={form.image_url} alt="" style={{ marginTop: "8px", borderRadius: "10px", maxHeight: "160px", objectFit: "cover", width: "100%", border: "2px solid #1a1a1a" }} />}
              </div>
            </div>
          )}
        </div>

        {/* Zichtbaar */}
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <div onClick={() => set("published", !form.published)}
            style={{ width: "44px", height: "26px", borderRadius: "13px", border: "2px solid #1a1a1a", background: form.published !== false ? "#FF6800" : "#ffffff", position: "relative", cursor: "pointer", transition: "background 0.15s", flexShrink: 0 }}>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#1a1a1a", position: "absolute", top: "2px", left: form.published !== false ? "20px" : "2px", transition: "left 0.15s" }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Zichtbaar voor spelers</span>
        </label>

        {/* Acties */}
        <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
          <button onClick={onClose} style={{ flex: 1, height: "48px", borderRadius: "14px", background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", fontSize: "14px", fontWeight: 800, cursor: "pointer", color: "#1a1a1a" }}>Annuleren</button>
          <button onClick={() => onSave(form)} disabled={isSaving || !form.title || uploading}
            style={{ flex: 1, height: "48px", borderRadius: "14px", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", fontSize: "14px", fontWeight: 800, cursor: "pointer", color: "#ffffff", opacity: (isSaving || !form.title || uploading) ? 0.5 : 1 }}>
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SpelprincipeCard({ item, isTrainer, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  useScrollLock(open);

  const col = CATEGORY_COLORS[item.category] || { bg: "#1a1a1a", text: "#ffffff" };

  const hasMedia = item.image_url || item.video_url;
  const ytId = item.video_url?.match(/[a-zA-Z0-9_-]{11}/)?.[0];

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", cursor: "pointer", overflow: "hidden", transition: "transform 0.12s ease, box-shadow 0.12s ease" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a"; }}
        onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a"; }}
        onMouseUp={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a"; }}
      >
        {/* Thumbnail */}
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
        ) : ytId ? (
          <div style={{ position: "relative", height: "140px" }}>
            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={item.title} style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "12px solid #ffffff", marginLeft: "2px" }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: "100px", background: col.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "36px" }}>⚽</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3, flex: 1 }}>{item.title}</h3>
            {isTrainer && (
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => onEdit(item)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(26,26,26,0.06)", border: "1.5px solid rgba(26,26,26,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Pencil size={13} color="rgba(26,26,26,0.55)" />
                </button>
                <button onClick={() => onDelete(item.id)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(255,61,168,0.08)", border: "1.5px solid rgba(255,61,168,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Trash2 size={13} color="#FF3DA8" />
                </button>
              </div>
            )}
          </div>
          <CategoryBadge category={item.category} />
        </div>
      </div>

      {/* Detail modal */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.50)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div
            style={{ background: "#FFF3E8", border: "2.5px solid #1a1a1a", borderRadius: "24px 24px 0 0", boxShadow: "0 -4px 0 #1a1a1a", width: "100%", maxWidth: "720px", maxHeight: "92vh", overflowY: "auto", overscrollBehavior: "contain", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", padding: "16px 16px 12px", borderBottom: "2px solid rgba(26,26,26,0.08)", position: "sticky", top: 0, background: "#FFF3E8", zIndex: 10 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>{item.title}</h2>
                <div style={{ marginTop: "6px" }}><CategoryBadge category={item.category} /></div>
              </div>
              <button onClick={() => setOpen(false)} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <X size={16} color="#1a1a1a" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "32px" }}>
              {item.video_url && isYouTubeUrl(item.video_url) ? (
                <YouTubeEmbed url={item.video_url} />
              ) : item.video_url ? (
                <video src={item.video_url} controls style={{ width: "100%", borderRadius: "14px", border: "2px solid #1a1a1a", maxHeight: "260px", background: "#000" }} />
              ) : null}

              {item.image_url && (
                <img src={item.image_url} alt={item.title} style={{ width: "100%", borderRadius: "14px", border: "2px solid #1a1a1a", objectFit: "cover", maxHeight: "260px" }} />
              )}

              {item.content && (
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: "#1a1a1a", lineHeight: 1.7, fontSize: "14px" }}
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
    mutationFn: (form) => form.id ? base44.entities.Spelprincipe.update(form.id, form) : base44.entities.Spelprincipe.create(form),
    onSuccess: () => { queryClient.invalidateQueries(["spelprincipes"]); setShowModal(false); setEditItem(null); },
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
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="t-page-title">Spelprincipes</h1>
          <p className="t-secondary" style={{ marginTop: "2px" }}>{items.length} principes</p>
        </div>
        {isTrainer && (
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FF6800", color: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", padding: "0 16px", height: "44px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
          >
            <Plus size={15} /> Toevoegen
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ padding: "7px 14px", borderRadius: "20px", border: "2px solid #1a1a1a", background: activeCategory === cat ? "#1a1a1a" : "#ffffff", color: activeCategory === cat ? "#ffffff" : "#1a1a1a", fontSize: "12px", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.1s" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: "10px" }}>
          <span style={{ fontSize: "32px" }}>⚽</span>
          <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.35)", fontWeight: 600 }}>Geen spelprincipes in deze categorie</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
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
  );
}