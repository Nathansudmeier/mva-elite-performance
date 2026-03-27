import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";

const EMVI_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/099f1a751_Emvi-letop.png";

const TYPE_CONFIG = {
  Annulering: { bg: "#FF3DA8", icon: "⚠️", darkText: false },
  Info:       { bg: "#00C2FF", icon: "📋", darkText: true  },
  Evenement:  { bg: "#FFD600", icon: "🎉", darkText: true  },
  Urgent:     { bg: "#FF3DA8", icon: "🚨", darkText: false },
};

function formatTime(date) {
  return new Date(date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function UrgenteBanners() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_banners");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const { data: mededelingen = [] } = useQuery({
    queryKey: ["mededelingen-urgent"],
    queryFn: () => base44.entities.Mededeling.filter({ is_urgent: true }),
    staleTime: 60000,
  });

  const now = new Date();
  const active = mededelingen
    .filter(m => !dismissed.includes(m.id))
    .filter(m => !m.expires_at || new Date(m.expires_at) >= now)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const visible = active.slice(0, 2);
  const hasMore = active.length > 2;

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { sessionStorage.setItem("dismissed_banners", JSON.stringify(next)); } catch {}
  };

  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "4px" }}>
      {visible.map(m => {
        const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.Info;
        const textColor = cfg.darkText ? "#1a1a1a" : "#ffffff";
        const subColor = cfg.darkText ? "rgba(26,26,26,0.55)" : "rgba(255,255,255,0.70)";
        const labelColor = cfg.darkText ? "rgba(26,26,26,0.55)" : "rgba(255,255,255,0.65)";
        const isAnnulering = m.type === "Annulering";

        return (
          <div key={m.id} style={{ position: "relative" }}>
            <Link
              to="/Prikbord"
              style={{
                display: "block",
                background: cfg.bg,
                border: "2.5px solid #1a1a1a",
                borderRadius: "18px",
                boxShadow: "3px 3px 0 #1a1a1a",
                padding: "1rem 1.25rem",
                paddingRight: isAnnulering ? "160px" : "44px",
                textDecoration: "none",
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
                minHeight: isAnnulering ? "110px" : "auto",
              }}
            >
              {/* Content */}
              <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: labelColor }}>{m.type}</p>
              <p style={{ fontSize: "15px", fontWeight: 900, color: textColor, letterSpacing: "-0.3px", lineHeight: 1.2, marginTop: "2px" }}>{m.title}</p>
              <p style={{
                fontSize: "11px", color: subColor, fontWeight: 600, marginTop: "4px",
                lineHeight: 1.4,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{m.body}</p>
              <p style={{ fontSize: "10px", color: subColor, opacity: 0.8, marginTop: "6px" }}>
                {m.author_name} · {formatTime(m.created_date)}
              </p>

              {/* Emvi voor Annulering */}
              {isAnnulering && (
                <img
                  src={EMVI_URL}
                  alt="Emvi"
                  style={{
                    position: "absolute", right: "0px", bottom: "0",
                    height: "140px", width: "auto",
                    objectFit: "contain",
                    pointerEvents: "none",
                  }}
                />
              )}
            </Link>

            {/* Dismiss */}
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(m.id); }}
              style={{
                position: "absolute", top: "10px", right: "10px",
                width: "28px", height: "28px", borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                border: "1.5px solid rgba(255,255,255,0.50)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", color: textColor, cursor: "pointer", zIndex: 2,
              }}
            >✕</button>
          </div>
        );
      })}

      {hasMore && (
        <Link to="/Prikbord" style={{ fontSize: "11px", fontWeight: 700, color: "#FF6800", textDecoration: "none", paddingLeft: "4px" }}>
          + {active.length - 2} meer mededelingen →
        </Link>
      )}
    </div>
  );
}