import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Homepage", href: "/" },
  { label: "Selecties", href: "/selecties" },
  { label: "Wedstrijden", href: "/wedstrijden" },
  { label: "De Club", href: "/de-club" },
  { label: "Contact", href: "/contact" },
];

export default function WebsiteLayout({ children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;700&display=swap";
    document.head.appendChild(link);
    document.body.style.background = "#10121A";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    return () => { document.body.style.background = ""; };
  }, []);

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#10121A", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, height: "70px", background: "#1B2A5E", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "2px", color: "#fff" }}>
            MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS
          </span>
        </Link>

        <div style={{ display: "flex", gap: "28px", alignItems: "center" }} className="w-desktop-nav">
          {navLinks.map((l) => (
            <Link key={l.href} to={l.href} style={{ textDecoration: "none", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: location.pathname === l.href ? "#FF6800" : "#fff" }}>{l.label}</Link>
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
            <Link key={l.href} to={l.href} onClick={() => setMenuOpen(false)} style={{ textDecoration: "none", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: location.pathname === l.href ? "#FF6800" : "#fff" }}>{l.label}</Link>
          ))}
        </div>
      )}

      <main style={{ paddingTop: "70px", minHeight: "100vh" }}>{children}</main>

      {/* FOOTER */}
      <footer style={{ background: "#1B2A5E", padding: "40px 28px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", maxWidth: "1200px", margin: "0 auto" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#fff", marginBottom: "8px" }}>MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "4px" }}>Meiden Vereniging Artemis</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginBottom: "4px" }}>Jouw ambitie. Ons doel.</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>Opeinde, Friesland</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "12px" }}>NAVIGATIE</div>
            {navLinks.map(l => <div key={l.href} style={{ marginBottom: "8px" }}><Link to={l.href} style={{ textDecoration: "none", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{l.label}</Link></div>)}
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "12px" }}>CONTACT</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>contact@fcmvanoord.com</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "16px" }}>mv-artemis.nl</div>
            <Link to="/proeftraining" style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontWeight: 700, fontSize: "13px", padding: "10px 20px", textDecoration: "none", display: "inline-block" }}>Proeftraining aanvragen</Link>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "24px", paddingTop: "16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", maxWidth: "1200px", margin: "24px auto 0" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>© 2025 MV Artemis · Meiden Vereniging Artemis</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>KVK: Opeinde · KNVB</span>
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) { .w-desktop-nav { display: flex !important; } .w-hamburger { display: none !important; } }
        @media (max-width: 767px) { .w-desktop-nav { display: none !important; } .w-hamburger { display: block !important; } }
      `}</style>
    </div>
  );
}