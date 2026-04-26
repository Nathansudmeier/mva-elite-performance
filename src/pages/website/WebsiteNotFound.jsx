import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WebsiteLayout from "@/components/website/WebsiteLayout";

const quickLinks = [
  { label: "Selecties", href: "/selecties" },
  { label: "MO17", href: "/mo17" },
  { label: "Vrouwen 1", href: "/vrouwen-1" },
  { label: "Nieuws", href: "/nieuws" },
  { label: "Wedstrijden", href: "/wedstrijden" },
  { label: "Proeftraining", href: "/proeftraining" },
  { label: "Contact", href: "/contact" },
];

function GhostButton({ to, children }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent",
        border: `1px solid ${hover ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)"}`,
        color: hover ? "#fff" : "rgba(255,255,255,0.6)",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: "14px",
        padding: "13px 24px",
        borderRadius: "3px",
        textDecoration: "none",
        transition: "all 0.15s",
      }}
    >
      {children}
    </Link>
  );
}

function QuickLink({ to, children }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#202840",
        border: `1px solid ${hover ? "rgba(255,104,0,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "4px",
        padding: "8px 16px",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        color: hover ? "#FF6800" : "rgba(255,255,255,0.5)",
        textDecoration: "none",
        transition: "all 0.15s",
      }}
    >
      {children}
    </Link>
  );
}

export default function WebsiteNotFound() {
  useEffect(() => {
    document.title = "Pagina niet gevonden — MV Artemis";
  }, []);

  return (
    <WebsiteLayout>
      <div
        style={{
          background: "#10121A",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 28px",
            textAlign: "center",
          }}
        >
          <div>
            {/* Groot 404 op de achtergrond */}
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(120px, 20vw, 200px)",
                lineHeight: 0.85,
                color: "rgba(255,104,0,0.12)",
                position: "relative",
                display: "block",
                marginBottom: "-20px",
                letterSpacing: "-4px",
              }}
            >
              404
            </span>

            {/* Overlappende tekst */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#FF6800",
                  letterSpacing: "3px",
                  marginBottom: "12px",
                }}
              >
                OEPS
              </div>

              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontWeight: 700,
                  fontSize: "48px",
                  color: "#fff",
                  lineHeight: 1,
                  marginBottom: "16px",
                  margin: "0 0 16px",
                }}
              >
                Deze pagina bestaat niet.
              </h1>

              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.5)",
                  maxWidth: "440px",
                  margin: "0 auto 32px",
                  lineHeight: 1.7,
                }}
              >
                De pagina die je zoekt is verplaatst, verwijderd of heeft nooit bestaan. Geen paniek — gebruik de links hieronder om verder te gaan.
              </p>

              {/* Knoppen */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to="/"
                  style={{
                    background: "#FF6800",
                    color: "#fff",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "13px 24px",
                    borderRadius: "3px",
                    textDecoration: "none",
                  }}
                >
                  Terug naar homepage →
                </Link>
                <GhostButton to="/nieuws">Bekijk het nieuws</GhostButton>
              </div>

              {/* Snelle links */}
              <div
                style={{
                  marginTop: "48px",
                  paddingTop: "32px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "2px",
                    marginBottom: "16px",
                  }}
                >
                  OF GA DIRECT NAAR
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {quickLinks.map((l) => (
                    <QuickLink key={l.href} to={l.href}>
                      {l.label}
                    </QuickLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}