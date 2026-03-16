import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import LiveMatchClock from "../components/live/LiveMatchClock";
import LiveScore from "../components/live/LiveScore";
import EventModal from "../components/live/EventModal";
import MatchReport from "../components/live/MatchReport";
import FieldLineup from "../components/wedstrijden/FieldLineup";
import SubstitutesPicker from "../components/wedstrijden/SubstitutesPicker";

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
        <Button onClick={() => navigate("/Wedstrijden")} className="mt-4">Terug</Button>
      </div>
    );
  }

  // PRE-GAME
  if (phase === "pre") {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/Wedstrijden")} className="text-white/70 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Live Wedstrijd</h1>
            {match && <p className="text-sm text-white/70">vs. {match.opponent} · {match.date}</p>}
          </div>
        </div>

        {match && (
          <div className="elite-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#1A1F2E]">vs. {match.opponent}</h2>
                <p className="text-sm text-[#2F3650]">{match.home_away} · {match.date}</p>
              </div>
              <Select value={formation} onValueChange={setFormation}>
                <SelectTrigger className="w-28 border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#FFFFFF" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#D45A30" }}>Opstelling</p>
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

            <Button
              onClick={startMatch}
              disabled={Object.keys(lineupMap).length === 0}
              className="w-full text-white text-lg py-6 font-black"
              style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}
            >
              🚀 Start Wedstrijd
            </Button>
          </div>
        )}
      </div>
    );
  }

  // FINISHED — show report
  if (phase === "finished") {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/Wedstrijden")} className="text-white/70 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Wedstrijdverslag</h1>
            <p className="text-sm text-white/70">vs. {match?.opponent}</p>
          </div>
        </div>
        {match && <MatchReport match={{ ...match, live_events: events, halftime_notes: halftimeNotes }} players={activePlayers} />}
        <Button onClick={() => navigate("/Wedstrijden")} className="w-full text-white" style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}>
          Terug naar Wedstrijden
        </Button>
      </div>
    );
  }

  // HALFTIME
  if (phase === "halftime") {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/Wedstrijden")} className="text-white/70 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-white">Rust</h1>
        </div>

        <div className="elite-card p-6 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2F3650]">Ruststand</p>
          <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
        </div>

        <div className="elite-card p-6 space-y-3">
          <h3 className="font-bold text-[#1A1F2E]">Rustbespreking</h3>
          <Textarea
            placeholder="Notities voor de rustbespreking..."
            value={halftimeNotes}
            onChange={(e) => setHalftimeNotes(e.target.value)}
            className="border-[#FDE8DC] text-[#1A1F2E] h-32"
            style={{ backgroundColor: "#FFFFFF" }}
          />
          <Button
            onClick={startSecondHalf}
            className="w-full text-white text-base py-4 font-bold"
            style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}
          >
            ▶ Start 2e Helft
          </Button>
        </div>
      </div>
    );
  }

  // LIVE MODE
  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setRunning(false); }} className="text-white/70 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white">Live — vs. {match?.opponent}</h1>
            <p className="text-xs text-white/60">{match?.home_away} · {match?.team}</p>
          </div>
        </div>
      </div>

      {/* Clock */}
      <div className="elite-card p-6">
        <LiveMatchClock seconds={seconds} running={running} onToggle={handleToggleClock} onStop={handleStop} />
        {currentMinute >= 45 && running && (
          <p className="text-center text-xs mt-2" style={{ color: "#D45A30" }}>Druk op Pauze om naar de rust te gaan</p>
        )}
      </div>

      {/* Score */}
      <div className="elite-card px-6 py-4">
        <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveModal("goal_mva")}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
          style={{ backgroundColor: "#D45A30" }}
        >
          <span className="text-3xl">⚽</span>
          GOAL MVA
        </button>
        <button
          onClick={() => setActiveModal("goal_against")}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
          style={{ backgroundColor: "#C0392B" }}
        >
          <span className="text-3xl">🔴</span>
          GOAL TEGEN
        </button>
        <button
          onClick={() => setActiveModal("substitution")}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
          style={{ backgroundColor: "#2563EB" }}
        >
          <span className="text-3xl">🔄</span>
          WISSEL
        </button>
        <button
          onClick={() => setActiveModal("note")}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
          style={{ backgroundColor: "#6B7280" }}
        >
          <span className="text-3xl">📝</span>
          NOTITIE
        </button>
      </div>

      {/* Events log */}
      {events.length > 0 && (
        <div className="elite-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#2F3650" }}>Events</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {[...events].reverse().map((e, i) => {
              const player = activePlayers.find(p => p.id === e.player_id);
              const playerOut = activePlayers.find(p => p.id === e.player_out_id);
              const playerIn = activePlayers.find(p => p.id === e.player_in_id);
              return (
                <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: "#FDE8DC" }}>
                  <span className="font-bold w-8" style={{ color: "#D45A30" }}>{e.minute}'</span>
                  <span className="text-[#1A1F2E]">
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
  );
}