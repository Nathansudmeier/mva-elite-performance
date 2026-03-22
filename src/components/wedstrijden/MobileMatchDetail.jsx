import React from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Edit2, Radio, Trash2, Shield, ArrowLeftRight, Flag, Check, X } from "lucide-react";
import FieldLineup from "./FieldLineup";
import MatchCheckInOverview from "../checkin/MatchCheckInOverview";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

function lineupArrayToMap(arr) {
  if (!arr) return {};
  return arr.reduce((acc, { slot, player_id }) => { if (slot && player_id) acc[slot] = player_id; return acc; }, {});
}

function TactSection({ icon: Icon, title, content }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: "#FF8C3A" }} />
        <h3 className="t-card-title">{title}</h3>
      </div>
      <p className="t-secondary whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function scoreLabel(m) {
  if (m.score_home !== undefined && m.score_home !== null && m.score_away !== undefined && m.score_away !== null) {
    return `${m.score_home} – ${m.score_away}`;
  }
  return "–";
}

export default function MobileMatchDetail({
  match,
  activePlayers,
  isTrainer,
  currentUser,
  players,
  agendaItems,
  agendaAttendance,
  onBack,
  onEdit,
  onDelete,
}) {
  const queryClient = useQueryClient();

  const myPlayer = currentUser ? players.find(p => p.name === currentUser.full_name) : null;
  const linkedAgendaItem = agendaItems.find(ai => ai.match_id === match.id || (ai.type === "Wedstrijd" && ai.date === match.date && ai.title?.includes(match.opponent)));
  const myRecord = myPlayer && linkedAgendaItem ? agendaAttendance.find(aa => aa.agenda_item_id === linkedAgendaItem.id && aa.player_id === myPlayer.id) : null;

  const rsvp = async (status) => {
    if (myRecord) {
      await base44.entities.AgendaAttendance.update(myRecord.id, { status });
    } else if (myPlayer && linkedAgendaItem) {
      await base44.entities.AgendaAttendance.create({ agenda_item_id: linkedAgendaItem.id, player_id: myPlayer.id, status });
    }
    queryClient.invalidateQueries({ queryKey: ["agendaAttendanceAll"] });
  };

  const today = new Date().toISOString().split("T")[0];
  const isMatchDay = match.date === today;
  const canSeeLineup = isTrainer || isMatchDay;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "#1c0e04" }}>
      {/* Topbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "rgba(28,14,4,0.95)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <button onClick={onBack} className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
          <i className="ti ti-arrow-left" style={{ fontSize: "18px", color: "#fff" }} />
        </button>
        <h1 className="t-page-title truncate flex-1 text-center">vs. {match.opponent}</h1>
        <div className="w-9" />
      </div>

      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,107,0,0.40)", top: -80, left: -60, filter: "blur(70px)" }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,150,0,0.20)", top: 300, right: -40, filter: "blur(60px)" }} />
      </div>

      <div className="relative p-4 space-y-4 pb-24" style={{ zIndex: 1 }}>
        {/* Match hero card */}
        <div className="match-hero-card p-5">
          <div className="absolute inset-0">
            <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
              <rect x="1" y="1" width="398" height="158" fill="none" stroke="white" strokeWidth="2"/>
              <line x1="200" y1="1" x2="200" y2="159" stroke="white" strokeWidth="1.5"/>
              <circle cx="200" cy="80" r="30" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="1" y="45" width="45" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
              <rect x="354" y="45" width="45" height="70" fill="none" stroke="white" strokeWidth="1.5"/>
            </svg>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(255,107,0,0.15) 0%, rgba(0,0,0,0.10) 100%)" }} />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge" style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "0.5px solid rgba(255,255,255,0.2)" }}>{match.team}</span>
                  <span className={match.home_away === "Thuis" ? "badge badge-win" : "badge badge-draw"}>{match.home_away}</span>
                </div>
                <h2 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.3px" }}>vs. {match.opponent}</h2>
                <p className="t-secondary mt-1">{format(new Date(match.date), "d MMMM yyyy", { locale: nl })}</p>
              </div>
              <span className="t-metric-orange" style={{ fontSize: "26px" }}>{scoreLabel(match)}</span>
            </div>
            {isTrainer && (
              <div className="flex gap-2 mt-4 flex-col sm:flex-row">
                <button onClick={onEdit} className="btn-secondary text-xs px-3 py-2 h-auto flex-1 sm:flex-none">
                  <Edit2 size={12} /> Bewerken
                </button>
                <Link to={`/LiveMatch?matchId=${match.id}`} className="flex-1 sm:flex-none">
                  <button className="btn-primary w-full text-xs px-3 py-2 h-auto">
                    <Radio size={12} /> Live
                  </button>
                </Link>
                <button onClick={onDelete} className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold flex-1 sm:flex-none"
                  style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "0.5px solid rgba(248,113,113,0.25)", cursor: "pointer" }}>
                  <Trash2 size={11} /> Verwijderen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Opstelling */}
        {match.lineup && match.lineup.length > 0 && (
          <div className="glass p-4">
            {canSeeLineup ? (
              <>
                <p className="t-card-title mb-3">Opstelling — {match.formation}</p>
                <FieldLineup
                  players={activePlayers}
                  lineupMap={lineupArrayToMap(match.lineup)}
                  formation={match.formation || "4-3-3"}
                  readOnly
                />
                {match.substitutes && match.substitutes.length > 0 && (
                  <div className="mt-4 pt-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.10)" }}>
                    <p className="t-label mb-2">Wissels</p>
                    <div className="flex flex-wrap gap-2">
                      {match.substitutes.map((pid) => {
                        const p = activePlayers.find((pl) => pl.id === pid);
                        return p ? (
                          <span key={pid} className="badge" style={{ background: "rgba(255,107,0,0.12)", color: "#FF8C3A", border: "0.5px solid rgba(255,107,0,0.2)" }}>
                            ⇄ {p.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Shield size={28} className="mx-auto mb-2" style={{ color: "rgba(255,107,0,0.40)" }} />
                <p className="t-card-title mb-1">Opstelling nog niet beschikbaar</p>
                <p className="t-secondary">De opstelling wordt zichtbaar op de wedstrijddag.</p>
              </div>
            )}
          </div>
        )}

        {/* Tactische notities */}
        {(match.ball_possession || match.pressing || match.transition || match.set_pieces) && (
          <div className="space-y-3">
            {match.ball_possession && <TactSection icon={Shield} title="Balbezit (BB)" content={match.ball_possession} />}
            {match.pressing && <TactSection icon={Shield} title="Pressing (VB)" content={match.pressing} />}
            {match.transition && <TactSection icon={ArrowLeftRight} title="Omschakeling" content={match.transition} />}
            {match.set_pieces && <TactSection icon={Flag} title="Dode Spelmomenten" content={match.set_pieces} />}
          </div>
        )}

        {match.notes && (
          <div className="glass p-4">
            <p className="t-card-title mb-1">Extra Notities</p>
            <p className="t-secondary whitespace-pre-wrap">{match.notes}</p>
          </div>
        )}

        {/* Aanwezigheid (speler) */}
        {!isTrainer && myPlayer && linkedAgendaItem && (
          <div className="glass p-4 flex items-center justify-between gap-3">
            <div>
              <p className="t-card-title">Mijn aanwezigheid</p>
              <p className="t-secondary-sm">Geef aan of je erbij bent</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => rsvp("aanwezig")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: myRecord?.status === "aanwezig" ? "#4ade80" : "rgba(74,222,128,0.12)", color: myRecord?.status === "aanwezig" ? "#fff" : "#4ade80", border: "0.5px solid rgba(74,222,128,0.30)" }}
              >
                <Check size={14} /> Ik kom
              </button>
              <button
                onClick={() => rsvp("afwezig")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: myRecord?.status === "afwezig" ? "#f87171" : "rgba(248,113,113,0.12)", color: myRecord?.status === "afwezig" ? "#fff" : "#f87171", border: "0.5px solid rgba(248,113,113,0.30)" }}
              >
                <X size={14} /> Ik kom niet
              </button>
            </div>
          </div>
        )}

        {/* Check-in status (trainer) — Liquid Glass stijl */}
        {isTrainer && (
          <div style={{
            background: "rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "0.5px solid rgba(255,255,255,0.18)",
            borderRadius: "22px",
            overflow: "hidden",
            position: "relative",
          }}>
            {/* glass shimmer */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
            <div className="p-5">
              <p className="t-label mb-4" style={{ color: "#FF8C3A", letterSpacing: "0.08em" }}>Check-in Status</p>
              <MatchCheckInOverview
                matchId={match.id}
                totalInSelectie={(match.lineup?.length ?? 0) + (match.substitutes?.length ?? 0)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}