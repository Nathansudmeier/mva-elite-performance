import React from "react";

export default function SubstitutesPicker({ players, lineupMap, substitutes, onSubstitutesChange }) {
  const assignedIds = new Set(Object.values(lineupMap));
  const availablePlayers = players.filter((p) => !assignedIds.has(p.id));

  const toggle = (playerId) => {
    if (substitutes.includes(playerId)) {
      onSubstitutesChange(substitutes.filter((id) => id !== playerId));
    } else {
      onSubstitutesChange([...substitutes, playerId]);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#D45A30" }}>
        Wissels selecteren ({substitutes.length} geselecteerd)
      </p>
      <div className="flex flex-wrap gap-2">
        {availablePlayers.map((player) => {
          const isSelected = substitutes.includes(player.id);
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => toggle(player.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
              style={isSelected
                ? { backgroundColor: "#1A1F2E", color: "#fff", borderColor: "#1A1F2E" }
                : { backgroundColor: "#FFF5F0", color: "#1A1F2E", borderColor: "#FDE8DC" }
              }
            >
              <div
                className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: isSelected ? "#D45A30" : "#2F3650" }}
              >
                {player.photo_url
                  ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
                  : player.name?.charAt(0)}
              </div>
              <span>{player.name?.split(" ")[0]}</span>
              {player.shirt_number && <span className="text-xs opacity-60">#{player.shirt_number}</span>}
            </button>
          );
        })}
        {availablePlayers.length === 0 && (
          <p className="text-xs" style={{ color: "#2F3650" }}>Alle spelers staan al in de basis.</p>
        )}
      </div>
    </div>
  );
}