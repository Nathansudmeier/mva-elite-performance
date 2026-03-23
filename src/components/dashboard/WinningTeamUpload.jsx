import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Check, Upload } from "lucide-react";
import { resizeImage } from "@/components/utils/imageResize";

export default function WinningTeamUpload({ players, onSaved }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const togglePlayer = (id) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedPlayers.length === 0) {
      setError("Selecteer minimaal één speelster");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let photo_url = "";
      if (photoFile) {
        const resized = await resizeImage(photoFile);
        const res = await base44.integrations.Core.UploadFile({ file: resized });
        photo_url = res.file_url;
      }
      await base44.entities.WinningTeam.create({
        date,
        winning_player_ids: selectedPlayers,
        photo_url,
      });
      setSelectedPlayers([]);
      setPhotoFile(null);
      setError("");
      onSaved?.();
    } catch (err) {
      setError("Fout bij opslaan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-dark rounded-2xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,107,0,0.15)" }}>
          <Camera size={20} style={{ color: "#FF8C3A" }} />
        </div>
        <div>
          <h2 className="t-card-title">Winnend Team</h2>
          <p className="t-tertiary text-xs">Registreer het winnende team</p>
        </div>
      </div>

      {/* Date input */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full mb-4 px-3 py-2 rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.12)", color: "#fff" }}
      />

      {/* Player selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePlayer(p.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: selectedPlayers.includes(p.id) ? "rgba(255,107,0,0.25)" : "rgba(255,255,255,0.06)",
              border: selectedPlayers.includes(p.id) ? "0.5px solid rgba(255,107,0,0.4)" : "0.5px solid rgba(255,255,255,0.1)",
              color: selectedPlayers.includes(p.id) ? "#FF8C3A" : "rgba(255,255,255,0.7)"
            }}
          >
            {selectedPlayers.includes(p.id) && <Check size={14} />}
            <span className="truncate">{p.name?.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Photo upload */}
      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors mb-4"
        style={{ borderColor: "rgba(255,107,0,0.3)", background: "rgba(255,107,0,0.08)" }}>
        <Upload size={16} style={{ color: "#FF8C3A" }} />
        <span className="t-secondary text-xs md:text-sm truncate">
          {photoFile ? photoFile.name : "Upload teamfoto"}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
      </label>

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 rounded-lg mb-4" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", fontSize: "12px" }}>
          {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedPlayers.length === 0}
        className="w-full py-3 rounded-xl font-semibold transition-opacity text-white text-sm"
        style={{
          background: saving || selectedPlayers.length === 0 ? "rgba(255,107,0,0.4)" : "#FF6B00",
          opacity: saving || selectedPlayers.length === 0 ? 0.6 : 1,
          cursor: saving || selectedPlayers.length === 0 ? "not-allowed" : "pointer"
        }}
      >
        {saving ? "Opslaan..." : `Opslaan (${selectedPlayers.length})`}
      </button>
    </div>
  );
}