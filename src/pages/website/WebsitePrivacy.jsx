import React, { useEffect } from "react";
import WebsiteLayout from "@/components/website/WebsiteLayout";

const styles = {
  hero: {
    background: "#0F1630",
    height: "200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "0 24px",
  },
  tag: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "#FF6800",
    marginBottom: "12px",
  },
  h1: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontWeight: 700,
    fontSize: "52px",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "1px",
    lineHeight: 1,
  },
  date: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "12px",
    color: "rgba(255,255,255,0.3)",
    marginTop: "12px",
  },
  content: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "48px 28px",
  },
  intro: {
    background: "#202840",
    borderRadius: "6px",
    padding: "20px 24px",
    borderLeft: "3px solid #FF6800",
    marginBottom: "32px",
  },
  introText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.7,
    margin: 0,
  },
  h2: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontWeight: 700,
    fontSize: "28px",
    color: "#FF6800",
    margin: "40px 0 12px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255,104,0,0.2)",
    letterSpacing: "1px",
  },
  h3: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "16px",
    color: "#ffffff",
    margin: "24px 0 8px",
  },
  p: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.8,
    marginBottom: "16px",
  },
  ul: {
    marginLeft: "20px",
    marginBottom: "16px",
    paddingLeft: 0,
  },
  li: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.7,
    marginBottom: "6px",
  },
  link: {
    color: "#FF6800",
    textDecoration: "underline",
  },
};

