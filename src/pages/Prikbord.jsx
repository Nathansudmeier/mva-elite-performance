import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

const TYPE_CONFIG = {
  Annulering: { bg: "#FF3DA8", color: "#ffffff", darkText: false },
  Info:       { bg: "#00C2FF", color: "#1a1a1a", darkText: true  },
  Evenement:  { bg: "#FFD600", color: "#1a1a1a", darkText: true  },
  Urgent:     { bg: "#FF3DA8", color: "#ffffff", darkText: false },
};

const FILTER_OPTIONS = ["Alles", "Urgent", "Info", "Evenement", "Annulering"];

const inputStyle = {
  width: "100%", padding: "12px", background: "#ffffff",
  border: "2px solid #1a1a1a", borderRadius: "12px",
  fontSize: "14px", color: "#1a1a1a", outline: "none",
  fontWeight: 500, boxSizing: "border-box", fontFamily: "inherit",
};

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.80);
    };
    img.src = url;
  });
}

function formatRelative(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "zojuist";
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  return new Date(date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function MededelingCard({ m, user, isTrainer, onLike, onDelete, onEdit }) {
  const [pressTimer, setPressTimer] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.Info;
  const liked = (m.likes || []).includes(user?.email);
  const canDelete = isTrainer || user?.role === "admin";

  const handleLike = () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 200);
    onLike(m);
  };

  const startPress = () => {
    if (!canDelete) return;
    const t = setTimeout(() => setShowActions(true), 600);
    setPressTimer(t);
  };
  const endPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  return (
    <div
      style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden", position: "relative" }}
      onTouchStart={startPress} onTouchEnd={endPress} onMouseLeave={() => { endPress(); setShowActions(false); }}
    >
      {/* Urgent dot */}
      {m.is_urgent && (
        <div style={{ position: "absolute", top: "14px", left: "14px", width: "8px", height: "8px", borderRadius: "50%", background: "#FF3DA8", animation: "pulse 1.5s infinite" }} />
      )}

      {/* Card header */}
      <div style={{ padding: "0.75rem 1rem 0.6rem", display: "flex", alignItems: "center", gap: "10px" }}>
        {m.is_urgent && <div style={{ width: "8px" }} />}
        <span style={{
          background: cfg.bg, color: cfg.color,
          border: "1.5px solid #1a1a1a", borderRadius: "20px",
          padding: "3px 10px", fontSize: "9px", fontWeight: 800,
          textTransform: "uppercase", letterSpacing: "0.07em",
          whiteSpace: "nowrap",
        }}>{m.type}</span>
        <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(26,26,26,0.40)", marginLeft: "auto" }}>
          {formatRelative(m.created_date)}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "0 1rem 1rem" }}>
        <p style={{ fontSize: "15px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px", lineHeight: 1.2, marginBottom: "6px" }}>{m.title}</p>
        <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.65)", fontWeight: 500, lineHeight: 1.5 }}>{m.body}</p>
        {m.photo_url && (
          <img src={m.photo_url} alt="" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "12px", marginTop: "8px", border: "1.5px solid #1a1a1a" }} />
        )}
      </div>

      {/* Card footer */}
      <div style={{ padding: "0.6rem 1rem", borderTop: "1.5px solid rgba(26,26,26,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#FF6800", border: "1.5px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 900, color: "#ffffff", overflow: "hidden", flexShrink: 0 }}>
            {m.author_photo_url
              ? <img src={m.author_photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : m.author_name?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.50)" }}>{m.author_name}</span>
        </div>

        <button
          onClick={handleLike}
          style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "12px", fontWeight: 800,
            transform: likeAnim ? "scale(1.4)" : "scale(1)",
            transition: "transform 0.2s",
          }}
        >
          <span style={{ fontSize: "16px", color: liked ? "#FF3DA8" : "rgba(26,26,26,0.30)" }}>
            {liked ? "♥" : "♡"}
          </span>
          <span style={{ color: liked ? "#FF3DA8" : "rgba(26,26,26,0.40)" }}>{(m.likes || []).length}</span>
        </button>
      </div>

      {/* Actions overlay */}
      {showActions && canDelete && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,26,0.65)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => { onEdit(m); setShowActions(false); }}
              style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", padding: "12px 28px", fontSize: "14px", fontWeight: 800, color: "#1a1a1a", cursor: "pointer" }}
            >✏️ Wijzigen</button>
            <button
              onClick={() => { onDelete(m.id); setShowActions(false); }}
              style={{ background: "#FF3DA8", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", padding: "12px 28px", fontSize: "14px", fontWeight: 800, color: "#ffffff", cursor: "pointer" }}
            >🗑️ Verwijderen</button>
            <button onClick={() => setShowActions(false)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Annuleren</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NieuweMededelingSheet({ user, onClose, onSaved, editItem }) {
  const [form, setForm] = useState(editItem ? {
    type: editItem.type || "Info",
    title: editItem.title || "",
    body: editItem.body || "",
    is_urgent: editItem.is_urgent || false,
    expires_at: editItem.expires_at || "",
  } : { type: "Info", title: "", body: "", is_urgent: false, expires_at: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(editItem?.photo_url || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let photo_url = editItem?.photo_url || null;
    if (photoFile) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file: photoFile });
      photo_url = res.file_url;
      setUploading(false);
    }
    if (!photoPreview) photo_url = null; // foto verwijderd

    if (editItem) {
      await base44.entities.Mededeling.update(editItem.id, {
        ...form,
        photo_url: photo_url || undefined,
        expires_at: form.expires_at || undefined,
      });
    } else {
      const firstName = user?.full_name?.split(" ")[0] || user?.full_name || "Trainer";
      await base44.entities.Mededeling.create({
        ...form,
        author_name: firstName,
        author_email: user?.email,
        author_photo_url: user?.photo_url || "",
        likes: [],
        photo_url: photo_url || undefined,
        expires_at: form.expires_at || undefined,
      });

      // Notificaties voor alle gebruikers
      const allUsers = await base44.entities.User.list();
      await Promise.all(allUsers.map(u =>
        base44.entities.Notification.create({
          user_email: u.email,
          type: "mededeling",
          title: form.title,
          body: form.body.slice(0, 60),
          link: "/Prikbord",
          is_read: false,
        })
      )).catch(() => {});
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  const TYPE_COLORS = { Annulering: "#FF3DA8", Info: "#00C2FF", Evenement: "#FFD600", Urgent: "#FF3DA8" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.50)" }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "560px",
          background: "#ffffff",
          borderTop: "2.5px solid #1a1a1a",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -3px 0 #1a1a1a",
          padding: "1.25rem",
          maxHeight: "92dvh", overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {/* Handle */}
        <div style={{ width: "36px", height: "4px", background: "#1a1a1a", borderRadius: "2px", margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", marginBottom: "1rem" }}>{editItem ? "Mededeling wijzigen" : "Nieuwe mededeling"}</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Type */}
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: "10px" }}>Type</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {["Info", "Evenement", "Annulering", "Urgent"].map(t => {
                const active = form.type === t;
                return (
                  <button key={t} type="button" onClick={() => set("type", t)} style={{
                    padding: "8px", borderRadius: "12px", fontSize: "13px", fontWeight: 800, cursor: "pointer",
                    background: active ? TYPE_COLORS[t] : "#ffffff",
                    color: active ? (t === "Info" || t === "Evenement" ? "#1a1a1a" : "#ffffff") : "rgba(26,26,26,0.50)",
                    border: active ? "2px solid #1a1a1a" : "2px solid rgba(26,26,26,0.15)",
                    boxShadow: active ? "2px 2px 0 #1a1a1a" : "none",
                  }}>{t}</button>
                );
              })}
            </div>
          </div>

          {/* Titel */}
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: "8px" }}>Titel</p>
            <input required value={form.title} onChange={e => set("title", e.target.value)} style={{ ...inputStyle, fontSize: "15px", fontWeight: 700 }} placeholder="Titel van de mededeling" />
          </div>

          {/* Bericht */}
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: "8px" }}>Bericht</p>
            <textarea value={form.body} onChange={e => set("body", e.target.value)} rows={4}
              style={{ ...inputStyle, minHeight: "100px", resize: "none", lineHeight: 1.5 }}
              placeholder="Schrijf je mededeling..." />
          </div>

          {/* Foto */}
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: "8px" }}>Foto (optioneel)</p>
            {photoPreview ? (
              <div style={{ position: "relative" }}>
                <img src={photoPreview} style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "12px", border: "2px solid #1a1a1a" }} />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  style={{ position: "absolute", top: "8px", right: "8px", width: "24px", height: "24px", borderRadius: "50%", background: "#FF3DA8", border: "1.5px solid #1a1a1a", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 900 }}>✕</button>
              </div>
            ) : (
              <>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  style={{ width: "100%", height: "52px", background: "#FFF3E8", border: "2px dashed #1a1a1a", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                  <span style={{ fontSize: "16px" }}>📸</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(26,26,26,0.45)" }}>Foto toevoegen</span>
                </button>
              </>
            )}
          </div>

          {/* Urgentie toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>Toon als banner op dashboard</p>
            <button type="button" onClick={() => set("is_urgent", !form.is_urgent)} style={{
              width: "48px", height: "28px", borderRadius: "14px", border: "2px solid #1a1a1a",
              background: form.is_urgent ? "#FF3DA8" : "rgba(26,26,26,0.15)",
              cursor: "pointer", position: "relative", flexShrink: 0,
            }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%", background: "#ffffff",
                border: "1.5px solid #1a1a1a", position: "absolute", top: "3px",
                left: form.is_urgent ? "23px" : "3px", transition: "left 0.2s",
              }} />
            </button>
          </div>

          {/* Vervaldatum */}
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: "8px" }}>Verdwijnt automatisch op (optioneel)</p>
            <input type="date" value={form.expires_at} onChange={e => set("expires_at", e.target.value)} style={inputStyle} min={new Date().toISOString().split("T")[0]} />
          </div>

          <button type="submit" disabled={saving} style={{
            background: "#FF6800", border: "2.5px solid #1a1a1a",
            borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a",
            height: "52px", width: "100%", fontSize: "15px", fontWeight: 800,
            color: "#ffffff", marginTop: "1rem", cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? (uploading ? "Foto uploaden..." : "Opslaan...") : (editItem ? "Wijzigingen opslaan" : "Mededeling plaatsen")}
          </button>
          <div style={{ height: "16px" }} />
        </form>
      </div>
    </div>
  );
}

