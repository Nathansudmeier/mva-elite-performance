import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LiveMatchClock from "../components/live/LiveMatchClock";
import LiveScore from "../components/live/LiveScore";
import EventModal from "../components/live/EventModal";
import MatchReport from "../components/live/MatchReport";
import FieldLineup from "../components/wedstrijden/FieldLineup";
import SubstitutesPicker from "../components/wedstrijden/SubstitutesPicker";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const BG_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png";

function formatNL(dateStr) {
  if (!dateStr) return "";
  try { return format(parseISO(dateStr), "EEEE d MMMM yyyy", { locale: nl }); } catch { return dateStr; }
}

const glassCard = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "0.5px solid rgba(255,255,255,0.18)",
  borderRadius: "22px",
};

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <i className="ti ti-arrow-left" style={{ fontSize: 18, color: "#FF8C3A" }} />
    </button>
  );
}

const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3"];

function lineupArrayToMap(arr) {
  if (!arr) return {};
  return arr.reduce((acc, { slot, player_id }) => { if (slot && player_id) acc[slot] = player_id; return acc; }, {});
}
function lineupMapToArray(map) {
  return Object.entries(map).map(([slot, player_id]) => ({ slot, player_id }));
}

export default function LiveMatch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("matchId");

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-date") });

  const activePlayers = players.filter(p => p.active !== false);
  const match = matches.find(m => m.id === matchId);

  // Pre-game state
  const [lineupMap, setLineupMap] = useState({});
  const [substitutes, setSubstitutes] = useState([]);
  const [formation, setFormation] = useState("4-3-3");

  // Live state
  const [phase, setPhase] = useState("pre"); // pre | live | halftime | finished
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [halftimeNotes, setHalftimeNotes] = useState("");
  const [activeModal, setActiveModal] = useState(null); // null | 'goal_mva' | 'goal_against' | 'substitution' | 'note'

  const intervalRef = useRef(null);

  // Load existing match data
  useEffect(() => {
    if (match) {
      setLineupMap(lineupArrayToMap(match.lineup));
      setSubstitutes(match.substitutes || []);
      setFormation(match.formation || "4-3-3");
      if (match.live_events) setEvents(match.live_events);
      if (match.halftime_notes) setHalftimeNotes(match.halftime_notes);
      if (match.live_status && match.live_status !== "pre") setPhase(match.live_status);
    }
  }, [match?.id]);

  // Clock
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Match.update(matchId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  const currentMinute = Math.floor(seconds / 60);
  const scoreHome = events.filter(e => e.type === "goal_mva").length;
  const scoreAway = events.filter(e => e.type === "goal_against").length;

  // Get all lineup players for event selection
  const lineupPlayerIds = Object.values(lineupMap);
  const lineupPlayers = activePlayers.filter(p => lineupPlayerIds.includes(p.id));
  // Include current subs who came in
  const substitutedIn = events.filter(e => e.type === "substitution").map(e => e.player_in_id);
  const substitutedOut = events.filter(e => e.type === "substitution").map(e => e.player_out_id);
  const currentFieldPlayers = activePlayers.filter(p =>
    (lineupPlayerIds.includes(p.id) && !substitutedOut.includes(p.id)) || substitutedIn.includes(p.id)
  );

  const startMatch = () => {
    const lineup = lineupMapToArray(lineupMap);
    saveMutation.mutate({ lineup, substitutes, formation, live_status: "live", live_events: [] });
    setPhase("live");
    setRunning(true);
  };

  const handleToggleClock = () => {
    if (running && currentMinute >= 45 && phase === "live") {
      // Go to halftime
      setRunning(false);
      setPhase("halftime");
      saveMutation.mutate({ live_status: "halftime", live_events: events });
    } else {
      setRunning(!running);
    }
  };

  const handleStop = () => {
    setRunning(false);
    setPhase("finished");
    const finalScoreHome = events.filter(e => e.type === "goal_mva").length;
    const finalScoreAway = events.filter(e => e.type === "goal_against").length;
    saveMutation.mutate({
      live_status: "finished",
      live_events: events,
      score_home: finalScoreHome,
      score_away: finalScoreAway,
    });
  };

  const startSecondHalf = () => {
    setSeconds(45 * 60);
    setPhase("live");
    setRunning(true);
    saveMutation.mutate({ live_status: "live", halftime_notes: halftimeNotes, live_events: events });
  };

  const handleEvent = (eventData) => {
    const newEvents = [...events, eventData];
    setEvents(newEvents);
    setActiveModal(null);
    saveMutation.mutate({ live_events: newEvents });
  };

  if (!match && matchId) {
    return (
      <div className="p-8 text-center text-white">
        <p>Wedstrijd niet gevonden.</p>
        <button onClick={() => navigate("/Wedstrijden")} className="mt-4 btn-primary">Terug</button>
      </div>
    );
  }

  // PRE-GAME
  if (phase === "pre") {
    return (
      <div className="relative min-h-screen pb-24">
        <img src={BG_URL} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
        <div className="relative z-10 space-y-5 p-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Live Wedstrijd</h1>
              {match && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>vs. {match.opponent} · {formatNL(match.date)}</p>}
            </div>
          </div>

          {match && (
            <div style={{ ...glassCard, padding: "20px" }} className="space-y-5">
              {/* Match info */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>vs. {match.opponent}</h2>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", marginTop: 2 }}>{match.home_away} · {formatNL(match.date)}</p>
                </div>
                <select
                  value={formation}
                  onChange={e => setFormation(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "#fff", padding: "8px 12px", fontSize: 13, fontWeight: 600, outline: "none" }}
                >
                  {FORMATIONS.map(f => <option key={f} value={f} style={{ background: "#1c0e04" }}>{f}</option>)}
                </select>
              </div>

              {/* Field + Players stacked vertically */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#FF8C3A", marginBottom: 8 }}>Opstelling</p>
                <div style={{ height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                  <FieldLineup
                    players={activePlayers}
                    lineupMap={lineupMap}
                    formation={formation}
                    onLineupChange={setLineupMap}
                  />
                </div>
                <SubstitutesPicker
                  players={activePlayers}
                  lineupMap={lineupMap}
                  substitutes={substitutes}
                  onSubstitutesChange={setSubstitutes}
                />
              </div>

              <button
                onClick={startMatch}
                disabled={Object.keys(lineupMap).length === 0}
                style={{ width: "100%", height: 52, background: Object.keys(lineupMap).length === 0 ? "rgba(255,107,0,0.35)" : "#FF6B00", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: Object.keys(lineupMap).length === 0 ? "not-allowed" : "pointer" }}
              >
                <i className="ti ti-player-play" style={{ fontSize: 18 }} />
                Start Wedstrijd
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FINISHED — show report
  if (phase === "finished") {
    return (
      <div className="relative min-h-screen pb-24">
        <img src={BG_URL} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
        <div className="relative z-10 space-y-5 p-4">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Wedstrijdverslag</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>vs. {match?.opponent}</p>
            </div>
          </div>
          {match && <MatchReport match={{ ...match, live_events: events, halftime_notes: halftimeNotes }} players={activePlayers} />}
          <button onClick={() => navigate("/Planning")} className="btn-primary">
            Terug naar Planning
          </button>
        </div>
      </div>
    );
  }

  // HALFTIME
  if (phase === "halftime") {
    return (
      <div className="relative min-h-screen pb-24">
        <img src={BG_URL} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
        <div className="relative z-10 space-y-5 p-4">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Rust</h1>
          </div>

          <div style={{ ...glassCard, padding: "24px", textAlign: "center" }} className="space-y-4">
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.50)" }}>Ruststand</p>
            <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
          </div>

          <div style={{ ...glassCard, padding: "20px" }} className="space-y-3">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Rustbespreking</h3>
            <textarea
              placeholder="Notities voor de rustbespreking..."
              value={halftimeNotes}
              onChange={(e) => setHalftimeNotes(e.target.value)}
              rows={4}
              style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "#fff", padding: "10px 14px", fontSize: 13, outline: "none", resize: "none" }}
            />
            <button
              onClick={startSecondHalf}
              style={{ width: "100%", height: 52, background: "#FF6B00", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
            >
              <i className="ti ti-player-play" style={{ fontSize: 18 }} />
              Start 2e Helft
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LIVE MODE
  return (
    <div className="relative min-h-screen pb-24">
      <img src={BG_URL} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
      <div className="relative z-10 space-y-5 p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackBtn onClick={() => setRunning(false)} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Live — vs. {match?.opponent}</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>{match?.home_away} · {match?.team}</p>
          </div>
        </div>

        {/* Clock */}
        <div style={{ ...glassCard, padding: "24px" }}>
          <LiveMatchClock seconds={seconds} running={running} onToggle={handleToggleClock} onStop={handleStop} />
          {currentMinute >= 45 && running && (
            <p style={{ textAlign: "center", fontSize: 12, marginTop: 8, color: "#FF8C3A" }}>Druk op Pauze om naar de rust te gaan</p>
          )}
        </div>

        {/* Score */}
        <div style={{ ...glassCard, padding: "16px 24px" }}>
          <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setActiveModal("goal_mva")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
            style={{ backgroundColor: "#D45A30" }}>
            <span className="text-3xl">⚽</span>GOAL MVA
          </button>
          <button onClick={() => setActiveModal("goal_against")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
            style={{ backgroundColor: "#C0392B" }}>
            <span className="text-3xl">🔴</span>GOAL TEGEN
          </button>
          <button onClick={() => setActiveModal("substitution")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
            style={{ backgroundColor: "#2563EB" }}>
            <span className="text-3xl">🔄</span>WISSEL
          </button>
          <button onClick={() => setActiveModal("note")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
            style={{ backgroundColor: "#6B7280" }}>
            <span className="text-3xl">📝</span>NOTITIE
          </button>
        </div>

        {/* Events log */}
        {events.length > 0 && (
          <div style={{ ...glassCard, padding: "16px" }}>
            <h3 style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.50)", marginBottom: 10 }}>Events</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {[...events].reverse().map((e, i) => {
                const player = activePlayers.find(p => p.id === e.player_id);
                const playerOut = activePlayers.find(p => p.id === e.player_out_id);
                const playerIn = activePlayers.find(p => p.id === e.player_in_id);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "6px 10px", borderRadius: 10, background: "rgba(255,107,0,0.10)" }}>
                    <span style={{ fontWeight: 600, width: 32, color: "#FF8C3A" }}>{e.minute}'</span>
                    <span style={{ color: "rgba(255,255,255,0.85)" }}>
                      {e.type === "goal_mva" && `⚽ Goal — ${player?.name}`}
                      {e.type === "goal_against" && "🔴 Goal Tegen"}
                      {e.type === "substitution" && `🔄 ${playerOut?.name} → ${playerIn?.name}`}
                      {e.type === "note" && `📝 ${e.note}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Event modals */}
        {activeModal && (
          <EventModal
            type={activeModal}
            minute={seconds}
            players={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers}
            substitutePlayers={activePlayers.filter(p => substitutes.includes(p.id) && !substitutedIn.includes(p.id))}
            onConfirm={handleEvent}
            onClose={() => setActiveModal(null)}
          />
        )}
      </div>
    </div>
  );
}