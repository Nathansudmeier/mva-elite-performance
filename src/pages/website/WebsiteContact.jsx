import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

const inputStyle = {
  background: "#10121A", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "4px", color: "#fff", fontFamily: "'Space Grotesk', sans-serif",
  fontSize: "14px", padding: "10px 14px", width: "100%", boxSizing: "border-box", outline: "none",
};

const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: "6px" };

export default function WebsiteContact() {
  const [inst, setInst] = useState(null);
  const [form, setForm] = useState({ naam: "", email: "", onderwerp: "", bericht: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      if (res?.data?.instellingen) setInst(res.data.instellingen);
    });
  }, []);

  const validate = () => {
    const e = {};
    ["naam", "email", "onderwerp", "bericht"].forEach(f => { if (!form[f]) e[f] = true; });
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    await base44.entities.ContactBericht.create({ ...form, datum: new Date().toISOString(), status: "nieuw" });
    setSubmitted(true);
    setLoading(false);
  };

  const fs = (name) => ({
    ...inputStyle,
    borderColor: errors[name] ? "#FF4444" : focusField === name ? "#FF6800" : "rgba(255,255,255,0.15)",
    boxShadow: focusField === name ? "0 0 0 2px rgba(255,104,0,0.2)" : "none",
  });

  const email = inst?.club_email || "contact@fcmvanoord.com";
  const locatie = inst?.club_locatie || "Sportpark Opeinde, Friesland";
  const instagram = inst?.instagram_url || "https://instagram.com/mv.artemis";
  const instagramHandle = instagram.replace(/.*instagram\.com\/?/, "@").replace(/\/$/, "") || "@mv.artemis";

  const contactItems = [
    { label: "E-mail", value: email, link: `mailto:${email}` },
    { label: "Website", value: "mv-artemis.nl", link: "https://mv-artemis.nl" },
    { label: "Locatie", value: locatie, link: null },
    { label: "Instagram", value: instagramHandle, link: instagram },
  ];

  return (
    <WebsiteLayout>
      <section style={{ height: "450px", background: inst?.contact_image_url ? `url(${inst.contact_image_url}) center/cover` : "linear-gradient(160deg, #1B2A5E 0%, #0F1630 100%)", display: "flex", alignItems: "flex-end", position: "relative", backgroundPosition: "center 20%" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.85) 0%, rgba(16,18,26,0.6) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 56px)", color: "#fff", lineHeight: 1 }}>NEEM CONTACT OP</div>
        </div>
      </section>

      <section style={{ background: "#10121A", padding: "64px 28px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto 48px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: "20px" }}>
              We zijn een club die zegt wat ze bedoelt. Dus ook hier: heb je een vraag, wil je meer weten over MV Artemis, of ben je gewoon benieuwd wat wij doen? Stuur een bericht. We reageren binnen 2 werkdagen.
            </p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>
              Ben je een speler die wil aansluiten? Gebruik dan het proeftraining-formulier hieronder. Dat is de snelste route.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "48px" }}>
            {contactItems.map(item => (
              <div key={item.label} style={{ background: "#202840", borderRadius: "6px", padding: "20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "8px" }}>{item.label}</div>
                {item.link
                  ? <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", color: "#FF6800", textDecoration: "none", fontWeight: 600 }}>{item.value}</a>
                  : <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>{item.value}</div>
                }
              </div>
            ))}
          </div>

          <div style={{ maxWidth: "600px", margin: "0 auto 48px", background: "#202840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "32px" }}>
            {submitted ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "16px", color: "#fff", fontWeight: 600, marginBottom: "8px" }}>Bericht ontvangen!</div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.65)" }}>Bedankt {form.naam}. We nemen binnen 2 werkdagen contact met je op via {form.email}.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "24px" }}>STUUR EEN BERICHT</div>
                
                {[
                  ["Naam", "naam", "text"],
                  ["E-mail", "email", "email"],
                ].map(([label, field, type]) => (
                  <div key={field} style={{ marginBottom: "16px" }}>
                    <label style={labelStyle}>{label} *</label>
                    <input type={type} style={fs(field)} value={form[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      onFocus={() => setFocusField(field)} onBlur={() => setFocusField(null)} />
                  </div>
                ))}

                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Onderwerp *</label>
                  <select style={{ ...fs("onderwerp"), appearance: "auto" }} value={form.onderwerp}
                    onChange={e => setForm({ ...form, onderwerp: e.target.value })}
                    onFocus={() => setFocusField("onderwerp")} onBlur={() => setFocusField(null)}>
                    <option value="">Selecteer onderwerp</option>
                    {["Algemene vraag", "Samenwerking/Sponsoring", "Media/Pers", "Anders"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>Bericht *</label>
                  <textarea style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }} value={form.bericht}
                    onChange={e => setForm({ ...form, bericht: e.target.value })}
                    onFocus={() => setFocusField("bericht")} onBlur={() => setFocusField(null)} />
                </div>

                <button type="submit" disabled={loading} style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "14px", padding: "14px 24px", border: "none", cursor: loading ? "not-allowed" : "pointer", width: "100%", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Verzenden..." : "Verzend bericht →"}
                </button>
              </form>
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ padding: "24px", background: "#151D35", borderRadius: "6px" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff", marginBottom: "12px" }}>OF MELD JE AAN VOOR EEN PROEFTRAINING</div>
              <Link to="/proeftraining" style={{ background: "#FFD600", color: "#000", borderRadius: "3px", fontWeight: 700, fontSize: "14px", padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>Proeftraining aanvragen ↗</Link>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}