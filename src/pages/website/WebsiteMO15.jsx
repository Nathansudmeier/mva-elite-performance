import React from "react";
import { Link } from "react-router-dom";
import WebsiteLayout from "../../components/website/WebsiteLayout";
import TeamNav from "../../components/website/TeamNav";
import TrainingsTijdenBlok, { TIJDEN_MO15 } from "@/components/website/TrainingsTijdenBlok";

const STAND = [
  { rank: 1, team: "FC MVA Noord MO15-1", g: 8, w: 8, gl: 0, v: 0, p: 24, voor: 60, tegen: 2, highlight: true },
  { rank: 2, team: "Zwaagwesteinde MO15-1", g: 7, w: 4, gl: 0, v: 3, p: 12, voor: 12, tegen: 17 },
  { rank: 3, team: "Fc. Grootegast MO15-1", g: 7, w: 4, gl: 0, v: 3, p: 12, voor: 12, tegen: 20 },
  { rank: 4, team: "VEV'67 MO15-1", g: 8, w: 2, gl: 3, v: 3, p: 9, voor: 6, tegen: 9 },
  { rank: 5, team: "ST Ternaard/H/B MO15-1", g: 7, w: 2, gl: 2, v: 3, p: 8, voor: 6, tegen: 8 },
  { rank: 6, team: "FC Surhústerfean MO15-1", g: 9, w: 1, gl: 3, v: 5, p: 6, voor: 2, tegen: 20 },
  { rank: 7, team: "vv Winsum MO15-1", g: 8, w: 1, gl: 2, v: 5, p: 5, voor: 6, tegen: 28 },
];

const PROGRAMMA = [
  { datum: "Za 9 mei 2026", tijd: "11:15", thuis: "Fc. Grootegast MO15-1", uit: "FC MVA Noord MO15-1", thuis_highlight: false },
  { datum: "Za 16 mei 2026", tijd: "12:15", thuis: "FC MVA Noord MO15-1", uit: "Zwaagwesteinde MO15-1", thuis_highlight: true },
  { datum: "Vr 22 mei 2026", tijd: "19:00", thuis: "FC MVA Noord MO15-1", uit: "ST Ternaard/Holwerd/Blija MO15-1", thuis_highlight: true },
  { datum: "Za 30 mei 2026", tijd: "10:30", thuis: "ST Ternaard/Holwerd/Blija MO15-1", uit: "FC MVA Noord MO15-1", thuis_highlight: false },
];

const UITSLAGEN = [
  { datum: "wo 22 apr", thuis: "FC MVA Noord", uit: "VEV'67", score: "3-1", win: true },
  { datum: "za 18 apr", thuis: "FC Surhústerfean", uit: "FC MVA Noord", score: "0-5", win: true },
  { datum: "za 28 mrt", thuis: "vv Winsum", uit: "FC MVA Noord", score: "0-8", win: true },
  { datum: "wo 25 mrt", thuis: "VEV'67", uit: "FC MVA Noord", score: "0-2", win: true },
  { datum: "za 14 mrt", thuis: "Zwaagwesteinde", uit: "FC MVA Noord", score: "0-10", win: true },
  { datum: "wo 11 mrt", thuis: "FC MVA Noord", uit: "Fc. Grootegast", score: "14-1", win: true },
  { datum: "za 7 mrt", thuis: "FC MVA Noord", uit: "vv Winsum", score: "9-0", win: true },
  { datum: "vr 23 jan", thuis: "FC MVA Noord", uit: "FC Surhústerfean", score: "9-0", win: true },
];

