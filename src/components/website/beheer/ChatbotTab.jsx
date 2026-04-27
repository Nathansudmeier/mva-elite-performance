import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChatCircle, X } from "@phosphor-icons/react";

const KEYWORDS = [
  "proeftraining", "wedstrijd", "training", "mo17", "mo20", "vrouwen", "v1",
  "filosofie", "contact", "aanmelden", "kampioen", "uitslag", "score",
  "speelster", "trainer", "keeperstrainer", "nathan", "locatie", "friesland",
  "nieuws", "selectie", "seizoen", "thuis", "uit", "sponsor"
];

export default function ChatbotTab() {
  const [conversaties, setConversaties] = useState([]);
  const [laden, setLaden] = useState(true);
  const [geselecteerd, setGeselecteerd] = useState(null);
  const [filterDoorgestuurd, setFilterDoorgestuurd] = useState("alle");
  const [filterAfgerond, setFilterAfgerond] = useState("alle");
  const [filterVan, setFilterVan] = useState("");
  const [filterTot, setFilterTot] = useState("");

  useEffect(() => {
    base44.entities.ChatbotConversatie.list("-datum", 200).then(data => {
      setConversaties(data || []);
      setLaden(false);
    });
  }, []);

  // Stats
  const nu = new Date();
  const weekGeleden = new Date(nu.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dezeWeek = conversaties.filter(c => c.datum && new Date(c.datum) >= weekGeleden);
  const metDoorverwijzing = conversaties.filter(c => c.doorverwezen_naar);
  
  // Meest gestelde vraag
  const vraagTelling = {};
  conversaties.forEach(c => {
    if (c.eerste_bericht) {
      const key = c.eerste_bericht.slice(0, 60).toLowerCase();
      vraagTelling[key] = (vraagTelling[key] || 0) + 1;
    }
  });
  const meestGesteld = Object.entries(vraagTelling).sort((a, b) => b[1] - a[1])[0];

  // Top vragen
  const topVragen = Object.entries(vraagTelling)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([vraag, aantal]) => ({
      vraag,
      aantal,
      laatste: conversaties
        .filter(c => c.eerste_bericht?.slice(0, 60).toLowerCase() === vraag)
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))[0]?.datum
    }));

  // Keyword cloud
  const keywordTelling = {};
  conversaties.forEach(c => {
    if (!c.berichten) return;
    const tekst = c.berichten.toLowerCase();
    KEYWORDS.forEach(kw => {
      const count = (tekst.match(new RegExp(kw, "g")) || []).length;
      if (count > 0) keywordTelling[kw] = (keywordTelling[kw] || 0) + count;
    });
  });
  const maxKw = Math.max(...Object.values(keywordTelling), 1);
  const keywordLijst = Object.entries(keywordTelling).sort((a, b) => b[1] - a[1]);

  // Gefilterde tabel
  const gefilterd = conversaties.filter(c => {
    if (filterDoorgestuurd === "geen" && c.doorverwezen_naar) return false;
    if (filterDoorgestuurd !== "alle" && filterDoorgestuurd !== "geen" && c.doorverwezen_naar !== filterDoorgestuurd) return false;
    if (filterAfgerond === "ja" && !c.afgerond) return false;
    if (filterAfgerond === "nee" && c.afgerond) return false;
    if (filterVan && c.datum && new Date(c.datum) < new Date(filterVan)) return false;
    if (filterTot && c.datum && new Date(c.datum) > new Date(filterTot + "T23:59:59")) return false;
    return true;
  });

  if (laden) return <div style={{ padding: "40px", textAlign: "center", color: "rgba(26,26,26,0.4)" }}>Laden...</div>;

  return (
    <div>
      {/* Statistieken balk */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Totaal gesprekken", waarde: conversaties.length, kleur: "#FF6800" },
          { label: "Deze week", waarde: dezeWeek.length, kleur: "#1B2A5E" },
          { label: "Meest gestelde vraag", waarde: meestGesteld ? meestGesteld[0].slice(0, 30) + (meestGesteld[0].length > 30 ? "…" : "") : "—", klein: true, kleur: "#08D068" },
          { label: "Doorverwijzingen", waarde: metDoorverwijzing.length, kleur: "#9B5CFF" },
        ].map((stat, i) => (
          <div key={i} className="glass" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: stat.klein ? "12px" : "32px", fontWeight: 900, color: stat.kleur, letterSpacing: stat.klein ? "0" : "-1px", lineHeight: 1.2, marginBottom: "4px" }}>
              {stat.waarde}
            </div>
            <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Meest gestelde vragen */}
      {topVragen.length > 0 && (
        <div className="glass" style={{ padding: "20px", marginBottom: "24px" }}>
          <div className="t-section-title" style={{ marginBottom: "14px" }}>Meest gestelde vragen</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topVragen.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(26,26,26,0.03)", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.35)", width: "20px" }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: "13px", color: "#1a1a1a" }}>{item.vraag.slice(0, 60)}{item.vraag.length > 60 ? "…" : ""}</span>
                <span style={{ background: "#FF6800", color: "#fff", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 800, flexShrink: 0 }}>{item.aantal}×</span>
                {item.laatste && (
                  <span style={{ fontSize: "11px", color: "rgba(26,26,26,0.4)", flexShrink: 0 }}>{new Date(item.laatste).toLocaleDateString("nl-NL")}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversatie tabel + detail */}
      <div style={{ display: "grid", gridTemplateColumns: geselecteerd ? "1fr 380px" : "1fr", gap: "16px", marginBottom: "24px" }}>
        <div className="glass" style={{ padding: "20px" }}>
          <div className="t-section-title" style={{ marginBottom: "14px" }}>Conversaties</div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input type="date" value={filterVan} onChange={e => setFilterVan(e.target.value)}
              style={{ padding: "5px 10px", borderRadius: "8px", border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "12px" }} />
            <span style={{ fontSize: "12px", color: "rgba(26,26,26,0.5)" }}>t/m</span>
            <input type="date" value={filterTot} onChange={e => setFilterTot(e.target.value)}
              style={{ padding: "5px 10px", borderRadius: "8px", border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "12px" }} />
            <select value={filterDoorgestuurd} onChange={e => setFilterDoorgestuurd(e.target.value)}
              style={{ padding: "5px 10px", borderRadius: "8px", border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "12px" }}>
              <option value="alle">Alle doorverwijzingen</option>
              <option value="proeftraining">Proeftraining</option>
              <option value="contact">Contact</option>
              <option value="nieuws">Nieuws</option>
              <option value="geen">Geen doorverwijzing</option>
            </select>
            <select value={filterAfgerond} onChange={e => setFilterAfgerond(e.target.value)}
              style={{ padding: "5px 10px", borderRadius: "8px", border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "12px" }}>
              <option value="alle">Alle statussen</option>
              <option value="ja">Afgerond</option>
              <option value="nee">Nog actief</option>
            </select>
            {(filterVan || filterTot || filterDoorgestuurd !== "alle" || filterAfgerond !== "alle") && (
              <button onClick={() => { setFilterVan(""); setFilterTot(""); setFilterDoorgestuurd("alle"); setFilterAfgerond("alle"); }}
                style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Reset
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
                  {["Datum", "Eerste vraag", "#", "Pagina", "Doorverwezen", "Afgerond"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gefilterd.map(c => (
                  <tr key={c.id} onClick={() => setGeselecteerd(geselecteerd?.id === c.id ? null : c)}
                    style={{ borderBottom: "1px solid rgba(26,26,26,0.07)", cursor: "pointer", background: geselecteerd?.id === c.id ? "rgba(255,104,0,0.05)" : "transparent" }}>
                    <td style={{ padding: "9px 10px", whiteSpace: "nowrap", color: "rgba(26,26,26,0.65)" }}>{c.datum ? new Date(c.datum).toLocaleDateString("nl-NL") : "—"}</td>
                    <td style={{ padding: "9px 10px", fontWeight: 600, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.eerste_bericht || "—"}</td>
                    <td style={{ padding: "9px 10px", textAlign: "center" }}>{c.aantal_berichten || "—"}</td>
                    <td style={{ padding: "9px 10px", color: "rgba(26,26,26,0.5)", fontSize: "11px" }}>{c.pagina || "/"}</td>
                    <td style={{ padding: "9px 10px" }}>
                      {c.doorverwezen_naar ? (
                        <span style={{ background: "rgba(255,104,0,0.12)", color: "#FF6800", borderRadius: "10px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{c.doorverwezen_naar}</span>
                      ) : <span style={{ color: "rgba(26,26,26,0.3)", fontSize: "11px" }}>—</span>}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: "14px" }}>{c.afgerond ? "✓" : "·"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gefilterd.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen conversaties gevonden.</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {geselecteerd && (
          <div className="glass" style={{ padding: "20px", position: "sticky", top: "80px", alignSelf: "start", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Gesprek</div>
              <button onClick={() => setGeselecteerd(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>

            {/* Metadata */}
            <div style={{ background: "rgba(26,26,26,0.04)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div><span style={{ fontWeight: 700, color: "rgba(26,26,26,0.5)" }}>Sessie:</span> {geselecteerd.sessie_id?.slice(0, 8)}…</div>
              <div><span style={{ fontWeight: 700, color: "rgba(26,26,26,0.5)" }}>Datum:</span> {geselecteerd.datum ? new Date(geselecteerd.datum).toLocaleString("nl-NL") : "—"}</div>
              <div><span style={{ fontWeight: 700, color: "rgba(26,26,26,0.5)" }}>Pagina:</span> {geselecteerd.pagina || "/"}</div>
              {geselecteerd.doorverwezen_naar && <div><span style={{ fontWeight: 700, color: "rgba(26,26,26,0.5)" }}>Doorverwezen:</span> {geselecteerd.doorverwezen_naar}</div>}
              <div><span style={{ fontWeight: 700, color: "rgba(26,26,26,0.5)" }}>Berichten:</span> {geselecteerd.aantal_berichten}</div>
            </div>

            {/* Chat transcript */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(() => {
                try {
                  const msgs = JSON.parse(geselecteerd.berichten || "[]");
                  return msgs.map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: b.rol === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "85%",
                        padding: "8px 12px",
                        borderRadius: b.rol === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                        background: b.rol === "user" ? "#FF6800" : "#202840",
                        color: "#fff",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}>
                        {b.inhoud}
                      </div>
                    </div>
                  ));
                } catch {
                  return <div style={{ fontSize: "12px", color: "rgba(26,26,26,0.4)" }}>Geen berichten</div>;
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Keyword cloud */}
      {keywordLijst.length > 0 && (
        <div className="glass" style={{ padding: "20px" }}>
          <div className="t-section-title" style={{ marginBottom: "14px" }}>Populaire onderwerpen</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {keywordLijst.map(([kw, count]) => {
              const ratio = count / maxKw;
              const fontSize = 11 + ratio * 14;
              const isTop = ratio > 0.6;
              return (
                <span key={kw} style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: `${fontSize}px`,
                  fontWeight: isTop ? 800 : 600,
                  background: isTop ? "#FF6800" : "rgba(26,26,26,0.07)",
                  color: isTop ? "#fff" : "rgba(26,26,26,0.6)",
                  border: isTop ? "none" : "1px solid rgba(26,26,26,0.12)",
                }}>
                  {kw}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}