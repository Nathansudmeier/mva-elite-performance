import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

async function fetchWebsiteData() {
  const res = await base44.functions.invoke('getWebsiteData', {});
  return res.data;
}

const PRESTATIE_SEED = [
  { icon_type: "trophy", kleur: "#FFD600", titel: "Open Fries Kampioenschap", beschrijving: "Finale gewonnen van SC Heerenveen academie-team.", volgorde: 1 },
  { icon_type: "football", kleur: "#FF6800", titel: "5-1 vs NEC Nijmegen MO17", beschrijving: "Landelijke Divisie 1. Welk niveau hier wordt gehaald.", volgorde: 2 },
  { icon_type: "users", kleur: "#FFFFFF", titel: "0-0 vs Jong SC Heerenveen", beschrijving: "MV Artemis had de grootste kansen.", volgorde: 3 },
  { icon_type: "arrow-up", kleur: "#FFD600", titel: "V1 kampioen · Promoveert", beschrijving: "3e klasse gewonnen. Eerste stap richting Topklasse.", volgorde: 4 },
];

const WEBSITE_SEED = {
  club_email: "contact@fcmvanoord.com",
  club_locatie: "Sportpark Opeinde, Friesland",
  stat1_waarde: "3", stat1_label: "Selectieteams",
  stat2_waarde: "3×", stat2_label: "Training per week",
  stat3_waarde: "3e", stat3_label: "Klasse V1",
  stat4_waarde: "2030", stat4_label: "Topklasse doel",
};

const ICON_MAP = { trophy: "🏆", football: "⚽", users: "👥", "arrow-up": "↑" };

const FASE_DEFAULTS = {
  fase1: { label: "FASE 1 · NU BEZIG", jaar: "2025-26", items: ["V1 consolideert in 3e klasse", "MO17 handhaaft koploperspositie", "Financiële basis staat", "Naamswijziging naar MV Artemis"] },
  fase2: { label: "FASE 2 · GROEIEN", jaar: "2027-28", items: ["V1 naar 1e klasse of Hoofdklasse", "Eerste gesprekken KNVB licentie", "Speelsters doorgestroomd naar BVO"] },
  fase3: { label: "FASE 3 · DOORBRAAK", jaar: "2029-30", items: ["V1 in de Topklasse", "Licentieaanvraag Tweede Divisie", "Eigen accommodatie gerealiseerd"] },
};

