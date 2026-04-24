import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

const inputStyle = {
  background: "#202840", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "4px", color: "#fff", fontFamily: "'Space Grotesk', sans-serif",
  fontSize: "14px", padding: "10px 14px", width: "100%", boxSizing: "border-box", outline: "none",
};

const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: "6px" };

export default function WebsiteProeftraining() {
  const [form, setForm] = useState({ naam: "", email: "", telefoon: "", huidige_club: "", huidig_team: "", leeftijd: "", positie: "", bericht: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusField, setFocusField] = useState(null);

  const validate = () => {
    const e = {};
    ["naam","email","telefoon","huidige_club","huidig_team","leeftijd","positie"].forEach(f => { if (!form[f]) e[f] = true; });
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    await base44.entities.ProeftrainingAanvraag.create({ ...form, leeftijd: Number(form.leeftijd), datum: new Date().toISOString(), status: "nieuw" });
    setSubmitted(true);
    setLoading(false);
  };

  const fs = (name) => ({
    ...inputStyle,
    borderColor: errors[name] ? "#FF4444" : focusField === name ? "#FF6800" : "rgba(255,255,255,0.15)",
    boxShadow: focusField === name ? "0 0 0 2px rgba(255,104,0,0.2)" : "none",
  });

  return (
    <WebsiteLayout>
      <section style={{ height: "300px", background: `url(https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/f5c56747e_Ball.png) center/cover no-repeat`, display: "flex", alignItems: "flex-end", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.85) 0%, rgba(16,18,26,0.6) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 56px)", color: "#fff", lineHeight: 1 }}>KLAAR VOOR DE</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 56px)", color: "#FF6800", lineHeight: 1 }}>VOLGENDE STAP?</div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "12px" }}>Kom een proeftraining doen. Kijk of het klikt.</p>
        </div>
      </section>

      <section style={{ background: "#10121A", padding: "48px 28px 80px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", marginBottom: "12px" }}>Aanmelding ontvangen!</div>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", marginBottom: "8px" }}>Bedankt {form.naam}! We nemen binnen 2 werkdagen contact met je op.</p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Jouw ambitie. Ons doel. — MV Artemis</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {[
                ["Volledige naam", "naam", "text"],
                ["E-mail", "email", "email"],
                ["Telefoonnummer", "telefoon", "tel"],
                ["Huidige club", "huidige_club", "text"],
                ["Huidig team", "huidig_team", "text"],
                ["Leeftijd", "leeftijd", "number"],
              ].map(([label, field, type]) => (
                <div key={field} style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>{label} *</label>
                  <input type={type} style={fs(field)} value={form[field]}
                    min={type === "number" ? 13 : undefined} max={type === "number" ? 25 : undefined}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    onFocus={() => setFocusField(field)} onBlur={() => setFocusField(null)} />
                </div>
              ))}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Positie *</label>
                <select style={{ ...fs("positie"), appearance: "auto" }} value={form.positie}
                  onChange={e => setForm({ ...form, positie: e.target.value })}
                  onFocus={() => setFocusField("positie")} onBlur={() => setFocusField(null)}>
                  <option value="">Selecteer positie</option>
                  {["Keeper","Verdediger","Middenvelder","Aanvaller","Nog niet zeker"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Vertel iets over jezelf <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>(optioneel)</span></label>
                <textarea style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} value={form.bericht}
                  onChange={e => setForm({ ...form, bericht: e.target.value })}
                  onFocus={() => setFocusField("bericht")} onBlur={() => setFocusField(null)} />
              </div>
              <button type="submit" disabled={loading} style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "14px", padding: "14px 24px", border: "none", cursor: loading ? "not-allowed" : "pointer", width: "100%", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Versturen..." : "Verzend →"}
              </button>
            </form>
          )}
        </div>
      </section>
    </WebsiteLayout>
  );
}