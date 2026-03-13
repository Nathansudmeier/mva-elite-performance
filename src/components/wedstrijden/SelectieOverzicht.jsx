import React from "react";
import { Users, ArrowLeftRight } from "lucide-react";

export default function SelectieOverzicht({ lineup, substitutes, players }) {
  const playerById = (id) => players.find((p) => p.id === id);

  const starters = lineup
    .map((entry) => playerById(entry.player_id))
    .filter(Boolean);

  const subs = (substitutes || [])
    .map((id) => playerById(id))
    .filter(Boolean);

  if (starters.length === 0 && subs.length === 0) return null;

  return (
    <div className="elite-card p-6">
      <h3 className="font-bold text-[#1A1F2E] mb-4 flex items-center gap-2">
        <Users size={16} style={{ color: "#D45A30" }} />
        Selectie Overzicht
      </h3>
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Basis */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#1A1F2E" }}>
            Basis ({starters.length})
          </p>
          <div className="space-y-1.5">
            {starters.map((player) => (
              <div key={player.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FDE8DC" }}>
                <div
                  className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#D45A30" }}
                >
                  {player.photo_url
                    ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
                    : player.name?.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-[#1A1F2E]">{player.name}</span>
                {player.shirt_number && (
                  <span className="ml-auto text-xs font-bold" style={{ color: "#D45A30" }}>#{player.shirt_number}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wissels */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#2F3650" }}>
            Wissels ({subs.length})
          </p>
          {subs.length === 0 ? (
            <p className="text-xs italic" style={{ color: "#2F3650" }}>Geen wissels geselecteerd</p>
          ) : (
            <div className="space-y-1.5">
              {subs.map((player) => (
                <div key={player.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FFF5F0", border: "1px solid #FDE8DC" }}>
                  <div
                    className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#2F3650" }}
                  >
                    {player.photo_url
                      ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
                      : player.name?.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-[#1A1F2E]">{player.name}</span>
                  {player.shirt_number && (
                    <span className="ml-auto text-xs font-bold" style={{ color: "#2F3650" }}>#{player.shirt_number}</span>
                  )}
                  <ArrowLeftRight size={12} style={{ color: "#D45A30" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}