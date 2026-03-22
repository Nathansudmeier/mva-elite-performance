import React from "react";
import { MapPin, Clock } from "lucide-react";
import { TYPE_CONFIG, TEAM_COLORS, formatDate } from "./agendaUtils";

export default function AgendaItemCard({ item, attendance = [], playerCount = 0, onClick }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
  const teamCfg = TEAM_COLORS[item.team] || TEAM_COLORS["Beide"];

  const aanwezig = attendance.filter(a => a.status === "aanwezig").length;
  const afwezig = attendance.filter(a => a.status === "afwezig").length;
  const onbekend = playerCount - aanwezig - afwezig;

  return (
    <button onClick={onClick} className="w-full text-left flex gap-3 p-4 rounded-2xl transition-all hover:brightness-110"
      style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      {/* Color strip */}
      <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: cfg.color }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="t-label mb-0.5" style={{ color: cfg.color }}>{item.type}</p>
            <p className="t-card-title">{item.title}</p>
          </div>
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: teamCfg.bg, color: teamCfg.color }}>
            {item.team}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mt-2">
          <div className="flex items-center gap-1.5 t-secondary">
            <Clock size={12} className="ic-muted" />
            <span>{formatDate(item.date)} · {item.start_time}</span>
          </div>
          {item.location && (
            <div className="flex items-center gap-1.5 t-secondary">
              <MapPin size={12} className="ic-muted" />
              <span>{item.location}</span>
            </div>
          )}
        </div>

        {playerCount > 0 && (
          <div className="flex gap-3 mt-2">
            <span className="t-secondary-sm" style={{ color: "#4ade80" }}>{aanwezig} aanwezig</span>
            <span className="t-secondary-sm" style={{ color: "#f87171" }}>{afwezig} afwezig</span>
            <span className="t-secondary-sm" style={{ color: "#fbbf24" }}>{onbekend} onbekend</span>
          </div>
        )}
      </div>
    </button>
  );
}