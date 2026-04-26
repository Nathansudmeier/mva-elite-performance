import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarBlank, Clock, MapPin } from "@phosphor-icons/react";

const CLUB_LOGO = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/a8e346859_MVAartemis.png";

function formatDatum(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["zo", "ma", "di", "wo", "do", "vr", "za"];
  const months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function InfoItem({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {icon}
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{text}</span>
    </div>
  );
}

function WedstrijdKaart({ w, compact = false }) {
  const titelSize = compact ? "36px" : "clamp(48px, 8vw, 80px)";
  const padding = compact ? "24px" : "40px 40px";
  const minHeight = compact ? "280px" : "100%";
  const teamNaamSize = compact ? "18px" : "24px";

  const bg = w.achtergrond_url
    ? { backgroundImage: `url('${w.achtergrond_url}')`, backgroundSize: "cover", backgroundPosition: "center top" }
    : { background: "linear-gradient(135deg, #1B2A5E 0%, #0F1630 50%, #FF6800 200%)" };

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight, height: "100%", ...bg }}>
      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,9,13,0.95) 0%, rgba(8,9,13,0.7) 40%, rgba(8,9,13,0.2) 70%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,9,13,0.9) 0%, transparent 50%)" }} />

      {/* UITGELICHT badge */}
      <div style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,104,0,0.15)", border: "1px solid rgba(255,104,0,0.4)", color: "#FF6800", fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "5px 10px", borderRadius: "3px", fontFamily: "'Space Grotesk', sans-serif" }}>
        Uitgelicht
      </div>

      {/* Content */}
      <div style={{ position: "absolute", left: 0, bottom: 0, padding, maxWidth: "560px", width: "100%", boxSizing: "border-box" }}>
        {/* Team badge */}
        <div style={{ background: "#FF6800", color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "4px 10px", borderRadius: "3px", display: "inline-block", marginBottom: "14px" }}>
          {w.team}
        </div>

        {/* Titel */}
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: titelSize, color: "#FFFFFF", lineHeight: 0.88, marginBottom: "16px", textTransform: "uppercase" }}>
          {w.titel}
        </div>

        {/* Info rij */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "20px", flexDirection: compact ? "column" : "row" }}>
          <InfoItem icon={<CalendarBlank weight="bold" size={14} color="rgba(255,255,255,0.5)" />} text={formatDatum(w.datum)} />
          <InfoItem icon={<Clock weight="bold" size={14} color="rgba(255,255,255,0.5)" />} text={w.tijdstip} />
          <InfoItem icon={<MapPin weight="bold" size={14} color="rgba(255,255,255,0.5)" />} text={w.locatie} />
        </div>

        {/* Teams rij */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={CLUB_LOGO} alt="MV Artemis" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: teamNaamSize, color: "#fff" }}>MV Artemis</span>
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "20px", color: "#FF6800", opacity: 0.8 }}>VS</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {w.tegenstander_logo_url && (
              <img src={w.tegenstander_logo_url} alt={w.tegenstander} style={{ width: "32px", height: "32px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.7)" }} />
            )}
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: teamNaamSize, color: "rgba(255,255,255,0.7)" }}>{w.tegenstander}</span>
          </div>
        </div>

        {/* Subtitel */}
        {w.subtitel && (
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "8px", fontStyle: "italic" }}>
            {w.subtitel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UitgelichtSection() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    base44.entities.UitgelichtWedstrijd.list().then(list => {
      const today = new Date().toISOString().split("T")[0];
      const filtered = (list || [])
        .filter(w => w.actief !== false && w.datum && w.datum >= today)
        .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
      setItems(filtered);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  if (!loaded || items.length === 0) return null;

  if (items.length === 1) {
    return (
      <section style={{ background: "#08090D", padding: 0, overflow: "hidden" }}>
        <style>{`
          .uitgelicht-hero { height: 480px; }
          @media (max-width: 767px) { .uitgelicht-hero { height: 360px; } }
        `}</style>
        <div className="uitgelicht-hero">
          <WedstrijdKaart w={items[0]} />
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: "#08090D", padding: 0, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1px", background: "#08090D" }}>
        {items.map(w => (
          <div key={w.id} style={{ height: "280px", background: "#08090D" }}>
            <WedstrijdKaart w={w} compact />
          </div>
        ))}
      </div>
    </section>
  );
}