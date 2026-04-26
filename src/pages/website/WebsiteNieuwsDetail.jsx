import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CalendarBlank, User, Clock } from "@phosphor-icons/react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { applyWebsiteMeta } from "@/lib/websiteMeta";
import ScoreBar from "@/components/website/nieuws/ScoreBar";
import ShareButtons from "@/components/website/nieuws/ShareButtons";
import AuteurBlok from "@/components/website/nieuws/AuteurBlok";

const categoryColors = {
  "Wedstrijdverslag": { bg: "rgba(255,104,0,0.15)", color: "#FF6800" },
  "Clubnieuws": { bg: "rgba(27,42,94,0.5)", color: "rgba(255,255,255,0.7)" },
  "Selectie-update": { bg: "rgba(255,214,0,0.1)", color: "#FFD600" },
  "Resultaten": { bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
};

const renderInhoud = (text) => {
  if (!text) return "";
  if (/<\/?(p|h1|h2|h3|ul|ol|li|strong|em|blockquote|a|img|hr|br|mark|u|s)\b/i.test(text)) {
    return text;
  }
  return text
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*?)$/gm, "<li>$1</li>")
    .replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>");
};

const berekenLeestijd = (inhoud) => {
  const woorden = inhoud?.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.ceil(woorden / 200));
};

export default function WebsiteNieuwsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [bericht, setBericht] = useState(null);
  const [gerelateerd, setGerelateerd] = useState([]);
  const [settings, setSettings] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      const all = res?.data?.nieuwsberichten || [];
      const found = all.find(x => x.slug === slug);
      if (!found) {
        navigate("/nieuws");
        return;
      }
      setBericht(found);
      setSettings(res?.data?.settings || null);
      const related = all
        .filter(x => x.id !== found.id)
        .sort((a, b) => (a.categorie === found.categorie ? -1 : 0))
        .slice(0, 3);
      setGerelateerd(related);

      applyWebsiteMeta({
        title: `${found.titel} | MV Artemis`,
        description: found.samenvatting || found.titel,
        ogImage: found.afbeelding_url || undefined,
      });
    });
  }, [slug, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const artikel = document.getElementById('artikel-inhoud');
      if (!artikel) return;

      const artikelTop = artikel.offsetTop;
      const artikelHeight = artikel.offsetHeight;
      const scrolled = window.scrollY - artikelTop;
      const percentage = Math.min(100, Math.max(0, (scrolled / artikelHeight) * 100));
      setProgress(percentage);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [bericht]);

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

  const leestijd = berekenLeestijd(bericht.inhoud);

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
        .artikel-content > p:first-of-type {
          font-size: 18px !important;
          line-height: 1.7 !important;
          color: rgba(255,255,255,0.85) !important;
          font-weight: 500 !important;
          border-left: 3px solid #FF6800;
          padding-left: 20px;
          margin-bottom: 28px !important;
        }
        .gerelateerd-card .gerelateerd-img-wrapper { overflow: hidden; border-radius: 6px 6px 0 0; }
        .gerelateerd-card .gerelateerd-img-wrapper img { transition: transform 0.3s ease; transform: scale(1); }
        .gerelateerd-card:hover .gerelateerd-img-wrapper img { transform: scale(1.05); }
        .gerelateerd-card:hover { border-color: rgba(255,104,0,0.3) !important; }
      `}</style>

      {/* PROGRESS BAR */}
      <div style={{
        position: "fixed",
        top: "70px",
        left: 0,
        right: 0,
        zIndex: 50,
        height: "2px",
        background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          width: `${progress}%`,
          background: "#FF6800",
          height: "100%",
          transition: "width 0.1s linear",
        }} />
      </div>

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

          {/* META RIJ */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <CalendarBlank size={13} weight="bold" color="rgba(255,255,255,0.4)" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{formatDate(bericht.datum)}</span>
            </span>
            {bericht.auteur && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <User size={13} weight="bold" color="rgba(255,255,255,0.4)" />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{bericht.auteur}</span>
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Clock size={13} weight="bold" color="rgba(255,255,255,0.4)" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{leestijd} min lezen</span>
            </span>
          </div>

          <h1 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "48px", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.1 }}>
            {bericht.titel}
          </h1>
        </div>
      </div>

      {/* SCOREBALK */}
      <ScoreBar bericht={bericht} settings={settings} />

      {/* ARTIKEL INHOUD */}
      <div style={{ padding: "48px 28px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Link to="/nieuws" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "32px", fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#FF6800", textDecoration: "none", transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            <ArrowLeft weight="bold" size={16} /> Terug naar nieuws
          </Link>

          <div id="artikel-inhoud" className="artikel-content" dangerouslySetInnerHTML={{ __html: renderInhoud(bericht.inhoud) }} />

          {/* SOCIAL SHARE */}
          <ShareButtons titel={bericht.titel} />

          {/* AUTEUR BLOK */}
          <AuteurBlok auteur={bericht.auteur} />
        </div>
      </div>

      {/* GERELATEERDE BERICHTEN */}
      {gerelateerd.length > 0 && (
        <div style={{ padding: "48px 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h3 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "28px" }}>MEER NIEUWS</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {gerelateerd.map(b => {
                const relLeestijd = berekenLeestijd(b.inhoud);
                return (
                  <Link
                    key={b.id}
                    to={`/nieuws/${b.slug}`}
                    className="gerelateerd-card"
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
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
                  >
                    <div className="gerelateerd-img-wrapper" style={{ height: "140px", background: b.afbeelding_url ? "none" : "linear-gradient(135deg, #1B2A5E, #0F1630)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                        {relLeestijd} min lezen
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </WebsiteLayout>
  );
}