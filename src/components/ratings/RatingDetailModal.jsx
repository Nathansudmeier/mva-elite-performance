import React from "react";
import { X, Star } from "lucide-react";

export default function RatingDetailModal({ rating, onClose, player }) {
  if (!rating) return null;

  const technicalKeys = ["pass_kort", "pass_lang", "koppen", "scorend_vermogen", "duel_aanvallend", "duel_verdedigend", "balaanname"];
  const tacticalKeys = ["speelveld_groot", "omschakeling_balverlies", "speelveld_klein", "omschakeling_balbezit", "kijkgedrag"];
  const personalityKeys = ["winnaarsmentaliteit", "leergierig", "opkomst_trainingen", "komt_afspraken_na", "doorzetter"];
  const physicalRatingKeys = ["startsnelheid", "snelheid_lang", "postuur", "blessuregevoeligheid", "duelkracht", "motorische_vaardigheden"];

  const categoryLabels = {
    pass_kort: "Korte passen",
    pass_lang: "Lange passen",
    koppen: "Koppen",
    scorend_vermogen: "Scorend vermogen",
    duel_aanvallend: "Duel aanvallend",
    duel_verdedigend: "Duel verdedigend",
    balaanname: "Balaanname",
    speelveld_groot: "Speelveld groot",
    omschakeling_balverlies: "Omschakeling balverlies",
    speelveld_klein: "Speelveld klein",
    omschakeling_balbezit: "Omschakeling balbezit",
    kijkgedrag: "Kijkgedrag",
    winnaarsmentaliteit: "Winnaarsmentaliteit",
    leergierig: "Leergierig",
    opkomst_trainingen: "Opkomst trainingen",
    komt_afspraken_na: "Komt afspraken na",
    doorzetter: "Doorzetter",
    startsnelheid: "Startsnelheid",
    snelheid_lang: "Snelheid lang",
    postuur: "Postuur",
    blessuregevoeligheid: "Blessuregevoeligheid",
    duelkracht: "Duelkracht",
    motorische_vaardigheden: "Motorische vaardigheden",
  };

  const StarRating = ({ value }) => (
    <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          style={{
            fill: i < value ? "#FF6800" : "rgba(26,26,26,0.10)",
            color: i < value ? "#FF6800" : "rgba(26,26,26,0.10)",
          }}
        />
      ))}
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", marginLeft: "6px" }}>
        {value}/5
      </span>
    </div>
  );

  const renderCategory = (label, keys, color) => {
    const items = keys.map(key => ({
      key,
      label: categoryLabels[key] || key,
      value: rating[key] || 0,
    }));

    const avg = items.length ? (items.reduce((s, i) => s + i.value, 0) / items.length).toFixed(1) : "-";
    const pct = avg !== "-" ? (parseFloat(avg) / 5) * 100 : 0;

    return (
      <div key={label} style={{ background: "rgba(26,26,26,0.04)", borderRadius: "14px", padding: "14px", border: "1.5px solid rgba(26,26,26,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.55)", letterSpacing: "0.05em" }}>
            {label}
          </p>
          <p style={{ fontSize: "20px", fontWeight: 900, color }}>
            {avg}
          </p>
        </div>
        <div style={{ height: "3px", background: "rgba(26,26,26,0.10)", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.3s ease" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map(item => (
            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
              <span style={{ color: "rgba(26,26,26,0.65)" }}>{item.label}</span>
              <StarRating value={item.value} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 50,
    }} onClick={onClose}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "20px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.55)", letterSpacing: "0.05em", marginBottom: "4px" }}>
              Beoordeling Gedetailleerd
            </p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>
              {rating.meting} • {rating.date}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(26,26,26,0.08)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} color="#1a1a1a" />
          </button>
        </div>

        {/* Overall Score Card */}
        <div style={{
          background: "linear-gradient(135deg, #FF6800 0%, #FF8C00 100%)",
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: "4px" }}>Totale Beoordeling</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                {(() => {
                  const allKeys = [...technicalKeys, ...tacticalKeys, ...personalityKeys, ...physicalRatingKeys];
                  const vals = allKeys.map(k => rating[k]).filter(v => v != null);
                  return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "-";
                })()}
              </span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>/ 5</span>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "20px" }} className="md:grid-cols-2">
          {renderCategory("Technisch", technicalKeys, "#60a5fa")}
          {renderCategory("Tactisch", tacticalKeys, "#a78bfa")}
          {renderCategory("Persoonlijkheid", personalityKeys, "#4ade80")}
          {renderCategory("Fysiek", physicalRatingKeys, "#fbbf24")}
        </div>
      </div>
    </div>
  );
}