import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { PLAYER_FALLBACK_PHOTO } from "@/lib/playerFallback";

function getDayType(sessions, matches) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = addDays(new Date(), 1).toISOString().split("T")[0];

  const isMatchToday = matches.some(m => m.date === today);
  const isTrainingToday = sessions.some(s => s.date === today && s.type === "Training");
  const isMatchTomorrow = matches.some(m => m.date === tomorrow);

  if (isMatchToday) return "match";
  if (isTrainingToday) return "training";
  if (isMatchTomorrow) return "matchmorgen";
  return "rust";
}

function getDaySubline(dayType) {
  if (dayType === "match") return "Vandaag is wedstrijddag — veel succes!";
  if (dayType === "matchmorgen") return "Morgen wedstrijd — zorg voor een goede avond!";
  if (dayType === "training") return "Trainingsdag — geef alles op het veld!";
  return "Rustdag — herstel goed en laad op!";
}

function HandWaveIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke={color}>
      <path d="M18 11V9a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v7" />
      <path d="M6 15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3H6v3Z" />
      <path d="M11 6v-1a2 2 0 0 1 4 0" />
    </svg>
  );
}

function DayBadge({ dayType }) {
  if (dayType === "training" || dayType === "matchmorgen") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "4px 12px", fontSize: "10px", fontWeight: 800, background: "#08D068", border: "1.5px solid #1a1a1a", color: "#1a1a1a", boxShadow: "2px 2px 0 #1a1a1a" }}>
        Training
      </span>
    );
  }
  if (dayType === "match") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "4px 12px", fontSize: "10px", fontWeight: 800, background: "#FF6800", border: "1.5px solid #1a1a1a", color: "#ffffff", boxShadow: "2px 2px 0 #1a1a1a" }}>
        Matchday 🏆
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "4px 12px", fontSize: "10px", fontWeight: 800, background: "#00C2FF", border: "1.5px solid #1a1a1a", color: "#1a1a1a", boxShadow: "2px 2px 0 #1a1a1a" }}>
      Rustdag
    </span>
  );
}

function getWeeklyHighlight(player, attendance, ratings, yoyo) {
  // Use week number as seed to rotate highlights
  const now = new Date();
  const weekNum = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));

  const highlights = [];

  const presentCount = attendance.filter(a => a.present).length;
  const pct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null;
  if (pct !== null) highlights.push(`Je aanwezigheid staat op ${pct}% — ${pct >= 80 ? "indrukwekkend!" : "er is nog ruimte voor groei."}`);

  if (yoyo.length > 0) {
    const last = [...yoyo].sort((a, b) => a.date > b.date ? 1 : -1).pop();
    highlights.push(`Jouw laatste Yo-Yo level was ${last.level} — blijf pushen!`);
  }

  if (ratings.length > 0) {
    highlights.push(`Je hebt ${ratings.length} beoordeling${ratings.length > 1 ? "en" : ""} ontvangen dit seizoen.`);
  }

  if (player?.iop_goal_1) {
     highlights.push(`Focus dit seizoen: ${player.iop_goal_1}. Je kunt het!`);
   }

  if (highlights.length === 0) {
    highlights.push("Welkom bij het nieuwe seizoen — maak er iets moois van!");
  }

  return highlights[weekNum % highlights.length];
}

export default function PlayerGreetingHeader({ user, player, attendance = [], ratings = [], yoyo = [] }) {
  const navigate = useNavigate();
  const { data: sessions = [] } = useQuery({
    queryKey: ["trainingSessions"],
    queryFn: () => base44.entities.TrainingSession.list(),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list(),
  });

  const firstName = user?.full_name?.split(" ")[0] || "Speelster";
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const dayType = getDayType(sessions, matches);
  const subline = getDaySubline(dayType);
  const highlight = getWeeklyHighlight(player, attendance, ratings, yoyo);
  const waveColor = (dayType === "training" || dayType === "match") ? "#FF8C3A" : "rgba(255,255,255,0.45)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Hero greeting card */}
      <div style={{ background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem", display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          onClick={() => navigate(`/PlayerDetail?id=${player?.id}`)}
          style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", background: "#FFD600", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <img src={player?.photo_url || PLAYER_FALLBACK_PHOTO} alt={firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.70)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "4px" }}>Welkom terug</p>
          <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            Hey {firstName}!
          </h1>
          <div style={{ marginTop: "8px" }}>
            <DayBadge dayType={dayType} />
          </div>
        </div>
      </div>

      {/* Highlight card */}
      <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem", display: "flex", alignItems: "flex-end", gap: "12px", overflow: "hidden", position: "relative", minHeight: "90px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Mijn doelen</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5 }}>{highlight}</p>
        </div>
        <img
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/4f144d80c_Emvi-cheer.png"
          alt="Emvi"
          style={{ width: "80px", height: "80px", objectFit: "contain", objectPosition: "bottom", flexShrink: 0, marginBottom: "-16px", marginRight: "-4px" }}
        />
      </div>
    </div>
  );
}