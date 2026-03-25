import React, { useState } from "react";
import { Edit2, Goal } from "lucide-react";

// Shared backdrop
function ModalBackdrop({ onClick }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(0,0,0,0.40)", 
        zIndex: 200,
        pointerEvents: "auto"
      }} 
    />
  );
}

// NoteModal
export function NoteModal({ minute, onConfirm, onClose }) {
  const [note, setNote] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none" }}>
      <ModalBackdrop onClick={onClose} />
      
      <div 
        style={{ 
          position: "relative",
          zIndex: 301,
          background: "white",
          border: "2.5px solid #1a1a1a",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "500px",
          padding: "24px",
          paddingBottom: "max(24px, calc(24px + env(safe-area-inset-bottom)))",
          maxHeight: "90vh",
          overflowY: "auto",
          pointerEvents: "auto"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <Edit2 size={18} color="#FF6800" strokeWidth={3} />
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>Notitie</div>
            <div style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>Minuut {minute}</div>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          placeholder="Tactische observatie..."
          value={note}
          onChange={e => setNote(e.target.value)}
          autoFocus
          rows={5}
          style={{
            width: "100%",
            padding: "12px",
            border: "2.5px solid #1a1a1a",
            borderRadius: "14px",
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "none",
            marginBottom: "16px",
            boxSizing: "border-box"
          }}
        />

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              height: "48px",
              background: "white",
              border: "2.5px solid #1a1a1a",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a1a",
              cursor: "pointer",
              transition: "all 0.1s"
            }}
          >
            Annuleren
          </button>
          <button 
            onClick={() => {
              if (note.trim()) {
                onConfirm({ type: "note", minute, note });
              }
            }}
            disabled={!note.trim()}
            style={{
              flex: 1,
              height: "48px",
              background: note.trim() ? "#FF6800" : "#ccc",
              border: "2.5px solid #1a1a1a",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 700,
              color: "white",
              cursor: note.trim() ? "pointer" : "not-allowed",
              transition: "all 0.1s",
              boxShadow: note.trim() ? "3px 3px 0 #1a1a1a" : "none"
            }}
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

// GoalAgainstModal
export function GoalAgainstModal({ minute, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none" }}>
      <ModalBackdrop onClick={onClose} />
      
      <div 
        style={{ 
          position: "relative",
          zIndex: 301,
          background: "white",
          border: "2.5px solid #1a1a1a",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "500px",
          padding: "24px",
          paddingBottom: "max(24px, calc(24px + env(safe-area-inset-bottom)))",
          textAlign: "center",
          pointerEvents: "auto"
        }}
      >
        {/* Emoji */}
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>⚽</div>

        {/* Header */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#FF3DA8", marginBottom: "4px" }}>Goal Tegen</div>
          <div style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)" }}>Minuut {minute}</div>
        </div>

        {/* Description */}
        <p style={{ fontSize: "14px", color: "rgba(26,26,26,0.65)", marginBottom: "20px" }}>
          Goal registreren op minuut {minute}?
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              height: "48px",
              background: "white",
              border: "2.5px solid #1a1a1a",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a1a",
              cursor: "pointer",
              transition: "all 0.1s"
            }}
          >
            Annuleren
          </button>
          <button 
            onClick={() => onConfirm({ type: "goal_against", minute })}
            style={{
              flex: 1,
              height: "48px",
              background: "#FF3DA8",
              border: "2.5px solid #1a1a1a",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 700,
              color: "white",
              cursor: "pointer",
              boxShadow: "3px 3px 0 #1a1a1a",
              transition: "all 0.1s"
            }}
          >
            Bevestigen
          </button>
        </div>
      </div>
    </div>
  );
}

// YellowCardModal
export function YellowCardModal({ minute, onConfirm, onClose, players }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none" }}>
      <ModalBackdrop onClick={onClose} />
      
      <div 
        style={{ 
          position: "relative",
          zIndex: 301,
          background: "white",
          border: "2.5px solid #1a1a1a",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "500px",
          padding: "24px",
          paddingBottom: "max(24px, calc(24px + env(safe-area-inset-bottom)))",
          maxHeight: "90vh",
          overflowY: "auto",
          pointerEvents: "auto"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>🟨</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>Gele Kaart</div>
            <div style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>Minuut {minute}</div>
          </div>
        </div>

        {/* Player grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "16px", maxHeight: "240px", overflowY: "auto" }}>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlayer(p.id);
                onConfirm({ type: "yellow_card", minute, player_id: p.id });
              }}
              style={{
                padding: "12px",
                background: selectedPlayer === p.id ? "#FFD600" : "white",
                border: "2.5px solid #1a1a1a",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "12px",
                color: "#1a1a1a",
                cursor: "pointer",
                transition: "all 0.1s",
                boxShadow: selectedPlayer === p.id ? "3px 3px 0 #1a1a1a" : "none",
                pointerEvents: "auto"
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <button 
          onClick={onClose}
          style={{
            width: "100%",
            height: "48px",
            background: "white",
            border: "2.5px solid #1a1a1a",
            borderRadius: "14px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#1a1a1a",
            cursor: "pointer",
            transition: "all 0.1s"
          }}
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

// RedCardModal
export function RedCardModal({ minute, onConfirm, onClose, players }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none" }}>
      <ModalBackdrop onClick={onClose} />
      
      <div 
        style={{ 
          position: "relative",
          zIndex: 301,
          background: "white",
          border: "2.5px solid #1a1a1a",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "500px",
          padding: "24px",
          paddingBottom: "max(24px, calc(24px + env(safe-area-inset-bottom)))",
          maxHeight: "90vh",
          overflowY: "auto",
          pointerEvents: "auto"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>🟥</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>Rode Kaart</div>
            <div style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>Minuut {minute}</div>
          </div>
        </div>

        {/* Player grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "16px", maxHeight: "240px", overflowY: "auto" }}>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlayer(p.id);
                onConfirm({ type: "red_card", minute, player_id: p.id });
              }}
              style={{
                padding: "12px",
                background: selectedPlayer === p.id ? "#FF3B30" : "white",
                border: "2.5px solid #1a1a1a",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "12px",
                color: selectedPlayer === p.id ? "white" : "#1a1a1a",
                cursor: "pointer",
                transition: "all 0.1s",
                boxShadow: selectedPlayer === p.id ? "3px 3px 0 #1a1a1a" : "none",
                pointerEvents: "auto"
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <button 
          onClick={onClose}
          style={{
            width: "100%",
            height: "48px",
            background: "white",
            border: "2.5px solid #1a1a1a",
            borderRadius: "14px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#1a1a1a",
            cursor: "pointer",
            transition: "all 0.1s"
          }}
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
