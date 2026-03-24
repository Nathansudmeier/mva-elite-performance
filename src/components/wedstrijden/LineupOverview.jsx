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
      <div className="glass p-4 md:p-5" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
        <p className="t-label mb-3">Basisspelers ({basis.length})</p>
        {basis.length === 0 ? (
          <p className="t-secondary-sm">Nog geen basisspelers geselecteerd</p>
        ) : (
          <div className="space-y-2">
            {basis.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "rgba(8,208,104,0.12)", border: "1.5px solid rgba(8,208,104,0.25)" }}
              >
                <img
                  src={player.photo_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  style={{ background: "rgba(255,104,0,0.15)", border: "2px solid #1a1a1a" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black">{player.name}</p>
                </div>
                <span className="text-xs font-bold text-black">#{player.shirt_number || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wissels */}
      <div className="glass p-4 md:p-5" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
        <p className="t-label mb-3">Wissels ({wissels.length})</p>
        {wissels.length === 0 ? (
          <p className="t-secondary-sm">Nog geen wissels geselecteerd</p>
        ) : (
          <div className="space-y-2">
            {wissels.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "rgba(255,214,0,0.15)", border: "1.5px solid rgba(255,214,0,0.30)" }}
              >
                <img
                  src={player.photo_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  style={{ background: "rgba(255,104,0,0.15)", border: "2px solid #1a1a1a" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black">{player.name}</p>
                </div>
                <span className="text-xs font-bold text-black">#{player.shirt_number || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Button */}
      {isTrainer && (
        <button
          onClick={onEditClick}
          className="w-full flex items-center justify-center gap-2"
          style={{
            background: "#FF6800",
            border: "2.5px solid #1a1a1a",
            borderRadius: "14px",
            boxShadow: "3px 3px 0 #1a1a1a",
            height: "52px",
            fontSize: "15px",
            fontWeight: 800,
            color: "white",
            cursor: "pointer",
            transition: "all 0.1s"
          }}
        >
          <i className="ti ti-edit" style={{ fontSize: "18px" }} />
          Opstelling aanpassen
        </button>
      )}
    </div>
  );
}