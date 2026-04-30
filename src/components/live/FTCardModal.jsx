import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const BG_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/8739ec329_Fulltime.png";

export default function FTCardModal({ match, events, players, onClose }) {
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [generating, setGenerating] = useState(false);

  // Haal alle spelers op met een matchday_foto_url
  useEffect(() => {
    base44.entities.Player.filter({ team: match?.team, active: true }).then(data => {
      const withPhoto = data.filter(p => p.matchday_foto_url);
      setTeamPlayers(withPhoto);
      if (withPhoto.length > 0) setSelectedPlayerId(withPhoto[0].id);
    });
  }, [match?.team]);

  const scoreHome = (events || []).filter(e => e.type === "goal_mva").length;
  const scoreAway = (events || []).filter(e => e.type === "goal_against").length;

  const getScorers = () =>
    (events || []).filter(e => e.type === "goal_mva" && e.goal_type !== "eigen_doelpunt");

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

    // --- Achtergrond: vaste template afbeelding ---
    const bgImg = await loadImage(BG_URL);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, 1080, 1920);
    } else {
      ctx.fillStyle = "#1a0a00";
      ctx.fillRect(0, 0, 1080, 1920);
    }

    // --- Spelerfoto (transparante PNG, over de achtergrond) ---
    const selectedPlayer = teamPlayers.find(p => p.id === selectedPlayerId);
    if (selectedPlayer?.matchday_foto_url) {
      const playerImg = await loadImage(selectedPlayer.matchday_foto_url);
      if (playerImg) {
        // Schaal de speler zodat hij onderin de kaart staat, volledig zichtbaar
        const targetH = 1500;
        const scale = targetH / playerImg.height;
        const drawW = playerImg.width * scale;
        const drawH = targetH;
        const pX = (1080 - drawW) / 2 + 100; // licht naar rechts
        const pY = 1920 - drawH;
        ctx.drawImage(playerImg, pX, pY, drawW, drawH);
      }
    }

    // --- Score blok bovenin ---
    const scoreY = 280;
    const logoSize = 110;
    const leftX = 220;   // tegenstander
    const rightX = 860;  // MV Artemis

    // Logo tegenstander (uit match planning)
    const opponentLogoUrl = match?.opponent_logo_url || match?.opponent_logo || "";
    const opponentLogoImg = opponentLogoUrl ? await loadImage(opponentLogoUrl) : null;

    // Logo Artemis
    const artemisLogoImg = await loadImage("https://mv-artemis.nl/logo.png");

    if (opponentLogoImg) {
      ctx.drawImage(opponentLogoImg, leftX - logoSize / 2, scoreY, logoSize, logoSize);
    } else {
      // Fallback: witte cirkel met "?" als geen logo
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.arc(leftX, scoreY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("?", leftX, scoreY + logoSize / 2 + 16);
    }

    if (artemisLogoImg) {
      ctx.drawImage(artemisLogoImg, rightX - logoSize / 2, scoreY, logoSize, logoSize);
    }

    // Score rechthoeken
    const rectY = scoreY + logoSize + 20;
    const rectW = 130;
    const rectH = 75;

    ctx.fillStyle = "rgba(255,104,0,0.85)";
    ctx.beginPath();
    ctx.roundRect(leftX - rectW / 2, rectY, rectW, rectH, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(rightX - rectW / 2, rectY, rectW, rectH, 8);
    ctx.fill();

    ctx.font = "bold 60px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.fillText(String(scoreAway), leftX, rectY + 58);
    ctx.fillText(String(scoreHome), rightX, rectY + 58);
    ctx.shadowBlur = 0;

    // Dash tussen scores
    ctx.font = "bold 48px 'Bebas Neue', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("—", 540, rectY + 52);

    // Tegnamen
    ctx.font = "600 22px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.textAlign = "center";
    const opponentName = match?.opponent || "Tegenstander";
    ctx.fillText(opponentName.length > 16 ? opponentName.slice(0, 15) + "…" : opponentName, leftX, rectY + rectH + 24);
    ctx.fillText("MV Artemis", rightX, rectY + rectH + 24);

    // --- Scorerslijst ---
    const scorers = getScorers();
    if (scorers.length > 0) {
      let sy = rectY + rectH + 80;

      // Halftransparante achtergrond voor scorerslijst
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.roundRect(60, sy - 30, 500, scorers.length * 46 + 20, 10);
      ctx.fill();

      for (const ev of scorers) {
        const pl = players?.find(p => p.id === ev.player_id);
        ctx.font = "700 24px 'Space Grotesk', sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#FF6800";
        ctx.fillText(`${ev.minute}'`, 88, sy);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(pl?.name || "Onbekend", 160, sy);
        sy += 46;
      }
    }

    // --- Watermark onderaan ---
    ctx.font = "400 26px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("mv-artemis.nl", 540, 1870);

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
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#151D35", borderRadius: "8px", padding: "32px",
          maxWidth: "480px", width: "100%", position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "20px",
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "22px", cursor: "pointer", lineHeight: 1,
        }}>×</button>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px",
          fontWeight: 700, color: "#ffffff", marginBottom: "8px",
        }}>
          FT CARD GENEREREN
        </div>

        {/* Info: logo en achtergrond automatisch */}
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "24px", lineHeight: 1.5 }}>
          Achtergrond en tegenstander logo ({match?.opponent || "—"}) worden automatisch gebruikt.
        </div>

        {/* Spelerfoto dropdown */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>
            Speler (transparante PNG)
          </label>
          {teamPlayers.length === 0 ? (
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
              Geen spelers met matchday foto gevonden voor dit team.
            </div>
          ) : (
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              style={{
                width: "100%", background: "#0F1630", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "4px", color: "#ffffff", padding: "10px 12px", fontSize: "14px",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <option value="">— Geen speler —</option>
              {teamPlayers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
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
          {generating ? "Bezig met genereren..." : "Genereer & Download →"}
        </button>
      </div>
    </div>
  );
}