import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin } from "lucide-react";

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
  const [uitgelichteSpeler, setUitgelichteSpeler] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [instellingen, setInstellingen] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Data ophalen
  useEffect(() => {
    if (!match) return;
    (async () => {
      const [allPlayers, allBg, allSponsors, instList] = await Promise.all([
        base44.entities.Player.list().catch(() => []),
        base44.entities.MatchdayAchtergrond.list().catch(() => []),
        base44.entities.Sponsor.filter({ actief: true }).catch(() => []),
        base44.entities.WebsiteInstellingen.list().catch(() => []),
      ]);
      setSpelers(allPlayers || []);
      const filteredBg = (allBg || [])
        .filter(b => b.actief !== false && (!match.team || b.team === match.team || b.team === "Alle"))
        .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
      setAchtergronden(filteredBg);
      if (filteredBg.length > 0) setSelectedAchtergrond(filteredBg[0]);
      setSponsors((allSponsors || []).sort((a, b) => (a.tier || 9) - (b.tier || 9) || (a.volgorde || 0) - (b.volgorde || 0)).slice(0, 6));
      if (instList && instList.length > 0) setInstellingen(instList[0]);
    })();
  }, [match?.id, match?.team]);

  // Lineup koppelen
  const lineupArr = Array.isArray(match?.lineup) ? match.lineup : [];
  const basisSpelers = lineupArr
    .filter(item => item.slot === "basis" && item.player_id)
    .map(item => {
      const s = spelers.find(p => p.id === item.player_id);
      return {
        id: item.player_id,
        naam: s?.name || "Onbekend",
        nummer: s?.shirt_number || "",
        matchday_foto_url: s?.matchday_foto_url || null,
      };
    });

  // Auto-select eerste speler met matchday_foto_url
  const beschikbareUitgelicht = basisSpelers.filter(s => s.matchday_foto_url);
  useEffect(() => {
    if (!uitgelichteSpeler && beschikbareUitgelicht.length > 0) {
      setUitgelichteSpeler(beschikbareUitgelicht[0]);
    }
  }, [beschikbareUitgelicht.length]);

  const basisIds = new Set(basisSpelers.map(b => b.id));
  const subIds = (match?.substitutes || []).filter(id => !basisIds.has(id));
  const wisselSpelers = subIds.map(id => {
    const s = spelers.find(p => p.id === id);
    return {
      naam: s?.name || "Onbekend",
      nummer: s?.shirt_number || "",
    };
  }).filter(w => w.naam !== "Onbekend");

  const homeAway = match?.home_away || "Thuis";
  const headline = "MATCHDAY";

  const downloadPNG = async () => {
    if (!kaartRef.current) return;
    setIsDownloading(true);
    const kaart = kaartRef.current;
    const originalTransform = kaart.style.transform;
    let blobUrls = [];

    try {
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;

      // Stap 1: Laad alle afbeeldingen vooraf als blob URLs (CORS-safe)
      const alleAfbeeldingen = kaart.querySelectorAll("img");
      for (const img of alleAfbeeldingen) {
        if (img.src && !img.src.startsWith("blob:") && !img.src.startsWith("data:")) {
          try {
            const response = await fetch(img.src, { mode: "cors", cache: "force-cache" });
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            blobUrls.push({ img, originalSrc: img.src, blobUrl });
            img.src = blobUrl;
            await new Promise((resolve) => {
              if (img.complete) resolve();
              else { img.onload = resolve; img.onerror = resolve; }
            });
          } catch (e) {
            console.warn("Kon afbeelding niet laden:", img.src);
            blobUrls.push({ img, originalSrc: img.src, blobUrl: null });
          }
        }
      }

      // Stap 2: Verwijder schaling
      kaart.style.transform = "none";
      await new Promise(r => setTimeout(r, 100));

      // Stap 3: Genereer canvas
      const canvas = await html2canvas(kaart, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#10121A",
        logging: false,
        imageTimeout: 30000,
        foreignObjectRendering: false,
      });

      // Stap 4: Herstel schaling
      kaart.style.transform = originalTransform;

      // Stap 5: Herstel originele src URLs
      for (const { img, originalSrc, blobUrl } of blobUrls) {
        img.src = originalSrc;
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      }
      blobUrls = [];

      // Stap 6: Download
      const link = document.createElement("a");
      const team = match?.team?.replace(/\s+/g, "_") || "team";
      const datum = match?.date?.split("T")[0] || "datum";
      link.download = `matchday-${team}-${datum}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Download fout:", error);
      // Herstel state bij fout
      kaart.style.transform = originalTransform;
      for (const { img, originalSrc, blobUrl } of blobUrls) {
        img.src = originalSrc;
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      }

      // Fallback: probeer zonder CORS preload
      try {
        const html2canvasModule = await import("html2canvas");
        const html2canvas = html2canvasModule.default || html2canvasModule;
        kaart.style.transform = "none";
        const canvas = await html2canvas(kaart, {
          width: 1080, height: 1920, scale: 1,
          useCORS: true, allowTaint: true, backgroundColor: "#10121A",
        });
        kaart.style.transform = originalTransform;
        const link = document.createElement("a");
        link.download = "matchday-card.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (fallbackError) {
        console.error("Fallback ook mislukt:", fallbackError);
        alert("Download mislukt. Probeer een screenshot.");
      }
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

      {/* Achtergrond selector */}
      <div style={{ width: "100%", maxWidth: 600, marginBottom: 12 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10,
          color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase",
          marginBottom: 8,
        }}>ACHTERGROND</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
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
      </div>

      {/* Uitgelichte speler selector */}
      {beschikbareUitgelicht.length > 0 && (
        <div style={{ width: "100%", maxWidth: 600, marginBottom: 12 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10,
            color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase",
            marginBottom: 8,
          }}>UITGELICHTE SPELER</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            <button onClick={() => setUitgelichteSpeler(null)} style={{
              background: "#202840",
              border: `2px solid ${uitgelichteSpeler === null ? "#FF6800" : "rgba(255,255,255,0.1)"}`,
              padding: "6px 12px", borderRadius: 4, fontSize: 12,
              color: "rgba(255,255,255,0.4)", cursor: "pointer", flexShrink: 0,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>Geen uitgelichte speler</button>
            {beschikbareUitgelicht.map(sp => (
              <button key={sp.id} onClick={() => setUitgelichteSpeler(sp)} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", background: "#202840",
                border: `2px solid ${uitgelichteSpeler?.id === sp.id ? "#FF6800" : "transparent"}`,
                borderRadius: 4, cursor: "pointer", flexShrink: 0,
              }}>
                <img src={sp.matchday_foto_url} alt={sp.naam}
                  style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", background: "#10121A" }} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  {sp.naam.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kaart preview */}
      <div style={{ width: 540, height: 960, position: "relative", overflow: "hidden", borderRadius: 8 }}>
        <CardCanvas
          ref={kaartRef}
          match={match}
          headline={headline}
          basisSpelers={basisSpelers}
          wisselSpelers={wisselSpelers}
          selectedAchtergrond={selectedAchtergrond}
          uitgelichteSpeler={uitgelichteSpeler}
          sponsors={sponsors}
          instellingen={instellingen}
        />
      </div>

      {/* Acties */}
      <div style={{ width: "100%", maxWidth: 540, display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={downloadPNG} disabled={isDownloading} style={{
          flex: 1,
          background: isDownloading ? "rgba(255,104,0,0.6)" : "#FF6800",
          color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
          padding: 14, border: "none", borderRadius: 4,
          cursor: isDownloading ? "not-allowed" : "pointer",
        }}>
          {isDownloading ? "⏳ Genereren... even geduld" : "↓ Download PNG (1080×1920)"}
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
  { match, headline, basisSpelers, wisselSpelers, selectedAchtergrond, uitgelichteSpeler, sponsors, instellingen },
  ref
) {
  const FONT_STACK = "Arial, Helvetica, sans-serif";
  const team = match?.team || "";
  const opponent = match?.opponent || "";
  const opponentLogo = match?.opponent_logo || null;
  const homeAway = match?.home_away || "Thuis";

  const datumTijd = `${formatDateNL(match?.date).toUpperCase()} | ${match?.start_time || ""}`;
  const locatie = match?.location
    ? match.location
    : homeAway === "Thuis"
      ? "Sportpark Douwekamp, Opeinde"
      : "";

  const tegName = opponent || "";
  const tegFontSize = tegName.length > 20 ? 22 : tegName.length > 15 ? 28 : 36;

  const hasPlayer = !!uitgelichteSpeler?.matchday_foto_url;

  // Splits basis in twee kolommen (alleen bij geen speler)
  const halfIndex = Math.ceil(basisSpelers.length / 2);
  const colA = basisSpelers.slice(0, halfIndex);
  const colB = basisSpelers.slice(halfIndex);

  const wisselNamen = wisselSpelers.map(w => w.naam.split(" ")[0]).join(", ");

  const clubLogo = instellingen?.logo_url || null;

  const sectionMaxWidth = hasPlayer ? 580 : "none";

  return (
    <div ref={ref} style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      fontFamily: FONT_STACK, background: "#10121A",
      transform: "scale(0.5)", transformOrigin: "top left",
    }}>
      {/* LAAG 1: Achtergrond (CSS background-image voor betere html2canvas support) */}
      {selectedAchtergrond?.foto_url ? (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${selectedAchtergrond.foto_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }} />
      ) : (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, #1B2A5E 0%, #0F1630 60%, #FF6800 200%)",
        }} />
      )}

      {/* LAAG 2: Speler overlay */}
      {hasPlayer && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(10,12,20,0.95) 0%, rgba(10,12,20,0.7) 40%, rgba(10,12,20,0.1) 65%, transparent 80%)",
            zIndex: 1,
          }} />
          <img src={uitgelichteSpeler.matchday_foto_url} alt="" crossOrigin="anonymous"
            style={{
              position: "absolute", bottom: 0, right: 0,
              height: "85%", width: "auto", objectFit: "contain",
              objectPosition: "bottom right", zIndex: 2,
            }} />
        </div>
      )}

      {/* LAAG 3: Donkere gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: hasPlayer
          ? "linear-gradient(to bottom, rgba(10,12,20,0.2) 0%, rgba(10,12,20,0.3) 25%, rgba(10,12,20,0.75) 50%, rgba(10,12,20,0.95) 65%, rgba(10,12,20,1) 75%, rgba(10,12,20,1) 100%)"
          : "linear-gradient(to bottom, rgba(10,12,20,0.3) 0%, rgba(10,12,20,0.5) 30%, rgba(10,12,20,0.85) 55%, rgba(10,12,20,0.97) 70%, rgba(10,12,20,1) 100%)",
        zIndex: 3,
      }} />

      {/* LAAG 4: Tekstcontent */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", zIndex: 4 }}>
        {/* SECTIE A: Bovenste balk */}
        <div style={{
          padding: "40px 64px 0", display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {clubLogo && (
              <img src={clubLogo} alt="" crossOrigin="anonymous"
                style={{ width: 70, height: 70, objectFit: "contain", flexShrink: 0 }} />
            )}
            <div style={{
              display: "flex", alignItems: "center",
              fontFamily: FONT_STACK, fontWeight: 700, fontSize: 30,
              color: "#ffffff", letterSpacing: "2px", lineHeight: 1,
            }}>
              MV<span style={{ color: "#FF6800" }}>/</span>ARTEMIS
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#FF6800", color: "#ffffff",
            fontSize: 18, fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", padding: "10px 20px",
            borderRadius: 4, height: 44, minWidth: 100,
            textAlign: "center", lineHeight: 1,
          }}>
            {team}
          </div>
        </div>

        {/* SPACER duwt content naar onderen */}
        <div style={{ flex: 1 }} />

        {/* SECTIE B + C: Headline + datum/locatie wrapper */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 12,
          padding: "20px 64px 0", maxWidth: hasPlayer ? 600 : "none",
        }}>
          {/* SECTIE B: MATCHDAY headline */}
          <div style={{
            fontFamily: FONT_STACK, fontWeight: 900, fontSize: 140, color: "#fff",
            lineHeight: 0.85, letterSpacing: "-4px",
            marginBottom: 0, paddingBottom: 0,
          }}>
            {headline}
          </div>

          {/* SECTIE C: Datum + tijd + locatie */}
          <div style={{ marginTop: 16, maxWidth: sectionMaxWidth }}>
            <div style={{
              fontSize: 24, fontWeight: 700, color: "#FF6800",
              letterSpacing: "1px", textTransform: "uppercase",
              display: "block", clear: "both", position: "relative",
              zIndex: 10, marginBottom: 12, lineHeight: 1.1,
            }}>
              {datumTijd}
            </div>
            {locatie && (
              <div style={{
                fontSize: 24, color: "rgba(255,255,255,0.55)", marginTop: 6,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>📍</span>
                <span>{locatie}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTIE D: VS blok */}
        <div style={{ padding: "16px 64px", display: "flex", alignItems: "center", gap: 32, maxWidth: sectionMaxWidth }}>
          {/* MV Artemis kant */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
            {clubLogo && (
              <img src={clubLogo} alt="" crossOrigin="anonymous"
                style={{ width: 80, height: 80, objectFit: "contain" }} />
            )}
            <div style={{ fontFamily: FONT_STACK, fontWeight: 900, fontSize: 32, color: "#fff", letterSpacing: "1px" }}>
              MV ARTEMIS
            </div>
          </div>

          {/* VS */}
          <div style={{ fontFamily: FONT_STACK, fontWeight: 900, fontSize: 48, color: "#FF6800" }}>
            VS
          </div>

          {/* Tegenstander */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
            {opponentLogo ? (
              <img src={opponentLogo} alt="" crossOrigin="anonymous"
                style={{ width: 80, height: 80, objectFit: "contain" }} />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: "50%", background: "#1B2A5E",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_STACK, fontWeight: 900, fontSize: 30, color: "#fff",
              }}>{getInitials(opponent)}</div>
            )}
            <div style={{
              fontFamily: FONT_STACK, fontWeight: 900, fontSize: tegFontSize,
              color: "rgba(255,255,255,0.85)", letterSpacing: "1px",
              maxWidth: 240, lineHeight: 1.1,
              wordWrap: "break-word", wordBreak: "break-word", whiteSpace: "normal",
            }}>
              {opponent}
            </div>
          </div>
        </div>

        {/* SECTIE E: Starting XI */}
        {basisSpelers.length > 0 && (
          <div style={{ padding: "16px 64px 0", maxWidth: sectionMaxWidth }}>
            <div style={{
              fontFamily: FONT_STACK, fontWeight: 900, fontSize: 40, color: "#FF6800",
              letterSpacing: "2px", borderBottom: "2px solid #FF6800",
              paddingBottom: 10, marginBottom: 12,
            }}>
              STARTING XI
            </div>
            {hasPlayer ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                {basisSpelers.map((sp, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0" }}>
                    <div style={{
                      background: "#FF6800", color: "#fff", fontSize: 18, fontWeight: 700,
                      width: 36, height: 36, display: "flex", alignItems: "center",
                      justifyContent: "center", borderRadius: 4, flexShrink: 0,
                    }}>{sp.nummer || "—"}</div>
                    <div style={{
                      fontSize: 22, fontWeight: 700, color: "#fff",
                      textTransform: "uppercase", letterSpacing: "0.5px",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {sp.naam.split(" ")[0]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {[colA, colB].map((col, ci) => (
                  <div key={ci} style={{ display: "flex", flexDirection: "column" }}>
                    {col.map((sp, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0" }}>
                        <div style={{
                          background: "#FF6800", color: "#fff", fontSize: 18, fontWeight: 700,
                          width: 36, height: 36, display: "flex", alignItems: "center",
                          justifyContent: "center", borderRadius: 4, flexShrink: 0,
                        }}>{sp.nummer || "—"}</div>
                        <div style={{
                          fontSize: 22, fontWeight: 700, color: "#fff",
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
            )}
          </div>
        )}

        {/* SECTIE F: Substitutions */}
        {wisselSpelers.length > 0 && (
          <div style={{ padding: "12px 64px 120px", maxWidth: sectionMaxWidth }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "#1B2A5E", padding: "8px 24px", borderRadius: 3,
              fontFamily: FONT_STACK, fontWeight: 700, fontSize: 24, color: "#ffffff",
              letterSpacing: "2px", textTransform: "uppercase",
              lineHeight: 1, height: 48,
            }}>
              SUBSTITUTIONS
            </div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 10 }}>
              {wisselNamen}
            </div>
          </div>
        )}

        {/* SECTIE G: Sponsors balk */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "20px 64px",
          background: "rgba(8,9,13,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 40, flexWrap: "wrap", minHeight: 70,
        }}>
          {sponsors.length === 0 ? (
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", letterSpacing: "2px" }}>
              MV ARTEMIS · MEIDEN VERENIGING ARTEMIS
            </div>
          ) : (
            sponsors.map(s => s.logo_url ? (
              <img key={s.id} src={s.logo_url} alt={s.naam} crossOrigin="anonymous"
                style={{
                  maxHeight: 32, maxWidth: 110, objectFit: "contain",
                  filter: "brightness(0) invert(1)", opacity: 0.85,
                  background: "transparent",
                }} />
            ) : (
              <div key={s.id} style={{
                fontFamily: "Arial, sans-serif",
                fontSize: 18, color: "rgba(255,255,255,0.8)",
                fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                background: "transparent",
              }}>{s.naam}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});