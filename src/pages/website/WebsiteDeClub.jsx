import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

const STAFF_SEED = [
  { name: "Nathan Sudmeier", role_title: "Hoofdtrainer / Technisch Coördinator", active: true },
  { name: "Hendrik Overeinder", role_title: "Keeperstrainer", active: true },
  { name: "Marcel Swart", role_title: "Performance coach", active: true },
];

export default function WebsiteDeClub() {
  const [instellingen, setInstellingen] = useState(null);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.WebsiteInstellingen.list(),
      base44.entities.Trainer.filter({ active: true }),
    ]).then(([inst, st]) => {
      if (inst && inst.length > 0) setInstellingen(inst[0]);
      if (st && st.length > 0) {
        setStaff(st);
      } else {
        base44.entities.Trainer.bulkCreate(STAFF_SEED).then(r => setStaff(r));
      }
    });
  }, []);

  const initials = (naam) => naam ? naam.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const heroStyle = {
    height: "400px", position: "relative", overflow: "hidden",
    background: instellingen?.declub_image_url
      ? `url(${instellingen.declub_image_url}) center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex", alignItems: "flex-end",
  };

  return (
    <WebsiteLayout>
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px", maxWidth: "1200px", width: "100%" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 56px)", color: "#fff", lineHeight: 1 }}>ONZE MISSIE.</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 56px)", color: "#FF6800", lineHeight: 1 }}>JOUW PLATFORM.</div>
        </div>
      </section>

      <section style={{ background: "#151D35", padding: "64px 28px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>SPEELFILOSOFIE</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", color: "#fff", marginBottom: "32px" }}>WE COACHEN GEDRAG. NIET POSITIES.</h2>
          {[
            { nr: "01", titel: "Positiespel als basis", body: "Veldbezetting, overtal creëren rondom de bal, de tegenstander uit positie spelen." },
            { nr: "02", titel: "Verticaal-direct aanvallen", body: "Snel naar voren als het kan. Diepte achter de laatste lijn. Omschakelingen als kans." },
            { nr: "03", titel: "Gegenpressing als houding", body: "Direct druk na balverlies. Geen systeem, een mentaliteit. Iedereen verdedigt. Altijd." },
          ].map(f => (
            <div key={f.nr} style={{ background: "#202840", borderRadius: "6px", padding: "18px", marginBottom: "10px", display: "grid", gridTemplateColumns: "64px 1fr", gap: "16px", alignItems: "start" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "44px", color: "#FF6800", lineHeight: 1 }}>{f.nr}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{f.titel}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{f.body}</div>
              </div>
            </div>
          ))}
          <div style={{ background: "rgba(27,42,94,0.3)", borderLeft: "3px solid #1B2A5E", borderRadius: "6px", padding: "20px 24px", marginTop: "12px" }}>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>
              "De bal moet naar de ruimte waar de meeste winst te halen valt, niet per se naar de plek met de meeste ruimte. Dat vraagt om begrip, niet om automatisme."
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: "#181E2C", padding: "64px 28px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>TECHNISCHE STAF</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 38px)", color: "#fff", marginBottom: "28px" }}>HET TEAM ACHTER HET TEAM</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {staff.map(s => (
              <div key={s.id} style={{ background: "#202840", borderRadius: "6px", padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", color: "#FF6800" }}>{initials(s.name)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{s.role_title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#0F1630", padding: "64px 28px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>ONZE GESCHIEDENIS</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 38px)", color: "#fff", marginBottom: "24px" }}>HOEZO MV ARTEMIS?</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: "16px" }}>
            MV Artemis is opgericht in mei 2025 met een simpele overtuiging: meiden verdienen een voetbalomgeving die volledig op hen is gericht. Niet als bijzaak naast een mannenclub. Niet als invulling van een subsidiepot. Maar als zelfstandige, ambitieuze organisatie met een eigen filosofie, eigen structuur en een eigen koers.
          </p>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
            De naam Artemis is de Griekse godin van de jacht. Ze jaagt niet omdat het moet. Ze jaagt omdat ze het wil en er goed in is. Dat is precies de instelling die wij zoeken in elke speler die voor MV Artemis kiest.
          </p>
        </div>
      </section>
    </WebsiteLayout>
  );
}