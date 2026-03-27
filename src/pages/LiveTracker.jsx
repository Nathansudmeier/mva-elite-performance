import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const MVA_LOGO = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/c0045a171_MVAlogo.png";
const BG_IMAGE = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b438d1bab_Matchday-background.png";

function formatNL(dateStr) {
  if (!dateStr) return "";
  try { return format(parseISO(dateStr), "EEEE d MMMM yyyy", { locale: nl }); } catch { return dateStr; }
}

const POSITION_ORDER = {
  "Keeper": 0, "Centrale Verdediger": 1, "Linksback": 2, "Rechtsback": 3,
  "Controleur": 4, "Middenvelder": 5, "Aanvallende Middenvelder": 6,
  "Linksbuiten": 7, "Rechtsbuiten": 8, "Spits": 9,
};

function StatusPill({ isLive, isHalftime, isFinished, isPre }) {
  if (isLive) return (
    <div style={{
      display: "flex", alignItems: "center", gap: "5px",
      background: "rgba(255,61,168,0.20)", border: "2px solid #FF3DA8",
      borderRadius: "20px", padding: "4px 12px",
      fontSize: "10px", fontWeight: 900, color: "#FF3DA8",
    }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF3DA8", animation: "liveBlip 1.4s ease-in-out infinite" }} />
      LIVE
    </div>
  );
  if (isHalftime) return (
    <div style={{
      background: "rgba(255,214,0,0.20)", border: "2px solid #FFD600",
      borderRadius: "20px", padding: "4px 12px",
      fontSize: "10px", fontWeight: 900, color: "#FFD600",
    }}>RUST</div>
  );
  if (isFinished) return (
    <div style={{
      background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.35)",
      borderRadius: "20px", padding: "4px 12px",
      fontSize: "10px", fontWeight: 900, color: "rgba(255,255,255,0.70)",
    }}>EINDSTAND</div>
  );
  return (
    <div style={{
      background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.25)",
      borderRadius: "20px", padding: "4px 12px",
      fontSize: "10px", fontWeight: 900, color: "rgba(255,255,255,0.55)",
    }}>BINNENKORT</div>
  );
}

