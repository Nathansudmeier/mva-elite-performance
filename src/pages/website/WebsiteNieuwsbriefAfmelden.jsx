import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "@/components/website/WebsiteLayout";

export default function WebsiteNieuwsbriefAfmelden() {
  const [params] = useSearchParams();
  const code = params.get("code");
  const [abonnee, setAbonnee] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | afgemeld | heraangemeld | error

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
      await base44.entities.Abonnee.update(ab.id, { actief: false });
      setAbonnee({ ...ab, actief: false });
      setStatus("afgemeld");
    }).catch(() => setStatus("error"));
  }, [code]);

  const heraanmelden = async () => {
    if (!abonnee) return;
    await base44.entities.Abonnee.update(abonnee.id, { actief: true });
    setStatus("heraangemeld");
  };

  return (
    <WebsiteLayout>
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px" }}>
          {status === "loading" && (
            <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Space Grotesk', sans-serif" }}>Bezig met afmelden...</div>
          )}
          {status === "afgemeld" && (
            <>
              <div style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "36px", color: "#fff", marginBottom: "12px", lineHeight: 1.1 }}>
                Je bent afgemeld.
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "32px", lineHeight: 1.6 }}>
                Je ontvangt geen nieuwsbrieven meer van MV Artemis. Jammer, maar we begrijpen het.
              </div>
              <button onClick={heraanmelden} style={{
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "3px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                padding: "10px 20px",
                cursor: "pointer",
              }}>
                Toch weer aanmelden?
              </button>
            </>
          )}
          {status === "heraangemeld" && (
            <>
              <div style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "36px", color: "#fff", marginBottom: "12px", lineHeight: 1.1 }}>
                ✓ Welkom terug!
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                Je staat weer op de lijst voor de wekelijkse nieuwsbrief.
              </div>
            </>
          )}
          {status === "error" && (
            <div style={{ fontFamily: "'Bebas Neue', serif", fontWeight: 700, fontSize: "32px", color: "#fff" }}>
              Deze afmeldlink is ongeldig.
            </div>
          )}
        </div>
      </div>
    </WebsiteLayout>
  );
}