export default function Prikbord() {
  const { user, isTrainer } = useCurrentUser();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("Alles");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const canPost = isTrainer || user?.role === "admin";

  const { data: mededelingen = [] } = useQuery({
    queryKey: ["mededelingen"],
    queryFn: () => base44.entities.Mededeling.list("-created_date"),
  });

  const likeMutation = useMutation({
    mutationFn: ({ id, likes }) => base44.entities.Mededeling.update(id, { likes }),
    onMutate: async ({ id, likes }) => {
      await queryClient.cancelQueries(["mededelingen"]);
      const prev = queryClient.getQueryData(["mededelingen"]);
      queryClient.setQueryData(["mededelingen"], old =>
        (old || []).map(m => m.id === id ? { ...m, likes } : m)
      );
      return { prev };
    },
    onError: (_, __, ctx) => queryClient.setQueryData(["mededelingen"], ctx.prev),
    onSettled: () => queryClient.invalidateQueries(["mededelingen"]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Mededeling.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["mededelingen"]),
  });

  const handleLike = (m) => {
    const likes = m.likes || [];
    const already = likes.includes(user.email);
    const newLikes = already ? likes.filter(e => e !== user.email) : [...likes, user.email];
    likeMutation.mutate({ id: m.id, likes: newLikes });
  };

  const now = new Date();
  const filtered = mededelingen
    .filter(m => !m.expires_at || new Date(m.expires_at) >= now)
    .filter(m => filter === "Alles" || m.type === filter)
    .sort((a, b) => {
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{
        background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a",
        position: "relative", overflow: "hidden",
        minHeight: "100px",
        display: "flex", alignItems: "center",
        padding: "1rem 1.25rem",
        paddingRight: "160px",
      }}>
        {/* Decoratieve cirkel */}
        <div style={{ position: "absolute", width: "160px", height: "160px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", top: "-40px", right: "80px" }} />
        <div style={{ position: "absolute", width: "80px", height: "80px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", bottom: "-20px", right: "160px" }} />

        <p style={{ fontSize: "26px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1 }}>Prikbord</p>

        {/* Emvi */}
        <img
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/a9e7b2253_Emvi-Prikbord.png"
          alt="Emvi"
          style={{
            position: "absolute", right: "0", bottom: "0",
            height: "140px", width: "auto",
            objectFit: "contain", pointerEvents: "none",
          }}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px", WebkitOverflowScrolling: "touch" }}>
        {FILTER_OPTIONS.map(f => {
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink: 0,
              padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, cursor: "pointer",
              background: active ? "#1a1a1a" : "#ffffff",
              color: active ? "#ffffff" : "rgba(26,26,26,0.50)",
              border: "2px solid #1a1a1a",
              boxShadow: active ? "2px 2px 0 #FF6800" : "2px 2px 0 #1a1a1a",
            }}>{f}</button>
          );
        })}
      </div>

      {/* Nieuwe mededeling knop */}
      {canPost && (
        <button onClick={() => setShowForm(true)} style={{
          background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "14px",
          boxShadow: "3px 3px 0 #1a1a1a", height: "48px", width: "100%",
          fontSize: "14px", fontWeight: 800, color: "#1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer",
        }}>
          <span style={{ fontSize: "16px" }}>＋</span> Nieuwe mededeling
        </button>
      )}

      {/* Lijst */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ fontSize: "32px", marginBottom: "8px" }}>📌</p>
          <p className="t-section-title">Geen mededelingen</p>
          <p className="t-secondary" style={{ marginTop: "4px" }}>Er zijn nog geen mededelingen geplaatst.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(m => (
            <MededelingCard
              key={m.id} m={m} user={user} isTrainer={isTrainer}
              onLike={handleLike}
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={(m) => { setEditItem(m); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <NieuweMededelingSheet
          user={user}
          editItem={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => queryClient.invalidateQueries(["mededelingen"])}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}