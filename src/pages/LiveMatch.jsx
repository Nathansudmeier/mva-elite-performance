import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Edit2, Play, Goal, ArrowRightLeft, AlertCircle, Clock } from "lucide-react";
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

// Yellow card modal
function YellowCardModal({ minute, onConfirm, onClose, players }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(4px)" }} />
      <div className="glass p-6 w-full max-w-sm space-y-4 rounded-t-3xl" style={{ position: "relative" }}>
        <div className="flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", marginBottom: "8px" }}>
          <span style={{ fontSize: "24px" }}>🟨</span>Gele Kaart — {minute}'
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPlayer(p); onConfirm({ type: "yellow_card", minute, player_id: p.id }); }}
              style={{
                padding: "12px",
                background: selectedPlayer?.id === p.id ? "#FFD600" : "white",
                border: "2px solid #1a1a1a",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "12px",
                color: "#1a1a1a",
                cursor: "pointer"
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full btn-secondary">Annuleren</button>
      </div>
    </div>
  );
}

// Red card modal
function RedCardModal({ minute, onConfirm, onClose, players }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(4px)" }} />
      <div className="glass p-6 w-full max-w-sm space-y-4 rounded-t-3xl" style={{ position: "relative" }}>
        <div className="flex items-center gap-2" style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", marginBottom: "8px" }}>
          <span style={{ fontSize: "24px" }}>🟥</span>Rode Kaart — {minute}'
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPlayer(p); onConfirm({ type: "red_card", minute, player_id: p.id }); }}
              style={{
                padding: "12px",
                background: selectedPlayer?.id === p.id ? "#FF3333" : "white",
                border: "2px solid #1a1a1a",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "12px",
                color: selectedPlayer?.id === p.id ? "white" : "#1a1a1a",
                cursor: "pointer"
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full btn-secondary">Annuleren</button>
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
  const [showField, setShowField] = useState(false);

  // Live state
  const [phase, setPhase] = useState("pre");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [halftimeNotes, setHalftimeNotes] = useState("");
  const [activeModal, setActiveModal] = useState(null);

  // PlayerMatchTime records tracked locally
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

  const currentFieldPlayers = activePlayers.filter(p =>
    (lineupPlayerIds.includes(p.id) && !substitutedOut.includes(p.id)) || substitutedIn.includes(p.id)
  );
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
    const POSITION_ORDER = { "Keeper": 0, "Centrale Verdediger": 1, "Linksback": 2, "Rechtsback": 3, "Controleur": 4, "Middenvelder": 5, "Aanvallende Middenvelder": 6, "Linksbuiten": 7, "Rechtsbuiten": 8, "Spits": 9 };
    const basisSpelers = Object.values(lineupMap)
      .map(pid => activePlayers.find(p => p.id === pid))
      .filter(Boolean)
      .sort((a, b) => (POSITION_ORDER[a.position] ?? 10) - (POSITION_ORDER[b.position] ?? 10));
    const wisselSpelers = substitutes.map(pid => activePlayers.find(p => p.id === pid)).filter(Boolean);
    const hasLineup = Object.keys(lineupMap).length > 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#FFF3E8" }}>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <BackBtn onClick={() => navigate("/Planning")} />
            <div>
              <h1 className="t-page-title">Live Opstelling</h1>
              {match && <p className="t-secondary">vs. {match.opponent}</p>}
            </div>
          </div>

          {match && (
            <>
              {/* Wedstrijdinfo Card */}
              <div style={{ background: "white", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem", marginBottom: "12px" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a", marginBottom: "4px" }}>{match.opponent}</p>
                    <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.50)", fontWeight: 600 }}>{match.home_away} · {formatNL(match.date)}</p>
                  </div>
                  {match.opponent_logo_url && (
                    <img src={match.opponent_logo_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid #1a1a1a", objectFit: "cover", flexShrink: 0 }} />
                  )}
                </div>
                <span style={{ background: "#FF6800", color: "white", border: "1.5px solid #1a1a1a", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 800, display: "inline-block", marginTop: "8px" }}>
                  {formation}
                </span>
              </div>

              {/* Empty state or Basisspelers */}
              {!hasLineup ? (
                <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", color: "#1a1a1a", marginBottom: "8px" }}>⚠️</div>
                  <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", marginBottom: "4px" }}>Geen opstelling ingesteld</p>
                  <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>Stel eerst een opstelling in via de wedstrijd detail pagina</p>
                </div>
              ) : (
                <>
                  {/* Basisspelers Section */}
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", letterSpacing: "0.07em", marginBottom: "8px" }}>BASIS ({basisSpelers.length})</p>
                    <div style={{ background: "white", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
                      {basisSpelers.map((player, idx) => (
                        <div key={player.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderBottom: idx < basisSpelers.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none" }}>
                          <img src={player.photo_url} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #1a1a1a", objectFit: "cover", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>{player.name}</p>
                          </div>
                          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FF6800", border: "2.5px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "18px", fontWeight: 900, color: "white", lineHeight: 1 }}>
                              {player.shirt_number || "-"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wissels Section */}
                  {wisselSpelers.length > 0 && (
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", letterSpacing: "0.07em", marginBottom: "8px" }}>WISSELS ({wisselSpelers.length})</p>
                      <div style={{ background: "white", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
                        {wisselSpelers.map((player, idx) => (
                          <div key={player.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderBottom: idx < wisselSpelers.length - 1 ? "1.5px solid rgba(26,26,26,0.06)" : "none" }}>
                            <img src={player.photo_url} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #1a1a1a", objectFit: "cover", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>{player.name}</p>
                            </div>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FF6800", border: "2.5px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: "18px", fontWeight: 900, color: "white", lineHeight: 1 }}>
                                {player.shirt_number || "-"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Sticky button footer */}
        <div style={{ flexShrink: 0, padding: "1rem 1.25rem", paddingBottom: "calc(1rem + 80px + env(safe-area-inset-bottom))", background: "#FFF3E8", borderTop: "2.5px solid #1a1a1a" }}>
          <button
            onClick={startMatch}
            disabled={!hasLineup}
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
              cursor: hasLineup ? "pointer" : "not-allowed",
              opacity: hasLineup ? 1 : 0.5,
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

        {/* Clock - Orange */}
        <div style={{ background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "20px 24px" }}>
          <LiveMatchClock seconds={seconds} running={running} onToggle={handleToggleClock} onStop={handleStop} />
          {currentMinute >= 45 && running && (
            <p className="text-center t-secondary mt-3" style={{ color: "white" }}>Druk op Pauze om naar de rust te gaan</p>
          )}
        </div>

        {/* Score - Blue */}
        <div style={{ background: "#00C2FF", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "20px 24px" }}>
          <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
        </div>

        {/* Action buttons 3x2 */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {/* GOAL MVA - Green */}
          <button onClick={() => setActiveModal("goal_mva")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a" }}>
            <Goal size={22} color="white" strokeWidth={3} />
            <span className="font-bold text-xs" style={{ color: "white" }}>GOAL</span>
          </button>

          {/* GOAL TEGEN - Pink */}
          <button onClick={() => setActiveModal("goal_against")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#FF3DA8", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a" }}>
            <Goal size={22} color="white" strokeWidth={3} />
            <span className="font-bold text-xs" style={{ color: "white" }}>TEGEN</span>
          </button>

          {/* WISSEL - Orange */}
          <button onClick={() => setActiveModal("substitution")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a" }}>
            <ArrowRightLeft size={22} color="white" strokeWidth={3} />
            <span className="font-bold text-xs" style={{ color: "white" }}>WISSEL</span>
          </button>

          {/* GELE KAART - Yellow */}
          <button onClick={() => setActiveModal("yellow_card")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a" }}>
            <AlertCircle size={22} color="#1a1a1a" strokeWidth={3} />
            <span className="font-bold text-xs" style={{ color: "#1a1a1a" }}>GEEL</span>
          </button>

          {/* RODE KAART - Red */}
          <button onClick={() => setActiveModal("red_card")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#FF3333", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a" }}>
            <AlertCircle size={22} color="white" strokeWidth={3} />
            <span className="font-bold text-xs" style={{ color: "white" }}>ROOD</span>
          </button>

          {/* NOTITIE - Dark */}
          <button onClick={() => setActiveModal("note")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#1a1a1a", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a" }}>
            <Edit2 size={22} color="white" strokeWidth={3} />
            <span className="font-bold text-xs" style={{ color: "white" }}>NOTITIE</span>
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
                  <div key={i} className="flex items-center gap-3 text-xs md:text-sm p-3 rounded-lg" style={{ background: "white", border: "1.5px solid rgba(26,26,26,0.08)" }}>
                    <span className="font-bold w-8" style={{ color: "#FF6800", fontSize: "12px" }}>{e.minute}'</span>
                    <span style={{ color: "#1a1a1a", fontWeight: 600 }}>
                      {e.type === "goal_mva" && <>⚽ Goal — {player?.name}{e.assist_player_id && ` (assist: ${activePlayers.find(p => p.id === e.assist_player_id)?.name})`}</>}
                      {e.type === "goal_against" && <>⚽ Goal Tegen</>}
                      {e.type === "substitution" && <>⇄ {playerOut?.name} → {playerIn?.name}</>}
                      {e.type === "yellow_card" && <>🟨 {player?.name} Gele kaart</>}
                      {e.type === "red_card" && <>🟥 {player?.name} Rode kaart</>}
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
      {activeModal === "yellow_card" && (
        <YellowCardModal
          minute={currentMinute}
          players={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers}
          onConfirm={handleEvent}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "red_card" && (
        <RedCardModal
          minute={currentMinute}
          players={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers}
          onConfirm={handleEvent}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}