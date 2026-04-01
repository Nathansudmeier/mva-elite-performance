import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { PLAYER_FALLBACK_PHOTO } from "@/lib/playerFallback";

const GROUP_COLORS = {
  oranje: "#FF6800",
  blauw: "#00C2FF",
  groen: "#08D068",
  rood: "#FF3DA8",
  paars: "#9B5CFF",
  geel: "#FFD600",
};

function ExerciseRow({ exercise, index }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "8px 0",
      borderBottom: "1.5px solid rgba(26,26,26,0.07)",
    }}>
      <div style={{
        width: "22px", height: "22px", borderRadius: "50%",
        background: "#FF6800", border: "1.5px solid #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: "1px",
      }}>
        <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff" }}>{index + 1}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{exercise.name}</p>
        {exercise.duration_minutes && (
          <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", marginTop: "2px" }}>
            {exercise.duration_minutes} min
            {exercise.groups?.length > 0 && ` · ${exercise.groups.length} groepen`}
          </p>
        )}
      </div>
      {exercise.groups?.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {exercise.groups.slice(0, 4).map((g, gi) => (
            <div key={gi} style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: GROUP_COLORS[g.color] || "#ccc",
              border: "1.5px solid #1a1a1a",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function TrainingCard({ agendaItem, trainingPlan, navigate }) {
  const exercises = trainingPlan?.exercises || [];
  const totalMin = exercises.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  return (
    <div style={{
      background: "#08D068", border: "2.5px solid #1a1a1a",
      borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Training vandaag</p>
          <p style={{ fontSize: "15px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2, marginTop: "2px" }}>
            {agendaItem.title || "Training"}
          </p>
          {agendaItem.start_time && (
            <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", marginTop: "2px", fontWeight: 600 }}>
              🕐 {agendaItem.start_time}{agendaItem.location ? ` · ${agendaItem.location}` : ""}{totalMin > 0 ? ` · ${totalMin} min` : ""}
            </p>
          )}
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "4px 10px" }}>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "#08D068" }}>{exercises.length} vormen</p>
        </div>
      </div>

      {/* Exercises */}
      {exercises.length > 0 ? (
        <div style={{ background: "rgba(255,255,255,0.60)", borderRadius: "12px", padding: "4px 12px", marginBottom: "10px" }}>
          {exercises.slice(0, 5).map((ex, i) => (
            <ExerciseRow key={ex.id || i} exercise={ex} index={i} />
          ))}
          {exercises.length > 5 && (
            <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", padding: "6px 0", fontWeight: 600 }}>
              + {exercises.length - 5} meer oefenvormen
            </p>
          )}
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.50)", borderRadius: "12px", padding: "14px 12px", marginBottom: "10px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.50)", fontWeight: 600 }}>Nog geen trainingsplan aangemaakt</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => navigate(`/PlanningTrainingDetail?id=${agendaItem.id}`)}
          style={{
            flex: 1, height: "40px", background: "#ffffff", border: "2px solid #1a1a1a",
            borderRadius: "12px", fontSize: "13px", fontWeight: 800, color: "#1a1a1a",
            cursor: "pointer", boxShadow: "2px 2px 0 #1a1a1a",
          }}
        >
          Plan bekijken
        </button>
        {trainingPlan && exercises.length > 0 && (
          <button
            onClick={() => navigate(`/PlanningTrainingDetail?id=${agendaItem.id}&startLive=1`)}
            style={{
              flex: 1, height: "40px", background: "#1a1a1a", border: "2px solid #1a1a1a",
              borderRadius: "12px", fontSize: "13px", fontWeight: 800, color: "#08D068",
              cursor: "pointer", boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
          >
            <i className="ti ti-player-play-filled" style={{ fontSize: "14px" }} />
            Training starten
          </button>
        )}
      </div>
    </div>
  );
}

function MatchCard({ agendaItem, match, players, navigate }) {
  const lineup = match?.lineup || [];
  const basisIds = lineup.map(l => l.player_id).filter(Boolean);
  const basisPlayers = basisIds.map(id => players.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{
      background: "#FF6800", border: "2.5px solid #1a1a1a",
      borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem",
    }}>
      {/* Header */}
      <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "8px" }}>Wedstrijd vandaag</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            {agendaItem.home_away === "Thuis" ? "AFC" : agendaItem.opponent || match?.opponent || "–"}
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.70)", marginTop: "3px", fontWeight: 600 }}>
            vs {agendaItem.home_away === "Thuis" ? (agendaItem.opponent || match?.opponent || "–") : "AFC"}
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.60)", marginTop: "2px" }}>
            {agendaItem.start_time && `🕐 ${agendaItem.start_time}`}
            {agendaItem.location && ` · ${agendaItem.location}`}
            {agendaItem.home_away && ` · ${agendaItem.home_away}`}
          </p>
        </div>
        {agendaItem.opponent_logo ? (
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.30)", flexShrink: 0 }}>
            <img src={agendaItem.opponent_logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ) : (
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#1a1a1a", border: "2px solid rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-ball-football" style={{ fontSize: "24px", color: "#FF6800" }} />
          </div>
        )}
      </div>

      {/* Lineup preview */}
      {basisPlayers.length > 0 ? (
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Opstelling · {match?.formation || "–"} · {basisPlayers.length}/11
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {basisPlayers.slice(0, 11).map(p => (
              <div key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", width: "44px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.40)", flexShrink: 0 }}>
                  <img src={p.photo_url || PLAYER_FALLBACK_PHOTO} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.80)", textAlign: "center", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {p.name?.split(" ")[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: "12px", padding: "12px", marginBottom: "10px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.70)", fontWeight: 600 }}>Nog geen opstelling ingevoerd</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => navigate(`/PlanningWedstrijdDetail?id=${agendaItem.id}`)}
          style={{
            flex: 1, height: "40px", background: "rgba(255,255,255,0.20)", border: "1.5px solid rgba(255,255,255,0.35)",
            borderRadius: "12px", fontSize: "13px", fontWeight: 800, color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Details bekijken
        </button>
        <button
          onClick={() => {
            if (match?.id) navigate(`/LiveMatch?matchId=${match.id}`);
            else navigate(`/PlanningWedstrijdDetail?id=${agendaItem.id}`);
          }}
          style={{
            flex: 1, height: "40px", background: "#1a1a1a", border: "2px solid #1a1a1a",
            borderRadius: "12px", fontSize: "13px", fontWeight: 800, color: "#ffffff",
            cursor: "pointer", boxShadow: "2px 2px 0 rgba(0,0,0,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          }}
        >
          <i className="ti ti-player-play-filled" style={{ fontSize: "14px" }} />
          Live modus
        </button>
      </div>
    </div>
  );
}

export default function TodayActivityCard({ agendaItems = [], matches = [], players = [] }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  // Find today's training or match agenda item
  const todayTraining = agendaItems.find(ai => ai.date === today && ai.type === "Training");
  const todayWedstrijd = agendaItems.find(ai => ai.date === today && (ai.type === "Wedstrijd" || ai.type === "Toernooi"));

  // Fetch training plan for today if there's a training
  const { data: trainingPlans = [] } = useQuery({
    queryKey: ["trainingPlans"],
    queryFn: () => base44.entities.TrainingPlan.list("-date"),
    enabled: !!todayTraining,
  });

  const todayPlan = trainingPlans.find(tp => tp.date === today);
  const matchForToday = todayWedstrijd?.match_id ? matches.find(m => m.id === todayWedstrijd.match_id) : null;

  // Priority: match > training
  if (todayWedstrijd) {
    return <MatchCard agendaItem={todayWedstrijd} match={matchForToday} players={players} navigate={navigate} />;
  }

  if (todayTraining) {
    return <TrainingCard agendaItem={todayTraining} trainingPlan={todayPlan} navigate={navigate} />;
  }

  // Nothing today
  return (
    <div style={{
      background: "#ffffff", border: "2.5px solid #1a1a1a",
      borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "140px", textAlign: "center", gap: "8px",
    }}>
      <i className="ti ti-calendar-off" style={{ fontSize: "28px", color: "rgba(26,26,26,0.15)" }} />
      <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(26,26,26,0.40)" }}>Geen activiteit vandaag</p>
      <button
        onClick={() => navigate("/Planning")}
        style={{ fontSize: "12px", color: "#FF6800", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
      >
        Bekijk planning →
      </button>
    </div>
  );
}