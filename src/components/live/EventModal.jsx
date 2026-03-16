import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

export default function EventModal({ type, minute, players, substitutePlayers, onConfirm, onClose }) {
  const [step, setStep] = useState(1);
  const [scorerId, setScorerId] = useState(null);
  const [assistId, setAssistId] = useState(null);
  const [playerOutId, setPlayerOutId] = useState(null);
  const [playerInId, setPlayerInId] = useState(null);
  const [note, setNote] = useState("");

  const minuteLabel = `${Math.floor(minute / 60)}'`;

  const handleConfirm = () => {
    if (type === "goal_mva") onConfirm({ type: "goal_mva", minute: Math.floor(minute / 60), player_id: scorerId, assist_player_id: assistId || null });
    else if (type === "goal_against") onConfirm({ type: "goal_against", minute: Math.floor(minute / 60) });
    else if (type === "substitution") onConfirm({ type: "substitution", minute: Math.floor(minute / 60), player_out_id: playerOutId, player_in_id: playerInId });
    else if (type === "note") onConfirm({ type: "note", minute: Math.floor(minute / 60), note });
  };

  const PlayerList = ({ label, selected, onSelect, exclude = [] }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#2F3650" }}>{label}</p>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {players.filter(p => !exclude.includes(p.id)).map(p => (
          <button key={p.id} onClick={() => onSelect(p.id)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: selected === p.id ? "#D45A30" : "#FDE8DC", color: selected === p.id ? "#fff" : "#1A1F2E" }}>
            <span>{p.name}</span>
            {selected === p.id && <Check size={14} />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-[#FDE8DC]" style={{ backgroundColor: "#FFF5F0", color: "#1A1F2E" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#1A1F2E" }}>
            {type === "goal_mva" && `⚽ Goal MVA — ${minuteLabel}`}
            {type === "goal_against" && `🔴 Goal Tegen — ${minuteLabel}`}
            {type === "substitution" && `🔄 Wissel — ${minuteLabel}`}
            {type === "note" && `📝 Notitie — ${minuteLabel}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {type === "goal_mva" && (
            <>
              <PlayerList label="Schutter" selected={scorerId} onSelect={setScorerId} />
              <PlayerList label="Aangever (optioneel)" selected={assistId} onSelect={(id) => setAssistId(assistId === id ? null : id)} />
            </>
          )}
          {type === "goal_against" && (
            <p className="text-sm" style={{ color: "#2F3650" }}>Goal tegen opgeslagen op minuut {minuteLabel}.</p>
          )}
          {type === "substitution" && (
            <>
              <PlayerList label="Speler eruit (basiself)" selected={playerOutId} onSelect={setPlayerOutId} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#2F3650" }}>Speler erin (wissel)</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {(substitutePlayers || []).map(p => (
                    <button key={p.id} onClick={() => setPlayerInId(p.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ backgroundColor: playerInId === p.id ? "#D45A30" : "#FDE8DC", color: playerInId === p.id ? "#fff" : "#1A1F2E" }}>
                      <span>{p.name}</span>
                      {playerInId === p.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {type === "note" && (
            <Textarea
              placeholder="Tactische observatie..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border-[#FDE8DC] text-[#1A1F2E] h-24"
              style={{ backgroundColor: "#FFFFFF" }}
              autoFocus
            />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-[#FDE8DC]">Annuleren</Button>
            <Button
              onClick={handleConfirm}
              disabled={
                (type === "goal_mva" && !scorerId) ||
                (type === "substitution" && (!playerOutId || !playerInId)) ||
                (type === "note" && !note.trim())
              }
              className="flex-1 text-white"
              style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}
            >
              Bevestigen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}