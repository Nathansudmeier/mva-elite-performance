import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

function formatNL(dateStr) {
  if (!dateStr) return "";
  try { return format(parseISO(dateStr), "EEEE d MMMM yyyy", { locale: nl }); } catch { return dateStr; }
}

function EventIcon({ type }) {
  switch (type) {
    case "goal_mva":     return <span style={{ fontSize: "20px" }}>⚽</span>;
    case "goal_against": return <span style={{ fontSize: "20px" }}>⚽</span>;
    case "yellow_card":  return <span style={{ fontSize: "20px" }}>🟨</span>;
    case "red_card":     return <span style={{ fontSize: "20px" }}>🟥</span>;
    case "substitution": return <span style={{ fontSize: "20px" }}>🔄</span>;
    case "note":         return <span style={{ fontSize: "20px" }}>📋</span>;
    default:             return <span style={{ fontSize: "20px" }}>•</span>;
  }
}

function EventLabel({ event, players }) {
  const getPlayerName = (id) => players.find(p => p.id === id)?.name ?? "—";

  switch (event.type) {
    case "goal_mva":
      return <span><strong>Goal MV Artimis</strong>{event.player_id ? ` — ${getPlayerName(event.player_id)}` : ""}</span>;
    case "goal_against":
      return <span><strong>Goal tegenstander</strong></span>;
    case "yellow_card":
      return <span><strong>Gele kaart</strong>{event.player_id ? ` — ${getPlayerName(event.player_id)}` : ""}</span>;
    case "red_card":
      return <span><strong>Rode kaart</strong>{event.player_id ? ` — ${getPlayerName(event.player_id)}` : ""}</span>;
    case "substitution":
      return <span><strong>Wissel</strong>{event.player_in_id ? ` ↑ ${getPlayerName(event.player_in_id)}` : ""}{event.player_out_id ? ` ↓ ${getPlayerName(event.player_out_id)}` : ""}</span>;
    case "note":
      return <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.65)" }}>{event.note}</span>;
    default:
      return <span>{event.type}</span>;
  }
}

export default function LiveMatchViewer() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const { data: match, refetch } = useQuery({
    queryKey: ["live_viewer_match", matchId, tick],
    queryFn: () => base44.entities.Match.get(matchId),
    enabled: !!matchId,
    refetchInterval: 15000,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  if (!match) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1923", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.15)", borderTop: "3px solid #FF6800", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const events = match.live_events || [];
  const scoreHome = events.filter(e => e.type === "goal_mva").length;
  const scoreAway = events.filter(e => e.type === "goal_against").length;
  const isLive = match.live_status === "live";
  const isHalftime = match.live_status === "halftime";
  const isFinished = match.live_status === "finished";
  const isPre = !match.live_status || match.live_status === "pre";

  // Lineup
  const lineupIds = (match.lineup || []).map(l => l.player_id);
  const lineupPlayers = lineupIds.map(id => players.find(p => p.id === id)).filter(Boolean);

  const statusLabel = isPre ? "Nog niet begonnen" : isHalftime ? "Rust" : isFinished ? "Afgelopen" : "🔴 LIVE";
  const statusColor = isLive ? "#FF6800" : isFinished ? "rgba(255,255,255,0.40)" : isHalftime ? "#FFD600" : "rgba(255,255,255,0.40)";

  // Sort events descending by minute
  const sortedEvents = [...events].sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0));

  return (
    <div style={{ minHeight: "100vh", background: "#0f1923", color: "white", fontFamily: "inherit" }}>

      {/* Background gradient */}
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #1a0a00 0%, #0f1923 40%)", zIndex: 0 }} />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(15,25,35,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ fontSize: "15px", fontWeight: 700 }}>Live Wedstrijd</div>
        <div style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color: statusColor, display: "flex", alignItems: "center", gap: "6px" }}>
          {isLive && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF6800", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />}
          {statusLabel}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "20px 16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* Score card */}
        <div style={{
          background: "linear-gradient(135deg, #FF6800 0%, #cc4400 100%)",
          borderRadius: "20px",
          padding: "24px 20px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(255,104,0,0.35)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            {formatNL(match.date)} · {match.home_away === "Thuis" ? "Thuis" : "Uit"}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
            {/* MV Artimis */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, opacity: 0.85, marginBottom: "8px" }}>MV Artimis</div>
              <div style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1 }}>{scoreHome}</div>
            </div>

            {/* Separator */}
            <div style={{ fontSize: "28px", fontWeight: 900, opacity: 0.6, paddingBottom: "8px" }}>–</div>

            {/* Opponent */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, opacity: 0.85, marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {match.opponent_logo && <img src={match.opponent_logo} alt="" style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover" }} />}
                {match.opponent}
              </div>
              <div style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1 }}>{scoreAway}</div>
            </div>
          </div>

          {isHalftime && (
            <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.25)", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 700 }}>
              ⏸ Rust
            </div>
          )}
        </div>

        {/* Live events */}
        {sortedEvents.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", marginBottom: "12px" }}>
              Wedstrijdevents
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sortedEvents.map((event, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <EventIcon type={event.type} />
                  <div style={{ flex: 1, fontSize: "14px" }}>
                    <EventLabel event={event} players={players} />
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.40)" }}>
                    {event.minute}'
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opstelling */}
        {lineupPlayers.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", marginBottom: "12px" }}>
              Opstelling · {match.formation}
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
              {lineupPlayers.map((player, i) => (
                <div key={player.id} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "11px 14px",
                  borderBottom: i < lineupPlayers.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none"
                }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,104,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#FF6800" }}>
                    {player.shirt_number || i + 1}
                  </div>
                  {player.photo_url && (
                    <img src={player.photo_url} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{player.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{player.position}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geen events nog */}
        {isPre && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.40)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
            <div style={{ fontSize: "15px", fontWeight: 600 }}>Wedstrijd begint zo</div>
            <div style={{ fontSize: "13px", marginTop: "6px" }}>Deze pagina ververst automatisch.</div>
          </div>
        )}

        {isFinished && (
          <div style={{ textAlign: "center", padding: "20px", background: "rgba(255,255,255,0.04)", borderRadius: "14px", color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
            Wedstrijd afgelopen · Eindstand {scoreHome}–{scoreAway}
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
