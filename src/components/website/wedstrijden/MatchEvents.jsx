import React from "react";

/**
 * Toont doelpunten (+ assists), wissels en kaarten van een gespeelde wedstrijd.
 * Werkt op basis van match.live_events (zoals bijgehouden in de live tracker).
 */
export default function MatchEvents({ match, players }) {
  const events = Array.isArray(match?.live_events) ? match.live_events : [];
  if (events.length === 0) return null;

  const playerById = (pid) => players.find((p) => p.id === pid);
  const playerName = (pid) => playerById(pid)?.name || "Onbekend";

  const goals = events.filter((e) => e.type === "goal" || e.type === "doelpunt");
  const subs = events.filter(
    (e) => e.type === "substitution" || e.type === "wissel"
  );
  const yellows = events.filter(
    (e) => e.type === "yellow_card" || e.type === "gele_kaart" || e.type === "yellow"
  );
  const reds = events.filter(
    (e) => e.type === "red_card" || e.type === "rode_kaart" || e.type === "red"
  );

  if (goals.length === 0 && subs.length === 0 && yellows.length === 0 && reds.length === 0) {
    return null;
  }

  return (
    <section style={{ background: "#10121A", padding: "40px 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "3px", color: "#FF6800", marginBottom: "8px", textTransform: "uppercase" }}>
          Wedstrijdverloop
        </div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", margin: "0 0 24px", letterSpacing: "1px" }}>
          GOALS, WISSELS & KAARTEN
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {goals.length > 0 && (
            <EventBlock title={`Doelpunten (${goals.length})`} accent="#FF6800">
              {goals
                .slice()
                .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                .map((e, i) => (
                  <GoalRij
                    key={i}
                    minute={e.minute}
                    scorer={playerName(e.player_id)}
                    assist={e.assist_player_id ? playerName(e.assist_player_id) : null}
                  />
                ))}
            </EventBlock>
          )}

          {subs.length > 0 && (
            <EventBlock title={`Wissels (${subs.length})`} accent="#3DB8FF">
              {subs
                .slice()
                .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                .map((e, i) => (
                  <SubRij
                    key={i}
                    minute={e.minute}
                    inName={playerName(e.player_in_id)}
                    outName={playerName(e.player_out_id)}
                  />
                ))}
            </EventBlock>
          )}

          {(yellows.length > 0 || reds.length > 0) && (
            <EventBlock title={`Kaarten (${yellows.length + reds.length})`} accent="#FFD600">
              {yellows
                .slice()
                .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                .map((e, i) => (
                  <KaartRij
                    key={`y-${i}`}
                    minute={e.minute}
                    name={playerName(e.player_id)}
                    color="yellow"
                  />
                ))}
              {reds
                .slice()
                .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                .map((e, i) => (
                  <KaartRij
                    key={`r-${i}`}
                    minute={e.minute}
                    name={playerName(e.player_id)}
                    color="red"
                  />
                ))}
            </EventBlock>
          )}
        </div>
      </div>
    </section>
  );
}

function EventBlock({ title, accent, children }) {
  return (
    <div style={{ background: "#1B2A5E", borderRadius: "8px", padding: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: accent, marginBottom: "16px", textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {children}
      </div>
    </div>
  );
}

function MinuteBadge({ minute }) {
  return (
    <div style={{
      width: "44px", flexShrink: 0,
      fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px",
      color: "#FF6800", letterSpacing: "1px", textAlign: "center",
    }}>
      {minute != null ? `${minute}'` : "—"}
    </div>
  );
}

function GoalRij({ minute, scorer, assist }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
      <MinuteBadge minute={minute} />
      <div style={{ fontSize: "18px", lineHeight: 1 }}>⚽</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {scorer}
        </div>
        {assist && (
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Assist: {assist}
          </div>
        )}
      </div>
    </div>
  );
}

function SubRij({ minute, inName, outName }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
      <MinuteBadge minute={minute} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ fontSize: "12px", color: "#3DB8FF", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>↑</span>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inName}</span>
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>↓</span>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{outName}</span>
        </div>
      </div>
    </div>
  );
}

function KaartRij({ minute, name, color }) {
  const isRed = color === "red";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
      <MinuteBadge minute={minute} />
      <div style={{
        width: "14px", height: "18px",
        background: isRed ? "#E63946" : "#FFD600",
        borderRadius: "2px", flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0, fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {name}
      </div>
    </div>
  );
}