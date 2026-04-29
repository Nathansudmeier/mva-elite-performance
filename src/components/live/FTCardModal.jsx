import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

export default function FTCardModal({ match, events, players, onClose }) {
  const [achtergronden, setAchtergronden] = useState([]);
  const [selectedFotoUrl, setSelectedFotoUrl] = useState("");
  const [opponentLogoUrl, setOpponentLogoUrl] = useState(match?.opponent_logo_url || match?.opponent_logo || "");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    base44.entities.MatchdayAchtergrond.filter({ actief: true }).then(data => {
      const teamNaam = match?.team;
      const filtered = data.filter(a => a.actief !== false && (a.team === teamNaam || a.team === "Alle"));
      setAchtergronden(filtered);
      if (filtered.length > 0) setSelectedFotoUrl(filtered[0].foto_url);
    });
  }, [match?.team]);

  const getScorers = () => {
    return (events || []).filter(e =>
      e.type === "goal_mva" && e.goal_type !== "eigen_doelpunt"
    );
  };

  const scoreHome = (events || []).filter(e => e.type === "goal_mva").length;
  const scoreAway = (events || []).filter(e => e.type === "goal_against").length;

  const loadImage = (src) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const generate = async () => {
    setGenerating(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    // --- Achtergrond ---
    ctx.fillStyle = "#1a0a00";
    ctx.fillRect(0, 0, 1080, 1920);

    // Radiaal verloop linksboven
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 700);
    grad.addColorStop(0, "rgba(255,104,0,0.35)");
    grad.addColorStop(1, "rgba(255,104,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Dot pattern rechtsboven
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#FF6800";
    for (let x = 880; x < 1080; x += 18) {
      for (let y = 0; y < 400; y += 18) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // --- FULL TIME tekst ---
    ctx.font = "900 180px 'Bebas Neue', Bebas Neue, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("FULL TIME", 540, 200);
    ctx.shadowBlur = 0;

    // --- Logo's & score blok ---
    const logoY = 280;
    const logoSize = 120;
    const opponentLogoImg = opponentLogoUrl ? await loadImage(opponentLogoUrl) : null;
    const artemisLogoImg = await loadImage("https://mv-artemis.nl/logo.png");

    // Tegenstander links: x=200 midden, Artemis rechts: x=880 midden
    const leftX = 240;
    const rightX = 840;

    if (opponentLogoImg) {
      ctx.drawImage(opponentLogoImg, leftX - logoSize / 2, logoY, logoSize, logoSize);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.roundRect(leftX - logoSize / 2, logoY, logoSize, logoSize, 12);
      ctx.fill();
    }
    if (artemisLogoImg) {
      ctx.drawImage(artemisLogoImg, rightX - logoSize / 2, logoY, logoSize, logoSize);
    }

    // Score rechthoeken (y=420)
    const scoreY = 430;
    const rectW = 140;
    const rectH = 80;

    // Tegenstander score (links)
    ctx.fillStyle = "#FF6800";
    ctx.beginPath();
    ctx.roundRect(leftX - rectW / 2, scoreY, rectW, rectH, 8);
    ctx.fill();

    // MV Artemis score (rechts)
    ctx.beginPath();
    ctx.roundRect(rightX - rectW / 2, scoreY, rectW, rectH, 8);
    ctx.fill();

    // Scores tekst
    ctx.font = "700 64px 'Bebas Neue', Bebas Neue, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(scoreAway), leftX, scoreY + 60);
    ctx.fillText(String(scoreHome), rightX, scoreY + 60);

    // Slash tussen de twee rechthoeken
    ctx.fillStyle = "#ffffff";
    ctx.fillText("/", 540, scoreY + 60);

    // --- Scorerslijst ---
    const scorers = getScorers();
    if (scorers.length > 0) {
      let sy = 680;
      for (const ev of scorers) {
        const pl = players?.find(p => p.id === ev.player_id);
        // Minuut
        ctx.font = "700 22px 'Space Grotesk', Space Grotesk, sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#FF6800";
        ctx.fillText(`${ev.minute}'`, 80, sy);
        // Naam
        ctx.fillStyle = "#ffffff";
        ctx.fillText(pl?.name || "Onbekend", 160, sy);
        sy += 44;
      }
    }

    // --- Spelerfoto rechts ---
    if (selectedFotoUrl) {
      const playerImg = await loadImage(selectedFotoUrl);
      if (playerImg) {
        const pX = 580;
        const pW = 500;
        const pH = 900;
        const pY = 600;
        // clip
        ctx.save();
        ctx.beginPath();
        ctx.rect(pX, pY, pW, pH);
        ctx.clip();
        // draw scaled from bottom
        const imgAspect = playerImg.width / playerImg.height;
        const drawH = pH;
        const drawW = drawH * imgAspect;
        ctx.drawImage(playerImg, pX + (pW - drawW) / 2, pY + pH - drawH, drawW, drawH);
        ctx.restore();
      }
    }

    // --- Onderaan ---
    ctx.font = "400 24px 'Space Grotesk', Space Grotesk, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("mv-artemis.nl", 540, 1820);

    // Download
    const dateStr = match?.date ? match.date.replace(/-/g, "") : "onbekend";
    const opponentStr = (match?.opponent || "tegenstander").replace(/\s+/g, "-");
    const link = document.createElement("a");
    link.download = `FT-${opponentStr}-${dateStr}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    setGenerating(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}
      onClick={onClose}
    >
      <div style={{
        background: "#151D35", borderRadius: "8px", padding: "32px",
        maxWidth: "480px", width: "100%", position: "relative",
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sluitknop */}
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "20px",
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "22px", cursor: "pointer", lineHeight: 1,
        }}>×</button>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px",
          fontWeight: 700, color: "#ffffff", marginBottom: "24px",
        }}>
          FT CARD GENEREREN
        </div>

        {/* Spelerfoto dropdown */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>
            Spelerfoto
          </label>
          <select
            value={selectedFotoUrl}
            onChange={e => setSelectedFotoUrl(e.target.value)}
            style={{
              width: "100%", background: "#0F1630", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "4px", color: "#ffffff", padding: "10px 12px", fontSize: "14px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <option value="">— Geen foto —</option>
            {achtergronden.map(a => (
              <option key={a.id} value={a.foto_url}>{a.naam || a.foto_url}</option>
            ))}
          </select>
        </div>

        {/* Tegenstander logo URL */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>
            Tegenstander logo URL
          </label>
          <input
            type="text"
            value={opponentLogoUrl}
            onChange={e => setOpponentLogoUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%", background: "#0F1630", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "4px", color: "#ffffff", padding: "10px 12px", fontSize: "14px",
              fontFamily: "'Space Grotesk', sans-serif", boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={generate}
          disabled={generating}
          style={{
            background: "#FF6800", color: "#ffffff", border: "none",
            borderRadius: "3px", fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: "14px", padding: "12px 24px",
            cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.6 : 1,
            width: "100%",
          }}
        >
          {generating ? "Bezig met genereren..." : "Genereer →"}
        </button>
      </div>
    </div>
  );
}