import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import CheckInFlow from "./CheckInFlow";
import { X } from "lucide-react";

function isToday(dateStr) {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

function isWithin24h(dateStr) {
  const matchDate = new Date(dateStr);
  const now = new Date();
  const diff = now - matchDate;
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

export default function MatchDayBanner() {
  const { user, playerId, isSpeelster, isTrainer } = useCurrentUser();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const [activeType, setActiveType] = useState(null); // "pre" | "post"
  const [deferred, setDeferred] = useState(false);

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["myCheckIns", playerId],
    queryFn: () => base44.entities.MatchCheckIn.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.MatchCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCheckIns", playerId] });
      setTimeout(() => {
        setActiveType(null);
        setDismissed(true);
      }, 2500);
    },
  });

  // Only show for speelsters
  if (!isSpeelster || !playerId || dismissed) return null;

  // Find today's match
  const todayMatch = matches.find((m) => isToday(m.date));
  // Find match within 24h (post-game)
  const recentMatch = matches.find((m) => isWithin24h(m.date));

  const alreadyDonePreFor = (matchId) => checkIns.some((c) => c.match_id === matchId && c.type === "pre");
  const alreadyDonePostFor = (matchId) => checkIns.some((c) => c.match_id === matchId && c.type === "post");

  // Determine what to show
  const showPre = todayMatch && !alreadyDonePreFor(todayMatch.id) && !deferred;
  const showPost = recentMatch && !alreadyDonePostFor(recentMatch.id) && !showPre;

  const activeMatch = showPre ? todayMatch : showPost ? recentMatch : null;
  if (!activeMatch) return null;
  const currentType = showPre ? "pre" : "post";

  const handleSubmit = (values) => {
    const data = {
      match_id: activeMatch.id,
      player_id: playerId,
      type: currentType,
    };
    if (currentType === "pre") {
      data.physical_score = values.physical;
      data.mental_score = values.mental;
      data.focus_point = values.focus_point;
    } else {
      data.performance_score = values.performance;
      data.focus_execution_score = values.focus_execution;
      data.what_went_well = values.what_went_well;
      data.what_to_improve = values.what_to_improve;
    }
    saveMutation.mutate(data);
  };

  // Full screen flow
  if (activeType) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F7F5F2] overflow-y-auto">
        <CheckInFlow
          type={activeType}
          matchOpponent={activeMatch.opponent}
          onSubmit={handleSubmit}
          onDefer={activeType === "pre" ? () => { setDeferred(true); setActiveType(null); } : null}
        />
      </div>
    );
  }

  // Banner prompt
  return (
    <div
      className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 cursor-pointer"
      style={{ background: "linear-gradient(135deg,#D45A30,#FF6B00)" }}
      onClick={() => setActiveType(currentType)}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{currentType === "pre" ? "⚽" : "🎯"}</span>
        <div>
          <p className="text-white font-500 text-sm">
            {currentType === "pre" ? "Matchday check-in" : "Post-game reflectie"}
          </p>
          <p className="text-white/70 text-xs">vs. {activeMatch.opponent} · Tik om in te vullen</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-500">
          Invullen →
        </div>
        {currentType === "post" && (
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="p-1 rounded-full hover:bg-white/20"
          >
            <X size={16} className="text-white/70" />
          </button>
        )}
      </div>
    </div>
  );
}