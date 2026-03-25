import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus, BookOpen, Save, Clock } from "lucide-react";

const CATEGORY_COLORS = {
  Tactisch:      "#00C2FF",
  Fysiek:        "#08D068",
  Positiespel:   "#9B5CFF",
  Afwerking:     "#FF6800",
  Spelprincipes: "#FFD600",
};

export default function ExerciseLibraryModal({ onSelect, onClose, currentExercise }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("library");
  const [saveName, setSaveName] = useState(currentExercise?.name || "");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["exercise-templates"],
    queryFn: () => base44.entities.ExerciseTemplate.list("-created_date"),
  });

  const saveTemplate = useMutation({
    mutationFn: (data) => base44.entities.ExerciseTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise-templates"] });
      setTab("library");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id) => base44.entities.ExerciseTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercise-templates"] }),
  });

  function handleSave() {
    if (!saveName.trim()) return;
    const groups = (currentExercise?.groups || []).map(g => ({
      name: g.name || "",
      player_count: (g.player_ids || []).length || undefined,
      color: g.color || "oranje",
    }));
    saveTemplate.mutate({
      name: saveName.trim(),
      description: currentExercise?.description || "",
      duration_minutes: currentExercise?.duration_minutes || 10,
      coaching_points: currentExercise?.coaching_points || [],
      photo_url: currentExercise?.field_drawing || currentExercise?.field_photo || null,
      youtube_url: currentExercise?.youtube_url || null,
      groups,
    });
  }

  function handleSelect(tpl) {
    const groups = (tpl.groups || []).map(g => ({
      id: Math.random().toString(36).slice(2, 10),
      name: g.name || "",
      color: g.color || "oranje",
      player_ids: [],
    }));
    onSelect({
      name: tpl.name,
      description: tpl.description || "",
      duration_minutes: tpl.duration_minutes || 10,
      coaching_points: tpl.coaching_points || [],
      field_drawing: tpl.photo_url || null,
      youtube_url: tpl.youtube_url || null,
      groups,
    });
    onClose();
  }

  const filtered = searchQuery
    ? templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : templates;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(26,26,26,0.60)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: "560px", maxHeight: "85vh", background: "#FFF3E8", border: "2.5px solid #1a1a1a", borderRadius: "24px 24px 0 0", boxShadow: "0 -4px 0 #1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(26,26,26,0.20)", margin: "12px auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0", flexShrink: 0 }}>
          <p style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>Bibliotheek</p>
          <button
            onClick={onClose}
            style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", borderRadius: "10px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={16} color="#1a1a1a" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 16px 0", flexShrink: 0 }}>
          {[["library", "Bibliotheek"], ["save", "Opslaan"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 800, cursor: "pointer",
                background: tab === key ? "#1a1a1a" : "#ffffff",
                border: "2px solid #1a1a1a",
                color: tab === key ? "#ffffff" : "#1a1a1a",
                minHeight: "38px",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 32px" }}>
          {tab === "save" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)", fontWeight: 500 }}>Sla de huidige oefenvorm op in de bibliotheek.</p>
              <div>
                <label style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px", display: "block" }}>Naam</label>
                <input
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Naam van de oefenvorm..."
                  style={{ width: "100%", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", fontWeight: 600, color: "#1a1a1a", outline: "none", minHeight: "48px", boxSizing: "border-box" }}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!saveName.trim() || saveTemplate.isPending}
                style={{ width: "100%", minHeight: "52px", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: !saveName.trim() ? 0.5 : 1 }}
              >
                <Save size={16} /> {saveTemplate.isPending ? "Opslaan..." : "Opslaan in bibliotheek"}
              </button>
            </div>
          ) : isLoading ? (
            <p style={{ color: "rgba(26,26,26,0.40)", fontSize: "13px", paddingTop: "16px", textAlign: "center" }}>Laden...</p>
          ) : (
            <>
              {/* Search */}
              <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", height: "44px", marginBottom: "10px" }}>
                <span style={{ color: "rgba(26,26,26,0.35)", fontSize: "14px" }}>🔍</span>
                <input
                  type="text"
                  placeholder="Zoek oefening..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}
                />
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "32px" }}>
                  <BookOpen size={36} color="rgba(26,26,26,0.15)" style={{ margin: "0 auto 10px" }} />
                  <p style={{ color: "rgba(26,26,26,0.35)", fontSize: "14px", fontWeight: 700 }}>Geen oefeningen gevonden</p>
                  <p style={{ color: "rgba(26,26,26,0.25)", fontSize: "12px", marginTop: "4px" }}>Ga naar 'Opslaan' om een oefening toe te voegen.</p>
                </div>
              ) : (
                filtered.map(tpl => {
                  const catColor = CATEGORY_COLORS[tpl.category] || "#1a1a1a";
                  return (
                    <div
                      key={tpl.id}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "2px 2px 0 #1a1a1a", marginBottom: "8px" }}
                    >
                      {tpl.photo_url ? (
                        <img src={tpl.photo_url} alt="" style={{ width: "52px", height: "52px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "2px solid #1a1a1a" }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: catColor, border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "10px", fontWeight: 900, color: catColor === "#FFD600" || catColor === "#08D068" || catColor === "#00C2FF" ? "#1a1a1a" : "#ffffff" }}>{tpl.category?.slice(0, 3).toUpperCase()}</span>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>{tpl.name}</p>
                        {tpl.description && <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{tpl.description}</p>}
                        {tpl.duration_minutes && (
                          <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(26,26,26,0.35)", marginTop: "2px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Clock size={10} /> {tpl.duration_minutes} min
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                        <button
                          onClick={() => handleSelect(tpl)}
                          style={{ background: "#FF6800", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 800, color: "#fff", cursor: "pointer", minHeight: "34px", whiteSpace: "nowrap" }}
                        >
                          Selecteren
                        </button>
                        <button
                          onClick={() => deleteTemplate.mutate(tpl.id)}
                          style={{ background: "rgba(255,61,168,0.10)", border: "2px solid rgba(255,61,168,0.30)", borderRadius: "8px", padding: "4px 8px", fontSize: "11px", fontWeight: 700, color: "#FF3DA8", cursor: "pointer", minHeight: "28px" }}
                        >
                          Verwijder
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}