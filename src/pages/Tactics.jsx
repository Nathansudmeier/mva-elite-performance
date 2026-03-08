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
  const [form, setForm] = useState({
    match_date: new Date().toISOString().split("T")[0],
    opponent: "",
    formation: "4-3-3",
    ball_possession: "",
    pressing: "",
    transition: "",
    set_pieces: "",
    notes: "",
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["tacticalPlans"],
    queryFn: () => base44.entities.TacticalPlan.list("-match_date"),
  });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (selectedPlan) return base44.entities.TacticalPlan.update(selectedPlan.id, data);
      return base44.entities.TacticalPlan.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tacticalPlans"] });
      setDialogOpen(false);
      setSelectedPlan(null);
    },
  });

  const openNew = () => {
    setSelectedPlan(null);
    setForm({ match_date: new Date().toISOString().split("T")[0], opponent: "", formation: "4-3-3", ball_possession: "", pressing: "", transition: "", set_pieces: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (plan) => {
    setSelectedPlan(plan);
    setForm({
      match_date: plan.match_date || "",
      opponent: plan.opponent || "",
      formation: plan.formation || "4-3-3",
      ball_possession: plan.ball_possession || "",
      pressing: plan.pressing || "",
      transition: plan.transition || "",
      set_pieces: plan.set_pieces || "",
      notes: plan.notes || "",
    });
    setDialogOpen(true);
  };

  const viewPlan = plans.find((p) => p.id === selectedPlan?.id) || (plans.length > 0 && !dialogOpen ? plans[0] : null);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Tactiek</h1>
          <p className="text-sm text-[#a0a0a0]">Matchday plannen en tactische afspraken</p>
        </div>
        <Button onClick={openNew} className="bg-[#FF6B00] hover:bg-[#e06000]">
          <Plus size={16} className="mr-1" /> Nieuw Plan
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Plans list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-3">Wedstrijdplannen</h2>
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                viewPlan?.id === plan.id ? "bg-[#1a3a8f]" : "elite-card elite-card-hover"
              }`}
            >
              <p className="text-sm font-bold">{plan.opponent}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#a0a0a0]">{format(new Date(plan.match_date), "d MMM yyyy", { locale: nl })}</span>
                <span className="text-xs text-[#FF6B00] font-semibold">{plan.formation}</span>
              </div>
            </button>
          ))}
          {plans.length === 0 && <p className="text-sm text-[#666] text-center py-8">Nog geen plannen</p>}
        </div>

        {/* Plan detail */}
        <div className="lg:col-span-2">
          {viewPlan ? (
            <div className="space-y-4">
              <div className="elite-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black">vs. {viewPlan.opponent}</h2>
                    <p className="text-sm text-[#a0a0a0]">{format(new Date(viewPlan.match_date), "d MMMM yyyy", { locale: nl })}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-black text-[#FF6B00]">{viewPlan.formation}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(viewPlan)} className="border-[#333] text-[#a0a0a0]">
                  Bewerken
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <TacticalSection icon={Shield} title="Balbezit (BB)" content={viewPlan.ball_possession} color="#1a3a8f" />
                <TacticalSection icon={Swords} title="Pressing (VB)" content={viewPlan.pressing} color="#FF6B00" />
                <TacticalSection icon={ArrowLeftRight} title="Omschakeling" content={viewPlan.transition} color="#22c55e" />
                <TacticalSection icon={Flag} title="Dode Spelmomenten" content={viewPlan.set_pieces} color="#eab308" />
              </div>

              {viewPlan.notes && (
                <div className="elite-card p-6">
                  <h3 className="font-bold mb-2 text-sm">Extra Notities</h3>
                  <p className="text-sm text-[#a0a0a0] whitespace-pre-wrap">{viewPlan.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="elite-card p-12 text-center">
              <Target size={40} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#666]">Selecteer of maak een wedstrijdplan</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141414] border-[#222] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Plan Bewerken" : "Nieuw Wedstrijdplan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Tegenstander" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
              <Input type="date" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
            </div>
            <Select value={form.formation} onValueChange={(v) => setForm({ ...form, formation: v })}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#333]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMATIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Balbezit (BB) afspraken..." value={form.ball_possession} onChange={(e) => setForm({ ...form, ball_possession: e.target.value })} className="bg-[#0a0a0a] border-[#333] h-20" />
            <Textarea placeholder="Pressing (VB) afspraken..." value={form.pressing} onChange={(e) => setForm({ ...form, pressing: e.target.value })} className="bg-[#0a0a0a] border-[#333] h-20" />
            <Textarea placeholder="Omschakeling..." value={form.transition} onChange={(e) => setForm({ ...form, transition: e.target.value })} className="bg-[#0a0a0a] border-[#333] h-20" />
            <Textarea placeholder="Dode spelmomenten..." value={form.set_pieces} onChange={(e) => setForm({ ...form, set_pieces: e.target.value })} className="bg-[#0a0a0a] border-[#333] h-20" />
            <Textarea placeholder="Extra notities..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-[#0a0a0a] border-[#333] h-20" />
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.opponent} className="w-full bg-[#FF6B00] hover:bg-[#e06000]">
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
        <h3 className="font-bold text-sm">{title}</h3>
      </div>
      <p className="text-sm text-[#a0a0a0] whitespace-pre-wrap">{content || "Nog niet ingevuld"}</p>
    </div>
  );
}