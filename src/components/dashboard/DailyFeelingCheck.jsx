import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { format } from "date-fns";

export default function DailyFeelingCheck({ playerId }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayFeeling } = useQuery({
    queryKey: ["dailyFeeling", playerId, today],
    queryFn: async () => {
      const results = await base44.entities.DailyFeeling.filter({
        player_id: playerId,
        date: today
      });
      return results?.[0] || null;
    },
  });

  const submitMutation = useMutation({
    mutationFn: (rating) =>
      base44.entities.DailyFeeling.create({
        player_id: playerId,
        date: today,
        rating: rating,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyFeeling"] });
    },
  });

  // Don't show if already answered today
  if (todayFeeling) {
    return null;
  }

  return (
    <div className="glass" style={{ padding: "16px", marginBottom: "16px" }}>
      <p className="t-card-title" style={{ marginBottom: "12px" }}>Hoe voel je je vandaag?</p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => submitMutation.mutate(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Star
              size={32}
              fill={rating <= (hoveredRating || 0) ? "#FF6800" : "none"}
              color={rating <= (hoveredRating || 0) ? "#FF6800" : "rgba(26,26,26,0.20)"}
              style={{ transition: "all 0.15s ease" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}