import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "@/components/website/WebsiteLayout";

export default function WebsiteNieuwsbriefBevestig() {
  const [params] = useSearchParams();
  const code = params.get("code");
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    if (!code) {
      setStatus("error");
      return;
    }
    base44.entities.Abonnee.filter({ bevestigingscode: code }).then(async (list) => {
      if (!list || list.length === 0) {
        setStatus("error");
        return;
      }
      const ab = list[0];
      await base44.entities.Abonnee.update(ab.id, { bevestigd: true, actief: true });
      setStatus("ok");
    }).catch(() => setStatus("error"));
  }, [code]);

  return (
    <WebsiteLayout>
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px" }}>
          {status === "loading" && (
            <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Space Grotesk', sans-serif" }}>Bezig met bevestigen...</div>
          )}
          {status === "ok" && (
            <>
              <div style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "42px", color: "#fff", marginBottom: "16px", lineHeight: 1.1 }}>
                ✓ Aanmelding bevestigd!
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.6)", marginBottom: "32px", lineHeight: 1.6 }}>
                Je ontvangt elke vrijdag het laatste nieuws van MV Artemis.
              </div>
              <Link to="/" style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "13px", padding: "12px 22px", textDecoration: "none", display: "inline-block" }}>
                Naar de homepage →
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <div style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "36px", color: "#fff", marginBottom: "12px", lineHeight: 1.1 }}>
                Deze link is ongeldig of al gebruikt.
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                Probeer je opnieuw aan te melden via de footer op de homepage.
              </div>
            </>
          )}
        </div>
      </div>
    </WebsiteLayout>
  );
}