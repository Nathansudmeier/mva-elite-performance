import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import WysiwygEditor from "@/components/website/WysiwygEditor";
import MensenTab from "@/components/website/beheer/MensenTab";
import NieuwsbriefTab from "@/components/website/beheer/NieuwsbriefTab";
import MatchdayTab from "@/components/website/beheer/MatchdayTab";
import ChatbotTab from "@/components/website/beheer/ChatbotTab";
import DocumentenTab from "@/components/website/beheer/DocumentenTab";
import BackupTab from "@/components/website/beheer/BackupTab";

const WEBSITE_SECTIONS = ["Instellingen", "Hero's", "Nieuws", "Sponsors", "Mensen", "Documenten", "Prestaties", "Routekaart", "Aanvragen"];
const APP_SECTIONS = ["Nieuwsbrief", "Matchday", "Uitgelicht", "Chatbot", "Backup"];
const INSTELLING_SUBTABS = ["Club", "Stats balk", "Logo", "Hero's"];

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
  const [activeCategory, setActiveCategory] = useState('Website');
  const [activeSection, setActiveSection] = useState('Instellingen');
  const [activeSubTab, setActiveSubTab] = useState('Club');
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
  const [berichten, setBerichten] = useState([]);
  const [selectedBericht, setSelectedBericht] = useState(null);
  const [berichtStatusFilter, setBerichtStatusFilter] = useState("alle");
  const [inschrijvingen, setInschrijvingen] = useState([]);
  const [selectedInschrijving, setSelectedInschrijving] = useState(null);
  const [inschrijvingStatusFilter, setInschrijvingStatusFilter] = useState("alle");
  const [sponsors, setSponsors] = useState([]);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [nieuwsberichten, setNieuwsberichten] = useState([]);
  const [editingNieuwsbericht, setEditingNieuwsbericht] = useState(null);
  const [showNieuwsberichtForm, setShowNieuwsberichtForm] = useState(false);
  const [uitgelicht, setUitgelicht] = useState([]);
  const [editingUitgelicht, setEditingUitgelicht] = useState(null);
  const [showUitgelichtForm, setShowUitgelichtForm] = useState(false);

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
    base44.entities.ContactBericht.list("-datum").then(b => setBerichten(b || []));
    base44.entities.Sponsor.list().then(s => setSponsors((s || []).sort((a, b) => a.tier - b.tier || a.volgorde - b.volgorde)));
    base44.entities.Nieuwsbericht.list("-datum").then(n => setNieuwsberichten(n || []));
    base44.entities.UitgelichtWedstrijd.list().then(u => setUitgelicht((u || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0))));
    base44.entities.Inschrijving.list("-datum").then(i => setInschrijvingen(i || []));
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

  const updateBerichtStatus = async (id, status) => {
    await base44.entities.ContactBericht.update(id, { status });
    setBerichten(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selectedBericht?.id === id) setSelectedBericht(prev => ({ ...prev, status }));
  };

  const exportBerichtenCSV = () => {
    const headers = ["datum","naam","email","onderwerp","status"];
    const rows = berichten.map(b => headers.map(h => `"${(b[h] || "").toString().replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = url; el.download = "berichten.csv"; el.click();
  };

  const filteredBerichten = berichtStatusFilter === "alle" ? berichten : berichten.filter(b => b.status === berichtStatusFilter);

  const updateInschrijvingStatus = async (id, status) => {
    await base44.entities.Inschrijving.update(id, { status });
    setInschrijvingen(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selectedInschrijving?.id === id) setSelectedInschrijving(prev => ({ ...prev, status }));
  };

  const exportInschrijvingenCSV = () => {
    const headers = ["datum","naam","adres","woonplaats","geboortedatum","knvb_nummer","bankrekening","huidige_club","huidig_team","gewenst_team","status"];
    const rows = inschrijvingen.map(i => headers.map(h => `"${(i[h] || "").toString().replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = url; el.download = "inschrijvingen.csv"; el.click();
  };

  const filteredInschrijvingen = inschrijvingStatusFilter === "alle" ? inschrijvingen : inschrijvingen.filter(i => i.status === inschrijvingStatusFilter);

  const saveSponsor = async (data) => {
    if (editingSponsor) {
      await base44.entities.Sponsor.update(editingSponsor.id, data);
      setSponsors(prev => prev.map(s => s.id === editingSponsor.id ? { ...s, ...data } : s).sort((a, b) => a.tier - b.tier || a.volgorde - b.volgorde));
    } else {
      const created = await base44.entities.Sponsor.create(data);
      setSponsors(prev => [...prev, created].sort((a, b) => a.tier - b.tier || a.volgorde - b.volgorde));
    }
    setEditingSponsor(null);
    setShowSponsorForm(false);
  };

  const deleteSponsor = async (id) => {
    await base44.entities.Sponsor.delete(id);
    setSponsors(prev => prev.filter(s => s.id !== id));
  };

  const toggleSponsorActief = async (id, actief) => {
    await base44.entities.Sponsor.update(id, { actief: !actief });
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, actief: !s.actief } : s));
  };

  const saveUitgelicht = async (data) => {
    const { id, created_date, updated_date, created_by, created_by_id, ...payload } = data;
    try {
      if (editingUitgelicht) {
        await base44.entities.UitgelichtWedstrijd.update(editingUitgelicht.id, payload);
        setUitgelicht(prev => prev.map(u => u.id === editingUitgelicht.id ? { ...u, ...payload } : u).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
      } else {
        const created = await base44.entities.UitgelichtWedstrijd.create(payload);
        setUitgelicht(prev => [...prev, created].sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
      }
      setEditingUitgelicht(null);
      setShowUitgelichtForm(false);
    } catch (err) {
      console.error("[UitgelichtWedstrijd save error]", err, "payload:", payload);
      alert("Opslaan mislukt: " + (err?.message || "onbekende fout") + "\n\nCheck de console voor details.");
    }
  };

  const deleteUitgelicht = async (id) => {
    await base44.entities.UitgelichtWedstrijd.delete(id);
    setUitgelicht(prev => prev.filter(u => u.id !== id));
  };

  const toggleUitgelichtActief = async (id, actief) => {
    await base44.entities.UitgelichtWedstrijd.update(id, { actief: !actief });
    setUitgelicht(prev => prev.map(u => u.id === id ? { ...u, actief: !u.actief } : u));
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSection(cat === 'Website' ? WEBSITE_SECTIONS[0] : APP_SECTIONS[0]);
    setActiveSubTab('Club');
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setActiveSubTab('Club');
  };

  const currentSections = activeCategory === 'Website' ? WEBSITE_SECTIONS : APP_SECTIONS;

  const TabRow = ({ tabs, active, onSelect, fontSize = 14, bg = "transparent" }) => (
    <div style={{ display: "flex", gap: 0, background: bg, overflowX: "auto" }}>
      {tabs.map(tab => (
        <button key={tab} onClick={() => onSelect(tab)} style={{
          padding: `8px 14px`, fontSize, fontWeight: active === tab ? 500 : 400,
          color: active === tab ? "#FF6800" : "rgba(26,26,26,0.50)",
          borderBottom: `2.5px solid ${active === tab ? "#FF6800" : "transparent"}`,
          background: "none", border: "none",
          borderBottom: `2.5px solid ${active === tab ? "#FF6800" : "transparent"}`,
          cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s",
        }}>{tab}</button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Paginatitel */}
      <div style={{ marginBottom: "0" }}>
        <div className="t-page-title" style={{ marginBottom: "12px" }}>Website Beheer</div>

        {/* Rij 1: Categorietabs */}
        <div style={{ borderBottom: "2px solid rgba(26,26,26,0.10)" }}>
          <TabRow tabs={["Website", "App"]} active={activeCategory} onSelect={handleCategoryChange} fontSize={14} />
        </div>

        {/* Rij 2: Sectietabs */}
        <div style={{ borderBottom: "1.5px solid rgba(26,26,26,0.08)", background: "#F8F8F8" }}>
          <TabRow tabs={currentSections} active={activeSection} onSelect={handleSectionChange} fontSize={12} bg="#F8F8F8" />
        </div>

        {/* Rij 3: Subtabs (alleen bij Instellingen) */}
        {activeSection === "Instellingen" && (
          <div style={{ borderBottom: "1px solid rgba(26,26,26,0.07)", background: "#F2F2F2" }}>
            <TabRow tabs={INSTELLING_SUBTABS} active={activeSubTab} onSelect={setActiveSubTab} fontSize={11} bg="#F2F2F2" />
          </div>
        )}
      </div>

      {/* Content body */}
      <div style={{ padding: "24px 0" }}>

      {/* INSTELLINGEN */}
      {activeSection === "Instellingen" && instellingen !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>

          {/* Club subtab */}
          {activeSubTab === "Club" && (
            <div className="glass" style={{ padding: "20px" }}>
              <div className="t-section-title" style={{ marginBottom: "16px" }}>Clubgegevens</div>
              {[["Club email","club_email"],["Club locatie","club_locatie"],["Instagram URL","instagram_url"],["TikTok URL","tiktok_url"],["Facebook URL","facebook_url"],["KVK nummer","kvk_nummer"]].map(([label, field]) => (
                <div key={field} style={{ marginBottom: "14px" }}>
                  <div style={sectionLabel}>{label}</div>
                  <input style={inputCls} value={instellingen[field] || ""} onChange={e => setInstellingen({ ...instellingen, [field]: e.target.value })} />
                </div>
              ))}
              <button className="btn-primary" onClick={() => saveInstellingen()} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</button>
            </div>
          )}

          {/* Stats balk subtab */}
          {activeSubTab === "Stats balk" && (
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
          )}

          {/* Logo subtab */}
          {activeSubTab === "Logo" && (
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
          )}

          {/* Hero's subtab */}
          {activeSubTab === "Hero's" && (
            <div className="glass" style={{ padding: "20px" }}>
              <div className="t-section-title" style={{ marginBottom: "16px" }}>Hero afbeeldingen</div>
              {[["Homepage hero","hero_image_url"],["Selecties hero","selecties_image_url"],["MO17 hero","mo17_image_url"],["MO20 hero","mo20_image_url"],["Vrouwen 1 hero","vrouwen1_image_url"],["De Club hero","declub_image_url"],["Wedstrijden hero","wedstrijden_image_url"],["Contact hero","contact_image_url"],["Ledeninformatie hero","leden_image_url"]].map(([label, field]) => (
                <div key={field} style={{ marginBottom: "14px" }}>
                  <div style={sectionLabel}>{label}</div>
                  <input style={inputCls} value={instellingen[field] || ""} placeholder="https://..." onChange={e => setInstellingen({ ...instellingen, [field]: e.target.value })} />
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <label style={{ cursor: "pointer", padding: "5px 12px", borderRadius: "7px", border: "1.5px solid #1a1a1a", fontSize: "11px", fontWeight: 700, background: "#fff", display: "inline-block" }}>
                      📁 Uploaden
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        setInstellingen(prev => ({ ...prev, [field]: file_url }));
                      }} />
                    </label>
                  </div>
                  {instellingen[field] && <img src={instellingen[field]} alt="" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginTop: "4px" }} />}
                </div>
              ))}
              <button className="btn-primary" onClick={() => saveInstellingen()} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</button>
            </div>
          )}
        </div>
      )}

      {/* HERO'S (sidebar item) — leidt naar Hero's subtab van Instellingen, hier apart als alias */}
      {activeSection === "Hero's" && instellingen !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>
          <div className="glass" style={{ padding: "20px" }}>
            <div className="t-section-title" style={{ marginBottom: "16px" }}>Hero afbeeldingen</div>
            {[["Homepage hero","hero_image_url"],["Selecties hero","selecties_image_url"],["MO17 hero","mo17_image_url"],["MO20 hero","mo20_image_url"],["Vrouwen 1 hero","vrouwen1_image_url"],["De Club hero","declub_image_url"],["Wedstrijden hero","wedstrijden_image_url"],["Contact hero","contact_image_url"],["Ledeninformatie hero","leden_image_url"]].map(([label, field]) => (
              <div key={field} style={{ marginBottom: "14px" }}>
                <div style={sectionLabel}>{label}</div>
                <input style={inputCls} value={instellingen[field] || ""} placeholder="https://..." onChange={e => setInstellingen({ ...instellingen, [field]: e.target.value })} />
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ cursor: "pointer", padding: "5px 12px", borderRadius: "7px", border: "1.5px solid #1a1a1a", fontSize: "11px", fontWeight: 700, background: "#fff", display: "inline-block" }}>
                    📁 Uploaden
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      setInstellingen(prev => ({ ...prev, [field]: file_url }));
                    }} />
                  </label>
                </div>
                {instellingen[field] && <img src={instellingen[field]} alt="" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginTop: "4px" }} />}
              </div>
            ))}
            <button className="btn-primary" onClick={() => saveInstellingen()} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</button>
          </div>
        </div>
      )}

      {/* PRESTATIES */}
      {activeSection === "Prestaties" && (
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

      {/* ROUTEKAART */}
      {activeSection === "Routekaart" && (
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

      {/* NIEUWS */}
      {activeSection === "Nieuws" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div className="t-section-title">Nieuwsberichten</div>
            <button className="btn-primary" onClick={() => { setEditingNieuwsbericht(null); setShowNieuwsberichtForm(true); }} style={{ width: "auto" }}>+ Nieuw bericht</button>
          </div>

          {showNieuwsberichtForm && (
            <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
              <BerichtForm bericht={editingNieuwsbericht} onSave={async (data) => {
                if (editingNieuwsbericht) {
                  await base44.entities.Nieuwsbericht.update(editingNieuwsbericht.id, data);
                  setNieuwsberichten(prev => prev.map(b => b.id === editingNieuwsbericht.id ? { ...b, ...data } : b).sort((a, b) => new Date(b.datum) - new Date(a.datum)));
                } else {
                  const created = await base44.entities.Nieuwsbericht.create(data);
                  setNieuwsberichten(prev => [...prev, created].sort((a, b) => new Date(b.datum) - new Date(a.datum)));
                }
                setEditingNieuwsbericht(null);
                setShowNieuwsberichtForm(false);
              }} onCancel={() => { setShowNieuwsberichtForm(false); setEditingNieuwsbericht(null); }} />
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
                  {["Datum","Titel","Categorie","Team","Gepubliceerd","Acties"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nieuwsberichten.map(b => (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{b.datum ? new Date(b.datum).toLocaleDateString("nl-NL") : "—"}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{b.titel}</td>
                    <td style={{ padding: "10px 12px", fontSize: "12px" }}>{b.categorie}</td>
                    <td style={{ padding: "10px 12px" }}>{b.team}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <input type="checkbox" checked={b.gepubliceerd || false} onChange={async () => {
                        await base44.entities.Nieuwsbericht.update(b.id, { gepubliceerd: !b.gepubliceerd });
                        setNieuwsberichten(prev => prev.map(x => x.id === b.id ? { ...x, gepubliceerd: !x.gepubliceerd } : x));
                      }} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                      <button onClick={() => { setEditingNieuwsbericht(b); setShowNieuwsberichtForm(true); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF6800", background: "transparent", color: "#FF6800", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Bewerk</button>
                      <button onClick={() => { if (confirm("Verwijderen?")) base44.entities.Nieuwsbericht.delete(b.id).then(() => setNieuwsberichten(prev => prev.filter(x => x.id !== b.id))); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Verwijder</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nieuwsberichten.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen berichten</div>}
          </div>
        </div>
      )}

      {/* AANVRAGEN */}
      {activeSection === "Aanvragen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Proeftraining aanvragen */}
          <div>
          <div className="t-section-title" style={{ marginBottom: "14px" }}>Proeftraining aanvragen</div>
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

          {/* Inschrijvingen */}
          <div>
          <div className="t-section-title" style={{ marginBottom: "14px" }}>Inschrijvingen ({inschrijvingen.length})</div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["alle","nieuw","bekeken","verwerkt"].map(s => (
                <button key={s} onClick={() => setInschrijvingStatusFilter(s)} style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontWeight: 700, fontSize: "12px", cursor: "pointer", background: inschrijvingStatusFilter === s ? "#1a1a1a" : "#fff", color: inschrijvingStatusFilter === s ? "#fff" : "#1a1a1a" }}>{s}</button>
              ))}
            </div>
            <button className="btn-secondary" onClick={exportInschrijvingenCSV}>↓ CSV exporteren</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: selectedInschrijving ? "1fr 340px" : "1fr", gap: "16px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
                    {["Datum","Naam","Geboortedatum","Gewenst team","Status"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInschrijvingen.map(i => (
                    <tr key={i.id} onClick={() => setSelectedInschrijving(i)} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)", cursor: "pointer", background: selectedInschrijving?.id === i.id ? "rgba(255,104,0,0.05)" : "transparent" }}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{i.datum ? new Date(i.datum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{i.naam}</td>
                      <td style={{ padding: "10px 12px" }}>{i.geboortedatum ? new Date(i.geboortedatum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{i.gewenst_team}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <select value={i.status || "nieuw"} onClick={e => e.stopPropagation()} onChange={e => updateInschrijvingStatus(i.id, e.target.value)}
                          style={{ padding: "3px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer", background: STATUS_COLORS[i.status || "nieuw"]?.bg || "rgba(255,104,0,0.15)", color: STATUS_COLORS[i.status || "nieuw"]?.color || "#FF6800" }}>
                          <option value="nieuw">Nieuw</option>
                          <option value="bekeken">Bekeken</option>
                          <option value="verwerkt">Verwerkt</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInschrijvingen.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen inschrijvingen gevonden.</div>}
            </div>
            {selectedInschrijving && (
              <div className="glass" style={{ padding: "20px", position: "sticky", top: "80px", alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div className="t-card-title">{selectedInschrijving.naam}</div>
                  <button onClick={() => setSelectedInschrijving(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
                </div>
                {[
                  ["Geboortedatum", selectedInschrijving.geboortedatum ? new Date(selectedInschrijving.geboortedatum).toLocaleDateString("nl-NL") : "—"],
                  ["Adres", selectedInschrijving.adres],
                  ["Woonplaats", selectedInschrijving.woonplaats],
                  ["KNVB nr.", selectedInschrijving.knvb_nummer || "—"],
                  ["Bankrekening", selectedInschrijving.bankrekening],
                  ["Huidige club", selectedInschrijving.huidige_club],
                  ["Huidig team", selectedInschrijving.huidig_team],
                  ["Gewenst team", selectedInschrijving.gewenst_team],
                  ["Datum", selectedInschrijving.datum ? new Date(selectedInschrijving.datum).toLocaleDateString("nl-NL") : "—"],
                ].map(([l,v]) => (
                  <div key={l} style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", marginBottom: "2px" }}>{l}</div>
                    <div style={{ fontSize: "13px" }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

          {/* Contactberichten */}
          <div>
          <div className="t-section-title" style={{ marginBottom: "14px" }}>Contactberichten</div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["alle","nieuw","gelezen","beantwoord"].map(s => (
                <button key={s} onClick={() => setBerichtStatusFilter(s)} style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontWeight: 700, fontSize: "12px", cursor: "pointer", background: berichtStatusFilter === s ? "#1a1a1a" : "#fff", color: berichtStatusFilter === s ? "#fff" : "#1a1a1a" }}>{s}</button>
              ))}
            </div>
            <button className="btn-secondary" onClick={exportBerichtenCSV}>↓ CSV exporteren</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: selectedBericht ? "1fr 340px" : "1fr", gap: "16px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
                    {["Datum","Naam","Email","Onderwerp","Status"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBerichten.map(b => (
                    <tr key={b.id} onClick={() => setSelectedBericht(b)} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)", cursor: "pointer", background: selectedBericht?.id === b.id ? "rgba(255,104,0,0.05)" : "transparent" }}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{b.datum ? new Date(b.datum).toLocaleDateString("nl-NL") : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{b.naam}</td>
                      <td style={{ padding: "10px 12px", color: "rgba(26,26,26,0.65)" }}>{b.email}</td>
                      <td style={{ padding: "10px 12px" }}>{b.onderwerp}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <select value={b.status || "nieuw"} onClick={e => e.stopPropagation()} onChange={e => updateBerichtStatus(b.id, e.target.value)}
                          style={{ padding: "3px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer", background: STATUS_COLORS[b.status || "nieuw"]?.bg, color: STATUS_COLORS[b.status || "nieuw"]?.color }}>
                          <option value="nieuw">Nieuw</option>
                          <option value="gelezen">Gelezen</option>
                          <option value="beantwoord">Beantwoord</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBerichten.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen berichten gevonden.</div>}
            </div>
            {selectedBericht && (
              <div className="glass" style={{ padding: "20px", position: "sticky", top: "80px", alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div className="t-card-title">{selectedBericht.naam}</div>
                  <button onClick={() => setSelectedBericht(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
                </div>
                {[["Email",selectedBericht.email],["Onderwerp",selectedBericht.onderwerp],["Datum",selectedBericht.datum ? new Date(selectedBericht.datum).toLocaleDateString("nl-NL") : "—"]].map(([l,v]) => (
                  <div key={l} style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", marginBottom: "2px" }}>{l}</div>
                    <div style={{ fontSize: "13px" }}>{v}</div>
                  </div>
                ))}
                {selectedBericht.bericht && <div style={{ marginTop: "12px", padding: "12px", background: "rgba(26,26,26,0.04)", borderRadius: "8px", fontSize: "13px", lineHeight: 1.5 }}>{selectedBericht.bericht}</div>}
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* MENSEN */}
      {activeSection === "Mensen" && <MensenTab />}

      {/* NIEUWSBRIEF */}
      {activeSection === "Nieuwsbrief" && <NieuwsbriefTab />}

      {/* MATCHDAY */}
      {activeSection === "Matchday" && <MatchdayTab />}

      {/* CHATBOT */}
      {activeSection === "Chatbot" && <ChatbotTab />}

      {/* DOCUMENTEN */}
      {activeSection === "Documenten" && <DocumentenTab />}

      {/* BACKUP */}
      {activeSection === "Backup" && <BackupTab />}

      {/* UITGELICHT */}
      {activeSection === "Uitgelicht" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div className="t-section-title">Uitgelichte wedstrijden</div>
            <button className="btn-primary" onClick={() => { setEditingUitgelicht(null); setShowUitgelichtForm(true); }} style={{ width: "auto" }}>+ Nieuwe wedstrijd</button>
          </div>

          <div style={{ background: "rgba(255,104,0,0.08)", border: "1px solid rgba(255,104,0,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "rgba(26,26,26,0.7)" }}>
            Voeg maximaal 3 uitgelichte wedstrijden toe. Verlopen wedstrijden (datum in verleden) worden automatisch verborgen.
          </div>

          {showUitgelichtForm && (
            <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
              <UitgelichtForm wedstrijd={editingUitgelicht} onSave={saveUitgelicht} onCancel={() => { setShowUitgelichtForm(false); setEditingUitgelicht(null); }} />
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
                  {["Volgorde","Titel","Team","Datum","Actief","Acties"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uitgelicht.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}>
                    <td style={{ padding: "10px 12px" }}>{u.volgorde}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{u.titel}</td>
                    <td style={{ padding: "10px 12px", fontSize: "12px" }}>{u.team}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{u.datum ? new Date(u.datum).toLocaleDateString("nl-NL") : "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <input type="checkbox" checked={u.actief !== false} onChange={() => toggleUitgelichtActief(u.id, u.actief !== false)} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                      <button onClick={() => { setEditingUitgelicht(u); setShowUitgelichtForm(true); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF6800", background: "transparent", color: "#FF6800", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Bewerk</button>
                      <button onClick={() => { if (confirm("Verwijderen?")) deleteUitgelicht(u.id); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Verwijder</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {uitgelicht.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen uitgelichte wedstrijden</div>}
          </div>
        </div>
      )}

      {/* SPONSORS */}
      {activeSection === "Sponsors" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div className="t-section-title">Sponsors beheren</div>
            <button className="btn-primary" onClick={() => { setEditingSponsor(null); setShowSponsorForm(true); }} style={{ width: "auto" }}>+ Nieuwe sponsor</button>
          </div>

          {showSponsorForm && (
            <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
              <SponsorForm sponsor={editingSponsor} onSave={saveSponsor} onCancel={() => { setShowSponsorForm(false); setEditingSponsor(null); }} />
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(26,26,26,0.12)" }}>
                  {["Volgorde","Naam","Categorie","Tier","Actief","Acties"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sponsors.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}>
                    <td style={{ padding: "10px 12px" }}>{s.volgorde}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{s.naam}</td>
                    <td style={{ padding: "10px 12px", fontSize: "12px" }}>{s.categorie}</td>
                    <td style={{ padding: "10px 12px" }}>{s.tier}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <input type="checkbox" checked={s.actief} onChange={() => toggleSponsorActief(s.id, s.actief)} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                      <button onClick={() => { setEditingSponsor(s); setShowSponsorForm(true); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF6800", background: "transparent", color: "#FF6800", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Bewerk</button>
                      <button onClick={() => { if (confirm("Verwijderen?")) deleteSponsor(s.id); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #FF3DA8", background: "transparent", color: "#FF3DA8", fontWeight: 700, cursor: "pointer", fontSize: "11px" }}>Verwijder</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sponsors.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "rgba(26,26,26,0.35)", fontSize: "13px" }}>Geen sponsors</div>}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

function BerichtForm({ bericht, onSave, onCancel }) {
  const [data, setData] = useState(bericht || {
    titel: "",
    slug: "",
    samenvatting: "",
    inhoud: "",
    afbeelding_url: "",
    categorie: "Clubnieuws",
    team: "Alle",
    datum: new Date().toISOString().split("T")[0],
    auteur: "",
    gepubliceerd: true
  });

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleTitleChange = (val) => {
    setData({ ...data, titel: val, slug: generateSlug(val) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <div style={sectionLabel}>Titel *</div>
        <input style={inputCls} value={data.titel} onChange={e => handleTitleChange(e.target.value)} placeholder="Titel van het bericht" />
      </div>
      <div>
        <div style={sectionLabel}>Slug (auto-gegenereerd)</div>
        <input style={inputCls} value={data.slug} onChange={e => setData({ ...data, slug: e.target.value })} placeholder="artikel-slug" />
      </div>
      <div>
        <div style={sectionLabel}>Afbeelding</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <label style={{ cursor: "pointer", padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontSize: "12px", fontWeight: 700, background: "#fff", display: "inline-block", flexShrink: 0 }}>
            📁 Afbeelding uploaden
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              const res = await base44.functions.invoke('cloudinaryUpload', {});
              const { cloudName, uploadPreset } = res.data;
              const formData = new FormData();
              formData.append("file", file);
              formData.append("upload_preset", uploadPreset);
              const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
              const json = await r.json();
              setData(prev => ({ ...prev, afbeelding_url: json.secure_url }));
            }} />
          </label>
          <input style={{ ...inputCls, flex: 1 }} value={data.afbeelding_url || ""} onChange={e => setData({ ...data, afbeelding_url: e.target.value })} placeholder="of plak een URL..." />
        </div>
        {data.afbeelding_url && <img src={data.afbeelding_url} alt="preview" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px", marginTop: "4px" }} />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Categorie *</div>
          <select style={{ ...inputCls, appearance: "auto" }} value={data.categorie} onChange={e => setData({ ...data, categorie: e.target.value })}>
            {["Wedstrijdverslag", "Clubnieuws", "Selectie-update", "Resultaten"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={sectionLabel}>Team</div>
          <select style={{ ...inputCls, appearance: "auto" }} value={data.team} onChange={e => setData({ ...data, team: e.target.value })}>
            {["Alle", "MO17", "MO20", "Vrouwen 1"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Datum</div>
          <input type="date" style={inputCls} value={data.datum} onChange={e => setData({ ...data, datum: e.target.value })} />
        </div>
        <div>
          <div style={sectionLabel}>Auteur</div>
          <input style={inputCls} value={data.auteur || ""} onChange={e => setData({ ...data, auteur: e.target.value })} placeholder="Naam auteur" />
        </div>
      </div>
      <div>
        <div style={{ ...sectionLabel, display: "flex", justifyContent: "space-between" }}>Samenvatting <span>{(data.samenvatting || "").length}/160</span></div>
        <textarea style={{ ...inputCls, minHeight: "60px", resize: "vertical" }} value={data.samenvatting || ""} onChange={e => setData({ ...data, samenvatting: e.target.value.slice(0, 160) })} placeholder="Korte samenvatting" />
      </div>
      <div>
        <div style={sectionLabel}>Inhoud</div>
        <WysiwygEditor
          value={data.inhoud}
          onChange={(html) => setData({ ...data, inhoud: html })}
          placeholder="Schrijf hier je artikel..."
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="checkbox" id="gepubliceerd-check" checked={data.gepubliceerd} onChange={e => setData({ ...data, gepubliceerd: e.target.checked })} style={{ cursor: "pointer" }} />
        <label htmlFor="gepubliceerd-check" style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Gepubliceerd</label>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="btn-primary" onClick={() => onSave(data)}>Opslaan</button>
        <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
      </div>
    </div>
  );
}

function UitgelichtForm({ wedstrijd, onSave, onCancel }) {
  const [data, setData] = useState(wedstrijd || {
    titel: "",
    subtitel: "",
    team: "Vrouwen 1",
    datum: new Date().toISOString().split("T")[0],
    tijdstip: "",
    locatie: "",
    tegenstander: "",
    tegenstander_logo_url: "",
    achtergrond_url: "",
    matchday_poster_url: "",
    actief: true,
    volgorde: 1,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Titel *</div>
          <input style={inputCls} value={data.titel} onChange={e => setData({ ...data, titel: e.target.value })} placeholder="De Topper" />
        </div>
        <div>
          <div style={sectionLabel}>Subtitel</div>
          <input style={inputCls} value={data.subtitel || ""} onChange={e => setData({ ...data, subtitel: e.target.value })} placeholder="Korte omschrijving" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Team *</div>
          <select style={{ ...inputCls, appearance: "auto" }} value={data.team} onChange={e => setData({ ...data, team: e.target.value })}>
            {["MO15", "MO17", "MO20", "Vrouwen 1"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={sectionLabel}>Datum *</div>
          <input type="date" style={inputCls} value={data.datum} onChange={e => setData({ ...data, datum: e.target.value })} />
        </div>
        <div>
          <div style={sectionLabel}>Tijdstip *</div>
          <input style={inputCls} value={data.tijdstip} onChange={e => setData({ ...data, tijdstip: e.target.value })} placeholder="20:00 uur" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <div style={sectionLabel}>Locatie *</div>
          <input style={inputCls} value={data.locatie} onChange={e => setData({ ...data, locatie: e.target.value })} placeholder="Sportpark De Bosk, Harkema" />
        </div>
        <div>
          <div style={sectionLabel}>Tegenstander *</div>
          <input style={inputCls} value={data.tegenstander} onChange={e => setData({ ...data, tegenstander: e.target.value })} placeholder="Harkemase Boys" />
        </div>
      </div>
      <div>
        <div style={sectionLabel}>Tegenstander logo URL</div>
        <input style={inputCls} value={data.tegenstander_logo_url || ""} onChange={e => setData({ ...data, tegenstander_logo_url: e.target.value })} placeholder="https://..." />
        {data.tegenstander_logo_url && <img src={data.tegenstander_logo_url} alt="logo preview" style={{ height: "60px", objectFit: "contain", marginTop: "8px", background: "#1B2A5E", borderRadius: "6px", padding: "8px" }} />}
      </div>
      <div>
        <div style={sectionLabel}>Achtergrond URL</div>
        <input style={inputCls} value={data.achtergrond_url || ""} onChange={e => setData({ ...data, achtergrond_url: e.target.value })} placeholder="https://..." />
        <div style={{ fontSize: "11px", color: "rgba(26,26,26,0.5)", marginTop: "4px" }}>Tip: gebruik een speelsterfoto voor maximaal effect.</div>
        {data.achtergrond_url && <img src={data.achtergrond_url} alt="achtergrond preview" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "6px", marginTop: "8px" }} />}
      </div>
      <div>
        <div style={sectionLabel}>Matchday poster URL</div>
        <input style={inputCls} value={data.matchday_poster_url || ""} onChange={e => setData({ ...data, matchday_poster_url: e.target.value })} placeholder="https://..." />
        <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ cursor: "pointer", padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #1a1a1a", fontSize: "12px", fontWeight: 700, background: "#fff", display: "inline-block" }}>
            📁 Poster uploaden
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              const { file_url } = await base44.integrations.Core.UploadFile({ file });
              setData(prev => ({ ...prev, matchday_poster_url: file_url }));
            }} />
          </label>
        </div>
        <div style={{ fontSize: "11px", color: "rgba(26,26,26,0.5)", marginTop: "6px" }}>Optioneel. Wanneer ingevuld, wordt deze poster getoond in plaats van de standaard layout. Aanbevolen: portret-formaat (4:5).</div>
        {data.matchday_poster_url && <img src={data.matchday_poster_url} alt="poster preview" style={{ maxWidth: "240px", borderRadius: "6px", marginTop: "8px", display: "block" }} />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "center" }}>
        <div>
          <div style={sectionLabel}>Volgorde</div>
          <input type="number" style={inputCls} value={data.volgorde} onChange={e => setData({ ...data, volgorde: Number(e.target.value) })} min="1" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
          <input type="checkbox" id="uitgelicht-actief" checked={data.actief !== false} onChange={e => setData({ ...data, actief: e.target.checked })} style={{ cursor: "pointer" }} />
          <label htmlFor="uitgelicht-actief" style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Actief</label>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" className="btn-primary" onClick={(e) => { e.preventDefault(); console.log("[Uitgelicht] Opslaan clicked", data); onSave(data); }}>Opslaan</button>
        <button type="button" onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
      </div>
    </div>
  );
}

function SponsorForm({ sponsor, onSave, onCancel }) {
  const [data, setData] = useState(sponsor || { naam: "", logo_url: "", website_url: "", categorie: "", tier: 2, volgorde: 1, actief: true });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <div style={sectionLabel}>Naam *</div>
          <input style={inputCls} value={data.naam} onChange={e => setData({ ...data, naam: e.target.value })} placeholder="Bedrijfsnaam" />
        </div>
        <div>
          <div style={sectionLabel}>Logo URL</div>
          <input style={inputCls} value={data.logo_url || ""} onChange={e => setData({ ...data, logo_url: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <div style={sectionLabel}>Website URL</div>
          <input style={inputCls} value={data.website_url || ""} onChange={e => setData({ ...data, website_url: e.target.value })} placeholder="https://..." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <div style={sectionLabel}>Categorie *</div>
            <select style={{ ...inputCls, appearance: "auto" }} value={data.categorie} onChange={e => setData({ ...data, categorie: e.target.value })}>
              <option value="">Selecteer</option>
              {["Shirt partner","Stadium partner","Official partner","Academy partner","Training partner","Clubsponsor","Supporter"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={sectionLabel}>Tier *</div>
            <select style={{ ...inputCls, appearance: "auto" }} value={data.tier} onChange={e => setData({ ...data, tier: Number(e.target.value) })}>
              <option value={1}>1 - Hoofdsponsor</option>
              <option value={2}>2 - Clubsponsor</option>
              <option value={3}>3 - Supporter</option>
            </select>
          </div>
        </div>
        <div>
          <div style={sectionLabel}>Volgorde</div>
          <input type="number" style={inputCls} value={data.volgorde} onChange={e => setData({ ...data, volgorde: Number(e.target.value) })} min="1" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="checkbox" id="actief-check" checked={data.actief} onChange={e => setData({ ...data, actief: e.target.checked })} style={{ cursor: "pointer" }} />
          <label htmlFor="actief-check" style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Actief</label>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button className="btn-primary" onClick={() => onSave(data)}>Opslaan</button>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
        </div>
      </div>
      {data.logo_url && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", background: "#1B2A5E", borderRadius: "8px", padding: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(26,26,26,0.45)", marginBottom: "8px" }}>Preview</div>
          <img src={data.logo_url} alt="preview" style={{ maxHeight: "80px", maxWidth: "180px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        </div>
      )}
    </div>
  );
}