import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function WedstrijdReflecties() {
  const [filterPlayer, setFilterPlayer] = useState("all");

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: reflections = [] } = useQuery({ queryKey: ["matchReflections-all"], queryFn: () => base44.entities.MatchReflection.list("-date") });

  const activePlayers = players.filter((p) => p.active !== false);

  const displayed = filterPlayer === "all"
    ? reflections
    : reflections.filter((r) => r.player_id === filterPlayer);

  // Groepeer per wedstrijd
  const byMatch = {};
  displayed.forEach((r) => {
    if (!byMatch[r.match_id]) byMatch[r.match_id] = { opponent: r.opponent, date: r.date, reflections: [] };
    byMatch[r.match_id].reflections.push(r);
  });
  const matchGroups = Object.entries(byMatch).sort((a, b) => (b[1].date > a[1].date ? 1 : -1));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="t-page-title">Wedstrijdreflecties</h1>
          <p className="t-secondary">{reflections.length} reflecties ingediend</p>
        </div>
      </div>

      {/* Filter */}
      <Select value={filterPlayer} onValueChange={setFilterPlayer}>
        <SelectTrigger style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", color: "#1a1a1a", fontWeight: 600, width: "200px" }}>
          <SelectValue placeholder="Filter op speelster" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle speelsters</SelectItem>
          {activePlayers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Lege staat */}
      {matchGroups.length === 0 && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "48px 24px", textAlign: "center" }}>
          <i className="ti ti-message-2" style={{ fontSize: "32px", color: "rgba(26,26,26,0.15)" }} />
          <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.40)", fontWeight: 600, marginTop: "12px" }}>Nog geen reflecties ingediend</p>
        </div>
      )}

      {/* Wedstrijd groepen */}
      {matchGroups.map(([matchId, group]) => (
        <div key={matchId} style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          {/* Wedstrijd header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1.5px solid rgba(26,26,26,0.08)" }}>
            <p style={{ fontSize: "15px", fontWeight: 900, color: "#1a1a1a" }}>vs. {group.opponent || "–"}</p>
            {group.date && (
              <span style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>
                {format(new Date(group.date), "d MMM yyyy", { locale: nl })}
              </span>
            )}
            <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(255,104,0,0.10)", color: "#FF6800", borderRadius: "20px", padding: "2px 10px", border: "1px solid rgba(255,104,0,0.20)", marginLeft: "auto" }}>
              {group.reflections.length} {group.reflections.length === 1 ? "reflectie" : "reflecties"}
            </span>
          </div>

          {/* Reflecties */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {group.reflections.map((r) => {
              const player = activePlayers.find((p) => p.id === r.player_id);
              const initials = player?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
              return (
                <div key={r.id} style={{ background: "rgba(26,26,26,0.03)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: "12px", padding: "10px 12px" }}>
                  {/* Speler naam */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#ffffff" }}>{initials}</span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>{player?.name || "–"}</span>
                  </div>
                  {/* Positief / Verbeterpunt */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ background: "rgba(8,208,104,0.08)", border: "1px solid rgba(8,208,104,0.25)", borderRadius: "10px", padding: "8px 10px" }}>
                      <p style={{ fontSize: "9px", fontWeight: 800, color: "#05a050", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>✅ Wat ging goed</p>
                      <p style={{ fontSize: "12px", color: "#1a1a1a", lineHeight: 1.4 }}>{r.positief}</p>
                    </div>
                    <div style={{ background: "rgba(255,104,0,0.07)", border: "1px solid rgba(255,104,0,0.20)", borderRadius: "10px", padding: "8px 10px" }}>
                      <p style={{ fontSize: "9px", fontWeight: 800, color: "#FF6800", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>🎯 Wat kan beter</p>
                      <p style={{ fontSize: "12px", color: "#1a1a1a", lineHeight: 1.4 }}>{r.verbeterpunt}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}