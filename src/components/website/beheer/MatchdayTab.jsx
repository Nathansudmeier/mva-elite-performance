import React, { useEffect, useState } from "react";
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

const TEAMS = ["Alle", "MO17", "MO20", "Vrouwen 1", "Dames 1"];

export default function MatchdayTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.entities.MatchdayAchtergrond.list().then(list => {
      setItems((list || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
    });
  }, []);

  const save = async (data) => {
    const { id, created_date, updated_date, created_by, ...payload } = data;
    if (editing) {
      await base44.entities.MatchdayAchtergrond.update(editing.id, payload);
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...payload } : i).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
    } else {
      const created = await base44.entities.MatchdayAchtergrond.create(payload);
      setItems(prev => [...prev, created].sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
    }
    setEditing(null);
    setShowForm(false);
  };

  const remove = async (id) => {
    if (!confirm("Verwijderen?")) return;
    await base44.entities.MatchdayAchtergrond.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleActief = async (i) => {
    await base44.entities.MatchdayAchtergrond.update(i.id, { actief: !i.actief });
    setItems(prev => prev.map(x => x.id === i.id ? { ...x, actief: !x.actief } : x));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div className="t-section-title">Matchday achtergronden</div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }} style={{ width: "auto" }}>+ Nieuwe achtergrond</button>
      </div>

      <div style={{ background: "rgba(255,104,0,0.08)", border: "1px solid rgba(255,104,0,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "rgba(26,26,26,0.7)" }}>
        Ideale afmeting: <strong>1080 × 1920px</strong> (2:3 portrait). Gebruik foto's met het gezicht rechtsboven en donkere of vage linkerhelft voor optimale leesbaarheid van de tekst.
      </div>

      {showForm && (
        <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
          <BgForm item={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
              {["Volgorde", "Team", "Naam", "Preview", "Actief", "Acties"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}>
                <td style={{ padding: "10px 12px" }}>{i.volgorde}</td>
                <td style={{ padding: "10px 12px" }}>{i.team}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{i.naam || "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  {i.foto_url && <img src={i.foto_url} alt="" style={{ width: 36, height: 48, objectFit: "cover", borderRadius: 4 }} />}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <input type="checkbox" checked={i.actief !== false} onChange={() => toggleActief(i)} style={{ cursor: "pointer" }} />
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                  <button onClick={() => { setEditing(i); setShowForm(true); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF6800", background: "transparent", color: "#FF6800", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Bewerk</button>
                  <button onClick={() => remove(i.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Verwijder</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen achtergronden</div>}
      </div>
    </div>
  );
}

function BgForm({ item, onSave, onCancel }) {
  const [data, setData] = useState(item || {
    team: "Alle", naam: "", foto_url: "", volgorde: 1, actief: true,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Team *</div>
          <select style={{ ...inputCls, appearance: "auto" }} value={data.team} onChange={e => setData({ ...data, team: e.target.value })}>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={sectionLabel}>Volgorde</div>
          <input type="number" style={inputCls} value={data.volgorde || 1} onChange={e => setData({ ...data, volgorde: Number(e.target.value) })} min="1" />
        </div>
      </div>
      <div>
        <div style={sectionLabel}>Naam</div>
        <input style={inputCls} value={data.naam || ""} onChange={e => setData({ ...data, naam: e.target.value })} placeholder="Teamfoto april 2026" />
      </div>
      <div>
        <div style={sectionLabel}>Foto URL *</div>
        <input style={inputCls} value={data.foto_url || ""} onChange={e => setData({ ...data, foto_url: e.target.value })} placeholder="https://..." />
        <div style={{ marginTop: "6px" }}>
          <label style={{ cursor: "pointer", padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontSize: "12px", fontWeight: 700, background: "#fff", display: "inline-block" }}>
            📁 Foto uploaden
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              const { file_url } = await base44.integrations.Core.UploadFile({ file });
              setData(prev => ({ ...prev, foto_url: file_url }));
            }} />
          </label>
        </div>
        {data.foto_url && <img src={data.foto_url} alt="preview" style={{ width: "120px", height: "180px", objectFit: "cover", borderRadius: "6px", marginTop: "8px", display: "block" }} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="checkbox" id="md-actief" checked={data.actief !== false} onChange={e => setData({ ...data, actief: e.target.checked })} style={{ cursor: "pointer" }} />
        <label htmlFor="md-actief" style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Actief</label>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="btn-primary" onClick={() => onSave(data)} disabled={!data.foto_url}>Opslaan</button>
        <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
      </div>
    </div>
  );
}