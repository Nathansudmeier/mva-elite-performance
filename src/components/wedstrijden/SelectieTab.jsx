import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Check } from "lucide-react";

function PlayerRow({ player, selected, onToggle, isTrainer }) {
  return (
    <div
      onClick={isTrainer ? onToggle : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 14,
        border: "2px solid " + (selected ? "#1a1a1a" : "rgba(26,26,26,0.10)"),
        background: selected ? "rgba(8,208,104,0.10)" : "#ffffff",
        cursor: isTrainer ? "pointer" : "default",
        transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", background: "rgba(255,104,0,0.10)",
        border: "2px solid " + (selected ? "#08D068" : "rgba(26,26,26,0.20)"),
      }}>
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 12, fontWeight: 800, color: "#FF6800" }}>{player.name?.charAt(0)}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</p>
        {player.position && (
          <p style={{ fontSize: 11, color: "rgba(26,26,26,0.50)", fontWeight: 600 }}>{player.position}</p>
        )}
      </div>
      {selected && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: "#08D068",
          border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Check size={14} color="#ffffff" strokeWidth={3} />
        </div>
      )}
      {!selected && isTrainer && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: "rgba(26,26,26,0.06)",
          border: "2px solid rgba(26,26,26,0.15)", flexShrink: 0,
        }} />
      )}
    </div>
  );
}

export default function SelectieTab({ match, players, isTrainer, item, qc, toast, teamCardBg }) {
  const currentSelection = match?.selection || [];
  const [localSelection, setLocalSelection] = useState(currentSelection);
  const [savedSelection, setSavedSelection] = useState(currentSelection);
  const [saving, setSaving] = useState(false);

  // Sync when match loads/changes
  React.useEffect(() => {
    const sel = match?.selection || [];
    setLocalSelection(sel);
    setSavedSelection(sel);
  }, [match?.id, JSON.stringify(match?.selection)]);

  const hasChanges = JSON.stringify([...localSelection].sort()) !== JSON.stringify([...savedSelection].sort());

  function togglePlayer(playerId) {
    setLocalSelection(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  }

  async function saveSelection() {
    if (!match) return;
    setSaving(true);
    await base44.entities.Match.update(match.id, { selection: localSelection });
    // Notify selected players
    if (localSelection.length > 0) {
      const allUsers = await base44.entities.User.list();
      const selectedPlayerObjs = players.filter(p => localSelection.includes(p.id));
      const emails = allUsers
        .filter(u => selectedPlayerObjs.some(p => p.name === u.full_name || p.id === u.player_id))
        .map(u => u.email).filter(Boolean);
      await Promise.all([...new Set(emails)].map(email =>
        base44.entities.Notification.create({
          user_email: email,
          type: "selectie",
          title: "Selectie bekend",
          body: `Je bent geselecteerd voor ${item?.title}`,
          is_read: false,
          link: `/PlanningWedstrijdDetail?id=${item?.id}`,
        })
      )).catch(() => {});
    }
    await qc.invalidateQueries({ queryKey: ["match"] });
    setSavedSelection([...localSelection]);
    setSaving(false);
    toast({ description: "Selectie opgeslagen", style: { background: "#4ade80", color: "white", border: "none" } });
  }

  const selectedPlayers = players.filter(p => localSelection.includes(p.id));
  const unselectedPlayers = players.filter(p => !localSelection.includes(p.id));

  // For non-trainers: show read-only view
  if (!isTrainer) {
    if (currentSelection.length === 0) {
      return (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "32px 20px", textAlign: "center" }}>
          <Users size={32} style={{ color: "rgba(26,26,26,0.20)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(26,26,26,0.40)" }}>De selectie is nog niet bekendgemaakt.</p>
        </div>
      );
    }
    return (
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 18, boxShadow: "3px 3px 0 #1a1a1a", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.50)", marginBottom: 4 }}>
          Selectie ({currentSelection.length} spelers)
        </p>
        {players.filter(p => currentSelection.includes(p.id)).map(player => (
          <PlayerRow key={player.id} player={player} selected={true} isTrainer={false} onToggle={null} />
        ))}
      </div>
    );
  }

  // Trainer view: editable
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Count bar */}
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 14, boxShadow: "2px 2px 0 #1a1a1a", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>
          <span style={{ color: "#08D068" }}>{localSelection.length}</span> / {players.length} geselecteerd
        </p>
        {localSelection.length > 0 && (
          <button
            onClick={() => setLocalSelection([])}
            style={{ fontSize: 11, fontWeight: 700, color: "#FF3DA8", background: "none", border: "none", cursor: "pointer" }}
          >
            Wis alles
          </button>
        )}
      </div>

      {/* Selected players */}
      {selectedPlayers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "#08D068", paddingLeft: 4 }}>Geselecteerd</p>
          {selectedPlayers.map(player => (
            <PlayerRow key={player.id} player={player} selected={true} isTrainer={true} onToggle={() => togglePlayer(player.id)} />
          ))}
        </div>
      )}

      {/* Unselected players */}
      {unselectedPlayers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.40)", paddingLeft: 4 }}>Overige spelers</p>
          {unselectedPlayers.map(player => (
            <PlayerRow key={player.id} player={player} selected={false} isTrainer={true} onToggle={() => togglePlayer(player.id)} />
          ))}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={saveSelection}
        disabled={saving || !hasChanges}
        style={{
          height: 52, borderRadius: 14, background: hasChanges ? "#FF6800" : "rgba(26,26,26,0.10)",
          color: hasChanges ? "#ffffff" : "rgba(26,26,26,0.35)", border: "2.5px solid " + (hasChanges ? "#1a1a1a" : "rgba(26,26,26,0.15)"),
          boxShadow: hasChanges ? "3px 3px 0 #1a1a1a" : "none",
          fontSize: 15, fontWeight: 800, cursor: hasChanges ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.15s",
        }}
      >
        {saving ? "Opslaan..." : "Selectie opslaan"}
      </button>
    </div>
  );
}