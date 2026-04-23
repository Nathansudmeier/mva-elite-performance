import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Homepage", href: "/" },
  { label: "Selecties", href: "/selecties" },
  { label: "Wedstrijden", href: "/wedstrijden" },
  { label: "De Club", href: "/de-club" },
  { label: "Contact", href: "/contact" },
];

export default function WebsiteLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#10121A", minHeight: "100vh", color: "#fff" }}>
      {/* Topbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#1B2A5E", height: "70px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            fontFamily: "'Bebas Neue', cursive", fontSize: "22px", letterSpacing: "2px",
            color: "#fff", lineHeight: 1
          }}>
            MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex" style={{ gap: "32px", alignItems: "center" }}>
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.href ||
              (link.href !== "/" && location.pathname.startsWith(link.href));
            return (
              <Link key={link.href} to={link.href} style={{
                textDecoration: "none", fontSize: "12px", fontWeight: 500,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: isActive ? "#FF6800" : "rgba(255,255,255,0.85)",
                transition: "color 0.15s"
              }}>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/proeftraining" style={{
            background: "#FF6800", color: "#fff", borderRadius: "3px",
            padding: "10px 18px", fontSize: "14px", fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "6px"
          }}>
            Proeftraining ↗
          </Link>
          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "22px" }}>
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          position: "fixed", top: "70px", left: 0, right: 0, zIndex: 99,
          background: "#1B2A5E", padding: "24px 32px", display: "flex",
          flexDirection: "column", gap: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} style={{
              textDecoration: "none", fontSize: "14px", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.08em", color: "#fff"
            }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Page content */}
      <div style={{ paddingTop: "70px" }}>
        {children}
      </div>

      {/* Footer */}
      <footer style={{ background: "#1B2A5E", marginTop: "0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 32px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "48px", marginBottom: "48px" }}>
            {/* Kolom 1 */}
            <div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", letterSpacing: "2px", marginBottom: "12px" }}>
                MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
                <div>Meiden Vereniging Artemis</div>
                <div style={{ color: "#FF6800", fontStyle: "italic", margin: "6px 0" }}>Jouw ambitie. Ons doel.</div>
                <div>Opeinde, Friesland</div>
              </div>
            </div>
            {/* Kolom 2 */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Navigatie</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} to={link.href} style={{ textDecoration: "none", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{link.label}</Link>
                ))}
              </div>
            </div>
            {/* Kolom 3 */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Contact</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 2 }}>
                <div>contact@fcmvanoord.com</div>
                <div>mv-artemis.nl</div>
              </div>
              <Link to="/proeftraining" style={{
                display: "inline-flex", marginTop: "16px", background: "#FF6800",
                color: "#fff", borderRadius: "3px", padding: "10px 18px",
                fontSize: "14px", fontWeight: 700, textDecoration: "none"
              }}>
                Proeftraining ↗
              </Link>
            </div>
          </div>
          {/* Onderbalk */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>© 2025 MV Artemis · Meiden Vereniging Artemis</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>KVK: Opeinde · KNVB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}