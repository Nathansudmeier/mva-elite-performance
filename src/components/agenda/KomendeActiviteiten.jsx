import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG } from "./agendaUtils";
import { Clock, MapPin, Check, X } from "lucide-react";

function formatShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

function AttendanceButton({ item, playerId, record }) {
  const qc = useQueryClient();
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  const upsert = useMutation({
    mutationFn: async ({ status, notes }) => {
      if (record?.id) return base44.entities.AgendaAttendance.update(record.id, { status, notes });
      return base44.entities.AgendaAttendance.create({ agenda_item_id: item.id, player_id: playerId, status, notes: notes || "" });
    },
    onSuccess: () => {
      qc.invalidateQueries(["agenda-attendance-player", playerId]);
      qc.invalidateQueries(["agenda-attendance", item.id]);
    },
  });

  if (record?.status === "aanwezig") {
    return (
      <div className="flex items-center gap-1" style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>
        <Check size={14} /> Erbij
      </div>
    );
  }
  if (record?.status === "afwezig") {
    return (
      <div className="flex items-center gap-1" style={{ color: "#f87171", fontSize: 12, fontWeight: 600 }}>
        <X size={14} /> Afgemeld
      </div>
    );
  }

  if (showReason) {
    return (
      <div className="space-y-1.5 w-full mt-2">
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reden van afwezigheid (min. 10 tekens)..."
          rows={2}
          style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "7px 10px", fontSize: 12, resize: "none" }}
        />
        <div className="flex gap-1.5">
          <button onClick={() => setShowReason(false)} style={{ flex: 1, height: 32, background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Terug</button>
          <button
            onClick={() => upsert.mutate({ status: "afwezig", notes: reason })}
            disabled={reason.trim().length < 10 || upsert.isPending}
            style={{ flex: 2, height: 32, background: "rgba(248,113,113,0.15)", border: "0.5px solid rgba(248,113,113,0.25)", borderRadius: 8, color: reason.trim().length >= 10 ? "#f87171" : "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, cursor: reason.trim().length >= 10 ? "pointer" : "not-allowed" }}
          >
            {upsert.isPending ? "..." : "Doorgeven"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 mt-2">
      <button
        onClick={() => upsert.mutate({ status: "aanwezig", notes: "" })}
        disabled={upsert.isPending}
        style={{ flex: 1, height: 36, background: "rgba(74,222,128,0.15)", border: "0.5px solid rgba(74,222,128,0.25)", borderRadius: 10, color: "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
      >
        Ik ben erbij
      </button>
      <button
        onClick={() => setShowReason(true)}
        style={{ flex: 1, height: 36, background: "rgba(248,113,113,0.15)", border: "0.5px solid rgba(248,113,113,0.25)", borderRadius: 10, color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
      >
        Ik kan niet
      </button>
    </div>
  );
}

export default function KomendeActiviteiten({ playerId }) {
  const today = new Date().toISOString().split("T")[0];

  const { data: allItems = [] } = useQuery({
    queryKey: ["agendaItems-upcoming"],
    queryFn: () => base44.entities.AgendaItem.list(),
  });

  const { data: myAttendance = [] } = useQuery({
    queryKey: ["agenda-attendance-player", playerId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const upcoming = [...allItems]
    .filter(i => i.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (!upcoming.length) return null;

  return (
    <div className="space-y-3">
      <p className="t-label">Komende activiteiten</p>
      {upcoming.map(item => {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
        const record = myAttendance.find(a => a.agenda_item_id === item.id);
        return (
          <div key={item.id} className="glass p-3">
            <div className="flex items-start gap-3">
              {/* Type indicator */}
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: cfg.color, minHeight: 36 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.type}</span>
                  </div>
                  <AttendanceButton item={item} playerId={playerId} record={record} />
                </div>
                <p className="t-card-title mt-0.5 truncate">{item.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 t-secondary-sm">
                    <Clock size={11} className="ic-muted" />
                    <span>{formatShort(item.date)} · {item.start_time}</span>
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1 t-secondary-sm">
                      <MapPin size={11} className="ic-muted" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                </div>
                {/* Render reason textarea inside if shown */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}