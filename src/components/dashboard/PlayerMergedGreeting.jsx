import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { addDays } from "date-fns";

const EMVI_IMAGES = {
  matchday: "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/8cf4e4152_Emvi-matchday.png",
  training: "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/11b24474b_Emvi-training.png",
  rest: "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/bc414decb_Emvi-rust.png",
};

const GREETINGS = {
  matchday: { title: "Matchday! 🔥", subtitle: "Laten we winnen vandaag!" },
  training: { title: "Trainingsdag! 💪", subtitle: "Tijd om te groeien" },
  rest: { title: "Rustdag 😴", subtitle: "Herstellen voor volgende week" },
};

const trainingQuotes = [
  'Je bent er. Dat is al meer dan de helft.',
  'Niemand wordt beter door thuis te zitten.',
  'Zeur niet. Train!',
  'Je benen doen het echt wel. Je hoofd liegt.',
  'De enige slechte training is de training die je oversloeg.'
];

const rustdagQuotes = [
  'Doe niks. Doe het goed.',
  'Je hoeft vandaag niemand iets te bewijzen.',
  'Slapen telt ook als trainen. Serieus.',
  'Rustdag, ook wel eens lekker toch?',
  'Morgen weer knallen, vandaag is gewoon #boring'
];

const matchdayQuotes = [
  'Hou op met nadenken, gewoon winnen vandaag!',
  'Als ik de tegenstander was, zou ik ook niet tegen jou willen spelen.',
  'Geen excuses, alles geven vandaag.',
  'Je weet het echt wel. Vandaag ga je het gewoon doen.',
  'Vandaag laat je zien waarom je de hele week traint!'
];

function getDayType(sessions, matches) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = addDays(new Date(), 1).toISOString().split("T")[0];

  const isMatchToday = matches.some(m => m.date === today);
  const isTrainingToday = sessions.some(s => s.date === today && s.type === "Training");
  const isMatchTomorrow = matches.some(m => m.date === tomorrow);

  if (isMatchToday) return "matchday";
  if (isTrainingToday) return "training";
  if (isMatchTomorrow) return "training";
  return "rest";
}

function DayBadge({ dayType }) {
  if (dayType === "training") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "20px", padding: "4px 12px", fontSize: "10px", fontWeight: 800, background: "#08D068", border: "1.5px solid #1a1a1a", color: "#1a1a1a", boxShadow: "2px 2px 0 #1a1a1a" }}>
        Training
      </span>
    );
  }
  if (dayType === "matchday") {
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

export default function PlayerMergedGreeting({ player, attendance = [], ratings = [], yoyo = [] }) {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const { data: sessions = [] } = useQuery({
    queryKey: ["trainingSessions"],
    queryFn: () => base44.entities.TrainingSession.list(),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list(),
  });

  const { data: trainingSessions = [] } = useQuery({
    queryKey: ["todayTraining"],
    queryFn: () => base44.entities.TrainingSession.list(),
    select: (data) =>
      data.filter((t) => {
        const today = new Date().toISOString().split("T")[0];
        return t.date === today;
      }),
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["todayAgenda"],
    queryFn: () => base44.entities.AgendaItem.list(),
    select: (data) =>
      data.filter((a) => {
        const today = new Date().toISOString().split("T")[0];
        return a.date === today;
      }),
  });

  // Determine day type
  let dayType = "rest";
  const today = new Date().toISOString().split("T")[0];
  const todayMatch = matches.find((m) => m.date === today);
  const hasMatch = todayMatch || agendaItems.some((a) => (a.type === "Wedstrijd" || a.type === "Toernooi") && a.date === today);
  const hasTraining = trainingSessions.length > 0 || agendaItems.some((a) => a.type === "Training" && a.date === today);

  if (hasMatch) dayType = "matchday";
  else if (hasTraining) dayType = "training";

  const greeting = GREETINGS[dayType];
  const emviUrl = EMVI_IMAGES[dayType];
  const quoteIndex = new Date().getDate() % 5;
  const quote = dayType === "matchday" ? matchdayQuotes[quoteIndex] : dayType === "training" ? trainingQuotes[quoteIndex] : rustdagQuotes[quoteIndex];

  const firstName = user?.full_name?.split(" ")[0] || "Speelster";
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const getCardStyle = () => {
    const baseStyle = {
      border: "2.5px solid #1a1a1a",
      borderRadius: "18px",
      boxShadow: "3px 3px 0 #1a1a1a",
      padding: "16px 18px",
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
    };

    if (dayType === "matchday") {
      return { ...baseStyle, background: "#FF6800" };
    }
    if (dayType === "training") {
      return { ...baseStyle, background: "#08D068" };
    }
    return { ...baseStyle, background: "#00C2FF" };
  };

  const getTextColor = () => {
    return dayType === "matchday" || dayType === "training" ? "#ffffff" : "#1a1a1a";
  };

  const getSecondaryColor = () => {
    if (dayType === "matchday") return "rgba(255,255,255,0.70)";
    if (dayType === "training") return "rgba(255,255,255,0.70)";
    return "rgba(26,26,26,0.40)";
  };

  const getQuoteColor = () => {
    if (dayType === "matchday") return "rgba(255,255,255,0.85)";
    if (dayType === "training") return "rgba(255,255,255,0.85)";
    return "rgba(26,26,26,0.55)";
  };

  const textColor = getTextColor();
  const secondaryColor = getSecondaryColor();
  const quoteColor = getQuoteColor();

  return (
    <div style={{ ...getCardStyle(), alignItems: "flex-end" }}>
      {/* Left: Profile photo */}
      <button
        onClick={() => navigate(`/PlayerDetail?id=${player?.id}`)}
        style={{ width: "70px", height: "70px", borderRadius: "50%", overflow: "hidden", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", background: "#FFD600", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        {player?.photo_url ? (
          <img src={player.photo_url} alt={firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a" }}>{initials}</span>
        )}
      </button>

      {/* Middle: Greeting and quote */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "9px", fontWeight: 800, color: secondaryColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 0" }}>
          Hallo {firstName}
        </p>
        <h2 style={{ fontSize: "16px", fontWeight: 900, color: textColor, margin: "0 0 4px 0", letterSpacing: "-0.3px" }}>
          {greeting.title}
        </h2>
        <div style={{ marginBottom: "6px" }}>
          <DayBadge dayType={dayType} />
        </div>
        <p style={{ fontSize: "12px", color: quoteColor, fontWeight: 500, margin: "0", fontStyle: "italic" }}>
          "{quote}"
        </p>
      </div>

      {/* Right: Emvi */}
      <img
        src={emviUrl}
        alt="Emvi"
        style={{ width: "100px", height: "100px", objectFit: "contain", flexShrink: 0 }}
      />
    </div>
  );
}