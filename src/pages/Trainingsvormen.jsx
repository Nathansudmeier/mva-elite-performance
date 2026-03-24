import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Link } from "react-router-dom";
import { Plus, Search, ChevronRight } from "lucide-react";

const CATEGORY_COLORS = {
  Tactisch:      { bg: "#00C2FF", text: "#1a1a1a" },
  Fysiek:        { bg: "#08D068", text: "#1a1a1a" },
  Positiespel:   { bg: "#9B5CFF", text: "#ffffff" },
  Afwerking:     { bg: "#FF6800", text: "#ffffff" },
  Spelprincipes: { bg: "#FFD600", text: "#1a1a1a" },
};

const CATEGORIES = ["Alle", "Tactisch", "Fysiek", "Positiespel", "Afwerking", "Spelprincipes"];

export default function Trainingsvormen() {
  const { isTrainer } = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState("Alle");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => base44.entities.ExerciseTemplate.list(),
  });

  const filtered = useMemo(() => exercises.filter(ex => {
    const matchCat = activeFilter === "Alle" || ex.category === activeFilter;
    const matchSearch = !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.coaching_points || []).some(cp => cp.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  }), [exercises, activeFilter, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="t-page-title">Trainingen</h1>
          <p className="t-secondary" style={{ marginTop: "2px" }}>{exercises.length} oefeningen in bibliotheek</p>
        </div>
        {isTrainer && (
          <Link to="/TrainingsvormForm">
            <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FF6800", color: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "3px 3px 0 #1a1a1a", padding: "0 16px", height: "44px", fontWeight: 800, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>
              <Plus size={15} /> Nieuw
            </button>
          </Link>
        )}
      </div>

      {/* Zoekbalk */}
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "14px", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", gap: "10px", padding: "0 14px", height: "46px" }}>
        <Search size={16} style={{ color: "rgba(26,26,26,0.35)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Zoek oefening..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              border: "2px solid #1a1a1a",
              background: activeFilter === cat ? "#1a1a1a" : "#ffffff",
              color: activeFilter === cat ? "#ffffff" : "#1a1a1a",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.1s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lijst */}
      {filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: "10px" }}>
          <i className="ti ti-clipboard-off" style={{ fontSize: "32px", color: "rgba(26,26,26,0.15)" }} />
          <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.35)", fontWeight: 600 }}>Geen trainingsvormen gevonden</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(ex => {
            const col = CATEGORY_COLORS[ex.category] || { bg: "#1a1a1a", text: "#ffffff" };
            return (
              <Link key={ex.id} to={`/TrainingsvormDetail?id=${ex.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "16px", boxShadow: "3px 3px 0 #1a1a1a", padding: "14px", display: "flex", alignItems: "center", gap: "12px", transition: "transform 0.12s ease, box-shadow 0.12s ease", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a"; }}
                  onMouseDown={e => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "1px 1px 0 #1a1a1a"; }}
                  onMouseUp={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "3px 5px 0 #1a1a1a"; }}
                >
                  {/* Categorie kleurblok */}
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: col.bg, border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", fontWeight: 900, color: col.text, textAlign: "center", lineHeight: 1.1 }}>{ex.category?.slice(0, 3).toUpperCase()}</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>{ex.name}</p>
                    {ex.description && (
                      <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.45)", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{ex.description}</p>
                    )}
                    {ex.duration_minutes && (
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.35)", marginTop: "2px" }}>{ex.duration_minutes} min</p>
                    )}
                  </div>

                  <ChevronRight size={18} style={{ color: "rgba(26,26,26,0.25)", flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}