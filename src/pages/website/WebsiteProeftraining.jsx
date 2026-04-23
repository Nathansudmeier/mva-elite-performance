import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import WebsiteHero from "@/components/website/WebsiteHero";

const INPUT_STYLE = {
  width: "100%", padding: "14px 16px", background: "#202840",
  border: "1px solid rgba(255,255,255,0.12)", borderRadius: "3px",
  color: "#fff", fontSize: "14px", fontFamily: "'Space Grotesk', sans-serif",
  outline: "none", boxSizing: "border-box"
};

const LABEL_STYLE = {
  display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: "8px"
};

const POSITIES = ["Keeper", "Verdediger", "Middenvelder", "Aanvaller", "Nog niet zeker"];

export default function WebsiteProeftraining() {
  const [form, setForm] = useState({
    naam: "", email: "", telefoon: "", huidige_club: "",
    huidig_team: "", leeftijd: "", positie: "", bericht: ""
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ProeftrainingAanvraag.create({
      ...form,
      leeftijd: form.leeftijd ? Number(form.leeftijd) : undefined,
      datum: new Date().toISOString().split("T")[0],
      status: "nieuw"
    });
    await base44.integrations.Core.SendEmail({
      to: "contact@fcmvanoord.com",
      subject: `Nieuwe proeftraining aanvraag: ${form.naam}`,
      body: `Naam: ${form.naam}\nEmail: ${form.email}\nTelefoon: ${form.telefoon}\nHuidige club: ${form.huidige_club}\nHuidig team: ${form.huidig_team}\nLeeftijd: ${form.leeftijd}\nPositie: ${form.positie}\nBericht: ${form.bericht}`
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{ background: "#10121A" }}>
      <WebsiteHero title="KLAAR VOOR" subtitle="DE VOLGENDE STAP?" minHeight="45vh" />

      <section style={{ padding: "80px 32px", maxWidth: "720px", margin: "0 auto" }}>
        {sent ? (
          <div style={{ background: "#202840", borderRadius: "6px", border: "1px solid #FF6800", padding: "56px 40px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "42px", color: "#FF6800", marginBottom: "16px" }}>AANVRAAG ONTVANGEN!</div>
            <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
              Bedankt voor je aanmelding. We nemen zo snel mogelijk contact met je op.
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF6800", marginBottom: "12px" }}>Aanmelding</div>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(28px, 5vw, 42px)", color: "#fff", margin: 0 }}>PLAN JE PROEFTRAINING</h2>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={LABEL_STYLE}>Volledige naam *</label>
                  <input name="naam" value={form.naam} onChange={handleChange} required style={INPUT_STYLE} placeholder="Jouw naam" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>E-mail *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required style={INPUT_STYLE} placeholder="jouw@email.nl" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={LABEL_STYLE}>Telefoonnummer *</label>
                  <input name="telefoon" value={form.telefoon} onChange={handleChange} required style={INPUT_STYLE} placeholder="+31 6 ..." />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Leeftijd</label>
                  <input name="leeftijd" type="number" min="13" max="25" value={form.leeftijd} onChange={handleChange} style={INPUT_STYLE} placeholder="16" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={LABEL_STYLE}>Huidige club</label>
                  <input name="huidige_club" value={form.huidige_club} onChange={handleChange} style={INPUT_STYLE} placeholder="Clubnaam" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Huidig team</label>
                  <input name="huidig_team" value={form.huidig_team} onChange={handleChange} style={INPUT_STYLE} placeholder="Bijv. MO16-1" />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Positie</label>
                <select name="positie" value={form.positie} onChange={handleChange} style={INPUT_STYLE}>
                  <option value="">Kies een positie</option>
                  {POSITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Vertel iets over jezelf (optioneel)</label>
                <textarea name="bericht" value={form.bericht} onChange={handleChange} rows={4}
                  style={{ ...INPUT_STYLE, resize: "vertical" }}
                  placeholder="Wat zijn je ambities? Waarom MV Artemis?" />
              </div>
              <button type="submit" disabled={loading} style={{
                background: "#FF6800", color: "#fff", borderRadius: "3px",
                padding: "16px 32px", fontSize: "15px", fontWeight: 700,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Space Grotesk', sans-serif", opacity: loading ? 0.7 : 1,
                marginTop: "8px"
              }}>
                {loading ? "Versturen..." : "Stuur aanvraag in ↗"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}