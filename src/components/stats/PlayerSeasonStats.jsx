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

  const STAT_COLORS = ["#FF3DA8", "#9B5CFF", "#FF6800", "#FFD600"];

  if (variant === "grid") {
    return (
      <div>
        <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.50)", marginBottom: 10 }}>
          Mijn seizoensstatistieken
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              background: STAT_COLORS[i],
              border: "2.5px solid #1a1a1a",
              borderRadius: 18,
              boxShadow: "3px 3px 0 #1a1a1a",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}>
              <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", letterSpacing: "0.10em" }}>{s.label}</p>
              <div style={{ fontSize: 34, fontWeight: 900, color: i === 3 ? "#1a1a1a" : "#ffffff", letterSpacing: "-2px", lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // variant === "compact" — for PlayerDetail
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Big Stats Cards - 2x2 Grid */}
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { label: "Goals", value: goals, bg: "#4ade80" },
            { label: "Assists", value: assists, bg: "#60a5fa" },
            { label: "Speelminuten", value: totalMinutes, bg: "#FF8C3A" },
            { label: "Wedstrijden", value: wedstrijden, bg: "#fbbf24" }
          ].map((s, i) => (
            <div key={s.label} style={{
              background: "#ffffff",
              border: "2.5px solid #1a1a1a",
              borderRadius: "16px",
              boxShadow: "3px 3px 0 #1a1a1a",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}>
              <p style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(26,26,26,0.50)" }}>
                {s.label}
              </p>
              <p style={{ fontSize: "32px", fontWeight: 900, color: s.bg, letterSpacing: "-1.5px", lineHeight: 1 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Laatste 5 wedstrijden */}
      {last5.length > 0 && (
        <div className="glass p-4">
          <p className="t-label" style={{ marginBottom: "12px" }}>Recente wedstrijden</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {last5.map(m => (
              <div key={m.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "14px",
                border: "1.5px solid rgba(26,26,26,0.12)",
                background: "rgba(255,255,255,0.50)"
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px" }}>
                    vs. {m.opponent || "—"}
                  </p>
                  <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(26,26,26,0.50)" }}>
                    {m.date ? (() => { try { return format(parseISO(m.date), "d MMMM yyyy", { locale: nl }); } catch { return m.date; } })() : "—"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  {m.minutes > 0 && (
                    <div style={{
                      background: "#FF6800",
                      color: "#ffffff",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "1.5px solid #1a1a1a"
                    }}>
                      {m.minutes}min
                    </div>
                  )}
                  {m.goals > 0 && (
                    <div style={{
                      background: "#08D068",
                      color: "#1a1a1a",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "1.5px solid #1a1a1a"
                    }}>
                      ⚽ {m.goals}
                    </div>
                  )}
                  {m.assists > 0 && (
                    <div style={{
                      background: "#00C2FF",
                      color: "#1a1a1a",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "1.5px solid #1a1a1a"
                    }}>
                      🎯 {m.assists}
                    </div>
                  )}
                  {m.minutes === 0 && m.goals === 0 && m.assists === 0 && (
                    <div style={{ fontSize: "10px", color: "rgba(26,26,26,0.40)" }}>—</div>
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