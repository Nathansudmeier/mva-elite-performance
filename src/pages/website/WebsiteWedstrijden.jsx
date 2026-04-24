import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const FILTER_TABS = [
  { label: "Alle", value: "Alle" },
  { label: "MO17", value: "MO17" },
  { label: "MO20", value: "MO20" },
  { label: "Vrouwen 1", value: "Dames 1" },
];

export default function WebsiteWedstrijden() {
  const [wedstrijden, setWedstrijden] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("Alle");
  const [inst, setInst] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getWebsiteData', {}).then(res => {
      if (res?.data?.instellingen) setInst(res.data.instellingen);
      if (res?.data?.wedstrijden) setWedstrijden(res.data.wedstrijden);
      if (res?.data?.matches) setMatches(res.data.matches);
    });
  }, []);

  // Koppel Match scores aan AgendaItems via match_id of datum+tegenstander
  const getMatchScore = (w) => {
    // Probeer via match_id te koppelen
    if (w.match_id) {
      const m = matches.find(m => m.id === w.match_id);
      if (m && m.score_home != null) return m;
    }
    // Fallback: koppel via datum
    const m = matches.find(m => m.date === w.date);
    if (m && m.score_home != null) return m;
    return null;
  };

  const today = new Date().toISOString().split("T")[0];
  const filtered = activeTab === "Alle"
    ? wedstrijden
    : wedstrijden.filter(w => w.team === activeTab || w.team === "Beide");
  const programma = filtered.filter(w => w.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const resultaten = filtered.filter(w => w.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const WedstrijdRij = ({ w }) => {
    const matchScore = getMatchScore(w);
    const heeftScore = matchScore && matchScore.score_home != null && matchScore.score_away != null;
    const scoreHome = heeftScore ? matchScore.score_home : null;
    const scoreAway = heeftScore ? matchScore.score_away : null;
    const resultaat = heeftScore
      ? scoreHome > scoreAway ? "W" : scoreHome < scoreAway ? "V" : "G"
      : null;
    const resultaatKleur = resultaat === "W" ? "#08D068" : resultaat === "V" ? "#FF3DA8" : "#FFD600";

    return (
      <div style={{ background: "#202840", borderRadius: "6px", padding: "14px 16px", marginBottom: "8px", display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "12px", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{w.date ? format(parseISO(w.date), "d MMM yyyy", { locale: nl }) : "—"}</div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{w.team}</div>
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>MV Artemis vs {w.title || w.notes || "Tegenstander"}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{w.location || "Locatie onbekend"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          {heeftScore ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff", letterSpacing: "1px" }}>{scoreHome} – {scoreAway}</span>
              <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "3px", background: `${resultaatKleur}22`, color: resultaatKleur }}>{resultaat}</span>
            </div>
          ) : (
            <>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", background: w.home_away === "Thuis" ? "rgba(255,104,0,0.15)" : "rgba(255,255,255,0.07)", color: w.home_away === "Thuis" ? "#FF6800" : "rgba(255,255,255,0.5)" }}>{w.home_away || "Thuis"}</span>
              {w.start_time && <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#FF6800" }}>{w.start_time}</span>}
            </>
          )}
        </div>
      </div>
    );
  };

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
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{ background: activeTab === tab.value ? "#FF6800" : "#202840", color: "#fff", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>{tab.label}</button>
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