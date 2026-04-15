import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, MapPin, Clock, Bell, Pencil, Trash2, Ban, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate, TYPE_CONFIG } from "@/components/agenda/agendaUtils";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";
import TrainingPlanEditor from "@/components/trainingsplanner/TrainingPlanEditor";
import AgendaForm from "@/components/agenda/AgendaForm";
import DailyFeelingAverage from "@/components/dashboard/DailyFeelingAverage";
import { format, parseISO } from "date-fns";
import { PLAYER_FALLBACK_PHOTO } from "@/lib/playerFallback";

const TABS = ["Overzicht", "Trainingsplan", "Aanwezigheid"];

export default function PlanningTrainingDetail() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");
  const navigate = useNavigate();
  const { isTrainer, isOuder } = useCurrentUser();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
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

  const playerId = useCurrentUser().playerId;
  const myPlayer = playerId ? players.find(p => p.id === playerId) : null;
  const myAttendance = playerId ? attendance.find(a => a.player_id === playerId) : null;
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

  async function handleCancel() {
    await base44.entities.AgendaItem.update(item.id, { cancelled: true, cancel_reason: cancelReason });
    await qc.invalidateQueries({ queryKey: ["agenda-item", itemId] });
    await qc.invalidateQueries({ queryKey: ["agenda-items"] });
    setShowCancelConfirm(false);
    setCancelReason("");
  }

  async function handleUncancel() {
    await base44.entities.AgendaItem.update(item.id, { cancelled: false, cancel_reason: "" });
    await qc.invalidateQueries({ queryKey: ["agenda-item", itemId] });
    await qc.invalidateQueries({ queryKey: ["agenda-items"] });
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
  const aanwezigList = Array.from(new Map(
    attendance.filter(a => a.status === "aanwezig")
      .map(a => players.find(p => p.id === a.player_id))
      .filter(Boolean)
      .map(p => [p.id, p])
  ).values());
  const afwezigList = attendance.filter(a => a.status === "afwezig").map(a => ({ player: players.find(p => p.id === a.player_id), record: a })).filter(x => x.player);
  const respondedIds = new Set(attendance.map(a => a.player_id));
  const nognietList = players.filter(p => !respondedIds.has(p.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Back + header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/Planning"
            style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", textDecoration: "none" }}>
            <ChevronLeft size={18} color="#1a1a1a" />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "#08D068", marginBottom: 2 }}>Training</p>
            <h1 className="t-page-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h1>
          </div>
          {isTrainer && !isOuder && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowEdit(true)}
                style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer" }}>
                <Pencil size={16} color="#1a1a1a" />
              </button>
              {item.cancelled ? (
                <button onClick={handleUncancel}
                  style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,208,104,0.12)", border: "2.5px solid #08D068", cursor: "pointer" }}>
                  <Check size={16} color="#05a050" />
                </button>
              ) : (
                <button onClick={() => setShowCancelConfirm(true)}
                  style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,150,0,0.12)", border: "2.5px solid #FF6800", cursor: "pointer" }}>
                  <Ban size={16} color="#FF6800" />
                </button>
              )}
              <button onClick={handleDelete}
                style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,61,168,0.10)", border: "2.5px solid #FF3DA8", cursor: "pointer" }}>
                <Trash2 size={16} color="#FF3DA8" />
              </button>
            </div>
          )}
        </div>

        {/* Geannuleerd banner */}
        {item.cancelled && (
          <div style={{ background: "#FF3DA8", border: "2.5px solid #1a1a1a", borderRadius: 14, boxShadow: "3px 3px 0 #1a1a1a", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <Ban size={18} color="#ffffff" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#ffffff" }}>Geannuleerd</p>
              {item.cancel_reason && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.80)", marginTop: 2 }}>{item.cancel_reason}</p>}
            </div>
          </div>
        )}

        {/* Info card */}
        <div style={{ background: "#08D068", opacity: item.cancelled ? 0.6 : 1, border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={13} style={{ color: "rgba(26,26,26,0.60)" }} />
            <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600 }}>{formatDate(item.date)} · {item.start_time}</span>
          </div>
          {item.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={13} style={{ color: "rgba(26,26,26,0.60)" }} />
              <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600 }}>{item.location}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#1a1a1a" }}>{aanwezigList.length} aanwezig</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#1a1a1a", opacity: 0.7 }}>{afwezigList.length} afwezig</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(26,26,26,0.50)" }}>{nognietList.length} onbekend</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 14, boxShadow: "2px 2px 0 #1a1a1a", overflow: "hidden" }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              style={{
                flex: 1, padding: "10px 4px", fontSize: "13px", fontWeight: 800, cursor: "pointer",
                background: activeTab === i ? "#08D068" : "transparent",
                color: activeTab === i ? "#1a1a1a" : "rgba(26,26,26,0.45)",
                border: "none",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overzicht */}
         {activeTab === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Daily Feeling Average - alleen voor trainers */}
            <DailyFeelingAverage trainingDate={item.date} isTrainer={isTrainer} />

            {/* RSVP voor spelers (alleen toekomstige activiteiten) - GEEN ouders */}
            {!isTrainer && myPlayer && isFuture && !isOuder && (
              <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>Jouw aanwezigheid</p>
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
              <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "14px 16px" }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", marginBottom: 12 }}>Wie komt er?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, color: "#05a050", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>✓ Aanwezig ({aanwezigList.length})</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {aanwezigList.map(player => <PlayerPill key={player.id} player={player} />)}
                      {aanwezigList.length === 0 && <p style={{ fontSize: 11, color: "rgba(26,26,26,0.35)" }}>Niemand</p>}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, color: "#FF3DA8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>✗ Afwezig ({afwezigList.length})</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {afwezigList.map(({ player }) => <PlayerPill key={player.id} player={player} />)}
                      {afwezigList.length === 0 && <p style={{ fontSize: 11, color: "rgba(26,26,26,0.35)" }}>Niemand</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {item.notes && (
              <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "14px 16px" }}>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Sessiedoelstelling</p>
                <p style={{ fontSize: 13, color: "rgba(26,26,26,0.65)" }}>{item.notes}</p>
              </div>
            )}

            {item.photo_url && (
              <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
                <img src={item.photo_url} alt={item.title} style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} />
              </div>
            )}
          </div>
        )}

        {/* Tab: Trainingsplan */}
         {activeTab === 1 && (
          isOuder
            ? <OuderTrainingsPlanView trainingDate={item?.date} />
            : !isTrainer
            ? <OuderTrainingsPlanView trainingDate={item?.date} />
            : <TrainingPlanEditor players={aanwezigList.length > 0 ? aanwezigList : players} trainingDate={item?.date} readOnly={false} />
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

      {showCancelConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setShowCancelConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200 }} />
          <div style={{ position: "relative", zIndex: 301, background: "#1a1a1a", border: "2.5px solid #1a1a1a", borderRadius: "20px 20px 0 0", padding: "24px", paddingBottom: "max(24px, calc(24px + env(safe-area-inset-bottom)))", width: "100%", maxWidth: "500px" }}>
            <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "12px" }}>🚫</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "white", textAlign: "center", marginBottom: "8px" }}>Activiteit annuleren?</div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", textAlign: "center", marginBottom: "16px" }}>De activiteit blijft zichtbaar maar wordt gemarkeerd als geannuleerd.</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reden voor annulering (optioneel)..."
              rows={2}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.08)", color: "#ffffff", fontSize: 13, fontWeight: 500, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowCancelConfirm(false)}
                style={{ flex: 1, height: "48px", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "14px", fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                Terug
              </button>
              <button onClick={handleCancel}
                style={{ flex: 1, height: "48px", background: "#FF3DA8", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                Ja, annuleer
              </button>
            </div>
          </div>
        </div>
      )}

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

function ExerciseDetailModal({ exercise, index, onClose }) {
  const GROUP_COLORS_MAP = {
    red: "#FF3DA8", orange: "#FF6800", yellow: "#FFD600",
    green: "#08D068", blue: "#00C2FF", white: "#f0f0f0",
  };
  const [lightbox, setLightbox] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div
        style={{ background: "#FFF3E8", border: "2.5px solid #1a1a1a", borderRadius: "24px 24px 0 0", boxShadow: "0 -4px 0 #1a1a1a", width: "100%", maxWidth: "720px", maxHeight: "92vh", overflowY: "auto", overscrollBehavior: "contain" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 16px 12px", borderBottom: "2px solid rgba(26,26,26,0.08)", position: "sticky", top: 0, background: "#FFF3E8", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{index + 1}</span>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>{exercise.name || "Oefenvorm"}</h2>
            {exercise.duration_minutes > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(26,26,26,0.08)", borderRadius: 6, padding: "2px 8px", color: "rgba(26,26,26,0.55)" }}>{exercise.duration_minutes} min</span>
            )}
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={16} color="#1a1a1a" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 32 }}>

          {/* Field drawing */}
          {exercise.field_drawing && (
            <>
              {lightbox && (
                <div onClick={() => setLightbox(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                  <img src={exercise.field_drawing} alt="Velddiagram" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 14, objectFit: "contain" }} onClick={e => e.stopPropagation()} />
                </div>
              )}
              <div style={{ position: "relative", border: "2.5px solid #1a1a1a", borderRadius: 14, overflow: "hidden", cursor: "zoom-in" }} onClick={() => setLightbox(true)}>
                <img src={exercise.field_drawing} alt="Velddiagram" style={{ width: "100%", display: "block" }} />
              </div>
            </>
          )}

          {/* Description */}
          {exercise.description && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.45)", marginBottom: 6 }}>Beschrijving</p>
              <p style={{ fontSize: 14, color: "#1a1a1a", lineHeight: 1.6 }}>{exercise.description}</p>
            </div>
          )}

          {/* Coaching points */}
          {(exercise.coaching_points || []).length > 0 && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.45)", marginBottom: 8 }}>Coaching Points</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {exercise.coaching_points.map((pt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600 }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube */}
          {exercise.youtube_url && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.45)", marginBottom: 6 }}>Video</p>
              <a href={exercise.youtube_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,0,0,0.08)", border: "2px solid rgba(255,0,0,0.25)", borderRadius: 10, padding: "10px 14px", textDecoration: "none" }}>
                <span style={{ fontSize: 16 }}>▶</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#FF0000" }}>Bekijk video</span>
              </a>
            </div>
          )}

          {/* Groups */}
          {(exercise.groups || []).length > 0 && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.45)", marginBottom: 8 }}>Spelersgroepen</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {exercise.groups.map(g => {
                  const hex = GROUP_COLORS_MAP[g.color] || "#FF6800";
                  return (
                    <div key={g.id} style={{ background: hex + "18", border: `2px solid ${hex}`, borderRadius: 12, padding: "10px 12px" }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#1a1a1a", marginBottom: g.player_ids?.length > 0 ? 4 : 0 }}>{g.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OuderTrainingsPlanView({ trainingDate }) {
  const [selectedEx, setSelectedEx] = useState(null);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["training-plans"],
    queryFn: () => base44.entities.TrainingPlan.list("-date"),
  });

  const plan = trainingDate ? allPlans.find(p => p.date === trainingDate) : null;

  if (isLoading) return <div style={{ textAlign: "center", padding: "32px 0" }}><div className="w-6 h-6 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" /></div>;

  if (!plan || !(plan.exercises || []).length) {
    return (
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "32px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(26,26,26,0.45)" }}>Nog geen oefenvormen gepland.</p>
      </div>
    );
  }

  const total = plan.exercises.reduce((s, e) => s + (e.duration_minutes || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {plan.objective && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 14, boxShadow: "2px 2px 0 #1a1a1a", padding: "12px 14px" }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 4 }}>Sessiedoelstelling</p>
          <p style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600 }}>{plan.objective}</p>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>{plan.exercises.length} oefenvormen</p>
        {total > 0 && <p style={{ fontSize: 12, color: "rgba(26,26,26,0.55)", fontWeight: 600 }}>{total} min totaal</p>}
      </div>
      {plan.exercises.map((ex, i) => (
        <button key={ex.id || i} onClick={() => setSelectedEx({ ex, i })}
          style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 14, boxShadow: "2px 2px 0 #1a1a1a", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, width: "100%", cursor: "pointer", textAlign: "left", transition: "transform 0.1s, box-shadow 0.1s" }}
          onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "0px 0px 0 #1a1a1a"; }}
          onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "2px 2px 0 #1a1a1a"; }}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{i + 1}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>{ex.name || "Oefenvorm"}</p>
            {ex.description && <p style={{ fontSize: 12, color: "rgba(26,26,26,0.55)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.description}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {ex.duration_minutes > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(26,26,26,0.55)" }}>{ex.duration_minutes} min</span>
            )}
            <span style={{ fontSize: 16, color: "rgba(26,26,26,0.30)" }}>›</span>
          </div>
        </button>
      ))}

      {selectedEx && (
        <ExerciseDetailModal exercise={selectedEx.ex} index={selectedEx.i} onClose={() => setSelectedEx(null)} />
      )}
    </div>
  );
}

