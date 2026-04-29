import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { base44 } from "@/api/base44Client";
import {
  CurrencyEur, TShirt, Cards, SignOut, HandHeart,
  ShieldCheck, FilePdf
} from "@phosphor-icons/react";

const S = {
  card: (accent) => ({
    background: "#202840",
    border: `1px solid rgba(255,255,255,0.08)`,
    borderLeft: `3px solid ${accent}`,
    borderRadius: "6px",
    padding: "24px 28px",
    marginBottom: "16px",
  }),
  cardTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "24px",
    color: "#fff",
    marginBottom: "8px",
    margin: "0 0 8px 0",
  },
  body: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "14px",
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.75,
    margin: 0,
  },
  link: {
    color: "#FF6800",
    textDecoration: "underline",
  },
  iconBadge: (color) => ({
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: `${color}20`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
};

function InfoKaart({ accent, icon, titel, children }) {
  return (
    <div style={S.card(accent)}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div style={S.iconBadge(accent)}>{icon}</div>
        <h2 style={S.cardTitle}>{titel}</h2>
      </div>
      <div style={S.body}>{children}</div>
    </div>
  );
}

export default function WebsiteLeden() {
  const [personen, setPersonen] = useState([]);
  const [documenten, setDocumenten] = useState([]);
  const [heroUrl, setHeroUrl] = useState("");

  useEffect(() => {
    document.title = "Ledeninformatie — MV Artemis";
    base44.entities.Persoon.filter({ afdeling: "Vertrouwenspersoon", actief: true }).then(p => setPersonen(p || []));
    base44.entities.ClubDocument.filter({ actief: true }).then(d =>
      setDocumenten((d || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)))
    );
    base44.entities.WebsiteInstellingen.list().then(list => {
      if (list && list.length > 0) setHeroUrl(list[0].leden_image_url || "");
    });
  }, []);

  return (
    <WebsiteLayout>
      {/* HERO */}
      <section style={{
        background: "linear-gradient(135deg, #0F1630, #1B2A5E)",
        backgroundImage: heroUrl ? `linear-gradient(135deg, rgba(15,22,48,0.82), rgba(27,42,94,0.75)), url(${heroUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "top",
        height: "380px",
        display: "flex",
        alignItems: "flex-end",
        padding: "0 28px 40px",
      }}>
        <div style={{ maxWidth: "900px", width: "100%" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#FF6800", marginBottom: "12px" }}>
            VOOR LEDEN
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "52px", color: "#fff", margin: "0 0 12px 0", lineHeight: 1, letterSpacing: "1px" }}>
            ALLES WAT JE <span style={{ color: "#FF6800" }}>MOET WETEN.</span>
          </h1>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Praktische informatie over je lidmaatschap bij MV Artemis. Geen kleine lettertjes, wel duidelijke taal.
          </p>
        </div>
      </section>

      {/* INHOUD */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 28px" }}>

        {/* CONTRIBUTIE */}
        <InfoKaart accent="#FF6800" icon={<CurrencyEur weight="bold" size={18} color="#FF6800" />} titel="Contributie">
          De contributie wordt automatisch via incasso geïnd. Je hoeft daar zelf niets voor te doen — wij regelen het. Heb je vragen over de hoogte of betaalmoment? Mail naar{" "}
          <a href="mailto:info@mv-artemis.nl" style={S.link}>info@mv-artemis.nl</a>.
        </InfoKaart>

        {/* CLUBKLEDING */}
        <InfoKaart accent="#FFD600" icon={<TShirt weight="bold" size={18} color="#FFD600" />} titel="Clubkleding">
          Bij MV Artemis hoor je er direct bij — letterlijk. Elke speler krijgt bij aanvang een presentatiepak en tas van de club.
          <br /><br />
          Voor trainingen geldt: clubkleding is verplicht. Die schaf je zelf aan. Wedstrijdkleding wordt door de club beheerd en verzorgd.
          <br /><br />
          Onze kledingleverancier is <strong style={{ color: "#fff" }}>Muta Sport</strong>.
          <br /><br />
          <a href="https://mutasport.nl" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-block",
            border: "1px solid #FF6800",
            color: "#FF6800",
            borderRadius: "3px",
            padding: "7px 16px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            marginTop: "4px",
          }}>
            Naar de webshop →
          </a>
        </InfoKaart>

        {/* KAARTEN */}
        <InfoKaart accent="#FFD600" icon={<Cards weight="bold" size={18} color="#FFD600" />} titel="Kaarten en boetes">
          Eerlijk is eerlijk: de KNVB legt boetes op voor gele en rode kaarten. Die kosten worden doorbelast aan het betreffende lid en automatisch afgeschreven.
          <br /><br />
          Geen verrassingen — je wordt altijd geïnformeerd als dit van toepassing is.
        </InfoKaart>

        {/* AFMELDEN */}
        <InfoKaart accent="rgba(255,255,255,0.3)" icon={<SignOut weight="bold" size={18} color="rgba(255,255,255,0.5)" />} titel="Lidmaatschap beëindigen">
          We hopen dat het nooit zover komt, maar als je wil stoppen: een verzoek tot beëindiging van het lidmaatschap moet uiterlijk <strong style={{ color: "#fff" }}>1 juni</strong> van het lopende seizoen worden ingediend — conform de statuten.
          <br /><br />
          Stuur een mail naar <a href="mailto:info@mv-artemis.nl" style={S.link}>info@mv-artemis.nl</a> en we regelen de rest.
        </InfoKaart>

        {/* LEERGELD */}
        <InfoKaart accent="#22C55E" icon={<HandHeart weight="bold" size={18} color="#22C55E" />} titel="Financiële steun via Leergeld">
          Voetbal moet voor iedereen toegankelijk zijn. Leergeld zet zich in voor schoolgaande kinderen van 4 tot 18 jaar uit gezinnen met een smalle beurs.
          <br /><br />
          Kan jouw kind niet meedoen vanwege financiële redenen? Neem dan contact op via <a href="mailto:info@mv-artemis.nl" style={S.link}>info@mv-artemis.nl</a> — we kijken samen wat mogelijk is. Je kunt ook direct aanmelden via Leergeld.
          <br /><br />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
            <a href="https://www.jeugdfondssportencultuur.nl" target="_blank" rel="noopener noreferrer" style={S.link}>Meer info over Leergeld →</a>
            <a href="https://www.samenvoorallekinderen.nl" target="_blank" rel="noopener noreferrer" style={S.link}>Aanmelden via Samen voor alle kinderen →</a>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
            Let op: aanmelding moet elk seizoen opnieuw worden gedaan.
          </div>
        </InfoKaart>

        {/* VERTROUWENSPERSOON */}
        <div style={{
          background: "rgba(255,104,0,0.06)",
          border: "1px solid rgba(255,104,0,0.2)",
          borderLeft: "3px solid #FF6800",
          borderRadius: "6px",
          padding: "24px 28px",
          marginBottom: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <ShieldCheck weight="bold" size={24} color="#FF6800" />
            <h2 style={{ ...S.cardTitle, fontSize: "26px" }}>Vertrouwenspersoon</h2>
          </div>
          <p style={S.body}>
            Bij MV Artemis willen we een omgeving waar iedereen zich veilig voelt. Op het veld én daarbuiten.
            <br /><br />
            Heb je te maken met grensoverschrijdend gedrag — pesten, discriminatie, agressie of seksueel ongewenst gedrag? Je hoeft daar niet mee alleen te blijven.
            <br /><br />
            Onze vertrouwenspersonen staan voor je klaar. Onafhankelijk van het bestuur. Altijd vertrouwelijk.
          </p>

          {personen.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "16px" }}>
              {personen.map(p => (
                <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "4px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 800, color: "#FF6800" }}>
                      {p.naam?.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 700, color: "#fff" }}>{p.naam}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{p.functie}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "16px" }}>
            <a href="mailto:info@mv-artemis.nl" style={{ ...S.link, fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 700 }}>
              Mail de vertrouwenspersoon →
            </a>
          </div>
        </div>

      </div>

      {/* TRAININGSTIJDEN */}
      <section style={{ background: "#151D35", padding: "60px 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "10px" }}>VOOR LEDEN</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "36px", color: "#fff", margin: "0 0 14px 0" }}>TRAININGSTIJDEN</h2>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Alle trainingen worden gespeeld op Sportpark Douwekamp, Opeinde.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {/* Maandag */}
            <div style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "24px" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "22px", color: "#FF6800", marginBottom: "16px" }}>Maandag</div>
              {[
                { tijd: "17:30 – 18:30", info: "MO15 · Loop- & performancetraining" },
                { tijd: "18:00 – 19:00", info: "Keeperstraining (alle teams)" },
                { tijd: "18:45 – 20:15", info: "MO17 + Vrouwen 1 · Loop- & performancetraining" },
              ].map((r, i, arr) => (
                <div key={i} style={{ paddingBottom: i < arr.length - 1 ? "12px" : 0, marginBottom: i < arr.length - 1 ? "12px" : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{r.tijd}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{r.info}</div>
                </div>
              ))}
            </div>

            {/* Woensdag */}
            <div style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "24px" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "22px", color: "#FF6800", marginBottom: "16px" }}>Woensdag</div>
              {[
                { tijd: "18:15 – 19:45", info: "MO15" },
                { tijd: "19:30 – 21:00", info: "MO17 + Vrouwen 1" },
              ].map((r, i, arr) => (
                <div key={i} style={{ paddingBottom: i < arr.length - 1 ? "12px" : 0, marginBottom: i < arr.length - 1 ? "12px" : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{r.tijd}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{r.info}</div>
                </div>
              ))}
            </div>

            {/* Vrijdag */}
            <div style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "24px" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "22px", color: "#FF6800", marginBottom: "16px" }}>Vrijdag</div>
              {[
                { tijd: "17:00 – 18:15", info: "MO15" },
                { tijd: "18:30 – 20:00", info: "MO17 + Vrouwen 1" },
              ].map((r, i, arr) => (
                <div key={i} style={{ paddingBottom: i < arr.length - 1 ? "12px" : 0, marginBottom: i < arr.length - 1 ? "12px" : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{r.tijd}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{r.info}</div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.5)", fontStyle: "italic", textAlign: "center", marginTop: "28px", marginBottom: 0 }}>
            Vanaf seizoen 2026/27: MO15 wordt MO17, MO17 wordt MO20.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 28px 0" }}>
        {/* DOCUMENTEN */}
        <div style={{ marginTop: "0" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "28px", color: "#fff", marginBottom: "8px" }}>Clubdocumenten</h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>
            Alle officiële documenten van MV Artemis op één plek.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "10px" }}>
            {documenten.map(doc => (
              <div key={doc.id} style={{
                background: "#202840",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FilePdf weight="bold" size={20} color="#FF6800" />
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{doc.naam}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>{doc.categorie}</div>
                  </div>
                </div>
                {doc.bestand_url ? (
                  <a href={doc.bestand_url} target="_blank" rel="noopener noreferrer" style={{
                    background: "#FF6800",
                    color: "#fff",
                    padding: "7px 16px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                    flexShrink: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    Download ↓
                  </a>
                ) : (
                  <span style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.3)",
                    padding: "7px 16px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: "default",
                  }}>
                    Binnenkort
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#1B2A5E", borderRadius: "6px", padding: "40px 28px", textAlign: "center", marginTop: "48px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "36px", color: "#fff", marginBottom: "12px" }}>Nog vragen?</h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>
            We helpen je graag. Stuur een berichtje en we komen bij je terug.
          </p>
          <Link to="/contact" style={{
            display: "inline-block",
            background: "#FF6800",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: "3px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
          }}>
            Stuur een bericht →
          </Link>
        </div>
      </div>
    </WebsiteLayout>
  );
}