import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { format } from "date-fns";

export default function DailyFeelingOverview() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayFeelings = [] } = useQuery({
    queryKey: ["dailyFeelingOverview", today],
    queryFn: async () => {
      const feelings = await base44.entities.DailyFeeling.filter({ date: today });
      const players = await base44.entities.Player.list();
      
      return feelings.map((feeling) => {
        const player = players.find((p) => p.id === feeling.player_id);
        return {
          ...feeling,
          playerName: player?.name || "Onbekend",
        };
      }).sort((a, b) => a.playerName.localeCompare(b.playerName));
    },
  });

  if (todayFeelings.length === 0) {
    return null;
  }

  return (
    <div className="glass" style={{ padding: "16px", marginBottom: "16px" }}>
      <p className="t-card-title" style={{ marginBottom: "12px" }}>Hoe voelen spelers zich vandaag?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {todayFeelings.map((feeling) => (
          <div key={feeling.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
            <p style={{ fontSize: "13px", color: "#1a1a1a", fontWeight: 500 }}>{feeling.playerName}</p>
            <div style={{ display: "flex", gap: "4px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= feeling.rating ? "#FF6800" : "none"}
                  color={star <= feeling.rating ? "#FF6800" : "rgba(26,26,26,0.20)"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}