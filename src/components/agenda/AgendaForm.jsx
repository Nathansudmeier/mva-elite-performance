import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG } from "./agendaUtils";

const TYPES = ["Training", "Wedstrijd", "Toernooi", "Evenement"];
const TEAMS = ["MO17", "Dames 1", "Beide"];
const HOME_AWAY = ["Thuis", "Uit", "Neutraal"];

const isWedstrijd = (type) => type === "Wedstrijd" || type === "Toernooi";

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 200;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, { type: "image/jpeg" });
        resolve(compressedFile);
      }, "image/jpeg", 0.85);
    };
    img.src = url;
  });
}

export default function AgendaForm({ item, onSave, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const [form, setForm] = useState({
    type: item?.type || "Training",
    title: item?.title || "",
    date: item?.date || "",
    start_time: item?.start_time || "",
    team: item?.team || "Beide",
    home_away: item?.home_away || "Thuis",
    opponent_logo_url: item?.opponent_logo_url || "",
    notes: item?.notes || "",
    reminder_1_days: item?.reminder_1_days ?? 3,
    reminder_2_days: item?.reminder_2_days ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const compressed = await compressImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
    set("opponent_logo_url", file_url);
    setUploadingLogo(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    if (item?.id) {
      await base44.entities.AgendaItem.update(item.id, form);
    } else {
      await base44.entities.AgendaItem.create(form);
    }
    await onSave();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-full md:max-w-lg glass-dark rounded-t-3xl md:rounded-3xl p-6"
        style={{
          height: "95vh",
          maxHeight: "95vh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
        // Op desktop iets kleiner
        onLoad={(e) => {
          if (window.innerWidth >= 768) {
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.maxHeight = "90vh";
          }
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="t-section-title">{item ? "Activiteit bewerken" : "Nieuwe activiteit"}</h2>
          <button onClick={onClose} className="t-secondary hover:text-white transition-colors text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <p className="t-label mb-2">Type</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => {
                const cfg = TYPE_CONFIG[t];
                const active = form.type === t;
                return (
                  <button key={t} type="button" onClick={() => set("type", t)}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: active ? cfg.bg : "rgba(255,255,255,0.07)",
                      color: active ? cfg.color : "rgba(255,255,255,0.5)",
                      border: `1px solid ${active ? cfg.border : "rgba(255,255,255,0.1)"}`,
                    }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titel */}
          <div>
            <p className="t-label mb-1">Titel</p>
            <input required value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}
              placeholder="Naam van de activiteit" />
          </div>

          {/* Logo tegenstander - alleen voor Wedstrijd/Toernooi */}
          {isWedstrijd(form.type) && (
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                Logo tegenstander (optioneel)
              </p>
              {form.opponent_logo_url ? (
                <div className="flex items-center gap-3">
                  <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                    <img src={form.opponent_logo_url} alt="logo"
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "0.5px solid rgba(255,255,255,0.15)" }} />
                    <button type="button" onClick={() => set("opponent_logo_url", "")}
                      style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#f87171", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 10, fontWeight: 700, lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Logo geüpload</span>
                </div>
              ) : (
                <>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                    style={{ width: "100%", height: 52, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", opacity: uploadingLogo ? 0.6 : 1 }}>
                    <i className="ti ti-upload" style={{ fontSize: 16, color: "rgba(255,255,255,0.55)" }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                      {uploadingLogo ? "Uploaden..." : "Logo uploaden"}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Datum + Tijd */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="t-label mb-1">Datum</p>
              <input required type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", colorScheme: "dark" }} />
            </div>
            <div>
              <p className="t-label mb-1">Aanvangstijd</p>
              <input required type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", colorScheme: "dark" }} />
            </div>
          </div>

          {/* Team */}
          <div>
            <p className="t-label mb-2">Team</p>
            <div className="flex gap-2">
              {TEAMS.map(t => (
                <button key={t} type="button" onClick={() => set("team", t)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: form.team === t ? "rgba(255,140,58,0.2)" : "rgba(255,255,255,0.07)",
                    color: form.team === t ? "#FF8C3A" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${form.team === t ? "rgba(255,140,58,0.4)" : "rgba(255,255,255,0.1)"}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Thuis/Uit - alleen voor Wedstrijd/Toernooi */}
          {isWedstrijd(form.type) && (
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                Locatie
              </p>
              <div className="flex gap-2">
                {HOME_AWAY.map(opt => {
                  const active = form.home_away === opt;
                  return (
                    <button key={opt} type="button" onClick={() => set("home_away", opt)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: active ? "none" : "0.5px solid rgba(255,255,255,0.12)",
                        background: active ? "#FF6B00" : "rgba(255,255,255,0.08)",
                        color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                        transition: "all 0.15s",
                      }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notitie */}
          <div>
            <p className="t-label mb-1">Notitie (optioneel)</p>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}
              placeholder="Extra informatie..." />
          </div>

          {/* Herinneringen */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
            <p className="t-label">🔔 Automatische herinneringen</p>
            <p className="t-tertiary" style={{ fontSize: "11px" }}>Spelers die nog niet hebben gereageerd ontvangen automatisch een e-mail herinnering.</p>
            {[
              { key: "reminder_1_days", label: "Eerste herinnering" },
              { key: "reminder_2_days", label: "Tweede herinnering" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <p className="t-secondary text-sm">{label}</p>
                <select
                  value={form[key]}
                  onChange={e => set(key, Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}
                >
                  <option value={0}>Geen</option>
                  <option value={1}>1 dag van tevoren</option>
                  <option value={2}>2 dagen van tevoren</option>
                  <option value={3}>3 dagen van tevoren</option>
                  <option value={5}>5 dagen van tevoren</option>
                  <option value={7}>7 dagen van tevoren</option>
                </select>
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving} className="btn-primary mt-2">
            {saving ? "Opslaan..." : item ? "Wijzigingen opslaan" : "Activiteit aanmaken"}
          </button>
          <div style={{ height: 80 }} />
        </form>
      </div>
    </div>
  );
}