import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PLAYER_FALLBACK_PHOTO } from "@/lib/playerFallback";

export default function MatchLineupEditor({ match, players, item, isTrainer, matchQueryKey }) {
  const qc = useQueryClient();
  const [basis, setBasis] = useState([]);
  const [wissel, setWissel] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Initialiseer opstelling vanuit match data
  useEffect(() => {
    if (match?.lineup) {
      setBasis(match.lineup.filter(p => p.slot === "basis").map(p => p.player_id));
      setWissel(match.lineup.filter(p => p.slot === "wissel").map(p => p.player_id));
    }
  }, [match?.id]);

  // Beschikbare spelers zijn die in selectie (substitutes) maar nog niet in opstelling
  const selectedIds = match?.substitutes || [];
  const allInLineup = [...basis, ...wissel];
  const available = selectedIds.filter(id => !allInLineup.includes(id));
  const availablePlayers = available.map(id => players.find(p => p.id === id)).filter(Boolean);

  async function handleSave() {
    setSaving(true);
    try {
      let matchId = match?.id;

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

      const lineupData = [
        ...basis.map(id => ({ player_id: id, slot: "basis" })),
        ...wissel.map(id => ({ player_id: id, slot: "wissel" })),
      ];

      // Sla ook op als basis/wissel objects voor LiveMatch
      const basisObj = basis.reduce((acc, id, idx) => { acc[`slot_${idx}`] = id; return acc; }, {});
      const wisselObj = wissel.reduce((acc, id, idx) => { acc[`slot_${idx}`] = id; return acc; }, {});

      await base44.entities.Match.update(matchId, { 
        lineup: lineupData,
        basis: basisObj,
        wissel: wisselObj
      });
      await qc.invalidateQueries({ queryKey: matchQueryKey });
      toast.success("Opstelling opgeslagen");
      setShowEditor(false);
    } catch (e) {
      toast.error("Opslaan mislukt");
    }
    setSaving(false);
  }

  const basisPlayers = basis.map(id => players.find(p => p.id === id)).filter(Boolean);
  const wisselPlayers = wissel.map(id => players.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>Opstelling</span>
          {(basis.length + wissel.length) > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 20, background: "#FF6800", color: "#fff", border: "1.5px solid #1a1a1a" }}>
              {basis.length + wissel.length}
            </span>
          )}
        </div>
        {isTrainer && (
          <button onClick={() => setShowEditor(!showEditor)}
            style={{ height: 36, padding: "0 16px", borderRadius: 12, background: showEditor ? "#08D068" : "#1a1a1a", color: "#fff", fontSize: 12, fontWeight: 800, border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer" }}>
            {showEditor ? "Gereed" : "Bewerken"}
          </button>
        )}
      </div>

      {/* View mode - read-only */}
      {!showEditor && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Basis */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FF6800", marginBottom: 10 }}>
              Basis ({basisPlayers.length})
            </p>
            {basisPlayers.length === 0 ? (
              <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 14, boxShadow: "2px 2px 0 #1a1a1a", padding: "16px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Nog niet ingevuld</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
                {basisPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>

          {/* Wissel */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#05a050", marginBottom: 10 }}>
              Wissel ({wisselPlayers.length})
            </p>
            {wisselPlayers.length === 0 ? (
              <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 14, boxShadow: "2px 2px 0 #1a1a1a", padding: "16px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Nog niet ingevuld</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
                {wisselPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit mode */}
      {showEditor && isTrainer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Beschikbare spelers */}
          {availablePlayers.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>
                Beschikbare spelers ({availablePlayers.length})
              </p>
              <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: 14, boxShadow: "2px 2px 0 #1a1a1a", overflow: "hidden" }}>
                {availablePlayers.map((player, i) => (
                  <div key={player.id}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      background: "transparent",
                      borderBottom: i < availablePlayers.length - 1 ? "1.5px solid rgba(26,26,26,0.08)" : "none",
                    }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,104,0,0.10)", border: "1.5px solid #1a1a1a" }}>
                      <img src={player.photo_url || PLAYER_FALLBACK_PHOTO} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{player.name}</p>
                      {player.position && <p style={{ fontSize: 10, color: "rgba(26,26,26,0.45)", margin: 0 }}>{player.position}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setBasis([...basis, player.id])}
                        style={{ padding: "4px 10px", borderRadius: 8, background: "#FF6800", color: "#fff", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer" }}>
                        Basis
                      </button>
                      <button onClick={() => setWissel([...wissel, player.id])}
                        style={{ padding: "4px 10px", borderRadius: 8, background: "#08D068", color: "#fff", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer" }}>
                        Wissel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basis */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FF6800", marginBottom: 8 }}>
              Basis ({basis.length})
            </p>
            {basis.length === 0 ? (
              <div style={{ background: "rgba(255,104,0,0.06)", border: "2px dashed rgba(255,104,0,0.30)", borderRadius: 14, padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Voeg spelers toe</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
                {basis.map(playerId => {
                  const player = players.find(p => p.id === playerId);
                  return player ? (
                    <button key={playerId} onClick={() => setBasis(basis.filter(id => id !== playerId))}
                      style={{
                        background: "#ffffff", border: "2.5px solid #FF6800", borderRadius: 12, padding: "8px", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,104,0,0.10)", border: "1.5px solid #FF6800" }}>
                        <img src={player.photo_url || PLAYER_FALLBACK_PHOTO} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#1a1a1a", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {player.name.split(" ")[0]}
                      </p>
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Wissel */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#05a050", marginBottom: 8 }}>
              Wissel ({wissel.length})
            </p>
            {wissel.length === 0 ? (
              <div style={{ background: "rgba(8,208,104,0.06)", border: "2px dashed rgba(8,208,104,0.30)", borderRadius: 14, padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Voeg spelers toe</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
                {wissel.map(playerId => {
                  const player = players.find(p => p.id === playerId);
                  return player ? (
                    <button key={playerId} onClick={() => setWissel(wissel.filter(id => id !== playerId))}
                      style={{
                        background: "#ffffff", border: "2.5px solid #08D068", borderRadius: 12, padding: "8px", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(8,208,104,0.10)", border: "1.5px solid #08D068" }}>
                        <img src={player.photo_url || PLAYER_FALLBACK_PHOTO} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#1a1a1a", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {player.name.split(" ")[0]}
                      </p>
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", height: 48, borderRadius: 12, background: saving ? "rgba(26,26,26,0.20)" : "#08D068", color: "#1a1a1a", fontSize: 13, fontWeight: 800, border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Opslaan..." : "Opstelling opslaan"}
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,104,0,0.10)", border: "2px solid #1a1a1a" }}>
        <img src={player.photo_url || PLAYER_FALLBACK_PHOTO} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "70px" }}>
          {player.name.split(" ")[0]}
        </p>
        {player.shirt_number && (
          <p style={{ fontSize: 9, color: "rgba(26,26,26,0.45)", margin: 0 }}>#{player.shirt_number}</p>
        )}
      </div>
    </div>
  );
}