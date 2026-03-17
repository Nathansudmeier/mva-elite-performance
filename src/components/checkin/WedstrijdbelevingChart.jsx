import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function WedstrijdbelevingChart({ playerId }) {
  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkIns", playerId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const preIns = checkIns.filter((c) => c.type === "pre");
  const postIns = checkIns.filter((c) => c.type === "post");

  // Combine per match
  const data = matches
    .filter((m) => {
      const hasPre = preIns.some((c) => c.match_id === m.id);
      const hasPost = postIns.some((c) => c.match_id === m.id);
      return hasPre || hasPost;
    })
    .map((m) => {
      const pre = preIns.find((c) => c.match_id === m.id);
      const post = postIns.find((c) => c.match_id === m.id);
      return {
        name: m.opponent?.substring(0, 10) ?? m.date,
        "Pre Mentaal": pre?.mental_score ?? null,
        "Post Tevreden": post?.performance_score ?? null,
      };
    })
    .reverse();

  if (data.length < 2) {
    return (
      <div className="text-center text-sm text-[#888888] py-6">
        Minimaal 2 wedstrijden nodig voor de grafiek.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888888" }} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: "#888888" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #E8E6E1", borderRadius: 12, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="Pre Mentaal"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ r: 4, fill: "#8B5CF6" }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="Post Tevreden"
          stroke="#FF6B00"
          strokeWidth={2}
          dot={{ r: 4, fill: "#FF6B00" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}