export default function WebsiteHome() {
  const [instellingen, setInstellingen] = useState(null);
  const [prestaties, setPrestaties] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetchWebsiteData().then(data => {
      if (data?.instellingen) setInstellingen(data.instellingen);
      if (data?.prestaties?.length > 0) setPrestaties(data.prestaties.slice(0, 4));
    });
    base44.entities.Player.filter({ active: true }).then(pl => setPlayers(pl || []));
  }, []);

  const stats = instellingen ? [
    { waarde: instellingen.stat1_waarde || "3", label: instellingen.stat1_label || "Selectieteams", geel: false },
    { waarde: instellingen.stat2_waarde || "3×", label: instellingen.stat2_label || "Training per week", geel: false },
    { waarde: instellingen.stat3_waarde || "3e", label: instellingen.stat3_label || "Klasse V1", geel: true },
    { waarde: instellingen.stat4_waarde || "2030", label: instellingen.stat4_label || "Topklasse doel", geel: false },
  ] : [
    { waarde: "3", label: "Selectieteams", geel: false },
    { waarde: "3×", label: "Training per week", geel: false },
    { waarde: "3e", label: "Klasse V1", geel: true },
    { waarde: "2030", label: "Topklasse doel", geel: false },
  ];

  const parseRK = (json, def) => { try { return json ? JSON.parse(json) : def; } catch { return def; } };
  const fase1 = parseRK(instellingen?.routekaart_fase1, FASE_DEFAULTS.fase1);
  const fase2 = parseRK(instellingen?.routekaart_fase2, FASE_DEFAULTS.fase2);
  const fase3 = parseRK(instellingen?.routekaart_fase3, FASE_DEFAULTS.fase3);

  const mo17Count = players.filter(p => p.team === "MO17").length;
  const v1Count = players.filter(p => p.team === "Dames 1" || p.team === "Vrouwen 1").length;

  const heroStyle = {
    height: "100vh", position: "relative", overflow: "hidden",
    background: instellingen?.hero_image_url
      ? `url(${instellingen.hero_image_url}) center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex", alignItems: "flex-end",
  };

  return (
    <WebsiteLayout>
      {/* HERO */}
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 52px", maxWidth: "1200px", width: "100%" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(52px, 8vw, 80px)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>JOUW AMBITIE.</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(52px, 8vw, 80px)", fontWeight: 700, color: "#FF6800", lineHeight: 1 }}>ONS DOEL.</div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#14192A", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: "28px 20px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "42px", color: s.geel ? "#FFD600" : "#FF6800", lineHeight: 1 }}>{s.waarde}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* IDENTITEIT */}
      <section style={{ background: "#151D35", padding: "64px 28px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "16px" }}>WIE WIJ ZIJN</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", color: "#fff", marginBottom: "20px", lineHeight: 1.1 }}>NIET ALS BIJZAAK. ALS HOOFDZAAK.</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
            Wij zijn de enige zelfstandige vrouwenvoetbalclub in de regio die er volledig voor meiden en vrouwen is. Geen gedeelde aandacht. Geen tweede prioriteit. Elke euro, elk veld, elk coachingsgesprek is gericht op jouw ontwikkeling.
          </p>
        </div>
      </section>

      {/* SELECTIES */}
      <section style={{ background: "#FF6800", padding: "48px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#0F1630", marginBottom: "6px" }}>SELECTIES</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", color: "#0F1630" }}>WAAR PAS JIJ?</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
            {[
              { team: "MO17", href: "/mo17", accent: "#FF6800", titel: "Hier begin je.", sub: "Jongenscompetitie. Maximale intensiteit. Hier wordt talent gevormd dat elders niet gemaakt wordt.", footer: "Landelijke Divisie 1", count: mo17Count },
              { team: "MO20", href: "/mo20", accent: "#FFD600", titel: "De schakel omhoog.", sub: "Je hebt de basis. Nu gaat het om consistentie onder druk.", footer: "Seizoen 2026/27", count: 0 },
              { team: "Vrouwen 1", href: "/vrouwen-1", accent: "#FFFFFF", titel: "Hier speel je het.", sub: "Het vlaggenschip. Tactische flexibiliteit, winnen als het niet loopt.", footer: "3e klasse · Groeiende selectie", count: v1Count },
            ].map((t) => (
              <Link key={t.team} to={t.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "#0F1630", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", minHeight: "220px", display: "flex", flexDirection: "column", overflow: "hidden", borderTop: `3px solid ${t.accent}` }}>
                  <div style={{ padding: "20px 20px 16px", flex: 1 }}>
                    <span style={{ background: "rgba(255,255,255,0.1)", color: t.accent, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "3px", letterSpacing: "1px" }}>{t.team}</span>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "30px", color: t.accent, marginTop: "12px", lineHeight: 1 }}>{t.titel}</div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "10px", lineHeight: 1.5 }}>{t.sub}</p>
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
          </div>
        </div>
      </section>

      {/* PRESTATIES */}
      <section style={{ background: "#181E2C", padding: "64px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>EERSTE SEIZOEN</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 38px)", color: "#fff" }}>MINDER DAN ÉÉN JAAR. DIT AL.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {(prestaties.length ? prestaties : PRESTATIE_SEED).map((p, i) => (
              <div key={i} style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "16px", minHeight: "100px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "28px", minWidth: "36px" }}>{ICON_MAP[p.icon_type] || "⭐"}</div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: p.kleur || "#fff", marginBottom: "6px" }}>{p.titel}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{p.beschrijving}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAARDEN */}
      <section style={{ background: "#10121A", padding: "64px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>WIE WIJ ZIJN</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 38px)", color: "#fff" }}>ARTEMIS IS NIET VOOR IEDEREEN.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
            {[
              { nr: "01", titel: "Ambitie zonder plafond", body: "Geen beperkingen, wel stappen. Elke dag dichter bij de top. Niet praten, doen." },
              { nr: "02", titel: "Eerlijkheid boven comfort", body: "We zeggen wat we bedoelen. Je groeit door eerlijkheid." },
              { nr: "03", titel: "Samen boven individueel", body: "Wij bouwen teams, geen sterren." },
              { nr: "04", titel: "Eigenaarschap", body: "Jij bent verantwoordelijk. Wij geven structuur." },
            ].map((w) => (
              <div key={w.nr} style={{ background: "#FF6800", borderRadius: "6px", padding: "20px", minHeight: "130px", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "80px", color: "rgba(255,255,255,0.15)", position: "absolute", top: "-10px", right: "10px", lineHeight: 1 }}>{w.nr}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff", marginBottom: "6px" }}>{w.titel}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{w.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROUTEKAART */}
      <section style={{ background: "#0F1630", padding: "64px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>ROUTEKAART</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 38px)", color: "#fff" }}>TOPKLASSE. 2030. KLOPT.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {[{ data: fase1, active: true }, { data: fase2, active: false }, { data: fase3, active: false }].map(({ data, active }, i) => (
              <div key={i} style={{ background: "#202840", border: active ? "1px solid rgba(255,104,0,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", padding: "20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: active ? "#FF6800" : "rgba(255,255,255,0.35)", marginBottom: "8px" }}>{data.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: active ? "#FF6800" : "#fff", marginBottom: "12px" }}>{data.jaar}</div>
                <div style={{ height: "2px", background: active ? "#FF6800" : "rgba(255,255,255,0.1)", marginBottom: "16px" }} />
                {(Array.isArray(data.items) ? data.items : String(data.items || "").split("\n")).map((item, j) => (
                  <div key={j} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: active ? "#FF6800" : "rgba(255,255,255,0.3)", flexShrink: 0, marginTop: "5px" }} />
                    <span style={{ fontSize: "13px", color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#1B2A5E", padding: "80px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "rgba(255,255,255,0.55)", marginBottom: "16px" }}>KLAAR VOOR MEER?</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 52px)", color: "#fff", marginBottom: "4px", lineHeight: 1 }}>MO17 IS NIET HET BEGIN.</h2>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 52px)", color: "#FF6800", marginBottom: "20px", lineHeight: 1 }}>JIJ BENT HET BEGIN.</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", marginBottom: "28px", lineHeight: 1.6 }}>Kom trainen. Kijk of het klikt. Als jij de instelling hebt die wij zoeken, vinden we elkaar vanzelf.</p>
          <Link to="/proeftraining" style={{ background: "#FFD600", color: "#000", borderRadius: "3px", fontWeight: 700, fontSize: "14px", padding: "14px 28px", textDecoration: "none", display: "inline-block" }}>Proeftraining aanvragen ↗</Link>
        </div>
      </section>
    </WebsiteLayout>
  );
}