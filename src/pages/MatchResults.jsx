import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Edit2, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function MatchResults() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const { data: matches = [] } = useQuery({
    queryKey: ["matches-all"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.Match.update(id, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches-all"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      setEditingId(null);
      toast({
        description: "Wedstrijd bijgewerkt",
        style: { background: "#4ade80", color: "white", border: "none" },
      });
    },
    onError: () => {
      toast({
        description: "Kon niet bijwerken",
        style: { background: "#f87171", color: "white", border: "none" },
      });
    },
  });

  const handleEdit = (match) => {
    setEditingId(match.id);
    setEditValues({
      score_home: match.score_home ?? "",
      score_away: match.score_away ?? "",
    });
  };

  const handleSave = (matchId) => {
    updateMutation.mutate({
      id: matchId,
      data: {
        score_home: editValues.score_home === "" ? null : parseInt(editValues.score_home) || 0,
        score_away: editValues.score_away === "" ? null : parseInt(editValues.score_away) || 0,
      },
    });
  };

  const getResult = (match) => {
    if (match.score_home === undefined || match.score_home === null || match.score_away === undefined || match.score_away === null) return null;
    const isWin = match.home_away === "Thuis" ? match.score_home > match.score_away : match.score_away > match.score_home;
    const isDraw = match.score_home === match.score_away;
    return isWin ? "Winst" : isDraw ? "Gelijk" : "Verlies";
  };

  const getResultColor = (result) => {
    if (result === "Winst") return { bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.25)", text: "#4ade80" };
    if (result === "Gelijk") return { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.25)", text: "#fbbf24" };
    return { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)", text: "#f87171" };
  };

  const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="relative" style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box" }}>
      <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/767b215a5_Appbackground-blur.png" alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/Dashboard" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
            <ChevronLeft size={18} color="#fff" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="t-page-title">Wedstrijdresultaten</h1>
            <p className="t-secondary mt-0.5">{sorted.length} wedstrijden</p>
          </div>
        </div>

        {/* Matches list */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="glass-dark rounded-2xl p-8 text-center">
              <p className="t-secondary">Geen wedstrijden geregistreerd</p>
            </div>
          ) : (
            sorted.map((match) => {
              const result = getResult(match);
              const resultColor = result ? getResultColor(result) : null;
              const isEditing = editingId === match.id;

              return (
                <div key={match.id} className="glass-dark rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="t-card-title">{match.opponent}</p>
                        <span className="t-label" style={{ color: "rgba(255,255,255,0.50)" }}>
                          {match.home_away === "Thuis" ? "Thuis" : "Uit"}
                        </span>
                      </div>
                      <p className="t-secondary text-sm">{format(new Date(match.date), "d MMMM yyyy", { locale: nl })} · {match.start_time || "–"}</p>
                    </div>

                    {/* Score display or edit */}
                    {!isEditing ? (
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          {match.score_home !== undefined && match.score_home !== null ? (
                            <>
                              <p style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>
                                {match.score_home} - {match.score_away}
                              </p>
                              {result && (
                                <span style={{
                                  display: "inline-block",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  background: resultColor.bg,
                                  border: `0.5px solid ${resultColor.border}`,
                                  color: resultColor.text,
                                  marginTop: "4px",
                                }}>
                                  {result}
                                </span>
                              )}
                            </>
                          ) : (
                            <p className="t-tertiary text-sm">Geen score</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEdit(match)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-75"
                          style={{ background: "rgba(255,140,58,0.15)", border: "0.5px solid rgba(255,140,58,0.25)" }}>
                          <Edit2 size={14} color="#FF8C3A" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={editValues.score_home}
                          onChange={(e) => setEditValues(v => ({ ...v, score_home: e.target.value }))}
                          style={{
                            width: "50px",
                            height: "36px",
                            fontSize: "16px",
                            fontWeight: 600,
                            textAlign: "center",
                            background: "rgba(255,255,255,0.06)",
                            border: "0.5px solid rgba(255,255,255,0.12)",
                            borderRadius: "8px",
                            color: "white",
                          }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.40)" }}>-</span>
                        <input
                          type="number"
                          min="0"
                          value={editValues.score_away}
                          onChange={(e) => setEditValues(v => ({ ...v, score_away: e.target.value }))}
                          style={{
                            width: "50px",
                            height: "36px",
                            fontSize: "16px",
                            fontWeight: 600,
                            textAlign: "center",
                            background: "rgba(255,255,255,0.06)",
                            border: "0.5px solid rgba(255,255,255,0.12)",
                            borderRadius: "8px",
                            color: "white",
                          }}
                        />
                        <button
                          onClick={() => handleSave(match.id)}
                          disabled={updateMutation.isPending}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-75"
                          style={{ background: "#4ade80", border: "none" }}>
                          <Save size={14} color="#1c0e04" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-75"
                          style={{ background: "rgba(248,113,113,0.15)", border: "0.5px solid rgba(248,113,113,0.25)" }}>
                          <X size={14} color="#f87171" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}