import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG, TEAM_COLORS, formatDate } from "./agendaUtils";
import { MapPin, Clock, Users, Pencil, Trash2 } from "lucide-react";

export default function AgendaDetailModal({ item, isTrainer, onEdit, onDelete, onClose }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
  const teamCfg = TEAM_COLORS[item.team] || TEAM_COLORS["Beide"];

  const { data: attendance = [] } = useQuery({
    queryKey: ["agenda-attendance", item.id],
    queryFn: () => base44.entities.AgendaAttendance.filter({ agenda_item_id: item.id }),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players-agenda"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const aanwezig = attendance.filter(a => a.status === "aanwezig").length;
  const afwezig = attendance.filter(a => a.status === "afwezig").length;
  const onbekend = players.length - aanwezig - afwezig;

  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p; });

  const byStatus = (status) => attendance
    .filter(a => a.status === status)
    .map(a => playerMap[a.player_id])
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full md:max-w-lg glass-dark rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header gekleurde balk */}
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
        </div>

        {/* Aanwezigheid samenvatting */}
        <div className="px-6 py-4 flex gap-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="dot-green" />
            <span className="t-secondary">{aanwezig} aanwezig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="dot-red" />
            <span className="t-secondary">{afwezig} afwezig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="dot-yellow" />
            <span className="t-secondary">{onbekend} onbekend</span>
          </div>
        </div>

        {/* Spelerslijst */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {[{ label: "Aanwezig", status: "aanwezig", dot: "dot-green" }, { label: "Afwezig", status: "afwezig", dot: "dot-red" }].map(({ label, status, dot }) => {
            const list = byStatus(status);
            if (!list.length) return null;
            return (
              <div key={status}>
                <p className="t-label mb-2">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                      <div className={dot} style={{ width: 6, height: 6 }} />
                      <span className="t-secondary-sm">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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