import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, Clock, Bell, Pencil, Trash2, Play, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, TYPE_CONFIG, TEAM_COLORS } from "@/components/agenda/agendaUtils";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";
import FieldLineup from "@/components/wedstrijden/FieldLineup";
import AgendaForm from "@/components/agenda/AgendaForm";
import LineupOverview from "@/components/wedstrijden/LineupOverview";
import LineupSelector from "@/components/wedstrijden/LineupSelector";
import { createPageUrl } from "@/utils";

const TABS = ["Overzicht", "Opstelling", "Tactiek", "Aanwezigheid"];

export default function PlanningWedstrijdDetail() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");
  const navigate = useNavigate();
  const { isTrainer } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [absentReason, setAbsentReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [editingLineup, setEditingLineup] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Local match state (for linked match)
  const [lineupMap, setLineupMap] = useState({});
  const [formation, setFormation] = useState("4-3-3");
  const [tactics, setTactics] = useState({ ball_possession: "", pressing: "", transition: "", set_pieces: "" });
  const [saving, setSaving] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");

  const { data: item, isLoading } = useQuery({
    queryKey: ["agenda-item", itemId],
    queryFn: () => base44.entities.AgendaItem.filter({ id: itemId }).then(r => r[0]),
    enabled: !!itemId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players-agenda"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["agenda-attendance", itemId],
    queryFn: () => base44.entities.AgendaAttendance.filter({ agenda_item_id: itemId }),
    enabled: !!itemId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  // Load linked match data if present
  const { data: match } = useQuery({
    queryKey: ["match", item?.match_id],
    queryFn: async () => {
      // Try by match_id first, then fall back to searching by opponent+date
      let r = await base44.entities.Match.filter({ id: item.match_id });
      if (!r.length) r = await base44.entities.Match.filter({ opponent: item.title, date: item.date });
      const m = r[0];
      if (m) {
        const lm = {};
        (m.lineup || []).forEach(e => { if (e.slot && e.player_id) lm[e.slot] = e.player_id; });
        setLineupMap(lm);
        setFormation(m.formation || "4-3-3");
        setTactics({
          ball_possession: m.ball_possession || "",
          pressing: m.pressing || "",
          transition: m.transition || "",
          set_pieces: m.set_pieces || "",
        });
      }
      return m;
    },
    enabled: !!item,
  });

  const myPlayer = currentUser ? players.find(p => p.name === currentUser.full_name) : null;
  const myAttendance = myPlayer ? attendance.find(a => a.player_id === myPlayer.id) : null;
  const today = new Date().toISOString().split("T")[0];
  const isFuture = item?.date >= today;

  const rsvpMutation = useMutation({
    mutationFn: async ({ status, reason }) => {
      if (myAttendance) {
        await base44.entities.AgendaAttendance.update(myAttendance.id, { status, notes: reason || myAttendance.notes });
      } else if (myPlayer) {
        await base44.entities.AgendaAttendance.create({ agenda_item_id: itemId, player_id: myPlayer.id, status, notes: reason || "" });
      }
      if (status === "afwezig" && myPlayer) {
        await base44.functions.invoke("agendaNotifications", {
          action: "send_absentee_notification",
          player_name: myPlayer.name,
          item_type: item.type,
          item_title: item.title,
          item_date: item.date,
          reason: reason || "",
          sender_email: currentUser?.email,
        });
        // Notify trainers/admins via notification entity
        const allUsers = await base44.entities.User.list();
        const trainerEmails = allUsers.filter(u => u.role === "admin" || u.role === "trainer").map(u => u.email).filter(Boolean);
        await Promise.all(trainerEmails.map(email =>
          base44.entities.Notification.create({
            user_email: email,
            type: "afmelding",
            title: `${myPlayer.name} afgemeld`,
            body: reason || `voor ${item.title}`,
            is_read: false,
            link: `/Planning?id=${itemId}`,
          })
        ));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-attendance", itemId] });
      setShowReasonInput(false);
      setAbsentReason("");
    },
  });

  const sendReminder = useMutation({
    mutationFn: async () => {
      const respondedIds = new Set(attendance.map(a => a.player_id));
      const nogniet = players.filter(p => !respondedIds.has(p.id));
      const dateStr = new Date(item.date + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      for (const player of nogniet) {
        if (player.email) {
          await base44.integrations.Core.SendEmail({
            to: player.email,
            subject: `Herinnering: bevestig je aanwezigheid voor ${item.title}`,
            body: `Hoi ${player.name},\n\nVergeet niet je aanwezigheid door te geven voor ${item.title} op ${dateStr} om ${item.start_time}.\n\nOpen de app om te reageren.`,
          });
        }
      }
    },
    onSuccess: () => setReminderSent(true),
  });

  async function saveLineup() {
    if (!match) return;
    try {
      setSaving(true);
      const lineupArr = Object.entries(lineupMap).map(([slot, player_id]) => ({ slot, player_id }));
      await base44.entities.Match.update(match.id, {
        lineup: lineupArr,
        formation,
        ...tactics,
      });
      // Send opstelling notification to team players
      if (lineupArr.length > 0) {
        const allUsers = await base44.entities.User.list();
        const allPlayers = await base44.entities.Player.filter({ active: true });
        const playerEmails = allUsers
          .filter(u => allPlayers.some(p => p.id === u.player_id || p.name === u.full_name))
          .map(u => u.email).filter(Boolean);
        await Promise.all([...new Set(playerEmails)].map(email =>
          base44.entities.Notification.create({
            user_email: email,
            type: "opstelling",
            title: "Opstelling bekend",
            body: `De opstelling voor ${item?.title} is gepubliceerd`,
            is_read: false,
            link: `/Planning?id=${itemId}`,
          })
        )).catch(() => {});
      }
      await qc.invalidateQueries({ queryKey: ["match", item?.match_id] });
      setSaving(false);
    } catch (error) {
      setSaving(false);
      console.error("Error saving lineup:", error);
    }
  }

  async function handleSaveLineupEdit(data) {
    try {
      setSaving(true);
      setSaveError("");
      
      let currentMatch = match;
      
      // Stap 1: Match aanmaken als die niet bestaat
      if (!match) {
        const newMatch = await base44.entities.Match.create({
          opponent: item.title,
          date: item.date,
          home_away: item.home_away,
          team: item.team,
        });
        await base44.entities.AgendaItem.update(itemId, { match_id: newMatch.id });
        await qc.invalidateQueries({ queryKey: ["agenda-item", itemId] });
        await qc.invalidateQueries({ queryKey: ["match", item?.match_id] });
        currentMatch = newMatch;
      }
      
      const lineupArr = typeof data.lineup === 'object' && !Array.isArray(data.lineup)
       ? Object.entries(data.lineup).map(([slot, player_id]) => ({ slot, player_id }))
       : data.lineup || [];

      await base44.entities.Match.update(currentMatch.id, {
       lineup: lineupArr,
       substitutes: Array.isArray(data.substitutes) ? data.substitutes : [],
       formation: data.formation,
      });
      
      // Notify players
      if (lineupArr.length > 0) {
        const allUsers = await base44.entities.User.list();
        const allPlayers = await base44.entities.Player.filter({ active: true });
        const playerEmails = allUsers
          .filter(u => allPlayers.some(p => p.id === u.player_id || p.name === u.full_name))
          .map(u => u.email).filter(Boolean);
        await Promise.all([...new Set(playerEmails)].map(email =>
          base44.entities.Notification.create({
            user_email: email,
            type: "opstelling",
            title: "Opstelling bekend",
            body: `De opstelling voor ${item?.title} is gepubliceerd`,
            is_read: false,
            link: `/Planning?id=${itemId}`,
          })
        )).catch(() => {});
      }
      await qc.invalidateQueries({ queryKey: ["match", currentMatch.id] });
      setSaving(false);
      setEditingLineup(false);
      
      // Stap 3: Succes feedback
      toast({
        description: "Opstelling opgeslagen",
        style: { background: "#4ade80", color: "white", border: "none" },
      });
    } catch (error) {
      setSaving(false);
      // Stap 2: Foutmelding
      setSaveError("Kon de opstelling niet opslaan. Probeer opnieuw.");
      console.error("Error saving lineup:", error);
    }
  }

  async function handleDelete() {
    if (!confirm(`'${item.title}' verwijderen?`)) return;
    try {
      // Verwijder gekoppelde match als die bestaat
      if (match) {
        await base44.entities.Match.delete(match.id);
      }
      // Verwijder agenda item
      await base44.entities.AgendaItem.delete(item.id);
      // Invalidate matches query zodat dashboard stats bijgewerkt worden
      await qc.invalidateQueries({ queryKey: ["matches"] });
      navigate("/Planning");
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        description: "Kon activiteit niet verwijderen",
        style: { background: "#f87171", color: "white", border: "none" },
      });
    }
  }

  async function saveScore() {
    if (!match) return;
    try {
      setSaving(true);
      await base44.entities.Match.update(match.id, {
        score_home: parseInt(scoreHome) || 0,
        score_away: parseInt(scoreAway) || 0,
      });
      await qc.invalidateQueries({ queryKey: ["match", item?.match_id] });
      setSaving(false);
      setEditingScore(false);
    } catch (error) {
      setSaving(false);
      console.error("Error saving score:", error);
    }
  }

  function getScoreResult() {
    if (match?.score_home === undefined || match?.score_away === undefined) return null;
    if (match.score_home > match.score_away) return "Winst";
    if (match.score_home < match.score_away) return "Verlies";
    return "Gelijk";
  }

  function getScoreBadgeStyles() {
    const result = getScoreResult();
    if (result === "Winst") return { bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.25)", color: "#4ade80" };
    if (result === "Gelijk") return { bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.25)", color: "#fbbf24" };
    return { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.25)", color: "#f87171" };
  }

  if (isLoading || !item) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const cfg = TYPE_CONFIG["Wedstrijd"];
  const teamCfg = TEAM_COLORS[item.team] || TEAM_COLORS["Beide"];
  const aanwezigList = attendance.filter(a => a.status === "aanwezig").map(a => players.find(p => p.id === a.player_id)).filter(Boolean);
  const afwezigList = attendance.filter(a => a.status === "afwezig").map(a => ({ player: players.find(p => p.id === a.player_id), record: a })).filter(x => x.player);
  const respondedIds = new Set(attendance.map(a => a.player_id));
  const nognietList = players.filter(p => !respondedIds.has(p.id));

  const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "3-4-3"];

  const teamCardBg = item.team === "MO17" ? "#00C2FF" : item.team === "Dames 1" ? "#FF3DA8" : "#FF6800";
  const teamTextDark = teamCardBg === "#FF3DA8" ? "#ffffff" : "#1a1a1a";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box" }}>

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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {item.opponent_logo_url && (
                <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(26,26,26,0.25)", flexShrink: 0 }}>
                  <img src={item.opponent_logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: teamTextDark }}>{aanwezigList.length} ✓</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: teamTextDark === "#ffffff" ? "rgba(255,255,255,0.70)" : "rgba(26,26,26,0.55)" }}>{afwezigList.length} ✗</span>
              </div>
            </div>
          </div>

          {/* Score section */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "14px 0", borderTop: "2px solid rgba(26,26,26,0.15)", borderBottom: "2px solid rgba(26,26,26,0.15)" }}>
            <div className="text-center flex-1">
              <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "4px" }}>MVA Noord</p>
              <p style={{ fontSize: (match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined)) ? "32px" : "24px", fontWeight: (match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined)) ? 800 : 300, color: (match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined)) ? "white" : "rgba(255,255,255,0.40)", letterSpacing: "-1px" }}>
                {match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined) ? match.score_home : "vs."}
              </p>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 300, color: "rgba(255,255,255,0.40)" }}>-</div>
            <div className="text-center flex-1">
              <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "4px" }}>{item.title}</p>
              <p style={{ fontSize: (match?.live_status === "finished" || (!isFuture && match?.score_away !== undefined)) ? "32px" : "24px", fontWeight: (match?.live_status === "finished" || (!isFuture && match?.score_away !== undefined)) ? 800 : 300, color: (match?.live_status === "finished" || (!isFuture && match?.score_away !== undefined)) ? "white" : "rgba(255,255,255,0.40)", letterSpacing: "-1px" }}>
                {match?.live_status === "finished" || (!isFuture && match?.score_away !== undefined) ? match.score_away : "vs."}
              </p>
            </div>
          </div>

          {/* Result badge */}
          {(match?.live_status === "finished" || (!isFuture && match?.score_home !== undefined && match?.score_away !== undefined)) && getScoreResult() && (
            <div className="flex justify-center mt-3">
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "4px 14px",
                borderRadius: "20px",
                background: getScoreBadgeStyles().bg,
                border: `0.5px solid ${getScoreBadgeStyles().border}`,
                color: getScoreBadgeStyles().color,
              }}>
                {getScoreResult()}
              </span>
            </div>
          )}

          {/* Live wedstrijd knop - prominent voor trainers */}
          {isTrainer && match && (
            <div className="mt-4 flex gap-2">
              <Link to={`/LiveMatch?matchId=${match.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                style={{ background: "#FF6B00", color: "#fff" }}>
                <Play size={16} /> Live wedstrijdmodus
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
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.70)",
                borderRadius: "14px",
                height: "44px",
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "opacity 0.15s",
              }} onMouseEnter={(e) => e.target.style.opacity = "0.8"} onMouseLeave={(e) => e.target.style.opacity = "1"}>
                <i className="ti ti-share" style={{ fontSize: "16px" }}></i>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
              style={{
                background: activeTab === i ? "rgba(255,140,58,0.20)" : "transparent",
                color: activeTab === i ? "#FF8C3A" : "rgba(255,255,255,0.45)",
                border: activeTab === i ? "0.5px solid rgba(255,140,58,0.30)" : "0.5px solid transparent",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overzicht */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Score sectie */}
            {match && (
              <div className="glass-dark rounded-2xl p-4">
                {!editingScore ? (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex-1">
                        {match.opponent_logo_url && (
                          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.08)", margin: "0 auto 8px" }}>
                            <img src={match.opponent_logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <p className="t-secondary-sm">MVA Noord</p>
                      </div>
                      <button type="button" onClick={() => { setEditingScore(true); setScoreHome(match.score_home ?? ""); setScoreAway(match.score_away ?? ""); }} style={{ minWidth: 0, background: "none", border: "none", cursor: isTrainer ? "pointer" : "default" }}>
                       <p style={{ fontSize: (match.live_status === "finished" || (!isFuture && match.score_home !== undefined && match.score_away !== undefined)) ? "40px" : "14px", fontWeight: 800, color: "white", letterSpacing: "-1px" }}>
                         {match.live_status === "finished" || (!isFuture && match.score_home !== undefined && match.score_away !== undefined) ? `${match.score_home} - ${match.score_away}` : "Wedstrijd nog niet gespeeld"}
                       </p>
                      </button>
                      <div className="flex-1">
                        {match.opponent_logo_url && (
                          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.08)", margin: "0 auto 8px" }}>
                            <img src={match.opponent_logo_url} alt="Opponent" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <p className="t-secondary-sm">{item.title}</p>
                      </div>
                    </div>
                    {(match.live_status === "finished" || (!isFuture && match.score_home !== undefined && match.score_away !== undefined)) && getScoreResult() && (
                      <div>
                        <span style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "4px 14px",
                          borderRadius: "20px",
                          background: getScoreBadgeStyles().bg,
                          border: `0.5px solid ${getScoreBadgeStyles().border}`,
                          color: getScoreBadgeStyles().color,
                        }}>
                          {getScoreResult()}
                        </span>
                      </div>
                    )}
                    {isTrainer && match.score_home === undefined && (
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", marginTop: "8px" }}>Tik op de score om in te voeren</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="t-card-title text-center">Voer eindstand in</p>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={scoreHome}
                        onChange={(e) => setScoreHome(e.target.value)}
                        style={{
                          width: "60px",
                          height: "44px",
                          fontSize: "20px",
                          fontWeight: 600,
                          textAlign: "center",
                          background: "rgba(255,255,255,0.06)",
                          border: "0.5px solid rgba(255,255,255,0.12)",
                          borderRadius: "10px",
                          color: "white",
                        }}
                      />
                      <span style={{ fontSize: "20px", fontWeight: 300, color: "rgba(255,255,255,0.40)" }}>-</span>
                      <input
                        type="number"
                        min="0"
                        value={scoreAway}
                        onChange={(e) => setScoreAway(e.target.value)}
                        style={{
                          width: "60px",
                          height: "44px",
                          fontSize: "20px",
                          fontWeight: 600,
                          textAlign: "center",
                          background: "rgba(255,255,255,0.06)",
                          border: "0.5px solid rgba(255,255,255,0.12)",
                          borderRadius: "10px",
                          color: "white",
                        }}
                      />
                      <button type="button" onClick={saveScore} disabled={saving} style={{ width: "44px", height: "44px", background: "#4ade80", border: "none", borderRadius: "10px", color: "#1c0e04", cursor: "pointer", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                      <button type="button" onClick={() => setEditingScore(false)} disabled={saving} style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RSVP alleen voor toekomstige wedstrijden */}
            {!isTrainer && myPlayer && isFuture && (
              <div className="glass-dark rounded-2xl p-4 space-y-3">
                <p className="t-card-title">Jouw aanwezigheid</p>
                <AttendanceButtons
                  currentStatus={myAttendance?.status}
                  loading={rsvpMutation.isPending}
                  showAbsentInput={showReasonInput}
                  absentReason={absentReason}
                  onAbsentReasonChange={setAbsentReason}
                  onPresent={() => rsvpMutation.mutate({ status: "aanwezig" })}
                  onAbsent={() => setShowReasonInput(true)}
                  onConfirmAbsent={() => rsvpMutation.mutate({ status: "afwezig", reason: absentReason })}
                />
              </div>
            )}

            {/* Na bevestiging: aanwezigheidslijst */}
            {!isTrainer && myAttendance && (
              <div className="glass-dark rounded-2xl p-4 space-y-3">
                <p className="t-card-title">Wie is er bij?</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="t-label mb-2" style={{ color: "#4ade80" }}>✓ Aanwezig ({aanwezigList.length})</p>
                    <div className="space-y-1.5">
                      {aanwezigList.map(player => <PlayerPill key={player.id} player={player} />)}
                      {aanwezigList.length === 0 && <p className="t-tertiary text-xs">Niemand</p>}
                    </div>
                  </div>
                  <div>
                    <p className="t-label mb-2" style={{ color: "#f87171" }}>✗ Afwezig ({afwezigList.length})</p>
                    <div className="space-y-1.5">
                      {afwezigList.map(({ player }) => <PlayerPill key={player.id} player={player} />)}
                      {afwezigList.length === 0 && <p className="t-tertiary text-xs">Niemand</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {item.notes && (
              <div className="glass-dark rounded-2xl p-4">
                <p className="t-label mb-2">Notities</p>
                <p className="t-secondary">{item.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Opstelling */}
         {activeTab === 1 && !editingLineup && (
          !isTrainer && isFuture ? (
            <div className="glass-dark rounded-2xl p-6 text-center">
              <p className="t-secondary">De opstelling wordt bekend gemaakt op de dag van de wedstrijd.</p>
            </div>
          ) : (
            <LineupOverview
              match={match}
              players={players}
              isTrainer={isTrainer}
              onEditClick={() => setEditingLineup(true)}
            />
          )
        )}

        {/* Lineup Selector Modal */}
        {editingLineup && (
          <LineupSelector
            match={match}
            players={players}
            onSave={handleSaveLineupEdit}
            onCancel={() => setEditingLineup(false)}
            saving={saving}
          />
        )}

        {/* Tab: Tactiek */}
        {activeTab === 2 && (
          <div className="space-y-4">
            {!match ? (
              <div className="glass-dark rounded-2xl p-6 text-center">
                <p className="t-secondary">Geen gekoppelde wedstrijd gevonden.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { key: "ball_possession", label: "Balbezit (BB)" },
                  { key: "pressing", label: "Verdediging / Pressing (VB)" },
                  { key: "transition", label: "Omschakeling" },
                  { key: "set_pieces", label: "Dode spelmomenten" },
                ].map(({ key, label }) => (
                  <div key={key} className="glass-dark rounded-2xl p-4">
                    <p className="t-label mb-2">{label}</p>
                    {isTrainer ? (
                      <textarea
                        value={tactics[key]}
                        onChange={e => setTactics(t => ({ ...t, [key]: e.target.value }))}
                        rows={3}
                        className="w-full text-sm text-white outline-none resize-none rounded-xl p-3"
                        style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)" }}
                        placeholder={`Notities voor ${label.toLowerCase()}...`}
                      />
                    ) : (
                      <p className="t-secondary">{tactics[key] || <span className="t-tertiary">Nog geen notities.</span>}</p>
                    )}
                  </div>
                ))}
                {isTrainer && (
                  <button onClick={saveLineup} disabled={saving} className="btn-primary">
                    {saving ? "Opslaan..." : "Tactiek opslaan"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Aanwezigheid */}
        {activeTab === 3 && (
          <div className="glass-dark rounded-2xl p-4 space-y-5">
            <div>
              <p className="t-label mb-3" style={{ color: "#4ade80" }}>Bevestigd aanwezig ({aanwezigList.length})</p>
              {aanwezigList.length === 0 ? <p className="t-tertiary text-sm">Niemand bevestigd</p> : (
                <div className="space-y-2">
                  {aanwezigList.map(player => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(74,222,128,0.06)" }}>
                      <PlayerAvatar player={player} />
                      <p className="t-secondary flex-1">{player.name}</p>
                      <div className="dot-green" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="t-label mb-3" style={{ color: "#f87171" }}>Afgemeld ({afwezigList.length})</p>
              {afwezigList.length === 0 ? <p className="t-tertiary text-sm">Niemand afgemeld</p> : (
                <div className="space-y-2">
                  {afwezigList.map(({ player, record }) => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(248,113,113,0.06)" }}>
                      <PlayerAvatar player={player} />
                      <div className="flex-1 min-w-0">
                        <p className="t-secondary">{player.name}</p>
                        {isTrainer && record.notes && <p className="t-tertiary truncate">{record.notes}</p>}
                      </div>
                      <div className="dot-red" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="t-label mb-3" style={{ color: "#fbbf24" }}>Nog niet gereageerd ({nognietList.length})</p>
              {nognietList.length === 0 ? <p className="t-tertiary text-sm">Iedereen heeft gereageerd 🎉</p> : (
                <div className="space-y-2">
                  {nognietList.map(player => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <PlayerAvatar player={player} />
                      <p className="t-secondary flex-1">{player.name}</p>
                      <div className="dot-yellow" />
                    </div>
                  ))}
                  {isTrainer && (
                    <button onClick={() => sendReminder.mutate()} disabled={sendReminder.isPending || reminderSent}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                      style={{
                        background: reminderSent ? "rgba(74,222,128,0.10)" : "rgba(255,107,0,0.15)",
                        border: `0.5px solid ${reminderSent ? "rgba(74,222,128,0.25)" : "rgba(255,107,0,0.30)"}`,
                        color: reminderSent ? "#4ade80" : "#FF8C3A",
                      }}>
                      <Bell size={15} />
                      {reminderSent ? "Herinneringen verstuurd!" : sendReminder.isPending ? "Versturen..." : `Stuur herinnering (${nognietList.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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

function PlayerAvatar({ player }) {
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
      style={{ background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.25)" }}>
      {player.photo_url
        ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
        : <span style={{ fontSize: 11, fontWeight: 700, color: "#FF8C3A" }}>{player.name?.charAt(0)}</span>}
    </div>
  );
}

function PlayerPill({ player }) {
  const firstName = player.name?.split(" ")[0] || player.name;
  return (
    <div className="flex items-center gap-2">
      <PlayerAvatar player={player} />
      <span className="t-secondary-sm truncate">{firstName}</span>
    </div>
  );
}