import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

// Huidig seizoen: aug t/m jul
function getCurrentSeasonMatchIds(matches) {
  const now = new Date();
  const seasonStart = new Date(now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1, 7, 1);
  return new Set(
    matches
      .filter(m => {
        try { return parseISO(m.date) >= seasonStart; } catch { return false; }
      })
      .map(m => m.id)
  );
}

/**
 * PlayerSeasonStats
 * variant="grid"  → 2x2 grid cards (voor PlayerDashboard)
 * variant="compact" → compacte rij + laatste 5 wedstrijden tijdlijn (voor PlayerDetail)
 */
export default function PlayerSeasonStats({ playerId, variant = "grid" }) {
  const { data: matches = [] } = useQuery({
    queryKey: ["allMatches"],
    queryFn: () => base44.entities.Match.list(),
  });

  const { data: matchTimeRecords = [] } = useQuery({
    queryKey: ["playerMatchTime", playerId],
    queryFn: () => base44.entities.PlayerMatchTime.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  if (!playerId) return null;

  const seasonMatchIds = getCurrentSeasonMatchIds(matches);

  // Goals & Assists uit match live_events
  let goals = 0;
  let assists = 0;
  const matchContributions = {}; // match_id → {goals, assists, minutes}

  matches.forEach(m => {
    if (!seasonMatchIds.has(m.id)) return;
    (m.live_events || []).forEach(ev => {
      if (ev.type === "goal_mva") {
        if (ev.player_id === playerId) {
          goals++;
          if (!matchContributions[m.id]) matchContributions[m.id] = { goals: 0, assists: 0, minutes: 0, date: m.date, opponent: m.opponent };
          matchContributions[m.id].goals = (matchContributions[m.id].goals || 0) + 1;
        }
        if (ev.assist_player_id === playerId) {
          assists++;
          if (!matchContributions[m.id]) matchContributions[m.id] = { goals: 0, assists: 0, minutes: 0, date: m.date, opponent: m.opponent };
          matchContributions[m.id].assists = (matchContributions[m.id].assists || 0) + 1;
        }
      }
    });
  });

  // Speelminuten uit PlayerMatchTime
  const seasonRecords = matchTimeRecords.filter(r => seasonMatchIds.has(r.match_id));
  let totalMinutes = 0;
  const uniqueMatchIds = new Set();

  seasonRecords.forEach(r => {
    if (r.end_minute != null) {
      totalMinutes += r.end_minute - r.start_minute;
    }
    uniqueMatchIds.add(r.match_id);
    if (!matchContributions[r.match_id]) {
      const m = matches.find(x => x.id === r.match_id);
      matchContributions[r.match_id] = { goals: 0, assists: 0, minutes: 0, date: m?.date || "", opponent: m?.opponent || "" };
    }
    if (r.end_minute != null) {
      matchContributions[r.match_id].minutes = (matchContributions[r.match_id].minutes || 0) + (r.end_minute - r.start_minute);
    }
  });

  const wedstrijden = uniqueMatchIds.size;

  // Laatste 5 wedstrijden met bijdrage
  const last5 = Object.entries(matchContributions)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, 5);

  const stats = [
    { label: "Goals", value: goals, icon: "ti-ball-football", color: "#4ade80" },
    { label: "Assists", value: assists, icon: "ti-arrow-right", color: "#60a5fa" },
    { label: "Speelmin.", value: totalMinutes, icon: "ti-clock", color: "#FF8C3A" },
    { label: "Wedstrijden", value: wedstrijden, icon: "ti-trophy", color: "#fbbf24" },
  ];

  if (variant === "grid") {
    return (
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
          Mijn seizoensstatistieken
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.09)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "0.5px solid rgba(255,255,255,0.18)",
              borderRadius: 22,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }} />
              <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.50)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // variant === "compact" — for PlayerDetail
  return (
    <div className="glass p-4 space-y-4">
      <p className="t-label">Seizoensstatistieken</p>

      {/* Compact 4-stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {stats.map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: s.color }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(255,255,255,0.45)", textAlign: "center" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Laatste 5 wedstrijden tijdlijn */}
      {last5.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.40)", marginBottom: 8 }}>Laatste wedstrijden</p>
          <div className="space-y-2">
            {last5.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
                {/* Date */}
                <div style={{ width: 38, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#FF8C3A" }}>
                    {m.date ? (() => { try { return format(parseISO(m.date), "d MMM", { locale: nl }); } catch { return m.date; } })() : "—"}
                  </div>
                </div>
                {/* Opponent */}
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  vs. {m.opponent || "—"}
                </div>
                {/* Stats badges */}
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  {m.minutes > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#FF8C3A", background: "rgba(255,107,0,0.12)", border: "0.5px solid rgba(255,107,0,0.25)", borderRadius: 20, padding: "2px 7px" }}>
                      {m.minutes}'
                    </span>
                  )}
                  {m.goals > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#4ade80", background: "rgba(74,222,128,0.12)", border: "0.5px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "2px 7px" }}>
                      {m.goals}G
                    </span>
                  )}
                  {m.assists > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#60a5fa", background: "rgba(96,165,250,0.12)", border: "0.5px solid rgba(96,165,250,0.25)", borderRadius: 20, padding: "2px 7px" }}>
                      {m.assists}A
                    </span>
                  )}
                  {m.minutes === 0 && m.goals === 0 && m.assists === 0 && (
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}