import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Check, Upload, X } from "lucide-react";
import { resizeImage } from "@/components/utils/imageResize";
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
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor:'#FDE8DC'}}>
          <Camera size={20} style={{color:'#D45A30'}} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1A1F2E]">Winnend Team</h2>
          <p className="text-xs text-[#2F3650]">Registreer het winnende team van vandaag</p>
        </div>
      </div>

      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 border-[#FDE8DC] text-[#1A1F2E]"
        style={{backgroundColor:'#FFF5F0'}}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePlayer(p.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-medium ${
              selectedPlayers.includes(p.id)
                ? "text-white"
                : "text-[#1A1F2E] hover:opacity-80"
            }`}
            style={selectedPlayers.includes(p.id) ? {backgroundColor:'#D45A30'} : {backgroundColor:'#FDE8DC'}}
          >
            {selectedPlayers.includes(p.id) && <Check size={14} />}
            <span className="truncate">{p.name?.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed cursor-pointer transition-colors mb-4" style={{borderColor:'#FDE8DC', backgroundColor:'#FFF5F0', color:'#2F3650'}}>
        <Upload size={16} style={{color:'#D45A30'}} />
        <span className="text-sm">
          {photoFile ? photoFile.name : "Upload teamfoto"}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
      </label>

      <Button
        onClick={handleSave}
        disabled={saving || selectedPlayers.length === 0}
        className="w-full text-white font-semibold"
        style={{backgroundColor:'#D45A30'}}
      >
        {saving ? "Opslaan..." : `Opslaan (${selectedPlayers.length} speelsters)`}
      </Button>
    </div>
  );
}