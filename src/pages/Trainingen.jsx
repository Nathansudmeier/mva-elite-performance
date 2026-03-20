import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Check, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, subWeeks, addWeeks, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import TrainingPlanEditor from "@/components/trainingsplanner/TrainingPlanEditor";

// Generate Mon/Wed/Fri for a given week start (Monday)
function getTrainingDaysForWeek(weekStart) {
  return [0, 2, 4].map((offset) => addDays(weekStart, offset)); // Mon=0, Wed=2, Fri=4
}

export default function Trainingen() {
  const queryClient = useQueryClient();
  const { isTrainer, user, playerId: myPlayerId } = useCurrentUser();

  const [activeTab, setActiveTab] = useState("aanwezigheid");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list("-date") });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });

  const activePlayers = players.filter((p) => p.active !== false);

  // Filter sessions for current week
  const weekSessions = sessions.filter((s) => {
    const d = parseISO(s.date);
    return !isBefore(d, weekStart) && !isAfter(d, weekEnd) && s.type === "Training";
  });

  // The 3 expected training days this week
  const trainingDays = getTrainingDaysForWeek(weekStart);

  // Match each day to an existing session (if any)
  const daySlots = trainingDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const session = weekSessions.find((s) => s.date === dateStr) || null;
    return { day, dateStr, session };
  });

  const createSessionMutation = useMutation({
    mutationFn: async (date) => {
      const session = await base44.entities.TrainingSession.create({ date, type: "Training", notes: sessionNotes });
      const records = activePlayers.map((p) => ({ session_id: session.id, player_id: p.id, present: false }));
      await base44.entities.Attendance.bulkCreate(records);
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setNewSessionDialog(false);
      setSessionNotes("");
      setSelectedSessionId(session.id);
    },
  });

  const toggleAttendance = useMutation({
    mutationFn: async ({ attendanceId, present }) => {
      await base44.entities.Attendance.update(attendanceId, { present });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
  const sessionAttendance = selectedSession
    ? attendance.filter((a) => a.session_id === selectedSession.id)
    : [];

  // For player: find own attendance record for selected session
  const myAttendanceRecord = !isTrainer && myPlayerId
    ? sessionAttendance.find((a) => a.player_id === myPlayerId)
    : null;

  // Overall attendance overview (all sessions)
  const getPlayerAttendancePct = (playerId) => {
    if (sessions.length === 0) return 0;
    const present = attendance.filter((a) => a.player_id === playerId && a.present).length;
    return ((present / sessions.length) * 100).toFixed(0);
  };

  const dayNames = ["Ma", "Wo", "Vr"];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Trainingen</h1>
          <p className="t-secondary">{sessions.filter(s => s.type === "Training").length} trainingen geregistreerd</p>
        </div>
        {isTrainer && activeTab === "aanwezigheid" && (
          <button onClick={() => { setSessionDate(""); setNewSessionDialog(true); }} className="btn-secondary">
            <Plus size={14} /> Extra Sessie
          </button>
        )}
      </div>

      {/* Tab switcher */}
      {isTrainer && (
        <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "14px", padding: "4px" }}>
          {[{ id: "aanwezigheid", label: "Aanwezigheid" }, { id: "planner", label: "Trainingsplanner" }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, padding: "8px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", minHeight: "44px", background: activeTab === tab.id ? "#FF6B00" : "transparent", color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.50)", border: "none", transition: "all 0.2s" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Trainingsplanner tab */}
      {isTrainer && activeTab === "planner" && (
        <TrainingPlanEditor players={activePlayers} />
      )}

      {/* Aanwezigheid tab content — only shown when active */}
      {activeTab !== "planner" && (
        <>

      {/* Week navigator */}
      <div className="glass overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.10)" }}>
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="t-card-title">
            {format(weekStart, "d MMM", { locale: nl })} – {format(weekEnd, "d MMM yyyy", { locale: nl })}
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>

        {/* Day slots */}
        <div className="grid grid-cols-3" style={{ borderTop: "0" }}>
          {daySlots.map(({ day, dateStr, session }, i) => {
            const isPast = isBefore(day, today);
            const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
            const isSelected = session && selectedSessionId === session.id;
            const sAtt = session ? attendance.filter((a) => a.session_id === session.id) : [];
            const presentCount = sAtt.filter((a) => a.present).length;

            return (
              <div key={dateStr} className="p-3 text-center" style={{ borderRight: i < 2 ? "0.5px solid rgba(255,255,255,0.10)" : "none" }}>
                <p className="t-label mb-0.5">{dayNames[i]}</p>
                <p className={`text-lg font-bold mb-2 ${isToday ? "text-[#FF8C3A]" : "text-white"}`}>{format(day, "d")}</p>
                {session ? (
                  <button
                    onClick={() => setSelectedSessionId(isSelected ? null : session.id)}
                    className="w-full py-2 px-1 rounded-xl text-xs font-bold transition-all"
                    style={isSelected ? { background: "#FF6B00", color: "#fff" } : { background: "rgba(255,107,0,0.15)", color: "#FF8C3A", border: "0.5px solid rgba(255,107,0,0.3)" }}
                  >
                    {presentCount}/{sAtt.length || activePlayers.length}<br />aanwezig
                  </button>
                ) : (
                  <div className="w-full py-2 px-1 rounded-xl text-xs">
                    {isPast ? (
                      isTrainer ? <button onClick={() => createSessionMutation.mutate(dateStr)} className="t-secondary" style={{ color: "#FF8C3A", textDecoration: "underline" }}>Toevoegen</button> : <span className="t-tertiary">–</span>
                    ) : (
                      isTrainer ? <button onClick={() => createSessionMutation.mutate(dateStr)} className="t-secondary" style={{ color: "#FF8C3A", textDecoration: "underline" }}>Aanmaken</button> : <span className="t-tertiary">Gepland</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Session detail */}
      {selectedSession && (
        <div className="glass p-5">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={16} style={{ color: "#FF8C3A" }} />
            <div>
              <h2 className="t-card-title">{format(parseISO(selectedSession.date), "EEEE d MMMM yyyy", { locale: nl })}</h2>
              {selectedSession.notes && <p className="t-secondary-sm mt-0.5">{selectedSession.notes}</p>}
            </div>
          </div>

          {!isTrainer && myPlayerId && myAttendanceRecord && (
            <div className="mb-4 p-4 rounded-xl flex items-center justify-between" style={{ background: "rgba(255,107,0,0.10)", border: "0.5px solid rgba(255,107,0,0.25)" }}>
              <div>
                <p className="t-card-title">Mijn aanwezigheid</p>
                <p className="t-secondary-sm">Klik om jouw status te wijzigen</p>
              </div>
              <button
                onClick={() => toggleAttendance.mutate({ attendanceId: myAttendanceRecord.id, present: !myAttendanceRecord.present })}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all"
                style={{ backgroundColor: myAttendanceRecord.present ? "#4ade80" : "rgba(255,255,255,0.15)" }}
              >
                {myAttendanceRecord.present ? <Check size={20} /> : <X size={20} className="text-white" />}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {sessionAttendance.map((a) => {
              const player = players.find((p) => p.id === a.player_id);
              const canToggle = isTrainer || a.player_id === myPlayerId;
              return (
                <div key={a.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}>
                      {player?.photo_url ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" /> : player?.name?.charAt(0)}
                    </div>
                    <span className="t-card-title">{player?.name}</span>
                  </div>
                  {canToggle ? (
                    <button onClick={() => toggleAttendance.mutate({ attendanceId: a.id, present: !a.present })} className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all" style={{ backgroundColor: a.present ? "#4ade80" : "rgba(255,255,255,0.12)" }}>
                      {a.present ? <Check size={18} /> : <X size={18} className="text-white" />}
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: a.present ? "#4ade80" : "rgba(255,255,255,0.12)" }}>
                      {a.present ? <Check size={18} /> : <X size={18} className="text-white" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance overview */}
      {!selectedSession && (
        <div className="glass p-5">
          <h2 className="t-section-title mb-4">Aanwezigheidsoverzicht</h2>
          <div className="space-y-2">
            {[...activePlayers].sort((a, b) => getPlayerAttendancePct(b.id) - getPlayerAttendancePct(a.id)).map((p) => {
              const pct = getPlayerAttendancePct(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <span className="t-card-title flex-1">{p.name}</span>
                  <div className="progress-track w-24">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171" }} />
                  </div>
                  <span className="t-secondary w-12 text-right" style={{ color: "#FF8C3A" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra session dialog */}
      <Dialog open={newSessionDialog} onOpenChange={setNewSessionDialog}>
        <DialogContent className="max-w-sm" style={{ background: "rgba(20,10,2,0.97)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
          <DialogHeader>
            <DialogTitle className="t-page-title">Extra Sessie Toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="t-label mb-1 block">Datum</label>
              <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            </div>
            <div>
              <label className="t-label mb-1 block">Onderwerp (optioneel)</label>
              <Input placeholder="bijv. Positiespel, Afwerking..." value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            </div>
            <button onClick={() => sessionDate && createSessionMutation.mutate(sessionDate)} disabled={!sessionDate || createSessionMutation.isPending} className="btn-primary">
              {createSessionMutation.isPending ? "Aanmaken..." : "Sessie Aanmaken"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}