import React from "react";

const FIELD_POSITIONS = {
  "4-3-3": ["GK", "LB", "CB1", "CB2", "RB", "CM1", "CM2", "CM3", "LW", "ST", "RW"],
  "4-4-2": ["GK", "LB", "CB1", "CB2", "RB", "LM", "CM1", "CM2", "RM", "ST1", "ST2"],
  "3-5-2": ["GK", "CB1", "CB2", "CB3", "LWB", "CM1", "CM2", "CM3", "RWB", "ST1", "ST2"],
  "4-2-3-1": ["GK", "LB", "CB1", "CB2", "RB", "DM1", "DM2", "CAM1", "CAM2", "CAM3", "ST"],
  "3-4-3": ["GK", "CB1", "CB2", "CB3", "LWB", "CM1", "CM2", "RWB", "RW", "ST", "LW"],
};

const FIELD_GRID_LAYOUT = {
  "4-3-3": ["GK", "LB", "CB1", "CB2", "RB", "CM1", "CM2", "CM3", "LW", "ST", "RW"],
  "4-4-2": ["GK", "LB", "CB1", "CB2", "RB", "LM", "CM1", "CM2", "RM", "ST1", "ST2"],
  "3-5-2": ["GK", "CB1", "CB2", "CB3", "LWB", "CM1", "CM2", "CM3", "RWB", "ST1", "ST2"],
  "4-2-3-1": ["GK", "LB", "CB1", "CB2", "RB", "DM1", "DM2", "CAM1", "CAM2", "CAM3", "ST"],
  "3-4-3": ["GK", "CB1", "CB2", "CB3", "LWB", "CM1", "CM2", "RWB", "RW", "ST", "LW"],
};

export default function DisplayLineup({ match, players, isTrainerOrAdmin, onEditClick }) {
  if (!match.formation || !match.lineup || Object.keys(match.lineup).length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "16px", padding: "20px" }}>
        <div style={{ fontSize: "32px", color: "rgba(255,255,255,0.20)" }}>⊥</div>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>Nog geen opstelling ingesteld</p>
        {isTrainerOrAdmin && (
          <button
            onClick={onEditClick}
            style={{ padding: "10px 16px", background: "#FF6B00", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Opstelling instellen
          </button>
        )}
      </div>
    );
  }

  const getPlayerForSlot = (slotKey) => {
    const playerId = match.lineup[slotKey];
    return playerId ? players.find(p => p.id === playerId) : null;
  };

  const getSubstitutes = () => {
    return (match.substitutes || []).map(id => players.find(p => p.id === id)).filter(Boolean);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Formatie label */}
      <div>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.55)", marginBottom: "4px" }}>Formatie</p>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "white" }}>{match.formation}</p>
      </div>

      {/* Voetbalveld */}
      <div style={{
        background: "linear-gradient(135deg, rgba(20,80,40,0.40) 0%, rgba(20,80,40,0.20) 100%)",
        border: "1px solid rgba(76,175,80,0.25)",
        borderRadius: "16px",
        padding: "24px 16px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        minHeight: "500px",
        alignContent: "center",
        justifyContent: "center",
      }}>
        {FIELD_GRID_LAYOUT[match.formation].map((slot) => {
          const player = getPlayerForSlot(slot);
          return (
            <div key={slot} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              {player ? (
                <>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: player.photo_url ? `url(${player.photo_url})` : "rgba(255,107,0,0.30)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "2px solid #FF8C3A",
                  }} />
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "white", textAlign: "center", maxWidth: "60px" }}>{player.name}</p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>#{player.shirt_number}</p>
                </>
              ) : (
                <>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "2px dashed rgba(255,255,255,0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }} />
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textAlign: "center" }}>{slot}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Wissels */}
      {getSubstitutes().length > 0 && (
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.55)", marginBottom: "12px" }}>Wissels</p>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
            {getSubstitutes().map((player) => (
              <div key={player.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: player.photo_url ? `url(${player.photo_url})` : "rgba(255,107,0,0.20)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                }} />
                <p style={{ fontSize: "11px", fontWeight: 500, color: "white", textAlign: "center", maxWidth: "48px", lineHeight: "1.2" }}>{player.name}</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>#{player.shirt_number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bewerk knop */}
      {isTrainerOrAdmin && (
        <button
          onClick={onEditClick}
          style={{
            marginTop: "12px",
            padding: "0 16px",
            height: "48px",
            background: "#FF6B00",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <i className="ti ti-edit" style={{ fontSize: "18px" }} />
          Opstelling aanpassen
        </button>
      )}
    </div>
  );
}