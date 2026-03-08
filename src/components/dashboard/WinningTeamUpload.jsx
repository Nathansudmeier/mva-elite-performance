import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Check, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WinningTeamUpload({ players, onSaved }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const togglePlayer = (id) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedPlayers.length === 0) return;
    setSaving(true);
    let photo_url = "";
    if (photoFile) {
      const res = await base44.integrations.Core.UploadFile({ file: photoFile });
      photo_url = res.file_url;
    }
    await base44.entities.WinningTeam.create({
      date,
      winning_player_ids: selectedPlayers,
      photo_url,
    });
    setSelectedPlayers([]);
    setPhotoFile(null);
    setSaving(false);
    onSaved?.();
  };

  return (
    <div className="elite-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#1a3a8f]/20 flex items-center justify-center">
          <Camera size={20} className="text-[#1a3a8f]" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Winnend Team</h2>
          <p className="text-xs text-[#a0a0a0]">Registreer het winnende team van vandaag</p>
        </div>
      </div>

      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 bg-[#0a0a0a] border-[#333] text-white"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePlayer(p.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              selectedPlayers.includes(p.id)
                ? "bg-[#FF6B00] text-white"
                : "bg-[#0a0a0a] text-[#a0a0a0] hover:bg-[#1a1a1a]"
            }`}
          >
            {selectedPlayers.includes(p.id) && <Check size={14} />}
            <span className="truncate">{p.name?.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#333] bg-[#0a0a0a] cursor-pointer hover:border-[#FF6B00] transition-colors mb-4">
        <Upload size={16} className="text-[#a0a0a0]" />
        <span className="text-sm text-[#a0a0a0]">
          {photoFile ? photoFile.name : "Upload teamfoto"}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
      </label>

      <Button
        onClick={handleSave}
        disabled={saving || selectedPlayers.length === 0}
        className="w-full bg-[#FF6B00] hover:bg-[#e06000] text-white font-semibold"
      >
        {saving ? "Opslaan..." : `Opslaan (${selectedPlayers.length} speelsters)`}
      </Button>
    </div>
  );
}