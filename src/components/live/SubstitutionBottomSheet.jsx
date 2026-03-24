import React, { useState } from "react";

export default function SubstitutionBottomSheet({ fieldPlayers, benchPlayers, minute, onConfirm, onClose }) {
  const [step, setStep] = useState(1); // 1 = eruit, 2 = erin
  const [playerOutId, setPlayerOutId] = useState(null);

  const handleSelectOut = (id) => {
    setPlayerOutId(id);
    setStep(2);
  };

  const handleSelectIn = (id) => {
    onConfirm({
      type: "substitution",
      minute,
      player_out_id: playerOutId,
      player_in_id: id,
    });
  };

  const currentList = step === 1 ? fieldPlayers : benchPlayers;
  const listEmpty = currentList.length === 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }} />

      <div style={{
        position: "relative",
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
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,26,0.15)", margin: "0 auto 4px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#FF6800" }}>
              <i className="ti ti-arrows-exchange" style={{ fontSize: 20, marginRight: 8 }} />
              Wissel — {minute}'
            </div>
            <div style={{ fontSize: 12, color: "rgba(26,26,26,0.55)", marginTop: 2 }}>
              {step === 1 ? "Stap 1 van 2: Wie gaat eraf?" : "Stap 2 van 2: Wie komt erin?"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(26,26,26,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <i className="ti ti-x" style={{ fontSize: 16, color: "rgba(26,26,26,0.50)" }} />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingRight: "4px" }}>
          {listEmpty && (
            <p style={{ textAlign: "center", color: "rgba(26,26,26,0.40)", fontSize: 14, padding: "20px 0" }}>
              {step === 2 ? "Geen wisselspelers beschikbaar" : "Geen spelers op het veld"}
            </p>
          )}
          {currentList.map(p => (
            <button
              key={p.id}
              onClick={() => step === 1 ? handleSelectOut(p.id) : handleSelectIn(p.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 12,
                background: "white",
                border: "1.5px solid rgba(26,26,26,0.12)",
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
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{p.name}</div>
                {p.position && <div style={{ fontSize: 11, color: "rgba(26,26,26,0.40)" }}>{p.position}</div>}
              </div>
              <i className={`ti ti-${step === 1 ? "minus" : "plus"}`} style={{ fontSize: 18, color: step === 1 ? "#FF3DA8" : "#08D068", fontWeight: 700 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}