export default function WebsitePrivacy() {
  useEffect(() => {
    document.title = "Privacyverklaring — MV Artemis";
  }, []);

  return (
    <WebsiteLayout>
      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.tag}>JURIDISCH</div>
        <h1 style={styles.h1}>Privacyverklaring</h1>
        <div style={styles.date}>Laatst bijgewerkt: april 2026</div>
      </section>

      {/* CONTENT */}
      <section style={styles.content}>
        {/* Intro */}
        <div style={styles.intro}>
          <p style={styles.introText}>
            MV Artemis hecht veel waarde aan de bescherming van jouw persoonsgegevens. In deze privacyverklaring leggen we uit welke gegevens we verzamelen, waarom we dat doen en hoe we ermee omgaan.
          </p>
        </div>

        {/* Wie zijn wij */}
        <h2 style={styles.h2}>Wie zijn wij</h2>
        <p style={styles.p}>
          <strong style={{ color: "#fff" }}>Naam:</strong> MV Artemis — Meiden Vereniging Artemis<br />
          <strong style={{ color: "#fff" }}>Adres:</strong> Sportpark Douwekamp, Opeinde, Friesland<br />
          <strong style={{ color: "#fff" }}>E-mail:</strong> <a href="mailto:info@mv-artemis.nl" style={styles.link}>info@mv-artemis.nl</a><br />
          <strong style={{ color: "#fff" }}>Website:</strong> mv-artemis.nl<br />
          <strong style={{ color: "#fff" }}>KVK:</strong> 97270679
        </p>
        <p style={styles.p}>
          MV Artemis is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in deze privacyverklaring.
        </p>

        {/* Welke gegevens */}
        <h2 style={styles.h2}>Welke gegevens verzamelen wij</h2>

        <h3 style={styles.h3}>Nieuwsbrief</h3>
        <p style={styles.p}>
          Als je je aanmeldt voor onze wekelijkse nieuwsbrief verwerken wij:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>E-mailadres (verplicht)</li>
          <li style={styles.li}>Naam (optioneel)</li>
          <li style={styles.li}>Team voorkeur (optioneel)</li>
        </ul>
        <p style={styles.p}>
          <strong style={{ color: "#fff" }}>Grondslag:</strong> toestemming. Je kunt je op elk moment afmelden via de afmeldlink onderaan elke nieuwsbrief.<br />
          <strong style={{ color: "#fff" }}>Bewaartermijn:</strong> totdat je je afmeldt.
        </p>

        <h3 style={styles.h3}>Proeftraining aanvraag</h3>
        <p style={styles.p}>
          Als je een proeftraining aanvraagt verwerken wij:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Naam</li>
          <li style={styles.li}>E-mailadres</li>
          <li style={styles.li}>Telefoonnummer</li>
          <li style={styles.li}>Huidige club en team</li>
          <li style={styles.li}>Leeftijd</li>
          <li style={styles.li}>Positie</li>
          <li style={styles.li}>Eventuele toelichting</li>
        </ul>
        <p style={styles.p}>
          <strong style={{ color: "#fff" }}>Grondslag:</strong> uitvoering van een overeenkomst (het verwerken van je aanvraag).<br />
          <strong style={{ color: "#fff" }}>Bewaartermijn:</strong> maximaal 1 jaar na de aanvraag.
        </p>

        <h3 style={styles.h3}>Contactformulier</h3>
        <p style={styles.p}>
          Als je het contactformulier invult verwerken wij:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Naam</li>
          <li style={styles.li}>E-mailadres</li>
          <li style={styles.li}>Onderwerp en bericht</li>
        </ul>
        <p style={styles.p}>
          <strong style={{ color: "#fff" }}>Grondslag:</strong> gerechtvaardigd belang (het beantwoorden van jouw vraag).<br />
          <strong style={{ color: "#fff" }}>Bewaartermijn:</strong> maximaal 1 jaar.
        </p>

        <h3 style={styles.h3}>Chatbot gesprekken</h3>
        <p style={styles.p}>
          Als je gebruik maakt van onze chatbot worden de gestelde vragen en antwoorden opgeslagen om onze service te verbeteren. Deze gegevens worden niet gedeeld met derden en worden maximaal 6 maanden bewaard.
        </p>
        <p style={styles.p}>
          <strong style={{ color: "#fff" }}>Grondslag:</strong> gerechtvaardigd belang (serviceverbetering).<br />
          <strong style={{ color: "#fff" }}>Bewaartermijn:</strong> maximaal 6 maanden.
        </p>

        <h3 style={styles.h3}>Spelersgegevens</h3>
        <p style={styles.p}>
          Voor actieve spelers van MV Artemis verwerken wij:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Naam en rugnummer</li>
          <li style={styles.li}>Positie</li>
          <li style={styles.li}>Geboortedatum</li>
          <li style={styles.li}>Foto (indien aangeleverd)</li>
          <li style={styles.li}>Statistieken (doelpunten, wedstrijden etc.)</li>
        </ul>
        <p style={styles.p}>
          <strong style={{ color: "#fff" }}>Grondslag:</strong> uitvoering van de lidmaatschapsovereenkomst.<br />
          <strong style={{ color: "#fff" }}>Bewaartermijn:</strong> gedurende het lidmaatschap en maximaal 2 jaar daarna.
        </p>

        {/* Cookies */}
        <h2 style={styles.h2}>Cookies</h2>
        <p style={styles.p}>
          MV Artemis gebruikt alleen functioneel noodzakelijke cookies. Dit zijn cookies die strikt noodzakelijk zijn voor de werking van de website, zoals beveiligingscookies.
        </p>
        <p style={styles.p}>
          Wij gebruiken geen tracking cookies, advertentiecookies of analytische cookies van derden.
        </p>
        <p style={styles.p}>
          Je hebt geen toestemming nodig voor functioneel noodzakelijke cookies.
        </p>

        {/* Delen met derden */}
        <h2 style={styles.h2}>Delen met derden</h2>
        <p style={styles.p}>
          Wij verkopen jouw gegevens nooit aan derden.
        </p>
        <p style={styles.p}>
          Wij maken gebruik van de volgende dienstverleners die namens ons gegevens kunnen verwerken:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Base44</strong> — platform voor onze website en app (servers in de EU)
          </li>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Resend</strong> — e-mailverzending voor de nieuwsbrief (privacybeleid: <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>resend.com/privacy</a>)
          </li>
        </ul>
        <p style={styles.p}>
          Met alle verwerkers hebben wij afspraken gemaakt over de beveiliging van jouw gegevens.
        </p>

        {/* Beveiliging */}
        <h2 style={styles.h2}>Beveiliging</h2>
        <p style={styles.p}>
          Wij nemen de bescherming van jouw gegevens serieus en nemen passende maatregelen om misbruik, verlies, onbevoegde toegang en ongewenste openbaarmaking te voorkomen.
        </p>
        <p style={styles.p}>
          De website gebruikt HTTPS voor beveiligde dataoverdracht.
        </p>

        {/* Jouw rechten */}
        <h2 style={styles.h2}>Jouw rechten</h2>
        <p style={styles.p}>
          Onder de AVG heb je de volgende rechten:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Recht op inzage:</strong> je kunt opvragen welke gegevens wij van jou hebben
          </li>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Recht op rectificatie:</strong> je kunt onjuiste gegevens laten corrigeren
          </li>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Recht op verwijdering:</strong> je kunt vragen jouw gegevens te verwijderen
          </li>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Recht op beperking:</strong> je kunt vragen de verwerking te beperken
          </li>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Recht op dataportabiliteit:</strong> je kunt jouw gegevens opvragen in een leesbaar formaat
          </li>
          <li style={styles.li}>
            <strong style={{ color: "#fff" }}>Recht om bezwaar te maken:</strong> je kunt bezwaar maken tegen de verwerking van jouw gegevens
          </li>
        </ul>
        <p style={styles.p}>
          Om gebruik te maken van jouw rechten kun je contact opnemen via <a href="mailto:info@mv-artemis.nl" style={styles.link}>info@mv-artemis.nl</a>. We reageren binnen 30 dagen.
        </p>
        <p style={styles.p}>
          Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens: <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={styles.link}>autoriteitpersoonsgegevens.nl</a>
        </p>

        {/* Contact */}
        <h2 style={styles.h2}>Contact</h2>
        <p style={styles.p}>
          Voor vragen over deze privacyverklaring kun je contact opnemen met:
        </p>
        <p style={styles.p}>
          MV Artemis<br />
          <a href="mailto:info@mv-artemis.nl" style={styles.link}>info@mv-artemis.nl</a><br />
          Sportpark Douwekamp, Opeinde
        </p>

        {/* Wijzigingen */}
        <h2 style={styles.h2}>Wijzigingen</h2>
        <p style={styles.p}>
          Wij behouden het recht deze privacyverklaring aan te passen. Wijzigingen worden gepubliceerd op deze pagina met een nieuwe datum.
        </p>
        <p style={styles.p}>
          <strong style={{ color: "#fff" }}>Versie:</strong> april 2026
        </p>
      </section>
    </WebsiteLayout>
  );
}