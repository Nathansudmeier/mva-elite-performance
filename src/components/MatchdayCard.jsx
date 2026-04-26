import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const DAG_NAMEN = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const MAAND_NAMEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

const laadAfbeelding = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = () => resolve(null);
      img2.src = url + '?t=' + Date.now();
    };
    img.src = url;
  });
};

export default function MatchdayCard({ match, onClose }) {
  const canvasRef = useRef(null);
  const [achtergronden, setAchtergronden] = useState([]);
  const [geselecteerdeAchtergrond, setGeselecteerdeAchtergrond] = useState(null);
  const [spelers, setSpelers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [instellingen, setInstellingen] = useState(null);

  const BREEDTE = 1080;
  const HOOGTE = 1920;
  const SCHAAL = 0.45;

  // Data laden en canvas tekenen
  useEffect(() => {
    const laadEnTeken = async () => {
      setIsLoading(true);
      try {
        const [
          spelersData,
          sponsorsData,
          achtergrondData,
          instList
        ] = await Promise.all([
          base44.entities.Player.list().catch(() => []),
          base44.entities.Sponsor.filter({ actief: true }).catch(() => []),
          base44.entities.MatchdayAchtergrond.list().catch(() => []),
          base44.entities.WebsiteInstellingen.list().catch(() => [])
        ]);

        setSpelers(spelersData);
        const filteredBg = (achtergrondData || [])
          .filter(b => b.actief !== false && (!match.team || b.team === match.team || b.team === "Alle"))
          .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
        setAchtergronden(filteredBg);
        setSponsors((sponsorsData || []).sort((a, b) => (a.tier || 9) - (b.tier || 9) || (a.volgorde || 0) - (b.volgorde || 0)).slice(0, 6));
        if (instList && instList.length > 0) setInstellingen(instList[0]);

        // Lineup koppelen
        const lineupArr = Array.isArray(match?.lineup) ? match.lineup : [];
        const basisSpelers = lineupArr
          .filter(item => item.slot === "basis" && item.player_id)
          .map(item => {
            const s = spelersData.find(p => p.id === item.player_id);
            return {
              id: item.player_id,
              naam: s?.name || "Onbekend",
              nummer: s?.shirt_number || "",
            };
          });

        const basisIds = new Set(basisSpelers.map(b => b.id));
        const subIds = (match?.substitutes || []).filter(id => !basisIds.has(id));
        const wisselSpelers = subIds.map(id => {
          const s = spelersData.find(p => p.id === id);
          return {
            naam: s?.name || "Onbekend",
            nummer: s?.shirt_number || "",
          };
        }).filter(w => w.naam !== "Onbekend");

        // Laad afbeeldingen
        const clubLogoImg = instellingen?.logo_url || (instList?.[0]?.logo_url)
          ? await laadAfbeelding(instellingen?.logo_url || instList?.[0]?.logo_url)
          : null;

        const tegLogoImg = match?.opponent_logo
          ? await laadAfbeelding(match.opponent_logo)
          : null;

        const achtergrondImg = filteredBg[0]?.foto_url
          ? await laadAfbeelding(filteredBg[0].foto_url)
          : null;

        if (filteredBg.length > 0) setGeselecteerdeAchtergrond(achtergrondImg);

        // Sponsor logos laden
        const sponsorsMetLogos = await Promise.all(
          ((sponsorsData || []).slice(0, 6)).map(async (s) => ({
            ...s,
            logo: s.logo_url ? await laadAfbeelding(s.logo_url) : null
          }))
        );

        // Teken kaart
        if (canvasRef.current) {
          await tekenKaart(canvasRef.current, {
            achtergrond: achtergrondImg,
            clubLogo: clubLogoImg,
            tegLogo: tegLogoImg,
            basisSpelers: basisSpelers,
            wisselSpelers: wisselSpelers,
            sponsors: sponsorsMetLogos,
            match: match
          });
        }
      } catch (e) {
        console.error('Laad fout:', e);
      } finally {
        setIsLoading(false);
      }
    };

    if (match) laadEnTeken();
  }, [match?.id, match?.team, geselecteerdeAchtergrond]);

  const tekenKaart = async (canvas, data) => {
    const ctx = canvas.getContext('2d');
    canvas.width = BREEDTE;
    canvas.height = HOOGTE;

    const { achtergrond, clubLogo, tegLogo, basisSpelers, wisselSpelers, sponsors, match } = data;

    // Achtergrond
    ctx.fillStyle = '#10121A';
    ctx.fillRect(0, 0, BREEDTE, HOOGTE);

    if (achtergrond) {
      const schaalX = BREEDTE / achtergrond.width;
      const schaalY = HOOGTE / achtergrond.height;
      const schaal = Math.max(schaalX, schaalY);
      const w = achtergrond.width * schaal;
      const h = achtergrond.height * schaal;
      const x = (BREEDTE - w) / 2;
      const y = 0;
      ctx.drawImage(achtergrond, x, y, w, h);
    }

    // Gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, HOOGTE);
    gradient.addColorStop(0, 'rgba(10,12,20,0.15)');
    gradient.addColorStop(0.35, 'rgba(10,12,20,0.4)');
    gradient.addColorStop(0.55, 'rgba(10,12,20,0.85)');
    gradient.addColorStop(0.7, 'rgba(10,12,20,0.97)');
    gradient.addColorStop(1, 'rgba(10,12,20,1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BREEDTE, HOOGTE);

    // Header balk
    if (clubLogo) {
      ctx.drawImage(clubLogo, 56, 52, 80, 80);
    }

    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
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
    const badgeY = 52;
    const badgeH = 52;

    ctx.fillStyle = '#FF6800';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeBreedte, badgeH, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeTekst.toUpperCase(), badgeX + badgeBreedte / 2, badgeY + badgeH / 2);

    // MATCHDAY tekst
    ctx.textAlign = 'left';
    ctx.font = 'bold 160px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('MATCHDAY', 56, 1080);

    // Datum + tijd
    const datum = new Date(match.date);
    const datumTekst = `${DAG_NAMEN[datum.getDay()].toUpperCase()} ${datum.getDate()} ${MAAND_NAMEN[datum.getMonth()].toUpperCase()} | ${match.start_time || ''}`;

    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FF6800';
    ctx.fillText(datumTekst, 56, 1130);

    // Locatie
    const locatie = match.home_away === 'Thuis'
      ? (match.location || 'Sportpark Douwekamp, Opeinde')
      : (match.location || '');

    if (locatie) {
      ctx.font = '28px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('📍 ' + locatie, 56, 1176);
    }

    // VS blok
    const vsY = 1220;

    if (clubLogo) {
      ctx.drawImage(clubLogo, 56, vsY, 72, 72);
    }
    
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText('MV ARTEMIS', 144, vsY + 36);

    ctx.font = 'bold 52px Arial';
    ctx.fillStyle = '#FF6800';
    ctx.textAlign = 'center';
    ctx.fillText('VS', 540, vsY + 36);

    if (tegLogo) {
      ctx.drawImage(tegLogo, BREEDTE - 56 - 72, vsY, 72, 72);
    }

    const tegNaam = match.opponent || '';
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'right';
    
    if (tegNaam.length > 12) {
      const woorden = tegNaam.split(' ');
      const helft = Math.ceil(woorden.length / 2);
      const regel1 = woorden.slice(0, helft).join(' ');
      const regel2 = woorden.slice(helft).join(' ');
      ctx.fillText(regel1, BREEDTE - 56, vsY + 24);
      ctx.fillText(regel2, BREEDTE - 56, vsY + 64);
    } else {
      ctx.fillText(tegNaam, BREEDTE - 56, vsY + 36);
    }

    // STARTING XI
    const xiY = 1340;
    
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
    let rijY = xiY + 36;
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
    const sponsorHoogte = 90;
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
      const sponsorAfstand = BREEDTE / (sponsors.length + 1);
      
      for (let i = 0; i < sponsors.length; i++) {
        const sponsor = sponsors[i];
        const sx = sponsorAfstand * (i + 1);
        const sy = sponsorY + sponsorHoogte / 2;

        if (sponsor.logo) {
          const logoMaxH = 36;
          const schaalFactor = logoMaxH / sponsor.logo.height;
          const logoW = sponsor.logo.width * schaalFactor;
          const logoH = logoMaxH;

          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = logoW;
          tmpCanvas.height = logoH;
          const tmpCtx = tmpCanvas.getContext('2d');
          
          tmpCtx.drawImage(sponsor.logo, 0, 0, logoW, logoH);
          tmpCtx.globalCompositeOperation = 'source-in';
          tmpCtx.fillStyle = '#ffffff';
          tmpCtx.fillRect(0, 0, logoW, logoH);
          
          ctx.globalAlpha = 0.85;
          ctx.drawImage(tmpCanvas, sx - logoW / 2, sy - logoH / 2, logoW, logoH);
          ctx.globalAlpha = 1;
        } else {
          ctx.font = 'bold 22px Arial';
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(sponsor.naam || '', sx, sy);
        }
      }
    }
  };

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    const team = match?.team?.replace(/\s+/g, '_') || 'team';
    const datum = match?.date?.split('T')[0] || 'datum';
    link.download = `matchday-${team}-${datum}.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", padding: 20,
    }}>
      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 600, display: "flex",
        justifyContent: "space-between", alignItems: "center", marginBottom: 16,
      }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
          Matchday Card
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 18,
        }}>×</button>
      </div>

      {/* Achtergrond selector */}
      <div style={{ width: "100%", maxWidth: 600, marginBottom: 12 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10,
          color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase",
          marginBottom: 8,
        }}>ACHTERGROND</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          <button onClick={() => setGeselecteerdeAchtergrond(null)} style={{
            background: "#202840",
            border: `2px solid ${geselecteerdeAchtergrond === null ? "#FF6800" : "rgba(255,255,255,0.1)"}`,
            width: 60, height: 80, borderRadius: 4, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.5)",
            cursor: "pointer", flexShrink: 0,
          }}>Geen</button>
          {achtergronden.map(bg => (
            <img key={bg.id} src={bg.foto_url} alt={bg.naam || ""}
              onClick={async () => {
                const img = await laadAfbeelding(bg.foto_url);
                setGeselecteerdeAchtergrond(img);
              }}
              style={{
                width: 60, height: 80, objectFit: "cover", borderRadius: 4, cursor: "pointer",
                border: `2px solid ${geselecteerdeAchtergrond ? "#FF6800" : "transparent"}`,
                flexShrink: 0,
              }} />
          ))}
        </div>
      </div>

      {/* Canvas preview */}
      <div style={{
        width: BREEDTE * SCHAAL,
        height: HOOGTE * SCHAAL,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        background: "#10121A"
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: `${BREEDTE * SCHAAL}px`,
            height: `${HOOGTE * SCHAAL}px`,
            display: "block",
            borderRadius: "8px"
          }}
        />
      </div>

      {/* Acties */}
      <div style={{ width: "100%", maxWidth: 540, display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={downloadPNG} disabled={isDownloading || isLoading} style={{
          flex: 1,
          background: (isDownloading || isLoading) ? "rgba(255,104,0,0.6)" : "#FF6800",
          color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
          padding: 14, border: "none", borderRadius: 4,
          cursor: (isDownloading || isLoading) ? "not-allowed" : "pointer",
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