import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";

const DAG_NAMEN = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const MAAND_NAMEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function formatDateNL(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${DAG_NAMEN[d.getDay()]} ${d.getDate()} ${MAAND_NAMEN[d.getMonth()]}`;
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function MatchdayCard({ match, onClose }) {
  const kaartRef = useRef(null);
  const [spelers, setSpelers] = useState([]);
  const [achtergronden, setAchtergronden] = useState([]);
  const [selectedAchtergrond, setSelectedAchtergrond] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [instellingen, setInstellingen] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Data ophalen
  useEffect(() => {
    if (!match?.team) return;
    (async () => {
      const [allPlayers, allBg, allSponsors, instList] = await Promise.all([
        base44.entities.Player.filter({ team: match.team }).catch(() => []),
        base44.entities.MatchdayAchtergrond.list().catch(() => []),
        base44.entities.Sponsor.filter({ actief: true }).catch(() => []),
        base44.entities.WebsiteInstellingen.list().catch(() => []),
      ]);
      setSpelers(allPlayers || []);
      const filteredBg = (allBg || [])
        .filter(b => b.actief !== false && (b.team === match.team || b.team === "Alle"))
        .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
      setAchtergronden(filteredBg);
      if (filteredBg.length > 0) setSelectedAchtergrond(filteredBg[0]);
      setSponsors((allSponsors || []).sort((a, b) => (a.tier || 9) - (b.tier || 9) || (a.volgorde || 0) - (b.volgorde || 0)).slice(0, 6));
      if (instList && instList.length > 0) setInstellingen(instList[0]);
    })();
  }, [match?.team]);

  // Lineup koppelen
  const lineupArr = Array.isArray(match?.lineup) ? match.lineup : [];
  const basisSpelers = lineupArr
    .filter(item => item.slot === "basis" && item.player_id)
    .map(item => {
      const s = spelers.find(p => p.id === item.player_id);
      return {
        naam: s?.name || "Onbekend",
        nummer: s?.shirt_number || "",
      };
    });

  const subIds = match?.substitutes || [];
  const wisselSpelers = subIds.map(id => {
    const s = spelers.find(p => p.id === id);
    return {
      naam: s?.name || "Onbekend",
      nummer: s?.shirt_number || "",
    };
  }).filter(w => w.naam !== "Onbekend");

  const homeAway = match?.home_away || "Thuis";
  const headline = homeAway === "Uit" ? "OP PAD" : "MATCHDAY";

  const downloadPNG = async () => {
    if (!kaartRef.current) return;
    setIsDownloading(true);
    const node = kaartRef.current;
    const originalTransform = node.style.transform;
    try {
      node.style.transform = "none";
      const canvas = await html2canvas(node, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#10121A",
        logging: false,
      });
      node.style.transform = originalTransform;
      const link = document.createElement("a");
      link.download = `matchday-${match.team || "team"}-${match.date || "wedstrijd"}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Download mislukt:", error);
      alert("Download mislukt. Probeer opnieuw.");
      node.style.transform = originalTransform;
    } finally {
      setIsDownloading(false);
    }
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

      {/* Foto selector */}
      <div style={{
        width: "100%", maxWidth: 600, display: "flex", gap: 8,
        marginBottom: 12, overflowX: "auto", paddingBottom: 4,
      }}>
        <button onClick={() => setSelectedAchtergrond(null)} style={{
          background: "#202840",
          border: `2px solid ${selectedAchtergrond === null ? "#FF6800" : "rgba(255,255,255,0.1)"}`,
          width: 60, height: 80, borderRadius: 4, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.5)",
          cursor: "pointer", flexShrink: 0,
        }}>Geen</button>
        {achtergronden.map(bg => (
          <img key={bg.id} src={bg.foto_url} alt={bg.naam || ""}
            onClick={() => setSelectedAchtergrond(bg)}
            style={{
              width: 60, height: 80, objectFit: "cover", borderRadius: 4, cursor: "pointer",
              border: `2px solid ${selectedAchtergrond?.id === bg.id ? "#FF6800" : "transparent"}`,
              flexShrink: 0,
            }} />
        ))}
      </div>

      {/* Kaart preview */}
      <div style={{ width: 540, height: 960, position: "relative", overflow: "hidden", borderRadius: 8 }}>
        <CardCanvas
          ref={kaartRef}
          match={match}
          headline={headline}
          basisSpelers={basisSpelers}
          wisselSpelers={wisselSpelers}
          selectedAchtergrond={selectedAchtergrond}
          sponsors={sponsors}
          instellingen={instellingen}
        />
      </div>

      {/* Acties */}
      <div style={{ width: "100%", maxWidth: 540, display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={downloadPNG} disabled={isDownloading} style={{
          flex: 1, background: "#FF6800", color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
          padding: 14, border: "none", borderRadius: 4, cursor: isDownloading ? "wait" : "pointer",
          opacity: isDownloading ? 0.7 : 1,
        }}>
          {isDownloading ? "Bezig met genereren..." : "↓ Download PNG (1080×1920)"}
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

const CardCanvas = React.forwardRef(function CardCanvas(
  { match, headline, basisSpelers, wisselSpelers, selectedAchtergrond, sponsors, instellingen },
  ref
) {
  const FONT_STACK = "Arial, Helvetica, sans-serif";
  const team = match?.team || "";
  const opponent = match?.opponent || "";
  const opponentLogo = match?.opponent_logo || null;
  const homeAway = match?.home_away || "Thuis";

  const datumTijd = `${formatDateNL(match?.date).toUpperCase()} | ${match?.start_time || ""}`;
  const locatie = homeAway === "Thuis" ? "Sportpark Douwekamp, Opeinde" : "";

  // Splits basis in twee kolommen
  const halfIndex = Math.ceil(basisSpelers.length / 2);
  const colA = basisSpelers.slice(0, halfIndex);
  const colB = basisSpelers.slice(halfIndex);

  const wisselNamen = wisselSpelers.map(w => w.naam.split(" ")[0]).join(", ");

  const clubLogo = instellingen?.logo_url || null;

  return (
    <div ref={ref} style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      fontFamily: FONT_STACK, background: "#10121A",
      transform: "scale(0.5)", transformOrigin: "top left",
    }}>
      {/* LAAG 1: Achtergrond */}
      <div style={{ position: "absolute", inset: 0 }}>
        {selectedAchtergrond?.foto_url ? (
          <img src={selectedAchtergrond.foto_url} alt="" crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(160deg, #1B2A5E 0%, #0F1630 60%, #FF6800 200%)",
          }} />
        )}
      </div>

      {/* LAAG 2: Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(10,12,20,0.3) 0%, rgba(10,12,20,0.5) 30%, rgba(10,12,20,0.85) 55%, rgba(10,12,20,0.97) 70%, rgba(10,12,20,1) 100%)",
      }} />

      {/* LAAG 3: Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {/* SECTIE A: Bovenste balk */}
        <div style={{
          padding: "60px 64px 0", display: "flex",
          justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {clubLogo && (
              <img src={clubLogo} alt="" crossOrigin="anonymous"
                style={{ width: 80, height: 80, objectFit: "contain" }} />
            )}
            <div style={{ fontFamily: FONT_STACK, fontWeight: 900, fontSize: 36, color: "#fff", letterSpacing: "2px" }}>
              MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS
            </div>
          </div>
          <div style={{
            background: "#FF6800", color: "#fff", fontSize: 20, fontWeight: 700,
            letterSpacing: "2px", textTransform: "uppercase",
            padding: "8px 20px", borderRadius: 4,
          }}>
            {team}
          </div>
        </div>

        {/* SPACER duwt content naar onderen */}
        <div style={{ flex: 1 }} />

        {/* SECTIE B: Headline */}
        <div style={{ padding: "40px 64px 0" }}>
          <div style={{
            fontFamily: FONT_STACK, fontWeight: 900, fontSize: 180, color: "#fff",
            lineHeight: 0.85, letterSpacing: "-4px",
          }}>
            {headline}
          </div>
        </div>

        {/* SECTIE C: Datum + tijd + locatie */}
        <div style={{ padding: "0 64px", marginTop: 24 }}>
          <div style={{
            fontSize: 32, fontWeight: 700, color: "#FF6800",
            letterSpacing: "1px", textTransform: "uppercase",
          }}>
            {datumTijd}
          </div>
          {locatie && (
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
              {locatie}
            </div>
          )}
        </div>

        {/* SECTIE D: VS blok */}
        <div style={{ padding: "32px 64px", display: "flex", alignItems: "center", gap: 40 }}>
          {/* MV Artemis kant */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            {clubLogo && (
              <img src={clubLogo} alt="" crossOrigin="anonymous"
                style={{ width: 100, height: 100, objectFit: "contain" }} />
            )}
            <div style={{ fontFamily: FONT_STACK, fontWeight: 900, fontSize: 40, color: "#fff", letterSpacing: "1px" }}>
              MV ARTEMIS
            </div>
          </div>

          {/* VS */}
          <div style={{ fontFamily: FONT_STACK, fontWeight: 900, fontSize: 60, color: "#FF6800" }}>
            VS
          </div>

          {/* Tegenstander */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            {opponentLogo ? (
              <img src={opponentLogo} alt="" crossOrigin="anonymous"
                style={{ width: 100, height: 100, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            ) : (
              <div style={{
                width: 100, height: 100, borderRadius: "50%", background: "#1B2A5E",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_STACK, fontWeight: 900, fontSize: 36, color: "#fff",
              }}>{getInitials(opponent)}</div>
            )}
            <div style={{
              fontFamily: FONT_STACK, fontWeight: 900, fontSize: 40,
              color: "rgba(255,255,255,0.75)", letterSpacing: "1px",
              wordBreak: "break-word", lineHeight: 1.05,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {opponent}
            </div>
          </div>
        </div>

        {/* SECTIE E: Starting XI */}
        {basisSpelers.length > 0 && (
          <div style={{ padding: "24px 64px" }}>
            <div style={{
              fontFamily: FONT_STACK, fontWeight: 900, fontSize: 52, color: "#FF6800",
              letterSpacing: "2px", borderBottom: "2px solid #FF6800",
              paddingBottom: 12, marginBottom: 16,
            }}>
              STARTING XI
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {[colA, colB].map((col, ci) => (
                <div key={ci} style={{ display: "flex", flexDirection: "column" }}>
                  {col.map((sp, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 0" }}>
                      <div style={{
                        background: "#FF6800", color: "#fff", fontSize: 22, fontWeight: 700,
                        width: 44, height: 44, display: "flex", alignItems: "center",
                        justifyContent: "center", borderRadius: 4, flexShrink: 0,
                      }}>{sp.nummer || "—"}</div>
                      <div style={{
                        fontSize: 28, fontWeight: 700, color: "#fff",
                        textTransform: "uppercase", letterSpacing: "0.5px",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {sp.naam.split(" ")[0]}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTIE F: Substitutions */}
        {wisselSpelers.length > 0 && (
          <div style={{ padding: "16px 64px 120px" }}>
            <div style={{
              background: "#1B2A5E", display: "inline-block",
              padding: "6px 20px", borderRadius: 3,
              fontFamily: FONT_STACK, fontWeight: 900, fontSize: 28, color: "#fff",
              letterSpacing: "2px",
            }}>
              SUBSTITUTIONS
            </div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", marginTop: 10 }}>
              {wisselNamen}
            </div>
          </div>
        )}

        {/* SECTIE G: Sponsors balk */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "24px 64px",
          background: "rgba(10,12,20,0.9)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 48, flexWrap: "wrap",
        }}>
          {sponsors.length === 0 ? (
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", letterSpacing: "2px" }}>
              MV ARTEMIS · MEIDEN VERENIGING ARTEMIS
            </div>
          ) : (
            sponsors.map(s => s.logo_url ? (
              <img key={s.id} src={s.logo_url} alt={s.naam} crossOrigin="anonymous"
                style={{
                  maxHeight: 36, maxWidth: 120, objectFit: "contain",
                  filter: "brightness(0) invert(1)", opacity: 0.7,
                }} />
            ) : (
              <div key={s.id} style={{
                fontSize: 16, color: "rgba(255,255,255,0.7)",
                fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
              }}>{s.naam}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});