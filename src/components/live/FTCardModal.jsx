import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const BG_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/2bc29161f_Fulltime.png";
const ARTEMIS_LOGO_URL = "https://res.cloudinary.com/dmigxluzx/image/upload/v1777034269/MVAartemis_ongmjn.png";

export default function FTCardModal({ match, events, players, onClose }) {
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [titelTekst, setTitelTekst] = useState("FULL TIME");
  const [generating, setGenerating] = useState(false);
  const previewCanvasRef = useRef(null);
  const renderTimeoutRef = useRef(null);

  const scoreHome = (events || []).filter(e => e.type === "goal_mva").length;
  const scoreAway = (events || []).filter(e => e.type === "goal_against").length;
  const opponentLogoUrl = match?.opponent_logo_url || match?.opponent_logo || "";

  const getScorers = () =>
    (events || []).filter(e => e.type === "goal_mva" && e.goal_type !== "eigen_doelpunt");

  useEffect(() => {
    // Haal alle actieve spelers op en filter daarna op team + matchday foto
    // Match.team gebruikt andere waarden dan Player.team
    // Match: "MO17", "Dames 1" → Player: "MO17", "MO20", "VR1"
    const teamMap = {
      "MO17": "MO17",
      "MO20": "MO20",
      "Dames 1": "VR1",
      "Vrouwen 1": "VR1",
      "VR1": "VR1",
    };
    const playerTeam = teamMap[match?.team] || match?.team;
    base44.entities.Player.list().then(data => {
      const active = data.filter(p => p.active !== false);
      const teamFiltered = playerTeam
        ? active.filter(p => p.team === playerTeam)
        : active;
      const withPhoto = teamFiltered.filter(p => p.matchday_foto_url);
      // Als geen resultaat met teamfilter, toon alle spelers met matchday foto
      const final = withPhoto.length > 0 ? withPhoto : active.filter(p => p.matchday_foto_url);
      setTeamPlayers(final);
      if (final.length > 0) setSelectedPlayerId(final[0].id);
    });
  }, [match?.team]);

  const loadImage = (src) => new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const drawCard = useCallback(async (targetCanvas, scale = 1) => {
    const W = 1080 * scale;
    const H = 1920 * scale;
    targetCanvas.width = W;
    targetCanvas.height = H;
    const ctx = targetCanvas.getContext("2d");
    ctx.scale(scale, scale);

    // --- Achtergrond ---
    const bgImg = await loadImage(BG_URL);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, 1080, 1920);
    } else {
      ctx.fillStyle = "#1a0a00";
      ctx.fillRect(0, 0, 1080, 1920);
    }

    // --- Spelerfoto (transparante PNG cutout) ---
    const selectedPlayer = teamPlayers.find(p => p.id === selectedPlayerId);
    if (selectedPlayer?.matchday_foto_url) {
      const playerImg = await loadImage(selectedPlayer.matchday_foto_url);
      if (playerImg) {
        const targetH = 1600;
        const scaleP = targetH / playerImg.height;
        const drawW = playerImg.width * scaleP;
        const drawH = targetH;
        const pX = (1080 - drawW) / 2 + 80;
        const pY = 1920 - drawH;
        ctx.drawImage(playerImg, pX, pY, drawW, drawH);
      }
    }

    // --- FULL TIME label (rechthoek met tekst) ---
    const labelW = 700;
    const labelH = 110;
    const labelX = (1080 - labelW) / 2;
    const labelY = 70;

    ctx.strokeStyle = "#FF6800";
    ctx.lineWidth = 6;
    ctx.strokeRect(labelX, labelY, labelW, labelH);

    ctx.font = `bold 82px 'Bebas Neue', Impact, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 16;
    ctx.fillText(titelTekst.toUpperCase(), 540, labelY + 84);
    ctx.shadowBlur = 0;

    // --- Logo's ---
    const logoSize = 130;
    const logoY = 220;
    const leftX = 200;   // tegenstander
    const rightX = 880;  // MV Artemis

    const [opponentLogoImg, artemisLogoImg] = await Promise.all([
      loadImage(opponentLogoUrl),
      loadImage(ARTEMIS_LOGO_URL),
    ]);

    // Tegenstander logo met witte achtergrond cirkel
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(leftX, logoY + logoSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
    ctx.fill();

    if (opponentLogoImg) {
      ctx.drawImage(opponentLogoImg, leftX - logoSize / 2, logoY, logoSize, logoSize);
    } else {
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#333";
      ctx.fillText("?", leftX, logoY + logoSize / 2 + 14);
    }

    // Artemis logo met witte achtergrond
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(rightX, logoY + logoSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
    ctx.fill();

    if (artemisLogoImg) {
      ctx.drawImage(artemisLogoImg, rightX - logoSize / 2, logoY, logoSize, logoSize);
    }

    // --- Score blok ---
    const scoreY = logoY + logoSize + 30;
    const rectW = 160;
    const rectH = 110;

    // Tegenstander score (links)
    ctx.fillStyle = "rgba(255,104,0,0.9)";
    ctx.beginPath();
    ctx.roundRect(leftX - rectW / 2, scoreY, rectW, rectH, 10);
    ctx.fill();

    // MV Artemis score (rechts)
    ctx.beginPath();
    ctx.roundRect(rightX - rectW / 2, scoreY, rectW, rectH, 10);
    ctx.fill();

    // Score getallen
    ctx.font = "bold 90px 'Bebas Neue', Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(String(scoreAway), leftX, scoreY + 88);
    ctx.fillText(String(scoreHome), rightX, scoreY + 88);
    ctx.shadowBlur = 0;

    // Dash tussen scores
    ctx.font = "bold 60px 'Bebas Neue', Impact, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("—", 540, scoreY + 76);

    // Team namen onder scores
    ctx.font = "700 22px 'Space Grotesk', Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    const oppName = (match?.opponent || "Tegenstander");
    ctx.fillText(oppName.length > 14 ? oppName.slice(0, 13) + "…" : oppName, leftX, scoreY + rectH + 28);
    ctx.fillText("MV Artemis", rightX, scoreY + rectH + 28);

    // --- Scorerslijst ---
    const scorers = getScorers();
    if (scorers.length > 0) {
      const listY = scoreY + rectH + 220;
      const listPad = 20;
      const listH = scorers.length * 50 + listPad * 2;

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.roundRect(60, listY, 520, listH, 12);
      ctx.fill();

      let sy = listY + listPad + 32;
      for (const ev of scorers) {
        const pl = players?.find(p => p.id === ev.player_id);
        ctx.font = "700 26px 'Space Grotesk', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#FF6800";
        ctx.fillText(`${ev.minute}'`, 88, sy);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(pl?.name || "Onbekend", 170, sy);
        sy += 50;
      }
    }

    // --- Watermark ---
    ctx.font = "400 26px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("mv-artemis.nl", 540, 1870);

  }, [teamPlayers, selectedPlayerId, titelTekst, scoreHome, scoreAway, opponentLogoUrl, match, players]);

  // Preview hertekenen bij wijzigingen
  useEffect(() => {
    if (!previewCanvasRef.current) return;
    clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      drawCard(previewCanvasRef.current, 0.25);
    }, 150);
    return () => clearTimeout(renderTimeoutRef.current);
  }, [drawCard]);

  const handleGenerate = async () => {
    setGenerating(true);
    const canvas = document.createElement("canvas");
    await drawCard(canvas, 1);
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
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#151D35", borderRadius: "10px", padding: "28px",
          maxWidth: "720px", width: "100%", position: "relative",
          display: "flex", gap: "28px", flexWrap: "wrap",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: "14px", right: "18px",
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "24px", cursor: "pointer", lineHeight: 1, zIndex: 1,
        }}>×</button>

        {/* Canvas preview */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>Voorbeeld</div>
          <canvas
            ref={previewCanvasRef}
            style={{
              width: "270px",
              height: "480px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "block",
            }}
          />
        </div>

        {/* Instellingen */}
        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px",
            fontWeight: 700, color: "#ffffff",
          }}>
            FT CARD GENEREREN
          </div>

          {/* Titel tekst */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>
              Titel tekst
            </label>
            <input
              type="text"
              value={titelTekst}
              onChange={e => setTitelTekst(e.target.value)}
              style={{
                width: "100%", background: "#0F1630", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "4px", color: "#ffffff", padding: "10px 12px", fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Speler dropdown */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>
              Speler (transparante foto)
            </label>
            {teamPlayers.length === 0 ? (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                Geen spelers met matchday foto gevonden.
              </div>
            ) : (
              <select
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                style={{
                  width: "100%", background: "#0F1630", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "4px", color: "#ffffff", padding: "10px 12px", fontSize: "14px",
                  boxSizing: "border-box",
                }}
              >
                <option value="">— Geen speler —</option>
                {teamPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Info over logo */}
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            Tegenstander logo ({match?.opponent || "—"}) en Artemis logo worden automatisch geladen.
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: "#FF6800", color: "#ffffff", border: "none",
              borderRadius: "4px", fontWeight: 700, fontSize: "15px",
              padding: "14px 24px", cursor: generating ? "not-allowed" : "pointer",
              opacity: generating ? 0.6 : 1, width: "100%", marginTop: "auto",
            }}
          >
            {generating ? "Bezig..." : "⬇ Genereer & Download"}
          </button>
        </div>
      </div>
    </div>
  );
}