import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function WedstrijdbelevingChart({ playerId }) {
  const { data: checkIns = [] } = useQuery({
    queryKey: ["matchCheckIns", playerId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list(),
  });

  // Build chart data: pre-game and post-game per match
  const chartData = matches
    .map(match => {
      const preCheckIn = checkIns.find(c => c.match_id === match.id && c.type === "pre");
      const postCheckIn = checkIns.find(c => c.match_id === match.id && c.type === "post");

      if (!preCheckIn && !postCheckIn) return null;

      return {
        date: match.date,
        opponent: match.opponent,
        "Pre-game Mentaal": preCheckIn?.mental_score || null,
        "Post-game Tevredenheid": postCheckIn?.performance_score || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10); // Last 10 matches

  if (chartData.length === 0) {
    return (
      <p className="text-xs text-[#888888]">Geen wedstrijdgegevens beschikbaar</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          stroke="#888888"
          tickFormatter={(date) => new Date(date).toLocaleDateString("nl-NL", { month: "short", day: "numeric" })}
        />
        <YAxis
          domain={[1, 5]}
          tick={{ fontSize: 12 }}
          stroke="#888888"
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E6E1", borderRadius: "8px" }}
          labelStyle={{ color: "#1A1A1A" }}
          formatter={(value) => (value !== null ? value.toFixed(1) : "–")}
          labelFormatter={(label) => `${label}`}
        />
        <Legend wrapperStyle={{ paddingTop: "16px" }} />
        <Line
          type="monotone"
          dataKey="Pre-game Mentaal"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ fill: "#8B5CF6", r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="Post-game Tevredenheid"
          stroke="#FF6B00"
          strokeWidth={2}
          dot={{ fill: "#FF6B00", r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}