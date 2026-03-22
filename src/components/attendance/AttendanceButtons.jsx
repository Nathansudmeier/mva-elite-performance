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
            height: "56px",
            borderRadius: "16px",
            background: isPresentSelected ? "rgba(74,222,128,0.20)" : "rgba(74,222,128,0.12)",
            border: `0.5px solid ${isPresentSelected ? "rgba(74,222,128,0.40)" : "rgba(74,222,128,0.25)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: isAbsentSelected ? 0.4 : 1,
            transition: "all 0.2s ease",
            position: "relative",
            transform: isAnimating === "present" ? "scale(0.96)" : "scale(1)",
          }}
        >
          <i className="ti ti-circle-check" style={{ fontSize: "24px", color: "#4ade80" }} />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#4ade80" }}>Ik ben erbij</span>
          {isPresentSelected && (
            <div style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#4ade80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(74,222,128,0.3)"
            }}>
              <i className="ti ti-check" style={{ fontSize: "10px", color: "#fff", fontWeight: 700 }} />
            </div>
          )}
        </button>

        {/* Absent button */}
        <button
          onClick={handleAbsentClick}
          disabled={loading}
          style={{
            flex: 1,
            height: "56px",
            borderRadius: "16px",
            background: isAbsentSelected ? "rgba(248,113,113,0.20)" : "rgba(248,113,113,0.12)",
            border: `0.5px solid ${isAbsentSelected ? "rgba(248,113,113,0.40)" : "rgba(248,113,113,0.25)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: isPresentSelected ? 0.4 : 1,
            transition: "all 0.2s ease",
            position: "relative",
            transform: isAnimating === "absent" ? "scale(0.96)" : "scale(1)",
          }}
        >
          <i className="ti ti-circle-x" style={{ fontSize: "24px", color: "#f87171" }} />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#f87171" }}>Ik kan niet</span>
          {isAbsentSelected && (
            <div style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#f87171",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(248,113,113,0.3)"
            }}>
              <i className="ti ti-x" style={{ fontSize: "10px", color: "#fff", fontWeight: 700 }} />
            </div>
          )}
        </button>
      </div>

      {/* Absent reason input (when selected) */}
      {showAbsentInput && isAbsentSelected && (
        <div style={{
          marginTop: "12px",
          padding: "12px",
          borderRadius: "12px",
          background: "rgba(248,113,113,0.07)",
          border: "0.5px solid rgba(248,113,113,0.20)"
        }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Reden (optioneel)
          </label>
          <input
            type="text"
            value={absentReason}
            onChange={(e) => onAbsentReasonChange(e.target.value)}
            placeholder="Bijv. geblesseerd, school..."
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "10px",
              fontSize: "13px",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              color: "#fff",
              outline: "none",
              marginBottom: "10px",
              boxSizing: "border-box"
            }}
          />
          <button
            onClick={onConfirmAbsent}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              background: "#f87171",
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Bevestigen..." : "Bevestig afmelding"}
          </button>
        </div>
      )}
    </div>
  );
}