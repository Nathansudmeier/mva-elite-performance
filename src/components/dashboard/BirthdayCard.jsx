import React from "react";

export default function BirthdayCard({ players }) {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const jarigen = players.filter((p) => {
    if (!p.geboortedatum) return false;
    const d = new Date(p.geboortedatum);
    return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay;
  });

  if (jarigen.length === 0) return null;

  const getAge = (geboortedatum) => {
    const d = new Date(geboortedatum);
    return today.getFullYear() - d.getFullYear();
  };

  return (
    <div style={{
      background: "#FFD600",
      border: "2.5px solid #1a1a1a",
      borderRadius: "18px",
      boxShadow: "3px 3px 0 #1a1a1a",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
    }}>
      {/* Emoji + label */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <span style={{ fontSize: "36px", lineHeight: 1 }}>🎂</span>
        <div>
          <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: "2px" }}>
            Vandaag jarig!
          </p>
          <p style={{ fontSize: "15px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2 }}>
            Gefeliciteerd 🎉
          </p>
        </div>
      </div>

      {/* Spelers */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
        {jarigen.map((p) => (
          <div key={p.id} style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(26,26,26,0.10)",
            border: "2px solid rgba(26,26,26,0.20)",
            borderRadius: "40px",
            padding: "6px 14px 6px 6px",
          }}>
            {p.photo_url ? (
              <img
                src={p.photo_url}
                alt={p.name}
                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "2px solid #1a1a1a", flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 900, color: "#fff" }}>
                  {p.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.1 }}>{p.name}</p>
              <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", fontWeight: 600 }}>{getAge(p.geboortedatum)} jaar</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}