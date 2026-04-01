import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Goal, ArrowRightLeft, AlertCircle, Play, Pause, Square } from "lucide-react";
import LiveMatchClock from "../components/live/LiveMatchClock";
import LiveScore from "../components/live/LiveScore";
import GoalBottomSheet from "../components/live/GoalBottomSheet";
import SubstitutionBottomSheet from "../components/live/SubstitutionBottomSheet";
import MatchReport from "../components/live/MatchReport";
import { NoteModal, GoalAgainstModal, YellowCardModal, RedCardModal } from "../components/live/EventModals";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

function formatNL(dateStr) {
  if (!dateStr) return "";
  try { return format(parseISO(dateStr), "EEEE d MMMM yyyy", { locale: nl }); } catch { return dateStr; }
}

const POSITION_ORDER = { "Keeper": 0, "Centrale Verdediger": 1, "Linksback": 2, "Rechtsback": 3, "Controleur": 4, "Middenvelder": 5, "Aanvallende Middenvelder": 6, "Linksbuiten": 7, "Rechtsbuiten": 8, "Spits": 9 };

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
  const { data: existingMatchTimeRecords = [] } = useQuery({
    queryKey: ["playerMatchTime", matchId],
    queryFn: () => base44.entities.PlayerMatchTime.filter({ match_id: matchId }),
    enabled: !!matchId,
  });

  const activePlayers = players.filter(p => p.active !== false);
  const match = matches.find(m => m.id === matchId);

  // State
  const [phase, setPhase] = useState("pre");
  const [lineupMap, setLineupMap] = useState({});
  const [substitutes, setSubstitutes] = useState([]);
  const [formation, setFormation] = useState("4-3-3");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [halftimeNotes, setHalftimeNotes] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [matchTimeRecords, setMatchTimeRecords] = useState([]);

  // Sync matchTimeRecords from DB when they load (e.g. page reload during live match)
  useEffect(() => {
    if (existingMatchTimeRecords.length > 0 && matchTimeRecords.length === 0) {
      setMatchTimeRecords(existingMatchTimeRecords);
    }
  }, [existingMatchTimeRecords]);

  const intervalRef = useRef(null);
  const startRef = useRef(null);
  const baseSecondsRef = useRef(0);
  const wakeLockRef = useRef(null);

  const isMatchActive = phase === "live";

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock niet beschikbaar:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && isMatchActive) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      releaseWakeLock();
    };
  }, [isMatchActive]);

  useEffect(() => {
    if (match) {
      // lineup = array [{player_id, slot}] waarbij slot "basis" of "wissel" is
      // Basisspelers: slot === "basis", wissels: slot === "wissel"
      let basis = {};
      let wisselIds = [];
      if (Array.isArray(match.lineup)) {
        match.lineup
          .filter(e => e.slot === "basis" && e.player_id)
          .forEach((e, i) => { basis[`POS${i}`] = e.player_id; });
        wisselIds = match.lineup
          .filter(e => e.slot === "wissel" && e.player_id)
          .map(e => e.player_id);
      }
      const wissel = wisselIds.length > 0 ? wisselIds : (match.substitutes || match.wissel || []);
      
      setLineupMap(basis);
      setSubstitutes(wissel);
      setFormation(match.formation || "4-3-3");
      if (match.live_events) setEvents(match.live_events);
      if (match.halftime_notes) setHalftimeNotes(match.halftime_notes);

      const status = match.live_status;
      if (status && status !== "pre") setPhase(status);

      const halfLength = match.team === "MO17" ? 40 : 45;
      if (status === "live") {
        if (match.second_half_started_at) {
          const elapsed = Math.floor((Date.now() - new Date(match.second_half_started_at).getTime()) / 1000);
          setSeconds(halfLength * 60 + elapsed);
        } else if (match.first_half_started_at) {
          const elapsed = Math.floor((Date.now() - new Date(match.first_half_started_at).getTime()) / 1000);
          setSeconds(elapsed);
        }
        setRunning(true);
      } else if (status === "halftime") {
        setSeconds(halfLength * 60);
        setRunning(false);
      }
    }
  }, [match?.id]);

  useEffect(() => {
    if (running) {
      // Store the wall-clock start time and current seconds so we can compute elapsed time correctly
      // even when the screen turns off or the tab is backgrounded (setInterval pauses in that case)
      startRef.current = Date.now();
      baseSecondsRef.current = seconds;

      const tick = () => {
        const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
        setSeconds(baseSecondsRef.current + elapsed);
      };

      intervalRef.current = setInterval(tick, 1000);

      // Also sync when the screen/tab becomes visible again
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
          setSeconds(baseSecondsRef.current + elapsed);
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        clearInterval(intervalRef.current);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    } else {
      clearInterval(intervalRef.current);
    }
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

  const startMatch = async () => {
    const lineup = lineupMapToArray(lineupMap);
    saveMutation.mutate({ lineup, substitutes, formation, live_status: "live", live_events: [] });

    const starterIds = Object.values(lineupMap);
    const records = await createMatchTimeRecords(starterIds, 0);
    setMatchTimeRecords(records);

    setPhase("live");
    setRunning(true);
    await requestWakeLock();
  };

  const getHalfLengthMinutes = () => match?.team === "MO17" ? 40 : 45;

  const handleToggleClock = () => {
    const halfLength = getHalfLengthMinutes();
    if (running && currentMinute >= halfLength && phase === "live") {
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
    await releaseWakeLock();
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

  const startSecondHalf = async () => {
    const halfLength = getHalfLengthMinutes();
    setSeconds(halfLength * 60);
    setPhase("live");
    setRunning(true);
    saveMutation.mutate({ live_status: "live", halftime_notes: halftimeNotes, live_events: events });
    await requestWakeLock();
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
      <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto">
        <div className="glass p-6 text-center">
          <p className="t-section-title">Wedstrijd niet gevonden</p>
          <button onClick={() => navigate("/Planning")} className="btn-primary mt-4">Terug</button>
        </div>
      </div>
    );
  }

  // ---- PRE-GAME ----
  if (phase === "pre") {
    const basisSpelers = Object.values(lineupMap)
      .map(pid => activePlayers.find(p => p.id === pid))
      .filter(Boolean)
      .sort((a, b) => (POSITION_ORDER[a.position] ?? 10) - (POSITION_ORDER[b.position] ?? 10));
    const wisselSpelers = substitutes.map(pid => activePlayers.find(p => p.id === pid)).filter(Boolean);
    const hasLineup = Object.keys(lineupMap).length > 0;

    return (
      <div style={{ background: "#FFF3E8" }} className="min-h-screen pb-20 xl:pb-8">
        <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/Planning")} className="w-9 h-9 rounded-full flex items-center justify-center border-2" style={{ borderColor: "#FF6800" }}>
              <ChevronLeft size={18} style={{ color: "#FF6800" }} />
            </button>
            <div>
              <h1 className="t-page-title">Live Opstelling</h1>
              {match && <p className="t-secondary">vs. {match.opponent}</p>}
            </div>
          </div>

          {match && (
            <>
              {/* Match info card */}
              <div className="glass p-5 md:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a" }}>{match.opponent}</p>
                    <p className="t-secondary">{match.home_away} • {formatNL(match.date)}</p>
                  </div>
                  {match.opponent_logo_url && (
                    <img src={match.opponent_logo_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #1a1a1a", objectFit: "cover" }} />
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span style={{ background: "#FF6800", color: "white", border: "1.5px solid #1a1a1a", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 800, display: "inline-block" }}>
                    {formation}
                  </span>
                  {hasLineup && (
                    <button onClick={startMatch} className="btn-primary" style={{ flex: 1, height: "40px", fontSize: "14px" }}>
                      <Play size={16} /> Start
                    </button>
                  )}
                </div>
              </div>

              {/* Lineup or empty state */}
              {!hasLineup ? (
                <div className="glass-alert p-5 md:p-6 text-center">
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</p>
                  <p className="t-section-title">Geen opstelling ingesteld</p>
                  <p className="t-secondary mt-2">Stel eerst een opstelling in via de wedstrijd detail pagina</p>
                </div>
              ) : (
                <>
                  {/* Basis */}
                  <div>
                    <p className="t-label mb-3">BASIS ({basisSpelers.length})</p>
                    <div className="glass p-0 overflow-hidden">
                      {basisSpelers.map((player, i) => (
                        <div key={player.id} style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                          borderBottom: i < basisSpelers.length - 1 ? "1.5px solid rgba(26,26,26,0.08)" : "none"
                        }}>
                          <img src={player.photo_url || "https://via.placeholder.com/36"} alt="" style={{
                            width: 36, height: 36, borderRadius: "50%", border: "2px solid #1a1a1a", objectFit: "cover"
                          }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{player.name}</p>
                          </div>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", background: "#FF6800", border: "2.5px solid #1a1a1a",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>{player.shirt_number || "-"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wissel */}
                  {wisselSpelers.length > 0 && (
                    <div>
                      <p className="t-label mb-3">WISSELS ({wisselSpelers.length})</p>
                      <div className="glass p-0 overflow-hidden">
                        {wisselSpelers.map((player, i) => (
                          <div key={player.id} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                            borderBottom: i < wisselSpelers.length - 1 ? "1.5px solid rgba(26,26,26,0.08)" : "none"
                          }}>
                            <img src={player.photo_url || "https://via.placeholder.com/36"} alt="" style={{
                              width: 36, height: 36, borderRadius: "50%", border: "2px solid #1a1a1a", objectFit: "cover"
                            }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{player.name}</p>
                            </div>
                            <div style={{
                              width: 36, height: 36, borderRadius: "50%", background: "#08D068", border: "2.5px solid #1a1a1a",
                              display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                              <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>{player.shirt_number || "-"}</span>
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


      </div>
    );
  }

  // ---- FINISHED ----
  if (phase === "finished") {
    return (
      <div style={{ background: "#FFF3E8" }} className="min-h-screen pb-20 xl:pb-8">
        <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/Planning")} className="w-9 h-9 rounded-full flex items-center justify-center border-2" style={{ borderColor: "#FF6800" }}>
              <ChevronLeft size={18} style={{ color: "#FF6800" }} />
            </button>
            <div>
              <h1 className="t-page-title">Wedstrijdverslag</h1>
              <p className="t-secondary">vs. {match?.opponent}</p>
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
      <div style={{ background: "#FFF3E8" }} className="min-h-screen pb-20 xl:pb-8">
        <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/Planning")} className="w-9 h-9 rounded-full flex items-center justify-center border-2" style={{ borderColor: "#FF6800" }}>
              <ChevronLeft size={18} style={{ color: "#FF6800" }} />
            </button>
            <h1 className="t-page-title">Rust</h1>
          </div>

          <div className="glass-orange p-5 md:p-6 text-center" style={{ color: "white" }}>
            <p className="t-label mb-3">RUSTSTAND</p>
            <div style={{ fontSize: "42px", fontWeight: 900, marginBottom: "12px" }}>
              {scoreHome} — {scoreAway}
            </div>
            <p style={{ fontSize: "14px", fontWeight: 700 }}>{match?.opponent}</p>
          </div>

          <div className="glass p-5 md:p-6 space-y-4">
            <h3 className="t-card-title">Rustbespreking</h3>
            <textarea
              placeholder="Notities voor de rustbespreking..."
              value={halftimeNotes}
              onChange={(e) => setHalftimeNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-2 border-border p-3 resize-none focus:outline-none focus:ring-2"
              style={{ fontSize: "13px", borderColor: "#1a1a1a" }}
            />
            <button onClick={startSecondHalf} className="btn-primary flex items-center justify-center gap-2">
              <Play size={18} /> Start 2e Helft
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- LIVE MODE ----
  return (
    <div style={{ background: "#FFF3E8" }} className="min-h-screen pb-20 xl:pb-8">
      <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setRunning(false)} className="w-9 h-9 rounded-full flex items-center justify-center border-2" style={{ borderColor: "#FF6800" }}>
            <ChevronLeft size={18} style={{ color: "#FF6800" }} />
          </button>
          <div>
            <h1 className="t-page-title">Live — vs. {match?.opponent}</h1>
            <p className="t-secondary">{match?.home_away} • {match?.team}</p>
          </div>
        </div>

        {/* Clock */}
        <div className="card-orange p-5 md:p-6" style={{ color: "white" }}>
          <LiveMatchClock seconds={seconds} running={running} onToggle={handleToggleClock} onStop={handleStop} />
          {currentMinute >= getHalfLengthMinutes() && running && (
            <p className="text-center" style={{ fontSize: "12px", color: "white", marginTop: "12px" }}>Druk op Pauze om naar de rust te gaan</p>
          )}
        </div>

        {/* Score */}
        <div className="card-blue p-5 md:p-6" style={{ color: "white" }}>
          <LiveScore scoreHome={scoreHome} scoreAway={scoreAway} opponent={match?.opponent} />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <button onClick={() => setActiveModal("goal_mva")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 card-green" style={{ color: "white" }}>
            <Goal size={22} strokeWidth={3} />
            <span className="font-bold text-xs">GOAL</span>
          </button>

          <button onClick={() => setActiveModal("goal_against")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 card-pink" style={{ color: "white" }}>
            <Goal size={22} strokeWidth={3} />
            <span className="font-bold text-xs">TEGEN</span>
          </button>

          <button onClick={() => setActiveModal("substitution")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 card-orange" style={{ color: "white" }}>
            <ArrowRightLeft size={22} strokeWidth={3} />
            <span className="font-bold text-xs">WISSEL</span>
          </button>

          <button onClick={() => setActiveModal("yellow_card")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 card-yellow" style={{ color: "#1a1a1a" }}>
            <AlertCircle size={22} strokeWidth={3} />
            <span className="font-bold text-xs">GEEL</span>
          </button>

          <button onClick={() => setActiveModal("red_card")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2" style={{ background: "#FF3333", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", color: "white" }}>
            <AlertCircle size={22} strokeWidth={3} />
            <span className="font-bold text-xs">ROOD</span>
          </button>

          <button onClick={() => setActiveModal("note")} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 card-black" style={{ color: "white" }}>
            <AlertCircle size={22} strokeWidth={3} />
            <span className="font-bold text-xs">NOTITIE</span>
          </button>

          <button onClick={() => handleEvent({ type: "chance_mva", minute: currentMinute })} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 card-blue" style={{ color: "white" }}>
            <span style={{ fontSize: "22px" }}>🎯</span>
            <span className="font-bold text-xs">KANS</span>
          </button>

          <button onClick={() => handleEvent({ type: "chance_against", minute: currentMinute })} className="h-20 md:h-24 flex flex-col items-center justify-center gap-2" style={{ background: "#9B5CFF", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", color: "white" }}>
            <span style={{ fontSize: "22px" }}>🎯</span>
            <span className="font-bold text-xs">KANS TEGEN</span>
          </button>
        </div>

        {/* Events log */}
        {events.length > 0 && (
          <div className="glass p-5 md:p-6">
            <h3 className="t-label mb-3">EVENTS</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...events].reverse().map((e, i) => {
                const player = activePlayers.find(p => p.id === e.player_id);
                const playerOut = activePlayers.find(p => p.id === e.player_out_id);
                const playerIn = activePlayers.find(p => p.id === e.player_in_id);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "white", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: "12px", fontSize: "12px" }}>
                    <span style={{ fontWeight: 900, color: "#FF6800", fontSize: "12px", minWidth: "24px" }}>{e.minute}'</span>
                    <span style={{ color: "#1a1a1a", fontWeight: 600, flex: 1 }}>
                      {e.type === "goal_mva" && <>⚽ {e.goal_type === "penalty" ? "Penalty" : e.goal_type === "vrije_trap" ? "Vrije Trap" : e.goal_type === "corner" ? "Corner" : e.goal_type === "eigen_doelpunt" ? "Eigen Doelpunt 🤦" : "Goal"}{e.goal_type !== "eigen_doelpunt" && ` — ${player?.name || ""}`}{e.assist_player_id && ` (assist: ${activePlayers.find(p => p.id === e.assist_player_id)?.name})`}</>}
                      {e.type === "goal_against" && <>⚽ {e.goal_type === "penalty" ? "Penalty" : e.goal_type === "vrije_trap" ? "Vrije Trap" : e.goal_type === "corner" ? "Corner" : "Goal"} Tegen</>}
                      {e.type === "chance_mva" && <>🎯 Kans</>}
                      {e.type === "chance_against" && <>🎯 Kans Tegenstander</>}
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

      {/* Modals */}
      {activeModal === "goal_mva" && <GoalBottomSheet players={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers} minute={currentMinute} onConfirm={handleEvent} onClose={() => setActiveModal(null)} />}
      {activeModal === "goal_against" && <GoalAgainstModal minute={currentMinute} onConfirm={handleEvent} onClose={() => setActiveModal(null)} />}
      {activeModal === "substitution" && <SubstitutionBottomSheet fieldPlayers={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers} benchPlayers={currentBenchPlayers} minute={currentMinute} onConfirm={handleEvent} onClose={() => setActiveModal(null)} />}
      {activeModal === "note" && <NoteModal minute={currentMinute} onConfirm={handleEvent} onClose={() => setActiveModal(null)} />}
      {activeModal === "yellow_card" && <YellowCardModal minute={currentMinute} players={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers} onConfirm={handleEvent} onClose={() => setActiveModal(null)} />}
      {activeModal === "red_card" && <RedCardModal minute={currentMinute} players={currentFieldPlayers.length > 0 ? currentFieldPlayers : activePlayers} onConfirm={handleEvent} onClose={() => setActiveModal(null)} />}
    </div>
  );
}