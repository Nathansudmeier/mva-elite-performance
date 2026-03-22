import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG, TEAM_COLORS, formatDate } from "./agendaUtils";
import { MapPin, Clock, Pencil, Trash2, Bell, Check, X } from "lucide-react";

const TABS = ["Aanwezig", "Afwezig", "Nog niet gereageerd"];

export default function AgendaDetailModal({ item, isTrainer, onEdit, onDelete, onClose }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
  const teamCfg = TEAM_COLORS[item.team] || TEAM_COLORS["Beide"];
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

  // Current user & their attendance record
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });
  const myPlayer = currentUser ? players.find(p => p.name === currentUser.full_name) : null;
  const myAttendance = myPlayer ? attendance.find(a => a.player_id === myPlayer.id) : null;

  const rsvpMutation = useMutation({
    mutationFn: async (status) => {
      if (myAttendance) {
        await base44.entities.AgendaAttendance.update(myAttendance.id, { status });
      } else if (myPlayer) {
        await base44.entities.AgendaAttendance.create({ agenda_item_id: item.id, player_id: myPlayer.id, status });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-attendance", item.id] }),
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
      // Send email reminder to players who haven't responded
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full md:max-w-lg glass-dark rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: `0.5px solid ${cfg.color}30` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}80` }} />
              <div>
                <p className="t-label" style={{ color: cfg.color }}>{item.type}</p>
                <h2 className="t-section-title mt-0.5">{item.title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="t-secondary hover:text-white text-xl flex-shrink-0">✕</button>
          </div>
          <div className="mt-4 space-y-2">
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
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: teamCfg.bg, color: teamCfg.color }}>
              {item.team}
            </span>
          </div>
          {item.notes && (
            <p className="t-secondary mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>{item.notes}</p>
          )}

          {/* RSVP voor speler (niet-trainer) */}
          {!isTrainer && myPlayer && (
            <div className="mt-4 p-3 rounded-xl flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
              <p className="t-secondary text-sm font-semibold">Jouw aanwezigheid:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => rsvpMutation.mutate("aanwezig")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: myAttendance?.status === "aanwezig" ? "#4ade80" : "rgba(74,222,128,0.10)", color: myAttendance?.status === "aanwezig" ? "#fff" : "#4ade80", border: "0.5px solid rgba(74,222,128,0.30)" }}
                >
                  <Check size={13} /> Ik kom
                </button>
                <button
                  onClick={() => rsvpMutation.mutate("afwezig")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: myAttendance?.status === "afwezig" ? "#f87171" : "rgba(248,113,113,0.10)", color: myAttendance?.status === "afwezig" ? "#fff" : "#f87171", border: "0.5px solid rgba(248,113,113,0.30)" }}
                >
                  <X size={13} /> Ik kom niet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors"
              style={{
                color: activeTab === i ? "#fff" : "rgba(255,255,255,0.45)",
                borderBottom: activeTab === i ? "2px solid #FF6B00" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {tab}
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                background: activeTab === i ? "rgba(255,107,0,0.20)" : "rgba(255,255,255,0.08)",
                color: activeTab === i ? "#FF8C3A" : "rgba(255,255,255,0.40)",
              }}>{counts[i]}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 0 && (
            <PlayerList items={aanwezigList.map(x => ({ player: x.player }))} dotClass="dot-green" emptyMsg="Nog niemand bevestigd" />
          )}
          {activeTab === 1 && (
            <div className="space-y-2">
              {afwezigList.length === 0 && <p className="t-secondary">Niemand afgemeld</p>}
              {afwezigList.map(({ player, record }) => (
                <div key={player.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <PlayerAvatar player={player} />
                  <div className="flex-1 min-w-0">
                    <p className="t-card-title">{player.name}</p>
                    {record.notes && <p className="t-secondary mt-0.5 text-xs" style={{ color: "#f87171" }}>{record.notes}</p>}
                  </div>
                  <div className="dot-red mt-1.5 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
          {activeTab === 2 && (
            <div className="space-y-2">
              {nognietList.length === 0 && <p className="t-secondary">Iedereen heeft gereageerd 🎉</p>}
              {nognietList.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <PlayerAvatar player={p} />
                  <p className="t-card-title flex-1">{p.name}</p>
                  <div className="dot-yellow flex-shrink-0" />
                </div>
              ))}
              {isTrainer && nognietList.length > 0 && (
                <button
                  onClick={() => sendReminder.mutate()}
                  disabled={sendReminder.isPending || reminderSent}
                  className="w-full mt-3 flex items-center justify-center gap-2"
                  style={{
                    minHeight: 44,
                    background: reminderSent ? "rgba(74,222,128,0.10)" : "rgba(255,107,0,0.15)",
                    border: `0.5px solid ${reminderSent ? "rgba(74,222,128,0.25)" : "rgba(255,107,0,0.30)"}`,
                    color: reminderSent ? "#4ade80" : "#FF8C3A",
                    borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: reminderSent ? "default" : "pointer",
                  }}
                >
                  <Bell size={15} />
                  {reminderSent ? "Herinneringen verstuurd!" : sendReminder.isPending ? "Versturen..." : `Stuur herinnering (${nognietList.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Trainer acties */}
        {isTrainer && (
          <div className="px-6 py-4 flex gap-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
            <button onClick={onEdit} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <Pencil size={15} /> Bewerken
            </button>
            <button onClick={onDelete}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "0.5px solid rgba(248,113,113,0.25)" }}>
              <Trash2 size={15} /> Verwijderen
            </button>
          </div>
        )}
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
        : <span style={{ fontSize: 12, fontWeight: 700, color: "#FF8C3A" }}>{player.name.charAt(0)}</span>
      }
    </div>
  );
}

function PlayerList({ items, dotClass, emptyMsg }) {
  if (!items.length) return <p className="t-secondary">{emptyMsg}</p>;
  return (
    <div className="space-y-2">
      {items.map(({ player }) => (
        <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          <PlayerAvatar player={player} />
          <p className="t-card-title flex-1">{player.name}</p>
          <div className={dotClass} style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}