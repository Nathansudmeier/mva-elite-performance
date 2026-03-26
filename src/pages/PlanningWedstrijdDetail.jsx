import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, Clock, Pencil, Trash2, Play, Trophy, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/components/agenda/agendaUtils";
import AgendaForm from "@/components/agenda/AgendaForm";
import WedstrijdSelectie from "@/components/wedstrijden/WedstrijdSelectie";

export default function PlanningWedstrijdDetail() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");
  const navigate = useNavigate();
  const { isTrainer } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["agenda-item", itemId],
    queryFn: () => base44.entities.AgendaItem.filter({ id: itemId }).then(r => r[0]),
    enabled: !!itemId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players-active"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const { data: match } = useQuery({
    queryKey: ["match", item?.match_id, item?.id],
    staleTime: 0,
    queryFn: async () => {
      let r = item?.match_id ? await base44.entities.Match.filter({ id: item.match_id }) : [];
      if (!r.length) r = await base44.entities.Match.filter({ opponent: item.title, date: item.date });
      return r[0] || null;
    },
    enabled: !!item,
  });

  const today = new Date().toISOString().split("T")[0];
  const isFuture = item?.date > today;

  async function handleDelete() {
    if (!confirm(`'${item.title}' verwijderen?`)) return;
    try {
      if (match) await base44.entities.Match.delete(match.id);
      await base44.entities.AgendaItem.delete(item.id);
      await qc.invalidateQueries({ queryKey: ["matches"] });
      navigate("/Planning");
    } catch (error) {
      toast({ description: "Kon activiteit niet verwijderen", style: { background: "#f87171", color: "white", border: "none" } });
    }
  }

  async function handleReset() {
    if (!match) return;
    setResetting(true);
    await base44.entities.Match.update(match.id, {
      live_events: [],
      score_home: null,
      score_away: null,
      halftime_notes: "",
      live_status: "pre",
    });
    const playerMatchTimes = await base44.entities.PlayerMatchTime.filter({ match_id: match.id });
    await Promise.all(playerMatchTimes.map(r => base44.entities.PlayerMatchTime.delete(r.id)));
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["match", item?.match_id] }),
      qc.invalidateQueries({ queryKey: ["matches"] }),
      qc.invalidateQueries({ queryKey: ["matches-all"] }),
    ]);
    setResetting(false);
    setShowResetConfirm(false);
    toast({ description: "Wedstrijd gereset", style: { background: "#4ade80", color: "white", border: "none" } });
  }

  function getScoreResult() {
    if (match?.score_home === undefined || match?.score_away === undefined) return null;
    if (match.score_home > match.score_away) return "Winst";
    if (match.score_home < match.score_away) return "Verlies";
    return "Gelijk";
  }

  function getScoreBadgeStyles() {
    const result = getScoreResult();
    if (result === "Winst") return { bg: "#08D068", border: "#1a1a1a", color: "#1a1a1a" };
    if (result === "Gelijk") return { bg: "#FFD600", border: "#1a1a1a", color: "#1a1a1a" };
    return { bg: "#FF3DA8", border: "#1a1a1a", color: "#ffffff" };
  }

  if (isLoading || !item) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const teamCardBg = item.team === "MO17" ? "#00C2FF" : item.team === "Dames 1" ? "#FF3DA8" : "#FF6800";
  const teamTextDark = teamCardBg === "#FF3DA8" ? "#ffffff" : "#1a1a1a";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box", background: "#FFF3E8", padding: "16px", paddingBottom: "150px", minHeight: "100vh" }}>

      {/* Back + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/Planning"
          style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", textDecoration: "none" }}>
          <ChevronLeft size={18} color="#1a1a1a" />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: teamCardBg === "#FF3DA8" ? "#FF3DA8" : teamCardBg === "#00C2FF" ? "#0090cc" : "#FF6800", marginBottom: 2 }}>Wedstrijd</p>
          <h1 className="t-page-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h1>
        </div>
        {isTrainer && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowEdit(true)}
              style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", cursor: "pointer" }}>
              <Pencil size={16} color="#1a1a1a" />
            </button>
            {match && (
              <button onClick={() => setShowResetConfirm(true)}
                style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,214,0,0.12)", border: "2.5px solid #cc9900", cursor: "pointer" }}>
                <RotateCcw size={16} color="#cc9900" />
              </button>
            )}
            <button onClick={handleDelete}
              style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,61,168,0.10)", border: "2.5px solid #FF3DA8", cursor: "pointer" }}>
              <Trash2 size={16} color="#FF3DA8" />
            </button>
          </div>
        )}
      </div>

      {/* Hero card */}
      <div style={{ background: teamCardBg, border: "2.5px solid #1a1a1a", borderRadius: 22, boxShadow: "3px 3px 0 #1a1a1a", padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Trophy size={14} style={{ color: teamTextDark }} />
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: teamTextDark }}>{item.team}</span>
              {item.home_away && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 20, background: "rgba(26,26,26,0.18)", color: teamTextDark, border: "1px solid rgba(26,26,26,0.20)" }}>
                  {item.home_away}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Clock size={12} style={{ color: teamTextDark === "#ffffff" ? "rgba(255,255,255,0.70)" : "rgba(26,26,26,0.55)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: teamTextDark === "#ffffff" ? "rgba(255,255,255,0.80)" : "rgba(26,26,26,0.65)" }}>{formatDate(item.date)} · {item.start_time}</span>
            </div>
          </div>
          {item.opponent_logo_url && (
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(26,26,26,0.25)", flexShrink: 0 }}>
              <img src={item.opponent_logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>

        {/* Score section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "14px 0", borderTop: "2px solid rgba(26,26,26,0.15)", borderBottom: "2px solid rgba(26,26,26,0.15)" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: teamTextDark === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.60)", marginBottom: 4 }}>MVA Noord</p>
            <p style={{ fontSize: (match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined)) ? "32px" : "22px", fontWeight: 900, color: teamTextDark, letterSpacing: "-1px" }}>
              {match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined) ? match.score_home : "vs."}
            </p>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: teamTextDark }}>-</div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: teamTextDark === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.60)", marginBottom: 4 }}>{item.title}</p>
            <p style={{ fontSize: (match?.live_status === "finished" || (!isFuture && match?.score_away !== undefined)) ? "32px" : "22px", fontWeight: 900, color: teamTextDark, letterSpacing: "-1px" }}>
              {match?.live_status === "finished" || (!isFuture && match?.score_away !== undefined) ? match.score_away : "vs."}
            </p>
          </div>
        </div>

        {/* Result badge */}
        {(match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined && match?.score_away !== undefined)) && getScoreResult() && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <span style={{
              fontSize: 12, fontWeight: 800, padding: "4px 16px", borderRadius: 20,
              background: getScoreBadgeStyles().bg, border: `1.5px solid ${getScoreBadgeStyles().border}`, color: getScoreBadgeStyles().color,
            }}>
              {getScoreResult()}
            </span>
          </div>
        )}

        {/* Live knop */}
        {isTrainer && match && (
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Link to={`/LiveMatch?matchId=${match.id}`}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, background: "#1a1a1a", color: "#ffffff", textDecoration: "none", fontWeight: 800, fontSize: 13 }}>
              <Play size={16} /> Live modus
            </Link>
            <button onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "MVA Noord Live",
                  text: "Volg MVA Noord live",
                  url: `${window.location.origin}/live?match_id=${match.id}`,
                });
              }
            }} style={{
              background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.70)", borderRadius: "14px", height: "44px", padding: "0 16px",
              display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600,
            }}>
              <i className="ti ti-share" style={{ fontSize: "16px" }}></i>
            </button>
          </div>
        )}
      </div>

      {/* Selectie */}
      <WedstrijdSelectie
        match={match}
        players={players}
        item={item}
        isTrainer={isTrainer}
        matchQueryKey={["match", item?.match_id, item?.id]}
      />

      {/* Reset confirm */}
      {showResetConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setShowResetConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200 }} />
          <div style={{ position: "relative", zIndex: 301, background: "#1a1a1a", border: "2.5px solid #1a1a1a", borderRadius: "20px 20px 0 0", padding: "24px", paddingBottom: "max(24px, calc(24px + env(safe-area-inset-bottom)))", width: "100%", maxWidth: "500px" }}>
            <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "12px" }}>⚠️</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "white", textAlign: "center", marginBottom: "8px" }}>Wedstrijd resetten?</div>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", textAlign: "center", marginBottom: "24px" }}>
              Dit verwijdert alle live events, de score, rust-notities en speeltijdrecords. Dit kan niet ongedaan worden gemaakt.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowResetConfirm(false)}
                style={{ flex: 1, height: "48px", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "14px", fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                Annuleren
              </button>
              <button onClick={handleReset} disabled={resetting}
                style={{ flex: 1, height: "48px", background: resetting ? "#666" : "#cc3333", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: 700, color: "white", cursor: resetting ? "not-allowed" : "pointer" }}>
                {resetting ? "Bezig..." : "Ja, reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      {showEdit && (
        <AgendaForm
          item={item}
          onSave={async () => {
            await qc.invalidateQueries({ queryKey: ["agenda-item", itemId] });
            await qc.invalidateQueries({ queryKey: ["agenda-items"] });
            setShowEdit(false);
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}