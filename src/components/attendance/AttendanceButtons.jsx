import React, { useState } from "react";

export default function AttendanceButtons({
  onPresent,
  onAbsent,
  currentStatus = null,
  loading = false,
  showAbsentInput = false,
  absentReason = "",
  onAbsentReasonChange = () => {},
  onConfirmAbsent = () => {}
}) {
  const [isAnimating, setIsAnimating] = useState(null);

  const handlePresentClick = () => {
    setIsAnimating("present");
    setTimeout(() => setIsAnimating(null), 150);
    onPresent();
  };

  const handleAbsentClick = () => {
    setIsAnimating("absent");
    setTimeout(() => setIsAnimating(null), 150);
    onAbsent();
  };

  const isPresentSelected = currentStatus === "aanwezig";
  const isAbsentSelected = currentStatus === "afwezig";

  return (
    <div>
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Present button */}
        <button
          onClick={handlePresentClick}
          disabled={loading}
          style={{
            flex: 1,
            height: "52px",
            borderRadius: "14px",
            background: isPresentSelected ? "#08D068" : "#ffffff",
            border: `2px solid ${isPresentSelected ? "#1a1a1a" : "rgba(26,26,26,0.20)"}`,
            boxShadow: isPresentSelected ? "2px 2px 0 #1a1a1a" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: isAbsentSelected ? 0.5 : 1,
            transition: "all 0.15s ease",
            transform: isAnimating === "present" ? "scale(0.97)" : "scale(1)",
          }}
        >
          <i className="ti ti-circle-check" style={{ fontSize: "20px", color: isPresentSelected ? "#1a1a1a" : "#08D068" }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: isPresentSelected ? "#1a1a1a" : "#08D068" }}>Ik ben erbij</span>
        </button>

        {/* Absent button */}
        <button
          onClick={handleAbsentClick}
          disabled={loading}
          style={{
            flex: 1,
            height: "52px",
            borderRadius: "14px",
            background: isAbsentSelected ? "#FF3DA8" : "#ffffff",
            border: `2px solid ${isAbsentSelected ? "#1a1a1a" : "rgba(26,26,26,0.20)"}`,
            boxShadow: isAbsentSelected ? "2px 2px 0 #1a1a1a" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: isPresentSelected ? 0.5 : 1,
            transition: "all 0.15s ease",
            transform: isAnimating === "absent" ? "scale(0.97)" : "scale(1)",
          }}
        >
          <i className="ti ti-circle-x" style={{ fontSize: "20px", color: isAbsentSelected ? "#ffffff" : "#FF3DA8" }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: isAbsentSelected ? "#ffffff" : "#FF3DA8" }}>Ik kan niet</span>
        </button>
      </div>

      {/* Absent reason input */}
      {showAbsentInput && (
        <div style={{
          marginTop: "12px",
          padding: "14px",
          borderRadius: "14px",
          background: "rgba(255,61,168,0.06)",
          border: "2px solid rgba(26,26,26,0.12)"
        }}>
          <label style={{ display: "block", fontSize: 9, fontWeight: 800, color: "rgba(26,26,26,0.55)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.10em" }}>
            Reden (optioneel)
          </label>
          <input
            type="text"
            value={absentReason}
            onChange={(e) => onAbsentReasonChange(e.target.value)}
            placeholder="Bijv. geblesseerd, school..."
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "10px",
              fontSize: "13px",
              background: "#ffffff",
              border: "2px solid #1a1a1a",
              color: "#1a1a1a",
              outline: "none",
              marginBottom: "10px",
              boxSizing: "border-box",
              fontWeight: 500,
            }}
          />
          <button
            onClick={onConfirmAbsent}
            disabled={loading}
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 800,
              background: "#FF3DA8",
              color: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "2px 2px 0 #1a1a1a",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Bevestigen..." : "Bevestig afmelding"}
          </button>
        </div>
      )}
    </div>
  );
}