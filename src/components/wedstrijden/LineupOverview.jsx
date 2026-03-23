import React from "react";

export default function LineupOverview({ match, players, isTrainer, onEditClick }) {
  if (!match) {
    return (
      <div className="glass-dark rounded-2xl p-6 text-center">
        <p className="t-secondary">Geen gekoppelde wedstrijd gevonden.</p>
      </div>
    );
  }

  const getBasisSpelers = () => {
    return (match.lineup || [])
      .map(item => {
        const player = players.find(p => p.id === item.player_id);
        return player ? { ...player, slot: item.slot } : null;
      })
      .filter(Boolean);
  };

  const getWissels = () => {
    return (match.substitutes || [])
      .map(playerId => players.find(p => p.id === playerId))
      .filter(Boolean);
  };

  const basis = getBasisSpelers();
  const wissels = getWissels();

  return (
    <div className="space-y-4">
      {/* Basis Spelers */}
      <div className="glass-dark rounded-2xl p-4">
        <p className="t-label mb-3">Basisspelers ({basis.length})</p>
        {basis.length === 0 ? (
          <p className="t-secondary text-sm">Nog geen basisspelers geselecteerd</p>
        ) : (
          <div className="space-y-2">
            {basis.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "rgba(74,222,128,0.08)", border: "0.5px solid rgba(74,222,128,0.20)" }}
              >
                <img
                  src={player.photo_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  style={{ background: "rgba(255,107,0,0.15)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="t-secondary-sm">{player.name}</p>
                </div>
                <span className="text-xs font-semibold text-white/60">#{player.shirt_number || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wissels */}
      <div className="glass-dark rounded-2xl p-4">
        <p className="t-label mb-3">Wissels ({wissels.length})</p>
        {wissels.length === 0 ? (
          <p className="t-secondary text-sm">Nog geen wissels geselecteerd</p>
        ) : (
          <div className="space-y-2">
            {wissels.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "rgba(255,193,7,0.08)", border: "0.5px solid rgba(255,193,7,0.20)" }}
              >
                <img
                  src={player.photo_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  style={{ background: "rgba(255,107,0,0.15)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="t-secondary-sm">{player.name}</p>
                </div>
                <span className="text-xs font-semibold text-white/60">#{player.shirt_number || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Button */}
      {isTrainer && (
        <button
          onClick={onEditClick}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <i className="ti ti-edit" style={{ fontSize: "18px" }} />
          Opstelling aanpassen
        </button>
      )}
    </div>
  );
}