import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Plus, Trash2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const EVENT_TYPES = [
  { value: "goal_mva", label: "⚽ Goal (voor)" },
  { value: "goal_against", label: "⚽ Goal Tegen" },
  { value: "substitution", label: "⇄ Wissel" },
  { value: "yellow_card", label: "🟨 Gele Kaart" },
  { value: "red_card", label: "🟥 Rode Kaart" },
  { value: "chance_mva", label: "🎯 Kans" },
  { value: "chance_against", label: "🎯 Kans Tegen" },
  { value: "note", label: "📝 Notitie" },
];

const GOAL_TYPES = [
  { value: "normaal", label: "Normaal" },
  { value: "penalty", label: "Penalty" },
  { value: "vrije_trap", label: "Vrije Trap" },
  { value: "corner", label: "Corner" },
  { value: "eigen_doelpunt", label: "Eigen Doelpunt" },
];

const fieldStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "8px",
  color: "white",
  padding: "6px 10px",
  fontSize: "13px",
  width: "100%",
};

function PlayerSelect({ players, value, onChange, placeholder = "Speler" }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={fieldStyle}>
      <option value="">{placeholder}</option>
      {players.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

function EventRow({ event, index, players, onChange, onDelete }) {
  const needsPlayer = ["goal_mva", "yellow_card", "red_card"].includes(event.type);
  const isGoalMva = event.type === "goal_mva";
  const isSubstitution = event.type === "substitution";
  const isNote = event.type === "note";
  const isGoalAgainst = event.type === "goal_against";

  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "14px",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {/* Row 1: minute + type + delete */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="120"
          value={event.minute ?? ""}
          onChange={e => onChange(index, "minute", parseInt(e.target.value) || 0)}
          style={{ ...fieldStyle, width: "60px", textAlign: "center" }}
          placeholder="Min"
        />
        <div style={{ flex: 1 }}>
          <select value={event.type} onChange={e => onChange(index, "type", e.target.value)} style={fieldStyle}>
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => onDelete(index)} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "8px", padding: "6px", cursor: "pointer", flexShrink: 0 }}>
          <Trash2 size={14} color="#f87171" />
        </button>
      </div>

      {/* Goal type (for goal_mva and goal_against) */}
      {(isGoalMva || isGoalAgainst) && (
        <select value={event.goal_type || "normaal"} onChange={e => onChange(index, "goal_type", e.target.value)} style={fieldStyle}>
          {GOAL_TYPES.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      )}

      {/* Player selectors */}
      {needsPlayer && (
        <PlayerSelect players={players} value={event.player_id} onChange={v => onChange(index, "player_id", v)} placeholder="Speler" />
      )}

      {/* Assist (only for goal_mva, not eigen doelpunt) */}
      {isGoalMva && event.goal_type !== "eigen_doelpunt" && (
        <PlayerSelect players={players} value={event.assist_player_id} onChange={v => onChange(index, "assist_player_id", v)} placeholder="Assist (optioneel)" />
      )}

      {/* Substitution: out + in */}
      {isSubstitution && (
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <PlayerSelect players={players} value={event.player_out_id} onChange={v => onChange(index, "player_out_id", v)} placeholder="Eruit" />
          </div>
          <div style={{ flex: 1 }}>
            <PlayerSelect players={players} value={event.player_in_id} onChange={v => onChange(index, "player_in_id", v)} placeholder="Erin" />
          </div>
        </div>
      )}

      {/* Note */}
      {isNote && (
        <input
          type="text"
          value={event.note || ""}
          onChange={e => onChange(index, "note", e.target.value)}
          placeholder="Notitietekst..."
          style={fieldStyle}
        />
      )}
    </div>
  );
}

export default function MatchEditEvents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("matchId");

  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-date") });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });

  const match = matches.find(m => m.id === matchId);
  const activePlayers = players.filter(p => p.active !== false).sort((a, b) => a.name.localeCompare(b.name));

  const [events, setEvents] = useState(null);

  // Initialize events from match when loaded
  useEffect(() => {
    if (match && events === null) {
      setEvents(match.live_events ? [...match.live_events] : []);
    }
  }, [match]);

  const saveMutation = useMutation({
    mutationFn: (live_events) => base44.entities.Match.update(matchId, { live_events }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast({ description: "Wedstrijdevents opgeslagen ✓", style: { background: "#4ade80", color: "white", border: "none" } });
    },
  });

  const handleChange = (index, field, value) => {
    setEvents(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const handleDelete = (index) => {
    setEvents(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    setEvents(prev => [...prev, { type: "goal_mva", minute: 0 }]);
  };

  const handleSave = () => {
    const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
    saveMutation.mutate(sorted);
    setEvents(sorted);
  };

  if (!match) {
    return (
      <div style={{ background: "#1a1a1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "white" }}>Wedstrijd niet gevonden</p>
      </div>
    );
  }

  const sorted = events ? [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)) : [];

  return (
    <div style={{ background: "#1a1a1a", minHeight: "100vh", color: "white" }} className="pb-20">
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} color="#fff" />
          </button>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900 }}>Events bewerken</h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.50)" }}>
              vs. {match.opponent} · {format(parseISO(match.date), "d MMMM yyyy", { locale: nl })}
            </p>
          </div>
        </div>

        {/* Score info */}
        <div style={{ background: "rgba(255,104,0,0.15)", border: "1px solid rgba(255,104,0,0.25)", borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.70)" }}>Eindstand (uit events)</span>
          <span style={{ fontSize: "22px", fontWeight: 900 }}>
            {(events || []).filter(e => e.type === "goal_mva").length} — {(events || []).filter(e => e.type === "goal_against").length}
          </span>
        </div>

        {/* Events list */}
        {events === null ? (
          <p style={{ color: "rgba(255,255,255,0.40)", textAlign: "center" }}>Laden...</p>
        ) : (
          <div className="space-y-3">
            {sorted.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.40)", textAlign: "center", padding: "20px 0" }}>Geen events geregistreerd</p>
            )}
            {sorted.map((event, i) => {
              const originalIndex = events.indexOf(event);
              return (
                <EventRow
                  key={i}
                  event={event}
                  index={originalIndex}
                  players={activePlayers}
                  onChange={handleChange}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        )}

        {/* Add + Save buttons */}
        <div className="flex gap-3">
          <button onClick={handleAdd} style={{ flex: 1, height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Plus size={16} /> Event toevoegen
          </button>
          <button onClick={handleSave} disabled={saveMutation.isPending} style={{ flex: 1, height: "44px", borderRadius: "12px", background: "#FF6800", border: "none", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Save size={16} /> Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}