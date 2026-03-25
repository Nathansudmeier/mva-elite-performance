import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Upload } from "lucide-react";
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
      setDate(new Date().toISOString().split("T")[0]);
      setError("");
      onSaved?.();
    } catch (err) {
      setError("Fout bij opslaan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Date input */}
      <div>
        <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", marginBottom: "8px", letterSpacing: "0.10em" }}>Datum</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "2px solid #1a1a1a", fontSize: "14px", fontWeight: 600, color: "#1a1a1a", background: "#ffffff", boxSizing: "border-box" }}
        />
      </div>

      {/* Player selection grid */}
      <div>
        <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", marginBottom: "8px", letterSpacing: "0.10em" }}>Selecteer speelsters</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "2.5px solid #1a1a1a",
                background: selectedPlayers.includes(p.id) ? "#FF6800" : "#ffffff",
                color: selectedPlayers.includes(p.id) ? "#ffffff" : "#1a1a1a",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: selectedPlayers.includes(p.id) ? "2px 2px 0 #1a1a1a" : "none",
              }}
            >
              {selectedPlayers.includes(p.id) && <Check size={14} />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name?.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Photo upload */}
      <div>
        <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: "rgba(26,26,26,0.50)", marginBottom: "8px", letterSpacing: "0.10em" }}>Teamfoto</p>
        <label style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "16px 12px",
          borderRadius: "12px",
          border: "2.5px dashed #1a1a1a",
          background: "rgba(255,107,0,0.08)",
          cursor: "pointer",
          transition: "all 0.15s",
          minHeight: "56px",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,0,0.15)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,107,0,0.08)"; }}
        >
          <Upload size={16} style={{ color: "#FF6800", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: photoFile ? "#FF6800" : "rgba(26,26,26,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {photoFile ? photoFile.name : "Upload foto"}
          </span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(255,61,168,0.10)", border: "1.5px solid rgba(255,61,168,0.25)", color: "#FF3DA8", fontSize: "12px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedPlayers.length === 0}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "14px",
          border: "2.5px solid #1a1a1a",
          background: saving || selectedPlayers.length === 0 ? "rgba(255,107,0,0.45)" : "#FF6800",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 800,
          cursor: saving || selectedPlayers.length === 0 ? "not-allowed" : "pointer",
          boxShadow: saving || selectedPlayers.length === 0 ? "none" : "3px 3px 0 #1a1a1a",
          transition: "all 0.15s",
          opacity: saving || selectedPlayers.length === 0 ? 0.6 : 1,
        }}
      >
        {saving ? "Opslaan..." : `Opslaan (${selectedPlayers.length})`}
      </button>
    </div>
  );
}