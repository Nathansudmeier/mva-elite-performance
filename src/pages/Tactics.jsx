import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, Target, Shield, Swords, ArrowLeftRight, Flag } from "lucide-react";

const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3"];

export default function Tactics() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({ match_date: new Date().toISOString().split("T")[0], opponent: "", formation: "4-3-3", ball_possession: "", pressing: "", transition: "", set_pieces: "", notes: "" });

  const { data: plans = [] } = useQuery({ queryKey: ["tacticalPlans"], queryFn: () => base44.entities.TacticalPlan.list("-match_date") });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => selectedPlan ? base44.entities.TacticalPlan.update(selectedPlan.id, data) : base44.entities.TacticalPlan.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tacticalPlans"] }); setDialogOpen(false); setSelectedPlan(null); },
  });

  const openNew = () => {
    setSelectedPlan(null);
    setForm({ match_date: new Date().toISOString().split("T")[0], opponent: "", formation: "4-3-3", ball_possession: "", pressing: "", transition: "", set_pieces: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (plan) => {
    setSelectedPlan(plan);
    setForm({ match_date: plan.match_date || "", opponent: plan.opponent || "", formation: plan.formation || "4-3-3", ball_possession: plan.ball_possession || "", pressing: plan.pressing || "", transition: plan.transition || "", set_pieces: plan.set_pieces || "", notes: plan.notes || "" });
    setDialogOpen(true);
  };

  const viewPlan = plans.find((p) => p.id === selectedPlan?.id) || (plans.length > 0 && !dialogOpen ? plans[0] : null);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-500 text-[#FF6B00]">Tactiek</h1>
          <p className="text-sm text-[#888888]">Matchday plannen en tactische afspraken</p>
        </div>
        <Button onClick={openNew} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
          <Plus size={16} className="mr-1" /> Nieuw Plan
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h2 className="text-sm font-500 text-[#888888] uppercase tracking-wider mb-3">Wedstrijdplannen</h2>
          {plans.map((plan) => {
            const isActive = viewPlan?.id === plan.id;
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                className="w-full text-left px-4 py-3 rounded-lg transition-all elite-card elite-card-hover"
                style={isActive ? { backgroundColor: '#1A1F2E', borderColor: '#1A1F2E', color: '#fff' } : {}}>
                <p className="text-sm font-bold" style={isActive ? { color: '#fff' } : { color: '#1A1F2E' }}>{plan.opponent}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={isActive ? { color: 'rgba(255,255,255,0.7)' } : { color: '#2F3650' }}>{format(new Date(plan.match_date), "d MMM yyyy", { locale: nl })}</span>
                  <span className="text-xs font-semibold" style={{ color: isActive ? '#F0926E' : '#D45A30' }}>{plan.formation}</span>
                </div>
              </button>
            );
          })}
          {plans.length === 0 && <p className="text-sm text-center py-8 text-white/60">Nog geen plannen</p>}
        </div>

        <div className="lg:col-span-2">
          {viewPlan ? (
            <div className="space-y-4">
              <div className="elite-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black text-[#1A1F2E]">vs. {viewPlan.opponent}</h2>
                    <p className="text-sm" style={{ color: '#2F3650' }}>{format(new Date(viewPlan.match_date), "d MMMM yyyy", { locale: nl })}</p>
                  </div>
                  <span className="text-2xl font-black" style={{ color: '#D45A30' }}>{viewPlan.formation}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(viewPlan)} className="border-[#FDE8DC] text-[#1A1F2E] hover:bg-[#FDE8DC]">
                  Bewerken
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <TacticalSection icon={Shield} title="Balbezit (BB)" content={viewPlan.ball_possession} color="#1A1F2E" />
                <TacticalSection icon={Swords} title="Pressing (VB)" content={viewPlan.pressing} color="#D45A30" />
                <TacticalSection icon={ArrowLeftRight} title="Omschakeling" content={viewPlan.transition} color="#4CAF82" />
                <TacticalSection icon={Flag} title="Dode Spelmomenten" content={viewPlan.set_pieces} color="#F0926E" />
              </div>

              {viewPlan.notes && (
                <div className="elite-card p-6">
                  <h3 className="font-bold mb-2 text-sm text-[#1A1F2E]">Extra Notities</h3>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#2F3650' }}>{viewPlan.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="elite-card p-12 text-center">
              <Target size={40} className="mx-auto mb-3" style={{ color: '#FDE8DC' }} />
              <p style={{ color: '#2F3650' }}>Selecteer of maak een wedstrijdplan</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-[#FDE8DC]" style={{ backgroundColor: '#FFF5F0', color: '#1A1F2E' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1F2E' }}>{selectedPlan ? "Plan Bewerken" : "Nieuw Wedstrijdplan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Tegenstander" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
              <Input type="date" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
            </div>
            <Select value={form.formation} onValueChange={(v) => setForm({ ...form, formation: v })}>
              <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }}><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMATIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            {[["ball_possession","Balbezit (BB) afspraken..."],["pressing","Pressing (VB) afspraken..."],["transition","Omschakeling..."],["set_pieces","Dode spelmomenten..."],["notes","Extra notities..."]].map(([key, ph]) => (
              <Textarea key={key} placeholder={ph} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E] h-20" style={{ backgroundColor: '#FFFFFF' }} />
            ))}
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.opponent} className="w-full text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TacticalSection({ icon: Icon, title, content, color }) {
  return (
    <div className="elite-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color }} />
        <h3 className="font-bold text-sm text-[#1A1F2E]">{title}</h3>
      </div>
      <p className="text-sm whitespace-pre-wrap" style={{ color: '#2F3650' }}>{content || "Nog niet ingevuld"}</p>
    </div>
  );
}