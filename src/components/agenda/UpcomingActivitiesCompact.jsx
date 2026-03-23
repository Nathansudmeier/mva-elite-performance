import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG } from "./agendaUtils";
import { useNavigate } from "react-router-dom";

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
      <button
        onClick={() => upsert.mutate({ status: "onbekend", notes: "" })}
        disabled={upsert.isPending}
        style={{ height: 56, width: 56, borderRadius: 16, background: "rgba(74,222,128,0.15)", border: "0.5px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
      >
        <i className="ti ti-circle-check" style={{ fontSize: 24, color: "#4ade80" }} />
      </button>
    );
  }
  if (record?.status === "afwezig") {
    return (
      <button
        onClick={() => upsert.mutate({ status: "onbekend", notes: "" })}
        disabled={upsert.isPending}
        style={{ height: 56, width: 56, borderRadius: 16, background: "rgba(248,113,113,0.15)", border: "0.5px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
      >
        <i className="ti ti-circle-x" style={{ fontSize: 24, color: "#f87171" }} />
      </button>
    );
  }

  if (showReason) {
    return (
      <div className="w-full space-y-1.5 mt-2">
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
    <div className="flex gap-1.5 mt-2 w-full">
      <button
        onClick={() => upsert.mutate({ status: "aanwezig", notes: "" })}
        disabled={upsert.isPending}
        style={{ flex: 1, height: 56, background: "rgba(74,222,128,0.15)", border: "0.5px solid rgba(74,222,128,0.25)", borderRadius: 16, color: "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="ti ti-circle-check" style={{ fontSize: 20 }} />
        Ik ben erbij
      </button>
      <button
        onClick={() => setShowReason(true)}
        style={{ flex: 1, height: 56, background: "rgba(248,113,113,0.15)", border: "0.5px solid rgba(248,113,113,0.25)", borderRadius: 16, color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="ti ti-circle-x" style={{ fontSize: 20 }} />
        Ik kan niet
      </button>
    </div>
  );
}

export default function UpcomingActivitiesCompact({ playerId }) {
  const navigate = useNavigate();
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
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!upcoming.length) return null;

  const first = upcoming[0];
  const rest = upcoming.slice(1, 4);

  return (
    <div className="space-y-3">
      {/* Label */}
      <p className="t-label">Volgende activiteit</p>

      {/* First item - large card with buttons */}
      {first && (() => {
        const cfg = TYPE_CONFIG[first.type] || TYPE_CONFIG.Evenement;
        const record = myAttendance.find(a => a.agenda_item_id === first.id);
        return (
          <div key={first.id} className="glass p-4">
            <div className="flex items-start gap-3">
              {/* Type dot */}
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: cfg.color, flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{first.type}</span>
                <p className="t-card-title mt-1.5">{first.title}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 4 }}>
                  {formatShort(first.date)} · {first.start_time}
                </p>
              </div>
            </div>
            <AttendanceButton item={first} playerId={playerId} record={record} />
          </div>
        );
      })()}

      {/* Rest items - compact list */}
      {rest.length > 0 && (
        <div className="glass p-3 space-y-0">
          {rest.map(item => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Evenement;
            const record = myAttendance.find(a => a.agenda_item_id === item.id);
            let indicator = null;
            if (record?.status === "aanwezig") {
              indicator = <i className="ti ti-circle-check" style={{ fontSize: 16, color: "#4ade80" }} />;
            } else if (record?.status === "afwezig") {
              indicator = <i className="ti ti-circle-x" style={{ fontSize: 16, color: "#f87171" }} />;
            } else {
              indicator = <i className="ti ti-clock" style={{ fontSize: 16, color: "rgba(255,255,255,0.30)" }} />;
            }

            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: item.id !== rest[rest.length - 1].id ? "0.5px solid rgba(255,255,255,0.06)" : "none", height: 52 }}>
                {/* Type dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                {/* Title + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", lineHeight: 1.3, marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{formatShort(item.date)}</p>
                </div>
                {/* Status indicator */}
                {indicator}
              </div>
            );
          })}
        </div>
      )}

      {/* More link */}
      {upcoming.length > 4 && (
        <button
          onClick={() => navigate("/Planning")}
          style={{ fontSize: 12, color: "#FF8C3A", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Meer zien →
        </button>
      )}
    </div>
  );
}