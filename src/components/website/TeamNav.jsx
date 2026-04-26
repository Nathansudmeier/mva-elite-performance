import React from "react";
import { Link, useLocation } from "react-router-dom";

const TABS = [
  {
    label: "MO15",
    href: "/mo15",
    badge: { text: "Dit seizoen", bg: "rgba(255,104,0,0.2)", color: "#FF6800" },
  },
  { label: "MO17", href: "/mo17" },
  {
    label: "MO20",
    href: "/mo20",
    badge: { text: "26/27", bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" },
  },
  { label: "Vrouwen 1", href: "/vrouwen-1" },
];

const baseTabStyle = {
  padding: "14px 20px",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
  borderBottom: "3px solid transparent",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const badgeStyle = (b) => ({
  fontSize: "9px",
  background: b.bg,
  color: b.color,
  padding: "1px 5px",
  borderRadius: "2px",
  fontWeight: 700,
  textTransform: "none",
  letterSpacing: "0.3px",
});

export default function TeamNav() {
  const location = useLocation();

  return (
    <nav
      style={{
        background: "#1B2A5E",
        padding: "0 28px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 0,
        overflowX: "auto",
      }}
    >
      {TABS.map((t) => {
        const isActive = location.pathname === t.href;
        return (
          <Link
            key={t.href}
            to={t.href}
            style={{
              ...baseTabStyle,
              color: isActive ? "#FF6800" : "rgba(255,255,255,0.45)",
              borderBottom: isActive ? "3px solid #FF6800" : "3px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.45)";
            }}
          >
            {t.label}
            {t.badge && <span style={badgeStyle(t.badge)}>{t.badge.text}</span>}
          </Link>
        );
      })}
    </nav>
  );
}