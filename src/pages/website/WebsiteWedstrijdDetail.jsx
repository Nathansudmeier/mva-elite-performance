import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import WebsiteLayout from "../../components/website/WebsiteLayout";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

export default function WebsiteWedstrijdDetail() {
  const { id } = useParams();
  const [wedstrijd, setWedstrijd] = useState(null);
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions.invoke("getWebsiteData", {}).then((res) => {
      const data = res?.data || {};
      setInst(data.instellingen || null);
      setPlayers(data.players || []);
      const w = (data.wedstrijden || []).find((x) => x.id === id);
      setWedstrijd(w || null);
      if (w?.match_id) {
        const m = (data.matches || []).find((x) => x.id === w.match_id);
        setMatch(m || null);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <WebsiteLayout>
        <div style={{ background: "#10121A", padding: "120px 28px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
          Laden…
        </div>
      </WebsiteLayout>
    );
  }

  if (!wedstrijd) {
    return (
      <WebsiteLayout>
        <div style={{ background: "#10121A", padding: "120px 28px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", marginBottom: "12px" }}>
            Wedstrijd niet gevonden
          </h1>
          <Link to="/wedstrijden" style={{ color: "#FF6800", fontWeight: 700, textDecoration: "none" }}>
            ← Terug naar wedstrijden
          </Link>
        </div>
      </WebsiteLayout>
    );
  }

  const heeftScore = match && match.score_home != null && match.score_away != null;
  const isThuis = wedstrijd.home_away === "Thuis";

  // Selectie samenstellen vanuit Match
  const lineup = Array.isArray(match?.lineup) ? match.lineup : [];
  const subs = Array.isArray(match?.substitutes) ? match.substitutes : [];
  const playerById = (pid) => players.find((p) => p.id === pid);

  const opstellingSpelers = lineup
    .map((slot) => ({ slot: slot.slot, player: playerById(slot.player_id) }))
    .filter((x) => x.player);
  const wisselSpelers = subs.map((pid) => playerById(pid)).filter(Boolean);

  const heeftSelectie = opstellingSpelers.length > 0 || wisselSpelers.length > 0;

  const locatieEncoded = encodeURIComponent(wedstrijd.location || "");
  const mapsEmbed = wedstrijd.location
    ? `https://www.google.com/maps?q=${locatieEncoded}&output=embed`
    : null;
  const mapsLink = wedstrijd.location
    ? `https://www.google.com/maps/search/?api=1&query=${locatieEncoded}`
    : null;

  return (
    <WebsiteLayout>
      {/* HERO */}
      <section style={{ background: "#14192A", padding: "48px 28px 32px", borderBottom: "3px solid #FF6800" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Link
            to="/wedstrijden"
            style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", textDecoration: "none", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700 }}
          >
            ← Terug naar wedstrijden
          </Link>
          <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "4px", background: "rgba(255,104,0,0.15)", color: "#FF6800", fontWeight: 800, letterSpacing: "2px" }}>
              {wedstrijd.team}
            </span>
            <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "4px", background: isThuis ? "rgba(255,104,0,0.15)" : "rgba(255,255,255,0.07)", color: isThuis ? "#FF6800" : "rgba(255,255,255,0.6)", fontWeight: 800 }}>
              {wedstrijd.home_away || "Thuis"}
            </span>
            {wedstrijd.cancelled && (
              <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "4px", background: "rgba(255,61,168,0.15)", color: "#FF3DA8", fontWeight: 800 }}>
                AFGELAST
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 6vw, 64px)", color: "#fff", margin: "16px 0 8px", letterSpacing: "1px", lineHeight: 1 }}>
            MV Artemis <span style={{ color: "rgba(255,255,255,0.4)" }}>vs</span> {wedstrijd.title || "Tegenstander"}
          </h1>

          {heeftScore && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", color: "#FF6800", letterSpacing: "2px", lineHeight: 1 }}>
                {match.score_home} – {match.score_away}
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>
                Eindstand
              </span>
            </div>
          )}
        </div>
      </section>

      {/* INFO + MAP */}
      <section style={{ background: "#10121A", padding: "40px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* Info kaart */}
          <div style={{ background: "#1B2A5E", borderRadius: "8px", padding: "24px", borderLeft: "3px solid #FF6800" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#FF6800", marginBottom: "16px", textTransform: "uppercase" }}>
              Wedstrijdinfo
            </div>
            <InfoRow label="Datum" value={wedstrijd.date ? format(parseISO(wedstrijd.date), "EEEE d MMMM yyyy", { locale: nl }) : "—"} />
            <InfoRow label="Aanvang" value={wedstrijd.start_time || "—"} />
            <InfoRow label="Locatie" value={wedstrijd.location || "—"} />
            <InfoRow label="Team" value={wedstrijd.team || "—"} />
            {wedstrijd.notes && <InfoRow label="Notitie" value={wedstrijd.notes} />}
            {wedstrijd.cancelled && wedstrijd.cancel_reason && (
              <InfoRow label="Reden afgelast" value={wedstrijd.cancel_reason} />
            )}
          </div>

          {/* Maps */}
          {mapsEmbed && (
            <div style={{ background: "#1B2A5E", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#FF6800", textTransform: "uppercase" }}>
                  Locatie
                </div>
                <a href={mapsLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#FF6800", fontWeight: 700, textDecoration: "none" }}>
                  Routebeschrijving →
                </a>
              </div>
              <iframe
                title="Locatie kaart"
                src={mapsEmbed}
                width="100%"
                height="280"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </section>

      {/* SELECTIE */}
      <section style={{ background: "#0F1426", padding: "40px 28px 64px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "3px", color: "#FF6800", marginBottom: "8px", textTransform: "uppercase" }}>
            Wedstrijdselectie
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#fff", margin: "0 0 24px", letterSpacing: "1px" }}>
            DE OPSTELLING
          </h2>

          {!heeftSelectie ? (
            <div style={{ background: "#1B2A5E", borderRadius: "8px", padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
              De selectie wordt binnenkort bekend gemaakt.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {opstellingSpelers.length > 0 && (
                <div style={{ background: "#1B2A5E", borderRadius: "8px", padding: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#FF6800", marginBottom: "16px", textTransform: "uppercase" }}>
                    Basisopstelling {match?.formation ? `· ${match.formation}` : ""}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {opstellingSpelers.map(({ slot, player }) => (
                      <SpelerRij key={slot} slot={slot} player={player} />
                    ))}
                  </div>
                </div>
              )}

              {wisselSpelers.length > 0 && (
                <div style={{ background: "#1B2A5E", borderRadius: "8px", padding: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#FF6800", marginBottom: "16px", textTransform: "uppercase" }}>
                    Wissels
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {wisselSpelers.map((p) => (
                      <SpelerRij key={p.id} player={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </WebsiteLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "12px" }}>
      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#fff", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function SpelerRij({ slot, player }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
      {player.photo_url ? (
        <img src={player.photo_url} alt={player.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,104,0,0.4)" }} />
      ) : (
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FF6800", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
          {(player.name || "?").charAt(0)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {player.name}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
          {slot ? slot : (player.position || "Speler")}
        </div>
      </div>
      {player.shirt_number != null && (
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#FF6800", letterSpacing: "1px" }}>
          {player.shirt_number}
        </div>
      )}
    </div>
  );
}