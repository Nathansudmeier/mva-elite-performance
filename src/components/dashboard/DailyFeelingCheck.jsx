import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star } from "lucide-react";

const EMVI_IMAGE = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/17362aae0_Emvi-point.png";

export default function DailyFeelingCheck({ playerId }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["dailyFeeling"] });
    },
  });

  // Don't show if already answered today
  if (todayFeeling) {
    return null;
  }

  const handleRatingClick = (rating) => {
    setIsSubmitting(true);
    submitMutation.mutate(rating);
  };

  return (
    <div style={{
      background: "#FF6800",
      border: "2.5px solid #1a1a1a",
      borderRadius: "18px",
      boxShadow: "3px 3px 0 #1a1a1a",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: "120px 1fr",
      gap: "16px",
      alignItems: "center"
    }}>
      {/* Emvi character */}
      <img
        src={EMVI_IMAGE}
        alt="Emvi"
        style={{
          width: "100%",
          maxWidth: "110px",
          height: "auto",
          objectFit: "contain"
        }}
      />

      {/* Right content */}
      <div>
        <p className="t-section-title" style={{ color: "#ffffff", marginBottom: "8px" }}>Hoe voel je je vandaag?</p>
        <p className="t-secondary" style={{ color: "rgba(255,255,255,0.80)", marginBottom: "14px" }}>
          Geef je dagelijks stemming aan
        </p>
        
        {/* Star rating */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingClick(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(0)}
              disabled={isSubmitting}
              style={{
                background: "none",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                padding: 0,
                transition: "all 0.15s ease",
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              <Star
                size={28}
                fill={rating <= (hoveredRating || 0) ? "#1a1a1a" : "none"}
                color={rating <= (hoveredRating || 0) ? "#1a1a1a" : "rgba(26,26,26,0.25)"}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}