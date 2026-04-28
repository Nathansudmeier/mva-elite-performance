import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const inputCls = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "13px",
  background: "#fff", boxSizing: "border-box",
};
const sectionLabel = {
  fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "1px", color: "rgba(26,26,26,0.45)", marginBottom: "6px",
};

export default function DocumentenTab() {
  const [documenten, setDocumenten] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    base44.entities.ClubDocument.list("volgorde").then(d =>
      setDocumenten((d || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)))
    );
  }, []);

  const saveDoc = async (data) => {
    if (editing) {
      await base44.entities.ClubDocument.update(editing.id, data);
      setDocumenten(prev => prev.map(d => d.id === editing.id ? { ...d, ...data } : d).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
    } else {
      const created = await base44.entities.ClubDocument.create(data);
      setDocumenten(prev => [...prev, created].sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
    }
    setEditing(null);
    setShowForm(false);
  };

  const deleteDoc = async (id) => {
    if (!confirm("Verwijderen?")) return;
    await base44.entities.ClubDocument.delete(id);
    setDocumenten(prev => prev.filter(d => d.id !== id));
  };

  const toggleActief = async (id, actief) => {
    await base44.entities.ClubDocument.update(id, { actief: !actief });
    setDocumenten(prev => prev.map(d => d.id === id ? { ...d, actief: !d.actief } : d));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div className="t-section-title">Clubdocumenten</div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }} style={{ width: "auto" }}>+ Nieuw document</button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
          <DocForm doc={editing} onSave={saveDoc} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
              {["#", "Naam", "Categorie", "Bestand URL", "Actief", "Acties"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documenten.map(d => (
              <tr key={d.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}>
                <td style={{ padding: "10px 12px", color: "rgba(26,26,26,0.5)" }}>{d.volgorde}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{d.naam}</td>
                <td style={{ padding: "10px 12px", fontSize: "12px" }}>{d.categorie}</td>
                <td style={{ padding: "10px 12px", fontSize: "11px", color: d.bestand_url ? "#08D068" : "rgba(26,26,26,0.35)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.bestand_url || "Geen URL"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <input type="checkbox" checked={d.actief !== false} onChange={() => toggleActief(d.id, d.actief !== false)} style={{ cursor: "pointer" }} />
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                  <button onClick={() => { setEditing(d); setShowForm(true); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF6800", background: "transparent", color: "#FF6800", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Bewerk</button>
                  <button onClick={() => deleteDoc(d.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Verwijder</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documenten.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen documenten</div>}
      </div>
    </div>
  );
}

function DocForm({ doc, onSave, onCancel }) {
  const [data, setData] = useState(doc || { naam: "", beschrijving: "", bestand_url: "", categorie: "Protocol", volgorde: 1, actief: true });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setData(prev => ({ ...prev, bestand_url: file_url }));
    setUploading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Naam *</div>
          <input style={inputCls} value={data.naam} onChange={e => setData({ ...data, naam: e.target.value })} placeholder="Gedragscode" />
        </div>
        <div>
          <div style={sectionLabel}>Categorie *</div>
          <select style={{ ...inputCls, appearance: "auto" }} value={data.categorie} onChange={e => setData({ ...data, categorie: e.target.value })}>
            {["Reglement", "Protocol", "Overig"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <div style={sectionLabel}>Beschrijving (optioneel)</div>
        <input style={inputCls} value={data.beschrijving || ""} onChange={e => setData({ ...data, beschrijving: e.target.value })} placeholder="Korte omschrijving" />
      </div>
      <div>
        <div style={sectionLabel}>PDF uploaden</div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: uploading ? "not-allowed" : "pointer", padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontSize: "12px", fontWeight: 700, background: "#fff", opacity: uploading ? 0.6 : 1 }}>
          {uploading ? "⏳ Bezig met uploaden..." : "📄 PDF uploaden"}
          <input type="file" accept="application/pdf" style={{ display: "none" }} disabled={uploading} onChange={handleFileUpload} />
        </label>
        {data.bestand_url && (
          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#08D068", fontWeight: 700 }}>✓ Bestand geüpload</span>
            <a href={data.bestand_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#FF6800", textDecoration: "underline" }}>Bekijk PDF</a>
            <button onClick={() => setData(prev => ({ ...prev, bestand_url: "" }))} style={{ fontSize: "11px", color: "#FF3DA8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Verwijder</button>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "center" }}>
        <div>
          <div style={sectionLabel}>Volgorde</div>
          <input type="number" style={inputCls} value={data.volgorde} onChange={e => setData({ ...data, volgorde: Number(e.target.value) })} min="1" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
          <input type="checkbox" id="doc-actief" checked={data.actief !== false} onChange={e => setData({ ...data, actief: e.target.checked })} style={{ cursor: "pointer" }} />
          <label htmlFor="doc-actief" style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Actief</label>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="btn-primary" onClick={() => onSave(data)}>Opslaan</button>
        <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
      </div>
    </div>
  );
}