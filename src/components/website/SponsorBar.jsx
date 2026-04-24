import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function SponsorBar() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      const list = (res?.data?.sponsors || []).filter(s => s.actief);
      const sorted = list.sort((a, b) => (a.tier || 99) - (b.tier || 99) || (a.volgorde || 0) - (b.volgorde || 0));
      setSponsors(sorted);
    });
  }, []);

  if (sponsors.length === 0) return null;

  return (
    <div style={{ background: "#0C0E14", padding: "20px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginRight: "8px" }}>PARTNERS</span>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
      </div>

      {sponsors.map((s, i) => {
        const content = s.logo_url ? (
          <img src={s.logo_url} alt={s.naam} style={{ maxHeight: "18px", maxWidth: "80px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        ) : (
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px" }}>{s.naam}</span>
        );

        const linkStyle = {
          display: "flex",
          alignItems: "center",
          opacity: 0.4,
          transition: "opacity 0.2s",
          textDecoration: "none",
        };

        return (
          <React.Fragment key={s.id || i}>
            {s.website_url ? (
              <a
                href={s.website_url}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.opacity = 0.8)}
                onMouseLeave={e => (e.currentTarget.style.opacity = 0.4)}
              >
                {content}
              </a>
            ) : (
              <div style={linkStyle}>{content}</div>
            )}
            {i < sponsors.length - 1 && (
              <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "12px" }}>·</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}