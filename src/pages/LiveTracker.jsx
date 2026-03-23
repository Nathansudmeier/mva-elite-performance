import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

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

  // Extract minute from live_events or display text
  useEffect(() => {
    if (match?.live_events && match.live_events.length > 0) {
      const lastEvent = match.live_events[match.live_events.length - 1];
      setCurrentMinute(lastEvent.minute || 0);
    }
  }, [match?.live_events]);

  const isLive = match?.live_status === "live" || match?.live_status === "halftime";
  const isFinished = match?.live_status === "finished";
  const isFuture = !match ? true : new Date(match.date) > new Date();

  // Get match date/time
  const getMatchDateTime = () => {
    if (!match) return "";
    const d = new Date(match.date);
    const time = match.start_time;
    return `${d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })} ${time}`;
  };

  // Get player by ID
  const getPlayer = (playerId) => players?.find(p => p.id === playerId);

  // Get lineup players
  const getLineupPlayers = () => {
    if (!match?.lineup) return [];
    return match.lineup
      .map(item => ({
        ...item,
        player: getPlayer(item.player_id),
      }))
      .filter(item => item.player);
  };

  // Get substitutes
  const getSubstitutes = () => {
    if (!match?.substitutes) return [];
    return match.substitutes
      .map(playerId => getPlayer(playerId))
      .filter(p => p);
  };

  // Render timeline event
  const renderTimelineEvent = (event) => {
    const player = getPlayer(event.player_id);
    const assistPlayer = event.assist_player_id ? getPlayer(event.assist_player_id) : null;
    const playerOut = event.player_out_id ? getPlayer(event.player_out_id) : null;
    const playerIn = event.player_in_id ? getPlayer(event.player_in_id) : null;

    let icon = "ti-help";
    let iconBg = "rgba(255,255,255,0.08)";
    let iconBorder = "rgba(255,255,255,0.15)";
    let iconColor = "rgba(255,255,255,0.40)";
    let title = event.type;
    let description = "";

    if (event.type === "goal") {
      icon = "ti-ball-football";
      iconBg = "rgba(74,222,128,0.15)";
      iconBorder = "rgba(74,222,128,0.25)";
      iconColor = "#4ade80";
      title = "Goal MVA Noord";
      description = `${player?.name || "Onbekend"}${assistPlayer ? ` (assist: ${assistPlayer.name})` : ""}`;
    } else if (event.type === "goal-opp") {
      icon = "ti-ball-football";
      iconBg = "rgba(248,113,113,0.15)";
      iconBorder = "rgba(248,113,113,0.25)";
      iconColor = "#f87171";
      title = "Goal Tegenstander";
      description = player?.name || "Onbekend";
    } else if (event.type === "substitution") {
      icon = "ti-arrows-exchange";
      iconColor = "#FF8C3A";
      iconBg = "rgba(255,107,0,0.15)";
      iconBorder = "rgba(255,107,0,0.25)";
      title = "Wissel";
      description = `${playerOut?.name || "Onbekend"} → ${playerIn?.name || "Onbekend"}`;
    } else if (event.type === "kickoff") {
      icon = "ti-clock";
      title = "Aftrap";
    } else if (event.type === "halftime") {
      icon = "ti-clock";
      title = "Rust";
    }

    return (
      <div key={`${event.minute}-${event.type}-${event.player_id}`} className="flex gap-3 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div style={{ minWidth: "32px", fontSize: "12px", color: "rgba(255,255,255,0.45)", paddingTop: "4px" }}>{event.minute}'</div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: iconBg,
            border: `0.5px solid ${iconBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: "16px", color: iconColor }} />
        </div>
        <div className="flex-1 pt-1">
          <p style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>{title}</p>
          {description && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{description}</p>}
        </div>
      </div>
    );
  };

  const lineupPlayers = getLineupPlayers();
  const substitutePlayers = getSubstitutes();
  const timelineEvents = match?.live_events ? [...match.live_events].reverse() : [];

  if (matchLoading || playersLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: "#1c0e04" }}>
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: "#1c0e04" }}>
        <p className="t-secondary">Wedstrijd niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1c0e04" }}>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div style={{ position: "absolute", width: "100%", height: "100%", backgroundImage: "url('https://images.unsplash.com/photo-1521116573892-7e212e47c319?auto=format&fit=crop&w=1200&h=800&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,107,0,0.55)", top: -160, left: -100, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,150,0,0.30)", top: 380, right: -80, filter: "blur(70px)" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 md:p-6 max-w-2xl mx-auto pb-12">
        {/* Hero Card */}
        <div className="glass-dark rounded-2xl p-6 mb-6" style={{ borderColor: "rgba(255,107,0,0.3)" }}>
          {/* LIVE Badge */}
          {(isLive || isFinished) && (
            <div className="flex justify-center mb-4">
              {isLive ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "rgba(248,113,113,0.20)",
                  border: "0.5px solid rgba(248,113,113,0.40)",
                  color: "#f87171",
                }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#f87171",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }} />
                  LIVE
                </div>
              ) : (
                <div style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "rgba(100,100,100,0.20)",
                  border: "0.5px solid rgba(100,100,100,0.40)",
                  color: "rgba(255,255,255,0.45)",
                }}>
                  AFGELOPEN
                </div>
              )}
            </div>
          )}

          {/* Score Section */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center flex-1">
              <img src={match.opponent_logo || "https://via.placeholder.com/40"} alt={match.opponent} style={{ width: "40px", height: "40px", borderRadius: "50%", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>MVA Noord</p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: "44px", fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1 }}>
                {match.score_home ?? "-"}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
                {!isLive && !isFinished ? getMatchDateTime() : `${currentMinute}'`}
              </p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF8C3A", marginTop: "2px" }}>
                {isLive || isFinished ? `- ${match.score_away ?? "-"}` : ""}
              </p>
            </div>
            <div className="text-center flex-1">
              <img src={match.opponent_logo || "https://via.placeholder.com/40"} alt={match.opponent} style={{ width: "40px", height: "40px", borderRadius: "50%", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>{match.opponent}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {timelineEvents.length > 0 && (
          <div className="glass-dark rounded-2xl p-4 mb-6">
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.07em" }}>Tijdlijn</p>
            <div className="space-y-0">
              {timelineEvents.map((event, idx) => (
                <div key={idx}>{renderTimelineEvent(event)}</div>
              ))}
            </div>
          </div>
        )}

        {timelineEvents.length === 0 && (
          <div className="glass-dark rounded-2xl p-4 mb-6 text-center">
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Nog geen gebeurtenissen</p>
          </div>
        )}

        {/* Lineup */}
        {lineupPlayers.length > 0 && (
          <div className="glass-dark rounded-2xl p-4 mb-6">
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.07em" }}>Basisopstelling</p>
            <div className="space-y-0">
              {lineupPlayers.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5" style={{ borderBottom: idx < lineupPlayers.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", width: "32px", textAlign: "right" }}>{item.slot}</p>
                  <img src={item.player?.photo_url || "https://via.placeholder.com/28"} alt={item.player?.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                  <p style={{ fontSize: "13px", color: "white", flex: 1 }}>{item.player?.name}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", width: "24px", textAlign: "right" }}>{item.player?.shirt_number}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Substitutes */}
        {substitutePlayers.length > 0 && (
          <div className="glass-dark rounded-2xl p-4 mb-6">
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.07em" }}>Wissels</p>
            <div className="space-y-0">
              {substitutePlayers.map((player, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5" style={{ borderBottom: idx < substitutePlayers.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                  <img src={player.photo_url || "https://via.placeholder.com/28"} alt={player.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                  <p style={{ fontSize: "13px", color: "white", flex: 1 }}>{player.name}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", width: "24px", textAlign: "right" }}>{player.shirt_number}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {substitutePlayers.length === 0 && (
          <div className="glass-dark rounded-2xl p-4 mb-6 text-center">
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Nog niet bekend</p>
          </div>
        )}

        {/* Refresh indicator */}
        <div className="text-center mt-8">
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>Vernieuwd elke 5 seconden</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}