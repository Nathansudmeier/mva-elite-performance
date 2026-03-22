import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus, BookOpen, Save } from "lucide-react";

export default function ExerciseLibraryModal({ onSelect, onClose, currentExercise }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("library"); // "library" | "save"
  const [saveName, setSaveName] = useState(currentExercise?.name || "");

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
    saveTemplate.mutate({
      name: saveName.trim(),
      description: currentExercise?.description || "",
      duration_minutes: currentExercise?.duration_minutes || 10,
      coaching_points: currentExercise?.coaching_points || [],
      field_photo: currentExercise?.field_photo || null,
    });
  }

  function handleSelect(tpl) {
    onSelect({
      name: tpl.name,
      description: tpl.description || "",
      duration_minutes: tpl.duration_minutes || 10,
      coaching_points: tpl.coaching_points || [],
      field_photo: tpl.field_photo || null,
      groups: [],
    });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div
        style={{ width: "100%", maxWidth: "540px", maxHeight: "80vh", background: "rgba(20,10,2,0.97)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.20)", margin: "12px auto 0" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Oefeningen bibliotheek</p>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", padding: "12px 16px 0" }}>
          {[["library", "Bibliotheek"], ["save", "Huidige opslaan"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{ padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: tab === key ? "#FF6B00" : "rgba(255,255,255,0.07)", border: "0.5px solid " + (tab === key ? "#FF6B00" : "rgba(255,255,255,0.15)"), color: tab === key ? "#fff" : "rgba(255,255,255,0.55)", minHeight: "36px" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="modal-scroll-content" style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
          {tab === "save" ? (
            <div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "10px" }}>Sla de huidige oefenvorm op in de bibliotheek.</p>
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Naam van de oefenvorm..."
                style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#fff", outline: "none", marginBottom: "10px", minHeight: "44px" }}
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim() || saveTemplate.isPending}
                style={{ width: "100%", minHeight: "48px", background: "#FF6B00", border: "none", borderRadius: "12px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Save size={15} /> {saveTemplate.isPending ? "Opslaan..." : "Opslaan in bibliotheek"}
              </button>
            </div>
          ) : isLoading ? (
            <p style={{ color: "rgba(255,255,255,0.40)", fontSize: "13px", paddingTop: "16px", textAlign: "center" }}>Laden...</p>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "24px" }}>
              <BookOpen size={32} color="rgba(255,255,255,0.20)" style={{ margin: "0 auto 10px" }} />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>Nog geen oefeningen opgeslagen.</p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", marginTop: "4px" }}>Ga naar 'Huidige opslaan' om een oefening toe te voegen.</p>
            </div>
          ) : (
            templates.map(tpl => (
              <div key={tpl.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "14px", marginBottom: "8px" }}>
                {tpl.field_photo && (
                  <img src={tpl.field_photo} alt="" style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{tpl.name}</p>
                  {tpl.description && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.description}</p>}
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", marginTop: "2px" }}>{tpl.duration_minutes || 10} min • {(tpl.coaching_points || []).length} coaching points</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleSelect(tpl)}
                    style={{ background: "#FF6B00", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: "#fff", cursor: "pointer", minHeight: "34px" }}
                  >
                    Selecteren
                  </button>
                  <button
                    onClick={() => deleteTemplate.mutate(tpl.id)}
                    style={{ background: "rgba(248,113,113,0.10)", border: "0.5px solid rgba(248,113,113,0.20)", borderRadius: "8px", padding: "4px 8px", fontSize: "11px", color: "#f87171", cursor: "pointer", minHeight: "28px" }}
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}