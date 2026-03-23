import React, { useState } from "react";
import { createPortal } from "react-dom";

const FORMATIONS_ALL = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3"];

const FORMATION_SLOTS = {
  "4-3-3":   ["GK", "LB", "CB1", "CB2", "RB", "LM", "CM", "RM", "LW", "ST", "RW"],
  "4-4-2":   ["GK", "LB", "CB1", "CB2", "RB", "LM", "CM1", "CM2", "RM", "ST1", "ST2"],
  "3-5-2":   ["GK", "CB1", "CB2", "CB3", "LWB", "CM1", "CM2", "CM3", "RWB", "ST1", "ST2"],
  "4-2-3-1": ["GK", "LB", "CB1", "CB2", "RB", "DM1", "DM2", "CAM1", "CAM2", "CAM3", "ST"],
  "3-4-3":   ["GK", "CB1", "CB2", "CB3", "LM", "CM1", "CM2", "RM", "LW", "ST", "RW"],
};

// Derive status from lineupMap + substitutes
function getPlayerStatus(playerId, lineupMap, substitutes) {
  const slot = Object.entries(lineupMap).find(([, pid]) => pid === playerId);
  if (slot) return { type: "basis", slot: slot[0] };
  if (substitutes.includes(playerId)) return { type: "wissel" };
  return { type: "none" };
}

function Avatar({ player, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "rgba(255,107,0,0.15)",
      border: "0.5px solid rgba(255,107,0,0.30)",
      overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {player.photo_url
        ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.38, fontWeight: 700, color: "#FF8C3A" }}>
            {player.name?.charAt(0)?.toUpperCase()}
          </span>
      }
    </div>
  );
}

function StatusPill({ status }) {
  if (status.type === "basis") {
    return (
      <span style={{
        background: "#FF6B00", color: "#fff",
        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{status.slot}</span>
    );
  }
  if (status.type === "wissel") {
    return (
      <span style={{
        background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)",
        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>Wissel</span>
    );
  }
  return (
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", flexShrink: 0 }}>Niet geselecteerd</span>
  );
}

function PlayerRow({ player, status, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px", width: "100%", background: "none", border: "none",
        borderBottom: "0.5px solid rgba(255,255,255,0.06)", cursor: "pointer",
        textAlign: "left",
      }}
    >
      <Avatar player={player} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{player.name}</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 2 }}>
          #{player.shirt_number || "—"} · {player.position || ""}
        </p>
      </div>
      <StatusPill status={status} />
      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
    </button>
  );
}

