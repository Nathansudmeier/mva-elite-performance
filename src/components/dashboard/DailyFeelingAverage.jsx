import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";

const EMVI_IMAGE = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/17362aae0_Emvi-point.png";

export default function DailyFeelingAverage({ trainingDate, isTrainer }) {
  const { data: allFeelings = [] } = useQuery({
    queryKey: ["daily-feelings", trainingDate],
    queryFn: () => base44.entities.DailyFeeling.list("-date"),
  });

  // Filter feelings for today's training
  const todayFeelings = allFeelings.filter(f => f.date === trainingDate);

  if (!isTrainer || todayFeelings.length === 0) {
    return null;
  }

  // Calculate average
  const average = (todayFeelings.reduce((sum, f) => sum + (f.rating || 0), 0) / todayFeelings.length).toFixed(1);
  const count = todayFeelings.length;

  return (
    <div style={{
      background: "#ffffff",
      border: "2.5px solid #1a1a1a",
      borderRadius: 18,
      boxShadow: "3px 3px 0 #1a1a1a",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12
    }}>
      <div style={{ width: 48, height: 48, flexShrink: 0 }}>
        <img src={EMVI_IMAGE} alt="Emvi" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(26,26,26,0.55)", marginBottom: 4 }}>
          Gemiddelde gevoel vandaag
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#FF6800" }}>{average}</span>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                size={16}
                style={{
                  fill: i <= Math.round(average) ? "#FF6800" : "rgba(26,26,26,0.15)",
                  color: i <= Math.round(average) ? "#FF6800" : "rgba(26,26,26,0.15)"
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "rgba(26,26,26,0.55)", marginLeft: 8 }}>({count})</span>
        </div>
      </div>
    </div>
  );
}