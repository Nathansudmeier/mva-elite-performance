import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, ChevronLeft, BookOpen } from "lucide-react";
import ExerciseLibraryModal from "./ExerciseLibraryModal";
import ExerciseCard from "./ExerciseCard";
import LiveTrainingMode from "./LiveTrainingMode";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

function genId() { return Math.random().toString(36).slice(2, 10); }

function newExercise(name = "") {
  return { id: genId(), name, description: "", duration_minutes: 10, coaching_points: [], groups: [], field_photo: null };
}

function warmupExercise() {
  return { id: genId(), name: "Warming-up", description: "", duration_minutes: 10, coaching_points: [], groups: [], field_photo: null };
}

const glassStyle = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "0.5px solid rgba(255,255,255,0.18)",
  borderRadius: "22px",
  position: "relative",
  overflow: "hidden",
};

export default function TrainingPlanEditor({ players }) {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null); // local draft
  const [livePlan, setLivePlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newObjective, setNewObjective] = useState("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["training-plans"],
    queryFn: () => base44.entities.TrainingPlan.list("-date"),
  });

  const createPlan = useMutation({
    mutationFn: (data) => base44.entities.TrainingPlan.create(data),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      setShowNewForm(false);
      setNewDate(""); setNewObjective("");
      openPlan(plan);
    },
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingPlan.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training-plans"] }),
  });

  function openPlan(plan) {
    setSelectedPlanId(plan.id);
    setEditingPlan(JSON.parse(JSON.stringify(plan)));
  }

  function closePlan() {
    setSelectedPlanId(null);
    setEditingPlan(null);
  }

  async function savePlan() {
    setSaving(true);
    await updatePlan.mutateAsync({ id: editingPlan.id, data: editingPlan });
    setSaving(false);
    closePlan();
  }

  function updateExercise(idx, updated) {
    const exercises = [...editingPlan.exercises];
    exercises[idx] = updated;
    setEditingPlan({ ...editingPlan, exercises });
  }

  function removeExercise(idx) {
    const exercises = [...editingPlan.exercises];
    exercises.splice(idx, 1);
    setEditingPlan({ ...editingPlan, exercises });
  }

  function addExercise() {
    if ((editingPlan.exercises || []).length >= 10) return;
    setEditingPlan({ ...editingPlan, exercises: [...(editingPlan.exercises || []), newExercise()] });
  }

  // Drag & drop reorder (simple touch/mouse)
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTargetIdx, setLibraryTargetIdx] = useState(null);

  function onDragStart(i) { setDragging(i); }
  function onDragEnter(i) { setDragOver(i); }
  function onDragEnd() {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      const exercises = [...editingPlan.exercises];
      const [item] = exercises.splice(dragging, 1);
      exercises.splice(dragOver, 0, item);
      setEditingPlan({ ...editingPlan, exercises });
    }
    setDragging(null);
    setDragOver(null);
  }

  if (livePlan) {
    return <LiveTrainingMode plan={livePlan} players={players} onClose={() => { setLivePlan(null); queryClient.invalidateQueries({ queryKey: ["training-plans"] }); }} />;
  }

  // ── Plan detail editor ──
  if (editingPlan) {
    return (
      <div className="space-y-4 pb-20 lg:pb-6">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={closePlan} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} color="#fff" />
          </button>
          <div>
            <p className="t-page-title">Trainingsplan</p>
            <p className="t-secondary">{editingPlan.date ? format(parseISO(editingPlan.date), "EEEE d MMMM yyyy", { locale: nl }) : ""}</p>
          </div>
        </div>

        {/* Session header */}
        <div style={{ ...glassStyle, padding: "16px" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", pointerEvents: "none" }} />
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Datum</p>
            <input
              type="date"
              value={editingPlan.date || ""}
              onChange={e => setEditingPlan({ ...editingPlan, date: e.target.value })}
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", colorScheme: "dark", minHeight: "44px" }}
            />
          </div>
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Sessiedoelstelling</p>
            <textarea
              value={editingPlan.objective || ""}
              onChange={e => setEditingPlan({ ...editingPlan, objective: e.target.value })}
              placeholder="Bijv. Positiespel verbeteren, pressing oefenen..."
              rows={2}
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", resize: "vertical" }}
            />
          </div>
        </div>

        {/* Exercises */}
        <div>
          {(editingPlan.exercises || []).map((ex, i) => (
            <div
              key={ex.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              style={{ opacity: dragging === i ? 0.5 : 1, transition: "opacity 0.15s" }}
            >
              <ExerciseCard
                exercise={ex}
                players={players}
                onChange={updated => updateExercise(i, updated)}
                onRemove={() => removeExercise(i)}
                dragHandleProps={{ onMouseDown: () => onDragStart(i) }}
              />
            </div>
          ))}
        </div>

        {/* Add exercise */}
        {(editingPlan.exercises || []).length < 10 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={addExercise}
              style={{ flex: 1, minHeight: "44px", background: "rgba(255,107,0,0.10)", border: "0.5px dashed rgba(255,107,0,0.35)", borderRadius: "14px", color: "#FF8C3A", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <Plus size={16} /> Nieuw ({(editingPlan.exercises || []).length}/10)
            </button>
            <button
              onClick={() => { setLibraryTargetIdx(null); setShowLibrary(true); }}
              style={{ minHeight: "44px", padding: "0 16px", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.18)", borderRadius: "14px", color: "rgba(255,255,255,0.70)", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <BookOpen size={15} /> Bibliotheek
            </button>
          </div>
        )}

        {showLibrary && (
          <ExerciseLibraryModal
            currentExercise={libraryTargetIdx !== null ? editingPlan.exercises?.[libraryTargetIdx] : null}
            onSelect={(tpl) => {
              if (libraryTargetIdx !== null) {
                updateExercise(libraryTargetIdx, { ...editingPlan.exercises[libraryTargetIdx], ...tpl });
              } else {
                setEditingPlan(p => ({ ...p, exercises: [...(p.exercises || []), { ...tpl, id: genId() }] }));
              }
            }}
            onClose={() => setShowLibrary(false)}
          />
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={savePlan}
            disabled={saving}
            style={{ flex: 1, minHeight: "52px", background: "rgba(255,255,255,0.10)", border: "0.5px solid rgba(255,255,255,0.20)", borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
          <button
            onClick={async () => { await savePlan(); setLivePlan({ ...editingPlan }); }}
            style={{ flex: 2, minHeight: "52px", background: "#FF6B00", border: "none", borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Play size={16} /> Start training
          </button>
        </div>
      </div>
    );
  }

  // ── Plan list ──
  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="t-section-title">Trainingsplannen</p>
        <button
          onClick={() => setShowNewForm(s => !s)}
          style={{ background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.35)", borderRadius: "12px", color: "#FF8C3A", fontSize: "13px", fontWeight: 600, padding: "8px 14px", cursor: "pointer", minHeight: "44px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={14} /> Nieuw plan
        </button>
      </div>

      {/* New plan form */}
      {showNewForm && (
        <div style={{ ...glassStyle, padding: "16px" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", pointerEvents: "none" }} />
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Nieuw trainingsplan</p>
          <div style={{ marginBottom: "8px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Datum</p>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", colorScheme: "dark", minHeight: "44px" }} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Sessiedoelstelling (optioneel)</p>
            <input value={newObjective} onChange={e => setNewObjective(e.target.value)} placeholder="Bijv. Pressing en omschakeling..." style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", minHeight: "44px" }} />
          </div>
          <button
            onClick={() => newDate && createPlan.mutate({ date: newDate, objective: newObjective, exercises: [warmupExercise()], status: "draft" })}
            disabled={!newDate || createPlan.isPending}
            style={{ width: "100%", minHeight: "52px", background: "#FF6B00", border: "none", borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            {createPlan.isPending ? "Aanmaken..." : "Plan aanmaken"}
          </button>
        </div>
      )}

      {/* Plan list */}
      {isLoading ? (
        <p className="t-secondary">Laden...</p>
      ) : plans.length === 0 ? (
        <div style={{ ...glassStyle, padding: "32px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", pointerEvents: "none" }} />
          <p style={{ color: "rgba(255,255,255,0.40)", fontSize: "14px" }}>Nog geen trainingsplannen.</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px", marginTop: "4px" }}>Maak je eerste plan aan via 'Nieuw plan'.</p>
        </div>
      ) : (
        plans.map(plan => {
          const total = (plan.exercises || []).reduce((s, e) => s + (e.duration_minutes || 0), 0);
          const statusColors = { draft: "#fbbf24", active: "#FF8C3A", completed: "#4ade80" };
          const statusLabels = { draft: "Concept", active: "Actief", completed: "Voltooid" };
          return (
            <div key={plan.id} style={{ ...glassStyle, padding: "16px", cursor: "pointer" }} onClick={() => openPlan(plan)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>
                    {plan.date ? format(parseISO(plan.date), "EEEE d MMMM", { locale: nl }) : "Ongedateerd"}
                  </p>
                  {plan.objective && <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", marginTop: "2px" }}>{plan.objective}</p>}
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)" }}>{(plan.exercises || []).length} oefeningen</span>
                    {total > 0 && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)" }}>• {total} min</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span style={{ background: statusColors[plan.status] + "22", border: `0.5px solid ${statusColors[plan.status]}`, borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 700, color: statusColors[plan.status] }}>
                    {statusLabels[plan.status]}
                  </span>
                  {plan.status !== "completed" && (
                    <button
                      onClick={e => { e.stopPropagation(); setLivePlan(plan); }}
                      style={{ background: "#FF6B00", border: "none", borderRadius: "10px", padding: "6px 12px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", minHeight: "36px" }}
                    >
                      <Play size={12} /> Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}