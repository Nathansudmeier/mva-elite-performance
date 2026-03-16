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

  const PlayerChip = ({ player, active, onClick, label }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
      style={active
        ? { backgroundColor: "#1A1F2E", color: "#fff", borderColor: "#1A1F2E" }
        : { backgroundColor: "#FFF5F0", color: "#1A1F2E", borderColor: "#FDE8DC" }
      }
    >
      <div
        className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: active ? "#D45A30" : "#2F3650" }}
      >
        {player.photo_url
          ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
          : player.name?.charAt(0)}
      </div>
      <span>{player.name?.split(" ")[0]}</span>
      {player.shirt_number && <span className="text-xs opacity-60">#{player.shirt_number}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Basis */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#D45A30" }}>
          Basis ({basisPlayers.length})
        </p>
        {basisPlayers.length === 0 ? (
          <p className="text-xs" style={{ color: "#2F3650" }}>Sleep speelsters naar het veld om de basis te vullen.</p>
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
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#D45A30" }}>
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
            <p className="text-xs" style={{ color: "#2F3650" }}>Alle speelsters staan in de basis.</p>
          )}
        </div>
      </div>
    </div>
  );
}