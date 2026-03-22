import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG } from "./agendaUtils";

const TYPES = ["Training", "Wedstrijd", "Toernooi", "Evenement"];
const TEAMS = ["MO17", "Dames 1", "Beide"];

export default function AgendaForm({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    type: item?.type || "Training",
    title: item?.title || "",
    date: item?.date || "",
    start_time: item?.start_time || "",
    location: item?.location || "",
    team: item?.team || "Beide",
    notes: item?.notes || "",
    reminder_1_days: item?.reminder_1_days ?? 3,
    reminder_2_days: item?.reminder_2_days ?? 1,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      <div className="w-full md:max-w-lg glass-dark rounded-t-3xl md:rounded-3xl p-6 modal-scroll-content overflow-y-auto max-h-[90vh]">
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

          {/* Locatie */}
          <div>
            <p className="t-label mb-1">Locatie</p>
            <input value={form.location} onChange={e => set("location", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}
              placeholder="Adres of veldnaam" />
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
        </form>
      </div>
    </div>
  );
}