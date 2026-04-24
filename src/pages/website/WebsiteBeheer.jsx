import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

const TABS = ["Algemeen", "Prestaties", "Routekaart", "Proeftraining aanvragen"];

const FASE_DEFAULTS = {
  fase1: { label: "FASE 1 · NU BEZIG", jaar: "2025-26", items: ["V1 consolideert in 3e klasse", "MO17 handhaaft koploperspositie", "Financiële basis staat", "Naamswijziging naar MV Artemis"] },
  fase2: { label: "FASE 2 · GROEIEN", jaar: "2027-28", items: ["V1 naar 1e klasse of Hoofdklasse", "Eerste gesprekken KNVB licentie", "Speelsters doorgestroomd naar BVO"] },
  fase3: { label: "FASE 3 · DOORBRAAK", jaar: "2029-30", items: ["V1 in de Topklasse", "Licentieaanvraag Tweede Divisie", "Eigen accommodatie gerealiseerd"] },
};

const STATUS_COLORS = {
  nieuw: { bg: "rgba(255,104,0,0.15)", color: "#FF6800" },
  bekeken: { bg: "rgba(255,214,0,0.15)", color: "#cc9900" },
  gecontacteerd: { bg: "rgba(8,208,104,0.15)", color: "#08D068" },
};

const inputCls = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "1.5px solid rgba(26,26,26,0.15)", fontSize: "13px",
  background: "#fff", boxSizing: "border-box",
};

const sectionLabel = {
  fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "1px", color: "rgba(26,26,26,0.45)", marginBottom: "6px",
};

