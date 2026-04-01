import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Edit2, Save, X, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function MatchResults() {
  const qc = useQueryClient();
  const navigate = useNavigate();
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
      toast({ description: "Wedstrijd bijgewerkt" });
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
    if (match.score_home == null || match.score_away == null) return null;
    const isWin = match.home_away === "Thuis" ? match.score_home > match.score_away : match.score_away > match.score_home;
    const isDraw = match.score_home === match.score_away;
    return isWin ? "Winst" : isDraw ? "Gelijk" : "Verlies";
  };

  const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="t-page-title">Wedstrijdresultaten</h1>
        <p className="t-secondary mt-0.5">{sorted.length} wedstrijden</p>
      </div>

      {/* Matches list */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="t-secondary">Geen wedstrijden geregistreerd</p>
          </div>
        ) : (
          sorted.map((match) => {
            const result = getResult(match);
            const isEditing = editingId === match.id;

            return (
              <div key={match.id} className="glass p-4">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="t-card-title truncate">{match.opponent}</p>
                      <span className="t-label">{match.home_away === "Thuis" ? "Thuis" : "Uit"}</span>
                    </div>
                    <p className="t-secondary">{format(new Date(match.date), "d MMMM yyyy", { locale: nl })} · {match.start_time || "–"}</p>
                  </div>

                  {/* Right: score or edit */}
                  {!isEditing ? (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        {match.score_home != null ? (
                          <>
                            <p style={{ fontSize: "22px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, letterSpacing: "-1px" }}>
                              {match.score_home} – {match.score_away}
                            </p>
                            {result && (
                              <span className={result === "Winst" ? "badge badge-win" : result === "Gelijk" ? "badge badge-draw" : "badge badge-loss"} style={{ marginTop: "4px" }}>
                                {result}
                              </span>
                            )}
                          </>
                        ) : (
                          <p className="t-tertiary text-sm">Geen score</p>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/MatchEditEvents?matchId=${match.id}`)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-75"
                        style={{ background: "rgba(26,26,26,0.07)", border: "2px solid rgba(26,26,26,0.12)" }}
                        title="Events bewerken">
                        <ListChecks size={15} color="rgba(26,26,26,0.55)" />
                      </button>
                      <button
                        onClick={() => handleEdit(match)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-75"
                        style={{ background: "rgba(255,104,0,0.10)", border: "2px solid rgba(255,104,0,0.25)" }}>
                        <Edit2 size={15} color="#FF6800" />
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
                          width: "52px", height: "40px",
                          fontSize: "18px", fontWeight: 700, textAlign: "center",
                          background: "#ffffff", border: "2.5px solid #1a1a1a",
                          borderRadius: "10px", color: "#1a1a1a",
                        }}
                      />
                      <span className="t-secondary font-bold">–</span>
                      <input
                        type="number"
                        min="0"
                        value={editValues.score_away}
                        onChange={(e) => setEditValues(v => ({ ...v, score_away: e.target.value }))}
                        style={{
                          width: "52px", height: "40px",
                          fontSize: "18px", fontWeight: 700, textAlign: "center",
                          background: "#ffffff", border: "2.5px solid #1a1a1a",
                          borderRadius: "10px", color: "#1a1a1a",
                        }}
                      />
                      <button
                        onClick={() => handleSave(match.id)}
                        disabled={updateMutation.isPending}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-75"
                        style={{ background: "#08D068", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a" }}>
                        <Save size={15} color="#fff" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-75"
                        style={{ background: "rgba(255,61,168,0.10)", border: "2px solid rgba(255,61,168,0.30)" }}>
                        <X size={15} color="#FF3DA8" />
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
  );
}