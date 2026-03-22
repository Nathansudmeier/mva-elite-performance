import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Plus, Calendar, List, ChevronDown, ChevronUp } from "lucide-react";
import AgendaCalendar from "@/components/agenda/AgendaCalendar";
import AgendaItemCard from "@/components/agenda/AgendaItemCard";
import AgendaForm from "@/components/agenda/AgendaForm";
import AgendaDetailModal from "@/components/agenda/AgendaDetailModal";
import { formatDate } from "@/components/agenda/agendaUtils";

function exportICS(items) {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = items.filter(i => i.date >= today);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VoetbalApp//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  upcoming.forEach(item => {
    const [y, m, d] = item.date.split("-");
    const [h, min] = (item.start_time || "00:00").split(":");
    const dtStart = `${y}${m}${d}T${h}${min}00`;
    const desc = [item.type, item.location ? `Locatie: ${item.location}` : "", item.team ? `Team: ${item.team}` : ""].filter(Boolean).join("\\n");
    lines.push("BEGIN:VEVENT");
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`SUMMARY:${item.title}`);
    lines.push(`DESCRIPTION:${desc}`);
    if (item.location) lines.push(`LOCATION:${item.location}`);
    lines.push(`UID:${item.id}@voetbalapp`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "agenda.ics"; a.click();
  URL.revokeObjectURL(url);
}

export default function Agenda() {
  const { isTrainer } = useCurrentUser();
  const qc = useQueryClient();
  const [view, setView] = useState("maand"); // maand | lijst
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // { dateStr, items }
  const [showPast, setShowPast] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["agenda-items"],
    queryFn: () => base44.entities.AgendaItem.list("-date"),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["agenda-attendance-all"],
    queryFn: () => base44.entities.AgendaAttendance.list(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players-agenda"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const today = new Date().toISOString().split("T")[0];

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter(i => i.date >= today);
  const past = sorted.filter(i => i.date < today).reverse();

  function getAttendanceFor(itemId) {
    return attendance.filter(a => a.agenda_item_id === itemId);
  }

  async function handleSave() {
    await qc.invalidateQueries({ queryKey: ["agenda-items"] });
    setShowForm(false);
    setEditItem(null);
  }

  async function handleDelete(item) {
    if (!confirm(`'${item.title}' verwijderen?`)) return;
    await base44.entities.AgendaItem.delete(item.id);
    await qc.invalidateQueries({ queryKey: ["agenda-items"] });
    setDetailItem(null);
  }

  function openDetail(item) {
    setDetailItem(item);
    setSelectedDay(null);
  }

  return (
    <div className="relative">
      {/* Background image — fixed */}
      <img
        src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png"
        alt=""
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
        }}
      />
      
      <div className="space-y-5 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Agenda</h1>
          <p className="t-secondary mt-0.5">{upcoming.length} komende activiteiten</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
            {[{ key: "maand", Icon: Calendar }, { key: "lijst", Icon: List }].map(({ key, Icon }) => (
              <button key={key} onClick={() => setView(key)}
                className="px-3 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                style={{
                  background: view === key ? "rgba(255,140,58,0.2)" : "rgba(255,255,255,0.05)",
                  color: view === key ? "#FF8C3A" : "rgba(255,255,255,0.5)",
                }}>
                <Icon size={15} />
                <span className="hidden sm:inline capitalize">{key}</span>
              </button>
            ))}
          </div>

          {isTrainer && (
            <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-secondary flex items-center gap-2 !h-9 !text-sm !px-3">
              <Plus size={16} /> Nieuw
            </button>
          )}
        </div>
      </div>

      {/* Maandweergave */}
      {view === "maand" && (
        <div className="space-y-4">
          <AgendaCalendar items={items} onDayClick={(dateStr, dayItems) => setSelectedDay({ dateStr, dayItems })} />

          {/* Day detail popup */}
          {selectedDay && (
            <div className="glass-dark rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="t-card-title capitalize">{formatDate(selectedDay.dateStr)}</h3>
                <button onClick={() => setSelectedDay(null)} style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>✕</button>
              </div>
              {selectedDay.dayItems.length === 0 ? (
                <p className="t-secondary">Geen activiteiten gepland.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDay.dayItems.map(item => (
                    <AgendaItemCard key={item.id} item={item}
                      attendance={getAttendanceFor(item.id)}
                      playerCount={players.length}
                      onClick={() => openDetail(item)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lijstweergave */}
      {view === "lijst" && (
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <div className="glass-dark rounded-2xl p-8 text-center">
              <p className="t-secondary">Geen komende activiteiten</p>
            </div>
          )}
          {upcoming.map(item => (
            <AgendaItemCard key={item.id} item={item}
              attendance={getAttendanceFor(item.id)}
              playerCount={players.length}
              onClick={() => openDetail(item)} />
          ))}

          {/* Vorige activiteiten uitklapper */}
          {past.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setShowPast(p => !p)}
                className="flex items-center gap-2 t-secondary hover:text-white transition-colors w-full py-2">
                {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Vorige activiteiten ({past.length})
              </button>
              {showPast && (
                <div className="space-y-2 mt-2">
                  {past.map(item => (
                    <div key={item.id} style={{ opacity: 0.55 }}>
                      <AgendaItemCard item={item}
                        attendance={getAttendanceFor(item.id)}
                        playerCount={players.length}
                        onClick={() => openDetail(item)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form modal */}
      {(showForm || editItem) && (
        <AgendaForm
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}

      {/* Detail modal */}
      {detailItem && (
        <AgendaDetailModal
          item={detailItem}
          isTrainer={isTrainer}
          onEdit={() => { setEditItem(detailItem); setDetailItem(null); setShowForm(true); }}
          onDelete={() => handleDelete(detailItem)}
          onClose={() => setDetailItem(null)} />
      )}
      </div>
    </div>
  );
}