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
import { Plus, Edit2, Trophy, Shield, Swords, ArrowLeftRight, Flag, Radio, Trash2, Home, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import FieldLineup from "../components/wedstrijden/FieldLineup";
import SubstitutesPicker from "../components/wedstrijden/SubstitutesPicker";
import SelectieOverzicht from "../components/wedstrijden/SelectieOverzicht";
import MatchCheckInOverview from "../components/checkin/MatchCheckInOverview";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

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
  const { isTrainer } = useCurrentUser();
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
    setSubstitutes(match.substitutes || []);
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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedMatch(null);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      team: activeTeam,
      score_home: form.score_home !== "" ? Number(form.score_home) : undefined,
      score_away: form.score_away !== "" ? Number(form.score_away) : undefined,
      lineup: lineupMapToArray(lineupMap),
      substitutes,
    });
  };

  const scoreLabel = (m) => {
    if (m.score_home !== undefined && m.score_home !== null && m.score_away !== undefined && m.score_away !== null) {
      return `${m.score_home} – ${m.score_away}`;
    }
    return "–";
  };

  const getResult = (m) => {
    if (m.score_home === undefined || m.score_home === null || m.score_away === undefined || m.score_away === null) return null;
    const isThuis = m.home_away === "Thuis";
    const mva = isThuis ? m.score_home : m.score_away;
    const opp = isThuis ? m.score_away : m.score_home;
    return mva > opp ? "win" : mva < opp ? "loss" : "draw";
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-500 text-[#FF6B00]">Wedstrijden</h1>
          <p className="text-sm text-[#888888]">Opstellingen, uitslagen & tactiek</p>
        </div>
        {isTrainer && (
          <Button onClick={openNew} className="text-white" style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}>
            <Plus size={16} className="mr-1" /> Nieuwe Wedstrijd
          </Button>
        )}
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
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-500 text-[#888888] uppercase tracking-wider mb-3">
            {activeTeam} — {teamMatches.length} wedstrijd{teamMatches.length !== 1 ? "en" : ""}
          </h2>
          {teamMatches.map((m) => {
            const isActive = selectedMatch === m.id;
            const matchDate = new Date(m.date);
            const isThuis = m.home_away === "Thuis";
            const hasScore = m.score_home !== undefined && m.score_home !== null && m.score_away !== undefined && m.score_away !== null;
            const result = getResult(m);
            const resultColor = result === "win" ? "#22C55E" : result === "loss" ? "#EF4444" : "#888888";
            const resultLabel = result === "win" ? "W" : result === "loss" ? "V" : "G";

            return (
              <button key={m.id} onClick={() => setSelectedMatch(m.id)}
                className="w-full text-left rounded-2xl transition-all"
                style={{
                  backgroundColor: isActive ? "#1A1F2E" : "#FFFFFF",
                  boxShadow: isActive ? "0 4px 20px rgba(26,31,46,0.25)" : "0 2px 8px rgba(0,0,0,0.06)",
                  border: isActive ? "2px solid #D45A30" : "2px solid transparent",
                }}>
                <div className="flex items-center gap-4 p-4">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-14 rounded-xl overflow-hidden text-center"
                    style={{ backgroundColor: isActive ? "#D45A30" : "#FDE8DC" }}>
                    <div className="text-[10px] font-bold uppercase py-1" style={{ color: isActive ? "rgba(255,255,255,0.8)" : "#D45A30" }}>
                      {format(matchDate, "MMM", { locale: nl })}
                    </div>
                    <div className="text-2xl font-black leading-none pb-2" style={{ color: isActive ? "#fff" : "#1A1F2E" }}>
                      {format(matchDate, "d")}
                    </div>
                  </div>

                  {/* Match info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: isActive ? "#fff" : "#1A1A1A" }}>
                      {m.opponent}
                    </p>
                    <div className="mt-1">
                      {isThuis
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "#E8F5E9", color: isActive ? "#6EE7A0" : "#16A34A" }}>
                            <Home size={9} /> Thuis
                          </span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "#FFF3EB", color: isActive ? "#F0926E" : "#D45A30" }}>
                            <Plane size={9} /> Uit
                          </span>
                      }
                    </div>
                  </div>

                  {/* Score + result */}
                  <div className="flex-shrink-0 text-right">
                    {hasScore ? (
                      <>
                        <p className="text-lg font-black leading-none" style={{ color: isActive ? "#fff" : "#1A1F2E" }}>{scoreLabel(m)}</p>
                        <p className="text-[10px] font-bold mt-1 uppercase" style={{ color: resultColor }}>{resultLabel}</p>
                      </>
                    ) : (
                      <p className="text-sm" style={{ color: isActive ? "rgba(255,255,255,0.3)" : "#ccc" }}>–</p>
                    )}
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
                    {isTrainer && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEdit(detailMatch)} className="border-[#FDE8DC] text-[#1A1F2E] hover:bg-[#FDE8DC]">
                          <Edit2 size={12} className="mr-1" /> Bewerken
                        </Button>
                        <Link to={`/LiveMatch?matchId=${detailMatch.id}`}>
                          <Button size="sm" className="text-white" style={{ backgroundColor: "#D45A30" }}>
                            <Radio size={12} className="mr-1" /> Live
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => {
                          if (confirm("Weet je zeker dat je deze wedstrijd wilt verwijderen?")) {
                            deleteMutation.mutate(detailMatch.id);
                          }
                        }} className="border-[#FF6B6B] text-[#C0392B] hover:bg-red-50">
                          <Trash2 size={12} className="mr-1" /> Verwijderen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

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

              {/* Opstelling veld — zichtbaar voor iedereen */}
              {detailMatch.lineup && detailMatch.lineup.length > 0 && (
                <div className="elite-card p-5">
                  <p className="text-sm font-bold text-[#1A1F2E] mb-3">Opstelling — {detailMatch.formation}</p>
                  <FieldLineup
                    players={activePlayers}
                    lineupMap={lineupArrayToMap(detailMatch.lineup)}
                    formation={detailMatch.formation || "4-3-3"}
                    readOnly
                  />
                  {detailMatch.substitutes && detailMatch.substitutes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#E8E6E1]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-2">Wissels</p>
                      <div className="flex flex-wrap gap-2">
                        {detailMatch.substitutes.map((pid) => {
                          const p = activePlayers.find((pl) => pl.id === pid);
                          return p ? (
                            <span key={pid} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FDE8DC] text-[#D45A30]">
                              <ArrowLeftRight size={10} />
                              {p.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isTrainer && (
                <MatchCheckInOverview
                  matchId={detailMatch.id}
                  totalInSelectie={(detailMatch.lineup?.length ?? 0) + (detailMatch.substitutes?.length ?? 0)}
                />
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
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-[#F7F5F2] border-[#E8E6E1]">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] text-lg font-semibold">
              {editingMatch ? "Wedstrijd Bewerken" : `Nieuwe Wedstrijd — ${activeTeam}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basic info */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Wedstrijdgegevens</label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Tegenstander" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="bg-white border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#BBBBBB]" />
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-white border-[#E8E6E1] text-[#1A1A1A]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Select value={form.home_away} onValueChange={(v) => setForm({ ...form, home_away: v })}>
                  <SelectTrigger className="bg-white border-[#E8E6E1] text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Thuis">Thuis</SelectItem><SelectItem value="Uit">Uit</SelectItem></SelectContent>
                </Select>
                <Input type="number" placeholder="Score thuis" value={form.score_home} onChange={(e) => setForm({ ...form, score_home: e.target.value })} className="bg-white border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#BBBBBB]" />
                <Input type="number" placeholder="Score uit" value={form.score_away} onChange={(e) => setForm({ ...form, score_away: e.target.value })} className="bg-white border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#BBBBBB]" />
              </div>
            </div>

            {/* Formation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Formatie</label>
              <Select value={form.formation} onValueChange={(v) => setForm({ ...form, formation: v })}>
                <SelectTrigger className="bg-white border-[#E8E6E1] text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                <SelectContent>{FORMATIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Lineup drag & drop */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Opstelling — sleep speelsters naar het veld</label>
              <FieldLineup
                players={activePlayers}
                lineupMap={lineupMap}
                formation={form.formation}
                onLineupChange={setLineupMap}
              />
            </div>

            {/* Substitutes */}
            <SubstitutesPicker
              players={activePlayers}
              lineupMap={lineupMap}
              substitutes={substitutes}
              onSubstitutesChange={setSubstitutes}
            />

            {/* Tactical notes */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Tactische Notities</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {[["ball_possession", "Balbezit (BB)..."], ["pressing", "Pressing (VB)..."], ["transition", "Omschakeling..."], ["set_pieces", "Dode spelmomenten..."]].map(([key, ph]) => (
                  <Textarea key={key} placeholder={ph} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="bg-white border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#BBBBBB] h-20" />
                ))}
              </div>
              <Textarea placeholder="Extra notities..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-white border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#BBBBBB] h-16" />
            </div>

            <Button onClick={handleSave} disabled={saveMutation.isPending || !form.opponent} className="w-full text-white font-semibold" style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}>
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