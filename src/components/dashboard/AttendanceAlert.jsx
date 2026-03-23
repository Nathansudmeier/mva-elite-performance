import React from "react";

export default function AttendanceAlert({ lowAttendancePlayers }) {
  if (!lowAttendancePlayers || lowAttendancePlayers.length === 0) {
    return null;
  }

  const playersList = lowAttendancePlayers
    .map(p => `${p.name} (${p.percentage}%)`)
    .join(", ");

  return (
    <div style={{
      background: "rgba(251,191,36,0.08)",
      border: "0.5px solid rgba(251,191,36,0.20)",
      borderRadius: "16px",
      padding: "12px 16px",
      display: "flex",
      gap: "12px",
      alignItems: "flex-start"
    }}>
      <i className="ti ti-alert-triangle" style={{ fontSize: "20px", color: "#fbbf24", flexShrink: 0, marginTop: "2px" }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#fbbf24", marginBottom: "4px" }}>
          {lowAttendancePlayers.length} speler{lowAttendancePlayers.length !== 1 ? "s" : ""} onder 60% aanwezigheid
        </p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
          {playersList}
        </p>
      </div>
    </div>
  );
}