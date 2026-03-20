import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const GROUP_COLORS = { red: "#f87171", orange: "#FF8C3A", yellow: "#fbbf24", green: "#4ade80", blue: "#60a5fa", white: "#ffffff" };

export default function LiveTrainingMode({ plan, players, onClose }) {
  const queryClient = useQueryClient();
  const exercises = plan.exercises || [];
  const [completed, setCompleted] = useState({});
  const [timers, setTimers] = useState({});
  const [showHints, setShowHints] = useState({});
  const [saving, setSaving] = useState(false);

  // Start timer for an exercise when it becomes active
  function startTimer(exerciseId) {
    if (timers[exerciseId]) return;
    setTimers(t => ({ ...t, [exerciseId]: Date.now() }));
  }

  // Elapsed seconds
  function elapsed(exerciseId) {
    if (!timers[exerciseId]) return 0;
    return Math.floor((Date.now() - timers[exerciseId]) / 1000);
  }

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function toggleComplete(ex) {
    const now = new Date().toISOString();
    if (completed[ex.id]) {
      setCompleted(c => { const n = { ...c }; delete n[ex.id]; return n; });
    } else {
      setCompleted(c => ({ ...c, [ex.id]: now }));
      startTimer(ex.id);
    }
  }

  function toggleHints(id) {
    setShowHints(h => ({ ...h, [id]: !h[id] }));
  }

  const completedCount = Object.keys(completed).length;
  const progress = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  async function finishTraining() {
    setSaving(true);
    const live_log = Object.entries(completed).map(([exercise_id, completed_at]) => ({ exercise_id, completed_at }));
    await base44.entities.TrainingPlan.update(plan.id, { status: "completed", live_log });
    queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(20,10,2,0.97)", overflowY: "auto", paddingBottom: "100px" }}>
      {/* Progress bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(20,10,2,0.95)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", padding: "0" }}>
        <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", width: "100%" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #FF6B00, #FF9500)", transition: "width 0.4s ease", borderRadius: "2px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>Live Training</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>{completedCount}/{exercises.length} oefeningen</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} color="#fff" />
          </button>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "700px", margin: "0 auto" }}>
        {exercises.map((ex, i) => {
          const isDone = !!completed[ex.id];
          const sec = timers[ex.id] ? elapsed(ex.id) : 0;
          const totalSec = (ex.duration_minutes || 0) * 60;
          const remaining = Math.max(0, totalSec - sec);
          const isOvertime = totalSec > 0 && sec > totalSec;
          const groups = ex.groups || [];

          return (
            <div
              key={ex.id}
              style={{ background: isDone ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.07)", border: isDone ? "0.5px solid rgba(74,222,128,0.25)" : "0.5px solid rgba(255,255,255,0.12)", borderRadius: "18px", padding: "16px", marginBottom: "10px", minHeight: "64px" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>{ex.name}</span>
                  </div>

                  {/* Timer */}
                  {timers[ex.id] && (
                    <p style={{ fontSize: "13px", fontWeight: 700, color: isOvertime ? "#f87171" : "#FF8C3A", marginBottom: "4px" }}>
                      {isOvertime ? `+${formatTime(sec - totalSec)} over` : `${formatTime(remaining)} resterend`}
                    </p>
                  )}
                  {!timers[ex.id] && ex.duration_minutes > 0 && (
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", marginBottom: "4px" }}>{ex.duration_minutes} min</p>
                  )}

                  {/* Group pills */}
                  {groups.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
                      {groups.map(g => (
                        <span key={g.id} style={{ background: GROUP_COLORS[g.color] + "22", border: `0.5px solid ${GROUP_COLORS[g.color]}`, borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, color: GROUP_COLORS[g.color] }}>
                          {g.name} {g.player_ids.length}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Hints */}
                  {(ex.coaching_points || []).length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleHints(ex.id)}
                        style={{ fontSize: "11px", color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", marginBottom: showHints[ex.id] ? "8px" : "0" }}
                      >
                        Toon hints {showHints[ex.id] ? "▲" : "▼"}
                      </button>
                      {showHints[ex.id] && (
                        <div>
                          {ex.coaching_points.map((pt, j) => (
                            <div key={j} style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                              <span style={{ color: "#FF8C3A" }}>•</span>
                              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.70)" }}>{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Complete checkbox */}
                <button
                  onClick={() => { toggleComplete(ex); if (!timers[ex.id]) startTimer(ex.id); }}
                  style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isDone ? "#4ade80" : "rgba(255,255,255,0.10)", border: isDone ? "none" : "0.5px solid rgba(255,255,255,0.20)", transition: "all 0.2s" }}
                >
                  {isDone && <Check size={22} color="#fff" strokeWidth={3} />}
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={finishTraining}
          disabled={saving}
          style={{ width: "100%", height: "52px", background: "#FF6B00", border: "none", borderRadius: "16px", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "16px" }}
        >
          {saving ? "Opslaan..." : "Sluit training"}
        </button>
      </div>
    </div>
  );
}