import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG, TEAM_MATCH_COLORS, formatDate } from "./agendaUtils";
import { MapPin, Clock, Pencil, Trash2, Bell } from "lucide-react";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";

const TABS = ["Aanwezig", "Afwezig", "Nog niet gereageerd"];

export default function AgendaDetailModal({ item, isTrainer, onEdit, onDelete, onClose }) {
  const isWedstrijd = item.type === "Wedstrijd" || item.type === "Toernooi";
  const teamMatch = TEAM_MATCH_COLORS[item.team] || TEAM_MATCH_COLORS["Beide"];
  const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
  const headerBg = isWedstrijd ? teamMatch.cardBg : typeCfg.bg;
  const headerTextDark = headerBg === "#FF3DA8" ? "#ffffff" : "#1a1a1a";
  const headerTextMuted = headerBg === "#FF3DA8" ? "rgba(255,255,255,0.70)" : "rgba(26,26,26,0.55)";

  const [activeTab, setActiveTab] = useState(0);
  const [reminderSent, setReminderSent] = useState(false);
  const qc = useQueryClient();

  const { data: attendance = [] } = useQuery({
    queryKey: ["agenda-attendance", item.id],
    queryFn: () => base44.entities.AgendaAttendance.filter({ agenda_item_id: item.id }),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players-agenda"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });
  const myPlayer = currentUser ? players.find(p => p.name === currentUser.full_name) : null;
  const myAttendance = myPlayer ? attendance.find(a => a.player_id === myPlayer.id) : null;

  const [absentReason, setAbsentReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);

  const rsvpMutation = useMutation({
    mutationFn: async ({ status, reason }) => {
      if (myAttendance) {
        await base44.entities.AgendaAttendance.update(myAttendance.id, { status, notes: reason || myAttendance.notes });
      } else if (myPlayer) {
        await base44.entities.AgendaAttendance.create({ agenda_item_id: item.id, player_id: myPlayer.id, status, notes: reason || "" });
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
      qc.invalidateQueries({ queryKey: ["agenda-attendance", item.id] });
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
  const counts = [aanwezigList.length, afwezigList.length, nognietList.length];

  const sendReminder = useMutation({
    mutationFn: async () => {
      const dateStr = new Date(item.date + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      for (const player of nognietList) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.50)" }}
      onClick={onClose}>
      <div className="w-full md:max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "22px 22px 0 0", boxShadow: "0 -4px 0 #1a1a1a", ...(window.innerWidth >= 768 ? { borderRadius: "22px", boxShadow: "4px 4px 0 #1a1a1a" } : {}) }}
        onClick={e => e.stopPropagation()}>

        {/* Colored header */}
        <div style={{ background: headerBg, padding: "20px 20px 16px", borderBottom: "2.5px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: headerBg === "#FF3DA8" ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.55)", marginBottom: 4 }}>{item.type}</p>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: headerTextDark, lineHeight: 1.2 }}>{item.title}</h2>
            </div>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(26,26,26,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 16, color: headerTextDark, fontWeight: 700 }}>✕</span>
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={12} style={{ color: headerTextMuted }} />
              <span style={{ fontSize: 12, color: headerTextMuted, fontWeight: 600 }}>{formatDate(item.date)} · {item.start_time}</span>
            </div>
            {item.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={12} style={{ color: headerTextMuted }} />
                <span style={{ fontSize: 12, color: headerTextMuted, fontWeight: 600 }}>{item.location}</span>
              </div>
            )}
            <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(26,26,26,0.18)", color: headerTextDark, border: "1px solid rgba(26,26,26,0.20)" }}>
              {item.team}
            </span>
          </div>
          {item.notes && (
            <p style={{ fontSize: 12, color: headerTextMuted, marginTop: 10, padding: "8px 12px", background: "rgba(26,26,26,0.10)", borderRadius: 10 }}>{item.notes}</p>
          )}

          {/* RSVP voor speler */}
          {!isTrainer && myPlayer && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: headerTextMuted, marginBottom: 8 }}>Jouw aanwezigheid:</p>
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
        <div style={{ display: "flex", padding: "0 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", background: "#ffffff" }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              style={{
                flex: 1, padding: "12px 4px", fontSize: "11px", fontWeight: 800, cursor: "pointer",
                background: "transparent", border: "none",
                borderBottom: activeTab === i ? "3px solid #FF6800" : "3px solid transparent",
                color: activeTab === i ? "#FF6800" : "rgba(26,26,26,0.40)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
              {tab}
              <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10, background: activeTab === i ? "#FF6800" : "rgba(26,26,26,0.08)", color: activeTab === i ? "#ffffff" : "rgba(26,26,26,0.40)" }}>
                {counts[i]}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {/* Spelers: samenvatting na RSVP */}
          {!isTrainer && (
            <div style={{ marginBottom: 16 }}>
              {myAttendance ? (
                <div>
                  <p style={{ fontSize: 11, color: "rgba(26,26,26,0.55)", marginBottom: 10 }}>
                    <span style={{ color: "#05a050", fontWeight: 700 }}>{aanwezigList.length} aanwezig</span>
                    {" · "}
                    <span style={{ color: "#FF3DA8", fontWeight: 700 }}>{afwezigList.length} afwezig</span>
                    {" · "}
                    <span style={{ color: "rgba(26,26,26,0.40)", fontWeight: 700 }}>{nognietList.length} nog onbekend</span>
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 800, color: "#05a050", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>✓ Aanwezig ({aanwezigList.length})</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {aanwezigList.map(({ player }) => <PlayerAvatarName key={player.id} player={player} />)}
                        {aanwezigList.length === 0 && <p style={{ fontSize: 11, color: "rgba(26,26,26,0.35)" }}>Niemand</p>}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 800, color: "#FF3DA8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>✗ Afwezig ({afwezigList.length})</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {afwezigList.map(({ player }) => <PlayerAvatarName key={player.id} player={player} />)}
                        {afwezigList.length === 0 && <p style={{ fontSize: 11, color: "rgba(26,26,26,0.35)" }}>Niemand</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "16px", borderRadius: 14, textAlign: "center", background: "rgba(26,26,26,0.04)", border: "1.5px solid rgba(26,26,26,0.08)" }}>
                  <p style={{ fontSize: 13, color: "rgba(26,26,26,0.50)" }}>Geef eerst je aanwezigheid door om te zien wie er komt.</p>
                </div>
              )}
              <div style={{ height: 1, background: "rgba(26,26,26,0.08)", margin: "14px 0" }} />
            </div>
          )}

          {activeTab === 0 && <PlayerList items={aanwezigList} dotColor="#05a050" emptyMsg="Nog niemand bevestigd" isTrainer={isTrainer} />}
          {activeTab === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {afwezigList.length === 0 && <p style={{ fontSize: 13, color: "rgba(26,26,26,0.50)" }}>Niemand afgemeld</p>}
              {afwezigList.map(({ player, record }) => (
                <div key={player.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "rgba(255,61,168,0.06)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 12 }}>
                  <PlayerAvatar player={player} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{player.name}</p>
                    {isTrainer && record.notes && <p style={{ fontSize: 11, color: "#FF3DA8", marginTop: 2 }}>{record.notes}</p>}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF3DA8", flexShrink: 0, marginTop: 4 }} />
                </div>
              ))}
            </div>
          )}
          {activeTab === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nognietList.length === 0 && <p style={{ fontSize: 13, color: "rgba(26,26,26,0.50)" }}>Iedereen heeft gereageerd 🎉</p>}
              {nognietList.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(26,26,26,0.03)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 12 }}>
                  <PlayerAvatar player={p} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{p.name}</p>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFD600", border: "1.5px solid #1a1a1a", flexShrink: 0 }} />
                </div>
              ))}
              {isTrainer && nognietList.length > 0 && (
                <button onClick={() => sendReminder.mutate()} disabled={sendReminder.isPending || reminderSent}
                  style={{ marginTop: 8, width: "100%", height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, border: "2px solid #1a1a1a", background: reminderSent ? "#08D068" : "#ffffff", color: "#1a1a1a", fontSize: 13, fontWeight: 800, cursor: reminderSent ? "default" : "pointer", boxShadow: "2px 2px 0 #1a1a1a" }}>
                  <Bell size={14} />
                  {reminderSent ? "Verstuurd!" : sendReminder.isPending ? "Versturen..." : `Stuur herinnering (${nognietList.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Trainer acties */}
        {isTrainer && (
          <div style={{ padding: "12px 16px 16px", display: "flex", gap: 10, borderTop: "2px solid rgba(26,26,26,0.08)", background: "#ffffff" }}>
            <button onClick={onEdit}
              style={{ flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, border: "2.5px solid #1a1a1a", background: "#ffffff", color: "#1a1a1a", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "2px 2px 0 #1a1a1a" }}>
              <Pencil size={14} /> Bewerken
            </button>
            <button onClick={onDelete}
              style={{ flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, border: "2.5px solid #FF3DA8", background: "rgba(255,61,168,0.08)", color: "#FF3DA8", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              <Trash2 size={14} /> Verwijderen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerAvatar({ player }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(255,104,0,0.12)", border: "1.5px solid #1a1a1a" }}>
      {player.photo_url
        ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 12, fontWeight: 800, color: "#FF6800" }}>{player.name.charAt(0)}</span>
      }
    </div>
  );
}

function PlayerAvatarName({ player }) {
  const firstName = player.name?.split(" ")[0] || player.name;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <PlayerAvatar player={player} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{firstName}</span>
    </div>
  );
}

function PlayerList({ items, dotColor, emptyMsg, isTrainer }) {
  if (!items.length) return <p style={{ fontSize: 13, color: "rgba(26,26,26,0.50)" }}>{emptyMsg}</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(({ player }) => (
        <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(26,26,26,0.03)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 12 }}>
          <PlayerAvatar player={player} />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{player.name}</p>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}