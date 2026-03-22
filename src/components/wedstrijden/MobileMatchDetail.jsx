import React from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Edit2, Radio, Trash2, Shield, ArrowLeftRight, Flag, Check, X, Users, ArrowLeft } from "lucide-react";
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

function CheckInContent({ matchId, totalInSelectie }) {
  return <MatchCheckInOverview matchId={matchId} totalInSelectie={totalInSelectie} />;
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
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "#1c0e04", paddingTop: "calc(52px + 8px)" }}>
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,107,0,0.40)", top: -80, left: -60, filter: "blur(70px)" }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,150,0,0.20)", top: 300, right: -40, filter: "blur(60px)" }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
         {/* Hero section with field background */}
         <div style={{
           position: "relative",
           height: "220px",
           overflow: "hidden",
         }}>
            {/* Background image */}
            <img 
              src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/e47690dd6_wedstrijd.jpg" 
              alt="Wedstrijd veld"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />

            {/* Overlay 1: Dark overlay for readability */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />

            {/* Overlay 2: Gradient fade to bottom */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(28,14,4,1.0) 100%)" }} />

           {/* Back button */}
           <button onClick={onBack} style={{
             position: "absolute",
             top: 0,
             left: 0,
             zIndex: 2,
             padding: "0.75rem 1.25rem",
             background: "none",
             border: "none",
             display: "flex",
             alignItems: "center",
             gap: "6px",
             color: "rgba(255,255,255,0.85)",
             fontSize: "13px",
             fontWeight: 500,
             cursor: "pointer",
           }}>
             <i className="ti ti-arrow-left" style={{ fontSize: "16px" }} />
             Wedstrijden
           </button>

           {/* Team logos left and right */}
           <div style={{ position: "absolute", bottom: "16px", left: "16px", zIndex: 2 }}>
             <div style={{
               width: "48px",
               height: "48px",
               borderRadius: "50%",
               background: "rgba(255,255,255,0.12)",
               border: "1px solid rgba(255,255,255,0.25)",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               color: "white",
               fontSize: "12px",
               fontWeight: 700,
             }}>
               MVA
             </div>
           </div>

           {/* Match info center bottom */}
           <div style={{
             position: "absolute",
             bottom: "16px",
             left: "50%",
             right: 0,
             zIndex: 2,
             transform: "translateX(-50%)",
             textAlign: "center",
           }}>
             <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.70)", marginBottom: "4px" }}>
               vs. <span style={{ fontWeight: 700, color: "white" }}>{match.opponent}</span>
             </p>
             <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.50)", marginBottom: "8px" }}>
               {format(new Date(match.date), "d MMMM", { locale: nl })}
             </p>
             <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
               <span className="badge" style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "0.5px solid rgba(255,255,255,0.2)", fontSize: "10px" }}>
                 {match.team}
               </span>
               <span className={match.home_away === "Thuis" ? "badge badge-win" : "badge badge-draw"} style={{ fontSize: "10px" }}>
                 {match.home_away}
               </span>
             </div>
           </div>

           {/* Team logo right */}
           <div style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 2 }}>
             <div style={{
               width: "48px",
               height: "48px",
               borderRadius: "50%",
               background: "rgba(255,255,255,0.12)",
               border: "1px solid rgba(255,255,255,0.25)",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               color: "white",
               fontSize: "10px",
               fontWeight: 700,
               textAlign: "center",
               padding: "4px",
             }}>
               {match.opponent.split(" ").slice(0, 2).map(w => w[0]).join("")}
             </div>
           </div>
         </div>

         {/* Spacing after hero */}
         <div style={{ padding: "0 1.25rem", paddingBottom: "24px", marginTop: "16px" }}>
           {/* Action buttons */}
           {isTrainer && (
             <div className="flex flex-col" style={{ gap: "10px" }}>
            <Link to={`/LiveMatch?matchId=${match.id}`} className="w-full">
              <button style={{ background: "#FF6B00", color: "white", borderRadius: "14px", height: "48px", fontSize: "15px", fontWeight: 600, border: "none", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                <Radio size={16} /> Live
              </button>
            </Link>
            <div className="flex gap-2" style={{ marginTop: "12px" }}>
              <Link to={`/MatchEdit?matchId=${match.id}`} className="flex-1">
                <button style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.70)", borderRadius: "12px", height: "40px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                  <Edit2 size={14} /> Bewerken
                </button>
              </Link>
              <button onClick={onDelete} style={{ background: "rgba(248,113,113,0.10)", border: "0.5px solid rgba(248,113,113,0.20)", color: "#f87171", borderRadius: "12px", height: "40px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                <Trash2 size={14} /> Verwijderen
              </button>
            </div>
            </div>
            )}

          {/* Opstelling */}
          {match.lineup && match.lineup.length > 0 && (
            <div className="glass p-4" style={{ marginTop: "12px" }}>
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
            <div className="glass p-4 flex items-center justify-between gap-3" style={{ marginTop: "32px" }}>
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
              marginTop: "32px",
            }}>
              {/* glass shimmer */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
              <div className="p-5">
                <p style={{ fontSize: "14px", fontWeight: 600, color: "white", marginBottom: "16px" }}>Aanwezigheid</p>
                <CheckInContent matchId={match.id} totalInSelectie={(match.lineup?.length ?? 0) + (match.substitutes?.length ?? 0)} />
              </div>
            </div>
          )}
          </div>
          </div>
          </div>
          );
          }