// Bottom sheet for a single player
function PlayerActionSheet({ player, formation, lineupMap, substitutes, onAssign, onClose }) {
  const [mode, setMode] = useState(null); // null | 'basis'
  const slots = FORMATION_SLOTS[formation] || [];
  const occupiedSlots = Object.entries(lineupMap)
    .filter(([, pid]) => pid !== player.id)
    .map(([slot]) => slot);
  const currentSlot = Object.entries(lineupMap).find(([, pid]) => pid === player.id)?.[0];

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9991,
        background: "rgba(20,10,3,0.97)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        borderRadius: "24px 24px 0 0",
        border: "0.5px solid rgba(255,255,255,0.10)",
        paddingBottom: 32,
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.20)" }} />
        </div>

        {/* Player info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 20px 16px" }}>
          <Avatar player={player} size={44} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{player.name}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>#{player.shirt_number || "—"} · {player.position || ""}</p>
          </div>
        </div>

        <div style={{ height: "0.5px", background: "rgba(255,255,255,0.08)", margin: "0 20px 16px" }} />

        {mode === "basis" ? (
          <div style={{ padding: "0 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Kies positie — {formation}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {slots.map(slot => {
                const isOccupied = occupiedSlots.includes(slot);
                const isActive = slot === currentSlot;
                return (
                  <button
                    key={slot}
                    disabled={isOccupied}
                    onClick={() => { onAssign("basis", slot); onClose(); }}
                    style={{
                      padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: isOccupied ? "not-allowed" : "pointer", border: "none",
                      background: isActive ? "#FF6B00" : isOccupied ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)",
                      color: isActive ? "#fff" : isOccupied ? "rgba(255,255,255,0.25)" : "#fff",
                    }}
                  >{slot}</button>
                );
              })}
            </div>
            <button
              onClick={() => setMode(null)}
              style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.50)", background: "none", border: "none", cursor: "pointer" }}
            >← Terug</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
            <button
              onClick={() => setMode("basis")}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(255,107,0,0.12)", border: "0.5px solid rgba(255,107,0,0.25)",
                cursor: "pointer", color: "#FF8C3A", fontSize: 14, fontWeight: 600,
              }}
            >
              <i className="ti ti-shirt" style={{ fontSize: 18 }} />
              Basis
              <i className="ti ti-chevron-right" style={{ fontSize: 14, marginLeft: "auto" }} />
            </button>
            <button
              onClick={() => { onAssign("wissel"); onClose(); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)",
                cursor: "pointer", color: "rgba(255,255,255,0.80)", fontSize: 14, fontWeight: 600,
              }}
            >
              <i className="ti ti-arrows-exchange" style={{ fontSize: 18 }} />
              Wissel
            </button>
            <button
              onClick={() => { onAssign("none"); onClose(); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(248,113,113,0.08)", border: "0.5px solid rgba(248,113,113,0.20)",
                cursor: "pointer", color: "#f87171", fontSize: 14, fontWeight: 600,
              }}
            >
              <i className="ti ti-x" style={{ fontSize: 18 }} />
              Niet selecteren
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

export default function LineupPlayerList({ players, lineupMap, substitutes, formation, onLineupChange, onSubstitutesChange, onFormationChange, onSave, saving }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const activePlayers = players.filter(p => p.active !== false);

  const handleAssign = (playerId, type, slot) => {
    let newLineup = { ...lineupMap };
    let newSubs = [...substitutes];

    // Remove player from wherever they were
    Object.keys(newLineup).forEach(k => { if (newLineup[k] === playerId) delete newLineup[k]; });
    newSubs = newSubs.filter(id => id !== playerId);

    if (type === "basis" && slot) {
      // If slot was occupied by someone else, free them
      if (newLineup[slot] && newLineup[slot] !== playerId) delete newLineup[slot];
      newLineup[slot] = playerId;
    } else if (type === "wissel") {
      newSubs.push(playerId);
    }
    // type === "none" → already removed above

    onLineupChange(newLineup);
    onSubstitutesChange(newSubs);
  };

  const handleFormationChange = (f) => {
    // Reset basis spelers whose slot doesn't exist in new formation
    const newSlots = FORMATION_SLOTS[f] || [];
    const newLineup = {};
    Object.entries(lineupMap).forEach(([slot, pid]) => {
      if (newSlots.includes(slot)) newLineup[slot] = pid;
    });
    onFormationChange(f);
    onLineupChange(newLineup);
  };

  const basisCount = Object.keys(lineupMap).length;
  const wisselCount = substitutes.length;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Formatie selector */}
      <div style={{ overflowX: "auto", padding: "12px 16px 4px", display: "flex", gap: 8 }}>
        {FORMATIONS_ALL.map(f => (
          <button
            key={f}
            onClick={() => handleFormationChange(f)}
            style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              cursor: "pointer", border: "none",
              background: formation === f ? "#FF6B00" : "rgba(255,255,255,0.08)",
              color: formation === f ? "#fff" : "rgba(255,255,255,0.60)",
            }}
          >{f}</button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ padding: "8px 16px 4px", display: "flex", gap: 16 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
          <span style={{ color: "#FF8C3A", fontWeight: 700 }}>{basisCount}</span>/11 basis
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
          <span style={{ color: "rgba(255,255,255,0.60)", fontWeight: 700 }}>{wisselCount}</span> wissels
        </span>
      </div>

      {/* Player list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activePlayers.map(player => {
          const status = getPlayerStatus(player.id, lineupMap, substitutes);
          return (
            <PlayerRow
              key={player.id}
              player={player}
              status={status}
              onClick={() => setSelectedPlayer(player)}
            />
          );
        })}
      </div>

      {/* Save button */}
      {onSave && (
        <div style={{ padding: "12px 16px 16px" }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              width: "100%", height: 52, background: saving ? "rgba(255,107,0,0.40)" : "#FF6B00",
              border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Opslaan..." : "Opstelling opslaan"}
          </button>
        </div>
      )}

      {/* Bottom sheet */}
      {selectedPlayer && (
        <PlayerActionSheet
          player={selectedPlayer}
          formation={formation}
          lineupMap={lineupMap}
          substitutes={substitutes}
          onAssign={(type, slot) => handleAssign(selectedPlayer.id, type, slot)}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}