function EventRow({ event, players, opponent }) {
  const player = players.find(p => p.id === event.player_id);
  const assistPlayer = event.assist_player_id ? players.find(p => p.id === event.assist_player_id) : null;
  const playerOut = event.player_out_id ? players.find(p => p.id === event.player_out_id) : null;
  const playerIn = event.player_in_id ? players.find(p => p.id === event.player_in_id) : null;

  let icon = "";
  let title = "";
  let subtitle = "";
  let accentColor = "#FF6800";
  let dotColor = "#FF6800";

  if (event.type === "goal_mva") {
    icon = "⚽"; title = player?.name || "Onbekend";
    subtitle = assistPlayer ? `Assist: ${assistPlayer.name}` : "";
    accentColor = "#08D068"; dotColor = "#08D068";
  } else if (event.type === "goal_against") {
    icon = "⚽"; title = opponent || "Tegenstander"; subtitle = "Tegendoelpunt";
    accentColor = "#FF3DA8"; dotColor = "#FF3DA8";
  } else if (event.type === "substitution") {
    icon = "🔄"; title = `${playerOut?.name || "?"} → ${playerIn?.name || "?"}`;
    subtitle = "Wissel"; accentColor = "#FF6800"; dotColor = "#FF6800";
  } else if (event.type === "yellow_card") {
    icon = "🟨"; title = player?.name || "Onbekend"; subtitle = "Gele kaart";
    accentColor = "#FFD600"; dotColor = "#FFD600";
  } else if (event.type === "red_card") {
    icon = "🟥"; title = player?.name || "Onbekend"; subtitle = "Rode kaart";
    accentColor = "#FF3333"; dotColor = "#FF3333";
  } else if (event.type === "note") {
    icon = "📝"; title = event.note || "Notitie"; subtitle = "";
    accentColor = "#9B5CFF"; dotColor = "#9B5CFF";
  } else {
    return null;
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "11px 0",
      borderBottom: "1.5px solid rgba(26,26,26,0.07)",
    }}>
      {/* Minute */}
      <div style={{
        minWidth: "38px", height: "30px",
        background: dotColor, border: "2px solid #1a1a1a", borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: 900,
        color: dotColor === "#FFD600" ? "#1a1a1a" : "#ffffff",
        boxShadow: "2px 2px 0 #1a1a1a", flexShrink: 0,
      }}>
        {event.minute}'
      </div>

      {/* Icon */}
      <span style={{ fontSize: "18px", flexShrink: 0 }}>{icon}</span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>{title}</p>
        {subtitle && <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.50)", marginTop: "2px", fontWeight: 600 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function LiveTracker() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("match_id");
  const [activeTab, setActiveTab] = useState("tijdlijn");

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

  const isLive = match?.live_status === "live";
  const isHalftime = match?.live_status === "halftime";
  const isFinished = match?.live_status === "finished";
  const isPre = !match || match.live_status === "pre";

  const scoreHome = match?.score_home ?? (match?.live_events?.filter(e => e.type === "goal_mva").length ?? 0);
  const scoreAway = match?.score_away ?? (match?.live_events?.filter(e => e.type === "goal_against").length ?? 0);
  const lastEvent = match?.live_events?.length > 0 ? match.live_events[match.live_events.length - 1] : null;
  const lastEventMinute = lastEvent?.minute ?? 0;

  // Live running clock: tick every second based on last known minute + elapsed time since last fetch
  const [displayMinute, setDisplayMinute] = useState(lastEventMinute);
  const lastFetchRef = useRef(Date.now());
  const baseMinuteRef = useRef(lastEventMinute);

  useEffect(() => {
    baseMinuteRef.current = lastEventMinute;
    lastFetchRef.current = Date.now();
    setDisplayMinute(lastEventMinute);
  }, [lastEventMinute]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastFetchRef.current) / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      setDisplayMinute(baseMinuteRef.current + elapsedMinutes);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  const currentMinute = isLive ? displayMinute : lastEventMinute;

  const lineupPlayers = (() => {
    if (!match?.lineup) return [];
    return match.lineup
      .map(item => ({ ...item, player: players.find(p => p.id === item.player_id) }))
      .filter(i => i.player)
      .sort((a, b) => (POSITION_ORDER[a.player?.position] ?? 10) - (POSITION_ORDER[b.player?.position] ?? 10));
  })();

  const substitutePlayers = (match?.substitutes || []).map(id => players.find(p => p.id === id)).filter(Boolean);
  const timelineEvents = match?.live_events ? [...match.live_events].reverse() : [];
  const substitutedOutIds = match?.live_events?.filter(e => e.type === "substitution").map(e => e.player_out_id) ?? [];
  const substitutedInIds = match?.live_events?.filter(e => e.type === "substitution").map(e => e.player_in_id) ?? [];

  const TABS = [
    { id: "tijdlijn", label: "Tijdlijn" },
    { id: "opstelling", label: "Opstelling" },
    { id: "bank", label: "Reservebank" },
  ];

  if (matchLoading || playersLoading) {
    return (
      <div style={{ minHeight: "100vh", background: `url(${BG_IMAGE}) center/cover no-repeat`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "4px solid rgba(255,104,0,0.2)", borderTop: "4px solid #FF6800", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ minHeight: "100vh", background: `url(${BG_IMAGE}) center/cover no-repeat`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px" }}>
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "3px 3px 0 #1a1a1a", padding: "32px 24px", textAlign: "center", maxWidth: "320px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>⚽</div>
          <p style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a", marginBottom: "6px" }}>Geen wedstrijd</p>
          <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)", lineHeight: 1.5 }}>Er is geen live wedstrijd beschikbaar op dit moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `url(${BG_IMAGE}) center/cover no-repeat fixed`, paddingBottom: "40px" }}>
      <style>{`
        @keyframes liveBlip { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── HERO SCORE CARD ── */}
      <div style={{ padding: "16px 16px 0", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{
          background: "rgba(26,26,26,0.88)",
          backdropFilter: "blur(12px)",
          border: "2.5px solid rgba(255,255,255,0.12)",
          borderRadius: "22px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}>
          {/* Top bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src={MVA_LOGO} alt="MVA" style={{ width: "22px", height: "22px", objectFit: "contain" }}
                onError={e => e.target.style.display = "none"} />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                MVA Noord{match.team ? ` · ${match.team}` : ""}
              </span>
            </div>
            <StatusPill isLive={isLive} isHalftime={isHalftime} isFinished={isFinished} isPre={isPre} />
          </div>

          {/* Score area */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 20px" }}>
            {/* Home */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.20)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                <img src={MVA_LOGO} alt="MVA Noord" style={{ width: "52px", height: "52px", objectFit: "contain" }}
                  onError={e => e.target.style.display = "none"} />
              </div>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 1.2 }}>MVA Noord</p>
            </div>

            {/* Score */}
            <div style={{ textAlign: "center", flex: "0 0 auto", minWidth: "120px" }}>
              {(isLive || isHalftime || isFinished) ? (
                <p style={{ fontSize: "60px", fontWeight: 900, color: "#ffffff", letterSpacing: "-4px", lineHeight: 1 }}>
                  {scoreHome}<span style={{ color: "rgba(255,255,255,0.35)", margin: "0 4px" }}>–</span>{scoreAway}
                </p>
              ) : (
                <p style={{ fontSize: "44px", fontWeight: 900, color: "rgba(255,255,255,0.30)", letterSpacing: "-2px", lineHeight: 1 }}>–:–</p>
              )}
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", marginTop: "6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {isLive ? `${currentMinute}'` : isHalftime ? "Rust" : isFinished ? "FT" : formatNL(match.date)}
              </p>
            </div>

            {/* Away */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.20)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {match.opponent_logo ? (
                  <img src={match.opponent_logo} alt={match.opponent} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "26px" }}>⚽</span>
                )}
              </div>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 1.2 }}>
                {match.opponent || "Tegenstander"}
              </p>
            </div>
          </div>

          {/* Goal scorers summary */}
          {timelineEvents.filter(e => e.type === "goal_mva" || e.type === "goal_against").length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px 14px" }}>
              {timelineEvents
                .filter(e => e.type === "goal_mva" || e.type === "goal_against")
                .slice(0, 4)
                .map((e, i) => {
                  const scorer = players.find(p => p.id === e.player_id);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px" }}>⚽</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: e.type === "goal_mva" ? "rgba(255,255,255,0.80)" : "rgba(255,61,168,0.80)" }}>
                        {e.type === "goal_mva" ? (scorer?.name || "MVA") : (match.opponent || "Tegenstander")} {e.minute}'
                      </span>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Pre-game info */}
          {isPre && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
                {formatNL(match.date)}{match.start_time ? ` · ${match.start_time}` : ""} · {match.home_away === "Thuis" ? "🏠 Thuis" : "✈️ Uit"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ maxWidth: "560px", margin: "14px auto 0", padding: "0 16px" }}>
        <div style={{
          display: "flex", gap: "6px",
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(8px)",
          border: "2.5px solid #1a1a1a",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a1a",
          padding: "4px",
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, height: "38px", borderRadius: "12px",
                background: activeTab === tab.id ? "#FF6800" : "transparent",
                border: activeTab === tab.id ? "2px solid #1a1a1a" : "2px solid transparent",
                color: activeTab === tab.id ? "#ffffff" : "rgba(26,26,26,0.55)",
                fontSize: "12px", fontWeight: 800,
                cursor: "pointer",
                boxShadow: activeTab === tab.id ? "2px 2px 0 #1a1a1a" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: "560px", margin: "12px auto 0", padding: "0 16px" }}>

        {/* Tijdlijn tab */}
        {activeTab === "tijdlijn" && (
          <div style={{
            background: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(8px)",
            border: "2.5px solid #1a1a1a",
            borderRadius: "18px",
            boxShadow: "3px 3px 0 #1a1a1a",
            padding: "16px",
          }}>
            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.40)", marginBottom: "4px" }}>
              Tijdlijn
            </p>
            {timelineEvents.filter(e => e.type !== "note").length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <p style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</p>
                <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.40)", fontWeight: 700 }}>Nog geen gebeurtenissen</p>
              </div>
            ) : (
              <div>
                {timelineEvents.map((event, idx) => (
                  <EventRow key={idx} event={event} players={players} opponent={match.opponent} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opstelling tab */}
        {activeTab === "opstelling" && (
          <div style={{
            background: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(8px)",
            border: "2.5px solid #1a1a1a",
            borderRadius: "18px",
            boxShadow: "3px 3px 0 #1a1a1a",
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "2px solid rgba(26,26,26,0.08)" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.40)" }}>
                Basisopstelling ({lineupPlayers.length})
              </p>
            </div>
            {lineupPlayers.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.40)", fontWeight: 700 }}>Nog geen opstelling ingevoerd</p>
              </div>
            ) : lineupPlayers.map((item, idx) => {
              const isOut = substitutedOutIds.includes(item.player.id);
              return (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 16px",
                  borderBottom: idx < lineupPlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none",
                  opacity: isOut ? 0.40 : 1,
                }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    overflow: "hidden", border: "2px solid #1a1a1a",
                    flexShrink: 0, background: "rgba(26,26,26,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.player.photo_url
                      ? <img src={item.player.photo_url} alt={item.player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: "15px" }}>👤</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", textDecoration: isOut ? "line-through" : "none", lineHeight: 1.2 }}>
                      {item.player.name}
                    </p>
                    {item.player.position && (
                      <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{item.player.position}</p>
                    )}
                  </div>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "#FF6800", border: "2.5px solid #1a1a1a",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    boxShadow: "2px 2px 0 #1a1a1a",
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#ffffff" }}>{item.player.shirt_number || "–"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reservebank tab */}
        {activeTab === "bank" && (
          <div style={{
            background: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(8px)",
            border: "2.5px solid #1a1a1a",
            borderRadius: "18px",
            boxShadow: "3px 3px 0 #1a1a1a",
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "2px solid rgba(26,26,26,0.08)" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.40)" }}>
                Reservebank ({substitutePlayers.length})
              </p>
            </div>
            {substitutePlayers.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.40)", fontWeight: 700 }}>Geen reservespelers</p>
              </div>
            ) : substitutePlayers.map((player, idx) => {
              const isIn = substitutedInIds.includes(player.id);
              return (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 16px",
                  borderBottom: idx < substitutePlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none",
                }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    overflow: "hidden", border: "2px solid rgba(26,26,26,0.20)",
                    flexShrink: 0, background: "rgba(26,26,26,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {player.photo_url
                      ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: "15px" }}>👤</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{player.name}</p>
                    {player.position && <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{player.position}</p>}
                  </div>
                  {isIn && (
                    <span style={{
                      fontSize: "10px", fontWeight: 800, color: "#08D068",
                      background: "rgba(8,208,104,0.12)", border: "1.5px solid rgba(8,208,104,0.35)",
                      borderRadius: "20px", padding: "3px 10px", flexShrink: 0,
                    }}>✓ Ingevallen</span>
                  )}
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "rgba(26,26,26,0.08)", border: "2px solid rgba(26,26,26,0.20)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "rgba(26,26,26,0.45)" }}>{player.shirt_number || "–"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(26,26,26,0.35)", fontWeight: 600, marginTop: "16px" }}>
          Automatisch vernieuwd elke 5 seconden
        </p>
      </div>
    </div>
  );
}