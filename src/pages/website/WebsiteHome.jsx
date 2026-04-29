import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Trophy, SoccerBall, Users, TrendUp, Target, ChatCircleText, UsersThree, Lightning } from "@phosphor-icons/react";
import WebsiteLayout from "../../components/website/WebsiteLayout";
import UitgelichtSection from "../../components/website/UitgelichtSection";

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

const ICON_MAP = {
  trophy: <Trophy weight="bold" size={24} />,
  football: <SoccerBall weight="bold" size={24} />,
  users: <Users weight="bold" size={24} />,
  "arrow-up": <TrendUp weight="bold" size={24} />,
};

const WAARDEN_ICONS = {
  "01": <Target weight="bold" size={24} color="#fff" />,
  "02": <ChatCircleText weight="bold" size={24} color="#fff" />,
  "03": <UsersThree weight="bold" size={24} color="#fff" />,
  "04": <Lightning weight="bold" size={24} color="#fff" />,
};

const FASE_DEFAULTS = {
  fase1: { label: "FASE 1 · NU BEZIG", jaar: "2025-26", items: ["V1 consolideert in 3e klasse", "MO17 handhaaft koploperspositie", "Financiële basis staat", "Naamswijziging naar MV Artemis"] },
  fase2: { label: "FASE 2 · GROEIEN", jaar: "2027-28", items: ["V1 naar 1e klasse of Hoofdklasse", "Eerste gesprekken KNVB licentie", "Speelsters doorgestroomd naar BVO"] },
  fase3: { label: "FASE 3 · DOORBRAAK", jaar: "2029-30", items: ["V1 in de Topklasse", "Licentieaanvraag Tweede Divisie", "Eigen accommodatie gerealiseerd"] },
};

const TEAM_BADGE = {
  "MO17": { bg: "rgba(255,104,0,0.2)", color: "#FF6800", label: "MO17" },
  "MO20": { bg: "rgba(255,214,0,0.2)", color: "#FFD600", label: "MO20" },
  "Dames 1": { bg: "rgba(255,255,255,0.1)", color: "#ffffff", label: "V1" },
};

