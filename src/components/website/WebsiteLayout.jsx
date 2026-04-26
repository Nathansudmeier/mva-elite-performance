import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { applyWebsiteMeta } from "@/lib/websiteMeta";
import SponsorBar from "@/components/website/SponsorBar.jsx";
import { InstagramLogo, TiktokLogo, FacebookLogo } from "@phosphor-icons/react";
import NieuwsbriefAanmeld from "@/components/website/NieuwsbriefAanmeld";

const navLinks = [
  { label: "Homepage", href: "/" },
  { label: "Selecties", href: "/selecties" },
  { label: "MO15", href: "/mo15", tempBadge: "Dit seizoen" },
  { label: "Wedstrijden", href: "/wedstrijden" },
  { label: "Nieuws", href: "/nieuws" },
  { label: "De Club", href: "/de-club" },
  { label: "Contact", href: "/contact" },
];

const tempBadgeStyle = {
  fontSize: "9px",
  background: "rgba(255,104,0,0.2)",
  color: "#FF6800",
  padding: "2px 5px",
  borderRadius: "2px",
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "none",
};

export default function WebsiteLayout({ children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inst, setInst] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;700&display=swap";
    document.head.appendChild(link);
    document.body.style.background = "#10121A";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    const fetchData = () => {
      base44.functions.invoke('getWebsiteData', {}).then(res => {
        if (res?.data?.instellingen) setInst(res.data.instellingen);
        if (res?.data?.liveMatches) setLiveMatches(res.data.liveMatches);
      });
    };

    fetchData();
    // Poll every 30 seconds to check for live matches
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      document.body.style.background = "";
    };
  }, []);

  // Update meta tags bij elke route-wijziging
  useEffect(() => {
    // Niet overschrijven op nieuwsdetail-pagina's — die zetten hun eigen meta's
    if (location.pathname.startsWith("/nieuws/")) return;
    applyWebsiteMeta({ pathname: location.pathname });
  }, [location.pathname]);

  const email = inst?.club_email || "contact@fcmvanoord.com";
  const locatie = inst?.club_locatie || "Opeinde, Friesland";
  const instagram = inst?.instagram_url || null;
  const tiktok = inst?.tiktok_url || null;
  const facebook = inst?.facebook_url || null;
  const kvk = inst?.kvk_nummer || null;

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#10121A", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, height: "70px", background: "#1B2A5E", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          {inst?.logo_url && <img src={inst.logo_url} alt="logo" style={{ height: "38px", width: "38px", objectFit: "contain" }} />}
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "2px", color: "#fff" }}>
            MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS
          </span>
        </Link>

        <div style={{ display: "flex", gap: "28px", alignItems: "center" }} className="w-desktop-nav">
          {navLinks.map((l) => (
            <Link key={l.href} to={l.href} style={{ textDecoration: "none", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: location.pathname === l.href ? "#FF6800" : "#fff", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {l.label}
              {l.tempBadge && <span style={tempBadgeStyle}>{l.tempBadge}</span>}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/proeftraining" style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "12px", padding: "8px 16px", textDecoration: "none" }}>Proeftraining ↗</Link>
          <button className="w-hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: "24px", lineHeight: 1, padding: "4px" }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{ position: "fixed", top: "70px", left: 0, right: 0, background: "#1B2A5E", zIndex: 99, padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "16px" }}>
          {navLinks.map((l) => (
            <Link key={l.href} to={l.href} onClick={() => setMenuOpen(false)} style={{ textDecoration: "none", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: location.pathname === l.href ? "#FF6800" : "#fff", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              {l.label}
              {l.tempBadge && <span style={tempBadgeStyle}>{l.tempBadge}</span>}
            </Link>
          ))}
        </div>
      )}

      {/* LIVE MATCH BANNER */}
      {liveMatches.length > 0 && (
        <div style={{ position: "fixed", top: "70px", left: 0, right: 0, zIndex: 98, background: "linear-gradient(90deg, #FF6800, #cc4400)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fff", display: "inline-block", animation: "livePulse 1.5s ease-in-out infinite" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "13px" }}>
            🔴 LIVE — MV Artemis vs {liveMatches[0].opponent}
          </span>
          <Link to={`/live/${liveMatches[0].id}`} style={{ background: "#fff", color: "#FF6800", borderRadius: "3px", fontWeight: 800, fontSize: "12px", padding: "5px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>
            Volg live →
          </Link>
        </div>
      )}

      <main style={{ paddingTop: liveMatches.length > 0 ? "116px" : "70px", minHeight: "100vh" }}>{children}</main>

      {location.pathname !== "/" && <SponsorBar />}

      {/* FOOTER */}
      <footer style={{ background: "#1B2A5E", padding: "40px 28px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", maxWidth: "1200px", margin: "0 auto" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#fff", marginBottom: "8px" }}>MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "4px" }}>Meiden Vereniging Artemis</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginBottom: "4px" }}>Jouw ambitie. Ons doel.</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{locatie}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "12px" }}>NAVIGATIE</div>
            {navLinks.map(l => <div key={l.href} style={{ marginBottom: "8px" }}><Link to={l.href} style={{ textDecoration: "none", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{l.label}</Link></div>)}
            <div style={{ marginBottom: "8px" }}><Link to="/nieuws" style={{ textDecoration: "none", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Nieuws</Link></div>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "12px" }}>CONTACT</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>{email}</div>
             <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>mv-artemis.nl</div>
             <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
               {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(255,255,255,0.6)", display: "inline-flex", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.9)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}><InstagramLogo weight="bold" size={20} /></a>}
               {tiktok && <a href={tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={{ color: "rgba(255,255,255,0.6)", display: "inline-flex", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.9)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}><TiktokLogo weight="bold" size={20} /></a>}
               {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: "rgba(255,255,255,0.6)", display: "inline-flex", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.9)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}><FacebookLogo weight="bold" size={20} /></a>}
             </div>
             <Link to="/proeftraining" style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontWeight: 700, fontSize: "13px", padding: "10px 20px", textDecoration: "none", display: "inline-block" }}>Proeftraining aanvragen</Link>
             <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
               <NieuwsbriefAanmeld />
             </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "24px", paddingTop: "16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", maxWidth: "1200px", margin: "24px auto 0" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>© 2025 MV Artemis · Meiden Vereniging Artemis</span>
          {kvk && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>KVK: {kvk}</span>}
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) { .w-desktop-nav { display: flex !important; } .w-hamburger { display: none !important; } }
        @media (max-width: 767px) { .w-desktop-nav { display: none !important; } .w-hamburger { display: block !important; } }
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}