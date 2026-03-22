import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

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
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, background: "rgba(74,222,128,0.12)", border: "0.5px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#4ade80">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        Training
      </span>
    );
  }
  if (dayType === "match") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.30)", color: "#FF8C3A" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#FF8C3A">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        Matchday
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, background: "rgba(96,165,250,0.12)", border: "0.5px solid rgba(96,165,250,0.25)", color: "#60a5fa" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#60a5fa">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
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
    <div className="space-y-4" style={{ position: "relative", zIndex: 10 }}>
      {/* Greeting */}
      <div className="flex items-center gap-4" style={{ padding: "0.75rem 1.25rem 0.5rem", display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
           style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,107,0,0.40)", background: "rgba(255,107,0,0.20)" }}>
          {player?.photo_url ? (
            <img src={player.photo_url} alt={firstName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-lg font-bold">{initials}</span>
          )}
        </div>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, display: "flex", alignItems: "center", gap: "6px" }}>
            Hey {firstName} <HandWaveIcon color={waveColor} />
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
            <DayBadge dayType={dayType} />
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", margin: 0 }}>{subline}</p>
          </div>
        </div>
      </div>

      {/* Weekly highlight card */}
      <div className="relative" style={{ background: "rgba(255,107,0,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "0.5px solid rgba(255,107,0,0.35)", borderRadius: "22px", padding: "20px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(234,179,8,0.15)", border: "0.5px solid rgba(234,179,8,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="highlightGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#FF8C3A"/></linearGradient></defs>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="url(#highlightGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="url(#highlightGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 22h16" stroke="url(#highlightGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="url(#highlightGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="url(#highlightGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" stroke="url(#highlightGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em" }}>SEIZOENSHIGHLIGHT</p>
        </div>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", lineHeight: 1.5 }}>{highlight}</p>
      </div>
    </div>
  );
}