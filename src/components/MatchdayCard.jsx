import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const BG_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/2bc29161f_Fulltime.png";

const DAG_NAMEN = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const MAAND_NAMEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

const laadAfbeelding = (url) => new Promise((resolve) => {
  if (!url) { resolve(null); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => {
    const img2 = new Image();
    img2.crossOrigin = 'anonymous';
    img2.onload = () => resolve(img2);
    img2.onerror = () => resolve(null);
    img2.src = url + '?t=' + Date.now();
  };
  img.src = url;
});

export default function MatchdayCard({ match, item, onClose }) {
  const canvasRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [gelaadenData, setGelaadenData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const BREEDTE = 1080;
  const HOOGTE = 1920;
  const SCHAAL = 0.45;

  // Laad statische data (logo's, spelers, sponsors)
  useEffect(() => {
    const laadData = async () => {
      setIsLoading(true);
      try {
        const teamMap = {
          "MO17": "MO17", "MO20": "MO20",
          "Dames 1": "VR1", "Vrouwen 1": "VR1", "VR1": "VR1",
        };
        const playerTeam = teamMap[match?.team] || match?.team;

        const [spelersData, sponsorsData, instList] = await Promise.all([
          base44.entities.Player.list().catch(() => []),
          base44.entities.Sponsor.filter({ actief: true }).catch(() => []),
          base44.entities.WebsiteInstellingen.list().catch(() => []),
        ]);

        // Spelers met matchday foto voor speler selector
        const actief = spelersData.filter(p => p.active !== false);
        const teamFiltered = playerTeam ? actief.filter(p => p.team === playerTeam) : actief;
        const metFoto = teamFiltered.filter(p => p.matchday_foto_url);
        const finalePlayers = metFoto.length > 0 ? metFoto : actief.filter(p => p.matchday_foto_url);
        setTeamPlayers(finalePlayers);
        if (finalePlayers.length > 0) setSelectedPlayerId(finalePlayers[0].id);

        // Lineup spelers voor de kaart
        const lineupArr = Array.isArray(match?.lineup) ? match.lineup : [];
        const basisSpelers = lineupArr
          .filter(item => item.slot === "basis" && item.player_id)
          .map(item => {
            const s = spelersData.find(p => p.id === item.player_id);
            return { id: item.player_id, naam: s?.name || "", nummer: s?.shirt_number || "" };
          })
          .filter(sp => sp.naam);

        const wisselSpelers = lineupArr
          .filter(item => item.slot === "wissel" && item.player_id)
          .map(item => {
            const s = spelersData.find(p => p.id === item.player_id);
            return { id: item.player_id, naam: s?.name || "", nummer: s?.shirt_number || "" };
          })
          .filter(sp => sp.naam);

        const clubLogoUrl = instList?.[0]?.logo_url || null;
        // Gebruik opponent_logo_url van AgendaItem (Cloudinary) als primaire bron, dan match.opponent_logo als fallback
        const tegLogoUrl = item?.opponent_logo_url || match?.opponent_logo || null;
        const [clubLogoImg, tegLogoImg] = await Promise.all([
          laadAfbeelding(clubLogoUrl),
          laadAfbeelding(tegLogoUrl),
        ]);

        const sponsorsMetLogos = await Promise.all(
          ((sponsorsData || [])
            .sort((a, b) => (a.tier || 9) - (b.tier || 9) || (a.volgorde || 0) - (b.volgorde || 0))
            .slice(0, 6))
            .map(async (s) => ({ ...s, logo: s.logo_url ? await laadAfbeelding(s.logo_url) : null }))
        );

        setGelaadenData({ clubLogo: clubLogoImg, tegLogo: tegLogoImg, basisSpelers, wisselSpelers, sponsorsMetLogos });
      } catch (e) {
        console.error('Laad fout:', e);
      } finally {
        setIsLoading(false);
      }
    };
    if (match) laadData();
  }, [match?.id, match?.team]);

  const tekenKaart = useCallback(async (canvas) => {
    if (!gelaadenData) return;
    const ctx = canvas.getContext('2d');
    canvas.width = BREEDTE;
    canvas.height = HOOGTE;

    const { clubLogo, tegLogo, basisSpelers, wisselSpelers, sponsorsMetLogos: sponsors = [] } = gelaadenData;

    // Achtergrond (zelfde als FTCard)
    const bgImg = await laadAfbeelding(BG_URL);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, BREEDTE, HOOGTE);
    } else {
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(0, 0, BREEDTE, HOOGTE);
    }

    // Spelerfoto (transparante PNG cutout)
    const selectedPlayer = teamPlayers.find(p => p.id === selectedPlayerId);
    if (selectedPlayer?.matchday_foto_url) {
      const playerImg = await laadAfbeelding(selectedPlayer.matchday_foto_url);
      if (playerImg) {
        const targetH = 1600;
        const scaleP = targetH / playerImg.height;
        const drawW = playerImg.width * scaleP;
        const pX = (BREEDTE - drawW) / 2 + 80;
        const pY = HOOGTE - targetH;
        ctx.drawImage(playerImg, pX, pY, drawW, targetH);
      }
    }

    // Header balk
    if (clubLogo) ctx.drawImage(clubLogo, 56, 52, 80, 80);

    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('MV', 152, 92);
    ctx.fillStyle = '#FF6800';
    ctx.fillText('/', 152 + ctx.measureText('MV').width, 92);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ARTEMIS', 152 + ctx.measureText('MV/').width, 92);

    // Team badge
    const badgeTekst = match.team || 'TEAM';
    ctx.font = 'bold 22px Arial';
    const badgeBreedte = ctx.measureText(badgeTekst).width + 40;
    const badgeX = BREEDTE - badgeBreedte - 48;
    ctx.fillStyle = '#FF6800';
    ctx.beginPath();
    ctx.roundRect(badgeX, 52, badgeBreedte, 52, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeTekst.toUpperCase(), badgeX + badgeBreedte / 2, 52 + 26);

    // Datum + tijd
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const datum = new Date(match.date);
    const datumTekst = `${DAG_NAMEN[datum.getDay()].toUpperCase()} ${datum.getDate()} ${MAAND_NAMEN[datum.getMonth()].toUpperCase()} | ${match.start_time || ''}`;
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(datumTekst, 56, 880);

    // Locatie
    const locatie = match.location || (match.home_away === 'Thuis' ? 'Sportpark Douwekamp, Opeinde' : '');
    if (locatie) {
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(locatie, 56, 926);
    }

    // Thuis/Uit badge
    const thuisUit = match.home_away || 'Thuis';
    const isUit = thuisUit === 'Uit';
    ctx.font = 'bold 24px Arial';
    const thuisBreedte = ctx.measureText(thuisUit.toUpperCase()).width + 28;
    ctx.fillStyle = isUit ? 'rgba(0,194,255,0.25)' : 'rgba(8,208,104,0.25)';
    ctx.beginPath();
    ctx.roundRect(56, 944, thuisBreedte, 38, 4);
    ctx.fill();
    ctx.fillStyle = isUit ? '#00C2FF' : '#08D068';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(thuisUit.toUpperCase(), 56 + 14, 944 + 19);

    // VS blok
    const vsY = 1010;
    const logoMaat = 72;
    const naamFont = 'bold 34px Arial';

    const drawTeamNaam = (naam, x, align) => {
      const woorden = naam.split(' ');
      ctx.font = naamFont;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      if (naam.length > 12) {
        const helft = Math.ceil(woorden.length / 2);
        ctx.fillText(woorden.slice(0, helft).join(' '), x, vsY + 22);
        ctx.fillText(woorden.slice(helft).join(' '), x, vsY + 58);
      } else {
        ctx.fillText(naam, x, vsY + 36);
      }
    };

    ctx.font = 'bold 52px Arial';
    ctx.fillStyle = '#FF6800';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', 540, vsY + 36);

    if (isUit) {
      if (tegLogo) ctx.drawImage(tegLogo, 56, vsY, logoMaat, logoMaat);
      drawTeamNaam(match.opponent || '', 56 + logoMaat + 14, 'left');
      if (clubLogo) ctx.drawImage(clubLogo, BREEDTE - 56 - logoMaat, vsY, logoMaat, logoMaat);
      ctx.font = naamFont;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('MV ARTEMIS', BREEDTE - 56 - logoMaat - 14, vsY + 36);
    } else {
      if (clubLogo) ctx.drawImage(clubLogo, 56, vsY, logoMaat, logoMaat);
      ctx.font = naamFont;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('MV ARTEMIS', 56 + logoMaat + 14, vsY + 36);
      if (tegLogo) ctx.drawImage(tegLogo, BREEDTE - 56 - logoMaat, vsY, logoMaat, logoMaat);
      drawTeamNaam(match.opponent || '', BREEDTE - 56 - logoMaat - 14, 'right');
    }

    // STARTING XI
    const xiY = 1160;
    ctx.font = 'bold 52px Arial';
    ctx.fillStyle = '#FF6800';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('STARTING XI', 56, xiY);

    ctx.strokeStyle = '#FF6800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(56, xiY + 12);
    ctx.lineTo(BREEDTE - 56, xiY + 12);
    ctx.stroke();

    const kolomBreedte = (BREEDTE - 112) / 2;
    const rijY = xiY + 36;
    const rijHoogte = 58;

    basisSpelers.forEach((speler, index) => {
      const kolom = index < 6 ? 0 : 1;
      const rij = kolom === 0 ? index : index - 6;
      const x = 56 + (kolom * kolomBreedte);
      const y = rijY + (rij * rijHoogte);

      const badgeSize = 42;
      ctx.fillStyle = '#FF6800';
      ctx.beginPath();
      ctx.roundRect(x, y, badgeSize, badgeSize, 4);
      ctx.fill();

      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(speler.nummer || ''), x + badgeSize / 2, y + badgeSize / 2);

      const voornaam = (speler.naam || '').split(' ')[0].toUpperCase();
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(voornaam, x + badgeSize + 14, y + badgeSize / 2);
    });

    // SUBSTITUTIONS
    const subY = rijY + (6 * rijHoogte) + 20;
    const subTekst = 'SUBSTITUTIONS';
    ctx.font = 'bold 24px Arial';
    const subBreedte = ctx.measureText(subTekst).width + 48;
    ctx.fillStyle = '#1B2A5E';
    ctx.beginPath();
    ctx.roundRect(56, subY, subBreedte, 48, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(subTekst, 56 + subBreedte / 2, subY + 24);

    const wisselNamen = wisselSpelers.map(s => s.naam.split(' ')[0]).join(', ');
    ctx.font = '26px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(wisselNamen, 56, subY + 80);

    // Sponsor balk
    const sponsorHoogte = 220;
    const sponsorY = HOOGTE - sponsorHoogte;
    ctx.fillStyle = 'rgba(8,9,13,0.98)';
    ctx.fillRect(0, sponsorY, BREEDTE, sponsorHoogte);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, sponsorY);
    ctx.lineTo(BREEDTE, sponsorY);
    ctx.stroke();

    if (sponsors.length > 0) {
      const perRij = Math.ceil(sponsors.length / 2);
      const rij1 = sponsors.slice(0, perRij);
      const rij2 = sponsors.slice(perRij);
      const rijen = [rij1, rij2].filter(r => r.length > 0);
      const rijHoogtes = [sponsorY + sponsorHoogte * 0.3, sponsorY + sponsorHoogte * 0.72];

      rijen.forEach((rij, rijIdx) => {
        const afstand = BREEDTE / (rij.length + 1);
        const sy = rijHoogtes[rijIdx];
        rij.forEach((sponsor, i) => {
          const sx = afstand * (i + 1);
          if (sponsor.logo) {
            const logoMaxH = 32;
            const schaalFactor = logoMaxH / sponsor.logo.height;
            const logoW = sponsor.logo.width * schaalFactor;
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = logoW; tmpCanvas.height = logoMaxH;
            const tmpCtx = tmpCanvas.getContext('2d');
            tmpCtx.drawImage(sponsor.logo, 0, 0, logoW, logoMaxH);
            tmpCtx.globalCompositeOperation = 'source-in';
            tmpCtx.fillStyle = '#ffffff';
            tmpCtx.fillRect(0, 0, logoW, logoMaxH);
            ctx.globalAlpha = 0.85;
            ctx.drawImage(tmpCanvas, sx - logoW / 2, sy - logoMaxH / 2, logoW, logoMaxH);
            ctx.globalAlpha = 1;
          } else {
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sponsor.naam || '', sx, sy);
          }
        });
      });
    }
  }, [gelaadenData, teamPlayers, selectedPlayerId, match]);

  // Preview hertekenen
  useEffect(() => {
    if (!gelaadenData || !canvasRef.current) return;
    clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = BREEDTE;
      canvas.height = HOOGTE;
      tekenKaart(canvas);
    }, 150);
    return () => clearTimeout(renderTimeoutRef.current);
  }, [tekenKaart, gelaadenData]);

  const downloadPNG = async () => {
    if (!canvasRef.current) return;
    setIsDownloading(true);
    await tekenKaart(canvasRef.current);
    const link = document.createElement('a');
    const team = match?.team?.replace(/\s+/g, '_') || 'team';
    const datum = match?.date?.split('T')[0] || 'datum';
    link.download = `matchday-${team}-${datum}.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
    setIsDownloading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", padding: 20,
    }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
          Matchday Card
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 18,
        }}>×</button>
      </div>

      {/* Speler selector */}
      <div style={{ width: "100%", maxWidth: 600, marginBottom: 12 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10,
          color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8,
        }}>SPELER</div>
        {teamPlayers.length === 0 ? (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
            Geen spelers met matchday foto gevonden.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {teamPlayers.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                style={{
                  flexShrink: 0, width: 60, height: 80, borderRadius: 6, overflow: "hidden",
                  border: `2px solid ${selectedPlayerId === p.id ? "#FF6800" : "rgba(255,255,255,0.15)"}`,
                  background: "transparent", cursor: "pointer", padding: 0,
                  position: "relative",
                }}
              >
                <img
                  src={p.matchday_foto_url}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas preview */}
      <div style={{
        width: BREEDTE * SCHAAL, height: HOOGTE * SCHAAL,
        position: "relative", overflow: "hidden", borderRadius: 8, background: "#10121A",
      }}>
        <canvas
          ref={canvasRef}
          style={{ width: `${BREEDTE * SCHAAL}px`, height: `${HOOGTE * SCHAAL}px`, display: "block", borderRadius: 8 }}
        />
      </div>

      {/* Acties */}
      <div style={{ width: "100%", maxWidth: 540, display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={downloadPNG} disabled={isDownloading || isLoading} style={{
          flex: 1, background: (isDownloading || isLoading) ? "rgba(255,104,0,0.6)" : "#FF6800",
          color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
          padding: 14, border: "none", borderRadius: 4, cursor: (isDownloading || isLoading) ? "not-allowed" : "pointer",
        }}>
          {isLoading ? "⏳ Laden..." : isDownloading ? "⏳ Download..." : "↓ Download PNG (1080×1920)"}
        </button>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
          padding: "14px 20px", border: "none", borderRadius: 4, cursor: "pointer",
        }}>Sluiten</button>
      </div>
    </div>
  );
}