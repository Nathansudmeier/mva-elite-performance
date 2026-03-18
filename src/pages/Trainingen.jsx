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

// Generate Mon/Wed/Fri for a given week start (Monday)
function getTrainingDaysForWeek(weekStart) {
  return [0, 2, 4].map((offset) => addDays(weekStart, offset)); // Mon=0, Wed=2, Fri=4
}

export default function Trainingen() {
  const queryClient = useQueryClient();
  const { isTrainer, user, playerId: myPlayerId } = useCurrentUser();

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
          <h1 className="text-2xl font-500 text-[#FF6B00]">Trainingen</h1>
          <p className="text-sm text-[#888888]">{sessions.filter(s => s.type === "Training").length} trainingen geregistreerd</p>
        </div>
        {isTrainer && (
          <Button
            onClick={() => { setSessionDate(""); setNewSessionDialog(true); }}
            className="text-white"
            style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}
          >
            <Plus size={16} className="mr-1" /> Extra Sessie
          </Button>
        )}
      </div>

      {/* Week navigator */}
      <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1]">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg hover:bg-[#F7F5F2]">
            <ChevronLeft size={18} className="text-[#1A1A1A]" />
          </button>
          <span className="text-sm font-500 text-[#1A1A1A]">
            {format(weekStart, "d MMM", { locale: nl })} – {format(weekEnd, "d MMM yyyy", { locale: nl })}
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg hover:bg-[#F7F5F2]">
            <ChevronRight size={18} className="text-[#1A1A1A]" />
          </button>
        </div>

        {/* Day slots */}
        <div className="grid grid-cols-3 divide-x divide-[#E8E6E1]">
          {daySlots.map(({ day, dateStr, session }, i) => {
            const isPast = isBefore(day, today);
            const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
            const isSelected = session && selectedSessionId === session.id;
            const sAtt = session ? attendance.filter((a) => a.session_id === session.id) : [];
            const presentCount = sAtt.filter((a) => a.present).length;

            return (
              <div key={dateStr} className="p-3 text-center">
                <p className="text-xs text-[#888888] mb-0.5">{dayNames[i]}</p>
                <p className={`text-lg font-500 mb-2 ${isToday ? "text-[#FF6B00]" : "text-[#1A1A1A]"}`}>
                  {format(day, "d")}
                </p>
                {session ? (
                  <button
                    onClick={() => setSelectedSessionId(isSelected ? null : session.id)}
                    className={`w-full py-2 px-1 rounded-xl text-xs font-500 transition-all ${
                      isSelected
                        ? "bg-[#FF6B00] text-white"
                        : "bg-[#FFF3EB] text-[#FF6B00] hover:bg-[#FFE5CC]"
                    }`}
                  >
                    {presentCount}/{sAtt.length || activePlayers.length}
                    <br />aanwezig
                  </button>
                ) : (
                  <div className="w-full py-2 px-1 rounded-xl text-xs text-[#888888]">
                    {isPast ? (
                      isTrainer ? (
                        <button
                          onClick={() => createSessionMutation.mutate(dateStr)}
                          className="text-[#FF6B00] underline text-xs"
                        >
                          Toevoegen
                        </button>
                      ) : (
                        <span>–</span>
                      )
                    ) : (
                      isTrainer ? (
                        <button
                          onClick={() => createSessionMutation.mutate(dateStr)}
                          className="text-[#FF6B00] underline text-xs"
                        >
                          Aanmaken
                        </button>
                      ) : (
                        <span className="text-[#BBBBBB]">Gepland</span>
                      )
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
        <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={18} className="text-[#FF6B00]" />
            <div>
              <h2 className="font-500 text-[#1A1A1A]">
                {format(parseISO(selectedSession.date), "EEEE d MMMM yyyy", { locale: nl })}
              </h2>
              {selectedSession.notes && (
                <p className="text-xs text-[#888888]">{selectedSession.notes}</p>
              )}
            </div>
          </div>

          {/* Player self check-in (speelster only) */}
          {!isTrainer && myPlayerId && myAttendanceRecord && (
            <div className="mb-4 p-4 rounded-xl bg-[#FFF3EB] flex items-center justify-between">
              <div>
                <p className="font-500 text-[#1A1A1A] text-sm">Mijn aanwezigheid</p>
                <p className="text-xs text-[#888888]">Klik om jouw status te wijzigen</p>
              </div>
              <button
                onClick={() => toggleAttendance.mutate({ attendanceId: myAttendanceRecord.id, present: !myAttendanceRecord.present })}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all"
                style={{ backgroundColor: myAttendanceRecord.present ? "#4CAF82" : "#E8E6E1" }}
              >
                {myAttendanceRecord.present ? <Check size={20} /> : <X size={20} className="text-[#888888]" />}
              </button>
            </div>
          )}

          {/* Full attendance list (trainer can toggle all, speelster sees overview) */}
          <div className="space-y-2">
            {sessionAttendance.map((a) => {
              const player = players.find((p) => p.id === a.player_id);
              const canToggle = isTrainer || a.player_id === myPlayerId;
              return (
                <div key={a.id} className="flex items-center justify-between rounded-xl px-4 py-3 bg-[#F7F5F2]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FFF3EB] flex items-center justify-center text-xs font-500 text-[#FF6B00]">
                      {player?.photo_url ? (
                        <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        player?.name?.charAt(0)
                      )}
                    </div>
                    <span className="text-sm font-500 text-[#1A1A1A]">{player?.name}</span>
                  </div>
                  {canToggle ? (
                    <button
                      onClick={() => toggleAttendance.mutate({ attendanceId: a.id, present: !a.present })}
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all text-white"
                      style={{ backgroundColor: a.present ? "#4CAF82" : "#E8E6E1" }}
                    >
                      {a.present ? <Check size={18} /> : <X size={18} className="text-[#888888]" />}
                    </button>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: a.present ? "#4CAF82" : "#E8E6E1" }}
                    >
                      {a.present ? <Check size={18} /> : <X size={18} className="text-[#888888]" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance overview (when no session selected) */}
      {!selectedSession && (
        <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5">
          <h2 className="font-500 text-[#1A1A1A] mb-4">Aanwezigheidsoverzicht</h2>
          <div className="space-y-2">
            {[...activePlayers]
              .sort((a, b) => getPlayerAttendancePct(b.id) - getPlayerAttendancePct(a.id))
              .map((p) => {
                const pct = getPlayerAttendancePct(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-[#F7F5F2]">
                    <span className="text-sm font-500 flex-1 text-[#1A1A1A]">{p.name}</span>
                    <div className="w-24 h-2 rounded-full overflow-hidden bg-[#E8E6E1]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 80 ? "#4CAF82" : pct >= 60 ? "#F0926E" : "#C0392B",
                        }}
                      />
                    </div>
                    <span className="text-sm font-500 w-12 text-right text-[#FF6B00]">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Extra session dialog (trainer only) */}
      <Dialog open={newSessionDialog} onOpenChange={setNewSessionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Extra Sessie Toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#888888] font-500 uppercase tracking-wider mb-1 block">Datum</label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="border-[#E8E6E1]"
              />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-500 uppercase tracking-wider mb-1 block">Onderwerp (optioneel)</label>
              <Input
                placeholder="bijv. Positiespel, Afwerking..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="border-[#E8E6E1]"
              />
            </div>
            <Button
              onClick={() => sessionDate && createSessionMutation.mutate(sessionDate)}
              disabled={!sessionDate || createSessionMutation.isPending}
              className="w-full text-white"
              style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}
            >
              {createSessionMutation.isPending ? "Aanmaken..." : "Sessie Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}