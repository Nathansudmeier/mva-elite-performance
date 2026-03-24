import React, { useState } from "react";

export default function GoalBottomSheet({ players, minute, onConfirm, onClose }) {
  const [step, setStep] = useState(1); // 1 = schutter, 2 = aangever
  const [scorerId, setScorerId] = useState(null);
  const [assistId, setAssistId] = useState(null);

  const handleSelectScorer = (id) => {
    setScorerId(id);
    setStep(2);
  };

  const handleSelectAssist = (id) => {
    const aid = assistId === id ? null : id;
    setAssistId(aid);
  };

  const handleConfirm = (skipAssist = false) => {
    onConfirm({
      type: "goal_mva",
      minute,
      player_id: scorerId,
      assist_player_id: skipAssist ? null : (assistId || null),
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "transparent", zIndex: 1, pointerEvents: "auto" }} />

      {/* Sheet */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "#ffffff",
        border: "2.5px solid #1a1a1a",
        borderRadius: "24px 24px 0 0",
        padding: "20px 16px 40px",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0 -3px 0 #1a1a1a",
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,26,0.15)", margin: "0 auto 4px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#08D068" }}>
              <i className="ti ti-ball-football" style={{ fontSize: 20, marginRight: 8 }} />
              Goal — {minute}'
            </div>
            <div style={{ fontSize: 12, color: "rgba(26,26,26,0.55)", marginTop: 2 }}>
              {step === 1 ? "Stap 1 van 2: Wie scoorde?" : "Stap 2 van 2: Wie gaf assist?"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(26,26,26,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <i className="ti ti-x" style={{ fontSize: 16, color: "rgba(26,26,26,0.50)" }} />
          </button>
        </div>

        {/* Player list */}
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingRight: "4px" }}>
          {step === 2 && (
            <button
              onClick={() => handleConfirm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(26,26,26,0.04)",
                border: "1.5px solid rgba(26,26,26,0.10)",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(26,26,26,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-x" style={{ fontSize: 18, color: "rgba(26,26,26,0.40)" }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(26,26,26,0.50)" }}>Geen assist</span>
            </button>
          )}
          {players.map(p => {
            const isSelected = step === 1 ? scorerId === p.id : assistId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => step === 1 ? handleSelectScorer(p.id) : handleSelectAssist(p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  borderRadius: 12,
                  background: isSelected ? "rgba(8,208,104,0.12)" : "white",
                  border: isSelected ? "1.5px solid rgba(8,208,104,0.35)" : "1.5px solid rgba(26,26,26,0.12)",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.1s",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0f0f0", border: "1.5px solid rgba(26,26,26,0.12)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.photo_url
                    ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <i className="ti ti-user" style={{ fontSize: 18, color: "rgba(26,26,26,0.30)" }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? "#05a050" : "#1a1a1a" }}>{p.name}</div>
                  {p.position && <div style={{ fontSize: 11, color: "rgba(26,26,26,0.40)" }}>{p.position}</div>}
                </div>
                {isSelected && <i className="ti ti-check" style={{ fontSize: 18, color: "#05a050", fontWeight: 700 }} />}
              </button>
            );
          })}
        </div>

        {step === 2 && assistId && (
          <button
            onClick={() => handleConfirm(false)}
            style={{ width: "100%", height: 52, background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "3px 3px 0 #1a1a1a" }}
          >
            Bevestigen
          </button>
        )}
      </div>
    </div>
  );
}