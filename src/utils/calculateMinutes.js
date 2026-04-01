/**
 * Calculate playing minutes for a player in a single match.
 * Returns { minutes, started, cameOn }
 */
export function calcPlayerMinutesInMatch(match, playerId) {
  const lineup = match.lineup || [];
  const events = match.live_events || [];
  const isFinished = match.live_status === "finished";
  if (!isFinished) return null;

  const halfDuration = match.team === "MO17" ? 40 : 45;
  const MATCH_DURATION = halfDuration * 2;

  const startedInLineup = lineup.some(l => l.slot === "basis" && l.player_id === playerId);

  // Build a sorted list of all substitution events
  const subs = events
    .filter(e => e.type === "substitution")
    .sort((a, b) => a.minute - b.minute);

  let minutes = 0;
  let started = false;
  let cameOn = false;

  // Simulate the player's time on the field through multiple stints
  // A stint starts when the player comes on (or at 0 if starter) and ends when subbed off
  let currentStart = startedInLineup ? 0 : null;
  if (startedInLineup) started = true;

  for (const sub of subs) {
    if (sub.player_in_id === playerId) {
      // Player comes on — start a new stint
      currentStart = sub.minute;
      cameOn = true;
    } else if (sub.player_out_id === playerId && currentStart !== null) {
      // Player goes off — close the current stint
      minutes += Math.max(0, sub.minute - currentStart);
      currentStart = null;
    }
  }

  // If still on field at end of match, close the final stint
  if (currentStart !== null) {
    minutes += Math.max(0, MATCH_DURATION - currentStart);
  }

  return { minutes, started, cameOn };
}

/**
 * Aggregate stats for a player across all finished matches.
 * Returns { totalMinutes, gamesStarted, gamesAsSubstitute, avgMinutes, mo17Minutes, dames1Minutes, matchData[] }
 */
export function calcPlayerSeasonStats(matches, playerId, teamFilter = "all") {
  const finishedMatches = matches.filter(m => {
    if (m.live_status !== "finished") return false;
    if (teamFilter !== "all" && m.team !== teamFilter) return false;
    return true;
  });

  let totalMinutes = 0;
  let gamesStarted = 0;
  let gamesAsSubstitute = 0;
  let mo17Minutes = 0;
  let dames1Minutes = 0;
  const matchData = [];

  for (const match of finishedMatches) {
    const result = calcPlayerMinutesInMatch(match, playerId);
    if (!result) continue;
    const { minutes, started, cameOn } = result;
    if (minutes === 0 && !started && !cameOn) continue;

    totalMinutes += minutes;
    if (started) gamesStarted++;
    if (cameOn) gamesAsSubstitute++;
    if (match.team === "MO17") mo17Minutes += minutes;
    if (match.team === "Dames 1") dames1Minutes += minutes;

    matchData.push({
      matchId: match.id,
      date: match.date,
      opponent: match.opponent,
      team: match.team,
      minutes,
      started,
      cameOn,
    });
  }

  const totalGames = gamesStarted + gamesAsSubstitute;
  const avgMinutes = totalGames > 0 ? Math.round(totalMinutes / totalGames) : 0;

  // Total available minutes (90 per finished match)
  const availableMinutes = finishedMatches.length * 90;
  const minutesPct = availableMinutes > 0 ? (totalMinutes / availableMinutes) * 100 : 0;
  const isAttentionPoint = availableMinutes > 0 && minutesPct < 30;

  return {
    totalMinutes,
    gamesStarted,
    gamesAsSubstitute,
    avgMinutes,
    mo17Minutes,
    dames1Minutes,
    matchData: matchData.sort((a, b) => a.date > b.date ? 1 : -1),
    availableMinutes,
    minutesPct,
    isAttentionPoint,
  };
}