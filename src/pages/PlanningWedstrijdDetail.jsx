import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, Clock, Bell, Pencil, Trash2, Play, Trophy, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, TYPE_CONFIG, TEAM_COLORS } from "@/components/agenda/agendaUtils";
import AttendanceButtons from "@/components/attendance/AttendanceButtons";
import FieldLineup from "@/components/wedstrijden/FieldLineup";
import AgendaForm from "@/components/agenda/AgendaForm";
import LineupOverview from "@/components/wedstrijden/LineupOverview";
import LineupSelector from "@/components/wedstrijden/LineupSelector";
import { createPageUrl } from "@/utils";

const TABS = ["Opstelling", "Tactiek", "Aanwezigheid"];

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  async function handleReset() {
    if (!match) return;
    setResetting(true);
    await base44.entities.Match.update(match.id, {
      live_events: [],
      score_home: 0,
      score_away: 0,
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
        <div className="glass flex flex-wrap gap-2" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              style={{
                flex: "1 1 auto", minWidth: "22%", padding: "10px 6px", fontSize: "10px", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                background: activeTab === i ? teamCardBg : "transparent",
                color: activeTab === i ? (teamCardBg === "#FF3DA8" ? "#ffffff" : "#1a1a1a") : "rgba(26,26,26,0.45)",
                border: "none", transition: "all 0.15s", borderRadius: "8px"
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Opstelling */}
          {activeTab === 0 && !editingLineup && (
          !isTrainer && isFuture ? (
            <div className="glass p-6 md:p-8 text-center" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
              <p style={{ fontSize: 13, color: "rgba(26,26,26,0.50)" }}>De opstelling wordt bekend gemaakt op de dag van de wedstrijd.</p>
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
         {activeTab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!match ? (
              <div className="glass p-6 md:p-8 text-center" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
                <p style={{ fontSize: 13, color: "rgba(26,26,26,0.50)" }}>Geen gekoppelde wedstrijd gevonden.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { key: "ball_possession", label: "Balbezit (BB)" },
                  { key: "pressing", label: "Verdediging / Pressing (VB)" },
                  { key: "transition", label: "Omschakeling" },
                  { key: "set_pieces", label: "Dode spelmomenten" },
                ].map(({ key, label }) => (
                  <div key={key} className="glass p-4 md:p-5" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(26,26,26,0.55)", marginBottom: 8 }}>{label}</p>
                    {isTrainer ? (
                      <textarea
                        value={tactics[key]}
                        onChange={e => setTactics(t => ({ ...t, [key]: e.target.value }))}
                        rows={3}
                        style={{ width: "100%", fontSize: 13, color: "#1a1a1a", outline: "none", resize: "none", borderRadius: 10, padding: "8px 12px", background: "rgba(26,26,26,0.04)", border: "2px solid rgba(26,26,26,0.12)", boxSizing: "border-box", fontWeight: 500 }}
                        placeholder={`Notities voor ${label.toLowerCase()}...`}
                      />
                    ) : (
                      <p style={{ fontSize: 13, color: tactics[key] ? "rgba(26,26,26,0.65)" : "rgba(26,26,26,0.30)" }}>{tactics[key] || "Nog geen notities."}</p>
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
        {activeTab === 2 && (
          <div className="glass p-4 md:p-6" style={{ border: "2.5px solid #1a1a1a", boxShadow: "3px 3px 0 #1a1a1a", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#05a050", marginBottom: 10 }}>Bevestigd aanwezig ({aanwezigList.length})</p>
              {aanwezigList.length === 0 ? <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Niemand bevestigd</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {aanwezigList.map(player => (
                    <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(8,208,104,0.08)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 10 }}>
                      <PlayerAvatar player={player} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{player.name}</p>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#05a050", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FF3DA8", marginBottom: 10 }}>Afgemeld ({afwezigList.length})</p>
              {afwezigList.length === 0 ? <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Niemand afgemeld</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {afwezigList.map(({ player, record }) => (
                    <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,61,168,0.06)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 10 }}>
                      <PlayerAvatar player={player} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{player.name}</p>
                        {isTrainer && record.notes && <p style={{ fontSize: 11, color: "#FF3DA8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.notes}</p>}
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF3DA8", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#cc9900", marginBottom: 10 }}>Nog niet gereageerd ({nognietList.length})</p>
              {nognietList.length === 0 ? <p style={{ fontSize: 12, color: "rgba(26,26,26,0.40)" }}>Iedereen heeft gereageerd 🎉</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {nognietList.map(player => (
                    <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(26,26,26,0.03)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: 10 }}>
                      <PlayerAvatar player={player} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{player.name}</p>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFD600", border: "1.5px solid #1a1a1a", flexShrink: 0 }} />
                    </div>
                  ))}
                  {isTrainer && (
                    <button onClick={() => sendReminder.mutate()} disabled={sendReminder.isPending || reminderSent}
                      style={{ marginTop: 8, width: "100%", height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, border: "2px solid #1a1a1a", background: reminderSent ? "#08D068" : "#ffffff", color: "#1a1a1a", fontSize: 13, fontWeight: 800, cursor: reminderSent ? "default" : "pointer", boxShadow: "2px 2px 0 #1a1a1a" }}>
                      <Bell size={14} />
                      {reminderSent ? "Verstuurd!" : sendReminder.isPending ? "Versturen..." : `Stuur herinnering (${nognietList.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
    <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(255,104,0,0.12)", border: "1.5px solid #1a1a1a" }}>
      {player.photo_url
        ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 11, fontWeight: 800, color: "#FF6800" }}>{player.name?.charAt(0)}</span>}
    </div>
  );
}

function PlayerPill({ player }) {
  const firstName = player.name?.split(" ")[0] || player.name;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <PlayerAvatar player={player} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</span>
    </div>
  );
}