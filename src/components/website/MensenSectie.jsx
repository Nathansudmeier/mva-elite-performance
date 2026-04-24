import React from "react";

const AFDELINGEN = ["Bestuur", "Technische Commissie", "Vrijwilliger", "Vertrouwenspersoon"];

const initials = (naam) => naam ? naam.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

function PersoonKaart({ persoon }) {
  return (
    <div style={{ background: "#202840", borderRadius: "6px", padding: "18px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
      {persoon.foto_url ? (
        <img src={persoon.foto_url} alt={persoon.naam} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", color: "#FF6800" }}>{initials(persoon.naam)}</span>
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{persoon.naam}</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: persoon.bio ? "6px" : 0 }}>{persoon.functie}</div>
        {persoon.bio && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{persoon.bio}</div>}
      </div>
    </div>
  );
}

export default function MensenSectie({ personen = [] }) {
  const actieve = personen.filter(p => p.actief !== false);
  if (actieve.length === 0) return null;

  const gegroepeerd = AFDELINGEN
    .map(afd => ({
      afdeling: afd,
      leden: actieve
        .filter(p => p.afdeling === afd)
        .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)),
    }))
    .filter(g => g.leden.length > 0);

  return (
    <section style={{ background: "#151D35", padding: "64px 28px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>MENSEN VAN ARTEMIS</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", color: "#fff", marginBottom: "40px" }}>
          DE ORGANISATIE ACHTER DE CLUB.
        </h2>

        {gegroepeerd.map(g => (
          <div key={g.afdeling} style={{ marginBottom: "36px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {g.afdeling}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              {g.leden.map(p => <PersoonKaart key={p.id} persoon={p} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}