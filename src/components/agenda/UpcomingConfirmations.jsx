import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AgendaConfirmCard from "./AgendaConfirmCard";

export default function UpcomingConfirmations({ playerId }) {
  const today = new Date();
  const in14 = new Date();
  in14.setDate(today.getDate() + 14);
  const todayStr = today.toISOString().split("T")[0];
  const in14Str = in14.toISOString().split("T")[0];

  const { data: allItems = [] } = useQuery({
    queryKey: ["agendaItems-upcoming"],
    queryFn: () => base44.entities.AgendaItem.list(),
  });

  const { data: myAttendance = [] } = useQuery({
    queryKey: ["agenda-attendance-player", playerId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const upcoming = allItems
    .filter(i => i.date >= todayStr && i.date <= in14Str)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Only show items where the player hasn't responded yet
  const attendedIds = new Set(myAttendance.map(a => a.agenda_item_id));
  const pending = upcoming.filter(i => !attendedIds.has(i.id));

  if (!pending.length) return null;

  return (
    <div className="space-y-3">
      <p className="t-label">Bevestig je aanwezigheid</p>
      {pending.map(item => (
        <AgendaConfirmCard
          key={item.id}
          item={item}
          playerId={playerId}
          existingRecord={myAttendance.find(a => a.agenda_item_id === item.id)}
        />
      ))}
    </div>
  );
}