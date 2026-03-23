import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const groupColors = ["oranje", "blauw", "groen", "rood", "paars", "geel"];
const groupColorMap = {
  oranje: "#FF8C3A",
  blauw: "#60a5fa",
  groen: "#4ade80",
  rood: "#f87171",
  paars: "#a78bfa",
  geel: "#fbbf24"
};

export default function TrainingsvormForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = searchParams.get("id");

  const { data: exercise } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => base44.entities.ExerciseTemplate.list().then(items => items.find(e => e.id === id)),
    enabled: !!id
  });

  const [form, setForm] = useState(() => exercise || {
    name: "",
    category: "Tactisch",
    description: "",
    duration_minutes: null,
    coaching_points: [""],
    groups: [],
    group_transition_description: "",
    photo_url: "",
    youtube_url: "",
    use_groups: false
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: form.name,
        category: form.category,
        description: form.description,
        duration_minutes: form.duration_minutes,
        coaching_points: form.coaching_points.filter(cp => cp.trim()),
        groups: form.use_groups ? form.groups : [],
        group_transition_description: form.group_transition_description,
        photo_url: form.photo_url,
        youtube_url: form.youtube_url
      };

      if (id) {
        return base44.entities.ExerciseTemplate.update(id, data);
      } else {
        return base44.entities.ExerciseTemplate.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      navigate("/Trainingsvormen");
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = async () => {
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          const fileObj = new File([blob], "photo.jpg", { type: "image/jpeg" });
          const uploadRes = await base44.integrations.Core.UploadFile({ file: fileObj });
          setForm(prev => ({ ...prev, photo_url: uploadRes.file_url }));
        }, "image/jpeg", 0.8);
      };

      img.src = URL.createObjectURL(file);
    } catch (err) {
      console.error("Foto upload error:", err);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#1c0e04" }}>
      <div className="relative z-10 p-4 md:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:opacity-70 transition">
            <ArrowLeft className="w-5 h-5" style={{ color: "rgba(255,255,255,0.70)" }} />
          </button>
          <h1 className="t-page-title ml-4">{id ? "Oefening bewerken" : "Nieuwe oefening"}</h1>
        </div>

        <div className="space-y-6">
          {/* Naam */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              Naam *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none"
              placeholder="Oefenaam"
            />
          </div>

          {/* Categorie */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
              Categorie *
            </label>
            <div className="flex gap-2 flex-wrap">
              {["Tactisch", "Fysiek", "Positiespel", "Afwerking", "Spelprincipes"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                  className="px-3 py-2 rounded-full text-xs font-semibold transition-all"
                  style={
                    form.category === cat
                      ? { background: "#FF6B00", color: "white" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Beschrijving */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              Beschrijving
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none min-h-24"
              placeholder="Beschrijving van de oefening"
            />
          </div>

          {/* Coaching Points */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
              Coaching Points
            </label>
            <div className="space-y-2">
              {form.coaching_points.map((point, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...form.coaching_points];
                      newPoints[idx] = e.target.value;
                      setForm(prev => ({ ...prev, coaching_points: newPoints }));
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none text-sm"
                    placeholder="Coaching point"
                  />
                  {form.coaching_points.length > 1 && (
                    <button
                      onClick={() => {
                        const newPoints = form.coaching_points.filter((_, i) => i !== idx);
                        setForm(prev => ({ ...prev, coaching_points: newPoints }));
                      }}
                      className="p-2 hover:opacity-70 transition"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#f87171" }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setForm(prev => ({ ...prev, coaching_points: [...prev.coaching_points, ""] }))}
              className="mt-2 text-sm px-3 py-1 rounded-lg" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}
            >
              + Coaching point toevoegen
            </button>
          </div>

          {/* Tijdsduur */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              Tijdsduur
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={form.duration_minutes || ""}
                onChange={(e) => setForm(prev => ({ ...prev, duration_minutes: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-24 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white focus:outline-none"
                placeholder="0"
              />
              <span className="text-sm text-white">minuten</span>
            </div>
          </div>

          {/* Groups toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.use_groups}
                onChange={(e) => setForm(prev => ({ ...prev, use_groups: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Meerdere groepen</span>
            </label>
          </div>

          {/* Groups */}
          {form.use_groups && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                Groepen
              </label>
              <div className="space-y-4">
                {form.groups.map((group, idx) => (
                  <div key={idx} className="space-y-2 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => {
                        const newGroups = [...form.groups];
                        newGroups[idx].name = e.target.value;
                        setForm(prev => ({ ...prev, groups: newGroups }));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none"
                      placeholder="Groepnaam"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={group.player_count}
                        onChange={(e) => {
                          const newGroups = [...form.groups];
                          newGroups[idx].player_count = parseInt(e.target.value);
                          setForm(prev => ({ ...prev, groups: newGroups }));
                        }}
                        className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none"
                        placeholder="0"
                      />
                      <select
                        value={group.color}
                        onChange={(e) => {
                          const newGroups = [...form.groups];
                          newGroups[idx].color = e.target.value;
                          setForm(prev => ({ ...prev, groups: newGroups }));
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none"
                      >
                        {groupColors.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const newGroups = form.groups.filter((_, i) => i !== idx);
                          setForm(prev => ({ ...prev, groups: newGroups }));
                        }}
                        className="p-2 hover:opacity-70"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: "#f87171" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, groups: [...prev.groups, { name: "", player_count: 0, color: "oranje" }] }))}
                className="mt-3 text-sm px-3 py-1 rounded-lg flex items-center gap-1" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}
              >
                <Plus className="w-3 h-3" /> Groep toevoegen
              </button>
              <textarea
                value={form.group_transition_description}
                onChange={(e) => setForm(prev => ({ ...prev, group_transition_description: e.target.value }))}
                className="w-full mt-3 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none"
                placeholder="Beschrijving van de groepswisseling"
                rows="3"
              />
            </div>
          )}

          {/* Foto */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              Foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white"
            />
            {form.photo_url && <p className="text-xs mt-2" style={{ color: "rgba(76,175,80,0.80)" }}>✓ Foto geüpload</p>}
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              YouTube URL
            </label>
            <input
              type="url"
              value={form.youtube_url}
              onChange={(e) => setForm(prev => ({ ...prev, youtube_url: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {/* Submit */}
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name}
            className="w-full btn-primary h-12 mt-8"
          >
            {mutation.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </div>
    </div>
  );
}