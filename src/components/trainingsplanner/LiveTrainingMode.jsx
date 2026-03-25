import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const GROUP_COLORS = {
  red: "#FF3DA8", orange: "#FF6800", yellow: "#FFD600",
  green: "#08D068", blue: "#00C2FF", white: "#f0f0f0"
};

export default function LiveTrainingMode({ plan, players, onClose }) {
  const queryClient = useQueryClient();
  const exercises = plan.exercises || [];
  const [completed, setCompleted] = useState({});
  const [timers, setTimers] = useState({});
  const [showHints, setShowHints] = useState({});
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function startTimer(exerciseId) {
    if (timers[exerciseId]) return;
    setTimers(t => ({ ...t, [exerciseId]: Date.now() }));
  }

  function elapsed(exerciseId) {
    if (!timers[exerciseId]) return 0;
    return Math.floor((Date.now() - timers[exerciseId]) / 1000);
  }

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
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#FFF3E8", overflowY: "auto", paddingBottom: "100px" }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#FFF3E8", borderBottom: "2.5px solid #1a1a1a" }}>
        {/* Progress bar */}
        <div style={{ height: "5px", background: "rgba(26,26,26,0.10)", width: "100%" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#FF6800", transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div>
            <p style={{ color: "#1a1a1a", fontWeight: 900, fontSize: "16px", letterSpacing: "-0.3px" }}>Live Training</p>
            <p style={{ color: "rgba(26,26,26,0.45)", fontSize: "12px", fontWeight: 700 }}>{completedCount}/{exercises.length} afgerond</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} color="#1a1a1a" />
          </button>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
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
              style={{
                background: isDone ? "rgba(8,208,104,0.08)" : "#ffffff",
                border: isDone ? "2.5px solid #08D068" : "2.5px solid #1a1a1a",
                borderRadius: "18px",
                boxShadow: isDone ? "3px 3px 0 #08D068" : "3px 3px 0 #1a1a1a",
                padding: "16px",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ width: "22px", height: "22px", borderRadius: "8px", background: isDone ? "#08D068" : "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", fontWeight: 900, color: "#ffffff" }}>{i + 1}</span>
                    </span>
                    <span style={{ color: "#1a1a1a", fontWeight: 800, fontSize: "15px", textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.55 : 1 }}>{ex.name}</span>
                  </div>

                  {/* Timer */}
                  {timers[ex.id] && (
                    <div style={{ marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 900, color: isOvertime ? "#FF3DA8" : "#FF6800", fontVariantNumeric: "tabular-nums" }}>
                        {isOvertime ? `+${formatTime(sec - totalSec)} over` : formatTime(remaining)}
                      </span>
                      {!isOvertime && <span style={{ fontSize: "11px", color: "rgba(26,26,26,0.40)", fontWeight: 600, marginLeft: "6px" }}>resterend</span>}
                    </div>
                  )}
                  {!timers[ex.id] && ex.duration_minutes > 0 && (
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(26,26,26,0.40)", marginBottom: "4px" }}>{ex.duration_minutes} min</p>
                  )}

                  {/* Group pills */}
                  {groups.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {groups.map(g => {
                        const gc = GROUP_COLORS[g.color] || "#FF6800";
                        return (
                          <span key={g.id} style={{ background: gc + "20", border: `2px solid ${gc}`, borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 800, color: gc === "#f0f0f0" ? "#1a1a1a" : gc }}>
                            {g.name} {g.player_ids.length > 0 ? `(${g.player_ids.length})` : ""}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Coaching points */}
                  {(ex.coaching_points || []).length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowHints(h => ({ ...h, [ex.id]: !h[ex.id] }))}
                        style={{ fontSize: "12px", fontWeight: 700, color: "#FF6800", background: "rgba(255,104,0,0.10)", border: "2px solid rgba(255,104,0,0.25)", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        Coaching {showHints[ex.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      {showHints[ex.id] && (
                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {ex.coaching_points.map((pt, j) => (
                            <div key={j} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                              <div style={{ width: "18px", height: "18px", borderRadius: "6px", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                                <span style={{ fontSize: "8px", fontWeight: 900, color: "#fff" }}>{j + 1}</span>
                              </div>
                              <span style={{ fontSize: "13px", color: "#1a1a1a", lineHeight: 1.4, fontWeight: 500 }}>{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Complete button */}
                <button
                  onClick={() => { toggleComplete(ex); if (!timers[ex.id]) startTimer(ex.id); }}
                  style={{
                    width: "48px", height: "48px", borderRadius: "14px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    background: isDone ? "#08D068" : "#ffffff",
                    border: isDone ? "2.5px solid #08D068" : "2.5px solid #1a1a1a",
                    boxShadow: isDone ? "2px 2px 0 rgba(8,208,104,0.5)" : "2px 2px 0 #1a1a1a",
                    transition: "all 0.15s",
                  }}
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
          style={{ width: "100%", height: "56px", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", borderRadius: "16px", color: "#fff", fontSize: "15px", fontWeight: 800, cursor: "pointer", marginTop: "6px" }}
        >
          {saving ? "Opslaan..." : "Training afronden"}
        </button>
      </div>
    </div>
  );
}