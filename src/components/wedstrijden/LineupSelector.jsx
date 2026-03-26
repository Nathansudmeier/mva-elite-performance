import React, { useState } from "react";
import { X } from "lucide-react";

export default function LineupSelector({ match, players, onSave, onCancel, saving }) {
  const [basis, setBasis] = useState((match?.lineup || []).map(e => e.player_id).filter(Boolean) || []);
  const [wissels, setWissels] = useState(match?.substitutes || []);

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || "Onbekend";
  };

  const getPlayerPhoto = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.photo_url || null;
  };

  const selectedIds = new Set([...basis, ...wissels]);
  const selectionIds = match?.selection?.length > 0 ? new Set(match.selection) : null;
  const availablePlayers = players.filter(p =>
    !selectedIds.has(p.id) &&
    p.active !== false &&
    (selectionIds === null || selectionIds.has(p.id))
  );

  const handleAddBasis = (playerId) => {
    setBasis([...basis, playerId]);
  };

  const handleAddWissel = (playerId) => {
    setWissels([...wissels, playerId]);
  };

  const handleRemoveBasis = (playerId) => {
    setBasis(basis.filter(id => id !== playerId));
  };

  const handleRemoveWissel = (playerId) => {
    setWissels(wissels.filter(id => id !== playerId));
  };

  const handleSave = () => {
    const lineupObj = {};
    basis.forEach((playerId, i) => {
      lineupObj[`POS${i}`] = playerId;
    });
    onSave({
      lineup: lineupObj,
      substitutes: wissels,
      formation: match?.formation || "4-3-3",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full sm:w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ background: "#FFF3E8", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 p-4 border-b-2 border-black" style={{ background: "#FFF3E8" }}>
          <h2 className="text-base font-bold text-black">Opstelling aanpassen</h2>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 transition">
            <X size={18} color="#1a1a1a" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basis Spelers */}
          <div>
            <p className="t-label mb-3">Basisspelers ({basis.length})</p>
            <div className="space-y-2">
              {basis.length === 0 ? (
                <p className="t-secondary-sm">Nog geen basisspelers geselecteerd</p>
              ) : (
                basis.map((playerId) => (
                  <div
                    key={playerId}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(8,208,104,0.12)", border: "1.5px solid rgba(8,208,104,0.25)" }}
                  >
                    <img
                      src={getPlayerPhoto(playerId)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ background: "rgba(255,104,0,0.15)", border: "2px solid #1a1a1a" }}
                    />
                    <span className="text-sm font-bold text-black flex-1">{getPlayerName(playerId)}</span>
                    <button
                      onClick={() => handleRemoveBasis(playerId)}
                      className="px-3 py-1 text-xs font-bold rounded-lg hover:opacity-80 transition"
                      style={{ background: "rgba(255,61,168,0.12)", color: "#FF3DA8", border: "1.5px solid rgba(255,61,168,0.25)" }}
                    >
                      Verwijder
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Wissels */}
          <div>
            <p className="t-label mb-3">Wissels ({wissels.length})</p>
            <div className="space-y-2">
              {wissels.length === 0 ? (
                <p className="t-secondary-sm">Nog geen wissels geselecteerd</p>
              ) : (
                wissels.map((playerId) => (
                  <div
                    key={playerId}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(255,214,0,0.15)", border: "1.5px solid rgba(255,214,0,0.30)" }}
                  >
                    <img
                      src={getPlayerPhoto(playerId)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ background: "rgba(255,104,0,0.15)", border: "2px solid #1a1a1a" }}
                    />
                    <span className="text-sm font-bold text-black flex-1">{getPlayerName(playerId)}</span>
                    <button
                      onClick={() => handleRemoveWissel(playerId)}
                      className="px-3 py-1 text-xs font-bold rounded-lg hover:opacity-80 transition"
                      style={{ background: "rgba(255,61,168,0.12)", color: "#FF3DA8", border: "1.5px solid rgba(255,61,168,0.25)" }}
                    >
                      Verwijder
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Beschikbare spelers */}
          {availablePlayers.length > 0 && (
            <div>
              <p className="t-label mb-3">Beschikbare spelers ({availablePlayers.length})</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(26,26,26,0.06)", border: "1.5px solid rgba(26,26,26,0.12)" }}
                  >
                    <img
                      src={player.photo_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ background: "rgba(255,104,0,0.15)", border: "2px solid #1a1a1a" }}
                    />
                    <span className="text-sm font-bold text-black flex-1">{player.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddBasis(player.id)}
                        className="px-3 py-1 text-xs font-bold rounded-lg transition"
                        style={{ background: "rgba(8,208,104,0.12)", border: "1.5px solid rgba(8,208,104,0.25)", color: "#05a050" }}
                      >
                        Basis
                      </button>
                      <button
                        onClick={() => handleAddWissel(player.id)}
                        className="px-3 py-1 text-xs font-bold rounded-lg transition"
                        style={{ background: "rgba(255,214,0,0.15)", border: "1.5px solid rgba(255,214,0,0.30)", color: "#cc9900" }}
                      >
                        Wissel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-4 border-t-2 border-black" style={{ background: "#FFF3E8" }}>
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition"
            style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", color: "#1a1a1a", cursor: "pointer" }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving || basis.length === 0}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition"
            style={{
              background: saving || basis.length === 0 ? "rgba(255,104,0,0.4)" : "#FF6800",
              border: "2.5px solid #1a1a1a",
              boxShadow: saving || basis.length === 0 ? "none" : "3px 3px 0 #1a1a1a",
              color: "#ffffff",
              cursor: saving || basis.length === 0 ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}