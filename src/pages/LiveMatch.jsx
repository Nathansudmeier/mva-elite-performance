import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
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

// Simple note modal overlay
function NoteModal({ minute, onConfirm, onClose }) {
  const [note, setNote] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", ...glassCard, padding: 24, width: "100%", maxWidth: 360 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          <i className="ti ti-pencil" style={{ marginRight: 8 }} />Notitie — {minute}'
        </div>
        <textarea
          placeholder="Tactische observatie..."
          value={note}
          onChange={e => setNote(e.target.value)}
          autoFocus
          rows={4}
          style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "#fff", padding: "10px 14px", fontSize: 13, outline: "none", resize: "none" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, height: 44, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "rgba(255,255,255,0.70)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Annuleren</button>
          <button onClick={() => { if (note.trim()) onConfirm({ type: "note", minute, note }); }} disabled={!note.trim()}
            style={{ flex: 1, height: 44, background: note.trim() ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.20)", borderRadius: 14, color: note.trim() ? "#fff" : "rgba(255,255,255,0.30)", fontSize: 14, fontWeight: 600, cursor: note.trim() ? "pointer" : "not-allowed" }}>
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
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", ...glassCard, padding: 24, width: "100%", maxWidth: 320, textAlign: "center" }}>
        <i className="ti ti-ball-football" style={{ fontSize: 40, color: "#f87171", marginBottom: 12, display: "block" }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>Goal Tegen — {minute}'</div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", marginBottom: 20 }}>Goal registreren op minuut {minute}?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 44, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "rgba(255,255,255,0.70)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Annuleren</button>
          <button onClick={() => onConfirm({ type: "goal_against", minute })}
            style={{ flex: 1, height: 44, background: "rgba(248,113,113,0.20)", border: "0.5px solid rgba(248,113,113,0.35)", borderRadius: 14, color: "#f87171", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
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
    return (
      <div className="relative min-h-screen pb-24">
        <img src={BG_URL} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
        <div className="relative z-10 space-y-5 p-4">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Live Wedstrijd</h1>
              {match && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>vs. {match.opponent} · {formatNL(match.date)}</p>}
            </div>
          </div>

          {match && (
            <div style={{ ...glassCard, padding: "20px" }} className="space-y-5">
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

              <div>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#FF8C3A", marginBottom: 8 }}>Opstelling</p>

                {/* Desktop toggle */}
                <div className="hidden xl:flex" style={{ gap: 8, marginBottom: 12 }}>
                  <button
                    onClick={() => setShowField(false)}
                    style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: !showField ? "#FF6B00" : "rgba(255,255,255,0.08)", color: !showField ? "#fff" : "rgba(255,255,255,0.60)" }}
                  >Spelerslijst</button>
                  <button
                    onClick={() => setShowField(true)}
                    style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: showField ? "#FF6B00" : "rgba(255,255,255,0.08)", color: showField ? "#fff" : "rgba(255,255,255,0.60)" }}
                  >Toon veld</button>
                </div>

                {/* Mobile/tablet: always player list */}
                <div className="xl:hidden">
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, overflow: "hidden", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                    <LineupPlayerList
                      players={activePlayers}
                      lineupMap={lineupMap}
                      substitutes={substitutes}
                      formation={formation}
                      onLineupChange={setLineupMap}
                      onSubstitutesChange={setSubstitutes}
                      onFormationChange={setFormation}
                    />
                  </div>
                </div>

                {/* Desktop: conditionally show list or field */}
                <div className="hidden xl:block">
                  {showField ? (
                    <>
                      <div style={{ height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                        <FieldLineup players={activePlayers} lineupMap={lineupMap} formation={formation} onLineupChange={setLineupMap} />
                      </div>
                      <SubstitutesPicker players={activePlayers} lineupMap={lineupMap} substitutes={substitutes} onSubstitutesChange={setSubstitutes} />
                    </>
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, overflow: "hidden", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                      <LineupPlayerList
                        players={activePlayers}
                        lineupMap={lineupMap}
                        substitutes={substitutes}
                        formation={formation}
                        onLineupChange={setLineupMap}
                        onSubstitutesChange={setSubstitutes}
                        onFormationChange={setFormation}
                      />
                    </div>
                  )}
                </div>
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

  // ---- FINISHED ----
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
          <button onClick={() => navigate("/Planning")} className="btn-primary">Terug naar Planning</button>
        </div>
      </div>
    );
  }

  // ---- HALFTIME ----
  if (phase === "halftime") {
    return (
      <div className="relative min-h-screen pb-24">
        <img src={BG_URL} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
        <div className="relative z-10 space-y-5 p-4">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/Planning")} />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Rust</h1>
          </div>

          <div style={{ ...glassCard, padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.50)", marginBottom: 12 }}>Ruststand</p>
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

  // ---- LIVE MODE ----
  return (
    <div className="relative min-h-screen pb-24">
      <img src={BG_URL} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
      <div className="relative z-10 space-y-4 p-4">
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
            <p style={{ textAlign: "center", fontSize: 12, marginTop: 10, color: "#FF8C3A" }}>Druk op Pauze om naar de rust te gaan</p>
          )}
        </div>

        {/* Score */}
        <div style={{ ...glassCard, padding: "16px 24px" }}>
          <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
        </div>

        {/* Action buttons 2x2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* GOAL MVA */}
          <button onClick={() => setActiveModal("goal_mva")} style={{
            height: 100, borderRadius: 18, background: "rgba(74,222,128,0.15)", border: "0.5px solid rgba(74,222,128,0.30)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <i className="ti ti-ball-football" style={{ fontSize: 28, color: "#4ade80" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "#4ade80" }}>GOAL MVA</span>
          </button>

          {/* GOAL TEGEN */}
          <button onClick={() => setActiveModal("goal_against")} style={{
            height: 100, borderRadius: 18, background: "rgba(248,113,113,0.15)", border: "0.5px solid rgba(248,113,113,0.30)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <i className="ti ti-ball-football" style={{ fontSize: 28, color: "#f87171" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "#f87171" }}>GOAL TEGEN</span>
          </button>

          {/* WISSEL */}
          <button onClick={() => setActiveModal("substitution")} style={{
            height: 100, borderRadius: 18, background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.30)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <i className="ti ti-arrows-exchange" style={{ fontSize: 28, color: "#FF8C3A" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "#FF8C3A" }}>WISSEL</span>
          </button>

          {/* NOTITIE */}
          <button onClick={() => setActiveModal("note")} style={{
            height: 100, borderRadius: 18, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <i className="ti ti-pencil" style={{ fontSize: 28, color: "rgba(255,255,255,0.70)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "rgba(255,255,255,0.70)" }}>NOTITIE</span>
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
                      {e.type === "goal_mva" && <><i className="ti ti-ball-football" style={{ marginRight: 4 }} />Goal — {player?.name}{e.assist_player_id && ` (assist: ${activePlayers.find(p => p.id === e.assist_player_id)?.name})`}</>}
                      {e.type === "goal_against" && <><i className="ti ti-ball-football" style={{ marginRight: 4, color: "#f87171" }} />Goal Tegen</>}
                      {e.type === "substitution" && <><i className="ti ti-arrows-exchange" style={{ marginRight: 4, color: "#FF8C3A" }} />{playerOut?.name} → {playerIn?.name}</>}
                      {e.type === "note" && <><i className="ti ti-pencil" style={{ marginRight: 4 }} />{e.note}</>}
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