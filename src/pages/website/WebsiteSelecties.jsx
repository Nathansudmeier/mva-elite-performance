import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

async function fetchWebsiteData() {
  const res = await base44.functions.invoke('getWebsiteData', {});
  return res.data;
}

const TEAMS = [
  { team: "MO17", href: "/mo17", accent: "#FF6800", titel: "Hier begin je.", sub: "Jongenscompetitie of landelijke 1e divisie meiden. We zoeken steeds naar de maximale intensiteit. Hier wordt talent gevormd dat elders niet gemaakt wordt.", footer: "Landelijke Divisie 1" },
  { team: "MO20", href: "/mo20", accent: "#FFD600", titel: "De schakel omhoog.", sub: "Je hebt de basis. Nu gaat het om consistentie onder druk.", footer: "Seizoen 2026/27" },
  { team: "Vrouwen 1", href: "/vrouwen-1", accent: "#FFFFFF", titel: "Hier speel je het.", sub: "Het vlaggenschip. Tactische flexibiliteit, winnen als het niet loopt.", footer: "3e klasse · Groeiende selectie" },
];

export default function WebsiteSelecties() {
  const [instellingen, setInstellingen] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetchWebsiteData().then(data => {
      if (data?.instellingen) setInstellingen(data.instellingen);
      if (data?.players) setPlayers(data.players);
    });
  }, []);

  const countFor = (team) => {
    if (team === "Vrouwen 1") return players.filter(p => p.team === "VR1" || p.team === "Dames 1" || p.team === "Vrouwen 1").length;
    return players.filter(p => p.team === team).length;
  };

  const heroStyle = {
    height: "800px", position: "relative", overflow: "hidden",
    background: instellingen?.selecties_image_url
      ? `url(${instellingen.selecties_image_url}) top center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex", alignItems: "flex-end",
  };

  return (
    <WebsiteLayout>
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px", maxWidth: "1200px", width: "100%" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "10px" }}>MV ARTEMIS</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 58px)", color: "#fff", lineHeight: 1 }}>DRIE TEAMS.</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 58px)", color: "#FF6800", lineHeight: 1, marginBottom: "16px" }}>ÉÉN FILOSOFIE.</div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "500px", lineHeight: 1.6 }}>Doorstroom van MO17 naar MO20 naar V1 is gebaseerd op kwaliteit, niet op leeftijd.</p>
        </div>
      </section>
      <section style={{ background: "#10121A", padding: "48px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          {TEAMS.map((t) => (
            <Link key={t.team} to={t.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#0F1630", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", minHeight: "300px", display: "flex", flexDirection: "column", overflow: "hidden", borderTop: `3px solid ${t.accent}` }}>
                <div style={{ padding: "20px 20px 16px", flex: 1 }}>
                  <span style={{ background: "rgba(255,255,255,0.1)", color: t.accent, fontSize: "12px", fontWeight: 700, padding: "5px 12px", borderRadius: "3px", letterSpacing: "2.5px" }}>{t.team}</span>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "42px", color: t.accent, marginTop: "12px", lineHeight: 1 }}>{t.titel}</div>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "10px", lineHeight: 1.5 }}>{t.sub}</p>
                  <div style={{ marginTop: "12px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{countFor(t.team)} spelers</div>
                </div>
                <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: t.accent }} />
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>{t.footer}</span>
                  </div>
                  <span style={{ color: t.accent, fontSize: "16px" }}>→</span>
                </div>
              </div>
            </Link>
          ))}

          {/* TIJDELIJKE MO15 KAART */}
          <Link to="/mo15" style={{ textDecoration: "none" }}>
            <div style={{ background: "#0F1630", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", minHeight: "260px", display: "flex", flexDirection: "column", overflow: "hidden", borderTop: "3px solid rgba(255,104,0,0.4)" }}>
              <div style={{ padding: "20px 20px 16px", flex: 1 }}>
                <span style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 700, padding: "5px 12px", borderRadius: "3px", letterSpacing: "2px" }}>MO15 · Dit seizoen</span>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "34px", color: "rgba(255,255,255,0.7)", marginTop: "12px", lineHeight: 1 }}>De basis van morgen.</div>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "10px", lineHeight: 1.5 }}>De MO15 speelt dit seizoen mee en vormt volgend jaar de kern van de MO17.</p>
              </div>
              <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>Seizoen 2025/26 · Tijdelijk</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>→</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* DOORSTROOM FILOSOFIE */}
      <section style={{ background: "#151D35", padding: "56px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "48px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "10px" }}>ONZE AANPAK</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "36px", color: "#fff", lineHeight: 1, marginBottom: "20px" }}>Waarom geen MO13 of MO15?</h2>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "16px" }}>
              Wij geloven dat meiden tot de leeftijd van 15 of 16 jaar het meeste leren door tussen jongens te voetballen. Niet naast hen, maar ertussen. De fysieke weerstand is groter, de handelingssnelheid ligt hoger, de competitiedrang is intenser.
            </p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
              Dat zijn precies de prikkels die een jong talent nodig heeft om sneller te groeien. MO17 is dus niet het begin van de ontwikkeling. Het is het moment waarop een speler klaar is voor de volgende fase: gestructureerd, prestatiegericht en filosofiegedreven voetbal binnen MV Artemis.
            </p>
          </div>
          <div>
            {[
              { nr: "1", titel: "Jongens competitie (tot MO16)", body: "Maximale intensiteit en handelingssnelheid als basis voor verdere ontwikkeling." },
              { nr: "2", titel: "MO17 — Instap MV Artemis", body: "Prestatiegericht vrouwenvoetbal. Filosofie als fundament, winnaarsmentaliteit als doel." },
              { nr: "3", titel: "MO20 → Vrouwen 1", body: "Doorstroom op basis van kwaliteit, niet leeftijd. Elke stap verdiend." },
            ].map((stap, i, arr) => (
              <React.Fragment key={stap.nr}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: i === arr.length - 1 ? 0 : "0" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FF6800", fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#fff", textAlign: "center", lineHeight: "40px", flexShrink: 0 }}>{stap.nr}</div>
                  <div style={{ paddingTop: "6px" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{stap.titel}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{stap.body}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <div style={{ width: "2px", background: "rgba(255,104,0,0.3)", height: "24px", margin: "4px 0 4px 19px" }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* SELECTIEPROFIEL */}
      <section style={{ background: "#FF6800", padding: "56px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "rgba(0,0,0,0.4)", marginBottom: "10px" }}>SELECTIEPROFIEL</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "42px", color: "#fff", margin: 0 }}>Wat zoeken wij in een speler?</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {[
              { nr: "01", titel: "Technisch", body: "Beheerst de basisvaardigheden op wedstrijdtempo. Passing, aannemen, dribbelen en schieten met beide voeten. Niet perfect, wel functioneel onder druk." },
              { nr: "02", titel: "Tactisch", body: "Begrijpt of is in staat te begrijpen hoe het spel werkt. Leest ruimte, kiest positie. Coachbaarheid weegt zwaar: een speler die bereid is te denken, ontwikkelt sneller." },
              { nr: "03", titel: "Mentaal", body: "Competitief ingesteld, veerkrachtig bij tegenslagen en eerlijk over de eigen rol. Een speler die harder werkt als het tegenzit." },
              { nr: "04", titel: "Fysiek", body: "Fit genoeg om de trainingsbelasting aan te kunnen en bereid te investeren in de eigen conditie. Wij vragen geen topatleet bij instroom, wel de bereidheid om daar naartoe te groeien." },
              { nr: "05", titel: "Discipline", body: "Niet alleen op de wedstrijddag. Op elke training, in elk duel, in elke coaching. Discipline om te luisteren, om uit te voeren en om voor jezelf te zorgen. Dat is de basis waarop alles gebouwd wordt." },
              { nr: "06", titel: "Ambitie", body: "We zoeken geen meiden die gewoon een balletje willen trappen. We zoeken meiden die het maximale uit zichzelf willen halen. Omdat voetbal leuk is. Omdat ze zo hoog en goed mogelijk willen spelen. Dat vuur is niet aan te leren." },
            ].map(k => (
              <div key={k.nr} style={{ position: "relative", background: "rgba(0,0,0,0.15)", borderRadius: "6px", padding: "24px", border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "12px", right: "16px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "56px", color: "rgba(255,255,255,0.12)", lineHeight: 1 }}>{k.nr}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "22px", color: "#fff", marginBottom: "8px" }}>{k.titel}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{k.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ONDERAAN */}
      <section style={{ background: "#1B2A5E", padding: "56px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "48px", color: "#fff", lineHeight: 0.9, marginBottom: "14px" }}>
            Herken jij jezelf hierin?<br />
            <span style={{ color: "#FF6800" }}>ONS DOEL.</span>
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.6)", maxWidth: "400px", margin: "0 auto 28px" }}>
            Kom een proeftraining doen. MO17, MO20 of Vrouwen 1. Wij kijken of het klikt.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/proeftraining" style={{ background: "#FFD600", color: "#1a1a1a", padding: "14px 24px", borderRadius: "6px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Proeftraining aanvragen ↗
            </Link>
            <Link to="/mo17" style={{ border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "14px 24px", borderRadius: "6px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Bekijk de teams →
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}