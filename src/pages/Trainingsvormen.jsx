import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Link } from "react-router-dom";
import { Plus, Search, ChevronRight, ClipboardList } from "lucide-react";

const categoryColors = {
  Tactisch: { bg: "rgba(96,165,250,0.20)", border: "rgba(96,165,250,0.40)", color: "#60a5fa" },
  Fysiek: { bg: "rgba(74,222,128,0.20)", border: "rgba(74,222,128,0.40)", color: "#4ade80" },
  Positiespel: { bg: "rgba(167,139,250,0.20)", border: "rgba(167,139,250,0.40)", color: "#a78bfa" },
  Afwerking: { bg: "rgba(255,107,0,0.20)", border: "rgba(255,107,0,0.40)", color: "#FF8C3A" },
  Spelprincipes: { bg: "rgba(251,191,36,0.20)", border: "rgba(251,191,36,0.40)", color: "#fbbf24" }
};

export default function Trainingsvormen() {
  const { user, isTrainer } = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState("Alle");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => base44.entities.ExerciseTemplate.list()
  });

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const matchesCategory = activeFilter === "Alle" || ex.category === activeFilter;
      const matchesSearch = !searchQuery || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.coaching_points || []).some(cp => cp.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [exercises, activeFilter, searchQuery]);

  const categories = ["Alle", "Tactisch", "Fysiek", "Positiespel", "Afwerking", "Spelprincipes"];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1c0e04" }}>
      <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png" alt=""
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />

      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="t-page-title">Trainingsvormen</h1>
            <p className="t-secondary text-xs">Bibliotheek met oefeningen</p>
          </div>
          {isTrainer && (
            <Link to="/TrainingsvormForm" className="flex-shrink-0">
              <button className="btn-primary h-10 px-4 flex items-center gap-2 text-sm whitespace-nowrap">
                <Plus size={16} />
                Nieuw
              </button>
            </Link>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={
                activeFilter === cat
                  ? { background: "#FF6B00", color: "white" }
                  : {
                      background: "rgba(255,255,255,0.08)",
                      border: "0.5px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.60)"
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="glass-dark rounded-2xl px-4 py-3 flex items-center gap-2">
          <Search size={16} style={{ color: "rgba(255,255,255,0.40)" }} />
          <input
            type="text"
            placeholder="Zoek oefening..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-white placeholder:text-opacity-40"
          />
        </div>

        {/* Exercises */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ClipboardList size={32} style={{ color: "rgba(255,255,255,0.20)" }} className="mb-3" />
            <p className="t-secondary text-sm">Geen trainingsvormen gevonden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(ex => (
              <Link key={ex.id} to={`/TrainingsvormDetail?id=${ex.id}`} className="block">
                <div className="glass-dark rounded-2xl p-3.5 transition-opacity hover:opacity-80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0"
                          style={{
                            background: categoryColors[ex.category].bg,
                            border: `0.5px solid ${categoryColors[ex.category].border}`,
                            color: categoryColors[ex.category].color
                          }}
                        >
                          {ex.category}
                        </span>
                        {ex.duration_minutes && (
                          <span className="t-tertiary-sm px-2 py-1 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                            {ex.duration_minutes} min
                          </span>
                        )}
                      </div>
                      <p className="t-card-title truncate">{ex.name}</p>
                      {ex.description && <p className="t-secondary text-xs line-clamp-1 mt-1">{ex.description}</p>}
                    </div>
                    <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.30)", flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}