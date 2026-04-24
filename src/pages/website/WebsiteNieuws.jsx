import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "@/components/website/WebsiteLayout";

const CATEGORIES = ["Alle", "Wedstrijdverslag", "Clubnieuws", "Selectie-update", "Resultaten"];
const TEAMS = ["Alle", "MO17", "MO20", "Vrouwen 1"];

const categoryColors = {
  "Wedstrijdverslag": { bg: "rgba(255,104,0,0.15)", color: "#FF6800" },
  "Clubnieuws": { bg: "rgba(27,42,94,0.5)", color: "rgba(255,255,255,0.7)" },
  "Selectie-update": { bg: "rgba(255,214,0,0.1)", color: "#FFD600" },
  "Resultaten": { bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
};

export default function WebsiteNieuws() {
  const [berichten, setBerichten] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [teamFilter, setTeamFilter] = useState("Alle");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      setBerichten(res?.data?.nieuwsberichten || []);
    });
  }, []);

  const filtered = berichten.filter(b => {
    const catMatch = categoryFilter === "Alle" || b.categorie === categoryFilter;
    const teamMatch = teamFilter === "Alle" || b.team === teamFilter || b.team === "Alle";
    return catMatch && teamMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paged = filtered.slice(start, start + itemsPerPage);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });
  };

  const getCategoryIcon = (cat) => {
    const icons = { "Wedstrijdverslag": "🏆", "Clubnieuws": "📰", "Selectie-update": "👥", "Resultaten": "📊" };
    return icons[cat] || "📰";
  };

  return (
    <WebsiteLayout>
      <style>{`
        @media (max-width: 767px) {
          .nieuws-grid { grid-template-columns: 1fr !important; }
          .filter-bar { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .nieuws-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* HERO */}
      <div style={{ background: "#0F1630", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "8px", fontFamily: "'Space Grotesk', sans-serif" }}>MV ARTEMIS</div>
          <h1 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "52px", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1 }}>NIEUWS & UPDATES</h1>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar" style={{ background: "#10121A", padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: "70px", zIndex: 50, display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginRight: "8px" }}>Filter:</span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
              style={{
                padding: "6px 14px",
                borderRadius: "3px",
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: "pointer",
                border: "none",
                background: categoryFilter === cat ? "#FF6800" : "#202840",
                color: categoryFilter === cat ? "#fff" : "rgba(255,255,255,0.6)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginLeft: "auto" }}>
          {TEAMS.map(team => (
            <button
              key={team}
              onClick={() => { setTeamFilter(team); setCurrentPage(1); }}
              style={{
                padding: "6px 12px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: "pointer",
                border: "none",
                background: teamFilter === team ? "#FF6800" : "#202840",
                color: teamFilter === team ? "#fff" : "rgba(255,255,255,0.6)",
              }}
            >
              {team === "Vrouwen 1" ? "V1" : team}
            </button>
          ))}
        </div>
      </div>

      {/* NIEUWS GRID */}
      <div style={{ padding: "40px 28px" }}>
        {paged.length > 0 ? (
          <>
            <div className="nieuws-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {paged.map(b => (
                <Link
                  key={b.id}
                  to={`/nieuws/${b.slug}`}
                  style={{
                    background: "#202840",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    transition: "border-color 0.2s, transform 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,104,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ height: "200px", overflow: "hidden", background: b.afbeelding_url ? "none" : "linear-gradient(135deg, #1B2A5E, #0F1630)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {b.afbeelding_url ? (
                      <img src={b.afbeelding_url} alt={b.titel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "40px" }}>{getCategoryIcon(b.categorie)}</span>
                    )}
                  </div>
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 8px", borderRadius: "3px", ...categoryColors[b.categorie] }}>
                        {b.categorie}
                      </span>
                      {b.team !== "Alle" && (
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", padding: "3px 7px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                          {b.team === "Vrouwen 1" ? "V1" : b.team}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "20px", color: "#fff", lineHeight: 1.1, marginBottom: "8px", margin: 0, flex: 1 }}>
                      {b.titel}
                    </h3>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.55, marginBottom: "14px", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {b.samenvatting}
                    </p>
                    <div style={{ marginTop: "auto", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                      {formatDate(b.datum)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "32px" }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: "8px 16px", borderRadius: "3px", border: "none", background: currentPage === 1 ? "rgba(255,255,255,0.1)" : "#FF6800", color: "#fff", fontWeight: 700, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
                >
                  ← Vorige
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ padding: "6px 12px", borderRadius: "3px", border: "none", background: currentPage === page ? "#FF6800" : "#202840", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: "8px 16px", borderRadius: "3px", border: "none", background: currentPage === totalPages ? "rgba(255,255,255,0.1)" : "#FF6800", color: "#fff", fontWeight: 700, cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}
                >
                  Volgende →
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 28px", color: "rgba(255,255,255,0.35)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px" }}>
            Geen berichten gevonden.
          </div>
        )}
      </div>
    </WebsiteLayout>
  );
}