import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import WebsiteHero from "@/components/website/WebsiteHero";
import { Trophy, Users, ArrowUp, Circle } from "lucide-react";

const ICON_MAP = {
  trophy: Trophy,
  football: Circle,
  users: Users,
  "arrow-up": ArrowUp,
};

const TEAM_NAMES = ["MO17", "MO20", "Vrouwen 1"];
const TEAM_SLUGS = { "MO17": "/mo17", "MO20": "/mo20", "Vrouwen 1": "/vrouwen-1" };

const WAARDEN = [
  { nr: "01", titel: "Ambitie", tekst: "Wij spelen om te groeien. Elke training, elke wedstrijd is een kans om een betere versie van jezelf te worden." },
  { nr: "02", titel: "Teamgeest", tekst: "Individuele kwaliteit wint wedstrijden. Teamwork wint kampioenschappen. Samen zijn wij sterker." },
  { nr: "03", titel: "Discipline", tekst: "Succes is geen toeval. Het is het resultaat van dagelijkse inzet, consistentie en de wil om door te zetten." },
  { nr: "04", titel: "Ontwikkeling", tekst: "Van MO17 naar de top. Wij geloven in een duidelijk pad van talent naar professional." },
];

const ROADMAP = [
  { periode: "2025-26", titel: "Fundament", omschrijving: "MO17 en MO20 op hoog niveau. V1 promoveert naar 2e klasse. Speelsters die klaar zijn voor de volgende stap." },
  { periode: "2027-28", titel: "Groei", omschrijving: "Uitbreiding spelersbestand. Samenwerking met regionale academies. V1 in de 1e klasse." },
  { periode: "2029-30", titel: "Topklasse", omschrijving: "MV Artemis V1 in de Topklasse. Herkenbaar als opleidingsclub voor vrouwenvoetbal in Noord-Nederland." },
];

export default function WebsiteHome() {
  const { data: players = [] } = useQuery({
    queryKey: ["public-players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: prestaties = [] } = useQuery({
    queryKey: ["public-prestaties"],
    queryFn: () => base44.entities.Prestatie.list("volgorde", 4),
  });

  const playerCountByTeam = (team) => players.filter(p => p.team === team && p.active !== false).length;

  return (
    <div style={{ background: "#10121A" }}>
      {/* Hero */}
      <WebsiteHero
        title="JOUW AMBITIE."
        subtitle="ONS DOEL."
        ctaLabel="Meld je aan voor een proeftraining"
        ctaHref="/proeftraining"
        minHeight="100vh"
      />

      {/* Stats balk */}
      <div style={{ background: "#14192A", padding: "0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { value: "3", label: "Selectieteams" },
            { value: "3×", label: "Training per week" },
            { value: "3e Kl.", label: "V1 huidig niveau" },
            { value: "2030", label: "Topklasse doel" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "28px 24px", textAlign: "center",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none"
            }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "40px", color: "#FF6800", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Identiteit sectie */}
      <section style={{ background: "#151D35", padding: "96px 32px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "20px" }}>Over ons</div>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(36px, 6vw, 58px)", color: "#fff", margin: "0 0 28px", lineHeight: 1.05, letterSpacing: "1px" }}>
            NIET ALS BIJZAAK.<br />ALS HOOFDZAAK.
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: "700px", margin: "0 auto" }}>
            MV Artemis is opgericht met één doel: meisjesvoetbal in Friesland serieus nemen.
            Wij bieden een omgeving waarin talent zich kan ontwikkelen, zonder concessies aan kwaliteit.
            Van MO17 tot V1 — bij ons is elke speler een hoofdrol.
          </p>
        </div>
      </section>

      {/* Selecties sectie */}
      <section style={{ background: "#FF6800", padding: "80px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.7)", marginBottom: "12px" }}>Selecties</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(36px, 5vw, 52px)", color: "#fff", margin: 0, letterSpacing: "1px" }}>DRIE TEAMS. ÉÉN FILOSOFIE.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {TEAM_NAMES.map((team) => (
              <Link key={team} to={TEAM_SLUGS[team]} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#10121A", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)",
                  padding: "32px 28px", cursor: "pointer", transition: "transform 0.15s",
                }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "32px", color: "#FF6800", letterSpacing: "1px" }}>{team}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "6px", marginBottom: "20px" }}>
                    {playerCountByTeam(team)} speelsters
                  </div>
                  <div style={{ fontSize: "13px", color: "#FF6800", fontWeight: 700 }}>Bekijk selectie →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prestaties sectie */}
      {prestaties.length > 0 && (
        <section style={{ background: "#181E2C", padding: "80px 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Prestaties</div>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(36px, 5vw, 52px)", color: "#fff", margin: 0, letterSpacing: "1px" }}>WAT WE HEBBEN LATEN ZIEN.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              {prestaties.map((p) => {
                const Icon = ICON_MAP[p.icon_type] || Trophy;
                return (
                  <div key={p.id} style={{
                    background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "28px 24px"
                  }}>
                    <Icon style={{ color: "#FF6800", marginBottom: "14px" }} size={24} />
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "20px", color: "#fff", letterSpacing: "0.5px", marginBottom: "8px" }}>{p.titel}</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{p.beschrijving}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Waarden sectie */}
      <section style={{ background: "#10121A", padding: "80px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Onze waarden</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(36px, 5vw, 52px)", color: "#fff", margin: 0, letterSpacing: "1px" }}>WAAR WE VOOR STAAN.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            {WAARDEN.map((w) => (
              <div key={w.nr} style={{
                background: "#FF6800", borderRadius: "6px", padding: "32px 24px"
              }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "56px", color: "rgba(255,255,255,0.2)", lineHeight: 1, marginBottom: "12px" }}>{w.nr}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#fff", letterSpacing: "1px", marginBottom: "10px" }}>{w.titel.toUpperCase()}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>{w.tekst}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Routekaart sectie */}
      <section style={{ background: "#0F1630", padding: "80px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Routekaart</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(36px, 5vw, 52px)", color: "#fff", margin: 0, letterSpacing: "1px" }}>DE WEG NAAR DE TOP.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {ROADMAP.map((fase, i) => (
              <div key={i} style={{
                background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)",
                padding: "32px 28px"
              }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "14px", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "8px" }}>{fase.periode}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "28px", color: "#fff", letterSpacing: "1px", marginBottom: "14px" }}>{fase.titel.toUpperCase()}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>{fase.omschrijving}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA sectie */}
      <section style={{ background: "#1B2A5E", padding: "100px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(36px, 6vw, 56px)", color: "#fff", margin: "0 0 32px", lineHeight: 1.1, letterSpacing: "1px" }}>
            MO17 IS NIET HET BEGIN.<br />
            <span style={{ color: "#FF6800" }}>JIJ BENT HET BEGIN.</span>
          </h2>
          <Link to="/proeftraining" style={{
            display: "inline-flex", background: "#FFD600", color: "#10121A",
            borderRadius: "3px", padding: "16px 36px", fontSize: "15px",
            fontWeight: 700, textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "0.05em"
          }}>
            Plan een proeftraining ↗
          </Link>
        </div>
      </section>
    </div>
  );
}