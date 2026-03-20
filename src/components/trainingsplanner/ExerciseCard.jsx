import React, { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, X, GripVertical, Camera, Pencil } from "lucide-react";
import FieldWhiteboard from "./FieldWhiteboard";
import { base44 } from "@/api/base44Client";

const GROUP_COLORS = [
  { id: "red", label: "Rood", hex: "#f87171" },
  { id: "orange", label: "Oranje", hex: "#FF8C3A" },
  { id: "yellow", label: "Geel", hex: "#fbbf24" },
  { id: "green", label: "Groen", hex: "#4ade80" },
  { id: "blue", label: "Blauw", hex: "#60a5fa" },
  { id: "white", label: "Wit", hex: "#ffffff" },
];

function isMobile() {
  return window.innerWidth < 768;
}

export default function ExerciseCard({ exercise, players, onChange, onRemove, dragHandleProps }) {
  const [expanded, setExpanded] = useState(true);
  const [newPoint, setNewPoint] = useState("");
  const [mobile] = useState(isMobile);
  const [diagramMode, setDiagramMode] = useState(exercise.field_photo ? "photo" : "draw");
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
    // Remove from all groups first
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

  // Collapsed pill summary
  const groupPills = groups.map(g => (
    <span key={g.id} style={{ background: colorMap[g.color] + "30", border: `0.5px solid ${colorMap[g.color]}`, borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, color: colorMap[g.color], whiteSpace: "nowrap" }}>
      {g.name} {g.player_ids.length}
    </span>
  ));

  return (
    <div style={{ background: "rgba(255,255,255,0.09)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "0.5px solid rgba(255,255,255,0.18)", borderRadius: "22px", overflow: "hidden", marginBottom: "10px", position: "relative" }}>
      {/* Shine line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 16px" }}>
        <div {...dragHandleProps} style={{ cursor: "grab", color: "rgba(255,255,255,0.30)", flexShrink: 0 }}>
          <GripVertical size={16} />
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>{exercise.name || "Naamloze oefening"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
            {exercise.duration_minutes > 0 && (
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{exercise.duration_minutes} min</span>
            )}
            <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap", overflowX: mobile ? "auto" : "visible" }}>
              {groupPills}
            </div>
          </div>
        </button>
        <button onClick={onRemove} style={{ background: "rgba(248,113,113,0.12)", border: "0.5px solid rgba(248,113,113,0.25)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <X size={14} color="#f87171" />
        </button>
        <button onClick={() => setExpanded(e => !e)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} color="rgba(255,255,255,0.6)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.6)" />}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Name & Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "8px", marginBottom: "10px" }}>
            <div>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Naam</p>
              <input
                value={exercise.name || ""}
                onChange={e => update({ name: e.target.value })}
                placeholder="Naam oefenvorm..."
                style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", minHeight: "44px" }}
              />
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Min</p>
              <input
                type="number"
                min="1"
                max="90"
                value={exercise.duration_minutes || ""}
                onChange={e => update({ duration_minutes: Number(e.target.value) })}
                placeholder="10"
                style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", minHeight: "44px" }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Beschrijving</p>
            <textarea
              value={exercise.description || ""}
              onChange={e => update({ description: e.target.value })}
              placeholder="Beschrijf de oefenvorm..."
              rows={2}
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", resize: "vertical" }}
            />
          </div>

          {/* Coaching points */}
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Coaching points</p>
            {(exercise.coaching_points || []).map((pt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ color: "#FF8C3A", fontSize: "14px" }}>•</span>
                <span style={{ flex: 1, fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>{pt}</span>
                <button onClick={() => removeCoachPoint(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: "2px" }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
              <input
                value={newPoint}
                onChange={e => setNewPoint(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCoachPoint()}
                placeholder="Nieuw coaching point..."
                style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", color: "#fff", outline: "none", minHeight: "44px" }}
              />
              <button onClick={addCoachPoint} style={{ background: "rgba(255,107,0,0.20)", border: "0.5px solid rgba(255,107,0,0.35)", borderRadius: "8px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Plus size={16} color="#FF8C3A" />
              </button>
            </div>
          </div>

          {/* Field whiteboard / photo */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Velddiagram</p>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setDiagramMode("draw")}
                  style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: diagramMode === "draw" ? "#FF6B00" : "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: diagramMode === "draw" ? "#fff" : "rgba(255,255,255,0.55)", minHeight: "32px" }}
                >
                  <Pencil size={11} /> Tekenen
                </button>
                <button
                  onClick={() => setDiagramMode("photo")}
                  style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: diagramMode === "photo" ? "#FF6B00" : "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: diagramMode === "photo" ? "#fff" : "rgba(255,255,255,0.55)", minHeight: "32px" }}
                >
                  <Camera size={11} /> Foto
                </button>
              </div>
            </div>

            {diagramMode === "draw" ? (
              <FieldWhiteboard
                value={exercise.field_drawing}
                onChange={val => update({ field_drawing: val })}
                mobile={mobile}
              />
            ) : (
              <div>
                {exercise.field_photo ? (
                  <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
                    <img src={exercise.field_photo} alt="Velddiagram" style={{ width: "100%", borderRadius: "12px", display: "block" }} />
                    <button
                      onClick={() => { update({ field_photo: null }); fileInputRef.current && (fileInputRef.current.value = ""); }}
                      style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={14} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ width: "100%", minHeight: "100px", background: "rgba(255,255,255,0.05)", border: "0.5px dashed rgba(255,255,255,0.20)", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: "13px" }}
                  >
                    <Camera size={24} color="rgba(255,255,255,0.35)" />
                    {uploading ? "Uploaden..." : "Foto uploaden"}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
              </div>
            )}
          </div>

          {/* Groups */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Spelersgroepen</p>
              {groups.length < 4 && (
                <button onClick={addGroup} style={{ fontSize: "11px", color: "#FF8C3A", background: "rgba(255,107,0,0.12)", border: "0.5px solid rgba(255,107,0,0.25)", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", minHeight: "30px" }}>
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
                mobile={mobile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupEditor({ group, players, colorMap, getAssignedGroup, onChange, onRemove, onTogglePlayer, mobile }) {
  const [showPlayers, setShowPlayers] = useState(false);

  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: `0.5px solid ${colorMap[group.color]}40`, borderRadius: "14px", padding: "10px 12px", marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <input
          value={group.name}
          onChange={e => onChange({ name: e.target.value })}
          style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", color: "#fff", outline: "none", minHeight: "44px" }}
        />
        <button onClick={onRemove} style={{ background: "rgba(248,113,113,0.10)", border: "0.5px solid rgba(248,113,113,0.20)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <X size={13} color="#f87171" />
        </button>
      </div>

      {/* Color picker */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
        {[
          { id: "red", hex: "#f87171" }, { id: "orange", hex: "#FF8C3A" }, { id: "yellow", hex: "#fbbf24" },
          { id: "green", hex: "#4ade80" }, { id: "blue", hex: "#60a5fa" }, { id: "white", hex: "#ffffff" },
        ].map(c => (
          <button
            key={c.id}
            onClick={() => onChange({ color: c.id })}
            style={{ width: mobile ? "44px" : "28px", height: mobile ? "44px" : "28px", borderRadius: "50%", background: c.hex, border: group.color === c.id ? "3px solid #fff" : "2px solid rgba(255,255,255,0.15)", cursor: "pointer", flexShrink: 0 }}
          />
        ))}
      </div>

      {/* Player toggle button */}
      <button
        onClick={() => setShowPlayers(s => !s)}
        style={{ fontSize: "12px", color: "rgba(255,255,255,0.60)", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", width: "100%", textAlign: "left", minHeight: "44px" }}
      >
        {group.player_ids.length > 0 ? `${group.player_ids.length} speler(s) geselecteerd` : "Spelers selecteren"} {showPlayers ? "▲" : "▼"}
      </button>

      {showPlayers && (
        <div style={{ marginTop: "6px", maxHeight: "200px", overflowY: "auto" }}>
          {players.filter(p => p.active !== false).map(player => {
            const assigned = getAssignedGroup(player.id);
            const inThisGroup = group.player_ids.includes(player.id);
            const blockedByOther = assigned && !inThisGroup;
            return (
              <label
                key={player.id}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 4px", minHeight: "52px", opacity: blockedByOther ? 0.4 : 1, cursor: blockedByOther ? "not-allowed" : "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
              >
                <input
                  type="checkbox"
                  checked={inThisGroup}
                  disabled={blockedByOther}
                  onChange={() => !blockedByOther && onTogglePlayer(player.id)}
                  style={{ width: "20px", height: "20px", accentColor: colorMap[group.color], flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: "#fff" }}>{player.name}</span>
                {assigned && !inThisGroup && (
                  <span style={{ marginLeft: "auto", fontSize: "10px", color: colorMap[assigned.color] }}>{assigned.name}</span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}