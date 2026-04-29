import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

export default function SponsorBar() {
  const [sponsors, setSponsors] = useState([]);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      const list = (res?.data?.sponsors || []).filter(s => s.actief);
      const sorted = list.sort((a, b) => (a.tier || 99) - (b.tier || 99) || (a.volgorde || 0) - (b.volgorde || 0));
      setSponsors(sorted);
    });
  }, []);

  if (sponsors.length === 0) return null;

  // Duplicate list for seamless loop
  const tickerSponsors = [...sponsors, ...sponsors];

  const itemStyle = {
    display: "flex",
    alignItems: "center",
    opacity: 0.45,
    transition: "opacity 0.2s",
    textDecoration: "none",
    flexShrink: 0,
    paddingRight: "48px",
  };

  const renderSponsorContent = (s) =>
    s.logo_url ? (
      <img
        src={s.logo_url}
        alt={s.naam}
        style={{ maxHeight: "28px", maxWidth: "110px", objectFit: "contain", filter: "brightness(0) invert(1)" }}
      />
    ) : (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
        {s.naam}
      </span>
    );

  return (
    <div
      style={{ background: "#0C0E14", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", overflow: "hidden", height: "56px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fixed PARTNERS label */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0, padding: "0 20px 0 28px", zIndex: 2 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
          PARTNERS
        </span>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
      </div>

      {/* Ticker wrapper with fade overlays */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden", height: "100%" }}>
        {/* Left fade */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "60px", background: "linear-gradient(to right, #0C0E14, transparent)", zIndex: 1, pointerEvents: "none" }} />
        {/* Right fade */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "60px", background: "linear-gradient(to left, #0C0E14, transparent)", zIndex: 1, pointerEvents: "none" }} />

        {/* Scrolling track */}
        <div
          ref={trackRef}
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            animation: "sponsorTicker 45s linear infinite",
            animationPlayState: paused ? "paused" : "running",
            width: "max-content",
          }}
        >
          {tickerSponsors.map((s, i) => {
            const isLink = !!s.website_url;
            const Tag = isLink ? "a" : "div";
            const extraProps = isLink
              ? { href: s.website_url, target: "_blank", rel: "noopener noreferrer" }
              : {};
            return (
              <Tag
                key={i}
                {...extraProps}
                style={itemStyle}
                onMouseEnter={e => (e.currentTarget.style.opacity = 0.85)}
                onMouseLeave={e => (e.currentTarget.style.opacity = 0.45)}
              >
                {renderSponsorContent(s)}
              </Tag>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes sponsorTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}