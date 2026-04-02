import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function MatchReflectionPrompt({ playerId }) {
  const qc = useQueryClient();
  const [positief, setPositief] = useState("");
  const [verbeterpunt, setVerbeterpunt] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: matches = [] } = useQuery({
    queryKey: ["matches-finished"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const { data: reflections = [] } = useQuery({
    queryKey: ["matchReflections-player", playerId],
    queryFn: () => base44.entities.MatchReflection.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.MatchReflection.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matchReflections-player", playerId] });
      qc.invalidateQueries({ queryKey: ["matchReflections-all"] });
      setSubmitted(true);
    },
  });

  if (!playerId) return null;

  // Vind de meest recente wedstrijd binnen 4 dagen geleden
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  const fourDaysAgoStr = fourDaysAgo.toISOString().split("T")[0];

  const recentMatch = matches
    .filter((m) => m.date <= todayStr && m.date >= fourDaysAgoStr)
    .sort((a, b) => (b.date > a.date ? 1 : -1))[0];

  if (!recentMatch) return null;

  // Check of er al een reflectie is voor deze wedstrijd
  const alreadyReflected = reflections.some((r) => r.match_id === recentMatch.id);
  if (alreadyReflected) return null;

  if (submitted) {
    return (
      <div style={{
        background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a", padding: "20px", textAlign: "center",
      }}>
        <p style={{ fontSize: "28px", marginBottom: "4px" }}>✅</p>
        <p style={{ fontSize: "15px", fontWeight: 900, color: "#ffffff" }}>Reflectie opgeslagen!</p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.80)", marginTop: "4px" }}>
          Bedankt voor je reflectie na {recentMatch.opponent}.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    if (!positief.trim() || !verbeterpunt.trim()) return;
    saveMutation.mutate({
      match_id: recentMatch.id,
      player_id: playerId,
      positief: positief.trim(),
      verbeterpunt: verbeterpunt.trim(),
      date: recentMatch.date,
      opponent: recentMatch.opponent,
    });
  };

  return (
    <div style={{
      background: "#1a1a1a", border: "2.5px solid #1a1a1a", borderRadius: "18px",
      boxShadow: "3px 3px 0 #1a1a1a", padding: "20px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "#FF6800", marginBottom: "4px" }}>
          Wedstrijdreflectie
        </p>
        <p style={{ fontSize: "17px", fontWeight: 900, color: "#ffffff", lineHeight: 1.2 }}>
          Hoe was het tegen {recentMatch.opponent}?
        </p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.50)", marginTop: "3px" }}>
          {recentMatch.date}
        </p>
      </div>

      {/* Positief */}
      <div style={{ marginBottom: "12px" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, color: "#08D068", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
          ✅ Wat ging goed?
        </p>
        <textarea
          value={positief}
          onChange={(e) => setPositief(e.target.value)}
          placeholder="Beschrijf 1 positief punt..."
          rows={2}
          style={{
            width: "100%", background: "rgba(255,255,255,0.07)", border: "2px solid rgba(8,208,104,0.40)",
            borderRadius: "12px", padding: "10px 12px", fontSize: "13px", color: "#ffffff",
            resize: "none", outline: "none", fontFamily: "inherit",
          }}
        />
      </div>

      {/* Verbeterpunt */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, color: "#FF6800", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
          🎯 Wat kan beter?
        </p>
        <textarea
          value={verbeterpunt}
          onChange={(e) => setVerbeterpunt(e.target.value)}
          placeholder="Beschrijf 1 verbeterpunt..."
          rows={2}
          style={{
            width: "100%", background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,104,0,0.40)",
            borderRadius: "12px", padding: "10px 12px", fontSize: "13px", color: "#ffffff",
            resize: "none", outline: "none", fontFamily: "inherit",
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saveMutation.isPending || !positief.trim() || !verbeterpunt.trim()}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        {saveMutation.isPending ? "Opslaan..." : "Reflectie opslaan"}
      </button>
    </div>
  );
}