import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TYPE_CONFIG, TEAM_MATCH_COLORS } from "./agendaUtils";
import { useNavigate } from "react-router-dom";

function getItemColor(item) {
  const isWedstrijd = item.type === "Wedstrijd" || item.type === "Toernooi";
  if (isWedstrijd) {
    const tc = TEAM_MATCH_COLORS[item.team] || TEAM_MATCH_COLORS["Beide"];
    return tc.cardBg;
  }
  return TYPE_CONFIG[item.type]?.bg || TYPE_CONFIG.Evenement.bg;
}

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
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, padding: "8px 12px", background: "rgba(8,208,104,0.10)", border: "1.5px solid #1a1a1a", borderRadius: 12 }}>
    <i className="ti ti-circle-check" style={{ fontSize: 16, color: "#08D068" }} />
    <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 700 }}>Aangemeld</span>
  </div>
  );
  }
  if (record?.status === "afwezig") {
  return (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(255,61,168,0.08)", border: "1.5px solid #1a1a1a", borderRadius: 12 }}>
      <i className="ti ti-circle-x" style={{ fontSize: 16, color: "#FF3DA8" }} />
      <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 700 }}>Afgemeld</span>
    </div>
    {record.notes && (
      <p style={{ fontSize: 11, color: "rgba(26,26,26,0.45)", marginLeft: 4, fontWeight: 600 }}>{record.notes}</p>
    )}
  </div>
  );
  }

  if (showReason) {
  return (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
    <textarea
      value={reason}
      onChange={e => setReason(e.target.value)}
      placeholder="Reden van afwezigheid (min. 10 tekens)..."
      rows={2}
      style={{ width: "100%", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 12, color: "#1a1a1a", padding: "8px 12px", fontSize: 13, resize: "none" }}
    />
    <div style={{ display: "flex", gap: "8px" }}>
      <button onClick={() => setShowReason(false)} style={{ flex: 1, height: 40, background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 12, color: "#1a1a1a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Terug</button>
      <button
        onClick={() => upsert.mutate({ status: "afwezig", notes: reason })}
        disabled={reason.trim().length < 10 || upsert.isPending}
        style={{ flex: 2, height: 40, background: reason.trim().length >= 10 ? "#FF3DA8" : "rgba(26,26,26,0.08)", border: "2px solid #1a1a1a", borderRadius: 12, color: reason.trim().length >= 10 ? "#ffffff" : "rgba(26,26,26,0.30)", fontSize: 12, fontWeight: 800, cursor: reason.trim().length >= 10 ? "pointer" : "not-allowed", boxShadow: reason.trim().length >= 10 ? "2px 2px 0 #1a1a1a" : "none" }}
      >
        {upsert.isPending ? "..." : "Doorgeven"}
      </button>
    </div>
  </div>
  );
  }

  return (
  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
  <button
    onClick={() => upsert.mutate({ status: "aanwezig", notes: "" })}
    disabled={upsert.isPending}
    style={{ flex: 1, height: 52, background: "#08D068", border: "2px solid #1a1a1a", borderRadius: 14, color: "#1a1a1a", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "2px 2px 0 #1a1a1a" }}
  >
    <i className="ti ti-circle-check" style={{ fontSize: 18 }} />
    Ik ben erbij
  </button>
  <button
    onClick={() => setShowReason(true)}
    style={{ flex: 1, height: 52, background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 14, color: "#1a1a1a", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "2px 2px 0 #1a1a1a" }}
  >
    <i className="ti ti-circle-x" style={{ fontSize: 18 }} />
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

  // Find first item without response, or first item if all have responses
  const firstWithoutResponse = upcoming.find(i => !myAttendance.find(a => a.agenda_item_id === i.id));
  const first = firstWithoutResponse || upcoming[0];
  const rest = upcoming.filter(i => i.id !== first.id).slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* First item - large card with buttons */}
      {first && (() => {
        const dotColor = getItemColor(first);
        const record = myAttendance.find(a => a.agenda_item_id === first.id);
        return (
          <div key={first.id} style={{ position: "relative", background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem", overflow: "hidden" }}>

            {/* Emvi inside card, top-right */}
            <img
              src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/801195afc_Emvi-hangt.png"
              alt="Emvi"
              style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, objectFit: "contain", pointerEvents: "none", zIndex: 1 }}
            />

            {/* Header label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ background: dotColor, border: "2px solid #1a1a1a", borderRadius: 8, padding: "3px 10px" }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: dotColor === "#FFD600" ? "#1a1a1a" : "#ffffff", textTransform: "uppercase", letterSpacing: "0.10em" }}>{first.type}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Volgende activiteit</span>
            </div>

            {/* Title & meta */}
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2, letterSpacing: "-0.5px", marginBottom: 6, paddingRight: 110 }}>{first.title}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i className="ti ti-calendar" style={{ fontSize: 13, color: "#FF6800" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(26,26,26,0.60)" }}>{formatShort(first.date)}</span>
              </div>
              {first.start_time && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-clock" style={{ fontSize: 13, color: "#FF6800" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(26,26,26,0.60)" }}>{first.start_time}</span>
                </div>
              )}
              {first.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 13, color: "#FF6800" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(26,26,26,0.60)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{first.location}</span>
                </div>
              )}
            </div>

            {first.type === "Training" && (
              <AttendanceButton item={first} playerId={playerId} record={record} />
            )}
          </div>
        );
      })()}

      {/* Rest items - compact list */}
      {rest.length > 0 && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "0.75rem 1rem" }}>
          {rest.map((item, idx) => {
            const dotColor = getItemColor(item);
            const record = myAttendance.find(a => a.agenda_item_id === item.id);
            let indicator = null;
            if (record?.status === "aanwezig") {
              indicator = <i className="ti ti-circle-check" style={{ fontSize: 18, color: "#08D068" }} />;
            } else if (record?.status === "afwezig") {
              indicator = <i className="ti ti-circle-x" style={{ fontSize: 18, color: "#FF3DA8" }} />;
            } else {
              indicator = <i className="ti ti-clock" style={{ fontSize: 18, color: "rgba(26,26,26,0.25)" }} />;
            }

            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: idx < rest.length - 1 ? "1.5px solid rgba(26,26,26,0.08)" : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, border: "1.5px solid #1a1a1a", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3, marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>{formatShort(item.date)}</p>
                </div>
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
          style={{ fontSize: 12, color: "#FF6800", fontWeight: 800, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Meer zien →
        </button>
      )}
    </div>
  );
}