import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, MapPin, Clock, Bell, Pencil, Trash2, Play, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate, TYPE_CONFIG, TEAM_COLORS } from "@/components/agenda/agendaUtils";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";
import FieldLineup from "@/components/wedstrijden/FieldLineup";
import AgendaForm from "@/components/agenda/AgendaForm";
import { createPageUrl } from "@/utils";

const TABS = ["Overzicht", "Opstelling", "Tactiek", "Aanwezigheid"];

export default function PlanningWedstrijdDetail() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");
  const navigate = useNavigate();
  const { isTrainer } = useCurrentUser();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [absentReason, setAbsentReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  // Local match state (for linked match)
  const [lineupMap, setLineupMap] = useState({});
  const [formation, setFormation] = useState("4-3-3");
  const [tactics, setTactics] = useState({ ball_possession: "", pressing: "", transition: "", set_pieces: "" });
  const [saving, setSaving] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["agenda-item", itemId],
    queryFn: () => base44.entities.AgendaItem.filter({ id: itemId }).then(r => r[0]),
    enabled: !!itemId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players-agenda"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["agenda-attendance", itemId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ agenda_item_id: itemId }),
    enabled: !!itemId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  // Load linked match data if present
  const { data: match } = useQuery({
    queryKey: ["match", item?.match_id],
    queryFn: () => base44.entities.Match.filter({ id: item.match_id }).then(r => {
      const m = r[0];
      if (m) {
        const lm = {};
        (m.lineup || []).forEach(e => { if (e.slot && e.player_id) lm[e.slot] = e.player_id; });
        setLineupMap(lm);
        setFormation(m.formation || "4-3-3");
        setTactics({
          ball_possession: m.ball_possession || "",
          pressing: m.pressing || "",
          transition: m.transition || "",
          set_pieces: m.set_pieces || "",
        });
      }
      return m;
    }),
    enabled: !!item?.match_id,
  });

  const myPlayer = currentUser ? players.find(p => p.name === currentUser.full_name) : null;
  const myAttendance = myPlayer ? attendance.find(a => a.player_id === myPlayer.id) : null;
  const today = new Date().toISOString().split("T")[0];
  const isFuture = item?.date >= today;

  const rsvpMutation = useMutation({
    mutationFn: async ({ status, reason }) => {
      if (myAttendance) {
        await base44.entities.AgendaAttendance.update(myAttendance.id, { status, notes: reason || myAttendance.notes });
      } else if (myPlayer) {
        await base44.entities.AgendaAttendance.create({ agenda_item_id: itemId, player_id: myPlayer.id, status, notes: reason || "" });
      }
      if (status === "afwezig" && myPlayer) {
        await base44.functions.invoke("agendaNotifications", {
          action: "send_absentee_notification",
          player_name: myPlayer.name,
          item_type: item.type,
          item_title: item.title,
          item_date: item.date,
          reason: reason || "",
          sender_email: currentUser?.email,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-attendance", itemId] });
      setShowReasonInput(false);
      setAbsentReason("");
    },
  });

  const sendReminder = useMutation({
    mutationFn: async () => {
      const respondedIds = new Set(attendance.map(a => a.player_id));
      const nogniet = players.filter(p => !respondedIds.has(p.id));
      const dateStr = new Date(item.date + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      for (const player of nogniet) {
        if (player.email) {
          await base44.integrations.Core.SendEmail({
            to: player.email,
            subject: `Herinnering: bevestig je aanwezigheid voor ${item.title}`,
            body: `Hoi ${player.name},\n\nVergeet niet je aanwezigheid door te geven voor ${item.title} op ${dateStr} om ${item.start_time}.\n\nOpen de app om te reageren.`,
          });
        }
      }
    },
    onSuccess: () => setReminderSent(true),
  });

  async function saveLineup() {
    if (!match) return;
    setSaving(true);
    const lineupArr = Object.entries(lineupMap).map(([slot, player_id]) => ({ slot, player_id }));
    await base44.entities.Match.update(match.id, {
      lineup: lineupArr,
      formation,
      ...tactics,
    });
    await qc.invalidateQueries({ queryKey: ["match", item?.match_id] });
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`'${item.title}' verwijderen?`)) return;
    await base44.entities.AgendaItem.delete(item.id);
    navigate("/Planning");
  }

  if (isLoading || !item) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const cfg = TYPE_CONFIG["Wedstrijd"];
  const teamCfg = TEAM_COLORS[item.team] || TEAM_COLORS["Beide"];
  const aanwezigList = attendance.filter(a => a.status === "aanwezig").map(a => players.find(p => p.id === a.player_id)).filter(Boolean);
  const afwezigList = attendance.filter(a => a.status === "afwezig").map(a => ({ player: players.find(p => p.id === a.player_id), record: a })).filter(x => x.player);
  const respondedIds = new Set(attendance.map(a => a.player_id));
  const nognietList = players.filter(p => !respondedIds.has(p.id));

  const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3"];

  return (
    <div className="relative">
      <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png" alt=""
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />

      <div className="relative z-10 space-y-5">
        {/* Back + actions */}
        <div className="flex items-center gap-3">
          <Link to="/Planning" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
            <ChevronLeft size={18} color="#fff" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="t-label" style={{ color: cfg.color }}>Wedstrijd</p>
            <h1 className="t-page-title truncate">{item.title}</h1>
          </div>
          {isTrainer && (
            <div className="flex gap-2">
              <button onClick={() => setShowEdit(true)} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
                <Pencil size={16} color="rgba(255,255,255,0.7)" />
              </button>
              <button onClick={handleDelete} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(248,113,113,0.10)", border: "0.5px solid rgba(248,113,113,0.25)" }}>
                <Trash2 size={16} color="#f87171" />
              </button>
            </div>
          )}
        </div>

        {/* Hero card */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.20), rgba(28,14,4,0.60))", border: "0.5px solid rgba(255,107,0,0.30)" }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={14} style={{ color: cfg.color }} />
                <span className="t-label" style={{ color: cfg.color }}>{item.team}</span>
                {item.home_away && (
                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: item.home_away === "Thuis" ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)", color: item.home_away === "Thuis" ? "#4ade80" : "#fbbf24", border: `0.5px solid ${item.home_away === "Thuis" ? "rgba(74,222,128,0.25)" : "rgba(251,191,36,0.25)"}` }}>
                    {item.home_away}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 t-secondary mb-1">
                <Clock size={13} className="ic-muted" />
                <span>{formatDate(item.date)} · {item.start_time}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {item.opponent_logo_url && (
                <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.08)", flexShrink: 0 }}>
                  <img src={item.opponent_logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div className="flex flex-col items-end gap-1">
                <span className="t-secondary-sm" style={{ color: "#4ade80" }}>{aanwezigList.length} ✓</span>
                <span className="t-secondary-sm" style={{ color: "#f87171" }}>{afwezigList.length} ✗</span>
              </div>
            </div>
          </div>

          {/* Live wedstrijd knop - prominent voor trainers */}
          {isTrainer && match && (
            <Link to={`/LiveMatch?matchId=${match.id}`}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
              style={{ background: "#FF6B00", color: "#fff" }}>
              <Play size={16} /> Live wedstrijdmodus
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
              style={{
                background: activeTab === i ? "rgba(255,140,58,0.20)" : "transparent",
                color: activeTab === i ? "#FF8C3A" : "rgba(255,255,255,0.45)",
                border: activeTab === i ? "0.5px solid rgba(255,140,58,0.30)" : "0.5px solid transparent",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overzicht */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* RSVP alleen voor toekomstige wedstrijden */}
            {!isTrainer && myPlayer && isFuture && (
              <div className="glass-dark rounded-2xl p-4 space-y-3">
                <p className="t-card-title">Jouw aanwezigheid</p>
                <AttendanceButtons
                  currentStatus={myAttendance?.status}
                  loading={rsvpMutation.isPending}
                  showAbsentInput={showReasonInput}
                  absentReason={absentReason}
                  onAbsentReasonChange={setAbsentReason}
                  onPresent={() => rsvpMutation.mutate({ status: "aanwezig" })}
                  onAbsent={() => setShowReasonInput(true)}
                  onConfirmAbsent={() => rsvpMutation.mutate({ status: "afwezig", reason: absentReason })}
                />
              </div>
            )}

            {/* Na bevestiging: aanwezigheidslijst */}
            {!isTrainer && myAttendance && (
              <div className="glass-dark rounded-2xl p-4 space-y-3">
                <p className="t-card-title">Wie is er bij?</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="t-label mb-2" style={{ color: "#4ade80" }}>✓ Aanwezig ({aanwezigList.length})</p>
                    <div className="space-y-1.5">
                      {aanwezigList.map(player => <PlayerPill key={player.id} player={player} />)}
                      {aanwezigList.length === 0 && <p className="t-tertiary text-xs">Niemand</p>}
                    </div>
                  </div>
                  <div>
                    <p className="t-label mb-2" style={{ color: "#f87171" }}>✗ Afwezig ({afwezigList.length})</p>
                    <div className="space-y-1.5">
                      {afwezigList.map(({ player }) => <PlayerPill key={player.id} player={player} />)}
                      {afwezigList.length === 0 && <p className="t-tertiary text-xs">Niemand</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {item.notes && (
              <div className="glass-dark rounded-2xl p-4">
                <p className="t-label mb-2">Notities</p>
                <p className="t-secondary">{item.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Opstelling */}
        {activeTab === 1 && (
          <div className="space-y-4">
            {!match ? (
              <div className="glass-dark rounded-2xl p-6 text-center">
                <p className="t-secondary">Geen gekoppelde wedstrijd gevonden.</p>
                <p className="t-tertiary mt-1 text-xs">Koppel een wedstrijd via Wedstrijden om de opstelling te beheren.</p>
              </div>
            ) : (
              <>
                {/* Formatie selector */}
                {isTrainer && (
                  <div>
                    <p className="t-label mb-2">Formatie</p>
                    <div className="flex flex-wrap gap-2">
                      {FORMATIONS.map(f => (
                        <button key={f} onClick={() => setFormation(f)}
                          className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                          style={{
                            background: formation === f ? "rgba(255,140,58,0.20)" : "rgba(255,255,255,0.07)",
                            color: formation === f ? "#FF8C3A" : "rgba(255,255,255,0.5)",
                            border: `0.5px solid ${formation === f ? "rgba(255,140,58,0.35)" : "rgba(255,255,255,0.10)"}`,
                          }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <FieldLineup
                  players={players}
                  lineupMap={lineupMap}
                  formation={formation}
                  onLineupChange={isTrainer ? setLineupMap : () => {}}
                  readOnly={!isTrainer}
                />

                {isTrainer && (
                  <button onClick={saveLineup} disabled={saving} className="btn-primary">
                    {saving ? "Opslaan..." : "Opstelling opslaan"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Tactiek */}
        {activeTab === 2 && (
          <div className="space-y-4">
            {!match ? (
              <div className="glass-dark rounded-2xl p-6 text-center">
                <p className="t-secondary">Geen gekoppelde wedstrijd gevonden.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { key: "ball_possession", label: "Balbezit (BB)" },
                  { key: "pressing", label: "Verdediging / Pressing (VB)" },
                  { key: "transition", label: "Omschakeling" },
                  { key: "set_pieces", label: "Dode spelmomenten" },
                ].map(({ key, label }) => (
                  <div key={key} className="glass-dark rounded-2xl p-4">
                    <p className="t-label mb-2">{label}</p>
                    {isTrainer ? (
                      <textarea
                        value={tactics[key]}
                        onChange={e => setTactics(t => ({ ...t, [key]: e.target.value }))}
                        rows={3}
                        className="w-full text-sm text-white outline-none resize-none rounded-xl p-3"
                        style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)" }}
                        placeholder={`Notities voor ${label.toLowerCase()}...`}
                      />
                    ) : (
                      <p className="t-secondary">{tactics[key] || <span className="t-tertiary">Nog geen notities.</span>}</p>
                    )}
                  </div>
                ))}
                {isTrainer && (
                  <button onClick={saveLineup} disabled={saving} className="btn-primary">
                    {saving ? "Opslaan..." : "Tactiek opslaan"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Aanwezigheid */}
        {activeTab === 3 && (
          <div className="glass-dark rounded-2xl p-4 space-y-5">
            <div>
              <p className="t-label mb-3" style={{ color: "#4ade80" }}>Bevestigd aanwezig ({aanwezigList.length})</p>
              {aanwezigList.length === 0 ? <p className="t-tertiary text-sm">Niemand bevestigd</p> : (
                <div className="space-y-2">
                  {aanwezigList.map(player => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(74,222,128,0.06)" }}>
                      <PlayerAvatar player={player} />
                      <p className="t-secondary flex-1">{player.name}</p>
                      <div className="dot-green" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="t-label mb-3" style={{ color: "#f87171" }}>Afgemeld ({afwezigList.length})</p>
              {afwezigList.length === 0 ? <p className="t-tertiary text-sm">Niemand afgemeld</p> : (
                <div className="space-y-2">
                  {afwezigList.map(({ player, record }) => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(248,113,113,0.06)" }}>
                      <PlayerAvatar player={player} />
                      <div className="flex-1 min-w-0">
                        <p className="t-secondary">{player.name}</p>
                        {isTrainer && record.notes && <p className="t-tertiary truncate">{record.notes}</p>}
                      </div>
                      <div className="dot-red" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="t-label mb-3" style={{ color: "#fbbf24" }}>Nog niet gereageerd ({nognietList.length})</p>
              {nognietList.length === 0 ? <p className="t-tertiary text-sm">Iedereen heeft gereageerd 🎉</p> : (
                <div className="space-y-2">
                  {nognietList.map(player => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <PlayerAvatar player={player} />
                      <p className="t-secondary flex-1">{player.name}</p>
                      <div className="dot-yellow" />
                    </div>
                  ))}
                  {isTrainer && (
                    <button onClick={() => sendReminder.mutate()} disabled={sendReminder.isPending || reminderSent}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                      style={{
                        background: reminderSent ? "rgba(74,222,128,0.10)" : "rgba(255,107,0,0.15)",
                        border: `0.5px solid ${reminderSent ? "rgba(74,222,128,0.25)" : "rgba(255,107,0,0.30)"}`,
                        color: reminderSent ? "#4ade80" : "#FF8C3A",
                      }}>
                      <Bell size={15} />
                      {reminderSent ? "Herinneringen verstuurd!" : sendReminder.isPending ? "Versturen..." : `Stuur herinnering (${nognietList.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showEdit && (
        <AgendaForm
          item={item}
          onSave={async () => {
            await qc.invalidateQueries({ queryKey: ["agenda-item", itemId] });
            await qc.invalidateQueries({ queryKey: ["agenda-items"] });
            setShowEdit(false);
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

function PlayerAvatar({ player }) {
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
      style={{ background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.25)" }}>
      {player.photo_url
        ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
        : <span style={{ fontSize: 11, fontWeight: 700, color: "#FF8C3A" }}>{player.name?.charAt(0)}</span>}
    </div>
  );
}

function PlayerPill({ player }) {
  const firstName = player.name?.split(" ")[0] || player.name;
  return (
    <div className="flex items-center gap-2">
      <PlayerAvatar player={player} />
      <span className="t-secondary-sm truncate">{firstName}</span>
    </div>
  );
}