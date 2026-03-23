import React, { useState } from "react";
import LineupPlayerList from "./LineupPlayerList";

const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3"];

export default function EditLineup({ match, players, onSave, onCancel, saving, error }) {
  const initLineup = () => {
    if (!match.lineup) return {};
    if (Array.isArray(match.lineup)) {
      const map = {};
      match.lineup.forEach(entry => { if (entry.slot && entry.player_id) map[entry.slot] = entry.player_id; });
      return map;
    }
    return match.lineup;
  };

  const initSubs = () => {
    if (!match.substitutes) return [];
    if (Array.isArray(match.substitutes)) return match.substitutes;
    return [];
  };

  const [lineupMap, setLineupMap] = useState(initLineup);
  const [substitutes, setSubstitutes] = useState(initSubs);
  const [formation, setFormation] = useState(match.formation || "4-3-3");

  const handleSave = () => {
    onSave({
      lineup: lineupMap,
      substitutes,
      formation,
    });
  };

  const activePlayers = players.filter(p => p.active !== false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1c0e04" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: "18px" }} />
        </button>
        <h1 style={{ fontSize: "16px", fontWeight: 600, color: "white", flex: 1 }}>Opstelling bewerken</h1>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Formation selector */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.55)", marginBottom: "8px" }}>Formatie</p>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
            {FORMATIONS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFormation(f);
                  setLineupMap({});
                }}
                style={{
                  whiteSpace: "nowrap",
                  padding: "8px 14px",
                  background: formation === f ? "#FF6B00" : "rgba(255,255,255,0.08)",
                  color: formation === f ? "white" : "rgba(255,255,255,0.60)",
                  border: formation === f ? "none" : "0.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Player list */}
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

      {/* Error message */}
      {error && !saving && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(248,113,113,0.10)",
          border: "0.5px solid rgba(248,113,113,0.25)",
          color: "#f87171",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex",
        gap: "8px",
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            flex: 1,
            height: "48px",
            background: "rgba(255,255,255,0.08)",
            color: "white",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          Annuleren
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1,
            height: "48px",
            background: "#FF6B00",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Opslaan..." : "Opstelling opslaan"}
        </button>
      </div>
    </div>
  );
}