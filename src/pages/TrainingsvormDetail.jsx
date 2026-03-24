import React from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ArrowLeft, Edit2, Clock, Play, Plus } from "lucide-react";

const CATEGORY_COLORS = {
  Tactisch:      { bg: "#00C2FF", text: "#1a1a1a" },
  Fysiek:        { bg: "#08D068", text: "#1a1a1a" },
  Positiespel:   { bg: "#9B5CFF", text: "#ffffff" },
  Afwerking:     { bg: "#FF6800", text: "#ffffff" },
  Spelprincipes: { bg: "#FFD600", text: "#1a1a1a" },
};

const GROUP_COLORS = {
  oranje: "#FF6800", blauw: "#00C2FF", groen: "#08D068",
  rood: "#FF3DA8", paars: "#9B5CFF", geel: "#FFD600",
};

export default function TrainingsvormDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isTrainer } = useCurrentUser();
  const id = searchParams.get("id");

  const { data: exercise } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => base44.entities.ExerciseTemplate.list().then(items => items.find(e => e.id === id)),
    enabled: !!id,
  });

  if (!exercise) return null;

  const col = CATEGORY_COLORS[exercise.category] || { bg: "#1a1a1a", text: "#ffffff" };

  const cardStyle = { background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "16px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "80px" }}>

      {/* Navigatiebalk */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="#1a1a1a" />
        </button>
        {isTrainer && (
          <Link to={`/TrainingsvormForm?id=${exercise.id}`}>
            <button style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Edit2 size={16} color="#ffffff" />
            </button>
          </Link>
        )}
      </div>

      {/* Hero */}
      <div style={{ ...cardStyle, background: col.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 900, color: col.text === "#ffffff" ? "rgba(255,255,255,0.65)" : "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{exercise.category}</span>
          {exercise.duration_minutes && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: col.text === "#ffffff" ? "rgba(255,255,255,0.65)" : "rgba(26,26,26,0.55)" }}>
              <Clock size={12} /> {exercise.duration_minutes} min
            </span>
          )}
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 900, color: col.text, letterSpacing: "-0.5px", lineHeight: 1.2 }}>{exercise.name}</h1>
      </div>

      {/* Beschrijving */}
      {exercise.description && (
        <div style={cardStyle}>
          <p className="t-label" style={{ marginBottom: "8px" }}>Beschrijving</p>
          <p style={{ fontSize: "14px", color: "#1a1a1a", lineHeight: 1.6, fontWeight: 500 }}>{exercise.description}</p>
        </div>
      )}

      {/* Coaching points */}
      {exercise.coaching_points?.length > 0 && (
        <div style={cardStyle}>
          <p className="t-label" style={{ marginBottom: "10px" }}>Coaching Points</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {exercise.coaching_points.map((point, idx) => (
              <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "8px", background: "#FF6800", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "#ffffff" }}>{idx + 1}</span>
                </div>
                <p style={{ fontSize: "14px", color: "#1a1a1a", lineHeight: 1.5, fontWeight: 500, paddingTop: "2px" }}>{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groepen */}
      {exercise.groups?.length > 0 && (
        <div style={cardStyle}>
          <p className="t-label" style={{ marginBottom: "10px" }}>Groepen</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {exercise.groups.map((group, idx) => {
              const gc = GROUP_COLORS[group.color] || "#1a1a1a";
              return (
                <div key={idx} style={{ background: gc, border: "2px solid #1a1a1a", borderRadius: "10px", padding: "6px 12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>{group.name} ({group.player_count})</span>
                </div>
              );
            })}
          </div>
          {exercise.group_transition_description && (
            <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)", marginTop: "10px", fontWeight: 500 }}>{exercise.group_transition_description}</p>
          )}
        </div>
      )}

      {/* Foto */}
      {exercise.photo_url && (
        <div style={{ border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden" }}>
          <img src={exercise.photo_url} alt={exercise.name} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}

      {/* YouTube */}
      {exercise.youtube_url && (
        <div style={{ border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", overflow: "hidden", position: "relative" }}>
          <img
            src={`https://img.youtube.com/vi/${exercise.youtube_url.split("v=")[1]}/0.jpg`}
            alt="Video thumbnail"
            style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
          />
          <a href={exercise.youtube_url} target="_blank" rel="noopener noreferrer"
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#FF6800", border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={22} color="#ffffff" fill="#ffffff" />
            </div>
          </a>
        </div>
      )}

      {/* Toevoegen aan plan */}
      {isTrainer && (
        <Link to={`/PlanningTrainingDetail?exerciseId=${exercise.id}`} style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginTop: "4px" }}>
            <Plus size={16} /> Toevoegen aan trainingsplan
          </button>
        </Link>
      )}
    </div>
  );
}