import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG } from "./agendaUtils";

const TYPES = ["Training", "Wedstrijd", "Toernooi", "Evenement"];
const TEAMS = ["MO17", "Dames 1", "Beide"];
const HOME_AWAY = ["Thuis", "Uit", "Neutraal"];

const isWedstrijd = (type) => type === "Wedstrijd" || type === "Toernooi";

// Team-kleuren voor toggles
const TEAM_COLORS = { "MO17": "#00C2FF", "Dames 1": "#FF3DA8", "Beide": "#FF6800" };
const TYPE_COLORS = { "Training": "#08D068", "Wedstrijd": "#00C2FF", "Toernooi": "#FFD600", "Evenement": "#9B5CFF" };

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
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", 0.85);
    };
    img.src = url;
  });
}

// Bento Bold input style
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "#ffffff",
  border: "2px solid #1a1a1a",
  borderRadius: 12,
  fontSize: 14,
  color: "#1a1a1a",
  outline: "none",
  fontWeight: 500,
  boxSizing: "border-box",
};

export default function AgendaForm({ item, onSave, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const [form, setForm] = useState({
    type: item?.type || "Training",
    title: item?.title || "",
    date: item?.date || "",
    end_date: item?.end_date || "",
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

  // Herhaling state
  const [repeat, setRepeat] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState("");

  // Bereken welke weekdag de gekozen datum heeft
  const selectedDayOfWeek = form.date ? new Date(form.date + "T00:00:00").getDay() : null;
  const DAY_NAMES = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
  const DAY_NAMES_FULL = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

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

  async function ensureMatchRecord(agendaItemId, formData) {
    if (!isWedstrijd(formData.type)) return;
    const teams = formData.team === "Beide" ? ["MO17", "Dames 1"] : [formData.team];
    for (const team of teams) {
      const match = await base44.entities.Match.create({
        opponent: formData.title,
        date: formData.date,
        start_time: formData.start_time,
        home_away: formData.home_away === "Neutraal" ? "Thuis" : formData.home_away,
        team,
      });
      await base44.entities.AgendaItem.update(agendaItemId, { match_id: match.id });
    }
  }

  async function sendActivityNotifications(agendaItemId, formData) {
    const [allUsers, allPlayers] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.Player.filter({ active: true }),
    ]);
    const emails = allUsers
      .filter(u => allPlayers.some(p => p.id === u.player_id || p.name === u.full_name))
      .map(u => u.email)
      .filter(Boolean);
    const uniqueEmails = [...new Set(emails)];
    await Promise.all(uniqueEmails.map(email =>
      base44.entities.Notification.create({
        user_email: email,
        type: "activiteit",
        title: `${formData.type}: ${formData.title}`,
        body: `op ${formData.date} om ${formData.start_time}`,
        is_read: false,
        link: `/Planning?id=${agendaItemId}`,
      })
    ));
  }

  function generateRepeatDates(startDate, untilDate) {
    const dates = [];
    const start = new Date(startDate + "T00:00:00");
    const until = new Date(untilDate + "T00:00:00");
    const dayOfWeek = start.getDay();
    const current = new Date(start);
    current.setDate(current.getDate() + 7); // begin met de week erna
    while (current <= until) {
      if (current.getDay() === dayOfWeek) {
        dates.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 7);
    }
    return dates;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    if (item?.id) {
      await base44.entities.AgendaItem.update(item.id, form);
      if (isWedstrijd(form.type) && !item.match_id) {
        await ensureMatchRecord(item.id, form);
      }
    } else {
      // Maak eerste (of enige) item aan
      const created = await base44.entities.AgendaItem.create(form);
      if (isWedstrijd(form.type)) {
        await ensureMatchRecord(created.id, form);
      }
      await sendActivityNotifications(created.id, form).catch(() => {});

      // Herhaling: maak extra items aan voor elke volgende datum
      if (repeat && repeatUntil && form.type === "Training") {
        const extraDates = generateRepeatDates(form.date, repeatUntil);
        for (const date of extraDates) {
          await base44.entities.AgendaItem.create({ ...form, date });
        }
      }
    }
    await onSave();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.50)" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          border: "2.5px solid #1a1a1a",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -4px 0 #1a1a1a",
          overflowY: "scroll",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          maxHeight: "95dvh",
          ...(window.innerWidth >= 768 ? { borderRadius: "22px", boxShadow: "4px 4px 0 #1a1a1a" } : {})
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "2px solid rgba(26,26,26,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1a1a1a" }}>{item ? "Activiteit bewerken" : "Nieuwe activiteit"}</h2>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(26,26,26,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#1a1a1a", fontWeight: 700 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Type */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 10 }}>Type</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TYPES.map(t => {
                const active = form.type === t;
                const color = TYPE_COLORS[t];
                return (
                  <button key={t} type="button" onClick={() => set("type", t)}
                    style={{
                      padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer",
                      background: active ? color : "#ffffff",
                      color: active ? (color === "#FFD600" ? "#1a1a1a" : "#1a1a1a") : "rgba(26,26,26,0.50)",
                      border: active ? `2px solid #1a1a1a` : "2px solid rgba(26,26,26,0.15)",
                      boxShadow: active ? "2px 2px 0 #1a1a1a" : "none",
                    }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titel */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>
              {form.type === "Training" ? "Titel" : form.type === "Wedstrijd" ? "Tegenstander" : form.type === "Toernooi" ? "Toernooinaam" : "Naam"}
            </p>
            <input required value={form.title} onChange={e => set("title", e.target.value)}
              style={inputStyle}
              placeholder={
                form.type === "Training" ? "Naam van de training" :
                form.type === "Wedstrijd" ? "Naam van de tegenstander, bijv. Go Ahead" :
                form.type === "Toernooi" ? "Naam van het toernooi" :
                "Naam van het evenement"
              } />
          </div>

          {/* Logo tegenstander */}
          {isWedstrijd(form.type) && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Logo tegenstander (optioneel)</p>
              {form.opponent_logo_url ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                    <img src={form.opponent_logo_url} alt="logo"
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #1a1a1a" }} />
                    <button type="button" onClick={() => set("opponent_logo_url", "")}
                      style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#FF3DA8", border: "1.5px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                      ✕
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(26,26,26,0.55)" }}>Logo geüpload</span>
                </div>
              ) : (
                <>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                    style={{ width: "100%", height: 48, background: "#ffffff", border: "2px dashed rgba(26,26,26,0.25)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", opacity: uploadingLogo ? 0.6 : 1 }}>
                    <i className="ti ti-upload" style={{ fontSize: 16, color: "rgba(26,26,26,0.45)" }} />
                    <span style={{ fontSize: 13, color: "rgba(26,26,26,0.55)", fontWeight: 600 }}>
                      {uploadingLogo ? "Uploaden..." : "Logo uploaden"}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Datum + Tijd */}
          {form.type === "Toernooi" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Van</p>
                  <input required type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Tot</p>
                  <input type="date" value={form.end_date} min={form.date || undefined} onChange={e => set("end_date", e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Aanvangstijd</p>
                <input required type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} style={inputStyle} />
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Datum</p>
                <input required type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Aanvangstijd</p>
                <input required type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          {/* Team */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 10 }}>Team</p>
            <div style={{ display: "flex", gap: 8 }}>
              {TEAMS.map(t => {
                const active = form.team === t;
                const color = TEAM_COLORS[t];
                return (
                  <button key={t} type="button" onClick={() => set("team", t)}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: "pointer",
                      background: active ? color : "#ffffff",
                      color: active ? "#1a1a1a" : "rgba(26,26,26,0.50)",
                      border: active ? "2px solid #1a1a1a" : "2px solid rgba(26,26,26,0.15)",
                      boxShadow: active ? "2px 2px 0 #1a1a1a" : "none",
                    }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thuis/Uit */}
          {isWedstrijd(form.type) && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 10 }}>Locatie</p>
              <div style={{ display: "flex", gap: 8 }}>
                {HOME_AWAY.map(opt => {
                  const active = form.home_away === opt;
                  return (
                    <button key={opt} type="button" onClick={() => set("home_away", opt)}
                      style={{
                        flex: 1, padding: "8px 4px", borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: "pointer",
                        background: active ? "#FF6800" : "#ffffff",
                        color: active ? "#ffffff" : "rgba(26,26,26,0.50)",
                        border: active ? "2px solid #1a1a1a" : "2px solid rgba(26,26,26,0.15)",
                        boxShadow: active ? "2px 2px 0 #1a1a1a" : "none",
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
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Notitie (optioneel)</p>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              style={{ ...inputStyle, resize: "none" }}
              placeholder="Extra informatie..." />
          </div>

          {/* Herinneringen */}
          <div style={{ padding: 16, borderRadius: 14, background: "rgba(26,26,26,0.04)", border: "2px solid rgba(26,26,26,0.08)" }}>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 4 }}>🔔 Automatische herinneringen</p>
            <p style={{ fontSize: 11, color: "rgba(26,26,26,0.45)", marginBottom: 12 }}>Spelers ontvangen automatisch een e-mail herinnering.</p>
            {[
              { key: "reminder_1_days", label: "Eerste herinnering" },
              { key: "reminder_2_days", label: "Tweede herinnering" },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "rgba(26,26,26,0.65)", fontWeight: 600 }}>{label}</p>
                <select value={form[key]} onChange={e => set(key, Number(e.target.value))}
                  style={{ padding: "6px 10px", borderRadius: 10, fontSize: 13, border: "2px solid #1a1a1a", background: "#ffffff", color: "#1a1a1a", fontWeight: 600 }}>
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

          {/* Herhaling — alleen bij nieuwe trainingen */}
          {!item && form.type === "Training" && (
            <div style={{ padding: 16, borderRadius: 14, background: repeat ? "rgba(8,208,104,0.08)" : "rgba(26,26,26,0.04)", border: `2px solid ${repeat ? "rgba(8,208,104,0.35)" : "rgba(26,26,26,0.08)"}`, transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)" }}>🔁 Training herhalen</p>
                  <p style={{ fontSize: 11, color: "rgba(26,26,26,0.45)", marginTop: 2 }}>
                    {selectedDayOfWeek !== null
                      ? `Wekelijks op ${DAY_NAMES_FULL[selectedDayOfWeek]}`
                      : "Kies eerst een datum"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRepeat(r => !r)}
                  disabled={!form.date}
                  style={{
                    width: 48, height: 28, borderRadius: 14,
                    background: repeat ? "#08D068" : "rgba(26,26,26,0.15)",
                    border: "2px solid #1a1a1a",
                    cursor: form.date ? "pointer" : "not-allowed",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#ffffff",
                    border: "1.5px solid #1a1a1a",
                    position: "absolute", top: 3,
                    left: repeat ? 23 : 3,
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>

              {repeat && form.date && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>Herhalen tot</p>
                  <input
                    type="date"
                    required={repeat}
                    value={repeatUntil}
                    min={form.date}
                    onChange={e => setRepeatUntil(e.target.value)}
                    style={inputStyle}
                  />
                  {repeatUntil && form.date && (
                    <p style={{ fontSize: 12, color: "#05a050", fontWeight: 700, marginTop: 8 }}>
                      ✓ {generateRepeatDates(form.date, repeatUntil).length} extra trainingen worden aangemaakt
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={saving || (repeat && !repeatUntil)} className="btn-primary" style={{ marginTop: 4 }}>
            {saving ? "Aanmaken..." : item ? "Wijzigingen opslaan" : "Activiteit aanmaken"}
          </button>
          <div style={{ height: 32 }} />
        </form>
      </div>
    </div>
  );
}