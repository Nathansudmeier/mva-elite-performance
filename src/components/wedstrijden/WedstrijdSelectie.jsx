import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Users } from "lucide-react";
import { toast } from "sonner";

export default function WedstrijdSelectie({ match, players, item, isTrainer, matchQueryKey }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  // Initialiseer selectie vanuit match.substitutes (hergebruiken als "selectie" veld)
  useEffect(() => {
    if (match?.substitutes) {
      setSelected(match.substitutes);
    } else {
      setSelected([]);
    }
  }, [match?.id, match?.substitutes?.length]);

  function toggle(playerId) {
    setSelected(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      let matchId = match?.id;

      // Maak match aan als die nog niet bestaat
      if (!matchId) {
        const newMatch = await base44.entities.Match.create({
          opponent: item.title,
          date: item.date,
          home_away: item.home_away,
          team: item.team,
        });
        await base44.entities.AgendaItem.update(item.id, { match_id: newMatch.id });
        matchId = newMatch.id;
        await qc.invalidateQueries({ queryKey: ["agenda-item", item.id] });
      }

      await base44.entities.Match.update(matchId, { substitutes: selected });
      await qc.invalidateQueries({ queryKey: matchQueryKey });
      toast.success("Selectie opgeslagen");
    } catch (e) {
      toast.error("Opslaan mislukt");
    }
    setSaving(false);
  }

  const selectedPlayers = players.filter(p => selected.includes(p.id));
  const otherPlayers = players.filter(p => !selected.includes(p.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} color="#FF6800" />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>Selectie</span>
          {selected.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 20, background: "#FF6800", color: "#fff", border: "1.5px solid #1a1a1a" }}>
              {selected.length}
            </span>
          )}
        </div>
        {isTrainer && (
          <button onClick={handleSave} disabled={saving}
            style={{ height: 36, padding: "0 16px", borderRadius: 12, background: saving ? "rgba(26,26,26,0.20)" : "#1a1a1a", color: "#fff", fontSize: 12, fontWeight: 800, border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        )}
      </div>

      {/* Spelerlijst — trainers kunnen selecteren */}
      {isTrainer ? (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
          {players.map((player, i) => {
            const isSelected = selected.includes(player.id);
            return (
              <button key={player.id} onClick={() => toggle(player.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  background: isSelected ? "rgba(8,208,104,0.06)" : "transparent",
                  border: "none", borderBottom: i < players.length - 1 ? "1.5px solid rgba(26,26,26,0.08)" : "none",
                  cursor: "pointer", textAlign: "left",
                }}>
                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,104,0,0.10)", border: "1.5px solid #1a1a1a" }}>
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, fontWeight: 800, color: "#FF6800" }}>{player.name?.charAt(0)}</span>}
                </div>
                {/* Name + position */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{player.name}</p>
                  {player.position && <p style={{ fontSize: 11, color: "rgba(26,26,26,0.45)", margin: 0 }}>{player.position}</p>}
                </div>
                {/* Checkmark */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: isSelected ? "#08D068" : "transparent",
                  border: `2px solid ${isSelected ? "#08D068" : "rgba(26,26,26,0.20)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
          {players.length === 0 && (
            <p style={{ padding: 16, fontSize: 13, color: "rgba(26,26,26,0.40)", textAlign: "center" }}>Geen actieve spelers gevonden.</p>
          )}
        </div>
      ) : (
        /* Read-only view voor spelers/ouders */
        selected.length === 0 ? (
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "2rem", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(26,26,26,0.40)" }}>De selectie is nog niet bekendgemaakt.</p>
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
            {selectedPlayers.map((player, i) => (
              <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < selectedPlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.08)" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,104,0,0.10)", border: "1.5px solid #1a1a1a" }}>
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, fontWeight: 800, color: "#FF6800" }}>{player.name?.charAt(0)}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{player.name}</p>
                  {player.position && <p style={{ fontSize: 11, color: "rgba(26,26,26,0.45)", margin: 0 }}>{player.position}</p>}
                </div>
                <Check size={14} color="#08D068" strokeWidth={3} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}