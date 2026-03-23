import React from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ArrowLeft, Edit2, Clock, Play, Plus } from "lucide-react";

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
    <div className="min-h-screen pb-20 xl:pb-6" style={{ backgroundColor: "#1c0e04" }}>
      {/* Background */}
      <div className="pointer-events-none" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,107,0,0.55)", top: -160, left: -100, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,150,0,0.30)", top: 380, right: -80, filter: "blur(70px)" }} />
      </div>

      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 glass-dark"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={18} color="#fff" />
          </button>
          {isTrainer && (
            <Link to={`/TrainingsvormForm?id=${exercise.id}`}>
              <button className="w-10 h-10 rounded-lg flex items-center justify-center glass-dark"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Edit2 size={18} color="#FF8C3A" />
              </button>
            </Link>
          )}
        </div>

        {/* Title section */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: categoryColors[exercise.category].bg,
                border: `0.5px solid ${categoryColors[exercise.category].border}`,
                color: categoryColors[exercise.category].color
              }}
            >
              {exercise.category}
            </span>
            {exercise.duration_minutes && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}>
                <Clock size={14} />
                {exercise.duration_minutes} min
              </div>
            )}
          </div>
          <h1 className="t-page-title text-2xl md:text-3xl">{exercise.name}</h1>
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
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#FF8C3A" }} />
                  <p className="t-secondary">{point}</p>
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
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: groupColors[group.color] + "22",
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
          <div className="glass-dark rounded-2xl overflow-hidden">
            <img src={exercise.photo_url} alt={exercise.name} className="w-full h-auto object-cover" />
          </div>
        )}

        {/* YouTube video */}
        {exercise.youtube_url && (
          <div className="glass-dark rounded-2xl overflow-hidden group cursor-pointer">
            <div className="relative">
              <img
                src={`https://img.youtube.com/vi/${exercise.youtube_url.split("v=")[1]}/0.jpg`}
                alt="Video thumbnail"
                className="w-full h-48 md:h-64 object-cover"
              />
              <a href={exercise.youtube_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center group/play">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,107,0,0.90)" }}>
                  <Play size={24} className="text-white" fill="white" />
                </div>
              </a>
            </div>
          </div>
        )}

        {/* Add to plan button */}
        {isTrainer && (
          <Link to={`/PlanningTrainingDetail?exerciseId=${exercise.id}`} className="w-full block mt-6">
            <button className="w-full btn-primary h-14 flex items-center justify-center gap-2">
              <Plus size={18} />
              Toevoegen aan trainingsplan
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}