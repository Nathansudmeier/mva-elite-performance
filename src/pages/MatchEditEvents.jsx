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
  background: "#ffffff",
  border: "2px solid #1a1a1a",
  borderRadius: "10px",
  color: "#1a1a1a",
  padding: "7px 10px",
  fontSize: "13px",
  fontWeight: 600,
  width: "100%",
  outline: "none",
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
    <div className="glass" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Row 1: minute + type + delete */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="number"
          min="0"
          max="120"
          value={event.minute ?? ""}
          onChange={e => onChange(index, "minute", parseInt(e.target.value) || 0)}
          style={{ ...fieldStyle, width: "64px", textAlign: "center" }}
          placeholder="Min"
        />
        <div style={{ flex: 1 }}>
          <select value={event.type} onChange={e => onChange(index, "type", e.target.value)} style={fieldStyle}>
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onDelete(index)}
          style={{ background: "rgba(255,61,168,0.10)", border: "2px solid #FF3DA8", borderRadius: "10px", padding: "7px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Trash2 size={14} color="#FF3DA8" />
        </button>
      </div>

      {/* Goal type */}
      {(isGoalMva || isGoalAgainst) && (
        <select value={event.goal_type || "normaal"} onChange={e => onChange(index, "goal_type", e.target.value)} style={fieldStyle}>
          {GOAL_TYPES.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      )}

      {/* Player selector */}
      {needsPlayer && (
        <PlayerSelect players={players} value={event.player_id} onChange={v => onChange(index, "player_id", v)} placeholder="Speler" />
      )}

      {/* Assist */}
      {isGoalMva && event.goal_type !== "eigen_doelpunt" && (
        <PlayerSelect players={players} value={event.assist_player_id} onChange={v => onChange(index, "assist_player_id", v)} placeholder="Assist (optioneel)" />
      )}

      {/* Substitution: out + in */}
      {isSubstitution && (
        <div style={{ display: "flex", gap: "8px" }}>
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
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");

  useEffect(() => {
    if (match && events === null) {
      setEvents(match.live_events ? [...match.live_events] : []);
      setScoreHome(match.score_home ?? "");
      setScoreAway(match.score_away ?? "");
    }
  }, [match]);

  const saveMutation = useMutation({
    mutationFn: ({ live_events, score_home, score_away }) =>
      base44.entities.Match.update(matchId, { live_events, score_home: score_home !== "" ? Number(score_home) : null, score_away: score_away !== "" ? Number(score_away) : null }),
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
    saveMutation.mutate({ live_events: sorted, score_home: scoreHome, score_away: scoreAway });
    setEvents(sorted);
  };

  if (!match) {
    return (
      <div style={{ background: "#FFF3E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="t-secondary">Wedstrijd niet gevonden</p>
      </div>
    );
  }

  const goalsMva = (events || []).filter(e => e.type === "goal_mva").length;
  const goalsAgainst = (events || []).filter(e => e.type === "goal_against").length;
  const sorted = events ? [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)) : [];

  return (
    <div style={{ background: "#FFF3E8", minHeight: "100vh", padding: "16px", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer" }}
          >
            <ChevronLeft size={18} color="#1a1a1a" />
          </button>
          <div>
            <p className="t-label">Wedstrijd</p>
            <h1 className="t-page-title">Events bewerken</h1>
            <p className="t-secondary">vs. {match.opponent} · {format(parseISO(match.date), "d MMMM yyyy", { locale: nl })}</p>
          </div>
        </div>

        {/* Score card */}
        <div className="glass" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(26,26,26,0.50)" }}>Uit events: {goalsMva} — {goalsAgainst}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "9px", fontWeight: 800, color: "#FF6800", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>MVA Noord</p>
              <input
                type="number" min="0"
                value={scoreHome}
                onChange={e => setScoreHome(e.target.value)}
                style={{ ...fieldStyle, fontSize: "22px", fontWeight: 900, textAlign: "center", height: "52px", letterSpacing: "-1px" }}
                placeholder="—"
              />
            </div>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "rgba(26,26,26,0.30)", marginTop: "18px" }}>–</span>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.50)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Tegenstander</p>
              <input
                type="number" min="0"
                value={scoreAway}
                onChange={e => setScoreAway(e.target.value)}
                style={{ ...fieldStyle, fontSize: "22px", fontWeight: 900, textAlign: "center", height: "52px", letterSpacing: "-1px" }}
                placeholder="—"
              />
            </div>
          </div>
        </div>

        {/* Events list */}
        {events === null ? (
          <p className="t-secondary" style={{ textAlign: "center", padding: "20px 0" }}>Laden...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sorted.length === 0 && (
              <p className="t-secondary" style={{ textAlign: "center", padding: "20px 0" }}>Geen events geregistreerd</p>
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
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleAdd}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            <Plus size={16} /> Event toevoegen
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            <Save size={16} /> {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}