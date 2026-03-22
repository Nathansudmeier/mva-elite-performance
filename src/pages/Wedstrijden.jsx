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
import { Plus, Edit2, Trophy, Shield, Swords, ArrowLeftRight, Flag, Radio, Trash2, Home, Plane, Check, X, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import FieldLineup from "../components/wedstrijden/FieldLineup";
import SubstitutesPicker from "../components/wedstrijden/SubstitutesPicker";
import SelectieOverzicht from "../components/wedstrijden/SelectieOverzicht";
import MatchCheckInOverview from "../components/checkin/MatchCheckInOverview";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import MobileMatchDetail from "../components/wedstrijden/MobileMatchDetail";

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
  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: 60000 });
  const { data: agendaItems = [] } = useQuery({ queryKey: ["agendaItems"], queryFn: () => base44.entities.AgendaItem.list() });
  const { data: agendaAttendance = [] } = useQuery({ queryKey: ["agendaAttendanceAll"], queryFn: () => base44.entities.AgendaAttendance.list() });

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
    mutationFn: async (data) => {
      let match;
      if (editingMatch) {
        match = await base44.entities.Match.update(editingMatch.id, data);
        // Sync: update bestaand AgendaItem als datum/tegenstander wijzigt
        const existing = await base44.entities.AgendaItem.filter({ type: "Wedstrijd", match_id: editingMatch.id });
        if (existing && existing.length > 0) {
          await base44.entities.AgendaItem.update(existing[0].id, {
            title: `Wedstrijd vs. ${data.opponent}`,
            date: data.date,
            team: data.team === "MO17" ? "MO17" : "Dames 1",
          });
        } else {
          // Probeer op datum+type te vinden (oud)
          const byDate = await base44.entities.AgendaItem.filter({ type: "Wedstrijd", date: editingMatch.date });
          const byTitle = byDate.find(ai => ai.title && ai.title.includes(editingMatch.opponent));
          if (byTitle) {
            await base44.entities.AgendaItem.update(byTitle.id, {
              title: `Wedstrijd vs. ${data.opponent}`,
              date: data.date,
              team: data.team === "MO17" ? "MO17" : "Dames 1",
              match_id: editingMatch.id,
            });
          }
        }
      } else {
        match = await base44.entities.Match.create(data);
        // Sync: maak AgendaItem aan
        await base44.entities.AgendaItem.create({
          type: "Wedstrijd",
          title: `Wedstrijd vs. ${data.opponent}`,
          date: data.date,
          start_time: "14:00",
          team: data.team === "MO17" ? "MO17" : "Dames 1",
          notes: data.notes || "",
          match_id: match.id,
        });
      }
      return match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["agendaItems"] });
      queryClient.invalidateQueries({ queryKey: ["agendaItems-upcoming"] });
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

  // Sync alle wedstrijden zonder AgendaItem naar de agenda
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      for (const m of matches) {
        const byMatchId = agendaItems.find(ai => ai.match_id === m.id);
        if (byMatchId) continue;
        const byDate = agendaItems.find(ai => ai.type === "Wedstrijd" && ai.date === m.date && ai.title?.includes(m.opponent));
        if (byDate) {
          await base44.entities.AgendaItem.update(byDate.id, { match_id: m.id });
          continue;
        }
        await base44.entities.AgendaItem.create({
          type: "Wedstrijd",
          title: `Wedstrijd vs. ${m.opponent}`,
          date: m.date,
          start_time: "14:00",
          team: m.team,
          notes: m.notes || "",
          match_id: m.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendaItems"] });
      queryClient.invalidateQueries({ queryKey: ["agendaItems-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["agendaAttendanceAll"] });
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

  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Mobiel: toon volledig scherm detail
  if (isMobile && selectedMatch && detailMatch) {
    return (
      <MobileMatchDetail
        match={detailMatch}
        activePlayers={activePlayers}
        isTrainer={isTrainer}
        currentUser={currentUser}
        players={players}
        agendaItems={agendaItems}
        agendaAttendance={agendaAttendance}
        onBack={() => setSelectedMatch(null)}
        onEdit={() => openEdit(detailMatch)}
        onDelete={() => { if (confirm("Verwijderen?")) { deleteMutation.mutate(detailMatch.id); setSelectedMatch(null); } }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Wedstrijden</h1>
          <p className="t-secondary">Opstellingen, uitslagen & tactiek</p>
        </div>
        <div className="flex gap-2">
          {isTrainer && (
            <button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="btn-secondary"
              style={{ fontSize: "12px" }}
              title="Synchroniseer wedstrijden naar Agenda"
            >
              {syncAllMutation.isPending ? "Syncing..." : "↻ Sync Agenda"}
            </button>
          )}
          {isTrainer && (
            <button onClick={openNew} className="btn-primary" style={{ width: "auto" }}>
              <i className="ti ti-plus" style={{ fontSize: "16px" }} /> Nieuwe Wedstrijd
            </button>
          )}
        </div>
      </div>

      {/* Team switch */}
      <div className="flex rounded-xl p-1 gap-1" style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", width: "fit-content" }}>
        {TEAMS.map((t) => (
          <button key={t} onClick={() => { setActiveTeam(t); setSelectedMatch(null); }}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={activeTeam === t ? { background: "#FF6B00", color: "#fff", borderRadius: "10px" } : { color: "rgba(255,255,255,0.50)" }}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Match list */}
        <div className="lg:col-span-2 space-y-3">
          <p className="t-label mb-3">{activeTeam} — {teamMatches.length} wedstrijd{teamMatches.length !== 1 ? "en" : ""}</p>
          {teamMatches.map((m) => {
            const isActive = selectedMatch === m.id;
            const matchDate = new Date(m.date);
            const isThuis = m.home_away === "Thuis";
            const hasScore = m.score_home !== undefined && m.score_home !== null && m.score_away !== undefined && m.score_away !== null;
            const result = getResult(m);
            const resultLabel = result === "win" ? "W" : result === "loss" ? "V" : "G";
            const badgeClass = result === "win" ? "badge badge-win" : result === "loss" ? "badge badge-loss" : result === "draw" ? "badge badge-draw" : "";

            return (
              <button key={m.id} onClick={() => setSelectedMatch(m.id)}
                className="w-full text-left transition-all"
                style={{
                  background: isActive ? "rgba(255,107,0,0.15)" : "rgba(255,255,255,0.07)",
                  border: isActive ? "0.5px solid rgba(255,107,0,0.35)" : "0.5px solid rgba(255,255,255,0.10)",
                  borderRadius: "18px",
                }}>
                <div className="flex items-center gap-3 p-4">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-12 rounded-xl overflow-hidden text-center"
                    style={{ background: isActive ? "rgba(255,107,0,0.30)" : "rgba(255,255,255,0.10)" }}>
                    <div className="t-label py-1">{format(matchDate, "MMM", { locale: nl })}</div>
                    <div className="t-metric pb-2" style={{ fontSize: "22px" }}>{format(matchDate, "d")}</div>
                  </div>

                  {/* Match info */}
                  <div className="flex-1 min-w-0">
                    <p className="t-card-title truncate">{m.opponent}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={isThuis ? "dot-green" : "dot-yellow"} />
                      <span className="t-secondary-sm">{isThuis ? "Thuis" : "Uit"}</span>
                    </div>
                  </div>

                  {/* Score + result */}
                  <div className="flex-shrink-0 text-right">
                    {hasScore ? (
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-base font-bold text-white">{scoreLabel(m)}</p>
                        {result && <span className={badgeClass}>{resultLabel}</span>}
                      </div>
                    ) : (
                      <p className="t-tertiary">–</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {teamMatches.length === 0 && (
            <div className="glass p-10 text-center">
              <Trophy size={28} className="mx-auto mb-2 ic-muted" style={{ color: "rgba(255,255,255,0.25)" }} />
              <p className="t-tertiary">Nog geen wedstrijden voor {activeTeam}</p>
            </div>
          )}
        </div>

        {/* Match detail */}
        <div className="lg:col-span-3">
          {detailMatch ? (
            <div className="space-y-4">
              {/* Header card — match hero */}
              <div className="match-hero-card p-5 flex flex-col justify-between">
                <div className="absolute inset-0">
                  <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
                    <rect x="1" y="1" width="398" height="158" fill="none" stroke="white" strokeWidth="2"/>
                    <line x1="200" y1="1" x2="200" y2="159" stroke="white" strokeWidth="1.5"/>
                    <circle cx="200" cy="80" r="30" fill="none" stroke="white" strokeWidth="1.5"/>
                    <rect x="1" y="45" width="45" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
                    <rect x="354" y="45" width="45" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
                  </svg>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(255,107,0,0.15) 0%, rgba(0,0,0,0.10) 100%)" }} />
                </div>
                <div className="relative z-10 flex items-start justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge" style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "0.5px solid rgba(255,255,255,0.2)" }}>{detailMatch.team}</span>
                      <span className={detailMatch.home_away === "Thuis" ? "badge badge-win" : "badge badge-draw"}>{detailMatch.home_away}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.3px" }}>vs. {detailMatch.opponent}</h2>
                    <p className="t-secondary mt-1">{format(new Date(detailMatch.date), "d MMMM yyyy", { locale: nl })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="t-metric-orange" style={{ fontSize: "26px" }}>{scoreLabel(detailMatch)}</span>
                    {isTrainer && (
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => openEdit(detailMatch)} className="btn-secondary" style={{ height: "36px", fontSize: "12px", padding: "0 12px" }}>
                          <Edit2 size={11} /> Bewerken
                        </button>
                        <Link to={`/LiveMatch?matchId=${detailMatch.id}`}>
                          <button className="btn-primary" style={{ height: "36px", fontSize: "12px", padding: "0 12px", width: "auto" }}>
                            <Radio size={11} /> Live
                          </button>
                        </Link>
                        <button onClick={() => { if (confirm("Verwijderen?")) deleteMutation.mutate(detailMatch.id); }}
                          className="badge badge-loss" style={{ cursor: "pointer", height: "28px" }}>
                          <Trash2 size={10} className="mr-1" /> Verwijderen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tactical sections */}
              {(detailMatch.ball_possession || detailMatch.pressing || detailMatch.transition || detailMatch.set_pieces) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {detailMatch.ball_possession && <TactSection icon={Shield} title="Balbezit (BB)" content={detailMatch.ball_possession} />}
                  {detailMatch.pressing && <TactSection icon={Swords} title="Pressing (VB)" content={detailMatch.pressing} />}
                  {detailMatch.transition && <TactSection icon={ArrowLeftRight} title="Omschakeling" content={detailMatch.transition} />}
                  {detailMatch.set_pieces && <TactSection icon={Flag} title="Dode Spelmomenten" content={detailMatch.set_pieces} />}
                </div>
              )}

              {detailMatch.notes && (
                <div className="glass p-4">
                  <p className="t-card-title mb-1">Extra Notities</p>
                  <p className="t-secondary whitespace-pre-wrap">{detailMatch.notes}</p>
                </div>
              )}

              {detailMatch.lineup && detailMatch.lineup.length > 0 && (() => {
                const today = new Date().toISOString().split("T")[0];
                const isMatchDay = detailMatch.date === today;
                const canSeeLineup = isTrainer || isMatchDay;
                return canSeeLineup ? (
                  <div className="glass p-4">
                    <p className="t-card-title mb-3">Opstelling — {detailMatch.formation}</p>
                    <FieldLineup
                      players={activePlayers}
                      lineupMap={lineupArrayToMap(detailMatch.lineup)}
                      formation={detailMatch.formation || "4-3-3"}
                      readOnly
                    />
                    {detailMatch.substitutes && detailMatch.substitutes.length > 0 && (
                      <div className="mt-4 pt-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.10)" }}>
                        <p className="t-label mb-2">Wissels</p>
                        <div className="flex flex-wrap gap-2">
                          {detailMatch.substitutes.map((pid) => {
                            const p = activePlayers.find((pl) => pl.id === pid);
                            return p ? (
                              <span key={pid} className="badge" style={{ background: "rgba(255,107,0,0.12)", color: "#FF8C3A", border: "0.5px solid rgba(255,107,0,0.2)" }}>
                                ⇄ {p.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass p-6 text-center">
                    <Shield size={28} className="mx-auto mb-2" style={{ color: "rgba(255,107,0,0.40)" }} />
                    <p className="t-card-title mb-1">Opstelling nog niet beschikbaar</p>
                    <p className="t-secondary">De opstelling wordt zichtbaar op de wedstrijddag.</p>
                  </div>
                );
              })()}

              {/* RSVP voor speler */}
              {!isTrainer && (() => {
                const myPlayer = currentUser ? players.find(p => p.name === currentUser.full_name) : null;
                const linkedAgendaItem = agendaItems.find(ai => ai.match_id === detailMatch.id || (ai.type === "Wedstrijd" && ai.date === detailMatch.date && ai.title?.includes(detailMatch.opponent)));
                const myRecord = myPlayer && linkedAgendaItem ? agendaAttendance.find(aa => aa.agenda_item_id === linkedAgendaItem.id && aa.player_id === myPlayer.id) : null;

                if (!myPlayer || !linkedAgendaItem) return null;

                const rsvp = async (status) => {
                  if (myRecord) {
                    await base44.entities.AgendaAttendance.update(myRecord.id, { status });
                  } else {
                    await base44.entities.AgendaAttendance.create({ agenda_item_id: linkedAgendaItem.id, player_id: myPlayer.id, status });
                  }
                  queryClient.invalidateQueries({ queryKey: ["agendaAttendanceAll"] });
                };

                return (
                  <div className="glass p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="t-card-title">Mijn aanwezigheid</p>
                      <p className="t-secondary-sm">Geef aan of je erbij bent</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rsvp("aanwezig")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: myRecord?.status === "aanwezig" ? "#4ade80" : "rgba(74,222,128,0.12)", color: myRecord?.status === "aanwezig" ? "#fff" : "#4ade80", border: "0.5px solid rgba(74,222,128,0.30)" }}
                      >
                        <Check size={14} /> Ik kom
                      </button>
                      <button
                        onClick={() => rsvp("afwezig")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: myRecord?.status === "afwezig" ? "#f87171" : "rgba(248,113,113,0.12)", color: myRecord?.status === "afwezig" ? "#fff" : "#f87171", border: "0.5px solid rgba(248,113,113,0.30)" }}
                      >
                        <X size={14} /> Ik kom niet
                      </button>
                    </div>
                  </div>
                );
              })()}

              {isTrainer && (
                <MatchCheckInOverview
                  matchId={detailMatch.id}
                  totalInSelectie={(detailMatch.lineup?.length ?? 0) + (detailMatch.substitutes?.length ?? 0)}
                />
              )}
            </div>
          ) : (
            <div className="glass p-16 text-center">
              <Shield size={36} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="t-tertiary">Selecteer een wedstrijd</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog — new/edit match */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" style={{ background: "rgba(20,10,2,0.97)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
          <DialogHeader>
            <DialogTitle className="t-page-title">
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

            <button onClick={handleSave} disabled={saveMutation.isPending || !form.opponent} className="btn-primary">
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TactSection({ icon: Icon, title, content }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: "#FF8C3A" }} />
        <h3 className="t-card-title">{title}</h3>
      </div>
      <p className="t-secondary whitespace-pre-wrap">{content}</p>
    </div>
  );
}