import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG } from "./agendaUtils";
import { Clock, MapPin } from "lucide-react";

function formatDateNL(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

export default function AgendaConfirmCard({ item, playerId, existingRecord }) {
  const qc = useQueryClient();
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const upsert = useMutation({
    mutationFn: async ({ status, notes }) => {
      if (existingRecord?.id) {
        return base44.entities.AgendaAttendance.update(existingRecord.id, { status, notes });
      }
      return base44.entities.AgendaAttendance.create({
        agenda_item_id: item.id,
        player_id: playerId,
        status,
        notes: notes || "",
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries(["agenda-attendance-player", playerId]);
      qc.invalidateQueries(["agenda-attendance", item.id]);
      if (vars.status === "aanwezig") {
        setSaveMsg("✓ Je aanwezigheid is bevestigd!");
      } else {
        setSaveMsg("Bedankt, je afwezigheid is doorgegeven.");
      }
      setSaved(true);
    },
  });

  if (saved) {
    return (
      <div className="glass p-4 flex items-center gap-3" style={{ borderLeft: `3px solid ${saveMsg.includes("afwezigheid") ? "#f87171" : "#4ade80"}` }}>
        <p className="t-secondary" style={{ color: saveMsg.includes("afwezigheid") ? "#f87171" : "#4ade80" }}>{saveMsg}</p>
      </div>
    );
  }

  return (
    <div className="glass p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{item.type}</span>
      </div>
      <p className="t-card-title">{item.title}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 t-secondary">
          <Clock size={13} className="ic-muted" />
          <span>{formatDateNL(item.date)} · {item.start_time}</span>
        </div>
        {item.location && (
          <div className="flex items-center gap-1.5 t-secondary">
            <MapPin size={13} className="ic-muted" />
            <span>{item.location}</span>
          </div>
        )}
      </div>

      {/* Knoppen */}
      {!showReason && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => upsert.mutate({ status: "aanwezig", notes: "" })}
            disabled={upsert.isPending}
            style={{
              minHeight: 52,
              background: "rgba(74,222,128,0.15)",
              border: "0.5px solid rgba(74,222,128,0.25)",
              color: "#4ade80",
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Ik ben erbij
          </button>
          <button
            onClick={() => setShowReason(true)}
            style={{
              minHeight: 52,
              background: "rgba(248,113,113,0.15)",
              border: "0.5px solid rgba(248,113,113,0.25)",
              color: "#f87171",
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Ik kan niet
          </button>
        </div>
      )}

      {/* Reden veld */}
      {showReason && (
        <div className="space-y-2 pt-1">
          <label className="t-label block">Wat is de reden van je afwezigheid?</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Geef een reden op (min. 10 tekens)..."
            rows={3}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.07)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "#fff",
              padding: "10px 12px",
              fontSize: 14,
              resize: "none",
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowReason(false); setReason(""); }}
              style={{
                flex: 1, minHeight: 44, background: "rgba(255,255,255,0.07)",
                border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
                borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              Terug
            </button>
            <button
              onClick={() => upsert.mutate({ status: "afwezig", notes: reason })}
              disabled={reason.trim().length < 10 || upsert.isPending}
              style={{
                flex: 2, minHeight: 44,
                background: reason.trim().length >= 10 ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(248,113,113,0.25)",
                color: reason.trim().length >= 10 ? "#f87171" : "rgba(255,255,255,0.3)",
                borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: reason.trim().length >= 10 ? "pointer" : "not-allowed",
              }}
            >
              {upsert.isPending ? "Opslaan..." : "Afwezigheid doorgeven"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}