import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Instagram } from "lucide-react";
import WebsiteHero from "@/components/website/WebsiteHero";

export default function WebsiteContact() {
  return (
    <div style={{ background: "#10121A" }}>
      <WebsiteHero title="CONTACT" minHeight="40vh" />

      <section style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Contact</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(32px, 5vw, 48px)", color: "#fff", margin: 0 }}>NEEM CONTACT OP</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            <div style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", padding: "36px 28px", textAlign: "center" }}>
              <Mail style={{ color: "#FF6800", marginBottom: "16px", margin: "0 auto 16px" }} size={28} />
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>E-mail</div>
              <a href="mailto:contact@fcmvanoord.com" style={{ color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>contact@fcmvanoord.com</a>
            </div>
            <div style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", padding: "36px 28px", textAlign: "center" }}>
              <MapPin style={{ color: "#FF6800", margin: "0 auto 16px" }} size={28} />
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>Locatie</div>
              <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Sportpark Opeinde</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "4px" }}>Opeinde, Friesland</div>
            </div>
            <div style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", padding: "36px 28px", textAlign: "center" }}>
              <Instagram style={{ color: "#FF6800", margin: "0 auto 16px" }} size={28} />
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>Instagram</div>
              <a href="https://instagram.com/mv.artemis" target="_blank" rel="noopener noreferrer" style={{ color: "#FF6800", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>@mv.artemis</a>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "64px" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(28px, 4vw, 40px)", color: "#fff", marginBottom: "24px", letterSpacing: "1px" }}>
              KLAAR OM MEE TE DOEN?
            </div>
            <Link to="/proeftraining" style={{
              display: "inline-flex", background: "#FF6800", color: "#fff",
              borderRadius: "3px", padding: "16px 36px", fontSize: "15px",
              fontWeight: 700, textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Plan een proeftraining ↗
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}