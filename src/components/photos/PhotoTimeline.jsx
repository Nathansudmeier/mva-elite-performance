import React, { useState } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const FILTERS = ["Alles", "Training", "Wedstrijd"];

export default function PhotoTimeline({ photos = [] }) {
  const [activeFilter, setActiveFilter] = useState("Alles");
  const [selected, setSelected] = useState(null);

  const sorted = [...photos].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filtered = activeFilter === "Alles" ? sorted : sorted.filter(p => p.type === activeFilter);

  return (
    <div className="glass p-4">
      <h2 className="t-section-title mb-3">📸 Foto's</h2>

      {/* Filter row */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-1.5 text-xs font-semibold transition-all"
            style={{
              borderRadius: 20,
              background: activeFilter === f ? "#FF6B00" : "rgba(255,255,255,0.08)",
              color: activeFilter === f ? "#ffffff" : "rgba(255,255,255,0.55)",
              border: activeFilter === f ? "0.5px solid rgba(255,107,0,0.4)" : "0.5px solid rgba(255,255,255,0.12)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.15)", height: 120 }}>
          <p className="t-tertiary">Nog geen foto's geüpload</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map(photo => (
            <div key={photo.id} className="cursor-pointer group" onClick={() => setSelected(photo)}>
              <div className="w-full aspect-square overflow-hidden group-hover:opacity-85 transition-opacity"
                style={{ borderRadius: 10, background: "rgba(255,255,255,0.08)" }}>
                <img src={photo.photo_url} alt={photo.label || photo.type} className="w-full h-full object-cover" />
              </div>
              <p className="t-tertiary-sm mt-1 truncate">
                {photo.date ? format(new Date(photo.date), "d MMM", { locale: nl }) : ""}
              </p>
              <p className="t-secondary-sm truncate leading-tight">{photo.label || photo.type}</p>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            onClick={() => setSelected(null)}
          >
            <X size={22} color="white" />
          </button>
          <img
            src={selected.photo_url}
            alt={selected.label || selected.type}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <div className="mt-4 text-center" onClick={e => e.stopPropagation()}>
            <p className="text-white font-semibold text-base">{selected.label || selected.type}</p>
            <p className="text-white/60 text-sm mt-1">
              {selected.date ? format(new Date(selected.date), "d MMMM yyyy", { locale: nl }) : ""}
              {selected.team ? ` · ${selected.team}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}