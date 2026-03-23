import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Plus, Calendar, List, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import AgendaCalendar from "@/components/agenda/AgendaCalendar";
import AgendaItemCard from "@/components/agenda/AgendaItemCard";
import AgendaForm from "@/components/agenda/AgendaForm";
import { formatDate } from "@/components/agenda/agendaUtils";

export default function Planning() {
  const { isTrainer } = useCurrentUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState("lijst");
  const [typeFilter, setTypeFilter] = useState("alles");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const { data: items = [], isLoading: loadingItems, isError: errorItems } = useQuery({
    queryKey: ["agenda-items"],
    queryFn: () => base44.entities.AgendaItem.list("-date"),
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["agenda-attendance-all"],
    queryFn: () => base44.entities.AgendaAttendance.list(),
  });

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ["players-agenda"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const isLoading = loadingItems || loadingAttendance || loadingPlayers;

  // 5-second timeout fallback
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setLoadTimeout(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Auto-open item if ?id= param is provided
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && items.length > 0) {
      const item = items.find(i => i.id === id);
      if (item) openDetail(item);
    }
  }, [searchParams, items]);

  const today = new Date().toISOString().split("T")[0];
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  
  // Filter by type
  const filtered = typeFilter === "alles" 
    ? sorted 
    : sorted.filter(i => i.type === (typeFilter === "trainingen" ? "Training" : "Wedstrijd"));
  
  const upcoming = filtered.filter(i => i.date >= today);
  const past = filtered.filter(i => i.date < today).reverse();

  function getAttendanceFor(itemId) {
    return attendance.filter(a => a.agenda_item_id === itemId);
  }

  async function handleSave() {
    await qc.invalidateQueries({ queryKey: ["agenda-items"] });
    setShowForm(false);
    setEditItem(null);
  }

  function openDetail(item) {
    setSelectedDay(null);
    if (item.type === "Training") {
      navigate(`/PlanningTrainingDetail?id=${item.id}`);
    } else if (item.type === "Wedstrijd") {
      navigate(`/PlanningWedstrijdDetail?id=${item.id}`);
    } else {
      navigate(`/PlanningTrainingDetail?id=${item.id}`);
    }
  }

  if (errorItems) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="t-secondary text-center">Kon de planning niet laden.<br />Controleer je verbinding en probeer opnieuw.</p>
        <button onClick={() => qc.invalidateQueries({ queryKey: ["agenda-items"] })} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Opnieuw proberen
        </button>
      </div>
    );
  }

  if (isLoading && loadTimeout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="t-secondary text-center">Kon de planning niet laden. Probeer opnieuw.</p>
        <button onClick={() => { setLoadTimeout(false); qc.invalidateQueries(); }} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Opnieuw laden
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png"
        alt=""
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", zIndex: 0 }}
      />

      <div className="space-y-5 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="t-page-title">Planning</h1>
            <p className="t-secondary mt-0.5">{upcoming.length} komende activiteiten</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle pills */}
            <div className="flex rounded-full overflow-hidden p-0.5" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
              {[{ key: "maand", Icon: Calendar, label: "Kalender" }, { key: "lijst", Icon: List, label: "Lijst" }].map(({ key, Icon, label }) => (
                <button key={key} onClick={() => setView(key)}
                  className="px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-all rounded-full"
                  style={{
                    background: view === key ? "rgba(255,140,58,0.25)" : "transparent",
                    color: view === key ? "#FF8C3A" : "rgba(255,255,255,0.45)",
                    border: view === key ? "0.5px solid rgba(255,140,58,0.35)" : "0.5px solid transparent",
                  }}>
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {isTrainer && (
              <button onClick={() => { setEditItem(null); setShowForm(true); }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: "#FF6B00" }}>
                <Plus size={18} color="#fff" />
              </button>
            )}
          </div>
        </div>

        {/* Kalenderweergave */}
        {view === "maand" && (
          <div className="space-y-4">
            <AgendaCalendar items={items} onDayClick={(dateStr, dayItems) => setSelectedDay({ dateStr, dayItems })} />

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

        {/* Type filter (only in list view) */}
        {view === "lijst" && (
          <div className="flex rounded-full overflow-hidden p-0.5 w-fit" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
            {[
              { key: "alles", label: "Alles" },
              { key: "trainingen", label: "Trainingen" },
              { key: "wedstrijden", label: "Wedstrijden" }
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTypeFilter(key)}
                className="px-3 py-1.5 text-sm font-semibold transition-all rounded-full"
                style={{
                  background: typeFilter === key ? "rgba(255,140,58,0.25)" : "transparent",
                  color: typeFilter === key ? "#FF8C3A" : "rgba(255,255,255,0.45)",
                  border: typeFilter === key ? "0.5px solid rgba(255,140,58,0.35)" : "0.5px solid transparent",
                }}>
                {label}
              </button>
            ))}
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

            {past.length > 0 && (
              <div className="mt-4">
                <button onClick={() => setShowPast(p => !p)}
                  className="flex items-center gap-2 t-secondary hover:text-white transition-colors w-full py-2">
                  {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Eerder ({past.length})
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
      </div>
    </div>
  );
}