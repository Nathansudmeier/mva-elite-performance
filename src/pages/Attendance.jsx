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
  const [sessionNotes, setSessionNotes] = useState("");
  const [presentPlayerIds, setPresentPlayerIds] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => base44.entities.TrainingSession.list("-date") });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance"], queryFn: () => base44.entities.Attendance.list() });

  const activePlayers = players.filter((p) => p.active !== false);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const session = await base44.entities.TrainingSession.create({ date: sessionDate, type: sessionType, notes: sessionNotes });
      const records = activePlayers.map((p) => ({ session_id: session.id, player_id: p.id, present: presentPlayerIds.includes(p.id) }));
      await base44.entities.Attendance.bulkCreate(records);
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setNewSessionDialog(false);
      setSessionNotes("");
      setPresentPlayerIds([]);
      setSelectedSessionId(session.id);
    },
  });

  const toggleAttendance = useMutation({
    mutationFn: async ({ attendanceId, present }) => {
      await base44.entities.Attendance.update(attendanceId, { present });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      // Do NOT invalidate sessions here — would cause re-sort and session jump
    },
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;
  const sessionAttendance = selectedSession ? attendance.filter((a) => a.session_id === selectedSession.id) : [];

  const getPlayerAttendancePct = (playerId) => {
    if (sessions.length === 0) return 0;
    const present = attendance.filter((a) => a.player_id === playerId && a.present).length;
    return ((present / sessions.length) * 100).toFixed(0);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Aanwezigheid</h1>
          <p className="text-sm text-white/70">{sessions.length} sessies geregistreerd</p>
        </div>
        <Button onClick={() => setNewSessionDialog(true)} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
          <Plus size={16} className="mr-1" /> Nieuwe Sessie
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Sessies</h2>
          {sessions.map((s) => {
            const sAtt = attendance.filter((a) => a.session_id === s.id);
            const present = sAtt.filter((a) => a.present).length;
            const isActive = selectedSessionId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${isActive ? 'border-[#1A1F2E]' : 'border-[#FDE8DC] bg-[#FFF5F0] hover:border-[#F0926E]'}`}
                style={isActive ? { backgroundColor: '#1A1F2E', color: '#fff' } : {}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={isActive ? { color: '#fff' } : { color: '#1A1F2E' }}>{format(new Date(s.date), "d MMMM yyyy", { locale: nl })}</p>
                    <p className="text-xs" style={isActive ? { color: 'rgba(255,255,255,0.7)' } : { color: '#2F3650' }}>{s.type}</p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: isActive ? '#F0926E' : '#D45A30' }}>{present}/{sAtt.length}</span>
                </div>
              </button>
            );
          })}
          {sessions.length === 0 && <p className="text-sm text-center py-8 text-white/60">Geen sessies</p>}
        </div>

        {/* Attendance detail */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="elite-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={18} style={{ color: '#D45A30' }} />
                <div>
                  <h2 className="font-bold text-[#1A1F2E]">{format(new Date(selectedSession.date), "d MMMM yyyy", { locale: nl })}</h2>
                  <p className="text-xs" style={{ color: '#2F3650' }}>{selectedSession.type}</p>
                </div>
              </div>
              <div className="space-y-2">
                {sessionAttendance.map((a) => {
                  const player = players.find((p) => p.id === a.player_id);
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#FDE8DC' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#2F3650' }}>
                          {player?.photo_url ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" /> : player?.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[#1A1F2E]">{player?.name}</span>
                      </div>
                      <button
                        onClick={() => toggleAttendance.mutate({ attendanceId: a.id, present: !a.present })}
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all text-white"
                        style={{ backgroundColor: a.present ? '#4CAF82' : '#2F3650' }}
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
              <h2 className="font-bold mb-4 text-[#1A1F2E]">Aanwezigheidsoverzicht</h2>
              <div className="space-y-2">
                {[...activePlayers].sort((a, b) => getPlayerAttendancePct(b.id) - getPlayerAttendancePct(a.id)).map((p) => {
                  const pct = getPlayerAttendancePct(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#FDE8DC' }}>
                      <span className="text-sm font-medium flex-1 text-[#1A1F2E]">{p.name}</span>
                      <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#FFF5F0' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#4CAF82' : pct >= 60 ? '#F0926E' : '#C0392B' }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right" style={{ color: '#D45A30' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={newSessionDialog} onOpenChange={setNewSessionDialog}>
        <DialogContent className="max-w-sm border-[#FDE8DC]" style={{ backgroundColor: '#FFF5F0', color: '#1A1F2E' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1F2E' }}>Nieuwe Sessie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Wedstrijd">Wedstrijd</SelectItem>
                <SelectItem value="Fysieke Test">Fysieke Test</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => createSessionMutation.mutate()} disabled={createSessionMutation.isPending} className="w-full text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              {createSessionMutation.isPending ? "Aanmaken..." : "Sessie Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}