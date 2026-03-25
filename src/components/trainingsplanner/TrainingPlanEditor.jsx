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

const cardStyle = {
  background: "#ffffff",
  border: "2.5px solid #1a1a1a",
  borderRadius: "18px",
  boxShadow: "3px 3px 0 #1a1a1a",
};

export default function TrainingPlanEditor({ players, trainingDate, readOnly = false }) {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null); // local draft
  const [livePlan, setLivePlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newObjective, setNewObjective] = useState("");

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["training-plans"],
    queryFn: () => base44.entities.TrainingPlan.list("-date"),
  });

  const plans = trainingDate ? allPlans.filter(p => p.date === trainingDate) : allPlans;

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
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={closePlan} style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer" }}>
            <ChevronLeft size={18} color="#1a1a1a" />
          </button>
          <div>
            <p className="t-page-title">Trainingsplan</p>
            <p className="t-secondary">{editingPlan.date ? format(parseISO(editingPlan.date), "EEEE d MMMM yyyy", { locale: nl }) : ""}</p>
          </div>
        </div>

        {/* Session header */}
        <div style={{ ...cardStyle, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Datum</p>
            <input
              type="date"
              value={editingPlan.date || ""}
              onChange={e => setEditingPlan({ ...editingPlan, date: e.target.value })}
              style={{ width: "100%", background: "#f5f5f5", border: "2px solid rgba(26,26,26,0.15)", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", color: "#1a1a1a", outline: "none", minHeight: "44px" }}
            />
          </div>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Sessiedoelstelling</p>
            <textarea
              value={editingPlan.objective || ""}
              onChange={e => setEditingPlan({ ...editingPlan, objective: e.target.value })}
              placeholder="Bijv. Positiespel verbeteren, pressing oefenen..."
              rows={2}
              style={{ width: "100%", background: "#f5f5f5", border: "2px solid rgba(26,26,26,0.15)", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", color: "#1a1a1a", outline: "none", resize: "vertical" }}
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

        {/* Add exercise from library */}
        {!readOnly && (editingPlan.exercises || []).length < 10 && (
          <button
            onClick={() => { setLibraryTargetIdx(null); setShowLibrary(true); }}
            style={{ width: "100%", minHeight: "52px", background: "#ffffff", border: "2.5px dashed rgba(26,26,26,0.25)", borderRadius: "14px", color: "#FF6800", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Plus size={16} /> Oefenvorm toevoegen ({(editingPlan.exercises || []).length}/10)
          </button>
        )}

        {!readOnly && showLibrary && (
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
        {!readOnly && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={savePlan}
              disabled={saving}
              style={{ flex: 1, minHeight: "52px", background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", borderRadius: "14px", color: "#1a1a1a", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
            <button
              onClick={async () => {
                setSaving(true);
                await updatePlan.mutateAsync({ id: editingPlan.id, data: editingPlan });
                setSaving(false);
                setLivePlan({ ...editingPlan });
              }}
              style={{ flex: 2, minHeight: "52px", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Play size={16} /> Start training
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Plan list ──
  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="t-section-title">Trainingsplannen</p>
        {!readOnly && (
          <button
            onClick={() => setShowNewForm(s => !s)}
            style={{ background: "#FF6800", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", borderRadius: "12px", color: "#fff", fontSize: "13px", fontWeight: 700, padding: "8px 14px", cursor: "pointer", minHeight: "40px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={14} /> Nieuw plan
          </button>
        )}
      </div>

      {/* New plan form */}
      {!readOnly && showNewForm && (
        <div style={{ ...cardStyle, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>Nieuw trainingsplan</p>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Datum</p>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ width: "100%", background: "#f5f5f5", border: "2px solid rgba(26,26,26,0.15)", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", color: "#1a1a1a", outline: "none", minHeight: "44px" }} />
          </div>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Sessiedoelstelling (optioneel)</p>
            <input value={newObjective} onChange={e => setNewObjective(e.target.value)} placeholder="Bijv. Pressing en omschakeling..." style={{ width: "100%", background: "#f5f5f5", border: "2px solid rgba(26,26,26,0.15)", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", color: "#1a1a1a", outline: "none", minHeight: "44px" }} />
          </div>
          <button
            onClick={() => newDate && createPlan.mutate({ date: newDate, objective: newObjective, exercises: [warmupExercise()], status: "draft" })}
            disabled={!newDate || createPlan.isPending}
            style={{ width: "100%", minHeight: "52px", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: !newDate ? "not-allowed" : "pointer", opacity: !newDate ? 0.5 : 1 }}
          >
            {createPlan.isPending ? "Aanmaken..." : "Plan aanmaken"}
          </button>
        </div>
      )}

      {/* Plan list */}
      {isLoading ? (
        <p className="t-secondary">Laden...</p>
      ) : plans.length === 0 ? (
        <div style={{ ...cardStyle, padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,26,0.45)" }}>Nog geen trainingsplannen.</p>
          <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.30)", marginTop: "4px" }}>Maak je eerste plan aan via 'Nieuw plan'.</p>
        </div>
      ) : (
        plans.map(plan => {
          const total = (plan.exercises || []).reduce((s, e) => s + (e.duration_minutes || 0), 0);
          const statusColors = { draft: "#cc9900", active: "#FF6800", completed: "#05a050" };
          const statusBg = { draft: "rgba(255,214,0,0.15)", active: "rgba(255,104,0,0.12)", completed: "rgba(8,208,104,0.12)" };
          const statusLabels = { draft: "Concept", active: "Actief", completed: "Voltooid" };
          return (
            <div key={plan.id} style={{ ...cardStyle, padding: "16px", cursor: "pointer" }} onClick={() => openPlan(plan)}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#1a1a1a", fontWeight: 800, fontSize: "14px" }}>
                    {plan.date ? format(parseISO(plan.date), "EEEE d MMMM", { locale: nl }) : "Ongedateerd"}
                  </p>
                  {plan.objective && <p style={{ color: "rgba(26,26,26,0.55)", fontSize: "12px", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plan.objective}</p>}
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{(plan.exercises || []).length} oefeningen</span>
                    {total > 0 && <span style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>· {total} min</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                  <span style={{ background: statusBg[plan.status], border: `1.5px solid ${statusColors[plan.status]}`, borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, color: statusColors[plan.status] }}>
                    {statusLabels[plan.status]}
                  </span>
                  {!readOnly && plan.status !== "completed" && (
                    <button
                      onClick={e => { e.stopPropagation(); setLivePlan(plan); }}
                      style={{ background: "#FF6800", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", borderRadius: "10px", padding: "6px 12px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", minHeight: "36px" }}
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