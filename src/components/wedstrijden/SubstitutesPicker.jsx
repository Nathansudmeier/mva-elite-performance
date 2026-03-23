import React from "react";

export default function SubstitutesPicker({ players, lineupMap, substitutes, onSubstitutesChange }) {
  const assignedIds = new Set(Object.values(lineupMap));
  const basisPlayers = players.filter((p) => assignedIds.has(p.id));
  const availablePlayers = players.filter((p) => !assignedIds.has(p.id));

  const toggle = (playerId) => {
    if (substitutes.includes(playerId)) {
      onSubstitutesChange(substitutes.filter((id) => id !== playerId));
    } else {
      onSubstitutesChange([...substitutes, playerId]);
    }
  };

  const PlayerChip = ({ player, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 transition-all"
      style={{
        padding: "6px 12px 6px 6px",
        borderRadius: 20,
        background: active ? "rgba(255,107,0,0.25)" : "rgba(255,255,255,0.08)",
        border: `0.5px solid ${active ? "rgba(255,107,0,0.50)" : "rgba(255,255,255,0.12)"}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", background: active ? "rgba(255,107,0,0.50)" : "rgba(255,255,255,0.15)" }}>
        {player.photo_url
          ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
          : player.name?.charAt(0)}
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{player.name?.split(" ")[0]}</span>
      {player.shirt_number && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.50)" }}>#{player.shirt_number}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Basis */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#FF8C3A", marginBottom: 8 }}>
          Basis ({basisPlayers.length})
        </p>
        {basisPlayers.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Sleep spelers naar het veld om de basis te vullen.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {basisPlayers.map((player) => (
              <PlayerChip key={player.id} player={player} active={false} onClick={undefined} />
            ))}
          </div>
        )}
      </div>

      {/* Wissels */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#FF8C3A", marginBottom: 8 }}>
          Wissels ({substitutes.length} geselecteerd)
        </p>
        <div className="flex flex-wrap gap-2">
          {availablePlayers.map((player) => {
            const isSelected = substitutes.includes(player.id);
            return (
              <PlayerChip
                key={player.id}
                player={player}
                active={isSelected}
                onClick={() => toggle(player.id)}
              />
            );
          })}
          {availablePlayers.length === 0 && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Alle spelers staan in de basis.</p>
          )}
        </div>
      </div>
    </div>
  );
}