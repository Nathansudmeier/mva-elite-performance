import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const FILTER_TABS = ["Alle", "MO17", "MO20", "Vrouwen 1"];

export default function WebsiteWedstrijden() {
  const [wedstrijden, setWedstrijden] = useState([]);
  const [activeTab, setActiveTab] = useState("Alle");
  const [inst, setInst] = useState(null);

  useEffect(() => {
    base44.entities.AgendaItem.filter({ type: "Wedstrijd" }).then(data => setWedstrijden(data || []));
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      if (res?.data?.instellingen) setInst(res.data.instellingen);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const filtered = activeTab === "Alle" ? wedstrijden : wedstrijden.filter(w => w.team === activeTab || w.team === "Beide");
  const programma = filtered.filter(w => w.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const resultaten = filtered.filter(w => w.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const WedstrijdRij = ({ w }) => (
    <div style={{ background: "#202840", borderRadius: "6px", padding: "14px 16px", marginBottom: "8px", display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "12px", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{w.date ? format(parseISO(w.date), "d MMM yyyy", { locale: nl }) : "—"}</div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{w.team}</div>
      </div>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>MV Artemis vs {w.notes || "Tegenstander"}</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{w.location || "Locatie onbekend"}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", background: w.home_away === "Thuis" ? "rgba(255,104,0,0.15)" : "rgba(255,255,255,0.07)", color: w.home_away === "Thuis" ? "#FF6800" : "rgba(255,255,255,0.5)" }}>{w.home_away || "Thuis"}</span>
        {w.start_time && <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#FF6800" }}>{w.start_time}</span>}
      </div>
    </div>
  );

  return (
    <WebsiteLayout>
      <section style={{ background: inst?.wedstrijden_image_url ? `url(${inst.wedstrijden_image_url}) center/cover` : "#14192A", padding: "48px 28px 32px", position: "relative" }}>
        {inst?.wedstrijden_image_url && <div style={{ position: "absolute", inset: 0, background: "rgba(16,18,26,0.7)" }} />}
        <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "3px", color: "#FF6800", marginBottom: "8px" }}>SCHEMA</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 52px)", color: "#fff", marginBottom: "24px" }}>WEDSTRIJDEN</h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {FILTER_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? "#FF6800" : "#202840", color: "#fff", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>{tab}</button>
            ))}
          </div>
        </div>
        </div>
      </section>
      <section style={{ background: "#10121A", padding: "32px 28px 64px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {programma.length > 0 && (
            <>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff", marginBottom: "16px", marginTop: "16px" }}>PROGRAMMA</div>
              {programma.map(w => <WedstrijdRij key={w.id} w={w} />)}
            </>
          )}
          {resultaten.length > 0 && (
            <>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "rgba(255,255,255,0.5)", marginBottom: "16px", marginTop: "32px" }}>RESULTATEN</div>
              {resultaten.map(w => <WedstrijdRij key={w.id} w={w} />)}
            </>
          )}
          {programma.length === 0 && resultaten.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Geen wedstrijden gevonden.</div>
          )}
        </div>
      </section>
    </WebsiteLayout>
  );
}