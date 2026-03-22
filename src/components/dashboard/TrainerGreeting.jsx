import React from "react";

export default function TrainerGreeting({ user }) {
  const firstName = user?.full_name?.split(" ")[0] || "Trainer";
  
  // Determine time of day
  const hour = new Date().getHours();
  let greeting = "Goedemorgen";
  if (hour >= 12 && hour < 18) greeting = "Goedemiddag";
  if (hour >= 18) greeting = "Goedenavond";

  return (
    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", marginBottom: "8px" }}>
      {greeting}, {firstName}
    </p>
  );
}