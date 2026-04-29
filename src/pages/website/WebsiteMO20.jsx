import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";
import TeamNav from "../../components/website/TeamNav";
import { CalendarBlank, Star, ArrowUp } from "@phosphor-icons/react";
import TrainingsTijdenBlok, { TIJDEN_STANDAARD } from "@/components/website/TrainingsTijdenBlok";

const ACCENT = "#FFD600";
const IMAGE_VELD = "mo20_image_url";

const InfoBlok = ({ iconBg, icon, titel, tekst }) => (
  <div style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
    <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{titel}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>{tekst}</div>
    </div>
  </div>
);

export default function WebsiteMO20() {
  const [staff, setStaff] = useState([]);
  const [instellingen, setInstellingen] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      const data = res.data;
      if (data?.instellingen) setInstellingen(data.instellingen);
      if (data?.trainers) setStaff(data.trainers);
    });
  }, []);

  const initials = (naam) => naam ? naam.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const heroStyle = {
    height: "520px",
    position: "relative",
    overflow: "hidden",
    background: (instellingen && instellingen[IMAGE_VELD])
      ? `url(${instellingen[IMAGE_VELD]}) top center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex",
    alignItems: "flex-end",
  };

  return (
    <WebsiteLayout>
      {/* HERO */}
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "10px" }}>SELECTIES / MO20</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "72px", color: "#fff", lineHeight: 0.9 }}>
            MO <span style={{ color: ACCENT }}>20</span>
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "12px", maxWidth: "440px", lineHeight: 1.5 }}>
            De MO20 van MV Artemis start seizoen 2026/27. Ben jij er straks bij?
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>Seizoen 2026/27</span>
            <span style={{ background: "rgba(255,214,0,0.15)", color: ACCENT, fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>Selectie open</span>
          </div>
        </div>
      </section>

      <TeamNav />

      {/* WERVING + ANTICIPATIE */}
      <section style={{ background: "#10121A", padding: "48px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: "40px", alignItems: "start" }}>

            {/* LINKER KOLOM: Wervingstekst */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "10px" }}>SEIZOEN 2026/27</div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "42px", color: "#fff", lineHeight: 0.95, marginBottom: "20px", margin: 0 }}>
                De MO20 start.<br />Ben jij erbij?
              </h2>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginTop: "20px", marginBottom: "16px" }}>
                De MO20 is de schakel tussen de jeugd en het seniorenvoetbal van MV Artemis. Hier spelen speelsters die de stap naar Vrouwen 1 willen maken maar nog niet klaar zijn voor het tempo en de verantwoordelijkheid van het eerste team. Hier rijpt het talent.
              </p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "0" }}>
                Ben je 17 jaar of ouder en heb je aantoonbaar competitief gevoetbald? Dan is de MO20 jouw volgende stap. We bouwen de selectie op voor seizoen 2026/27 en zijn op zoek naar speelsters die passen bij de filosofie van MV Artemis.
              </p>
              <Link to="/proeftraining" style={{ display: "inline-block", marginTop: "24px", background: "#FF6800", color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "14px", padding: "13px 24px", borderRadius: "3px", textDecoration: "none" }}>
                Meld je aan voor de MO20 →
              </Link>
            </div>

            {/* RECHTER KOLOM: Info blokken */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <InfoBlok
                iconBg="rgba(255,104,0,0.12)"
                icon={<CalendarBlank weight="bold" size={20} color="#FF6800" />}
                titel="Start seizoen"
                tekst="De MO20 start in augustus 2026 met de voorbereiding op seizoen 2026/27."
              />
              <InfoBlok
                iconBg="rgba(255,214,0,0.1)"
                icon={<Star weight="bold" size={20} color="#FFD600" />}
                titel="Wie zoeken we?"
                tekst="Speelsters van 17 jaar en ouder met competitie-ervaring die de stap naar senioren willen maken."
              />
              <InfoBlok
                iconBg="rgba(255,104,0,0.12)"
                icon={<ArrowUp weight="bold" size={20} color="#FF6800" />}
                titel="Doorstroom naar V1"
                tekst="De MO20 is het directe pad naar Vrouwen 1. Doorstroom op basis van kwaliteit, niet op leeftijd."
              />
            </div>

          </div>
        </div>
      </section>

      {/* PROGRAMMA-ANTICIPATIE + STAF */}
      <section style={{ background: "#10121A", padding: "0 28px 48px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: "40px", alignItems: "start" }}>
            <div />

            {/* RECHTER KOLOM: Programma anticipatie + Staf */}
            <div>
              <div style={{ marginBottom: "40px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "10px" }}>PROGRAMMA 2026/27</div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "28px", color: "#fff", marginBottom: "12px", margin: 0 }}>Competitie volgt.</h3>
                <div style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "20px", textAlign: "center", marginTop: "12px" }}>
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
                    Het wedstrijdprogramma voor seizoen 2026/27 wordt bekend gemaakt zodra de selectie compleet is.
                  </p>
                </div>
              </div>

              {/* STAF */}
              {staff.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>TECHNISCHE STAF</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", marginBottom: "16px" }}>STAF</div>
                  {staff.map(s => (
                    <div key={s.id} style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", color: ACCENT }}>{initials(s.name)}</span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{s.role_title || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TRAININGSTIJDEN */}
              <TrainingsTijdenBlok tijden={TIJDEN_STANDAARD} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#FFD600", padding: "48px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "rgba(0,0,0,0.4)", marginBottom: "10px" }}>SELECTIE 2026/27</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "44px", color: "#000000", lineHeight: 0.95, marginBottom: "14px", margin: 0 }}>
            Jouw plek in de MO20.
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(0,0,0,0.6)", maxWidth: "420px", margin: "14px auto 24px", lineHeight: 1.6 }}>
            We zoeken gemotiveerde speelsters die klaar zijn voor de volgende stap. Herken jij jezelf in de filosofie van MV Artemis? Meld je aan.
          </p>
          <Link to="/proeftraining" style={{ display: "inline-block", background: "#1B2A5E", color: "#FFD600", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "14px", padding: "13px 28px", borderRadius: "3px", textDecoration: "none" }}>
            Aanmelden voor MO20 →
          </Link>
        </div>
      </section>
    </WebsiteLayout>
  );
}