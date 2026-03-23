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
import { useCurrentUser } from "@/components/auth/useCurrentUser";

export default function Attendance() {
  const queryClient = useQueryClient();
  const { isTrainer } = useCurrentUser();
  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [presentPlayerIds, setPresentPlayerIds] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.filter({ active: true }) });
  const { data: agendaItems = [] } = useQuery({ queryKey: ["agenda-items"], queryFn: () => base44.entities.AgendaItem.filter({ type: "Training" }) });
  const { data: agendaAttendance = [] } = useQuery({ queryKey: ["agenda-attendance"], queryFn: () => base44.entities.AgendaAttendance.list() });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const item = await base44.entities.AgendaItem.create({
        type: "Training",
        title: sessionNotes || "Training",
        date: sessionDate,
        start_time: "19:00",
        team: "Beide",
        reminder_1_days: 3,
        reminder_2_days: 1,
      });
      const records = players.map((p) => ({
        agenda_item_id: item.id,
        player_id: p.id,
        status: presentPlayerIds.includes(p.id) ? "aanwezig" : "afwezig",
      }));
      await base44.entities.AgendaAttendance.bulkCreate(records);
      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["agenda-items"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-attendance"] });
      setNewSessionDialog(false);
      setSessionNotes("");
      setPresentPlayerIds([]);
      setSelectedSessionId(item.id);
    },
  });

  const toggleAttendance = useMutation({
    mutationFn: async ({ attendanceId, status }) => {
      await base44.entities.AgendaAttendance.update(attendanceId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-attendance"] });
    },
  });

  const selectedSession = agendaItems.find((s) => s.id === selectedSessionId) ?? null;
  const sessionAttendance = selectedSession ? agendaAttendance.filter((a) => a.agenda_item_id === selectedSession.id) : [];

  const getPlayerAttendancePct = (playerId) => {
    if (agendaItems.length === 0) return 0;
    const present = agendaAttendance.filter((a) => a.player_id === playerId && a.status === "aanwezig").length;
    return ((present / agendaItems.length) * 100).toFixed(0);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-500 text-[#FF6B00]">Aanwezigheid</h1>
          <p className="text-sm text-[#888888]">{sessions.length} sessies geregistreerd</p>
        </div>
        {isTrainer && (
          <Button onClick={() => setNewSessionDialog(true)} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
            <Plus size={16} className="mr-1" /> Nieuwe Sessie
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="space-y-2">
          <h2 className="text-sm font-500 text-[#888888] uppercase tracking-wider mb-3">Sessies</h2>
          {agendaItems.map((s) => {
            const sAtt = agendaAttendance.filter((a) => a.agenda_item_id === s.id);
            const present = sAtt.filter((a) => a.status === "aanwezig").length;
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
                    <p className="text-xs" style={isActive ? { color: 'rgba(255,255,255,0.7)' } : { color: '#2F3650' }}>{s.title}</p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: isActive ? '#F0926E' : '#D45A30' }}>{present}/{sAtt.length}</span>
                </div>
              </button>
            );
          })}
          {agendaItems.length === 0 && <p className="text-sm text-center py-8 text-white/60">Geen sessies</p>}
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
                      {isTrainer ? (
                        <button
                          onClick={() => toggleAttendance.mutate({ attendanceId: a.id, present: !a.present })}
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all text-white"
                          style={{ backgroundColor: a.present ? '#4CAF82' : '#2F3650' }}
                        >
                          {a.present ? <Check size={18} /> : <X size={18} />}
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: a.present ? '#4CAF82' : '#E8E6E1' }}>
                          {a.present ? <Check size={18} /> : <X size={18} className="text-[#888888]" />}
                        </div>
                      )}
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
            <Input
              placeholder="Onderwerp (bijv. Positiespel, Afwerking...)"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="border-[#FDE8DC] text-[#1A1F2E]"
              style={{ backgroundColor: '#FFFFFF' }}
            />
            <div>
              <p className="text-xs font-semibold text-[#2F3650] uppercase tracking-wider mb-2">Aanwezig ({presentPlayerIds.length}/{activePlayers.length})</p>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {activePlayers.map((p) => {
                  const isPresent = presentPlayerIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresentPlayerIds(prev => isPresent ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm"
                      style={{ backgroundColor: isPresent ? '#4CAF82' : '#FDE8DC', color: isPresent ? '#fff' : '#1A1F2E' }}
                    >
                      <span>{p.name}</span>
                      {isPresent ? <Check size={14} /> : <X size={14} style={{ opacity: 0.4 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button onClick={() => createSessionMutation.mutate()} disabled={createSessionMutation.isPending} className="w-full text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              {createSessionMutation.isPending ? "Aanmaken..." : "Sessie Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}