const TH_STYLE = { padding: "8px 12px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textAlign: "left", letterSpacing: "1px" };

export default function WebsiteMO15() {
  return (
    <WebsiteLayout>
      {/* HERO */}
      <section style={{ height: "400px", position: "relative", overflow: "hidden", background: "url('https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/482ec233d_header-contact_qlwaz0.png') center/cover no-repeat, linear-gradient(135deg, #0F1630, #1B2A5E)", display: "flex", alignItems: "flex-end" }}>
        {/* Donkere overlay voor leesbaarheid */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(15,22,48,0.88) 0%, rgba(15,22,48,0.45) 60%, rgba(15,22,48,0.25) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,22,48,0.95) 0%, rgba(15,22,48,0) 50%)" }} />
        {/* Oranje gloed rechtsboven */}
        <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "70%", background: "radial-gradient(circle at top right, rgba(255,104,0,0.15), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px 40px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "8px" }}>SELECTIES / MO15</div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>Seizoen 2025/26 · Tijdelijk</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "72px", color: "#fff", lineHeight: 0.9 }}>
            MO <span style={{ color: "#FF6800" }}>15</span>
          </div>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "12px", maxWidth: "560px", lineHeight: 1.55 }}>
            De MO15 speelt dit seizoen mee en vormt volgend jaar de kern van de MO17. Koploper in de 1e klasse.
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            {["1e klasse (3e fase)", "Seizoen 2025/26", "Koploper"].map(b => (
              <span key={b} style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", padding: "4px 10px", borderRadius: "3px", fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      <TeamNav />

      {/* CONTENT */}
      <section style={{ background: "#10121A", padding: "48px 28px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 65fr) minmax(0, 35fr)", gap: "40px", alignItems: "start" }}>

          {/* LINKER KOLOM */}
          <div>
            {/* STAND */}
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginBottom: "6px" }}>RANGLIJST</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "28px", color: "#fff", marginBottom: "16px", margin: 0 }}>Stand</h2>
            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                <thead>
                  <tr style={{ background: "#1B2A5E" }}>
                    <th style={TH_STYLE}>#</th>
                    <th style={TH_STYLE}>Team</th>
                    <th style={{ ...TH_STYLE, textAlign: "center" }}>G</th>
                    <th style={{ ...TH_STYLE, textAlign: "center" }}>W</th>
                    <th style={{ ...TH_STYLE, textAlign: "center" }}>GL</th>
                    <th style={{ ...TH_STYLE, textAlign: "center" }}>V</th>
                    <th style={{ ...TH_STYLE, textAlign: "center" }}>P</th>
                    <th style={{ ...TH_STYLE, textAlign: "center" }}>+</th>
                    <th style={{ ...TH_STYLE, textAlign: "center" }}>-</th>
                  </tr>
                </thead>
                <tbody>
                  {STAND.map(r => {
                    const cellBase = { padding: "10px 12px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.7)", textAlign: "center" };
                    const rowStyle = {
                      background: r.highlight ? "rgba(255,104,0,0.06)" : "#202840",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      borderLeft: r.highlight ? "3px solid #FF6800" : "3px solid transparent",
                    };
                    return (
                      <tr key={r.rank} style={rowStyle}>
                        <td style={{ ...cellBase, textAlign: "left", fontWeight: 700, color: r.highlight ? "#FF6800" : "rgba(255,255,255,0.5)" }}>{r.rank}</td>
                        <td style={{ ...cellBase, textAlign: "left", fontWeight: r.highlight ? 700 : 500, color: r.highlight ? "#fff" : "rgba(255,255,255,0.75)", textTransform: r.highlight ? "uppercase" : "none" }}>{r.team}</td>
                        <td style={cellBase}>{r.g}</td>
                        <td style={cellBase}>{r.w}</td>
                        <td style={cellBase}>{r.gl}</td>
                        <td style={cellBase}>{r.v}</td>
                        <td style={{ ...cellBase, fontWeight: 700, color: "#fff" }}>{r.p}</td>
                        <td style={cellBase}>{r.voor}</td>
                        <td style={cellBase}>{r.tegen}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "8px" }}>
              Bron: voetbal.nl · Bijgewerkt april 2026
            </div>

            {/* PROGRAMMA */}
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginTop: "32px", marginBottom: "6px" }}>PROGRAMMA</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "28px", color: "#fff", marginBottom: "16px", margin: 0 }}>Komende wedstrijden</h2>
            <div style={{ marginTop: "16px", marginBottom: "32px" }}>
              {PROGRAMMA.map((w, i) => (
                <div key={i} style={{ background: "#202840", borderRadius: "6px", padding: "12px 16px", marginBottom: "8px" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 700, color: "#FF6800", textTransform: "uppercase", marginBottom: "8px" }}>{w.datum}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: w.thuis_highlight ? 700 : 500, color: w.thuis_highlight ? "#fff" : "rgba(255,255,255,0.6)", textAlign: "right" }}>{w.thuis}</div>
                    <div style={{ background: "#1B2A5E", borderRadius: "4px", padding: "4px 12px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#fff", flexShrink: 0 }}>{w.tijd}</div>
                    <div style={{ flex: 1, fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: !w.thuis_highlight ? 700 : 500, color: !w.thuis_highlight ? "#fff" : "rgba(255,255,255,0.6)" }}>{w.uit}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* UITSLAGEN */}
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800", marginTop: "0", marginBottom: "6px" }}>UITSLAGEN</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "28px", color: "#fff", marginBottom: "16px", margin: 0 }}>Resultaten</h2>
            <div style={{ marginTop: "16px" }}>
              {UITSLAGEN.map((u, i) => (
                <div key={i} style={{ background: "#202840", borderRadius: "6px", padding: "12px 16px", marginBottom: "8px", display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "12px", alignItems: "center" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{u.datum}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                    {u.thuis} {u.score} {u.uit}
                  </div>
                  <div style={{
                    background: u.win ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: u.win ? "#22C55E" : "#EF4444",
                    borderRadius: "3px",
                    padding: "3px 10px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: "11px",
                  }}>
                    {u.win ? "Winst" : "Verlies"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECHTER KOLOM */}
          <div>
            {/* INFO BLOK BOVENAAN */}
            <div style={{ background: "#202840", borderRadius: "6px", padding: "20px", marginBottom: "16px", borderLeft: "3px solid #FF6800" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "22px", color: "#fff", marginBottom: "8px" }}>Ongeslagen dit seizoen</div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>
                De MO15 heeft dit seizoen alle 8 wedstrijden gewonnen met een doelsaldo van 60-2. Dat zegt alles over het niveau en de mentaliteit van deze groep.
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#FF6800", lineHeight: 1 }}>8/8</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Gewonnen</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#FFD600", lineHeight: 1 }}>60</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Goals voor</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#fff", lineHeight: 1 }}>2</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Goals tegen</div>
                </div>
              </div>
            </div>

            {/* TIJDELIJK BERICHT */}
            <div style={{ background: "rgba(255,104,0,0.06)", border: "1px solid rgba(255,104,0,0.2)", borderRadius: "6px", padding: "16px 20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#FF6800" }}>SEIZOENSINFORMATIE</div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginTop: "6px", margin: 0 }}>
                De MO15 speelt dit seizoen als tijdelijke selectie binnen MV Artemis. Vanaf seizoen 2026/27 stromen deze speelsters door naar de MO17. De pagina wordt aan het einde van het seizoen verwijderd.
              </p>
            </div>

            {/* TRAININGSTIJDEN */}
            <div style={{ marginBottom: "16px" }}>
              <TrainingsTijdenBlok tijden={TIJDEN_MO15} />
            </div>

            {/* DOORSTROOM BERICHT */}
            <div style={{ background: "#202840", borderRadius: "6px", padding: "20px" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "20px", color: "#fff", marginBottom: "8px" }}>Klaar voor de MO17?</div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: "14px" }}>
                Speel jij dit seizoen in de MO15 en wil je volgend jaar de stap maken naar de MO17 van MV Artemis? We kijken ernaar uit.
              </p>
              <Link to="/contact" style={{ background: "#FF6800", color: "#fff", borderRadius: "3px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "12px", padding: "8px 16px", textDecoration: "none", display: "inline-block" }}>
                Neem contact op →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* CTA ONDERAAN */}
      <section style={{ background: "#1B2A5E", padding: "40px 28px", textAlign: "center" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>DE TOEKOMST VAN MV ARTEMIS</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 700, fontSize: "40px", color: "#fff", lineHeight: 0.9, marginBottom: "14px", margin: 0 }}>
          Deze meiden vormen<br />de MO17 van morgen.
        </h2>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "14px 0 0" }}>
          Ongeslagen. Koploper. Klaar voor de volgende stap.
        </p>
      </section>
    </WebsiteLayout>
  );
}