function AttendanceTab({ isTrainer, aanwezigList, afwezigList, nognietList, sendReminder, reminderSent, editingAttendance, onToggleEdit, players, onToggleStatus }) {
  return (
    <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", display: "flex", flexDirection: "column", gap: 18 }}>
      {isTrainer && (
        <button onClick={onToggleEdit}
          style={{ width: "100%", height: 44, borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer", background: editingAttendance ? "#08D068" : "#ffffff", color: "#1a1a1a", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a" }}>
          {editingAttendance ? "✓ Gereed" : "Aanwezigheid bewerken"}
        </button>
      )}

      {/* Aanwezig */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#05a050", marginBottom: 10 }}>Bevestigd aanwezig ({aanwezigList.length})</p>
        {aanwezigList.length === 0 ? <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Niemand bevestigd</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {aanwezigList.map(player => (
              <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(8,208,104,0.08)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 10 }}>
                <PlayerAvatar player={player} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{player.name}</p>
                {editingAttendance ? (
                  <button onClick={() => onToggleStatus(player.id, "afwezig")}
                    style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(255,61,168,0.12)", color: "#FF3DA8", border: "1px solid rgba(255,61,168,0.25)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>✕</button>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#05a050", flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Afwezig */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FF3DA8", marginBottom: 10 }}>Afgemeld ({afwezigList.length})</p>
        {afwezigList.length === 0 ? <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Niemand afgemeld</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {afwezigList.map(({ player, record }) => (
              <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,61,168,0.06)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 10 }}>
                <PlayerAvatar player={player} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{player.name}</p>
                  {isTrainer && record.notes && <p style={{ fontSize: 11, color: "#FF3DA8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.notes}</p>}
                </div>
                {editingAttendance ? (
                  <button onClick={() => onToggleStatus(player.id, "aanwezig")}
                    style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(8,208,104,0.12)", color: "#05a050", border: "1px solid rgba(8,208,104,0.25)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>✓</button>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF3DA8", flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nog niet */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#cc9900", marginBottom: 10 }}>Nog niet gereageerd ({nognietList.length})</p>
        {nognietList.length === 0 ? <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Iedereen heeft gereageerd 🎉</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {nognietList.map(player => (
              <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(26,26,26,0.03)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 10 }}>
                <PlayerAvatar player={player} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{player.name}</p>
                {editingAttendance ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => onToggleStatus(player.id, "aanwezig")}
                      style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(8,208,104,0.12)", color: "#05a050", border: "1px solid rgba(8,208,104,0.25)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>✓</button>
                    <button onClick={() => onToggleStatus(player.id, "afwezig")}
                      style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(255,61,168,0.12)", color: "#FF3DA8", border: "1px solid rgba(255,61,168,0.25)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>✕</button>
                  </div>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFD600", border: "1.5px solid #1a1a1a", flexShrink: 0 }} />
                )}
              </div>
            ))}
            {!editingAttendance && isTrainer && (
              <button onClick={() => sendReminder.mutate()} disabled={sendReminder.isPending || reminderSent}
                style={{ marginTop: 8, width: "100%", height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, border: "2px solid #1a1a1a", background: reminderSent ? "#08D068" : "#ffffff", color: "#1a1a1a", fontSize: 13, fontWeight: 800, cursor: reminderSent ? "default" : "pointer", boxShadow: "2px 2px 0 #1a1a1a" }}>
                <Bell size={14} />
                {reminderSent ? "Verstuurd!" : sendReminder.isPending ? "Versturen..." : `Stuur herinnering (${nognietList.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerAvatar({ player }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(255,104,0,0.12)", border: "1.5px solid #1a1a1a" }}>
      <img src={player.photo_url || PLAYER_FALLBACK_PHOTO} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

function PlayerPill({ player }) {
  const firstName = player.name?.split(" ")[0] || player.name;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <PlayerAvatar player={player} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</span>
    </div>
  );
}