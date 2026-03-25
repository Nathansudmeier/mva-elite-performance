import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function TestenMenu({ isOpen, onClose }) {
  const navigate = useNavigate();

  const testOptions = [
    {
      name: "Yo-Yo Test",
      description: "Intermittent recovery test",
      icon: "⚡",
      color: "#FF6800",
      action: () => navigate("/PhysicalMonitor?tab=yoyo"),
    },
    {
      name: "30m Sprint",
      description: "Sprint snelheid test",
      icon: "🏃",
      color: "#9B5CFF",
      action: () => navigate("/PhysicalMonitor?tab=physical"),
    },
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div style={{
        width: "100%", background: "#ffffff", borderRadius: "24px 24px 0 0",
        border: "2.5px solid #1a1a1a", borderBottom: "none",
        boxShadow: "0 -3px 20px rgba(0,0,0,0.15)", animation: "slideUp 0.3s ease",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px", borderBottom: "2.5px solid #1a1a1a",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>Selecteer Test</h2>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "10px", border: "2px solid #1a1a1a",
            background: "rgba(26,26,26,0.04)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
          }}>
            <X size={16} color="#1a1a1a" />
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {testOptions.map(test => (
            <button
              key={test.name}
              onClick={() => { test.action(); onClose(); }}
              style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "14px",
                borderRadius: "14px", border: "2.5px solid #1a1a1a", background: "#ffffff",
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: "2px 2px 0 #1a1a1a",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(26,26,26,0.02)";
                e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.boxShadow = "2px 2px 0 #1a1a1a";
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: test.color, border: "2px solid #1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", flexShrink: 0,
              }}>
                {test.icon}
              </div>
              <div style={{ textAlign: "left", flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>
                  {test.name}
                </p>
                <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", marginTop: "2px" }}>
                  {test.description}
                </p>
              </div>
              <div style={{ fontSize: "18px" }}>→</div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}