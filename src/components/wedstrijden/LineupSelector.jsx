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
  const availablePlayers = players.filter(p => !selectedIds.has(p.id) && p.active !== false);

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
    const lineupArray = basis.map((playerId, i) => ({
      slot: `POS${i}`,
      player_id: playerId,
    }));
    onSave({
      lineup: lineupArray,
      substitutes: wissels,
      formation: match?.formation || "4-3-3",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full sm:w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ background: "#1c0e04", border: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 p-4 border-b border-opacity-10 border-white" style={{ background: "#1c0e04" }}>
          <h2 className="text-base font-semibold text-white">Opstelling aanpassen</h2>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
            <X size={18} className="text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basis Spelers */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-3">Basisspelers ({basis.length})</p>
            <div className="space-y-2">
              {basis.length === 0 ? (
                <p className="text-sm text-white/40">Nog geen basisspelers geselecteerd</p>
              ) : (
                basis.map((playerId) => (
                  <div
                    key={playerId}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(74,222,128,0.08)", border: "0.5px solid rgba(74,222,128,0.20)" }}
                  >
                    <img
                      src={getPlayerPhoto(playerId)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ background: "rgba(255,107,0,0.15)" }}
                    />
                    <span className="text-sm font-medium text-white flex-1">{getPlayerName(playerId)}</span>
                    <button
                      onClick={() => handleRemoveBasis(playerId)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white/60 hover:text-white transition"
                      style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)" }}
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
            <p className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-3">Wissels ({wissels.length})</p>
            <div className="space-y-2">
              {wissels.length === 0 ? (
                <p className="text-sm text-white/40">Nog geen wissels geselecteerd</p>
              ) : (
                wissels.map((playerId) => (
                  <div
                    key={playerId}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(255,193,7,0.08)", border: "0.5px solid rgba(255,193,7,0.20)" }}
                  >
                    <img
                      src={getPlayerPhoto(playerId)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ background: "rgba(255,107,0,0.15)" }}
                    />
                    <span className="text-sm font-medium text-white flex-1">{getPlayerName(playerId)}</span>
                    <button
                      onClick={() => handleRemoveWissel(playerId)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white/60 hover:text-white transition"
                      style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)" }}
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
              <p className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-3">Beschikbare spelers ({availablePlayers.length})</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
                  >
                    <img
                      src={player.photo_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ background: "rgba(255,107,0,0.15)" }}
                    />
                    <span className="text-sm font-medium text-white flex-1">{player.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddBasis(player.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                        style={{ background: "rgba(74,222,128,0.20)", border: "0.5px solid rgba(74,222,128,0.30)", color: "#4ade80" }}
                      >
                        Basis
                      </button>
                      <button
                        onClick={() => handleAddWissel(player.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                        style={{ background: "rgba(255,193,7,0.20)", border: "0.5px solid rgba(255,193,7,0.30)", color: "#fbbf24" }}
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
        <div className="sticky bottom-0 flex gap-3 p-4 border-t border-white border-opacity-10" style={{ background: "#1c0e04" }}>
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/70 transition"
            style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving || basis.length === 0}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition"
            style={{
              background: saving || basis.length === 0 ? "rgba(255,107,0,0.40)" : "#FF6B00",
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