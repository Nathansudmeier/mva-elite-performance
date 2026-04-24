import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";

async function fetchWebsiteData() {
  const res = await base44.functions.invoke('getWebsiteData', {});
  return res.data;
}
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

export default function WebsiteTeamPage({ teamNaam, teamTitel, accentKleur, competitie, imageVeld, breadcrumb, playerTeamNaam }) {
  const [players, setPlayers] = useState([]);
  const [wedstrijden, setWedstrijden] = useState([]);
  const [staff, setStaff] = useState([]);
  const [instellingen, setInstellingen] = useState(null);

  useEffect(() => {
    // playerTeamNaam is het team-veld in de Player entiteit (MO17, MO20, VR1)
    // teamNaam is het team-veld in AgendaItem (MO17, Dames 1, Beide)
    const playerTeam = playerTeamNaam || teamNaam;
    const agendaTeams = teamNaam === "Vrouwen 1" ? ["Dames 1", "Vrouwen 1"] : [teamNaam];

    fetchWebsiteData().then(data => {
      if (data?.instellingen) setInstellingen(data.instellingen);
    });
    Promise.all([
      base44.entities.Player.filter({ active: true }),
      base44.entities.AgendaItem.filter({ type: "Wedstrijd" }),
      base44.entities.Trainer.filter({ active: true }),
    ]).then(([pl, wedstr, st]) => {
      setPlayers((pl || []).filter(p => p.team === playerTeam).sort((a, b) => (a.shirt_number || 99) - (b.shirt_number || 99)));
      setWedstrijden((wedstr || []).filter(w => agendaTeams.includes(w.team) || w.team === "Beide"));
      setStaff(st || []);
    });
  }, [teamNaam, playerTeamNaam]);

  const today = new Date().toISOString().split("T")[0];
  const programma = wedstrijden.filter(w => w.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const resultaten = wedstrijden.filter(w => w.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const initials = (naam) => naam ? naam.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const heroStyle = {
    height: "1000px", position: "relative", overflow: "hidden",
    background: (instellingen && instellingen[imageVeld])
      ? `url(${instellingen[imageVeld]}) top center/cover no-repeat`
      : "linear-gradient(160deg, #1B2A5E 0%, #10121A 100%)",
    display: "flex", alignItems: "flex-end",
  };

  return (
    <WebsiteLayout>
      <section style={heroStyle}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(16,18,26,0.88) 0%, rgba(16,18,26,0.3) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,18,26,1) 0%, rgba(16,18,26,0) 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 48px", maxWidth: "1200px", width: "100%" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "10px" }}>{breadcrumb}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 8vw, 72px)", color: "#fff", lineHeight: 1 }}>
            {teamTitel.split(/(\d+)/).map((part, i) =>
              /\d/.test(part) ? <span key={i} style={{ color: accentKleur }}>{part}</span> : part
            )}
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "12px", maxWidth: "440px", lineHeight: 1.5 }}>{competitie}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>{competitie}</span>
            <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>Seizoen 2025/26</span>
            <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>{players.length} spelers</span>
          </div>
        </div>
      </section>

      <section style={{ background: "#10121A", padding: "48px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 70fr) minmax(0, 30fr)", gap: "32px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>SELECTIE 2025/26</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#fff", marginBottom: "20px" }}>SPELERS</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1B2A5E" }}>
                  {["#", "SPELER", "POSITIE"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textAlign: "left", letterSpacing: "1px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: "20px 14px", fontSize: "13px", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Nog geen spelers gekoppeld aan dit team.</td></tr>
                )}
                {players.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "#202840" : "#1C2438", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px 14px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: accentKleur }}>{p.shirt_number || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "#fff" }}>{p.name}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>{p.position || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>PROGRAMMA</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#fff", marginBottom: "16px" }}>WEDSTRIJDEN</div>
            {programma.length === 0 && resultaten.length === 0 && (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "24px" }}>Geen wedstrijden gevonden.</div>
            )}
            {programma.slice(0, 8).map(w => (
              <div key={w.id} style={{ background: "#202840", borderRadius: "6px", padding: "12px 14px", marginBottom: "8px", borderLeft: `3px solid ${w.home_away === "Thuis" ? accentKleur : "rgba(255,255,255,0.15)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                    {w.date ? format(parseISO(w.date), "EEEE d MMM", { locale: nl }) : ""}
                    {w.start_time ? ` · ${w.start_time}` : ""}
                  </span>
                  <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "3px", background: w.home_away === "Thuis" ? "rgba(255,104,0,0.18)" : "rgba(255,255,255,0.07)", color: w.home_away === "Thuis" ? accentKleur : "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{w.home_away || "Thuis"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {w.opponent_logo_url && <img src={w.opponent_logo_url} alt={w.title} style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "4px", background: "#fff", padding: "2px" }} />}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                      {w.home_away === "Thuis" ? `MV Artemis — ${w.title || "Tegenstander"}` : `${w.title || "Tegenstander"} — MV Artemis`}
                    </div>
                    {w.location && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{w.location}</div>}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: "32px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>TECHNISCHE STAF</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#fff", marginBottom: "16px" }}>STAF</div>
              {staff.map(s => (
                <div key={s.id} style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1B2A5E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", color: accentKleur }}>{initials(s.name)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{s.role_title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}