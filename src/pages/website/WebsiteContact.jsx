import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

export default function WebsiteContact() {
  const [inst, setInst] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      if (res?.data?.instellingen) setInst(res.data.instellingen);
    });
  }, []);

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
      <section style={{ height: "300px", background: inst?.contact_image_url ? `url(${inst.contact_image_url}) center/cover` : "linear-gradient(160deg, #1B2A5E 0%, #0F1630 100%)", display: "flex", alignItems: "flex-end", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(16,18,26,0.5)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 56px)", color: "#fff", lineHeight: 1 }}>NEEM CONTACT OP</div>
        </div>
      </section>

      <section style={{ background: "#10121A", padding: "64px 28px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "40px" }}>
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
          <div style={{ textAlign: "center" }}>
            <a href={`mailto:${email}`} style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontWeight: 700, fontSize: "14px", padding: "14px 28px", textDecoration: "none", display: "inline-block", marginBottom: "24px" }}>Stuur een e-mail</a>
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