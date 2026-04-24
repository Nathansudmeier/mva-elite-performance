import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "@/components/website/WebsiteLayout";

const categoryColors = {
  "Wedstrijdverslag": { bg: "rgba(255,104,0,0.15)", color: "#FF6800" },
  "Clubnieuws": { bg: "rgba(27,42,94,0.5)", color: "rgba(255,255,255,0.7)" },
  "Selectie-update": { bg: "rgba(255,214,0,0.1)", color: "#FFD600" },
  "Resultaten": { bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
};

const renderMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*?)$/gm, "<li>$1</li>")
    .replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>");
};

export default function WebsiteNieuwsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [bericht, setBericht] = useState(null);
  const [gerelateerd, setGerelateerd] = useState([]);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      const all = res?.data?.nieuwsberichten || [];
      const found = all.find(x => x.slug === slug);
      if (!found) {
        navigate("/nieuws");
        return;
      }
      setBericht(found);
      const related = all
        .filter(x => x.id !== found.id)
        .sort((a, b) => (a.categorie === found.categorie ? -1 : 0))
        .slice(0, 3);
      setGerelateerd(related);
    });
  }, [slug, navigate]);

  if (!bericht) {
    return <WebsiteLayout><div style={{ padding: "48px 28px", textAlign: "center", color: "#fff" }}>Laden...</div></WebsiteLayout>;
  }

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
        .artikel-content { font-family: 'Space Grotesk', sans-serif; font-size: 16px; color: #e8e8ea; line-height: 1.8; }
        .artikel-content p { font-size: 16px; color: #e8e8ea; line-height: 1.8; margin-bottom: 20px; margin-top: 0; }
        .artikel-content h2 { font-family: 'Bebas Neue', serif; font-size: 32px; font-weight: 700; color: #fff; margin: 32px 0 12px 0; }
        .artikel-content h3 { font-family: 'Bebas Neue', serif; font-size: 24px; font-weight: 700; color: #FF6800; margin: 24px 0 10px 0; }
        .artikel-content strong { color: #fff; font-weight: 700; }
        .artikel-content a { color: #FF6800; text-decoration: underline; }
        .artikel-content ul { margin-left: 20px; margin-bottom: 20px; }
        .artikel-content li { margin-bottom: 6px; color: #d4d4d8; }
      `}</style>

      {/* HERO */}
      <div
        style={{
          height: "300px",
          background: bericht.afbeelding_url
            ? `url('${bericht.afbeelding_url}') center / cover`
            : "linear-gradient(135deg, #1B2A5E, #0F1630)",
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
        <div style={{ position: "relative", padding: "0 28px 40px", width: "100%", maxWidth: "720px", margin: "0 auto", paddingLeft: "28px", paddingRight: "28px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 8px", borderRadius: "3px", ...categoryColors[bericht.categorie] }}>
              {bericht.categorie}
            </span>
            {bericht.team !== "Alle" && (
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", padding: "3px 7px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                {bericht.team}
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "48px", fontWeight: 700, color: "#fff", margin: "0 0 16px 0", lineHeight: 1.1 }}>
            {bericht.titel}
          </h1>
          <div style={{ fontSize: "12px", fontFamily: "'Space Grotesk', sans-serif", color: "rgba(255,255,255,0.7)" }}>
            {formatDate(bericht.datum)} {bericht.auteur && `· ${bericht.auteur}`}
          </div>
        </div>
      </div>

      {/* ARTIKEL INHOUD */}
      <div style={{ padding: "48px 28px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Link to="/nieuws" style={{ display: "inline-block", marginBottom: "32px", fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#FF6800", textDecoration: "none", transition: "opacity 0.2s" }} onMouseEnter={e => e.target.style.opacity = 0.8} onMouseLeave={e => e.target.style.opacity = 1}>
            ← Terug naar nieuws
          </Link>

          <div className="artikel-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(bericht.inhoud) }} />
        </div>
      </div>

      {/* GERELATEERDE BERICHTEN */}
      {gerelateerd.length > 0 && (
        <div style={{ padding: "48px 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h3 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "28px" }}>MEER NIEUWS</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {gerelateerd.map(b => (
                <Link
                  key={b.id}
                  to={`/nieuws/${b.slug}`}
                  style={{
                    background: "#202840",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    transition: "border-color 0.2s, transform 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,104,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ height: "140px", overflow: "hidden", background: b.afbeelding_url ? "none" : "linear-gradient(135deg, #1B2A5E, #0F1630)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {b.afbeelding_url ? (
                      <img src={b.afbeelding_url} alt={b.titel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "28px" }}>{getCategoryIcon(b.categorie)}</span>
                    )}
                  </div>
                  <div style={{ padding: "12px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", ...categoryColors[b.categorie], display: "inline-block", marginBottom: "6px" }}>
                      {b.categorie}
                    </span>
                    <h4 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "16px", color: "#fff", lineHeight: 1.1, marginBottom: "6px", margin: 0 }}>
                      {b.titel}
                    </h4>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      {new Date(b.datum).toLocaleDateString("nl-NL", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </WebsiteLayout>
  );
}