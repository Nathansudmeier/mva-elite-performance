import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

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

export default function GreetingWithEmvi() {
  const { user } = useCurrentUser();

  const { data: matches = [] } = useQuery({
    queryKey: ["todayMatches"],
    queryFn: () => base44.entities.Match.list(),
    select: (data) =>
      data.filter((m) => {
        const today = new Date().toISOString().split("T")[0];
        return m.date === today;
      }),
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
  const hasMatch = matches.length > 0 || agendaItems.some((a) => a.type === "Wedstrijd" || a.type === "Toernooi");
  const hasTraining = trainingSessions.length > 0 || agendaItems.some((a) => a.type === "Training");

  if (hasMatch) dayType = "matchday";
  else if (hasTraining) dayType = "training";

  const greeting = GREETINGS[dayType];
  const emviUrl = EMVI_IMAGES[dayType];

  return (
    <div
      style={{
        background: "#ffffff",
        border: "2.5px solid #1a1a1a",
        borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "12px",
      }}
    >
      <img
        src={emviUrl}
        alt="Emvi"
        style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.40)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px 0" }}>
          Hallo {user?.full_name?.split(" ")[0]}
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a", margin: "0 0 2px 0", letterSpacing: "-0.3px" }}>
          {greeting.title}
        </h2>
        <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)", fontWeight: 500, margin: 0 }}>
          {greeting.subtitle}
        </p>
      </div>
    </div>
  );
}