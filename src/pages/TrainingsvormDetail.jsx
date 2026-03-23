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
    <div className="min-h-screen" style={{ backgroundColor: "#1c0e04" }}>
      <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png" alt=""
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />

      <div className="relative z-10 p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
            <ArrowLeft size={18} color="#fff" />
          </button>
          {isTrainer && (
            <Link to={`/TrainingsvormForm?id=${exercise.id}`}>
              <button className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
                <Edit2 size={16} color="#FF8C3A" />
              </button>
            </Link>
          )}
        </div>

        {/* Title section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-1 rounded-lg"
              style={{
                background: categoryColors[exercise.category].bg,
                border: `0.5px solid ${categoryColors[exercise.category].border}`,
                color: categoryColors[exercise.category].color
              }}
            >
              {exercise.category}
            </span>
            {exercise.duration_minutes && (
              <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}>
                <Clock size={14} />
                {exercise.duration_minutes} min
              </div>
            )}
          </div>
          <h1 className="t-hero">{exercise.name}</h1>
        </div>

        {/* Description */}
        {exercise.description && (
          <div className="glass-dark rounded-2xl p-4">
            <p className="t-label mb-2">Beschrijving</p>
            <p className="t-secondary">{exercise.description}</p>
          </div>
        )}

        {/* Coaching points */}
        {exercise.coaching_points && exercise.coaching_points.length > 0 && (
          <div className="glass-dark rounded-2xl p-4 space-y-3">
            <p className="t-label">Coaching Points</p>
            <div className="space-y-2">
              {exercise.coaching_points.map((point, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: "#FF8C3A" }} />
                  <p className="t-secondary text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups */}
        {exercise.groups && exercise.groups.length > 0 && (
          <div className="glass-dark rounded-2xl p-4 space-y-3">
            <p className="t-label">Groepen</p>
            <div className="flex gap-2 flex-wrap">
              {exercise.groups.map((group, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded-lg text-xs font-semibold"
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
              <p className="t-secondary text-xs">{exercise.group_transition_description}</p>
            )}
          </div>
        )}

        {/* Photo */}
        {exercise.photo_url && (
          <img src={exercise.photo_url} alt={exercise.name} className="w-full rounded-2xl object-cover" style={{ maxHeight: "300px" }} />
        )}

        {/* YouTube video */}
        {exercise.youtube_url && (
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer" style={{ background: "rgba(0,0,0,0.3)" }}>
            <img
              src={`https://img.youtube.com/vi/${exercise.youtube_url.split("v=")[1]}/0.jpg`}
              alt="Video thumbnail"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <a href={exercise.youtube_url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full" style={{ background: "rgba(255,107,0,0.85)" }}>
                <Play size={20} className="text-white" fill="white" />
              </a>
            </div>
          </div>
        )}

        {/* Add to plan button */}
        {isTrainer && (
          <Link to={`/PlanningTrainingDetail?exerciseId=${exercise.id}`} className="w-full">
            <button className="w-full btn-primary h-12 flex items-center justify-center gap-2">
              <Plus size={18} />
              Toevoegen aan trainingsplan
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}