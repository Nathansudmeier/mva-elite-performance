import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

function getDaySubline(sessions, matches) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = addDays(new Date(), 1).toISOString().split("T")[0];

  const isTrainingToday = sessions.some(s => s.date === today && s.type === "Training");
  const isMatchToday = matches.some(m => m.date === today);
  const isMatchTomorrow = matches.some(m => m.date === tomorrow);

  if (isMatchToday) return "⚽ Vandaag is wedstrijddag — veel succes!";
  if (isMatchTomorrow) return "🔥 Morgen wedstrijd — zorg voor een goede avond!";
  if (isTrainingToday) return "💪 Trainingsdag — geef alles op het veld!";
  return "😴 Rustdag — herstel goed en laad op!";
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
    highlights.push(`Focus dit seizoen: "${player.iop_goal_1}" — je kunt het!`);
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
  const subline = getDaySubline(sessions, matches);
  const highlight = getWeeklyHighlight(player, attendance, ratings, yoyo);

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
          style={{ border: "1.5px solid rgba(255,107,0,0.4)", background: "rgba(255,107,0,0.15)" }}>
          {player?.photo_url ? (
            <img src={player.photo_url} alt={firstName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-lg font-bold">{initials}</span>
          )}
        </div>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Hey {firstName} 👋</h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginTop: "3px" }}>{subline}</p>
        </div>
      </div>

      {/* Weekly highlight card */}
      <div className="relative" style={{ background: "rgba(255,107,0,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "0.5px solid rgba(255,107,0,0.35)", borderRadius: "22px", padding: "20px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }} />
        <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>SEIZOENSHIGHLIGHT</p>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", lineHeight: 1.5 }}>{highlight}</p>
      </div>
    </div>
  );
}