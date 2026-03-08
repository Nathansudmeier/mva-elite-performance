import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Check, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function Attendance() {
  const queryClient = useQueryClient();
  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState("Training");
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceState, setAttendanceState] = useState({});

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list("-date") });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });

  const activePlayers = players.filter((p) => p.active !== false);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const session = await base44.entities.TrainingSession.create({ date: sessionDate, type: sessionType });
      const records = activePlayers.map((p) => ({ session_id: session.id, player_id: p.id, present: false }));
      await base44.entities.Attendance.bulkCreate(records);
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setNewSessionDialog(false);
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

  const sessionAttendance = selectedSession
    ? attendance.filter((a) => a.session_id === selectedSession.id)
    : [];

  const getPlayerAttendancePct = (playerId) => {
    const records = attendance.filter((a) => a.player_id === playerId);
    if (records.length === 0) return 0;
    return ((records.filter((a) => a.present).length / records.length) * 100).toFixed(0);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Aanwezigheid</h1>
          <p className="text-sm text-[#a0a0a0]">{sessions.length} sessies geregistreerd</p>
        </div>
        <Button onClick={() => setNewSessionDialog(true)} className="bg-[#FF6B00] hover:bg-[#e06000]">
          <Plus size={16} className="mr-1" /> Nieuwe Sessie
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-3">Sessies</h2>
          {sessions.map((s) => {
            const sAtt = attendance.filter((a) => a.session_id === s.id);
            const present = sAtt.filter((a) => a.present).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedSession?.id === s.id ? "bg-[#1a3a8f] border border-[#1a3a8f]" : "elite-card elite-card-hover"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{format(new Date(s.date), "d MMMM yyyy", { locale: nl })}</p>
                    <p className="text-xs text-[#a0a0a0]">{s.type}</p>
                  </div>
                  <span className="text-xs text-[#FF6B00] font-bold">{present}/{sAtt.length}</span>
                </div>
              </button>
            );
          })}
          {sessions.length === 0 && <p className="text-sm text-[#666] text-center py-8">Geen sessies</p>}
        </div>

        {/* Attendance for selected session */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="elite-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={18} className="text-[#FF6B00]" />
                <div>
                  <h2 className="font-bold">{format(new Date(selectedSession.date), "d MMMM yyyy", { locale: nl })}</h2>
                  <p className="text-xs text-[#a0a0a0]">{selectedSession.type}</p>
                </div>
              </div>
              <div className="space-y-2">
                {sessionAttendance.map((a) => {
                  const player = players.find((p) => p.id === a.player_id);
                  return (
                    <div key={a.id} className="flex items-center justify-between bg-[#0a0a0a] rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#222] overflow-hidden flex items-center justify-center text-xs font-bold">
                          {player?.photo_url ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" /> : player?.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{player?.name}</span>
                      </div>
                      <button
                        onClick={() => toggleAttendance.mutate({ attendanceId: a.id, present: !a.present })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          a.present ? "bg-[#22c55e] text-white" : "bg-[#222] text-[#666] hover:bg-[#333]"
                        }`}
                      >
                        {a.present ? <Check size={18} /> : <X size={18} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="elite-card p-6">
              <h2 className="font-bold mb-4">Aanwezigheidsoverzicht</h2>
              <div className="space-y-2">
                {activePlayers.map((p) => {
                  const pct = getPlayerAttendancePct(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 bg-[#0a0a0a] rounded-lg px-4 py-3">
                      <span className="text-sm font-medium flex-1">{p.name}</span>
                      <div className="w-24 h-2 bg-[#222] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#22c55e" : pct >= 60 ? "#FF6B00" : "#ef4444" }}
                        />
                      </div>
                      <span className="text-sm font-bold text-[#FF6B00] w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Session Dialog */}
      <Dialog open={newSessionDialog} onOpenChange={setNewSessionDialog}>
        <DialogContent className="bg-[#141414] border-[#222] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Nieuwe Sessie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="bg-[#0a0a0a] border-[#333]" />
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#333]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Wedstrijd">Wedstrijd</SelectItem>
                <SelectItem value="Fysieke Test">Fysieke Test</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => createSessionMutation.mutate()} disabled={createSessionMutation.isPending} className="w-full bg-[#FF6B00] hover:bg-[#e06000]">
              {createSessionMutation.isPending ? "Aanmaken..." : "Sessie Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}