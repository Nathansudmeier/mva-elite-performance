import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Star, Trophy } from "lucide-react";

export default function OuderDashboard() {
  const { user: currentUser, playerId: childPlayerId } = useCurrentUser();

  const { data: child } = useQuery({
    queryKey: ["child", childPlayerId],
    queryFn: () => base44.entities.Player.filter({ id: childPlayerId }),
    enabled: !!childPlayerId,
    select: (data) => data[0],
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["agendaItems"],
    queryFn: () => base44.entities.AgendaItem.list("-date"),
  });

  const { data: agendaAttendance = [] } = useQuery({
    queryKey: ["agendaAttendance"],
    queryFn: () => base44.entities.AgendaAttendance.list(),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const { data: winningTeams = [] } = useQuery({
    queryKey: ["winningTeams"],
    queryFn: () => base44.entities.WinningTeam.list(),
  });

  const { data: photoWallPosts = [] } = useQuery({
    queryKey: ["photoWallPosts"],
    queryFn: () => base44.entities.PhotoWallPost.list("-created_date"),
  });

  const { data: liveMatches = [] } = useQuery({
    queryKey: ["liveMatches"],
    queryFn: () => base44.entities.Match.list("-date"),
    select: (data) => data.filter(m => m.live_status && m.live_status !== "finished"),
  });

  // Get child's team from matches
  const childTeam = matches.length > 0 ? matches[0]?.team : null;

  // Trainingen for child (use AgendaItem type Training)
  const childTrainings = agendaItems.filter(
    ai => ai.type === "Training" && (!childTeam || ai.team === "Beide" || ai.team === childTeam)
  );

  // Child's attendance
  const childAttendanceRecords = agendaAttendance.filter(aa => aa.player_id === childPlayerId);
  const presentCount = childAttendanceRecords.filter(aa => aa.status === "aanwezig").length;
  const attendancePct = childAttendanceRecords.length > 0 ? Math.round((presentCount / childAttendanceRecords.length) * 100) : 0;

  // Last 10 trainings for dots
  const last10Trainings = childTrainings.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).reverse();

  // Next activity
  const today = new Date().toISOString().split("T")[0];
  const nextActivity = agendaItems
    .filter(ai => ai.date >= today && (!childTeam || ai.team === "Beide" || ai.team === childTeam))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  // Next 3 matches
  const nextMatches = matches
    .filter(m => m.date >= today && (!childTeam || m.team === childTeam))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // Child's championship position
  const childWins = winningTeams.filter(wt => wt.winning_player_ids?.includes(childPlayerId)).length;
  const childPosition = winningTeams.length > 0
    ? (winningTeams.reduce((max, wt) => Math.max(max, wt.winning_player_ids?.length || 0), 0) > 0
      ? Math.max(1, childWins > 0 ? 1 : childWins + 1)
      : 0)
    : 0;

  // Last activity attendance status
  const nextActivityAttendance = nextActivity ? agendaAttendance.find(aa => aa.agenda_item_id === nextActivity.id && aa.player_id === childPlayerId) : null;

  const getActivityColor = (type) => {
    switch (type) {
      case "Training":
        return { bg: "rgba(8,208,104,0.15)", color: "#08D068", label: "Training" };
      case "Wedstrijd":
        return { bg: "rgba(255,107,0,0.15)", color: "#FF6800", label: "Wedstrijd" };
      case "Toernooi":
        return { bg: "rgba(255,214,0,0.15)", color: "#FFD600", label: "Toernooi" };
      default:
        return { bg: "rgba(96,165,250,0.15)", color: "#60a5fa", label: type };
    }
  };

  const getAttendanceIcon = (status) => {
    if (status === "aanwezig") return { icon: "✓", color: "#08D068", label: "Aangemeld" };
    if (status === "afwezig") return { icon: "✕", color: "#FF3DA8", label: "Afgemeld" };
    return { icon: "⏱", color: "rgba(26,26,26,0.35)", label: "Nog niet gereageerd" };
  };

  return (
    <div className="pb-20 xl:pb-8" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Live banner - only on match days */}
      {liveMatches.length > 0 && liveMatches[0]?.team === childTeam && nextMatches.some(m => m.id === liveMatches[0].id) && (
        <div style={{
          background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px",
          padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "3px 3px 0 #1a1a1a"
        }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nu live</p>
            <p style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>Volg de wedstrijd</p>
          </div>
          <Link to={`/live/${liveMatches[0].id}`} style={{
            background: "#ffffff", color: "#FF6800", padding: "10px 16px",
            borderRadius: "12px", fontWeight: 700, fontSize: "12px",
            border: "2px solid #1a1a1a", textDecoration: "none", cursor: "pointer"
          }}>
            Volg live →
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#1a1a1a" }}>
            Hallo {currentUser?.full_name?.split(" ")[0]}
          </h1>
          {child && (
            <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.50)", fontWeight: 600, marginTop: "4px" }}>
              Je volgt {child.name}
            </p>
          )}
        </div>
        <div style={{
          background: "rgba(26,26,26,0.08)", border: "1.5px solid rgba(26,26,26,0.15)",
          borderRadius: "20px", padding: "3px 10px", fontSize: "9px", fontWeight: 800,
          color: "rgba(26,26,26,0.45)", textTransform: "uppercase", whiteSpace: "nowrap"
        }}>
          Alleen lezen
        </div>
      </div>

      {/* Child profile card */}
      {child && (
        <div style={{
          background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px",
          boxShadow: "3px 3px 0 #1a1a1a", padding: "16px",
          display: "flex", alignItems: "center", gap: "16px"
        }}>
          <img src={child.photo_url || "https://via.placeholder.com/56"} alt={child.name}
            style={{
              width: "56px", height: "56px", borderRadius: "50%",
              border: "2.5px solid #1a1a1a", objectFit: "cover", flexShrink: 0
            }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a" }}>{child.name}</h2>
            <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.50)", fontWeight: 600, marginTop: "2px" }}>
              {child.position}
            </p>
          </div>
          {child.shirt_number && (
            <div style={{
              background: "#FF6800", color: "#ffffff", padding: "2px 8px",
              borderRadius: "20px", border: "1.5px solid #1a1a1a",
              fontSize: "11px", fontWeight: 800
            }}>
              #{child.shirt_number}
            </div>
          )}
        </div>
      )}

      {/* Attendance card */}
      <div style={{
        background: "#08D068", border: "2.5px solid #1a1a1a", borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a", padding: "16px"
      }}>
        <p className="t-label" style={{ color: "rgba(26,26,26,0.60)", marginBottom: "12px" }}>Aanwezigheid</p>
        <p style={{ fontSize: "34px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1.5px" }}>
          {attendancePct}%
        </p>
        <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.60)", fontWeight: 600, marginTop: "8px" }}>
          {presentCount} van de {childAttendanceRecords.length} trainingen
        </p>
        <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
          {last10Trainings.map((training, i) => {
            const att = childAttendanceRecords.find(aa => aa.session_id === training.id);
            return (
              <div key={i} style={{
                width: "9px", height: "9px", borderRadius: "50%",
                border: "1.5px solid #1a1a1a",
                background: att?.status === "aanwezig" ? "#1a1a1a" : "transparent",
                flexShrink: 0
              }} />
            );
          })}
        </div>
      </div>

      {/* Next activity */}
      {nextActivity && (
        <div style={{
          background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px",
          boxShadow: "3px 3px 0 #1a1a1a", padding: "16px"
        }}>
          <p className="t-label" style={{ color: "rgba(26,26,26,0.50)", marginBottom: "12px" }}>Volgende activiteit</p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a" }}>{nextActivity.title}</h3>
              <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", fontWeight: 600, marginTop: "4px" }}>
                {format(new Date(nextActivity.date), "d MMMM HH:mm", { locale: nl })}
              </p>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <div style={{
                  ...getActivityColor(nextActivity.type),
                  padding: "3px 10px", borderRadius: "20px", fontSize: "9px", fontWeight: 800
                }}>
                  {getActivityColor(nextActivity.type).label}
                </div>
                {nextActivityAttendance && (
                  <div style={{
                    ...getAttendanceIcon(nextActivityAttendance.status),
                    padding: "3px 10px", borderRadius: "20px", fontSize: "9px", fontWeight: 800,
                    background: getAttendanceIcon(nextActivityAttendance.status).color + "20",
                    color: getAttendanceIcon(nextActivityAttendance.status).color,
                    display: "flex", alignItems: "center", gap: "4px"
                  }}>
                    {getAttendanceIcon(nextActivityAttendance.status).icon} {getAttendanceIcon(nextActivityAttendance.status).label}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next matches */}
      {nextMatches.length > 0 && (
        <div style={{
          background: "#1a1a1a", border: "2.5px solid #1a1a1a", borderRadius: "18px",
          boxShadow: "3px 3px 0 #1a1a1a", padding: "16px"
        }}>
          <p className="t-label" style={{ color: "rgba(255,255,255,0.45)", marginBottom: "12px" }}>Wedstrijden</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {nextMatches.map((match, i) => (
              <div key={match.id} style={{
                display: "flex", alignItems: "center", gap: "12px",
                paddingBottom: "10px", borderBottom: i < nextMatches.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none"
              }}>
                <div style={{
                  background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "20px", padding: "4px 10px", fontSize: "10px", fontWeight: 700, color: "#ffffff",
                  whiteSpace: "nowrap"
                }}>
                  {format(new Date(match.date), "d MMM", { locale: nl })}
                </div>
                <p style={{ color: "#ffffff", fontWeight: 700, flex: 1 }}>{match.opponent}</p>
                <div style={{
                  background: match.home_away === "Thuis" ? "rgba(8,208,104,0.20)" : "rgba(255,213,0,0.20)",
                  color: match.home_away === "Thuis" ? "#08D068" : "#FFD600",
                  padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 700
                }}>
                  {match.home_away}
                </div>
                {match.opponent_logo && (
                  <img src={match.opponent_logo} alt=""
                    style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      objectFit: "cover", flexShrink: 0
                    }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning goals */}
      {(child?.iop_goal_1 || child?.iop_goal_2 || child?.iop_goal_3) && (
        <div style={{
          background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "18px",
          boxShadow: "3px 3px 0 #1a1a1a", padding: "16px"
        }}>
          <p className="t-label" style={{ color: "rgba(26,26,26,0.55)", marginBottom: "12px" }}>Leerdoelen</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[child.iop_goal_1, child.iop_goal_2, child.iop_goal_3].filter(Boolean).map((goal, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%", background: "#1a1a1a",
                  flexShrink: 0, marginTop: "6px"
                }} />
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.4 }}>{goal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Champions Trophy */}
      <div style={{
        background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a", padding: "16px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <p className="t-label" style={{ color: "rgba(255,255,255,0.65)", marginBottom: "8px" }}>Champions Trophy</p>
          <p style={{ fontSize: "40px", fontWeight: 900, color: "#ffffff", letterSpacing: "-2px", lineHeight: 1 }}>
            #{Math.max(1, childWins > 0 ? 1 : childWins + 10)}
          </p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", fontWeight: 600, marginTop: "4px" }}>
            {childWins} wins
          </p>
        </div>
        <div style={{ fontSize: "48px" }}>🏆</div>
      </div>

      {/* Photo preview */}
      {photoWallPosts.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 900, color: "#1a1a1a" }}>Foto's</h3>
            <Link to="/Photowall" style={{ fontSize: "12px", fontWeight: 700, color: "#FF6800", textDecoration: "none" }}>
              Alle foto's →
            </Link>
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
            {photoWallPosts.slice(0, 8).map(post => (
              <img key={post.id} src={post.thumbnail_url || post.photo_url} alt=""
                style={{
                  width: "80px", height: "80px", borderRadius: "12px", border: "2px solid #1a1a1a",
                  objectFit: "cover", flexShrink: 0
                }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}