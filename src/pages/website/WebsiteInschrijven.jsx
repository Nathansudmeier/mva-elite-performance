import React, { useState, useEffect } from "react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { base44 } from "@/api/base44Client";

const TEAMS = ["MO15", "MO17", "MO20", "Vrouwen 1"];

const s = {
  hero: {
    background: "#0F1630",
    height: "220px",
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
    fontSize: "52px",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "1px",
    lineHeight: 1,
  },
  sub: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "14px",
    color: "rgba(255,255,255,0.45)",
    marginTop: "10px",
  },
  content: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  card: {
    background: "#1B2A5E",
    borderRadius: "8px",
    padding: "32px",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "22px",
    color: "#FF6800",
    letterSpacing: "1px",
    marginBottom: "20px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255,104,0,0.2)",
  },
  label: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "6px",
    display: "block",
  },
  input: {
    width: "100%",
    background: "#10121A",
    border: "1.5px solid rgba(255,255,255,0.12)",
    borderRadius: "4px",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#fff",
    fontFamily: "'Space Grotesk', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  fieldGroup: { marginBottom: "20px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  btn: {
    background: "#FF6800",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "14px 32px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    marginTop: "8px",
  },
  notice: {
    background: "rgba(255,104,0,0.08)",
    borderLeft: "3px solid #FF6800",
    borderRadius: "4px",
    padding: "16px 20px",
    marginBottom: "28px",
  },
  noticeText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.7,
    margin: 0,
  },
};

export default function WebsiteInschrijven() {
  useEffect(() => {
    document.title = "Inschrijven — MV Artemis";
  }, []);

  const [form, setForm] = useState({
    naam: "",
    email: "",
    adres: "",
    woonplaats: "",
    geboortedatum: "",
    knvb_nummer: "",
    huidige_club: "",
    huidig_team: "",
    gewenst_team: "",
    bankrekening: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError("");

    const body = `
Nieuwe inschrijving MV Artemis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSOONSGEGEVENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Naam:              ${form.naam}
Adres:             ${form.adres}
Woonplaats:        ${form.woonplaats}
Geboortedatum:     ${form.geboortedatum}
KNVB relatienr.:   ${form.knvb_nummer || "—"}
Bankrekening:      ${form.bankrekening}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOETBALHISTORIE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Huidige club:      ${form.huidige_club}
Huidig team:       ${form.huidig_team}
Gewenst team:      ${form.gewenst_team}
    `.trim();

    try {
      await base44.functions.invoke("submitInschrijving", { ...form });
      setSent(true);
    } catch (err) {
      setError("Er is iets misgegaan bij het opslaan. Probeer het opnieuw of neem direct contact op via info@mv-artemis.nl.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <WebsiteLayout>
        <section style={s.hero}>
          <div style={s.tag}>INSCHRIJVING</div>
          <h1 style={s.h1}>Inschrijven</h1>
        </section>
        <div style={s.content}>
          <div style={{ ...s.card, textAlign: "center", padding: "48px 32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#fff", marginBottom: "12px" }}>
              Inschrijving ontvangen!
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: 0 }}>
              Bedankt voor je inschrijving, <strong style={{ color: "#fff" }}>{form.naam}</strong>!<br />
              We nemen zo snel mogelijk contact met je op via e-mail.
            </p>
          </div>
        </div>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <section style={s.hero}>
        <div style={s.tag}>LID WORDEN</div>
        <h1 style={s.h1}>Inschrijven</h1>
        <div style={s.sub}>Word lid van MV Artemis</div>
      </section>

      <div style={s.content}>
        <div style={s.notice}>
          <p style={s.noticeText}>
            Vul onderstaand formulier volledig in om je aan te melden als lid van MV Artemis. Na ontvangst nemen wij zo snel mogelijk contact met je op om het lidmaatschap te bevestigen.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Persoonsgegevens */}
          <div style={s.card}>
            <div style={s.sectionTitle}>Persoonsgegevens</div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Volledige naam *</label>
              <input required style={s.input} value={form.naam} onChange={e => set("naam", e.target.value)} placeholder="Voor- en achternaam" />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>E-mailadres *</label>
              <input required type="email" style={s.input} value={form.email} onChange={e => set("email", e.target.value)} placeholder="jouw@emailadres.nl" />
            </div>

            <div style={{ ...s.fieldGroup }}>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Adres *</label>
                  <input required style={s.input} value={form.adres} onChange={e => set("adres", e.target.value)} placeholder="Straat + huisnummer" />
                </div>
                <div>
                  <label style={s.label}>Woonplaats *</label>
                  <input required style={s.input} value={form.woonplaats} onChange={e => set("woonplaats", e.target.value)} placeholder="Woonplaats" />
                </div>
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Geboortedatum *</label>
              <input required type="date" style={s.input} value={form.geboortedatum} onChange={e => set("geboortedatum", e.target.value)} />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>KNVB Relatienummer</label>
              <input style={s.input} value={form.knvb_nummer} onChange={e => set("knvb_nummer", e.target.value)} placeholder="Optioneel — bijv. 123456789" />
            </div>

            <div style={{ ...s.fieldGroup, marginBottom: 0 }}>
              <label style={s.label}>IBAN Bankrekening *</label>
              <input required style={s.input} value={form.bankrekening} onChange={e => set("bankrekening", e.target.value)} placeholder="NL00 BANK 0000 0000 00" />
            </div>
          </div>

          {/* Voetbalhistorie */}
          <div style={s.card}>
            <div style={s.sectionTitle}>Voetbalhistorie &amp; Team</div>

            <div style={s.fieldGroup}>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Huidige club *</label>
                  <input required style={s.input} value={form.huidige_club} onChange={e => set("huidige_club", e.target.value)} placeholder="Naam van de club" />
                </div>
                <div>
                  <label style={s.label}>Huidig team *</label>
                  <input required style={s.input} value={form.huidig_team} onChange={e => set("huidig_team", e.target.value)} placeholder="Bijv. MO15-1" />
                </div>
              </div>
            </div>

            <div style={{ ...s.fieldGroup, marginBottom: 0 }}>
              <label style={s.label}>Gewenst team bij Artemis *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                {TEAMS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("gewenst_team", t)}
                    style={{
                      padding: "9px 20px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: "pointer",
                      background: form.gewenst_team === t ? "#FF6800" : "transparent",
                      color: form.gewenst_team === t ? "#fff" : "rgba(255,255,255,0.5)",
                      border: form.gewenst_team === t ? "1.5px solid #FF6800" : "1.5px solid rgba(255,255,255,0.15)",
                      transition: "all 0.15s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {/* Hidden required input for team validation */}
              <input
                required
                tabIndex={-1}
                style={{ opacity: 0, height: 0, position: "absolute" }}
                value={form.gewenst_team}
                onChange={() => {}}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: "#FF3DA8", fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={sending} style={{ ...s.btn, opacity: sending ? 0.6 : 1 }}>
            {sending ? "Verzenden..." : "Inschrijving versturen →"}
          </button>

          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
            Je gegevens worden vertrouwelijk behandeld en alleen gebruikt voor de verwerking van je inschrijving. Zie onze <a href="/privacy" style={{ color: "#FF6800" }}>privacyverklaring</a>.
          </p>
        </form>
      </div>
    </WebsiteLayout>
  );
}