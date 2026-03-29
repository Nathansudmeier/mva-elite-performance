import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, Clock, MapPin, Pencil, Trash2, Trophy, Users, Info, Plus, X, Check, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/components/agenda/agendaUtils";
import AgendaForm from "@/components/agenda/AgendaForm";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";

export default function PlanningToernooiDetail() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");
  const navigate = useNavigate();
  const { isTrainer } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [absentReason, setAbsentReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  // Tournament info editing state
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoText, setInfoText] = useState("");
  const [wedstrijden, setWedstrijden] = useState([]);
  const [newWedstrijd, setNewWedstrijd] = useState({ opponent: "", time: "", result: "" });
  const [addingWedstrijd, setAddingWedstrijd] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["agenda-item", itemId],
    queryFn: () => base44.entities.AgendaItem.filter({ id: itemId }).then(r => r[0]),
    enabled: !!itemId,
    onSuccess: (data) => {
      if (data) {
        setInfoText(data.notes || "");
        setWedstrijden(data.tournament_matches || []);
      }
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players-active"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["agenda-attendance", itemId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ agenda_item_id: itemId }),
    enabled: !!itemId,
  });

  const myPlayer = currentUser ? players.find(p => p.name === currentUser.full_name) : null;
  const myAttendance = myPlayer ? attendance.find(a => a.player_id === myPlayer.id) : null;

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
          item_type: "Toernooi",
          item_title: item?.title,
          item_date: item?.date,
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

  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p; });

  const aanwezigList = attendance.filter(a => a.status === "aanwezig").map(a => ({ player: playerMap[a.player_id], record: a })).filter(x => x.player);
  const afwezigList = attendance.filter(a => a.status === "afwezig").map(a => ({ player: playerMap[a.player_id], record: a })).filter(x => x.player);
  const respondedIds = new Set(attendance.map(a => a.player_id));
  const nognietList = players.filter(p => !respondedIds.has(p.id));

  const sendReminder = useMutation({
    mutationFn: async () => {
      const dateStr = new Date(item.date + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      for (const player of nognietList) {
        if (player.email) {
          await base44.integrations.Core.SendEmail({
            to: player.email,
            subject: `Herinnering: bevestig je aanwezigheid voor ${item.title}`,
            body: `Hoi ${player.name},\n\nVergeet niet je aanwezigheid door te geven voor ${item.title} op ${dateStr}.\n\nOpen de app om te reageren.`,
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

  async function saveInfo() {
    await base44.entities.AgendaItem.update(item.id, {
      notes: infoText,
      tournament_matches: wedstrijden,
    });
    await qc.invalidateQueries({ queryKey: ["agenda-item", itemId] });
    setEditingInfo(false);
    toast({ description: "Opgeslagen", style: { background: "#4ade80", color: "white", border: "none" } });
  }

  function addWedstrijd() {
    if (!newWedstrijd.opponent) return;
    setWedstrijden(prev => [...prev, { ...newWedstrijd, id: Date.now().toString() }]);
    setNewWedstrijd({ opponent: "", time: "", result: "" });
    setAddingWedstrijd(false);
  }

  function removeWedstrijd(id) {
    setWedstrijden(prev => prev.filter(w => w.id !== id));
  }

  if (isLoading || !item) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const accentColor = "#FF6800";
  const dateLabel = item.end_date && item.end_date !== item.date
    ? `${formatDate(item.date)} – ${formatDate(item.end_date)}`
    : formatDate(item.date);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", paddingBottom: "150px", minHeight: "100vh", background: "#FFF3E8", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box" }}>

      {/* Back + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/Planning"
          style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", textDecoration: "none" }}>
          <ChevronLeft size={18} color="#1a1a1a" />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: accentColor, marginBottom: 2 }}>Toernooi</p>
          <h1 className="t-page-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h1>
        </div>
        {isTrainer && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowEdit(true)}
              style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer" }}>
              <Pencil size={16} color="#1a1a1a" />
            </button>
            <button onClick={handleDelete}
              style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,61,168,0.10)", border: "2.5px solid #FF3DA8", cursor: "pointer" }}>
              <Trash2 size={16} color="#FF3DA8" />
            </button>
          </div>
        )}
      </div>

      {/* Hero card */}
      <div style={{ background: accentColor, border: "2.5px solid #1a1a1a", borderRadius: 22, boxShadow: "3px 3px 0 #1a1a1a", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Trophy size={14} color="#1a1a1a" />
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "#1a1a1a" }}>{item.team}</span>
              {item.home_away && item.home_away !== "Thuis" && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 20, background: "rgba(26,26,26,0.18)", color: "#1a1a1a", border: "1px solid rgba(26,26,26,0.20)" }}>
                  {item.home_away}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Clock size={12} color="rgba(26,26,26,0.55)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,26,26,0.70)" }}>
                {dateLabel}{item.start_time ? ` · ${item.start_time}` : ""}
              </span>
            </div>
            {item.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={12} color="rgba(26,26,26,0.55)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,26,26,0.70)" }}>{item.location}</span>
              </div>
            )}
          </div>
          {item.opponent_logo_url && (
            <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(26,26,26,0.25)", flexShrink: 0 }}>
              <img src={item.opponent_logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>

        {/* Aanwezigheid samenvatting */}
        <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
          {[
            { label: "Aanwezig", count: aanwezigList.length, color: "#08D068" },
            { label: "Afwezig", count: afwezigList.length, color: "#FF3DA8" },
            { label: "Onbekend", count: nognietList.length, color: "rgba(26,26,26,0.40)" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ flex: 1, background: "rgba(26,26,26,0.12)", borderRadius: 12, padding: "8px 6px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1px" }}>{count}</p>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(26,26,26,0.60)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* RSVP voor speler */}
        {!isTrainer && myPlayer && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(26,26,26,0.60)", marginBottom: 8 }}>Ga jij mee?</p>
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
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "14px", boxShadow: "2px 2px 0 #1a1a1a", overflow: "hidden" }}>
        {[
          { label: "Aanwezigheid", icon: <Users size={13} /> },
          { label: "Info & Programma", icon: <Info size={13} /> },
        ].map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{
              flex: 1, padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: "12px", fontWeight: 800,
              background: activeTab === i ? "#FF6800" : "transparent",
              color: activeTab === i ? "#ffffff" : "rgba(26,26,26,0.50)",
              border: "none", cursor: "pointer",
            }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Aanwezigheid */}
      {activeTab === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Aanwezig */}
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#08D068" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>Aanwezig ({aanwezigList.length})</span>
            </div>
            {aanwezigList.length === 0
              ? <p style={{ padding: "14px 16px", fontSize: 13, color: "rgba(26,26,26,0.40)" }}>Nog niemand aangemeld</p>
              : aanwezigList.map(({ player }, i) => (
                <PlayerRow key={player.id} player={player} last={i === aanwezigList.length - 1} />
              ))}
          </div>

          {/* Afwezig */}
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF3DA8" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>Afwezig ({afwezigList.length})</span>
            </div>
            {afwezigList.length === 0
              ? <p style={{ padding: "14px 16px", fontSize: 13, color: "rgba(26,26,26,0.40)" }}>Niemand afgemeld</p>
              : afwezigList.map(({ player, record }, i) => (
                <PlayerRow key={player.id} player={player} note={isTrainer ? record.notes : null} last={i === afwezigList.length - 1} />
              ))}
          </div>

          {/* Nog niet gereageerd */}
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFD600", border: "1.5px solid #1a1a1a" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>Nog niet gereageerd ({nognietList.length})</span>
            </div>
            {nognietList.length === 0
              ? <p style={{ padding: "14px 16px", fontSize: 13, color: "rgba(26,26,26,0.40)" }}>Iedereen heeft gereageerd 🎉</p>
              : nognietList.map((player, i) => (
                <PlayerRow key={player.id} player={player} last={i === nognietList.length - 1} />
              ))}
            {isTrainer && nognietList.length > 0 && (
              <div style={{ padding: "10px 12px", borderTop: "1.5px solid rgba(26,26,26,0.08)" }}>
                <button onClick={() => sendReminder.mutate()} disabled={sendReminder.isPending || reminderSent}
                  style={{ width: "100%", height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, border: "2px solid #1a1a1a", background: reminderSent ? "#08D068" : "#ffffff", color: "#1a1a1a", fontSize: 12, fontWeight: 800, cursor: reminderSent ? "default" : "pointer", boxShadow: "2px 2px 0 #1a1a1a" }}>
                  <Bell size={13} />
                  {reminderSent ? "Verstuurd!" : sendReminder.isPending ? "Versturen..." : `Stuur herinnering (${nognietList.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Info & Programma */}
      {activeTab === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Wedstrijden sectie */}
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={15} color="#FF6800" />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>Wedstrijden</span>
              </div>
              {isTrainer && !addingWedstrijd && (
                <button onClick={() => setAddingWedstrijd(true)}
                  style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#FF6800", border: "2px solid #1a1a1a", boxShadow: "1px 1px 0 #1a1a1a", cursor: "pointer" }}>
                  <Plus size={14} color="#fff" />
                </button>
              )}
            </div>

            {/* Wedstrijd toevoegen */}
            {isTrainer && addingWedstrijd && (
              <div style={{ padding: "12px 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,104,0,0.04)" }}>
                <input
                  placeholder="Tegenstander *"
                  value={newWedstrijd.opponent}
                  onChange={e => setNewWedstrijd(p => ({ ...p, opponent: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "2px solid #1a1a1a", fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="Tijd (bijv. 10:00)"
                    value={newWedstrijd.time}
                    onChange={e => setNewWedstrijd(p => ({ ...p, time: e.target.value }))}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "2px solid rgba(26,26,26,0.20)", fontSize: 13, fontWeight: 600, outline: "none" }}
                  />
                  <input
                    placeholder="Uitslag (bijv. 2-1)"
                    value={newWedstrijd.result}
                    onChange={e => setNewWedstrijd(p => ({ ...p, result: e.target.value }))}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "2px solid rgba(26,26,26,0.20)", fontSize: 13, fontWeight: 600, outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addWedstrijd}
                    style={{ flex: 1, height: 36, borderRadius: 10, background: "#1a1a1a", color: "#fff", fontSize: 12, fontWeight: 800, border: "2px solid #1a1a1a", cursor: "pointer" }}>
                    Toevoegen
                  </button>
                  <button onClick={() => { setAddingWedstrijd(false); setNewWedstrijd({ opponent: "", time: "", result: "" }); }}
                    style={{ height: 36, width: 36, borderRadius: 10, background: "#ffffff", border: "2px solid rgba(26,26,26,0.20)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={14} color="rgba(26,26,26,0.50)" />
                  </button>
                </div>
              </div>
            )}

            {/* Wedstrijdenlijst */}
            {(item.tournament_matches || wedstrijden).length === 0 && !addingWedstrijd && (
              <p style={{ padding: "16px", fontSize: 13, color: "rgba(26,26,26,0.40)", textAlign: "center" }}>
                {isTrainer ? "Voeg wedstrijden toe via de + knop" : "Nog geen wedstrijden ingepland"}
              </p>
            )}
            {(editingInfo ? wedstrijden : (item.tournament_matches || [])).map((w, i, arr) => (
              <div key={w.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1.5px solid rgba(26,26,26,0.08)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>vs. {w.opponent}</p>
                  {w.time && <p style={{ fontSize: 11, color: "rgba(26,26,26,0.45)", margin: 0 }}>{w.time}</p>}
                </div>
                {w.result && (
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.5px", background: "rgba(26,26,26,0.06)", padding: "4px 10px", borderRadius: 8, border: "1.5px solid rgba(26,26,26,0.12)" }}>
                    {w.result}
                  </span>
                )}
                {isTrainer && editingInfo && (
                  <button onClick={() => removeWedstrijd(w.id || i.toString())}
                    style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,61,168,0.10)", border: "1.5px solid #FF3DA8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <X size={12} color="#FF3DA8" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Extra info / notities */}
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Info size={15} color="#FF6800" />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>Informatie</span>
              </div>
              {isTrainer && !editingInfo && (
                <button onClick={() => { setEditingInfo(true); setInfoText(item.notes || ""); setWedstrijden(item.tournament_matches || []); }}
                  style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "1px 1px 0 #1a1a1a", cursor: "pointer" }}>
                  <Pencil size={13} color="#1a1a1a" />
                </button>
              )}
            </div>
            <div style={{ padding: "14px 16px" }}>
              {editingInfo ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea
                    value={infoText}
                    onChange={e => setInfoText(e.target.value)}
                    placeholder="Toernooi informatie, aanwijzingen, locatie details..."
                    rows={5}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "2px solid #1a1a1a", fontSize: 13, fontWeight: 500, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveInfo}
                      style={{ flex: 1, height: 40, borderRadius: 12, background: "#1a1a1a", color: "#fff", fontSize: 12, fontWeight: 800, border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Check size={13} /> Opslaan
                    </button>
                    <button onClick={() => setEditingInfo(false)}
                      style={{ height: 40, padding: "0 16px", borderRadius: 12, background: "#ffffff", border: "2px solid rgba(26,26,26,0.20)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                item.notes
                  ? <p style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.notes}</p>
                  : <p style={{ fontSize: 13, color: "rgba(26,26,26,0.40)" }}>{isTrainer ? "Klik op bewerken om informatie toe te voegen" : "Nog geen extra informatie"}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
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

function PlayerRow({ player, note, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: last ? "none" : "1.5px solid rgba(26,26,26,0.08)" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,104,0,0.10)", border: "1.5px solid #1a1a1a" }}>
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, fontWeight: 800, color: "#FF6800" }}>{player.name?.charAt(0)}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{player.name}</p>
        {note && <p style={{ fontSize: 11, color: "#FF3DA8", margin: 0 }}>{note}</p>}
      </div>
    </div>
  );
}