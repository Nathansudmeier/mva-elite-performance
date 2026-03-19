import React from "react";

export default function AppBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Bol 1 */}
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(255,107,0,0.55)",
          top: -160,
          left: -100,
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Bol 2 */}
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,150,0,0.30)",
          top: 380,
          right: -80,
          filter: "blur(50px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Bol 3 */}
      <div
        style={{
          position: "absolute",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "rgba(255,107,0,0.20)",
          bottom: 100,
          left: -40,
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  );
}