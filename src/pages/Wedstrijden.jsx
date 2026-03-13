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
import { Plus, ChevronRight, Edit2, Trophy, Shield, Swords, ArrowLeftRight, Flag } from "lucide-react";
import FieldLineup from "../components/wedstrijden/FieldLineup";
import SubstitutesPicker from "../components/wedstrijden/SubstitutesPicker";
import SelectieOverzicht from "../components/wedstrijden/SelectieOverzicht";

const TEAMS = ["MO17", "Dames 1"];
const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3"];

function lineupArrayToMap(arr) {
  if (!arr) return {};
  return arr.reduce((acc, { slot, player_id }) => { if (slot && player_id) acc[slot] = player_id; return acc; }, {});
}
function lineupMapToArray(map) {
  return Object.entries(map).map(([slot, player_id]) => ({ slot, player_id }));
}

export default function Wedstrijden() {
  const queryClient = useQueryClient();
  const [activeTeam, setActiveTeam] = useState("MO17");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [lineupMap, setLineupMap] = useState({});
  const [substitutes, setSubstitutes] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    opponent: "", home_away: "Thuis", score_home: "", score_away: "",
    formation: "4-3-3", ball_possession: "", pressing: "", transition: "", set_pieces: "", notes: "",
  });

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-date") });

  const activePlayers = players.filter((p) => p.active !== false);
  const teamMatches = matches.filter((m) => m.team === activeTeam);
  const detailMatch = selectedMatch && matches.find((m) => m.id === selectedMatch);

  const openNew = () => {
    setEditingMatch(null);
    setForm({ date: new Date().toISOString().split("T")[0], opponent: "", home_away: "Thuis", score_home: "", score_away: "", formation: "4-3-3", ball_possession: "", pressing: "", transition: "", set_pieces: "", notes: "" });
    setLineupMap({});
    setSubstitutes([]);
    setDialogOpen(true);
  };

  const openEdit = (match) => {
    setEditingMatch(match);
    setForm({
      date: match.date || "", opponent: match.opponent || "", home_away: match.home_away || "Thuis",
      score_home: match.score_home ?? "", score_away: match.score_away ?? "",
      formation: match.formation || "4-3-3", ball_possession: match.ball_possession || "",
      pressing: match.pressing || "", transition: match.transition || "",
      set_pieces: match.set_pieces || "", notes: match.notes || "",
    });
    setLineupMap(lineupArrayToMap(match.lineup));
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingMatch) return base44.entities.Match.update(editingMatch.id, data);
      return base44.entities.Match.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setDialogOpen(false);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      team: activeTeam,
      score_home: form.score_home !== "" ? Number(form.score_home) : undefined,
      score_away: form.score_away !== "" ? Number(form.score_away) : undefined,
      lineup: lineupMapToArray(lineupMap),
    });
  };

  const scoreLabel = (m) => {
    if (m.score_home !== undefined && m.score_home !== null && m.score_away !== undefined && m.score_away !== null) {
      return `${m.score_home} – ${m.score_away}`;
    }
    return "–";
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Wedstrijden</h1>
          <p className="text-sm text-white/70">Opstellingen, uitslagen & tactiek</p>
        </div>
        <Button onClick={openNew} className="text-white" style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}>
          <Plus size={16} className="mr-1" /> Nieuwe Wedstrijd
        </Button>
      </div>

      {/* Team switch */}
      <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: "#1A1F2E", width: "fit-content" }}>
        {TEAMS.map((t) => (
          <button key={t} onClick={() => { setActiveTeam(t); setSelectedMatch(null); }}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={activeTeam === t ? { backgroundColor: "#D45A30", color: "#fff" } : { color: "rgba(255,255,255,0.6)" }}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Match list */}
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            {activeTeam} — {teamMatches.length} wedstrijd{teamMatches.length !== 1 ? "en" : ""}
          </h2>
          {teamMatches.map((m) => {
            const isActive = selectedMatch === m.id;
            return (
              <button key={m.id} onClick={() => setSelectedMatch(m.id)}
                className="w-full text-left px-4 py-3 rounded-xl transition-all elite-card elite-card-hover"
                style={isActive ? { backgroundColor: "#1A1F2E", borderColor: "#1A1F2E" } : {}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={isActive ? { color: "#fff" } : { color: "#1A1F2E" }}>
                      {m.home_away === "Uit" ? "@ " : ""}{m.opponent}
                    </p>
                    <p className="text-xs mt-0.5" style={isActive ? { color: "rgba(255,255,255,0.6)" } : { color: "#2F3650" }}>
                      {format(new Date(m.date), "d MMM yyyy", { locale: nl })} · {m.home_away} · {m.formation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black" style={{ color: isActive ? "#F0926E" : "#D45A30" }}>{scoreLabel(m)}</span>
                    <ChevronRight size={14} style={{ color: isActive ? "#F0926E" : "#D45A30" }} />
                  </div>
                </div>
              </button>
            );
          })}
          {teamMatches.length === 0 && (
            <div className="elite-card p-10 text-center">
              <Trophy size={32} className="mx-auto mb-2" style={{ color: "#FDE8DC" }} />
              <p className="text-sm" style={{ color: "#2F3650" }}>Nog geen wedstrijden voor {activeTeam}</p>
            </div>
          )}
        </div>

        {/* Match detail */}
        <div className="lg:col-span-3">
          {detailMatch ? (
            <div className="space-y-4">
              {/* Header card */}
              <div className="elite-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1A1F2E" }}>{detailMatch.team}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FDE8DC", color: "#D45A30" }}>{detailMatch.home_away}</span>
                    </div>
                    <h2 className="text-xl font-black text-[#1A1F2E]">vs. {detailMatch.opponent}</h2>
                    <p className="text-sm" style={{ color: "#2F3650" }}>{format(new Date(detailMatch.date), "d MMMM yyyy", { locale: nl })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-3xl font-black" style={{ color: "#D45A30" }}>{scoreLabel(detailMatch)}</span>
                    <span className="text-sm font-semibold" style={{ color: "#2F3650" }}>{detailMatch.formation}</span>
                    <Button variant="outline" size="sm" onClick={() => openEdit(detailMatch)} className="border-[#FDE8DC] text-[#1A1F2E] hover:bg-[#FDE8DC]">
                      <Edit2 size={12} className="mr-1" /> Bewerken
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lineup display */}
              {detailMatch.lineup && detailMatch.lineup.length > 0 && (
                <div className="elite-card p-6">
                  <h3 className="font-bold text-[#1A1F2E] mb-4">Opstelling</h3>
                  <FieldLineup
                    players={activePlayers}
                    lineupMap={lineupArrayToMap(detailMatch.lineup)}
                    formation={detailMatch.formation || "4-3-3"}
                    onLineupChange={() => {}}
                  />
                </div>
              )}

              {/* Tactical sections */}
              {(detailMatch.ball_possession || detailMatch.pressing || detailMatch.transition || detailMatch.set_pieces) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {detailMatch.ball_possession && <TactSection icon={Shield} title="Balbezit (BB)" content={detailMatch.ball_possession} color="#1A1F2E" />}
                  {detailMatch.pressing && <TactSection icon={Swords} title="Pressing (VB)" content={detailMatch.pressing} color="#D45A30" />}
                  {detailMatch.transition && <TactSection icon={ArrowLeftRight} title="Omschakeling" content={detailMatch.transition} color="#4CAF82" />}
                  {detailMatch.set_pieces && <TactSection icon={Flag} title="Dode Spelmomenten" content={detailMatch.set_pieces} color="#F0926E" />}
                </div>
              )}

              {detailMatch.notes && (
                <div className="elite-card p-5">
                  <p className="text-sm font-bold text-[#1A1F2E] mb-1">Extra Notities</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "#2F3650" }}>{detailMatch.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="elite-card p-16 text-center">
              <Shield size={40} className="mx-auto mb-3" style={{ color: "#FDE8DC" }} />
              <p style={{ color: "#2F3650" }}>Selecteer een wedstrijd</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog — new/edit match */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-3xl max-h-[92vh] overflow-y-auto border-[#FDE8DC]"
          style={{ backgroundColor: "#FFF5F0", color: "#1A1F2E" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1F2E" }}>
              {editingMatch ? "Wedstrijd Bewerken" : `Nieuwe Wedstrijd — ${activeTeam}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Tegenstander" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#FFFFFF" }} />
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#FFFFFF" }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select value={form.home_away} onValueChange={(v) => setForm({ ...form, home_away: v })}>
                <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#FFFFFF" }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Thuis">Thuis</SelectItem><SelectItem value="Uit">Uit</SelectItem></SelectContent>
              </Select>
              <Input type="number" placeholder="Doelpunten (thuis)" value={form.score_home} onChange={(e) => setForm({ ...form, score_home: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#FFFFFF" }} />
              <Input type="number" placeholder="Doelpunten (uit)" value={form.score_away} onChange={(e) => setForm({ ...form, score_away: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#FFFFFF" }} />
            </div>

            {/* Formation */}
            <Select value={form.formation} onValueChange={(v) => setForm({ ...form, formation: v })}>
              <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#FFFFFF" }}><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>

            {/* Lineup drag & drop */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#D45A30" }}>
                Opstelling — sleep speelsters naar het veld
              </p>
              <FieldLineup
                players={activePlayers}
                lineupMap={lineupMap}
                formation={form.formation}
                onLineupChange={setLineupMap}
              />
            </div>

            {/* Tactical notes */}
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#D45A30" }}>Tactische Notities</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[["ball_possession", "Balbezit (BB)..."], ["pressing", "Pressing (VB)..."], ["transition", "Omschakeling..."], ["set_pieces", "Dode spelmomenten..."]].map(([key, ph]) => (
                <Textarea key={key} placeholder={ph} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E] h-20" style={{ backgroundColor: "#FFFFFF" }} />
              ))}
            </div>
            <Textarea placeholder="Extra notities..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E] h-16" style={{ backgroundColor: "#FFFFFF" }} />

            <Button onClick={handleSave} disabled={saveMutation.isPending || !form.opponent} className="w-full text-white" style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}>
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TactSection({ icon: Icon, title, content, color }) {
  return (
    <div className="elite-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} style={{ color }} />
        <h3 className="font-bold text-sm text-[#1A1F2E]">{title}</h3>
      </div>
      <p className="text-sm whitespace-pre-wrap" style={{ color: "#2F3650" }}>{content}</p>
    </div>
  );
}