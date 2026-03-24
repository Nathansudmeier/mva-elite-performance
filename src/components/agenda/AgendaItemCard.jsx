import React from "react";
import { MapPin, Clock } from "lucide-react";
import { TYPE_CONFIG, TEAM_MATCH_COLORS, formatDate } from "./agendaUtils";

export default function AgendaItemCard({ item, attendance = [], playerCount = 0, onClick }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
  const isWedstrijd = item.type === "Wedstrijd" || item.type === "Toernooi";
  const teamMatch = TEAM_MATCH_COLORS[item.team] || TEAM_MATCH_COLORS["Beide"];

  // Wedstrijd → teamkleur (blauw MO17 / roze Dames 1), Training → groen, rest → type kleur
  const cardBg = isWedstrijd ? teamMatch.cardBg : cfg.bg;
  const textDark = cardBg === "#FF3DA8" ? "#ffffff" : "#1a1a1a";
  const textMuted = cardBg === "#FF3DA8" ? "rgba(255,255,255,0.70)" : "rgba(26,26,26,0.55)";

  const aanwezig = attendance.filter(a => a.status === "aanwezig").length;
  const afwezig = attendance.filter(a => a.status === "afwezig").length;
  const onbekend = playerCount - aanwezig - afwezig;

  return (
    <button onClick={onClick}
      style={{ width: "100%", textAlign: "left", display: "flex", gap: "12px", padding: "14px", background: cardBg, border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s" }}
      onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a"; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a"; }}
    >
      {/* Color strip */}
      <div style={{ width: "4px", borderRadius: "3px", flexShrink: 0, alignSelf: "stretch", background: "rgba(26,26,26,0.25)", border: "1px solid rgba(26,26,26,0.20)" }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: "3px" }}>{item.type}</p>
            <p style={{ fontSize: "15px", fontWeight: 800, color: textDark, lineHeight: 1.3 }}>{item.title}</p>
          </div>
          <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: "rgba(26,26,26,0.18)", color: textDark, border: "1.5px solid rgba(26,26,26,0.25)" }}>
            {item.team}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Clock size={12} style={{ color: textMuted }} />
            <span style={{ fontSize: "12px", color: textMuted, fontWeight: 600 }}>{formatDate(item.date)} · {item.start_time}</span>
          </div>
          {item.location && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <MapPin size={12} style={{ color: textMuted }} />
              <span style={{ fontSize: "12px", color: textMuted, fontWeight: 600 }}>{item.location}</span>
            </div>
          )}
        </div>

        {playerCount > 0 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: textDark }}>{aanwezig} ✓ aanwezig</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: textDark, opacity: 0.7 }}>{afwezig} ✗ afwezig</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: textMuted }}>{onbekend} onbekend</span>
          </div>
        )}
      </div>
    </button>
  );
}