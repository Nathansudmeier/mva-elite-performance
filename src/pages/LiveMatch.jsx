import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Edit2, Play } from "lucide-react";
import LiveMatchClock from "../components/live/LiveMatchClock";
import LiveScore from "../components/live/LiveScore";
import GoalBottomSheet from "../components/live/GoalBottomSheet";
import SubstitutionBottomSheet from "../components/live/SubstitutionBottomSheet";
import MatchReport from "../components/live/MatchReport";
import FieldLineup from "../components/wedstrijden/FieldLineup";
import SubstitutesPicker from "../components/wedstrijden/SubstitutesPicker";
import LineupPlayerList from "../components/wedstrijden/LineupPlayerList";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

function formatNL(dateStr) {
  if (!dateStr) return "";
  try { return format(parseISO(dateStr), "EEEE d MMMM yyyy", { locale: nl }); } catch { return dateStr; }
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-orange-600/20"
      style={{ border: "2px solid #FF6800" }}>
      <ChevronLeft size={18} style={{ color: "#FF6800" }} />
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

// Simple note modal overlay
function NoteModal({ minute, onConfirm, onClose }) {
  const [note, setNote] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(4px)" }} />
      <div className="glass p-6 w-full max-w-sm space-y-4" style={{ position: "relative" }}>
        <div className="flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>
          <Edit2 size={16} />Notitie — {minute}'
        </div>
        <textarea
          placeholder="Tactische observatie..."
          value={note}
          onChange={e => setNote(e.target.value)}
          autoFocus
          rows={4}
          className="w-full rounded-lg border-2 border-border p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-600"
          style={{ fontSize: "13px", fontFamily: "inherit" }}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">Annuleren</button>
          <button onClick={() => { if (note.trim()) onConfirm({ type: "note", minute, note }); }} disabled={!note.trim()}
            className="flex-1 btn-primary" style={{ opacity: note.trim() ? 1 : 0.5 }}>
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

// Goal tegen simple confirmation
function GoalAgainstModal({ minute, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(4px)" }} />
      <div className="glass glass-alert p-6 w-full max-w-xs text-center space-y-4" style={{ position: "relative" }}>
        <div style={{ fontSize: "24px" }}>⚽</div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#FF3DA8" }}>Goal Tegen — {minute}'</div>
        <p className="t-secondary">Goal registreren op minuut {minute}?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">Annuleren</button>
          <button onClick={() => onConfirm({ type: "goal_against", minute })}
            className="flex-1 btn-primary" style={{ background: "#FF3DA8" }}>
            Bevestigen
          </button>
        </div>
      </div>
    </div>
  );
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
  const [showField, setShowField] = useState(false); // desktop toggle

  // Live state
  const [phase, setPhase] = useState("pre");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [halftimeNotes, setHalftimeNotes] = useState("");
  const [activeModal, setActiveModal] = useState(null);

  // PlayerMatchTime records tracked locally (array of {id, player_id, start_minute, end_minute})
  const [matchTimeRecords, setMatchTimeRecords] = useState([]);

  const intervalRef = useRef(null);

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

  const lineupPlayerIds = Object.values(lineupMap);
  const substitutedIn = events.filter(e => e.type === "substitution").map(e => e.player_in_id);
  const substitutedOut = events.filter(e => e.type === "substitution").map(e => e.player_out_id);

  // Current field players = starters still on field + players who came in
  const currentFieldPlayers = activePlayers.filter(p =>
    (lineupPlayerIds.includes(p.id) && !substitutedOut.includes(p.id)) || substitutedIn.includes(p.id)
  );
  // Bench players = substitutes not yet in
  const currentBenchPlayers = activePlayers.filter(p =>
    substitutes.includes(p.id) && !substitutedIn.includes(p.id)
  );

  // ---- PlayerMatchTime helpers ----
  const createMatchTimeRecords = async (playerIds, startMin) => {
    const created = [];
    for (const pid of playerIds) {
      const rec = await base44.entities.PlayerMatchTime.create({
        match_id: matchId,
        player_id: pid,
        start_minute: startMin,
      });
      created.push(rec);
    }
    return created;
  };

  const closeMatchTimeRecord = async (playerId, endMin, records) => {
    const open = records.find(r => r.player_id === playerId && r.end_minute == null);
    if (open) {
      await base44.entities.PlayerMatchTime.update(open.id, { end_minute: endMin });
      return records.map(r => r.id === open.id ? { ...r, end_minute: endMin } : r);
    }
    return records;
  };

  const closeAllOpenRecords = async (endMin, records) => {
    let updated = [...records];
    for (const rec of records.filter(r => r.end_minute == null)) {
      await base44.entities.PlayerMatchTime.update(rec.id, { end_minute: endMin });
      updated = updated.map(r => r.id === rec.id ? { ...r, end_minute: endMin } : r);
    }
    return updated;
  };

  // ---- Match control ----
  const startMatch = async () => {
    const lineup = lineupMapToArray(lineupMap);
    saveMutation.mutate({ lineup, substitutes, formation, live_status: "live", live_events: [] });

    // Create time records for all starters
    const starterIds = Object.values(lineupMap);
    const records = await createMatchTimeRecords(starterIds, 0);
    setMatchTimeRecords(records);

    setPhase("live");
    setRunning(true);
  };

  const handleToggleClock = () => {
    if (running && currentMinute >= 45 && phase === "live") {
      setRunning(false);
      setPhase("halftime");
      saveMutation.mutate({ live_status: "halftime", live_events: events });
    } else {
      setRunning(!running);
    }
  };

  const handleStop = async () => {
    setRunning(false);
    setPhase("finished");
    const finalScoreHome = events.filter(e => e.type === "goal_mva").length;
    const finalScoreAway = events.filter(e => e.type === "goal_against").length;

    // Close all open time records
    await closeAllOpenRecords(currentMinute, matchTimeRecords);

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

  const handleEvent = async (eventData) => {
    const newEvents = [...events, eventData];
    setEvents(newEvents);
    setActiveModal(null);
    saveMutation.mutate({ live_events: newEvents });

    // Handle substitution time records
    if (eventData.type === "substitution") {
      let records = matchTimeRecords;
      records = await closeMatchTimeRecord(eventData.player_out_id, eventData.minute, records);
      const newRecs = await createMatchTimeRecords([eventData.player_in_id], eventData.minute);
      setMatchTimeRecords([...records, ...newRecs]);
    }
  };

  if (!match && matchId) {
    return (
      <div className="p-8 text-center text-white">
        <p>Wedstrijd niet gevonden.</p>
        <button onClick={() => navigate("/Wedstrijden")} className="btn-primary">Terug</button>
      </div>
    );
  }

  // ---- PRE-GAME ----
  if (phase === "pre") {
    const basisSpelers = Object.values(lineupMap).map(pid => activePlayers.find(p => p.id === pid)).filter(Boolean);
    const wisselSpelers = substitutes.map(pid => activePlayers.find(p => p.id === pid)).filter(Boolean);
    
    return (
      <div style={{ background: "#FFF3E8" }} className="min-h-screen">
        <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6" style={{ paddingBottom: "100px" }}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <div>
              <h1 className="t-page-title">Live Opstelling</h1>
              {match && <p className="t-secondary">vs. {match.opponent}</p>}
            </div>
          </div>

          {match && (
            <>
              {/* Hero Card */}
              <div style={{ background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "20px", color: "#ffffff" }}>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px", opacity: 0.9 }}>Tegenstander</p>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.5px" }}>{match.opponent}</h2>
                  </div>
                  {match.opponent_logo_url && (
                    <img src={match.opponent_logo_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid white", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.9, lineHeight: 1.6 }}>
                  {match.home_away} · {formatNL(match.date)}
                </div>
              </div>

              {/* Basisspelers */}
              <div className="glass p-4 md:p-5" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
                <p className="t-label mb-3">Basisspelers ({basisSpelers.length})</p>
                {basisSpelers.length === 0 ? (
                  <p className="t-secondary-sm">Nog geen basisspelers</p>
                ) : (
                  <div className="space-y-2">
                    {basisSpelers.map((player) => (
                      <div key={player.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(8,208,104,0.12)", border: "1.5px solid rgba(8,208,104,0.25)" }}>
                        <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ background: "rgba(255,104,0,0.15)", border: "2px solid #1a1a1a" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-black">{player.name}</p>
                        </div>
                        <span className="text-xs font-bold text-black">#{player.shirt_number || "-"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wissels */}
              {wisselSpelers.length > 0 && (
                <div className="glass p-4 md:p-5" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
                  <p className="t-label mb-3">Wissels ({wisselSpelers.length})</p>
                  <div className="space-y-2">
                    {wisselSpelers.map((player) => (
                      <div key={player.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(255,214,0,0.15)", border: "1.5px solid rgba(255,214,0,0.30)" }}>
                        <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ background: "rgba(255,104,0,0.15)", border: "2px solid #1a1a1a" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-black">{player.name}</p>
                        </div>
                        <span className="text-xs font-bold text-black">#{player.shirt_number || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Start Wedstrijd Button - Sticky Footer */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#FFF3E8", borderTop: "2.5px solid #1a1a1a", padding: "1rem 1.25rem", paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <button
            onClick={startMatch}
            disabled={Object.keys(lineupMap).length === 0}
            style={{
              background: "#FF6800",
              border: "2.5px solid #1a1a1a",
              borderRadius: "14px",
              boxShadow: "3px 3px 0 #1a1a1a",
              height: "52px",
              width: "100%",
              fontSize: "15px",
              fontWeight: 800,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: Object.keys(lineupMap).length === 0 ? "not-allowed" : "pointer",
              opacity: Object.keys(lineupMap).length === 0 ? 0.5 : 1,
              transition: "all 0.1s"
            }}
          >
            <Play size={18} color="white" />Start Wedstrijd
          </button>
        </div>
      </div>
    );
  }

  // ---- FINISHED ----
  if (phase === "finished") {
    return (
      <div style={{ background: "#FFF3E8" }} className="min-h-screen pb-20 xl:pb-8">
        <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <div>
              <h1 className="t-page-title">Wedstrijdverslag</h1>
              <p className="t-secondary">vs. {match?.opponent}</p>
            </div>
          </div>
          {match && <MatchReport match={{ ...match, live_events: events, halftime_notes: halftimeNotes }} players={activePlayers} />}
          <button onClick={() => navigate("/Planning")} className="btn-primary w-full md:w-auto">Terug naar Planning</button>
        </div>
      </div>
    );
  }

  // ---- HALFTIME ----
  if (phase === "halftime") {
    return (
      <div style={{ background: "#FFF3E8" }} className="min-h-screen pb-20 xl:pb-8">
        <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <h1 className="t-page-title">Rust</h1>
          </div>

          <div className="glass p-5 md:p-6 text-center">
            <p className="t-label mb-3">Ruststand</p>
            <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
          </div>

          <div className="glass p-5 md:p-6 space-y-4">
            <h3 className="t-card-title">Rustbespreking</h3>
            <textarea
              placeholder="Notities voor de rustbespreking..."
              value={halftimeNotes}
              onChange={(e) => setHalftimeNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-2 border-border p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-600"
              style={{ fontSize: "13px", fontFamily: "inherit" }}
            />
            <button
              onClick={startSecondHalf}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>▶</span>Start 2e Helft
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- LIVE MODE ----
  return (
    <div style={{ background: "#FFF3E8" }} className="min-h-screen pb-20 xl:pb-8">
      <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackBtn onClick={() => setRunning(false)} />
          <div>
            <h1 className="t-page-title">Live — vs. {match?.opponent}</h1>
            <p className="t-secondary">{match?.home_away} · {match?.team}</p>
          </div>
        </div>

        {/* Clock */}
        <div className="glass p-5 md:p-6">
          <LiveMatchClock seconds={seconds} running={running} onToggle={handleToggleClock} onStop={handleStop} />
          {currentMinute >= 45 && running && (
            <p className="text-center t-secondary mt-3" style={{ color: "#FF6800" }}>Druk op Pauze om naar de rust te gaan</p>
          )}
        </div>

        {/* Score */}
        <div className="glass p-5 md:p-6">
          <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
        </div>

        {/* Action buttons 2x2 */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* GOAL MVA */}
          <button onClick={() => setActiveModal("goal_mva")} className="h-24 md:h-28 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "rgba(8,208,104,0.12)", border: "2px solid rgba(8,208,104,0.30)" }}>
            <span style={{ fontSize: "24px" }}>⚽</span>
            <span className="font-bold text-xs md:text-sm" style={{ color: "#05a050" }}>GOAL MVA</span>
          </button>

          {/* GOAL TEGEN */}
          <button onClick={() => setActiveModal("goal_against")} className="h-24 md:h-28 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "rgba(255,61,168,0.12)", border: "2px solid rgba(255,61,168,0.30)" }}>
            <span style={{ fontSize: "24px" }}>⚽</span>
            <span className="font-bold text-xs md:text-sm" style={{ color: "#FF3DA8" }}>GOAL TEGEN</span>
          </button>

          {/* WISSEL */}
          <button onClick={() => setActiveModal("substitution")} className="h-24 md:h-28 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "rgba(255,104,0,0.12)", border: "2px solid rgba(255,104,0,0.30)" }}>
            <span style={{ fontSize: "24px" }}>⇄</span>
            <span className="font-bold text-xs md:text-sm" style={{ color: "#FF6800" }}>WISSEL</span>
          </button>

          {/* NOTITIE */}
          <button onClick={() => setActiveModal("note")} className="h-24 md:h-28 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "rgba(26,26,26,0.08)", border: "2px solid rgba(26,26,26,0.15)" }}>
            <span style={{ fontSize: "24px" }}>📝</span>
            <span className="font-bold text-xs md:text-sm" style={{ color: "#1a1a1a" }}>NOTITIE</span>
          </button>
        </div>

        {/* Events log */}
        {events.length > 0 && (
          <div className="glass p-5 md:p-6">
            <h3 className="t-label mb-3">Events</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...events].reverse().map((e, i) => {
                const player = activePlayers.find(p => p.id === e.player_id);
                const playerOut = activePlayers.find(p => p.id === e.player_out_id);
                const playerIn = activePlayers.find(p => p.id === e.player_in_id);
                return (
                  <div key={i} className="flex items-center gap-3 text-xs md:text-sm p-2 rounded-lg" style={{ background: "rgba(255,104,0,0.08)" }}>
                    <span className="font-bold w-8" style={{ color: "#FF6800" }}>{e.minute}'</span>
                    <span className="text-gray-700">
                      {e.type === "goal_mva" && <>⚽ Goal — {player?.name}{e.assist_player_id && ` (assist: ${activePlayers.find(p => p.id === e.assist_player_id)?.name})`}</>}
                      {e.type === "goal_against" && <>⚽ Goal Tegen</>}
                      {e.type === "substitution" && <>⇄ {playerOut?.name} → {playerIn?.name}</>}
                      {e.type === "note" && <>📝 {e.note}</>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals / Bottom sheets */}
      {activeModal === "goal_mva" && (
        <GoalBottomSheet
          players={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers}
          minute={currentMinute}
          onConfirm={handleEvent}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "goal_against" && (
        <GoalAgainstModal
          minute={currentMinute}
          onConfirm={handleEvent}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "substitution" && (
        <SubstitutionBottomSheet
          fieldPlayers={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers}
          benchPlayers={currentBenchPlayers}
          minute={currentMinute}
          onConfirm={handleEvent}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "note" && (
        <NoteModal
          minute={currentMinute}
          onConfirm={handleEvent}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}