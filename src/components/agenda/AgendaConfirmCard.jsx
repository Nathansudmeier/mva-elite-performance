import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG } from "./agendaUtils";
import { Clock, MapPin } from "lucide-react";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";

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

      {/* Attendance Buttons */}
      <div className="pt-1">
        <AttendanceButtons
          currentStatus={null}
          loading={upsert.isPending}
          showAbsentInput={showReason}
          absentReason={reason}
          onAbsentReasonChange={setReason}
          onPresent={() => upsert.mutate({ status: "aanwezig", notes: "" })}
          onAbsent={() => setShowReason(true)}
          onConfirmAbsent={() => upsert.mutate({ status: "afwezig", notes: reason })}
        />
      </div>
    </div>
  );
}