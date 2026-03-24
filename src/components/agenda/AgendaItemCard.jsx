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
    <button onClick={onClick}
      style={{ width: "100%", textAlign: "left", display: "flex", gap: "12px", padding: "14px", background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s" }}
      onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a"; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a"; }}
    >
      {/* Color strip */}
      <div style={{ width: "4px", borderRadius: "3px", flexShrink: 0, alignSelf: "stretch", background: cfg.color, border: "1px solid #1a1a1a" }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: cfg.color, marginBottom: "3px" }}>{item.type}</p>
            <p style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3 }}>{item.title}</p>
          </div>
          <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: "#1a1a1a", color: "#ffffff", border: "1.5px solid #1a1a1a" }}>
            {item.team}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Clock size={12} style={{ color: "rgba(26,26,26,0.40)" }} />
            <span style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", fontWeight: 600 }}>{formatDate(item.date)} · {item.start_time}</span>
          </div>
          {item.location && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <MapPin size={12} style={{ color: "rgba(26,26,26,0.40)" }} />
              <span style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", fontWeight: 600 }}>{item.location}</span>
            </div>
          )}
        </div>

        {playerCount > 0 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#05a050" }}>{aanwezig} aanwezig</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF3DA8" }}>{afwezig} afwezig</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.40)" }}>{onbekend} onbekend</span>
          </div>
        )}
      </div>
    </button>
  );
}