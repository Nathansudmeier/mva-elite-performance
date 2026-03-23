import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, MapPin, Clock, Bell, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate, TYPE_CONFIG } from "@/components/agenda/agendaUtils";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";
import TrainingPlanEditor from "@/components/trainingsplanner/TrainingPlanEditor";
import AgendaForm from "@/components/agenda/AgendaForm";

const TABS = ["Overzicht", "Trainingsplan", "Aanwezigheid"];

export default function PlanningTrainingDetail() {
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
  const [editingAttendance, setEditingAttendance] = useState(false);

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
    queryKey: ["agenda-attendance-detail", itemId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ agenda_item_id: itemId }),
    enabled: !!itemId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
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
      qc.invalidateQueries({ queryKey: ["agenda-attendance-detail", itemId] });
      qc.invalidateQueries({ queryKey: ["agendaAttendance-all"] });
      qc.invalidateQueries({ queryKey: ["agenda-items-all"] });
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

  async function handleDelete() {
    if (!confirm(`'${item.title}' verwijderen?`)) return;
    await base44.entities.AgendaItem.delete(item.id);
    navigate("/Planning");
  }

  async function handleAttendanceToggle(playerId, newStatus) {
    const existingRecord = attendance.find(a => a.player_id === playerId);
    if (existingRecord) {
      await base44.entities.AgendaAttendance.update(existingRecord.id, { status: newStatus });
    } else {
      await base44.entities.AgendaAttendance.create({ agenda_item_id: itemId, player_id: playerId, status: newStatus });
    }
    await qc.invalidateQueries({ queryKey: ["agenda-attendance-detail", itemId] });
  }

  if (isLoading || !item) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const cfg = TYPE_CONFIG["Training"];
  const aanwezigList = attendance.filter(a => a.status === "aanwezig").map(a => players.find(p => p.id === a.player_id)).filter(Boolean);
  const afwezigList = attendance.filter(a => a.status === "afwezig").map(a => ({ player: players.find(p => p.id === a.player_id), record: a })).filter(x => x.player);
  const respondedIds = new Set(attendance.map(a => a.player_id));
  const nognietList = players.filter(p => !respondedIds.has(p.id));

  return (
    <div className="relative">
      <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png" alt=""
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />

      <div className="relative z-10 space-y-5">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Link to="/Planning" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
            <ChevronLeft size={18} color="#fff" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="t-label" style={{ color: cfg.color }}>Training</p>
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

        {/* Info card */}
        <div className="glass-dark rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 t-secondary">
            <Clock size={14} className="ic-muted" />
            <span>{formatDate(item.date)} · {item.start_time}</span>
          </div>
          {item.location && (
            <div className="flex items-center gap-2 t-secondary">
              <MapPin size={14} className="ic-muted" />
              <span>{item.location}</span>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <span className="t-secondary-sm" style={{ color: "#4ade80" }}>{aanwezigList.length} aanwezig</span>
            <span className="t-secondary-sm" style={{ color: "#f87171" }}>{afwezigList.length} afwezig</span>
            <span className="t-secondary-sm" style={{ color: "#fbbf24" }}>{nognietList.length} onbekend</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
              style={{
                background: activeTab === i ? "rgba(74,222,128,0.20)" : "transparent",
                color: activeTab === i ? "#4ade80" : "rgba(255,255,255,0.45)",
                border: activeTab === i ? "0.5px solid rgba(74,222,128,0.30)" : "0.5px solid transparent",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overzicht */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* RSVP voor spelers (alleen toekomstige activiteiten) */}
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
                <p className="t-card-title">Wie komt er?</p>
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

            {/* Sessiedoelstelling */}
            {item.notes && (
              <div className="glass-dark rounded-2xl p-4">
                <p className="t-label mb-2">Sessiedoelstelling</p>
                <p className="t-secondary">{item.notes}</p>
              </div>
            )}

            {/* Foto */}
            {item.photo_url && (
              <div className="glass-dark rounded-2xl overflow-hidden">
                <img src={item.photo_url} alt={item.title} className="w-full h-auto object-cover" />
              </div>
            )}
          </div>
        )}

        {/* Tab: Trainingsplan */}
         {activeTab === 1 && (
          <TrainingPlanEditor players={players} trainingDate={item?.date} />
        )}

        {/* Tab: Aanwezigheid */}
         {activeTab === 2 && (
          <AttendanceTab
            isTrainer={isTrainer}
            aanwezigList={aanwezigList}
            afwezigList={afwezigList}
            nognietList={nognietList}
            sendReminder={sendReminder}
            reminderSent={reminderSent}
            editingAttendance={editingAttendance}
            onToggleEdit={() => setEditingAttendance(!editingAttendance)}
            players={players}
            onToggleStatus={handleAttendanceToggle}
          />
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

function AttendanceTab({ isTrainer, aanwezigList, afwezigList, nognietList, sendReminder, reminderSent, editingAttendance, onToggleEdit, players, onToggleStatus }) {
  return (
    <div className="glass-dark rounded-2xl p-4 space-y-5">
      {isTrainer && (
        <div className="flex gap-2">
          <button
            onClick={onToggleEdit}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{
              background: editingAttendance ? "rgba(74,222,128,0.20)" : "rgba(255,255,255,0.08)",
              color: editingAttendance ? "#4ade80" : "rgba(255,255,255,0.65)",
              border: `0.5px solid ${editingAttendance ? "rgba(74,222,128,0.30)" : "rgba(255,255,255,0.12)"}`,
            }}
          >
            {editingAttendance ? "Gereed" : "Aanwezigheid bewerken"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* Aanwezig */}
        <div>
          <p className="t-label mb-3" style={{ color: "#4ade80" }}>Bevestigd aanwezig ({aanwezigList.length})</p>
          {aanwezigList.length === 0 ? <p className="t-tertiary text-sm">Niemand bevestigd</p> : (
            <div className="space-y-2">
              {aanwezigList.map(player => (
                <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(74,222,128,0.06)" }}>
                  <PlayerAvatar player={player} />
                  <p className="t-secondary flex-1">{player.name}</p>
                  {editingAttendance ? (
                    <button
                      onClick={() => onToggleStatus(player.id, null)}
                      className="text-xs font-semibold px-2 py-1 rounded transition"
                      style={{ background: "rgba(248,113,113,0.20)", color: "#f87171" }}
                    >
                      ✕
                    </button>
                  ) : (
                    <div className="dot-green" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Afwezig */}
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
                  {editingAttendance ? (
                    <button
                      onClick={() => onToggleStatus(player.id, "aanwezig")}
                      className="text-xs font-semibold px-2 py-1 rounded transition"
                      style={{ background: "rgba(74,222,128,0.20)", color: "#4ade80" }}
                    >
                      ✓
                    </button>
                  ) : (
                    <div className="dot-red" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nog niet gereageerd */}
        <div>
          <p className="t-label mb-3" style={{ color: "#fbbf24" }}>Nog niet gereageerd ({nognietList.length})</p>
          {nognietList.length === 0 ? <p className="t-tertiary text-sm">Iedereen heeft gereageerd 🎉</p> : (
            <div className="space-y-2">
              {nognietList.map(player => (
                <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <PlayerAvatar player={player} />
                  <p className="t-secondary flex-1">{player.name}</p>
                  {editingAttendance ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onToggleStatus(player.id, "aanwezig")}
                        className="text-xs font-semibold px-2 py-1 rounded transition"
                        style={{ background: "rgba(74,222,128,0.20)", color: "#4ade80" }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => onToggleStatus(player.id, "afwezig")}
                        className="text-xs font-semibold px-2 py-1 rounded transition"
                        style={{ background: "rgba(248,113,113,0.20)", color: "#f87171" }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="dot-yellow" />
                  )}
                </div>
              ))}
              {!editingAttendance && isTrainer && (
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