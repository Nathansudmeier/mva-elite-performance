import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

const MVA_LOGO = "https://upload.wikimedia.org/wikipedia/nl/thumb/7/7d/MVA_Noord.svg/1200px-MVA_Noord.svg.png";

export default function LiveTracker() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("match_id");
  const [currentMinute, setCurrentMinute] = useState(0);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => matchId ? base44.entities.Match.get(matchId) : null,
    refetchInterval: 5000,
    enabled: !!matchId,
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (match?.live_events && match.live_events.length > 0) {
      const lastEvent = match.live_events[match.live_events.length - 1];
      setCurrentMinute(lastEvent.minute || 0);
    }
  }, [match?.live_events]);

  const isLive = match?.live_status === "live";
  const isHalftime = match?.live_status === "halftime";
  const isFinished = match?.live_status === "finished";

  const getMatchDateTime = () => {
    if (!match) return "";
    const d = new Date(match.date);
    return `${d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}${match.start_time ? ` · ${match.start_time}` : ""}`;
  };

  const getPlayer = (playerId) => players?.find(p => p.id === playerId);
  const getLineupPlayers = () => {
    if (!match?.lineup) return [];
    return match.lineup.map(item => ({ ...item, player: getPlayer(item.player_id) })).filter(i => i.player);
  };
  const getSubstitutes = () => {
    if (!match?.substitutes) return [];
    return match.substitutes.map(id => getPlayer(id)).filter(Boolean);
  };

  // Calculate scores from events
  const scoreHome = (() => {
    if (match?.score_home != null) return match.score_home;
    return match?.live_events?.filter(e => e.type === "goal").length ?? 0;
  })();
  const scoreAway = (() => {
    if (match?.score_away != null) return match.score_away;
    return match?.live_events?.filter(e => e.type === "goal-opp").length ?? 0;
  })();

  const timelineEvents = match?.live_events ? [...match.live_events].reverse() : [];
  const lineupPlayers = getLineupPlayers();
  const substitutePlayers = getSubstitutes();

  const renderEvent = (event, idx) => {
    const player = getPlayer(event.player_id);
    const assistPlayer = event.assist_player_id ? getPlayer(event.assist_player_id) : null;
    const playerOut = event.player_out_id ? getPlayer(event.player_out_id) : null;
    const playerIn = event.player_in_id ? getPlayer(event.player_in_id) : null;

    let emoji = "❓";
    let title = event.type;
    let subtitle = "";
    let accentColor = "#1a1a1a";
    let bgColor = "#ffffff";

    if (event.type === "goal") {
      emoji = "⚽";
      title = "Goal MVA Noord!";
      subtitle = `${player?.name || "Onbekend"}${assistPlayer ? ` · assist: ${assistPlayer.name}` : ""}`;
      accentColor = "#08D068";
      bgColor = "rgba(8,208,104,0.08)";
    } else if (event.type === "goal-opp") {
      emoji = "⚽";
      title = "Goal tegenstander";
      subtitle = match?.opponent || "Tegenstander";
      accentColor = "#FF3DA8";
      bgColor = "rgba(255,61,168,0.08)";
    } else if (event.type === "substitution") {
      emoji = "🔄";
      title = "Wissel";
      subtitle = `${playerOut?.name || "?"} → ${playerIn?.name || "?"}`;
      accentColor = "#FF6800";
      bgColor = "rgba(255,104,0,0.08)";
    } else if (event.type === "yellow_card") {
      emoji = "🟨";
      title = "Gele kaart";
      subtitle = player?.name || "Onbekend";
      accentColor = "#FFD600";
      bgColor = "rgba(255,214,0,0.10)";
    } else if (event.type === "red_card") {
      emoji = "🟥";
      title = "Rode kaart";
      subtitle = player?.name || "Onbekend";
      accentColor = "#FF3DA8";
      bgColor = "rgba(255,61,168,0.08)";
    } else if (event.type === "kickoff") {
      emoji = "🏁";
      title = "Aftrap";
    } else if (event.type === "halftime") {
      emoji = "⏸";
      title = "Rust";
    } else if (event.type === "note") {
      emoji = "📝";
      title = "Notitie";
      subtitle = event.note || "";
    }

    return (
      <div
        key={idx}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "12px 0",
          borderBottom: "1.5px solid rgba(26,26,26,0.07)",
        }}
      >
        {/* Minute */}
        <div style={{
          minWidth: "36px",
          height: "28px",
          background: "#1a1a1a",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 800,
          color: "#ffffff",
          flexShrink: 0,
        }}>
          {event.minute}'
        </div>

        {/* Icon */}
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: bgColor,
          border: `2px solid ${accentColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          flexShrink: 0,
        }}>
          {emoji}
        </div>

        {/* Text */}
        <div style={{ flex: 1, paddingTop: "2px" }}>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>{title}</p>
          {subtitle && <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", marginTop: "2px" }}>{subtitle}</p>}
        </div>
      </div>
    );
  };

  if (matchLoading || playersLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFF3E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFF3E8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px" }}>
        <div style={{ fontSize: "48px" }}>⚽</div>
        <p className="t-section-title">Wedstrijd niet gevonden</p>
        <p className="t-secondary" style={{ textAlign: "center" }}>Er is geen live wedstrijd beschikbaar op dit moment.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF3E8", paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{
        background: "#1a1a1a",
        borderBottom: "2.5px solid #1a1a1a",
        padding: "16px 16px 0",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          {/* Team + MVA label */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <img
              src={MVA_LOGO}
              alt="MVA Noord"
              style={{ width: "28px", height: "28px", objectFit: "contain" }}
              onError={e => { e.target.style.display = "none"; }}
            />
            <span style={{ fontSize: "13px", fontWeight: 800, color: "rgba(255,255,255,0.75)", letterSpacing: "0.05em" }}>
              MVA NOORD {match.team ? `— ${match.team}` : ""}
            </span>
            {isLive && (
              <div style={{
                display: "flex", alignItems: "center", gap: "5px",
                marginLeft: "auto",
                background: "rgba(255,61,168,0.18)",
                border: "1.5px solid rgba(255,61,168,0.5)",
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
                marginLeft: "auto",
                background: "rgba(255,214,0,0.18)",
                border: "1.5px solid rgba(255,214,0,0.5)",
                borderRadius: "20px",
                padding: "3px 10px",
                fontSize: "10px", fontWeight: 800, color: "#FFD600",
              }}>
                RUST
              </div>
            )}
            {isFinished && (
              <div style={{
                marginLeft: "auto",
                background: "rgba(255,255,255,0.10)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: "20px",
                padding: "3px 10px",
                fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.55)",
              }}>
                AFGELOPEN
              </div>
            )}
          </div>

          {/* Score hero */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", paddingBottom: "20px" }}>
            {/* Home */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <img
                src={MVA_LOGO}
                alt="MVA Noord"
                style={{ width: "52px", height: "52px", objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }}
              />
              <p style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.2 }}>MVA Noord</p>
            </div>

            {/* Score */}
            <div style={{ textAlign: "center", minWidth: "100px" }}>
              <p style={{ fontSize: "52px", fontWeight: 900, color: "#ffffff", letterSpacing: "-3px", lineHeight: 1 }}>
                {(isLive || isHalftime || isFinished) ? `${scoreHome} – ${scoreAway}` : "–"}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", marginTop: "6px" }}>
                {isLive ? `${currentMinute}'` : isHalftime ? "Rust" : isFinished ? "Eindstand" : getMatchDateTime()}
              </p>
            </div>

            {/* Away */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              {match.opponent_logo ? (
                <img
                  src={match.opponent_logo}
                  alt={match.opponent}
                  style={{ width: "52px", height: "52px", objectFit: "contain", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }}
                />
              ) : (
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                  ⚽
                </div>
              )}
              <p style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.2 }}>{match.opponent || "Tegenstander"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px" }}>

        {/* Match info */}
        {(!isLive && !isHalftime && !isFinished) && (
          <div className="glass" style={{ padding: "16px", marginBottom: "16px" }}>
            <p className="t-label" style={{ marginBottom: "8px" }}>Wedstrijd info</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ti ti-calendar" style={{ fontSize: "16px", color: "#FF6800" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{getMatchDateTime()}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
              <i className="ti ti-map-pin" style={{ fontSize: "16px", color: "#FF6800" }} />
              <p style={{ fontSize: "14px", color: "rgba(26,26,26,0.65)" }}>{match.home_away === "Thuis" ? "Thuiswedstrijd" : "Uitwedstrijd"}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="glass" style={{ padding: "16px", marginBottom: "16px" }}>
          <p className="t-label" style={{ marginBottom: "4px" }}>Tijdlijn</p>
          {timelineEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</p>
              <p className="t-secondary">Nog geen gebeurtenissen</p>
            </div>
          ) : (
            <div>
              {timelineEvents.map((event, idx) => renderEvent(event, idx))}
            </div>
          )}
        </div>

        {/* Basisopstelling */}
        {lineupPlayers.length > 0 && (
          <div className="glass" style={{ padding: "16px", marginBottom: "16px" }}>
            <p className="t-label" style={{ marginBottom: "12px" }}>Basisopstelling</p>
            {lineupPlayers.map((item, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "8px 0",
                borderBottom: idx < lineupPlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  overflow: "hidden", border: "2px solid #1a1a1a", flexShrink: 0,
                  background: "rgba(26,26,26,0.08)",
                }}>
                  {item.player?.photo_url ? (
                    <img src={item.player.photo_url} alt={item.player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>👤</div>
                  )}
                </div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{item.player?.name}</p>
                {item.player?.shirt_number && (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: "#FF6800", border: "2px solid #1a1a1a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 900, color: "#ffffff",
                  }}>
                    {item.player.shirt_number}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Wissels */}
        {substitutePlayers.length > 0 && (
          <div className="glass" style={{ padding: "16px", marginBottom: "16px" }}>
            <p className="t-label" style={{ marginBottom: "12px" }}>Reservebank</p>
            {substitutePlayers.map((player, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "8px 0",
                borderBottom: idx < substitutePlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  overflow: "hidden", border: "2px solid rgba(26,26,26,0.25)", flexShrink: 0,
                  background: "rgba(26,26,26,0.05)",
                }}>
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>👤</div>
                  )}
                </div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a", flex: 1 }}>{player.name}</p>
                {player.shirt_number && (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: "rgba(26,26,26,0.08)", border: "2px solid rgba(26,26,26,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 900, color: "rgba(26,26,26,0.55)",
                  }}>
                    {player.shirt_number}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.30)", fontWeight: 600 }}>Vernieuwd elke 5 seconden</p>
        </div>
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