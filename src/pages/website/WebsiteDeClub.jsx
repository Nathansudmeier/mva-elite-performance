import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import WebsiteHero from "@/components/website/WebsiteHero";

const PIJLERS = [
  { nr: "01", titel: "Positief voetbal", tekst: "Wij spelen om te domineren. Balbezit, pressing en snelle omschakeling zijn onze kernpijlers. Voetbal moet mooi zijn en effectief." },
  { nr: "02", titel: "Individuele ontwikkeling", tekst: "Elke speelster krijgt een persoonlijk ontwikkelingsplan. Wij investeren in techniek, tactiek én mentaliteit." },
  { nr: "03", titel: "Teamgeest als fundament", tekst: "Geen enkel individu is groter dan het team. Wij winnen samen, verliezen samen en groeien samen." },
];

export default function WebsiteDeClub() {
  const { data: staff = [] } = useQuery({
    queryKey: ["public-staff"],
    queryFn: () => base44.entities.Trainer.list(),
  });

  return (
    <div style={{ background: "#10121A" }}>
      <WebsiteHero title="ONZE MISSIE." subtitle="JOUW PLATFORM." minHeight="50vh" />

      {/* Speelfilosofie */}
      <section style={{ background: "#151D35", padding: "80px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Speelfilosofie</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(32px, 5vw, 48px)", color: "#fff", margin: 0 }}>HOE WE SPELEN</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "56px" }}>
            {PIJLERS.map((p) => (
              <div key={p.nr} style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", padding: "32px 28px" }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "48px", color: "#FF6800", lineHeight: 1, marginBottom: "12px" }}>{p.nr}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#fff", letterSpacing: "1px", marginBottom: "12px" }}>{p.titel.toUpperCase()}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>{p.tekst}</div>
              </div>
            ))}
          </div>
          {/* Filosofie quote */}
          <div style={{ background: "#FF6800", borderRadius: "6px", padding: "40px 48px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(24px, 4vw, 36px)", color: "#fff", letterSpacing: "1px", lineHeight: 1.2 }}>
              "VOETBAL IS EEN TEAMSPEL. MAAR KAMPIOENSCHAP BEGINT INDIVIDUEEL."
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "16px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>— MV Artemis Speelfilosofie</div>
          </div>
        </div>
      </section>

      {/* Trainers */}
      {staff.filter(s => s.active !== false).length > 0 && (
        <section style={{ background: "#181E2C", padding: "80px 32px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Technische Staf</div>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(32px, 5vw, 48px)", color: "#fff", margin: 0 }}>DE MENSEN ACHTER DE CLUB</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
              {staff.filter(s => s.active !== false).map((s) => (
                <div key={s.id} style={{ background: "#202840", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "180px", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', cursive", fontSize: "56px", color: "rgba(255,255,255,0.2)" }}>
                      {s.name?.[0]}
                    </div>
                  )}
                  <div style={{ padding: "20px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{s.name}</div>
                    <div style={{ fontSize: "12px", color: "#FF6800", fontWeight: 600, marginBottom: "8px" }}>{s.role_title}</div>
                    {s.email && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{s.email}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Clubverhaal */}
      <section style={{ background: "#10121A", padding: "80px 32px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "20px" }}>Ons verhaal</div>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(32px, 5vw, 48px)", color: "#fff", margin: "0 0 28px", letterSpacing: "1px" }}>HOW IT STARTED</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.9 }}>
            MV Artemis is geboren vanuit een simpele overtuiging: meisjesvoetbal in Friesland verdient meer. Meer structuur, meer ambitie, meer toekomst.
            Opgericht in Opeinde, Friesland, biedt MV Artemis een serieuze omgeving voor meisjes die verder willen komen dan het gemiddelde.
          </p>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.9, marginTop: "16px" }}>
            Met teams op MO17, MO20 en V1 niveau bieden wij een complete doorstroomstructuur — van jeugd tot seniorenvoetbal op hoog niveau.
            Onze missie is helder: V1 in de Topklasse in 2030. Niet als droom. Als plan.
          </p>
        </div>
      </section>
    </div>
  );
}