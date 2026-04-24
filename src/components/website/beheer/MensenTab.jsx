import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AFDELINGEN = ["Bestuur", "Technische Commissie", "Vrijwilliger", "Vertrouwenspersoon"];

const inputCls = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "13px",
  background: "#fff", boxSizing: "border-box",
};

const sectionLabel = {
  fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "1px", color: "rgba(26,26,26,0.45)", marginBottom: "6px",
};

function PersoonForm({ persoon, onSave, onCancel }) {
  const [data, setData] = useState(persoon || {
    naam: "", functie: "", afdeling: "Bestuur",
    bio: "", foto_url: "", email: "",
    volgorde: 1, actief: true,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Naam *</div>
          <input style={inputCls} value={data.naam} onChange={e => setData({ ...data, naam: e.target.value })} />
        </div>
        <div>
          <div style={sectionLabel}>Functie *</div>
          <input style={inputCls} value={data.functie} onChange={e => setData({ ...data, functie: e.target.value })} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Afdeling *</div>
          <select style={{ ...inputCls, appearance: "auto" }} value={data.afdeling} onChange={e => setData({ ...data, afdeling: e.target.value })}>
            {AFDELINGEN.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={sectionLabel}>Volgorde</div>
          <input type="number" style={inputCls} value={data.volgorde} onChange={e => setData({ ...data, volgorde: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <div style={sectionLabel}>Email (niet publiek)</div>
        <input type="email" style={inputCls} value={data.email || ""} onChange={e => setData({ ...data, email: e.target.value })} placeholder="naam@voorbeeld.nl" />
      </div>
      <div>
        <div style={sectionLabel}>Foto URL</div>
        <input style={inputCls} value={data.foto_url || ""} onChange={e => setData({ ...data, foto_url: e.target.value })} placeholder="https://..." />
        {data.foto_url && <img src={data.foto_url} alt="preview" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", marginTop: "8px" }} />}
      </div>
      <div>
        <div style={sectionLabel}>Bio (optioneel)</div>
        <textarea style={{ ...inputCls, minHeight: "60px", resize: "vertical" }} value={data.bio || ""} onChange={e => setData({ ...data, bio: e.target.value })} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="checkbox" id="persoon-actief" checked={data.actief !== false} onChange={e => setData({ ...data, actief: e.target.checked })} style={{ cursor: "pointer" }} />
        <label htmlFor="persoon-actief" style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Actief (zichtbaar op website)</label>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="btn-primary" onClick={() => onSave(data)}>Opslaan</button>
        <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
      </div>
    </div>
  );
}

export default function MensenTab() {
  const [personen, setPersonen] = useState([]);
  const [filter, setFilter] = useState("alle");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.entities.Persoon.list().then(p =>
      setPersonen((p || []).sort((a, b) => (a.afdeling || "").localeCompare(b.afdeling || "") || (a.volgorde || 0) - (b.volgorde || 0)))
    );
  }, []);

  const save = async (data) => {
    if (editing) {
      await base44.entities.Persoon.update(editing.id, data);
      setPersonen(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p));
    } else {
      const created = await base44.entities.Persoon.create(data);
      setPersonen(prev => [...prev, created]);
    }
    setEditing(null);
    setShowForm(false);
  };

  const remove = async (id) => {
    await base44.entities.Persoon.delete(id);
    setPersonen(prev => prev.filter(p => p.id !== id));
  };

  const toggleActief = async (p) => {
    await base44.entities.Persoon.update(p.id, { actief: !p.actief });
    setPersonen(prev => prev.map(x => x.id === p.id ? { ...x, actief: !x.actief } : x));
  };

  const filtered = filter === "alle" ? personen : personen.filter(p => p.afdeling === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["alle", ...AFDELINGEN].map(a => (
            <button key={a} onClick={() => setFilter(a)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontWeight: 700, fontSize: "12px", cursor: "pointer", background: filter === a ? "#1a1a1a" : "#fff", color: filter === a ? "#fff" : "#1a1a1a" }}>{a}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }} style={{ width: "auto" }}>+ Nieuwe persoon</button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
          <PersoonForm persoon={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
              {["Naam", "Functie", "Afdeling", "Volgorde", "Actief", "Acties"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{p.naam}</td>
                <td style={{ padding: "10px 12px" }}>{p.functie}</td>
                <td style={{ padding: "10px 12px", fontSize: "12px" }}>{p.afdeling}</td>
                <td style={{ padding: "10px 12px" }}>{p.volgorde}</td>
                <td style={{ padding: "10px 12px" }}>
                  <input type="checkbox" checked={p.actief !== false} onChange={() => toggleActief(p)} style={{ cursor: "pointer" }} />
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                  <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF6800", background: "transparent", color: "#FF6800", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Bewerk</button>
                  <button onClick={() => { if (confirm("Verwijderen?")) remove(p.id); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Verwijder</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen personen</div>}
      </div>
    </div>
  );
}