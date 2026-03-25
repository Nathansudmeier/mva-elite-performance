import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const MVA_LOGO = "/mva-logo.png";

function formatNL(dateStr) {
  if (!dateStr) return "";
  try { return format(parseISO(dateStr), "EEEE d MMMM yyyy", { locale: nl }); } catch { return dateStr; }
}

const POSITION_ORDER = {
  "Keeper": 0, "Centrale Verdediger": 1, "Linksback": 2, "Rechtsback": 3,
  "Controleur": 4, "Middenvelder": 5, "Aanvallende Middenvelder": 6,
  "Linksbuiten": 7, "Rechtsbuiten": 8, "Spits": 9
};

export default function LiveTracker() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("match_id");

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["live-match", matchId],
    queryFn: () => matchId ? base44.entities.Match.get(matchId) : null,
    refetchInterval: 5000,
    enabled: !!matchId,
  });

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
    refetchInterval: 10000,
  });

  const getPlayer = (id) => players.find(p => p.id === id);

  const isLive = match?.live_status === "live";
  const isHalftime = match?.live_status === "halftime";
  const isFinished = match?.live_status === "finished";
  const isPre = !match || match.live_status === "pre";

  // Calculate scores
  const scoreHome = match?.score_home ?? (match?.live_events?.filter(e => e.type === "goal_mva").length ?? 0);
  const scoreAway = match?.score_away ?? (match?.live_events?.filter(e => e.type === "goal_against").length ?? 0);

  // Current minute from last event
  const lastEvent = match?.live_events?.length > 0 ? match.live_events[match.live_events.length - 1] : null;
  const currentMinute = lastEvent?.minute ?? 0;

  // Lineup
  const lineupPlayers = (() => {
    if (!match?.lineup) return [];
    return match.lineup
      .map(item => ({ ...item, player: getPlayer(item.player_id) }))
      .filter(i => i.player)
      .sort((a, b) => (POSITION_ORDER[a.player?.position] ?? 10) - (POSITION_ORDER[b.player?.position] ?? 10));
  })();

  const substitutePlayers = (() => {
    if (!match?.substitutes) return [];
    return match.substitutes.map(id => getPlayer(id)).filter(Boolean);
  })();

  const timelineEvents = match?.live_events ? [...match.live_events].reverse() : [];

  const renderEvent = (event, idx, total) => {
    const player = getPlayer(event.player_id);
    const assistPlayer = event.assist_player_id ? getPlayer(event.assist_player_id) : null;
    const playerOut = event.player_out_id ? getPlayer(event.player_out_id) : null;
    const playerIn = event.player_in_id ? getPlayer(event.player_in_id) : null;

    let emoji = "";
    let title = "";
    let subtitle = "";
    let accentColor = "#1a1a1a";
    let cardBg = "#ffffff";
    let cardBorder = "rgba(26,26,26,0.12)";

    if (event.type === "goal_mva") {
      emoji = "⚽";
      title = "Goal MVA Noord!";
      subtitle = `${player?.name || "Onbekend"}${assistPlayer ? ` · assist: ${assistPlayer.name}` : ""}`;
      accentColor = "#08D068";
      cardBg = "rgba(8,208,104,0.08)";
      cardBorder = "rgba(8,208,104,0.35)";
    } else if (event.type === "goal_against") {
      emoji = "⚽";
      title = "Goal tegenstander";
      subtitle = match?.opponent || "Tegenstander";
      accentColor = "#FF3DA8";
      cardBg = "rgba(255,61,168,0.06)";
      cardBorder = "rgba(255,61,168,0.30)";
    } else if (event.type === "substitution") {
      emoji = "🔄";
      title = "Wissel";
      subtitle = `${playerOut?.name || "?"} ➜ ${playerIn?.name || "?"}`;
      accentColor = "#FF6800";
      cardBg = "rgba(255,104,0,0.06)";
      cardBorder = "rgba(255,104,0,0.25)";
    } else if (event.type === "yellow_card") {
      emoji = "🟨";
      title = "Gele kaart";
      subtitle = player?.name || "Onbekend";
      accentColor = "#FFD600";
      cardBg = "rgba(255,214,0,0.10)";
      cardBorder = "rgba(255,214,0,0.40)";
    } else if (event.type === "red_card") {
      emoji = "🟥";
      title = "Rode kaart";
      subtitle = player?.name || "Onbekend";
      accentColor = "#FF3333";
      cardBg = "rgba(255,51,51,0.06)";
      cardBorder = "rgba(255,51,51,0.30)";
    } else if (event.type === "note") {
      emoji = "📝";
      title = "Notitie";
      subtitle = event.note || "";
      accentColor = "#1a1a1a";
    } else {
      return null;
    }

    return (
      <div
        key={idx}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 14px",
          background: cardBg,
          border: `2px solid ${cardBorder}`,
          borderRadius: "14px",
          marginBottom: "8px",
        }}
      >
        {/* Minute badge */}
        <div style={{
          minWidth: "36px",
          height: "28px",
          background: accentColor,
          border: "2px solid #1a1a1a",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 900,
          color: accentColor === "#FFD600" ? "#1a1a1a" : "#ffffff",
          flexShrink: 0,
          boxShadow: "2px 2px 0 #1a1a1a",
        }}>
          {event.minute}'
        </div>

        {/* Emoji */}
        <div style={{ fontSize: "20px", lineHeight: 1, paddingTop: "3px", flexShrink: 0 }}>{emoji}</div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>{title}</p>
          {subtitle && <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.60)", marginTop: "3px", lineHeight: 1.3 }}>{subtitle}</p>}
        </div>
      </div>
    );
  };

  if (matchLoading || playersLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFF3E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "4px solid rgba(255,104,0,0.2)", borderTop: "4px solid #FF6800", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFF3E8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px" }}>
        <div style={{ fontSize: "52px" }}>⚽</div>
        <p style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a" }}>Geen wedstrijd gevonden</p>
        <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)", textAlign: "center" }}>Er is geen live wedstrijd beschikbaar op dit moment.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF3E8", paddingBottom: "40px" }}>

      {/* Sticky dark header */}
      <div style={{
        background: "#1a1a1a",
        borderBottom: "2.5px solid #1a1a1a",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", padding: "14px 16px 0" }}>

          {/* MVA branding row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <img
              src={MVA_LOGO}
              alt="MVA Noord"
              style={{ width: "26px", height: "26px", objectFit: "contain" }}
              onError={e => { e.target.style.display = "none"; }}
            />
            <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              MVA Noord{match.team ? ` — ${match.team}` : ""}
            </span>
            <div style={{ marginLeft: "auto" }}>
              {isLive && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "rgba(255,61,168,0.18)",
                  border: "2px solid rgba(255,61,168,0.5)",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "10px", fontWeight: 800, color: "#FF3DA8",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF3DA8", animation: "liveBlip 1.4s ease-in-out infinite" }} />
                  LIVE
                </div>
              )}
              {isHalftime && (
                <div style={{
                  background: "rgba(255,214,0,0.18)",
                  border: "2px solid rgba(255,214,0,0.5)",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "10px", fontWeight: 800, color: "#FFD600",
                }}>
                  RUST
                </div>
              )}
              {isFinished && (
                <div style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.55)",
                }}>
                  AFGELOPEN
                </div>
              )}
              {isPre && (
                <div style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "2px solid rgba(255,255,255,0.20)",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.40)",
                }}>
                  BINNENKORT
                </div>
              )}
            </div>
          </div>

          {/* Score hero */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", paddingBottom: "20px" }}>
            {/* Home team */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={MVA_LOGO}
                  alt="MVA Noord"
                  style={{ width: "52px", height: "52px", objectFit: "contain" }}
                  onError={e => { e.target.style.display = "none"; }}
                />
              </div>
              <p style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.70)", textAlign: "center", lineHeight: 1.2 }}>MVA Noord</p>
            </div>

            {/* Score */}
            <div style={{ textAlign: "center", minWidth: "110px" }}>
              {(isLive || isHalftime || isFinished) ? (
                <p style={{ fontSize: "54px", fontWeight: 900, color: "#ffffff", letterSpacing: "-3px", lineHeight: 1 }}>
                  {scoreHome} – {scoreAway}
                </p>
              ) : (
                <p style={{ fontSize: "42px", fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: "-2px", lineHeight: 1 }}>
                  – : –
                </p>
              )}
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", marginTop: "6px", fontWeight: 600 }}>
                {isLive ? `${currentMinute}'` : isHalftime ? "Rust" : isFinished ? "Eindstand" : formatNL(match.date)}
              </p>
            </div>

            {/* Away team */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {match.opponent_logo ? (
                  <img src={match.opponent_logo} alt={match.opponent} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "24px" }}>⚽</span>
                )}
              </div>
              <p style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.70)", textAlign: "center", lineHeight: 1.2 }}>{match.opponent || "Tegenstander"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body content */}
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "16px" }}>

        {/* Match info (pre-game) */}
        {isPre && (
          <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.55)", letterSpacing: "0.07em", marginBottom: "8px" }}>Wedstrijdinfo</p>
            <p style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", marginBottom: "4px" }}>{match.opponent}</p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(26,26,26,0.65)" }}>
              {formatNL(match.date)}{match.start_time ? ` · ${match.start_time}` : ""}
            </p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(26,26,26,0.65)", marginTop: "2px" }}>
              {match.home_away === "Thuis" ? "🏠 Thuiswedstrijd" : "✈️ Uitwedstrijd"}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: "white", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.45)", letterSpacing: "0.07em", marginBottom: "12px" }}>Tijdlijn</p>
          {timelineEvents.filter(e => e.type !== "note").length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</p>
              <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>Nog geen gebeurtenissen</p>
            </div>
          ) : (
            <div>
              {timelineEvents.map((event, idx) => renderEvent(event, idx, timelineEvents.length))}
            </div>
          )}
        </div>

        {/* Basisopstelling */}
        {lineupPlayers.length > 0 && (
          <div style={{ background: "white", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden", marginBottom: "16px" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "2px solid rgba(26,26,26,0.08)" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.45)", letterSpacing: "0.07em" }}>
                Basisopstelling ({lineupPlayers.length})
              </p>
            </div>
            {lineupPlayers.map((item, idx) => {
              const substitutedOutIds = match?.live_events?.filter(e => e.type === "substitution").map(e => e.player_out_id) ?? [];
              const isOut = substitutedOutIds.includes(item.player.id);
              return (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 16px",
                  borderBottom: idx < lineupPlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none",
                  opacity: isOut ? 0.45 : 1,
                }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", border: "2px solid #1a1a1a", flexShrink: 0, background: "rgba(26,26,26,0.06)" }}>
                    {item.player.photo_url ? (
                      <img src={item.player.photo_url} alt={item.player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>👤</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", textDecoration: isOut ? "line-through" : "none" }}>{item.player.name}</p>
                    {item.player.position && <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{item.player.position}</p>}
                  </div>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "#FF6800", border: "2.5px solid #1a1a1a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "14px", fontWeight: 900, color: "white" }}>{item.player.shirt_number || "–"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reservebank */}
        {substitutePlayers.length > 0 && (
          <div style={{ background: "white", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden", marginBottom: "16px" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "2px solid rgba(26,26,26,0.08)" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.45)", letterSpacing: "0.07em" }}>
                Reservebank ({substitutePlayers.length})
              </p>
            </div>
            {substitutePlayers.map((player, idx) => {
              const substitutedInIds = match?.live_events?.filter(e => e.type === "substitution").map(e => e.player_in_id) ?? [];
              const isIn = substitutedInIds.includes(player.id);
              return (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 16px",
                  borderBottom: idx < substitutePlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none",
                }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(26,26,26,0.25)", flexShrink: 0, background: "rgba(26,26,26,0.05)" }}>
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>👤</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>{player.name}</p>
                    {player.position && <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{player.position}</p>}
                  </div>
                  {isIn && (
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#08D068", background: "rgba(8,208,104,0.12)", border: "1.5px solid rgba(8,208,104,0.35)", borderRadius: "20px", padding: "2px 8px" }}>Ingevallen</span>
                  )}
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "rgba(26,26,26,0.08)", border: "2px solid rgba(26,26,26,0.20)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "14px", fontWeight: 900, color: "rgba(26,26,26,0.50)" }}>{player.shirt_number || "–"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(26,26,26,0.30)", fontWeight: 600, marginTop: "8px" }}>
          Vernieuwd elke 5 seconden
        </p>
      </div>

      <style>{`
        @keyframes liveBlip {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}