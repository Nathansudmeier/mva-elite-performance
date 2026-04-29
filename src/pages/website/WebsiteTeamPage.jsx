import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";
import TeamNav from "../../components/website/TeamNav";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { MapPin } from "@phosphor-icons/react";

export default function WebsiteTeamPage({ teamNaam, playerTeamNaam, teamTitel, accentKleur, competitie, imageVeld, breadcrumb, trainingstijden }) {
  const [players, setPlayers] = useState([]);
  const [wedstrijden, setWedstrijden] = useState([]);
  const [matches, setMatches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [instellingen, setInstellingen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playerTeam = playerTeamNaam || teamNaam;
    const agendaTeams = teamNaam === "Vrouwen 1" ? ["Dames 1", "Vrouwen 1"] : [teamNaam];

    base44.functions.invoke('getWebsiteData', {}).then(res => {
      const data = res.data;
      if (data?.instellingen) setInstellingen(data.instellingen);
      if (data?.players) {
        setPlayers(
          (data.players).filter(p => p.team === playerTeam)
            .sort((a, b) => (a.shirt_number || 99) - (b.shirt_number || 99))
        );
      }
      if (data?.wedstrijden) {
        setWedstrijden(
          (data.wedstrijden).filter(w => agendaTeams.includes(w.team) || w.team === "Beide")
        );
      }
      if (data?.matches) setMatches(data.matches);
      if (data?.trainers) setStaff(data.trainers);
      setLoading(false);
    });
  }, [teamNaam, playerTeamNaam]);

  const getMatchScore = (w) => {
    if (w.match_id) {
      const m = matches.find(m => m.id === w.match_id);
      if (m && m.score_home != null) return m;
    }
    const m = matches.find(m => m.date === w.date);
    if (m && m.score_home != null) return m;
    return null;
  };

  const today = new Date().toISOString().split("T")[0];
  const programma = wedstrijden.filter(w => w.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const resultaten = wedstrijden.filter(w => w.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const initials = (naam) => naam ? naam.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const heroStyle = {
    height: "520px",
    position: "relative",
    overflow: "hidden",
    background: (instellingen && instellingen[imageVeld])
      ? `url(${instellingen[imageVeld]}) top center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex",
    alignItems: "flex-end",
  };

  return (
    <WebsiteLayout>
      {/* HERO */}
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "10px" }}>{breadcrumb}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "72px", color: "#fff", lineHeight: 0.9 }}>
            {teamTitel.split("\n").map((line, lineIdx) => (
              <div key={lineIdx}>
                {line.split(/(\d+)/).map((part, i) =>
                  /\d/.test(part) ? <span key={i} style={{ color: accentKleur }}>{part}</span> : part
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "12px", maxWidth: "440px", lineHeight: 1.5 }}>{competitie}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>{competitie}</span>
            <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>Seizoen 2025/26</span>
            {!loading && <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>{players.length} spelers</span>}
          </div>
        </div>
      </section>

      <TeamNav />

      {/* CONTENT */}
      <section style={{ background: "#10121A", padding: "48px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>Laden...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "48px" }}>

              {/* SPELERS */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>SELECTIE 2025/26</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", marginBottom: "20px" }}>SPELERS</div>
                {players.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Nog geen spelers gekoppeld aan dit team.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#1B2A5E" }}>
                        {["#", "SPELER", "POSITIE"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textAlign: "left", letterSpacing: "1px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p, i) => (
                        <tr key={p.id} style={{ background: i % 2 === 0 ? "#202840" : "#1C2438", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "12px 14px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: accentKleur, width: "48px" }}>{p.shirt_number || "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {p.photo_url ? (
                                <img src={p.photo_url} alt={p.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "12px", color: accentKleur }}>{initials(p.name)}</span>
                                </div>
                              )}
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{p.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{p.position || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SIDEBAR: Wedstrijden + Staf */}
              <div>
                {/* PROGRAMMA */}
                <div style={{ marginBottom: "40px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>PROGRAMMA</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", marginBottom: "16px" }}>WEDSTRIJDEN</div>

                  {programma.length === 0 && resultaten.length === 0 && (
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Geen wedstrijden gevonden.</div>
                  )}

                  {programma.length > 0 && (
                    <>
                      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>KOMENDE WEDSTRIJDEN</div>
                      {programma.slice(0, 6).map(w => (
                        <div key={w.id} style={{ background: "#202840", borderRadius: "6px", padding: "12px 14px", marginBottom: "8px", borderLeft: `3px solid ${w.home_away === "Thuis" ? accentKleur : "rgba(255,255,255,0.15)"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                              {w.date ? format(parseISO(w.date), "EEE d MMM", { locale: nl }) : ""}
                              {w.start_time ? ` · ${w.start_time}` : ""}
                            </span>
                            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "3px", background: w.home_away === "Thuis" ? "rgba(255,104,0,0.18)" : "rgba(255,255,255,0.07)", color: w.home_away === "Thuis" ? accentKleur : "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{w.home_away || "Thuis"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {w.opponent_logo_url && <img src={w.opponent_logo_url} alt={w.title} style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "4px", background: "#fff", padding: "2px", flexShrink: 0 }} />}
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                                {w.home_away === "Thuis" ? `MV Artemis — ${w.title || "Tegenstander"}` : `${w.title || "Tegenstander"} — MV Artemis`}
                              </div>
                              {w.location && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{w.location}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {resultaten.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>UITSLAGEN</div>
                      {resultaten.slice(0, 8).map(w => {
                        const matchData = getMatchScore(w);
                        const hasScore = matchData != null;
                        // score_home = MVA Noord, score_away = tegenstander (altijd)
                        const artemisScore = hasScore ? matchData.score_home : null;
                        const tegScore = hasScore ? matchData.score_away : null;
                        const resultaat = !hasScore ? null : artemisScore > tegScore ? "W" : artemisScore < tegScore ? "V" : "G";
                        const resultaatKleur = resultaat === "W" ? "#22c55e" : resultaat === "G" ? "#eab308" : resultaat === "V" ? "#ef4444" : null;
                        const scoreText = hasScore ? `${artemisScore} - ${tegScore}` : null;

                        return (
                          <div key={w.id} style={{ background: "#1C2438", borderRadius: "6px", padding: "10px 14px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: resultaatKleur ? `3px solid ${resultaatKleur}` : "3px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {w.opponent_logo_url && <img src={w.opponent_logo_url} alt={w.title} style={{ width: "22px", height: "22px", objectFit: "contain", background: "#fff", borderRadius: "3px", padding: "1px", flexShrink: 0 }} />}
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{w.title || "Tegenstander"}</div>
                                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{w.date ? format(parseISO(w.date), "d MMM", { locale: nl }) : ""} · {w.home_away}</div>
                              </div>
                            </div>
                            {hasScore ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: resultaatKleur || "#fff", fontWeight: 700 }}>{scoreText}</span>
                                {resultaat && <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px", background: resultaatKleur + "22", color: resultaatKleur, letterSpacing: "0.5px" }}>{resultaat}</span>}
                              </div>
                            ) : (
                              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* STAF */}
                {staff.length > 0 && (
                  <div style={{ marginBottom: trainingstijden ? "32px" : 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>TECHNISCHE STAF</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", marginBottom: "16px" }}>STAF</div>
                    {staff.map(s => (
                      <div key={s.id} style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                        {s.photo_url ? (
                          <img src={s.photo_url} alt={s.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", color: accentKleur }}>{initials(s.name)}</span>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{s.role_title || "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TRAININGSTIJDEN */}
                {trainingstijden && (
                  <div style={{ background: "#202840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "24px" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#FF6800", marginBottom: "6px" }}>TRAININGEN</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#fff", marginBottom: "20px" }}>WANNEER TRAINEN WE?</div>

                    {trainingstijden.map((rij, i, arr) => (
                      <div key={i} style={{
                        paddingBottom: i < arr.length - 1 ? "12px" : 0,
                        marginBottom: i < arr.length - 1 ? "12px" : 0,
                        borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{rij.dag}</div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{rij.tijd}</div>
                        {rij.omschrijving && (
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginTop: "2px" }}>{rij.omschrijving}</div>
                        )}
                      </div>
                    ))}

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px", marginTop: "16px" }}>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Sportpark+Douwekamp+Healwei+2+Opeinde"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#fff" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#FF6800"; e.currentTarget.style.textDecoration = "underline"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.textDecoration = "none"; }}
                      >
                        <MapPin weight="bold" size={16} color="#FF6800" style={{ flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 500 }}>Sportpark Douwekamp, Opeinde</span>
                      </a>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px", paddingLeft: "24px" }}>Klik voor routebeschrijving →</div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </section>
    </WebsiteLayout>
  );
}