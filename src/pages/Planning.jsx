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
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 className="t-page-title">Planning</h1>
          <p className="t-secondary" style={{ marginTop: "2px" }}>{upcoming.length} komende activiteiten</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "14px", boxShadow: "2px 2px 0 #1a1a1a", overflow: "hidden" }}>
            {[{ key: "maand", Icon: Calendar, label: "Kalender" }, { key: "lijst", Icon: List, label: "Lijst" }].map(({ key, Icon, label }) => (
              <button key={key} onClick={() => setView(key)}
                style={{
                  padding: "7px 12px", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", gap: "5px",
                  background: view === key ? "#FF6800" : "transparent",
                  color: view === key ? "#ffffff" : "rgba(26,26,26,0.50)",
                  border: "none", cursor: "pointer",
                }}>
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {isTrainer && (
            <button onClick={() => { setEditItem(null); setShowForm(true); }}
              style={{ width: "42px", height: "42px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: "#FF6800", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer" }}>
              <Plus size={18} color="#fff" />
            </button>
          )}
        </div>
      </div>

      {/* Kalenderweergave */}
      {view === "maand" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <AgendaCalendar items={items} onDayClick={(dateStr, dayItems) => setSelectedDay({ dateStr, dayItems })} />

          {selectedDay && (
            <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", textTransform: "capitalize" }}>{formatDate(selectedDay.dateStr)}</h3>
                <button onClick={() => setSelectedDay(null)} style={{ fontSize: "20px", color: "rgba(26,26,26,0.35)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>✕</button>
              </div>
              {selectedDay.dayItems.length === 0 ? (
                <p className="t-secondary">Geen activiteiten gepland.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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

      {/* Type filter (lijst view) */}
      {view === "lijst" && (
        <div style={{ display: "flex", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "14px", boxShadow: "2px 2px 0 #1a1a1a", overflow: "hidden", width: "fit-content" }}>
          {[
            { key: "alles", label: "Alles" },
            { key: "trainingen", label: "Trainingen" },
            { key: "wedstrijden", label: "Wedstrijden" }
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTypeFilter(key)}
              style={{
                padding: "8px 14px", fontSize: "12px", fontWeight: 800,
                background: typeFilter === key ? "#1a1a1a" : "transparent",
                color: typeFilter === key ? "#ffffff" : "rgba(26,26,26,0.50)",
                border: "none", cursor: "pointer",
              }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Lijstweergave */}
      {view === "lijst" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {upcoming.length === 0 && (
            <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", padding: "2rem", textAlign: "center" }}>
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
            <div style={{ marginTop: "8px" }}>
              <button onClick={() => setShowPast(p => !p)}
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "rgba(26,26,26,0.45)", background: "none", border: "none", cursor: "pointer", padding: "8px 0", width: "100%" }}>
                {showPast ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                Eerder ({past.length})
              </button>
              {showPast && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", opacity: 0.6 }}>
                  {past.map(item => (
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

      {/* Form modal */}
      {(showForm || editItem) && (
        <AgendaForm
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}
    </div>
  );
}