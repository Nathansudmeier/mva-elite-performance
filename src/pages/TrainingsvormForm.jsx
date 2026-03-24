import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Trash2, Plus } from "lucide-react";

const GROUP_COLOR_OPTIONS = ["oranje", "blauw", "groen", "rood", "paars", "geel"];
const GROUP_COLOR_MAP = {
  oranje: "#FF6800", blauw: "#00C2FF", groen: "#08D068",
  rood: "#FF3DA8", paars: "#9B5CFF", geel: "#FFD600",
};
const CATEGORIES = ["Tactisch", "Fysiek", "Positiespel", "Afwerking", "Spelprincipes"];
const CATEGORY_COLORS = {
  Tactisch: "#00C2FF", Fysiek: "#08D068", Positiespel: "#9B5CFF",
  Afwerking: "#FF6800", Spelprincipes: "#FFD600",
};

const inputStyle = {
  width: "100%", background: "#ffffff", border: "2px solid #1a1a1a",
  borderRadius: "12px", padding: "12px 14px", fontSize: "14px",
  fontWeight: 600, color: "#1a1a1a", outline: "none", boxSizing: "border-box",
};
const labelStyle = { fontSize: "10px", fontWeight: 800, color: "rgba(26,26,26,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "block" };

export default function TrainingsvormForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = searchParams.get("id");

  const { data: exercise } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => base44.entities.ExerciseTemplate.list().then(items => items.find(e => e.id === id)),
    enabled: !!id,
  });

  const [form, setForm] = useState(() => exercise || {
    name: "", category: "Tactisch", description: "",
    duration_minutes: null, coaching_points: [""],
    groups: [], group_transition_description: "",
    photo_url: "", youtube_url: "", use_groups: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: form.name, category: form.category, description: form.description,
        duration_minutes: form.duration_minutes,
        coaching_points: form.coaching_points.filter(cp => cp.trim()),
        groups: form.use_groups ? form.groups : [],
        group_transition_description: form.group_transition_description,
        photo_url: form.photo_url, youtube_url: form.youtube_url,
      };
      if (id) return base44.entities.ExerciseTemplate.update(id, data);
      return base44.entities.ExerciseTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      navigate("/Trainingsvormen");
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = async () => {
      const maxWidth = 1200;
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(async (blob) => {
        const fileObj = new File([blob], "photo.jpg", { type: "image/jpeg" });
        const res = await base44.integrations.Core.UploadFile({ file: fileObj });
        setForm(prev => ({ ...prev, photo_url: res.file_url }));
      }, "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  };

  const sectionStyle = { background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="#1a1a1a" />
        </button>
        <h1 className="t-page-title">{id ? "Oefening bewerken" : "Nieuwe oefening"}</h1>
      </div>

      {/* Naam */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Naam *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          style={inputStyle}
          placeholder="Oefenaam"
        />
      </div>

      {/* Categorie */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Categorie *</label>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setForm(prev => ({ ...prev, category: cat }))}
              style={{
                padding: "8px 14px", borderRadius: "20px", border: "2px solid #1a1a1a", cursor: "pointer",
                background: form.category === cat ? CATEGORY_COLORS[cat] : "#ffffff",
                color: "#1a1a1a", fontSize: "12px", fontWeight: 800,
                boxShadow: form.category === cat ? "2px 2px 0 #1a1a1a" : "none",
                transition: "all 0.1s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Beschrijving */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Beschrijving</label>
        <textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          style={{ ...inputStyle, minHeight: "96px", resize: "vertical", lineHeight: 1.5 }}
          placeholder="Beschrijving van de oefening"
        />
      </div>

      {/* Coaching Points */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Coaching Points</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {form.coaching_points.map((point, idx) => (
            <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={point}
                onChange={e => {
                  const pts = [...form.coaching_points];
                  pts[idx] = e.target.value;
                  setForm(prev => ({ ...prev, coaching_points: pts }));
                }}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Coaching point"
              />
              {form.coaching_points.length > 1 && (
                <button
                  onClick={() => setForm(prev => ({ ...prev, coaching_points: prev.coaching_points.filter((_, i) => i !== idx) }))}
                  style={{ width: "36px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,61,168,0.1)", border: "2px solid #FF3DA8", borderRadius: "10px", cursor: "pointer", flexShrink: 0 }}
                >
                  <Trash2 size={14} color="#FF3DA8" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setForm(prev => ({ ...prev, coaching_points: [...prev.coaching_points, ""] }))}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,104,0,0.10)", border: "2px solid #FF6800", borderRadius: "10px", padding: "8px 12px", color: "#FF6800", fontSize: "12px", fontWeight: 800, cursor: "pointer", width: "fit-content" }}
        >
          <Plus size={13} /> Coaching point toevoegen
        </button>
      </div>

      {/* Tijdsduur */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Tijdsduur</label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="number"
            value={form.duration_minutes || ""}
            onChange={e => setForm(prev => ({ ...prev, duration_minutes: e.target.value ? parseInt(e.target.value) : null }))}
            style={{ ...inputStyle, width: "100px" }}
            placeholder="0"
          />
          <span style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,26,0.55)" }}>minuten</span>
        </div>
      </div>

      {/* Groepen */}
      <div style={sectionStyle}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <div
            onClick={() => setForm(prev => ({ ...prev, use_groups: !prev.use_groups }))}
            style={{
              width: "44px", height: "26px", borderRadius: "13px", border: "2px solid #1a1a1a",
              background: form.use_groups ? "#FF6800" : "#ffffff",
              position: "relative", cursor: "pointer", transition: "background 0.15s", flexShrink: 0,
            }}
          >
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%", background: "#1a1a1a",
              position: "absolute", top: "2px", transition: "left 0.15s",
              left: form.use_groups ? "20px" : "2px",
            }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>Meerdere groepen</span>
        </label>

        {form.use_groups && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
            {form.groups.map((group, idx) => (
              <div key={idx} style={{ background: "rgba(26,26,26,0.04)", border: "2px solid rgba(26,26,26,0.12)", borderRadius: "14px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text" value={group.name}
                    onChange={e => {
                      const g = [...form.groups]; g[idx].name = e.target.value;
                      setForm(prev => ({ ...prev, groups: g }));
                    }}
                    style={{ ...inputStyle, flex: 1 }} placeholder="Groepnaam"
                  />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, groups: prev.groups.filter((_, i) => i !== idx) }))}
                    style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,61,168,0.1)", border: "2px solid #FF3DA8", borderRadius: "10px", cursor: "pointer", flexShrink: 0 }}
                  >
                    <Trash2 size={14} color="#FF3DA8" />
                  </button>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="number" value={group.player_count}
                    onChange={e => {
                      const g = [...form.groups]; g[idx].player_count = parseInt(e.target.value);
                      setForm(prev => ({ ...prev, groups: g }));
                    }}
                    style={{ ...inputStyle, width: "90px" }} placeholder="0"
                  />
                  <div style={{ display: "flex", gap: "6px" }}>
                    {GROUP_COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          const g = [...form.groups]; g[idx].color = c;
                          setForm(prev => ({ ...prev, groups: g }));
                        }}
                        style={{
                          width: "28px", height: "28px", borderRadius: "50%", background: GROUP_COLOR_MAP[c],
                          border: group.color === c ? "3px solid #1a1a1a" : "2px solid rgba(26,26,26,0.20)",
                          cursor: "pointer", flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setForm(prev => ({ ...prev, groups: [...prev.groups, { name: "", player_count: 0, color: "oranje" }] }))}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,104,0,0.10)", border: "2px solid #FF6800", borderRadius: "10px", padding: "8px 12px", color: "#FF6800", fontSize: "12px", fontWeight: 800, cursor: "pointer", width: "fit-content" }}
            >
              <Plus size={13} /> Groep toevoegen
            </button>
            <textarea
              value={form.group_transition_description}
              onChange={e => setForm(prev => ({ ...prev, group_transition_description: e.target.value }))}
              style={{ ...inputStyle, minHeight: "72px" }}
              placeholder="Beschrijving van de groepswisseling"
            />
          </div>
        )}
      </div>

      {/* Foto */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Foto (velddiagram)</label>
        <input
          type="file" accept="image/*" onChange={handlePhotoUpload}
          style={{ fontSize: "13px", color: "#1a1a1a", cursor: "pointer" }}
        />
        {form.photo_url && (
          <div style={{ marginTop: "6px" }}>
            <img src={form.photo_url} alt="Preview" style={{ width: "100%", borderRadius: "12px", border: "2px solid #1a1a1a" }} />
          </div>
        )}
      </div>

      {/* YouTube URL */}
      <div style={sectionStyle}>
        <label style={labelStyle}>YouTube URL</label>
        <input
          type="url"
          value={form.youtube_url}
          onChange={e => setForm(prev => ({ ...prev, youtube_url: e.target.value }))}
          style={inputStyle}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      {/* Opslaan */}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.name}
        className="btn-primary"
        style={{ marginTop: "4px" }}
      >
        {mutation.isPending ? "Opslaan..." : "Opslaan"}
      </button>
    </div>
  );
}