export default function WebsiteBeheer() {
  const { isTrainer } = useCurrentUser();
  const [activeTab, setActiveTab] = useState(0);
  const [instellingen, setInstellingen] = useState(null);
  const [instId, setInstId] = useState(null);
  const [prestaties, setPrestaties] = useState([]);
  const [aanvragen, setAanvragen] = useState([]);
  const [selectedAanvraag, setSelectedAanvraag] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fase1, setFase1] = useState(FASE_DEFAULTS.fase1);
  const [fase2, setFase2] = useState(FASE_DEFAULTS.fase2);
  const [fase3, setFase3] = useState(FASE_DEFAULTS.fase3);
  const [statusFilter, setStatusFilter] = useState("alle");

  useEffect(() => {
    base44.entities.WebsiteInstellingen.list().then(list => {
      if (list && list.length > 0) {
        setInstellingen(list[0]);
        setInstId(list[0].id);
        if (list[0].routekaart_fase1) try { setFase1(JSON.parse(list[0].routekaart_fase1)); } catch {}
        if (list[0].routekaart_fase2) try { setFase2(JSON.parse(list[0].routekaart_fase2)); } catch {}
        if (list[0].routekaart_fase3) try { setFase3(JSON.parse(list[0].routekaart_fase3)); } catch {}
      } else {
        setInstellingen({});
      }
    });
    base44.entities.Prestatie.list().then(p => setPrestaties((p || []).sort((a, b) => a.volgorde - b.volgorde)));
    base44.entities.ProeftrainingAanvraag.list("-datum").then(a => setAanvragen(a || []));
  }, []);

  if (!isTrainer) {
    return (
      <div style={{ padding: "48px 28px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
        <div className="t-page-title">Geen toegang</div>
        <div className="t-secondary">Alleen trainers en admins kunnen de websitebeheer raadplegen.</div>
      </div>
    );
  }

  const saveInstellingen = async (extra = {}) => {
    setSaving(true);
    const data = { ...instellingen, ...extra };
    if (instId) {
      await base44.entities.WebsiteInstellingen.update(instId, data);
    } else {
      const r = await base44.entities.WebsiteInstellingen.create(data);
      setInstId(r.id);
    }
    setSaving(false);
  };

  const saveRoutekaart = async () => {
    await saveInstellingen({
      routekaart_fase1: JSON.stringify(fase1),
      routekaart_fase2: JSON.stringify(fase2),
      routekaart_fase3: JSON.stringify(fase3),
    });
  };

  const addPrestatie = async () => {
    const p = await base44.entities.Prestatie.create({ icon_type: "trophy", kleur: "#FFD600", titel: "Nieuwe prestatie", beschrijving: "", volgorde: prestaties.length + 1 });
    setPrestaties(prev => [...prev, p]);
  };

  const deletePrestatie = async (id) => {
    await base44.entities.Prestatie.delete(id);
    setPrestaties(prev => prev.filter(p => p.id !== id));
  };

  const updatePrestatie = (id, field, val) => setPrestaties(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  const savePrestatie = async (p) => base44.entities.Prestatie.update(p.id, p);

  const updateAanvraagStatus = async (id, status) => {
    await base44.entities.ProeftrainingAanvraag.update(id, { status });
    setAanvragen(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selectedAanvraag?.id === id) setSelectedAanvraag(prev => ({ ...prev, status }));
  };

  const exportCSV = () => {
    const headers = ["datum","naam","email","telefoon","huidig_team","leeftijd","positie","status"];
    const rows = aanvragen.map(a => headers.map(h => `"${(a[h] || "").toString().replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = url; el.download = "aanvragen.csv"; el.click();
  };

  const filteredAanvragen = statusFilter === "alle" ? aanvragen : aanvragen.filter(a => a.status === statusFilter);

  return (
    <div>
      <div className="t-page-title" style={{ marginBottom: "20px" }}>Website Beheer</div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", fontWeight: 700, fontSize: "13px", cursor: "pointer", background: activeTab === i ? "#FF6800" : "#fff", color: activeTab === i ? "#fff" : "#1a1a1a", boxShadow: activeTab === i ? "2px 2px 0 #1a1a1a" : "none" }}>{t}</button>
        ))}
      </div>

      {/* TAB 0: ALGEMEEN */}
      {activeTab === 0 && instellingen !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>
          <div className="glass" style={{ padding: "20px" }}>
            <div className="t-section-title" style={{ marginBottom: "16px" }}>Club logo</div>
            <div style={{ marginBottom: "14px" }}>
              <div style={sectionLabel}>Logo URL</div>
              <input style={inputCls} value={instellingen.logo_url || ""} placeholder="https://..." onChange={e => setInstellingen({ ...instellingen, logo_url: e.target.value })} />
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                <label style={{ cursor: "pointer", padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontSize: "12px", fontWeight: 700, background: "#fff", display: "inline-block" }}>
                  📁 Afbeelding uploaden
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    setInstellingen(prev => ({ ...prev, logo_url: file_url }));
                  }} />
                </label>
                {instellingen.logo_url && <img src={instellingen.logo_url} alt="logo" style={{ height: "48px", objectFit: "contain", background: "#1B2A5E", borderRadius: "6px", padding: "6px" }} />}
              </div>
            </div>
            <button className="btn-primary" onClick={() => saveInstellingen()} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</button>
          </div>

          <div className="glass" style={{ padding: "20px" }}>
            <div className="t-section-title" style={{ marginBottom: "16px" }}>Hero afbeeldingen</div>
            {[["Homepage hero","hero_image_url"],["Selecties hero","selecties_image_url"],["MO17 hero","mo17_image_url"],["MO20 hero","mo20_image_url"],["Vrouwen 1 hero","vrouwen1_image_url"],["De Club hero","declub_image_url"]].map(([label, field]) => (
              <div key={field} style={{ marginBottom: "14px" }}>
                <div style={sectionLabel}>{label}</div>
                <input style={inputCls} value={instellingen[field] || ""} placeholder="https://..." onChange={e => setInstellingen({ ...instellingen, [field]: e.target.value })} />
                {instellingen[field] && <img src={instellingen[field]} alt="" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginTop: "4px" }} />}
              </div>
            ))}
            <button className="btn-primary" onClick={() => saveInstellingen()} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</button>
          </div>

          <div className="glass" style={{ padding: "20px" }}>
            <div className="t-section-title" style={{ marginBottom: "16px" }}>Clubgegevens</div>
            {[["Club email","club_email"],["Club locatie","club_locatie"],["Instagram URL","instagram_url"],["KVK nummer","kvk_nummer"]].map(([label, field]) => (
              <div key={field} style={{ marginBottom: "14px" }}>
                <div style={sectionLabel}>{label}</div>
                <input style={inputCls} value={instellingen[field] || ""} onChange={e => setInstellingen({ ...instellingen, [field]: e.target.value })} />
              </div>
            ))}
            <button className="btn-primary" onClick={() => saveInstellingen()} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</button>
          </div>

          <div className="glass" style={{ padding: "20px" }}>
            <div className="t-section-title" style={{ marginBottom: "16px" }}>Stats balk</div>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <div style={sectionLabel}>Stat {n} waarde</div>
                  <input style={inputCls} value={instellingen[`stat${n}_waarde`] || ""} onChange={e => setInstellingen({ ...instellingen, [`stat${n}_waarde`]: e.target.value })} />
                </div>
                <div>
                  <div style={sectionLabel}>Stat {n} label</div>
                  <input style={inputCls} value={instellingen[`stat${n}_label`] || ""} onChange={e => setInstellingen({ ...instellingen, [`stat${n}_label`]: e.target.value })} />
                </div>
              </div>
            ))}
            <button className="btn-primary" onClick={() => saveInstellingen()} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</button>
          </div>
        </div>
      )}

      {/* TAB 1: PRESTATIES */}
      {activeTab === 1 && (
        <div style={{ maxWidth: "700px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div className="t-section-title">Prestaties (max 4 zichtbaar)</div>
            <button className="btn-secondary" onClick={addPrestatie}>+ Toevoegen</button>
          </div>
          {prestaties.map(p => (
            <div key={p.id} className="glass" style={{ padding: "16px", marginBottom: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <div style={sectionLabel}>Icoon</div>
                  <select style={{ ...inputCls, appearance: "auto" }} value={p.icon_type} onChange={e => updatePrestatie(p.id, "icon_type", e.target.value)}>
                    {["trophy","football","users","arrow-up"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={sectionLabel}>Kleur (hex)</div>
                  <input style={inputCls} value={p.kleur || ""} onChange={e => updatePrestatie(p.id, "kleur", e.target.value)} />
                </div>
                <div>
                  <div style={sectionLabel}>Volgorde</div>
                  <input type="number" style={inputCls} value={p.volgorde || ""} onChange={e => updatePrestatie(p.id, "volgorde", Number(e.target.value))} />
                </div>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <div style={sectionLabel}>Titel</div>
                <input style={inputCls} value={p.titel || ""} onChange={e => updatePrestatie(p.id, "titel", e.target.value)} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={sectionLabel}>Beschrijving</div>
                <input style={inputCls} value={p.beschrijving || ""} onChange={e => updatePrestatie(p.id, "beschrijving", e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-primary" onClick={() => savePrestatie(p)}>Opslaan</button>
                <button onClick={() => deletePrestatie(p.id)} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #FF3DA8", background: "rgba(255,61,168,0.08)", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Verwijder</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ROUTEKAART */}
      {activeTab === 2 && (
        <div style={{ maxWidth: "700px" }}>
          {[{data:fase1, set:setFase1, label:"Fase 1"},{data:fase2, set:setFase2, label:"Fase 2"},{data:fase3, set:setFase3, label:"Fase 3"}].map(({ data, set, label }) => (
            <div key={label} className="glass" style={{ padding: "20px", marginBottom: "16px" }}>
              <div className="t-section-title" style={{ marginBottom: "14px" }}>{label}</div>
              <div style={{ marginBottom: "10px" }}>
                <div style={sectionLabel}>Label</div>
                <input style={inputCls} value={data.label} onChange={e => set(p => ({ ...p, label: e.target.value }))} />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <div style={sectionLabel}>Jaar</div>
                <input style={inputCls} value={data.jaar} onChange={e => set(p => ({ ...p, jaar: e.target.value }))} />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <div style={sectionLabel}>Items (één per regel)</div>
                <textarea style={{ ...inputCls, minHeight: "100px", resize: "vertical" }}
                  value={Array.isArray(data.items) ? data.items.join("\n") : data.items}
                  onChange={e => set(p => ({ ...p, items: e.target.value.split("\n") }))} />
              </div>
            </div>
          ))}
          <button className="btn-primary" onClick={saveRoutekaart} disabled={saving}>{saving ? "Opslaan..." : "Routekaart opslaan"}</button>
        </div>
      )}

      {/* TAB 3: AANVRAGEN */}
      {activeTab === 3 && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["alle","nieuw","bekeken","gecontacteerd"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontWeight: 700, fontSize: "12px", cursor: "pointer", background: statusFilter === s ? "#1a1a1a" : "#fff", color: statusFilter === s ? "#fff" : "#1a1a1a" }}>{s}</button>
              ))}
            </div>
            <button className="btn-secondary" onClick={exportCSV}>↓ CSV exporteren</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: selectedAanvraag ? "1fr 340px" : "1fr", gap: "16px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
                    {["Datum","Naam","Email","Telefoon","Team","Leeftijd","Positie","Status"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAanvragen.map(a => (
                    <tr key={a.id} onClick={() => setSelectedAanvraag(a)} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)", cursor: "pointer", background: selectedAanvraag?.id === a.id ? "rgba(255,104,0,0.05)" : "transparent" }}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{a.datum ? new Date(a.datum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{a.naam}</td>
                      <td style={{ padding: "10px 12px", color: "rgba(26,26,26,0.65)" }}>{a.email}</td>
                      <td style={{ padding: "10px 12px" }}>{a.telefoon}</td>
                      <td style={{ padding: "10px 12px" }}>{a.huidig_team}</td>
                      <td style={{ padding: "10px 12px" }}>{a.leeftijd}</td>
                      <td style={{ padding: "10px 12px" }}>{a.positie}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <select value={a.status || "nieuw"} onClick={e => e.stopPropagation()} onChange={e => updateAanvraagStatus(a.id, e.target.value)}
                          style={{ padding: "3px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer", background: STATUS_COLORS[a.status || "nieuw"]?.bg, color: STATUS_COLORS[a.status || "nieuw"]?.color }}>
                          <option value="nieuw">Nieuw</option>
                          <option value="bekeken">Bekeken</option>
                          <option value="gecontacteerd">Gecontacteerd</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAanvragen.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen aanvragen gevonden.</div>}
            </div>
            {selectedAanvraag && (
              <div className="glass" style={{ padding: "20px", position: "sticky", top: "80px", alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div className="t-card-title">{selectedAanvraag.naam}</div>
                  <button onClick={() => setSelectedAanvraag(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
                </div>
                {[["Email",selectedAanvraag.email],["Telefoon",selectedAanvraag.telefoon],["Huidige club",selectedAanvraag.huidige_club],["Huidig team",selectedAanvraag.huidig_team],["Leeftijd",selectedAanvraag.leeftijd],["Positie",selectedAanvraag.positie],["Datum",selectedAanvraag.datum ? new Date(selectedAanvraag.datum).toLocaleDateString("nl-NL") : "—"]].map(([l,v]) => (
                  <div key={l} style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", marginBottom: "2px" }}>{l}</div>
                    <div style={{ fontSize: "13px" }}>{v}</div>
                  </div>
                ))}
                {selectedAanvraag.bericht && <div style={{ marginTop: "12px", padding: "12px", background: "rgba(26,26,26,0.04)", borderRadius: "8px", fontSize: "13px", lineHeight: 1.5 }}>{selectedAanvraag.bericht}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}