import React, { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, X, GripVertical, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GROUP_COLORS = [
  { id: "red", label: "Rood", hex: "#FF3DA8" },
  { id: "orange", label: "Oranje", hex: "#FF6800" },
  { id: "yellow", label: "Geel", hex: "#FFD600" },
  { id: "green", label: "Groen", hex: "#08D068" },
  { id: "blue", label: "Blauw", hex: "#00C2FF" },
  { id: "white", label: "Wit", hex: "#f0f0f0" },
];

const cardStyle = {
  background: "#ffffff",
  border: "2.5px solid #1a1a1a",
  borderRadius: "18px",
  boxShadow: "3px 3px 0 #1a1a1a",
  marginBottom: "10px",
  overflow: "hidden",
};

const inputStyle = {
  width: "100%",
  background: "#f5f5f5",
  border: "2px solid rgba(26,26,26,0.15)",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "14px",
  color: "#1a1a1a",
  outline: "none",
  minHeight: "44px",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "9px",
  fontWeight: 800,
  color: "rgba(26,26,26,0.45)",
  textTransform: "uppercase",
  letterSpacing: "0.10em",
  marginBottom: "6px",
  display: "block",
};

export default function ExerciseCard({ exercise, players, onChange, onRemove, dragHandleProps, readOnly = false }) {
  const [expanded, setExpanded] = useState(true);
  const [newPoint, setNewPoint] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function update(patch) {
    onChange({ ...exercise, ...patch });
  }

  function addCoachPoint() {
    if (!newPoint.trim()) return;
    update({ coaching_points: [...(exercise.coaching_points || []), newPoint.trim()] });
    setNewPoint("");
  }

  function removeCoachPoint(i) {
    const pts = [...(exercise.coaching_points || [])];
    pts.splice(i, 1);
    update({ coaching_points: pts });
  }

  function addGroup() {
    if ((exercise.groups || []).length >= 4) return;
    const used = (exercise.groups || []).map(g => g.color);
    const color = GROUP_COLORS.find(c => !used.includes(c.id)) || GROUP_COLORS[0];
    const newGroup = { id: Date.now().toString(), name: `Groep ${(exercise.groups || []).length + 1}`, color: color.id, player_ids: [] };
    update({ groups: [...(exercise.groups || []), newGroup] });
  }

  function updateGroup(gIdx, patch) {
    const groups = [...(exercise.groups || [])];
    groups[gIdx] = { ...groups[gIdx], ...patch };
    update({ groups });
  }

  function removeGroup(gIdx) {
    const groups = [...(exercise.groups || [])];
    groups.splice(gIdx, 1);
    update({ groups });
  }

  function togglePlayerInGroup(gIdx, playerId) {
    const groups = [...(exercise.groups || [])];
    const alreadyInGroup = groups[gIdx].player_ids.includes(playerId);
    const updated = groups.map((g, i) => ({
      ...g,
      player_ids: i === gIdx
        ? alreadyInGroup ? g.player_ids.filter(id => id !== playerId) : [...g.player_ids, playerId]
        : g.player_ids.filter(id => id !== playerId)
    }));
    update({ groups: updated });
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update({ field_photo: file_url });
    setUploading(false);
  }

  function getAssignedGroup(playerId) {
    return (exercise.groups || []).find(g => g.player_ids.includes(playerId));
  }

  const groups = exercise.groups || [];
  const colorMap = Object.fromEntries(GROUP_COLORS.map(c => [c.id, c.hex]));

  const groupPills = groups.map(g => (
    <span key={g.id} style={{ background: colorMap[g.color] + "25", border: `2px solid ${colorMap[g.color]}`, borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 800, color: colorMap[g.color] === "#f0f0f0" ? "#1a1a1a" : colorMap[g.color], whiteSpace: "nowrap" }}>
      {g.name} {g.player_ids.length}
    </span>
  ));

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 16px", borderBottom: expanded ? "2px solid rgba(26,26,26,0.08)" : "none" }}>
        {!readOnly && (
          <div {...dragHandleProps} style={{ cursor: "grab", color: "rgba(26,26,26,0.25)", flexShrink: 0, touchAction: "none" }}>
            <GripVertical size={16} />
          </div>
        )}
        <button onClick={() => setExpanded(e => !e)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <span style={{ color: "#1a1a1a", fontWeight: 800, fontSize: "14px" }}>{exercise.name || "Naamloze oefening"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
            {exercise.duration_minutes > 0 && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.45)", background: "rgba(26,26,26,0.06)", borderRadius: "6px", padding: "2px 6px" }}>{exercise.duration_minutes} min</span>
            )}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {groupPills}
            </div>
          </div>
        </button>
        {!readOnly && (
          <button onClick={onRemove} style={{ background: "rgba(255,61,168,0.10)", border: "2px solid rgba(255,61,168,0.30)", borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={14} color="#FF3DA8" />
          </button>
        )}
        <button onClick={() => setExpanded(e => !e)} style={{ background: "rgba(26,26,26,0.06)", border: "none", borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} color="rgba(26,26,26,0.5)" /> : <ChevronDown size={16} color="rgba(26,26,26,0.5)" />}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Name & Duration */}
          {!readOnly && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Naam</label>
                <input
                  value={exercise.name || ""}
                  onChange={e => update({ name: e.target.value })}
                  placeholder="Naam oefenvorm..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Min</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={exercise.duration_minutes || ""}
                  onChange={e => update({ duration_minutes: Number(e.target.value) })}
                  placeholder="10"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Description */}
          {!readOnly ? (
            <div>
              <label style={labelStyle}>Beschrijving</label>
              <textarea
                value={exercise.description || ""}
                onChange={e => update({ description: e.target.value })}
                placeholder="Beschrijf de oefenvorm..."
                rows={2}
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              />
            </div>
          ) : exercise.description ? (
            <div>
              <label style={labelStyle}>Beschrijving</label>
              <p style={{ fontSize: "13px", color: "#1a1a1a", lineHeight: 1.5 }}>{exercise.description}</p>
            </div>
          ) : null}

          {/* Coaching points */}
          <div>
            <label style={labelStyle}>Coaching Points</label>
            {(exercise.coaching_points || []).map((pt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "9px", fontWeight: 900, color: "#ffffff" }}>{i + 1}</span>
                </div>
                <span style={{ flex: 1, fontSize: "13px", color: "#1a1a1a", fontWeight: 600 }}>{pt}</span>
                {!readOnly && (
                  <button onClick={() => removeCoachPoint(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(26,26,26,0.30)", padding: "4px" }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <input
                  value={newPoint}
                  onChange={e => setNewPoint(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCoachPoint()}
                  placeholder="Nieuw coaching point..."
                  style={inputStyle}
                />
                <button onClick={addCoachPoint} style={{ background: "#FF6800", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", borderRadius: "10px", width: "46px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <Plus size={16} color="#fff" />
                </button>
              </div>
            )}
          </div>

          {/* Field photo */}
          {!readOnly && (
            <div>
              <label style={labelStyle}>Velddiagram foto</label>
              {exercise.field_photo && (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", marginBottom: "8px", border: "2px solid #1a1a1a" }}>
                  <img src={exercise.field_photo} alt="Velddiagram" style={{ width: "100%", borderRadius: "10px", display: "block" }} />
                  <button
                    onClick={() => { update({ field_photo: null }); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(26,26,26,0.7)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ width: "100%", minHeight: "80px", background: "#f5f5f5", border: "2px dashed rgba(26,26,26,0.20)", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", color: "rgba(26,26,26,0.45)", fontSize: "13px", fontWeight: 600 }}
              >
                <Camera size={22} color="rgba(26,26,26,0.30)" />
                {uploading ? "Uploaden..." : exercise.field_photo ? "Vervangen" : "Foto uploaden"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
            </div>
          )}
          {readOnly && exercise.field_photo && (
            <div style={{ border: "2.5px solid #1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
              <img src={exercise.field_photo} alt="Velddiagram" style={{ width: "100%", display: "block" }} />
            </div>
          )}

          {/* Groups */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Spelersgroepen</label>
              {!readOnly && groups.length < 4 && (
                <button onClick={addGroup} style={{ fontSize: "11px", fontWeight: 800, color: "#FF6800", background: "rgba(255,104,0,0.10)", border: "2px solid rgba(255,104,0,0.30)", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", minHeight: "30px" }}>
                  + Groep toevoegen
                </button>
              )}
            </div>
            {groups.map((group, gIdx) => (
              <GroupEditor
                key={group.id}
                group={group}
                players={players}
                colorMap={colorMap}
                getAssignedGroup={getAssignedGroup}
                onChange={patch => updateGroup(gIdx, patch)}
                onRemove={() => removeGroup(gIdx)}
                onTogglePlayer={pid => togglePlayerInGroup(gIdx, pid)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupEditor({ group, players, colorMap, getAssignedGroup, onChange, onRemove, onTogglePlayer, readOnly }) {
  const [showPlayers, setShowPlayers] = useState(false);
  const hex = colorMap[group.color] || "#FF6800";

  return (
    <div style={{ background: hex + "12", border: `2px solid ${hex}`, borderRadius: "14px", padding: "10px 12px", marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        {!readOnly ? (
          <input
            value={group.name}
            onChange={e => onChange({ name: e.target.value })}
            style={{ flex: 1, background: "#ffffff", border: "2px solid rgba(26,26,26,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", fontWeight: 700, color: "#1a1a1a", outline: "none", minHeight: "40px" }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>{group.name}</span>
        )}
        {!readOnly && (
          <button onClick={onRemove} style={{ background: "rgba(255,61,168,0.10)", border: "2px solid rgba(255,61,168,0.30)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={13} color="#FF3DA8" />
          </button>
        )}
      </div>

      {/* Color picker */}
      {!readOnly && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          {GROUP_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => onChange({ color: c.id })}
              style={{ width: "32px", height: "32px", borderRadius: "50%", background: c.hex, border: group.color === c.id ? "3px solid #1a1a1a" : "2px solid rgba(26,26,26,0.20)", cursor: "pointer", flexShrink: 0, boxShadow: group.color === c.id ? "inset 0 0 0 3px white" : "none" }}
            />
          ))}
        </div>
      )}

      {/* Player toggle button */}
      {players && players.length > 0 && (
        <>
          <button
            onClick={() => setShowPlayers(s => !s)}
            style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", background: "#ffffff", border: "2px solid rgba(26,26,26,0.15)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", width: "100%", textAlign: "left", minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span>{group.player_ids.length > 0 ? `${group.player_ids.length} speler(s)` : "Spelers selecteren"}</span>
            <span style={{ color: "rgba(26,26,26,0.40)" }}>{showPlayers ? "▲" : "▼"}</span>
          </button>

          {showPlayers && (
            <div style={{ marginTop: "6px", maxHeight: "200px", overflowY: "auto", background: "#ffffff", borderRadius: "10px", border: "2px solid rgba(26,26,26,0.10)" }}>
              {players.filter(p => p.active !== false).map(player => {
                const assigned = getAssignedGroup(player.id);
                const inThisGroup = group.player_ids.includes(player.id);
                const blockedByOther = assigned && !inThisGroup;
                return (
                  <label
                    key={player.id}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 12px", minHeight: "48px", opacity: blockedByOther ? 0.4 : 1, cursor: blockedByOther ? "not-allowed" : "pointer", borderBottom: "1px solid rgba(26,26,26,0.06)" }}
                  >
                    <input
                      type="checkbox"
                      checked={inThisGroup}
                      disabled={blockedByOther || readOnly}
                      onChange={() => !blockedByOther && onTogglePlayer(player.id)}
                      style={{ width: "18px", height: "18px", accentColor: hex, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>{player.name}</span>
                    {assigned && !inThisGroup && (
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 800, color: colorMap[assigned.color] }}>{assigned.name}</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}