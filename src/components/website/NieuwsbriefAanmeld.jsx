import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function NieuwsbriefAanmeld() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // "ok" | "already" | "error" | null
  const [bezig, setBezig] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || bezig) return;
    setBezig(true);
    try {
      const res = await base44.functions.invoke('nieuwsbriefAanmelden', { email });
      const data = res?.data || {};
      if (data.status === "ok") {
        setStatus("ok");
        setEmail("");
      } else if (data.status === "already_subscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    setBezig(false);
  };

  return (
    <div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#FF6800", letterSpacing: "2px", marginBottom: "8px" }}>
        BLIJF OP DE HOOGTE
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "12px", lineHeight: 1.5 }}>
        Wekelijks nieuws, uitslagen en aankondigingen in je inbox.
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          type="email"
          required
          placeholder="jouw@email.nl"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "3px",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "13px",
            padding: "9px 12px",
            flex: 1,
            minWidth: "160px",
            outline: "none",
          }}
          onFocus={e => e.currentTarget.style.borderColor = "#FF6800"}
          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        <button
          type="submit"
          disabled={bezig}
          style={{
            background: "#FF6800",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "12px",
            padding: "9px 14px",
            border: "none",
            borderRadius: "3px",
            cursor: bezig ? "wait" : "pointer",
            whiteSpace: "nowrap",
            opacity: bezig ? 0.6 : 1,
          }}
        >
          {bezig ? "..." : "Aanmelden →"}
        </button>
      </form>

      {status === "ok" && (
        <div style={{ marginTop: "10px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "#22C55E" }}>
          ✓ Check je inbox voor de bevestigingslink.
        </div>
      )}
      {status === "already" && (
        <div style={{ marginTop: "10px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
          Je bent al aangemeld.
        </div>
      )}
      {status === "error" && (
        <div style={{ marginTop: "10px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "#FF6800" }}>
          Er ging iets mis. Probeer het opnieuw.
        </div>
      )}
    </div>
  );
}