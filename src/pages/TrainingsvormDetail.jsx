import React from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ArrowLeft, Edit2, Clock, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryColors = {
  Tactisch: { bg: "rgba(96,165,250,0.20)", border: "rgba(96,165,250,0.40)", color: "#60a5fa" },
  Fysiek: { bg: "rgba(74,222,128,0.20)", border: "rgba(74,222,128,0.40)", color: "#4ade80" },
  Positiespel: { bg: "rgba(167,139,250,0.20)", border: "rgba(167,139,250,0.40)", color: "#a78bfa" },
  Afwerking: { bg: "rgba(255,107,0,0.20)", border: "rgba(255,107,0,0.40)", color: "#FF8C3A" },
  Spelprincipes: { bg: "rgba(251,191,36,0.20)", border: "rgba(251,191,36,0.40)", color: "#fbbf24" }
};

const groupColors = {
  oranje: "#FF8C3A",
  blauw: "#60a5fa",
  groen: "#4ade80",
  rood: "#f87171",
  paars: "#a78bfa",
  geel: "#fbbf24"
};

export default function TrainingsvormDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isTrainer } = useCurrentUser();
  const id = searchParams.get("id");

  const { data: exercise } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => base44.entities.ExerciseTemplate.list().then(items => items.find(e => e.id === id)),
    enabled: !!id
  });

  if (!exercise) return null;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#1c0e04" }}>
      {/* Blur background */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 bottom-0 z-0" style={{ overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,107,0,0.35)", top: -160, left: -100, filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:opacity-70 transition">
            <ArrowLeft className="w-5 h-5" style={{ color: "rgba(255,255,255,0.70)" }} />
          </button>
          {isTrainer && (
            <Link to={`/TrainingsvormForm?id=${exercise.id}`}>
              <button className="p-2 -mr-2 hover:opacity-70 transition">
                <Edit2 className="w-5 h-5" style={{ color: "#FF8C3A" }} />
              </button>
            </Link>
          )}
        </div>

        {/* Title section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: categoryColors[exercise.category].bg,
                border: `0.5px solid ${categoryColors[exercise.category].border}`,
                color: categoryColors[exercise.category].color
              }}
            >
              {exercise.category}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ letterSpacing: "-0.5px" }}>
            {exercise.name}
          </h1>
        </div>

        {/* Duration */}
        {exercise.duration_minutes && (
          <div className="mb-8 flex items-center gap-2 text-sm px-3 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)", width: "fit-content" }}>
            <Clock className="w-4 h-4" style={{ color: "#FF8C3A" }} />
            <span className="text-white">{exercise.duration_minutes} minuten</span>
          </div>
        )}

        {/* Description */}
        {exercise.description && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
              Beschrijving
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.80)", lineHeight: 1.6 }}>
              {exercise.description}
            </p>
          </div>
        )}

        {/* Coaching points */}
        {exercise.coaching_points && exercise.coaching_points.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
              Coaching Points
            </p>
            <div className="space-y-3">
              {exercise.coaching_points.map((point, idx) => (
                <div key={idx} className="flex gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                    style={{ background: "#FF8C3A" }}
                  />
                  <p className="text-sm text-white" style={{ lineHeight: 1.5 }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups */}
        {exercise.groups && exercise.groups.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
              Groepen
            </p>
            <div className="flex gap-3 flex-wrap mb-4">
              {exercise.groups.map((group, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-full text-xs font-semibold text-white"
                  style={{
                    background: groupColors[group.color],
                    opacity: 0.15,
                    border: `0.5px solid ${groupColors[group.color]}`,
                    color: groupColors[group.color]
                  }}
                >
                  {group.name} ({group.player_count})
                </div>
              ))}
            </div>
            {exercise.group_transition_description && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                {exercise.group_transition_description}
              </p>
            )}
          </div>
        )}

        {/* Photo */}
        {exercise.photo_url && (
          <div className="mb-8">
            <img
              src={exercise.photo_url}
              alt={exercise.name}
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: "400px" }}
            />
          </div>
        )}

        {/* YouTube video */}
        {exercise.youtube_url && (
          <div className="mb-8 relative group cursor-pointer rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.5)" }}>
            <img
              src={`https://img.youtube.com/vi/${exercise.youtube_url.split("v=")[1]}/0.jpg`}
              alt="Video thumbnail"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <a href={exercise.youtube_url} target="_blank" rel="noopener noreferrer" className="p-4 rounded-full" style={{ background: "rgba(255,107,0,0.80)" }}>
                <Play className="w-6 h-6 text-white" fill="white" />
              </a>
            </div>
          </div>
        )}

        {/* Add to plan button */}
        {isTrainer && (
          <Link to={`/PlanningTrainingDetail?exerciseId=${exercise.id}`} className="w-full">
            <Button className="w-full btn-primary flex items-center justify-center gap-2 h-12">
              <Plus className="w-5 h-5" />
              Toevoegen aan trainingsplan
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}