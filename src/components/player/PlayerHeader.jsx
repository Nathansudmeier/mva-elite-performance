import React from "react";

function getSubline(sessions, matches) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const todaySession = sessions?.find(s => s.date === today);
  const tomorrowMatch = matches?.find(m => m.date === tomorrow);
  if (todaySession) return "Klaar voor de training van vanavond? 💪";
  if (tomorrowMatch) return "Morgen is het matchday 🔥";
  return "Geniet van je rustdag 💤";
}

export default function PlayerHeader({ user, player, sessions, matches }) {
  const firstName = user?.full_name?.split(" ")[0] || "speelster";
  const initials = user?.full_name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const subline = getSubline(sessions, matches);

  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-12 h-12 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
        {player?.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-white font-500 text-base">{initials}</span>
        )}
      </div>
      <div>
        <h1 className="text-[22px] font-500 text-[#1A1A1A] leading-tight">Hey {firstName} 👋</h1>
        <p className="text-sm text-[#888888]">{subline}</p>
      </div>
    </div>
  );
}