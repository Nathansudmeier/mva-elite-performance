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
  const [showAddModal, setShowAddModal] = useState(false);
  const [importResultaat, setImportResultaat] = useState(null);

  const reloadAbonnees = async () => {
    const res = await base44.functions.invoke("abonneesBeheer", { action: "list" });
    setAbonnees(res?.data?.abonnees || []);
  };

  useEffect(() => {
    reloadAbonnees();
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
    await base44.functions.invoke("abonneesBeheer", { action: "delete", id });
    setAbonnees(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAbonnee = async (data) => {
    const email = data.email.trim().toLowerCase();
    const bestaand = abonnees.find(a => a.email === email);
    if (bestaand) {
      alert("Deze e-mail is al aangemeld.");
      return;
    }

    if (data.bevestigd) {
      const res = await base44.functions.invoke("abonneesBeheer", {
        action: "create",
        email,
        naam: data.naam || "",
        team_voorkeur: data.team_voorkeur || "Alle",
        bevestigd: true,
      });
      if (res?.data?.abonnee) setAbonnees(prev => [res.data.abonnee, ...prev]);
    } else {
      await base44.functions.invoke("nieuwsbriefAanmelden", {
        email,
        naam: data.naam || "",
        team_voorkeur: data.team_voorkeur || "Alle",
      });
      await reloadAbonnees();
    }

    setShowAddModal(false);
    setResultaat({ status: "ok", message: "Abonnee toegevoegd." });
  };

  const handleImportCSV = async (file) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      alert("Lege of ongeldige CSV.");
      return;
    }
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const emailIdx = headers.indexOf("email");
    const naamIdx = headers.indexOf("naam");
    const teamIdx = headers.indexOf("team_voorkeur");
    if (emailIdx === -1) {
      alert("CSV moet een 'email' kolom bevatten.");
      return;
    }

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const email = (cells[emailIdx] || "").toLowerCase();
      if (!email) continue;
      items.push({
        email,
        naam: naamIdx !== -1 ? (cells[naamIdx] || "") : "",
        team_voorkeur: teamIdx !== -1 && cells[teamIdx] ? cells[teamIdx] : "Alle",
      });
    }
    const res = await base44.functions.invoke("abonneesBeheer", { action: "bulkCreate", items });
    const { toegevoegd = 0, alBestaand = 0 } = res?.data || {};
    await reloadAbonnees();
    setImportResultaat({ toegevoegd, alBestaand });
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
        <button className="btn-secondary" onClick={() => setShowAddModal(true)}>+ Abonnee toevoegen</button>
        <label
          className="btn-secondary"
          style={{ cursor: "pointer" }}
          title="CSV met kolommen:&#10;email,naam,team_voorkeur&#10;jan@email.nl,Jan de Vries,MO17&#10;petra@email.nl,Petra Smit,Alle"
        >
          ↑ Importeer CSV
          <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={async (e) => {
            await handleImportCSV(e.target.files[0]);
            e.target.value = "";
          }} />
        </label>
        <button className="btn-primary" onClick={handleVerstuur} disabled={versturen} style={{ width: "auto" }}>
          {versturen ? "Versturen..." : "Verstuur nieuwsbrief nu"}
        </button>
      </div>

      {importResultaat && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", background: "rgba(8,208,104,0.1)", color: "#08D068", fontSize: "13px", fontWeight: 600 }}>
          ✓ {importResultaat.toegevoegd} abonnees toegevoegd, {importResultaat.alBestaand} al bestaand.
        </div>
      )}

      {showAddModal && (
        <AddAbonneeModal onSave={handleAddAbonnee} onCancel={() => setShowAddModal(false)} />
      )}

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

function AddAbonneeModal({ onSave, onCancel }) {
  const [data, setData] = useState({ naam: "", email: "", team_voorkeur: "Alle", bevestigd: true });
  const [bezig, setBezig] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!data.email) return;
    setBezig(true);
    await onSave(data);
    setBezig(false);
  };

  const inputCls = {
    width: "100%", padding: "8px 12px", borderRadius: "8px",
    border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "13px",
    background: "#fff", boxSizing: "border-box",
  };
  const labelCls = {
    fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
    letterSpacing: "1px", color: "rgba(26,26,26,0.45)", marginBottom: "6px",
  };

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} style={{ background: "#fff", borderRadius: "16px", padding: "24px", maxWidth: "440px", width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "18px", fontWeight: 900, marginBottom: "4px" }}>Abonnee toevoegen</div>

        <div>
          <div style={labelCls}>Naam</div>
          <input style={inputCls} value={data.naam} onChange={e => setData({ ...data, naam: e.target.value })} placeholder="Optioneel" />
        </div>

        <div>
          <div style={labelCls}>E-mail *</div>
          <input type="email" required style={inputCls} value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="naam@email.nl" />
        </div>

        <div>
          <div style={labelCls}>Team voorkeur</div>
          <select style={{ ...inputCls, appearance: "auto" }} value={data.team_voorkeur} onChange={e => setData({ ...data, team_voorkeur: e.target.value })}>
            {["Alle", "MO15", "MO17", "MO20", "Vrouwen 1"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px 12px", background: "rgba(26,26,26,0.04)", borderRadius: "8px" }} title="Uit = abonnee ontvangt eerst een bevestigingsmail">
          <input type="checkbox" checked={data.bevestigd} onChange={e => setData({ ...data, bevestigd: e.target.checked })} style={{ cursor: "pointer" }} />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>Bevestigd</div>
            <div style={{ fontSize: "11px", color: "rgba(26,26,26,0.5)" }}>Uit = abonnee ontvangt eerst een bevestigingsmail</div>
          </div>
        </label>

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button type="submit" className="btn-primary" disabled={bezig}>{bezig ? "Bezig..." : "Toevoegen"}</button>
          <button type="button" onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
        </div>
      </form>
    </div>
  );
}