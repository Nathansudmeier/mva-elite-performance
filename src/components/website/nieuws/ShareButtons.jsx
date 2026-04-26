import React, { useState } from "react";
import { WhatsappLogo, FacebookLogo, Link as LinkIcon } from "@phosphor-icons/react";

export default function ShareButtons({ titel }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnBase = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "4px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    transition: "opacity 0.15s",
    border: "none",
  };

  return (
    <div style={{
      background: "#161A24",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "6px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
      marginTop: "32px",
    }}>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
        Deel dit artikel
      </span>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(titel + " — " + url)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnBase, background: "#25D366", color: "#fff" }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          <WhatsappLogo weight="bold" size={14} />
          WhatsApp
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnBase, background: "#1877F2", color: "#fff" }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          <FacebookLogo weight="bold" size={14} />
          Facebook
        </a>

        <button
          onClick={handleCopy}
          style={{ ...btnBase, background: "#202840", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          <LinkIcon weight="bold" size={14} />
          {copied ? "Gekopieerd ✓" : "Kopieer link"}
        </button>
      </div>
    </div>
  );
}