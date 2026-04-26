import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const sectionLabel = {
  fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "1px", color: "rgba(26,26,26,0.45)", marginBottom: "6px",
};

export default function NieuwsbriefTab() {
  const [abonnees, setAbonnees] = useState([]);
  const [filter, setFilter] = useState("alle");
  const [versturen, setVersturen] = useState(false);
  const [resultaat, setResultaat] = useState(null);

  useEffect(() => {
    base44.entities.Abonnee.list("-aangemeld_op").then(list => setAbonnees(list || []));
  }, []);

  const totaalActief = abonnees.filter(a => a.actief && a.bevestigd).length;
  const startMaand = new Date(); startMaand.setDate(1); startMaand.setHours(0, 0, 0, 0);
  const dezeMaand = abonnees.filter(a => a.aangemeld_op && new Date(a.aangemeld_op) >= startMaand).length;
  const afgemeld = abonnees.filter(a => !a.actief).length;

  const filtered = abonnees.filter(a => {
    if (filter === "alle") return true;
    if (filter === "bevestigd") return a.bevestigd && a.actief;
    if (filter === "onbevestigd") return !a.bevestigd && a.actief;
    if (filter === "afgemeld") return !a.actief;
    return true;
  });

  const exportCSV = () => {
    const headers = ["aangemeld_op", "email", "naam", "team_voorkeur", "bevestigd", "actief"];
    const rows = abonnees.map(a => headers.map(h => `"${(a[h] ?? "").toString().replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = url; el.download = "abonnees.csv"; el.click();
  };

  const handleVerstuur = async () => {
    if (!confirm(`Weet je zeker dat je de nieuwsbrief nu wilt versturen naar ${totaalActief} abonnees?`)) return;
    setVersturen(true);
    setResultaat(null);
    try {
      const res = await base44.functions.invoke("weekelijkseNieuwsbrief", {});
      setResultaat(res?.data || { status: "ok" });
    } catch (e) {
      setResultaat({ status: "error", message: e.message });
    }
    setVersturen(false);
  };

  const verwijderAbonnee = async (id) => {
    if (!confirm("Verwijderen?")) return;
    await base44.entities.Abonnee.delete(id);
    setAbonnees(prev => prev.filter(a => a.id !== id));
  };

  const StatBlok = ({ label, waarde, kleur }) => (
    <div className="glass" style={{ padding: "16px 20px", flex: 1, minWidth: "160px" }}>
      <div style={sectionLabel}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: 900, color: kleur || "#1a1a1a", letterSpacing: "-1px" }}>{waarde}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <StatBlok label="Totaal abonnees" waarde={totaalActief} kleur="#FF6800" />
        <StatBlok label="Aangemeld deze maand" waarde={dezeMaand} />
        <StatBlok label="Afgemeld" waarde={afgemeld} kleur="rgba(26,26,26,0.45)" />
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[["alle","Alle"],["bevestigd","Bevestigd"],["onbevestigd","Onbevestigd"],["afgemeld","Afgemeld"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontWeight: 700, fontSize: "12px", cursor: "pointer", background: filter === k ? "#1a1a1a" : "#fff", color: filter === k ? "#fff" : "#1a1a1a" }}>{l}</button>
          ))}
        </div>
        <button className="btn-secondary" onClick={exportCSV}>↓ CSV exporteren</button>
        <button className="btn-primary" onClick={handleVerstuur} disabled={versturen} style={{ width: "auto" }}>
          {versturen ? "Versturen..." : "Verstuur nieuwsbrief nu"}
        </button>
      </div>

      {resultaat && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", background: resultaat.status === "ok" ? "rgba(8,208,104,0.1)" : "rgba(255,61,168,0.1)", color: resultaat.status === "ok" ? "#08D068" : "#FF3DA8", fontSize: "13px", fontWeight: 600 }}>
          {resultaat.status === "ok" ? `✓ Verstuurd naar ${resultaat.verstuurd ?? "?"} abonnees${resultaat.mislukt ? ` (${resultaat.mislukt} mislukt)` : ""}.` : `Fout: ${resultaat.message || "onbekende fout"}`}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
              {["Aangemeld","Email","Naam","Team","Bevestigd","Actief","Acties"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{a.aangemeld_op ? new Date(a.aangemeld_op).toLocaleDateString("nl-NL") : "—"}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{a.email}</td>
                <td style={{ padding: "10px 12px" }}>{a.naam || "—"}</td>
                <td style={{ padding: "10px 12px" }}>{a.team_voorkeur || "Alle"}</td>
                <td style={{ padding: "10px 12px" }}>{a.bevestigd ? "✓" : "—"}</td>
                <td style={{ padding: "10px 12px" }}>{a.actief ? "✓" : "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={() => verwijderAbonnee(a.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Verwijder</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen abonnees gevonden.</div>}
      </div>
    </div>
  );
}