const categoryColors = {
  "Wedstrijdverslag": { bg: "rgba(255,104,0,0.15)", color: "#FF6800" },
  "Clubnieuws": { bg: "rgba(27,42,94,0.5)", color: "rgba(255,255,255,0.7)" },
  "Selectie-update": { bg: "rgba(255,214,0,0.1)", color: "#FFD600" },
  "Resultaten": { bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
};

function NewsTeaser({ berichten }) {
  if (!berichten || berichten.length === 0) return null;

  const displayBerichten = berichten.slice(0, 3);

  const getCategoryIcon = (cat) => {
    const icons = { "Wedstrijdverslag": "🏆", "Clubnieuws": "📰", "Selectie-update": "👥", "Resultaten": "📊" };
    return icons[cat] || "📰";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("nl-NL", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <section style={{ background: "#161A24", padding: "48px 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px", fontFamily: "'Space Grotesk', sans-serif" }}>LAATSTE NIEUWS</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", fontWeight: 700, color: "#fff", lineHeight: 1, margin: 0 }}>Blijf op de hoogte.</h2>
          </div>
          <Link to="/nieuws" style={{ fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#FF6800", textDecoration: "none", transition: "opacity 0.2s" }} onMouseEnter={e => e.target.style.opacity = 0.8} onMouseLeave={e => e.target.style.opacity = 1}>
            Bekijk al het nieuws →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {displayBerichten.map(b => (
            <Link
              key={b.id}
              to={`/nieuws/${b.slug}`}
              style={{
                background: "#202840",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                overflow: "hidden",
                cursor: "pointer",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                transition: "border-color 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,104,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ height: "160px", overflow: "hidden", background: b.afbeelding_url ? "none" : "linear-gradient(135deg, #1B2A5E, #0F1630)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {b.afbeelding_url ? (
                  <img src={b.afbeelding_url} alt={b.titel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "40px" }}>{getCategoryIcon(b.categorie)}</span>
                )}
              </div>
              <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 8px", borderRadius: "3px", ...categoryColors[b.categorie] }}>
                    {b.categorie}
                  </span>
                  {b.team !== "Alle" && (
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", padding: "3px 7px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                      {b.team === "Vrouwen 1" ? "V1" : b.team}
                    </span>
                  )}
                </div>
                <h3 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "20px", color: "#fff", lineHeight: 1.1, marginBottom: "8px", margin: 0, flex: 1 }}>
                  {b.titel}
                </h3>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.55, marginBottom: "14px", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {b.samenvatting}
                </p>
                <div style={{ marginTop: "auto", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                  {formatDate(b.datum)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function WebsiteHome() {
  const [instellingen, setInstellingen] = useState(null);
  const [prestaties, setPrestaties] = useState([]);
  const [players, setPlayers] = useState([]);
  const [uitslagen, setUitslagen] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [nieuwsberichten, setNieuwsberichten] = useState([]);
  const [uitgelichteWedstrijden, setUitgelichteWedstrijden] = useState([]);

  useEffect(() => {
    fetchWebsiteData().then(data => {
      if (data?.instellingen) setInstellingen(data.instellingen);
      if (data?.prestaties?.length > 0) setPrestaties(data.prestaties.slice(0, 4));
      if (data?.sponsors?.length > 0) setSponsors(data.sponsors);
      if (data?.nieuwsberichten) setNieuwsberichten(data.nieuwsberichten);
      if (data?.uitgelichteWedstrijden) setUitgelichteWedstrijden(data.uitgelichteWedstrijden);
      if (data?.matches) {
        const today = new Date().toISOString().split("T")[0];
        const filtered = (data.matches)
          .filter(m => m.date < today && m.score_home != null && m.score_away != null)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10);
        setUitslagen(filtered);
      }
      if (data?.players) setPlayers(data.players);
    });
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
    height: "85vh", position: "relative", overflow: "hidden",
    background: instellingen?.hero_image_url
      ? `url(${instellingen.hero_image_url}) top center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
  };

  return (
    <WebsiteLayout>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* HERO */}
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 0 60px 28px", maxWidth: "65%", marginRight: "auto" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(72px, 12vw, 120px)", fontWeight: 700, color: "#fff", lineHeight: 0.95 }}>JOUW AMBITIE.</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(72px, 12vw, 120px)", fontWeight: 700, color: "#FF6800", lineHeight: 0.95 }}>ONS DOEL.</div>
        </div>
      </section>

      {/* NIEUWS-TICKER */}
      {uitslagen.length > 0 && (() => {
        const items = [...uitslagen, ...uitslagen];
        return (
          <div style={{ background: "#1B2A5E", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "10px 0", overflow: "hidden", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.querySelector('.ticker-track').style.animationPlayState = 'paused'}
            onMouseLeave={e => e.currentTarget.querySelector('.ticker-track').style.animationPlayState = 'running'}
          >
            {/* Label */}
            <div style={{ background: "#FF6800", padding: "4px 16px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#fff", zIndex: 2, flexShrink: 0, marginRight: "16px" }}>
              UITSLAGEN
            </div>
            {/* Scrollende items */}
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div className="ticker-track" style={{ display: "inline-flex", gap: "48px", animation: "tickerScroll 30s linear infinite", alignItems: "center" }}>
                {items.map((m, i) => {
                  const badge = TEAM_BADGE[m.team] || { bg: "rgba(255,255,255,0.1)", color: "#fff", label: m.team };
                  return (
                    <React.Fragment key={i}>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ background: badge.bg, color: badge.color, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", padding: "2px 7px", borderRadius: "3px" }}>{badge.label}</span>
                        MV Artemis {Math.round(m.score_home)} - {Math.round(m.score_away)} {m.opponent}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>·</span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* UITGELICHTE WEDSTRIJDEN */}
      <UitgelichtSection items={uitgelichteWedstrijden} />

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

      {/* NIEUWS TEASER */}
      <NewsTeaser berichten={nieuwsberichten} />

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
                <div style={{ width: "36px", height: "36px", minWidth: "36px", borderRadius: "6px", background: "rgba(255,104,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: p.kleur || "#FF6800" }}>
                  {ICON_MAP[p.icon_type] || <Trophy weight="bold" size={20} />}
                </div>
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
            <h2 style={{ fontFamily: "'Bebas Nieuwe', sans-serif", fontSize: "clamp(28px, 4vw, 38px)", color: "#fff" }}>ARTEMIS IS NIET VOOR IEDEREEN.</h2>
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
                <div style={{ position: "absolute", top: "16px", left: "16px", color: "rgba(255,255,255,0.9)" }}>{WAARDEN_ICONS[w.nr]}</div>
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

      {/* SPONSORS */}
      <section style={{ background: "#0C0E14", padding: "56px 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#FF6800" }}>PARTNERS & SPONSORS</div>
          </div>
          <div style={{ maxWidth: "480px", margin: "0 auto 48px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
              Onze partners maken het mogelijk. Niet als reclamebord, maar als partner in de ambitie van MV Artemis.
            </p>
          </div>

          {/* TIER 1 - HOOFDSPONSORS */}
          {sponsors.filter(s => s.tier === 1).length > 0 && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginBottom: "40px" }}>
                {sponsors.filter(s => s.tier === 1).map(s => (
                  <a key={s.id} href={s.website_url} target="_blank" rel="noopener noreferrer"
                    style={{ position: "relative", background: "#161A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "28px 40px", minWidth: "180px", minHeight: "110px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", transition: "border-color 0.2s, transform 0.15s", textDecoration: "none" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,104,0,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#FF6800" }}>{s.categorie}</div>
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.naam} style={{ maxHeight: "36px", maxWidth: "140px", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: "0.7", transition: "opacity 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.7"} />
                    ) : (
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "rgba(255,255,255,0.6)" }}>{s.naam}</div>
                    )}
                  </a>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "8px 0 32px" }} />
            </>
          )}

          {/* TIER 2 - CLUBSPONSORS */}
          {sponsors.filter(s => s.tier === 2).length > 0 && (
            <>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.3)" }}>CLUBSPONSORS</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginBottom: "32px" }}>
                {sponsors.filter(s => s.tier === 2).map(s => (
                  <a key={s.id} href={s.website_url} target="_blank" rel="noopener noreferrer"
                    style={{ background: "#161A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", padding: "20px 32px", minWidth: "150px", height: "90px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", transition: "border-color 0.2s", textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{s.categorie}</div>
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.naam} style={{ maxHeight: "32px", maxWidth: "130px", filter: "brightness(0) invert(1) opacity(0.45)", transition: "opacity 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.45"} />
                    ) : (
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>{s.naam}</div>
                    )}
                  </a>
                ))}
              </div>
            </>
          )}

          {/* TIER 3 - SUPPORTERS */}
          {sponsors.filter(s => s.tier === 3).length > 0 && (
            <>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.3)" }}>SUPPORTERS</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
                {sponsors.filter(s => s.tier === 3).map(s => (
                  <a key={s.id} href={s.website_url} target="_blank" rel="noopener noreferrer"
                    style={{ background: "#161A24", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "14px 24px", minWidth: "120px", height: "70px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", textDecoration: "none", transition: "border-color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}>
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.naam} style={{ maxHeight: "40px", maxWidth: "110px", filter: "brightness(0) invert(1) opacity(0.35)", transition: "opacity 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.6"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.35"} />
                    ) : (
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{s.naam}</span>
                    )}
                  </a>
                ))}
              </div>
            </>
          )}

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "10px" }}>Interesse in een samenwerking?</div>
            <Link to="/contact"
              style={{ background: "transparent", border: "1px solid rgba(255,104,0,0.4)", color: "#FF6800", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "13px", padding: "9px 20px", borderRadius: "3px", textDecoration: "none", display: "inline-block", transition: "all 0.2s", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,104,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              Neem contact op →
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}