import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Link } from "react-router-dom";
import { Plus, Search, ChevronRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#1c0e04" }}>
      {/* Blur background */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 bottom-0 z-0" style={{ overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,107,0,0.35)", top: -160, left: -100, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "rgba(96,165,250,0.25)", top: 200, right: -80, filter: "blur(70px)" }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="t-page-title mb-1">Trainingsvormen</h1>
            <p className="t-secondary">Bibliotheek</p>
          </div>
          {isTrainer && (
            <Link to="/TrainingsvormForm">
              <Button className="btn-primary flex items-center gap-2 h-10">
                <Plus className="w-4 h-4" />
                Nieuwe oefening
              </Button>
            </Link>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={
                activeFilter === cat
                  ? { background: "#FF6B00", color: "white" }
                  : {
                      background: "rgba(255,255,255,0.09)",
                      border: "0.5px solid rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.70)",
                      backdropFilter: "blur(24px)"
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8 relative" style={{ background: "rgba(255,255,255,0.09)", backdropFilter: "blur(24px)", border: "0.5px solid rgba(255,255,255,0.18)", borderRadius: "22px", padding: "12px 16px" }}>
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.40)" }} />
          <input
            type="text"
            placeholder="Zoek op naam of coaching point..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 bg-transparent text-white text-sm outline-none placeholder-shown:text-opacity-40"
            style={{ color: "white" }}
          />
        </div>

        {/* Exercises */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="w-12 h-12 mb-4" style={{ color: "rgba(255,255,255,0.30)" }} />
            <p className="t-secondary">Nog geen trainingsvormen toegevoegd</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ex => (
              <Link key={ex.id} to={`/TrainingsvormDetail?id=${ex.id}`}>
                <div className="glass p-4 rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                          style={{
                            background: categoryColors[ex.category].bg,
                            border: `0.5px solid ${categoryColors[ex.category].border}`,
                            color: categoryColors[ex.category].color
                          }}
                        >
                          {ex.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base mb-1 truncate">{ex.name}</h3>
                      <p className="t-secondary text-xs line-clamp-2">{ex.description}</p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {ex.duration_minutes && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.60)" }}>
                            {ex.duration_minutes} min
                          </span>
                        )}
                        {ex.groups && ex.groups.length > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.60)" }}>
                            {ex.groups.length} groepen
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.40)" }} />
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