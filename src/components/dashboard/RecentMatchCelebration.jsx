import React from "react";

export default function RecentMatchCelebration({ matches, playerId }) {
  if (!matches?.length || !playerId) return null;

  // Meest recente afgelopen wedstrijd
  const finished = matches
    .filter(m => m.live_status === "finished" && (m.live_events || []).length > 0)
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  const recentMatch = finished[0];
  if (!recentMatch) return null;

  const events = recentMatch.live_events || [];
  const goals = events.filter(e => e.type === "goal_mva" && e.player_id === playerId);
  const assists = events.filter(e => e.type === "goal_mva" && e.assist_player_id === playerId);

  if (goals.length === 0 && assists.length === 0) return null;

  const goalCount = goals.length;
  const assistCount = assists.length;

  const getEmoji = () => {
    if (goalCount >= 3) return "🎩";
    if (goalCount >= 2) return "🔥";
    if (goalCount === 1 && assistCount >= 1) return "⚡";
    if (goalCount === 1) return "⚽";
    return "🎯";
  };

  const getTitle = () => {
    if (goalCount >= 3) return `Hattrick! ${goalCount} doelpunten!`;
    if (goalCount === 2) return "2 doelpunten! Brace!";
    if (goalCount === 1 && assistCount >= 1) return "Doelpunt én assist!";
    if (goalCount === 1) return "Gefeliciteerd met je doelpunt!";
    if (assistCount === 2) return "2 assists! Geweldig!";
    return "Gefeliciteerd met je assist!";
  };

  const getSubtitle = () => {
    const parts = [];
    if (goalCount > 0) parts.push(`${goalCount} ${goalCount === 1 ? "doelpunt" : "doelpunten"}`);
    if (assistCount > 0) parts.push(`${assistCount} ${assistCount === 1 ? "assist" : "assists"}`);
    return `${parts.join(" en ")} tegen ${recentMatch.opponent || "de tegenstander"}`;
  };

  const goalDetails = goals.map((g) => {
    const typeLabel = (() => {
      if (g.note === "Strafschop") return "Penalty";
      if (g.note === "Vrije trap") return "Vrije trap";
      if (g.note === "Hoekschop") return "Hoekschop";
      if (g.note === "Eigen doelpunt") return "Eigen doelpunt";
      return "Open spel";
    })();
    return { type: "goal", label: `${g.minute ? `${g.minute}' ` : ""}${typeLabel}` };
  });

  const assistDetails = assists.map((a) => ({
    type: "assist",
    label: `${a.minute ? `${a.minute}' ` : ""}Assist`,
  }));

  const allDetails = [...goalDetails, ...assistDetails];

  return (
    <div style={{
      background: "linear-gradient(135deg, #FFD600 0%, #FF6800 60%, #FF3DA8 100%)",
      border: "2.5px solid #1a1a1a",
      borderRadius: "18px",
      boxShadow: "4px 4px 0 #1a1a1a",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Confetti dots decoratie */}
      {["top-2 right-6", "top-6 right-2", "bottom-3 right-10", "top-3 right-16"].map((pos, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 8, height: 8, borderRadius: "50%",
          background: i % 2 === 0 ? "#ffffff" : "#1a1a1a",
          opacity: 0.3,
          top: ["8px","24px","auto","12px"][i],
          bottom: i === 2 ? "12px" : "auto",
          right: ["24px","8px","40px","64px"][i],
        }} />
      ))}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div style={{
          fontSize: "40px",
          lineHeight: 1,
          flexShrink: 0,
          filter: "drop-shadow(2px 2px 0 rgba(0,0,0,0.2))",
        }}>
          {getEmoji()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)", marginBottom: "4px"
          }}>
            Laatste wedstrijd
          </p>
          <p style={{
            fontSize: "18px", fontWeight: 900, color: "#ffffff",
            letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: "6px",
            textShadow: "1px 1px 0 rgba(0,0,0,0.15)"
          }}>
            {getTitle()}
          </p>
          <p style={{
            fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)",
            marginBottom: "10px"
          }}>
            {getSubtitle()}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {allDetails.map((detail, i) => (
              <span key={i} style={{
                background: "rgba(255,255,255,0.25)",
                border: "1.5px solid rgba(255,255,255,0.50)",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}>
                {detail.type === "goal" ? (
                  <i className="ph-fill ph-soccer-ball" style={{
                    fontSize: "14px",
                    color: "#FFD600",
                    WebkitTextStroke: "1px #1a1a1a",
                    paintOrder: "stroke fill",
                  }} />
                ) : (
                  <i className="ph-fill ph-arrow-bend-up-right" style={{
                    fontSize: "14px",
                    color: "#00C2FF",
                  }} />
                )}
                {detail.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}