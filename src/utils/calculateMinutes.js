/**
 * Calculate playing minutes for a player in a single match.
 * Returns { minutes, started, cameOn }
 */
export function calcPlayerMinutesInMatch(match, playerId) {
  const lineup = match.lineup || [];
  const events = match.live_events || [];
  const isFinished = match.live_status === "finished";
  if (!isFinished) return null;

  const MATCH_DURATION = 90;

  const startedInLineup = lineup.some(l => l.player_id === playerId);

  // Find substitution that took this player out
  const subOut = events.find(e => e.type === "substitution" && e.player_out_id === playerId);
  // Find substitution that brought this player in
  const subIn = events.find(e => e.type === "substitution" && e.player_in_id === playerId);

  let minutes = 0;
  let started = false;
  let cameOn = false;

  if (startedInLineup) {
    started = true;
    const endMinute = subOut ? Math.floor(subOut.minute / 60) : MATCH_DURATION;
    minutes = endMinute;
  } else if (subIn) {
    cameOn = true;
    const startMinute = Math.floor(subIn.minute / 60);
    const endMinute = subOut ? Math.floor(subOut.minute / 60) : MATCH_DURATION;
    minutes = Math.max(0, endMinute - startMinute);
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