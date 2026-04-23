import React from "react";
import { Link } from "react-router-dom";

export default function WebsiteHero({ title, subtitle, ctaLabel, ctaHref, bgImage, minHeight = "100vh", overlay = "rgba(10,14,30,0.65)" }) {
  return (
    <div style={{
      position: "relative", minHeight, display: "flex", alignItems: "flex-end",
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "#10121A",
      overflow: "hidden"
    }}>
      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${overlay} 0%, rgba(10,14,30,0.3) 60%, rgba(10,14,30,0.1) 100%)` }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, padding: "80px 48px", maxWidth: "900px" }}>
        {title && (
          <h1 style={{
            fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(52px, 8vw, 80px)",
            lineHeight: 1, margin: 0, color: "#fff", letterSpacing: "1px"
          }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <h2 style={{
            fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(52px, 8vw, 80px)",
            lineHeight: 1, margin: 0, color: "#FF6800", letterSpacing: "1px"
          }}>
            {subtitle}
          </h2>
        )}
        {ctaLabel && ctaHref && (
          <Link to={ctaHref} style={{
            display: "inline-flex", marginTop: "32px", background: "#FFD600",
            color: "#10121A", borderRadius: "3px", padding: "14px 28px",
            fontSize: "14px", fontWeight: 700, textDecoration: "none",
            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.05em"
          }}>
            {ctaLabel} ↗
          </Link>
        )}
      </div>
    </div>
  );
}