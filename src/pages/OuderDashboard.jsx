import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Star, Trophy } from "lucide-react";
import PlayerAttendanceCard from "@/components/dashboard/PlayerAttendanceCard";
import TrainerChampionsTrophy from "@/components/dashboard/TrainerChampionsTrophy";

export default function OuderDashboard() {
  const { user: currentUser, playerId: childPlayerId } = useCurrentUser();

  const { data: child } = useQuery({
    queryKey: ["child", childPlayerId],
    queryFn: () => base44.entities.Player.filter({ id: childPlayerId }),
    enabled: !!childPlayerId,
    select: (data) => data[0],
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
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
    select: (data) => data.filter(m => m.live_status === "live" || m.live_status === "halftime"),
  });

  // Get child's team from the child player record
  const childTeam = child?.team || (matches.find(m => m.lineup?.some(l => l.player_id === childPlayerId))?.team) || null;

  // Trainingen for child (use AgendaItem type Training)
  const childTrainings = agendaItems.filter(
    ai => ai.type === "Training" && (!childTeam || ai.team === "Beide" || ai.team === childTeam)
  );

  // Child's attendance
  const childAttendanceRecords = agendaAttendance.filter(aa => aa.player_id === childPlayerId);
  const presentCount = childAttendanceRecords.filter(aa => aa.status === "aanwezig").length;
  const attendancePct = childAttendanceRecords.length > 0 ? Math.round((presentCount / childAttendanceRecords.length) * 100) : 0;

  // Next activity
  const today = new Date().toISOString().split("T")[0];
  const nextActivity = agendaItems
    .filter(ai => ai.date >= today && (!childTeam || ai.team === "Beide" || ai.team === childTeam))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  // Next 3 matches (from agendaItems Wedstrijd type for correct match_id lookup)
  const nextAgendaMatches = agendaItems
    .filter(ai => ai.type === "Wedstrijd" && ai.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  // Build nextMatches by joining agendaItems (for selection) to Match records
  // Show all teams — child may play MO17 one week and Dames 1 the next
  const nextMatches = nextAgendaMatches.map(ai => {
    const linked = matches.find(m => m.id === ai.match_id);
    return linked
      ? { ...linked, agendaTitle: ai.title, agendaTeam: ai.team }
      : { id: ai.id, date: ai.date, opponent: ai.title, home_away: ai.home_away, team: ai.team, selection: [], agendaId: ai.id };
  });

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
      {liveMatches.length > 0 && (
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

      {/* Child profile card - clickable */}
      {child && (
        <Link to={`/PlayerDetail?id=${child.id}`} style={{ textDecoration: "none" }}>
          <div style={{
            background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px",
            boxShadow: "3px 3px 0 #1a1a1a", padding: "16px",
            display: "flex", alignItems: "center", gap: "16px", cursor: "pointer",
            transition: "transform 0.1s", position: "relative"
          }} onMouseDown={e => e.currentTarget.style.transform = "translate(2px, 2px)"} onMouseUp={e => e.currentTarget.style.transform = "translate(0, 0)"}>
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
        </Link>
      )}

      {/* Attendance card */}
      <PlayerAttendanceCard percentage={attendancePct} present={presentCount} total={childAttendanceRecords.length} />

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
                display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
                paddingBottom: "10px", borderBottom: i < nextMatches.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none"
              }}>
                <div style={{
                  background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "20px", padding: "4px 10px", fontSize: "10px", fontWeight: 700, color: "#ffffff",
                  whiteSpace: "nowrap", flexShrink: 0
                }}>
                  {format(new Date(match.date), "d MMM", { locale: nl })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#ffffff", fontWeight: 700 }}>{match.opponent || match.agendaTitle}</p>
                  {(match.team || match.agendaTeam) && (
                    <span style={{ fontSize: "9px", fontWeight: 800, color: (match.team || match.agendaTeam) === "MO17" ? "#00C2FF" : "#FF3DA8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {match.team || match.agendaTeam}
                    </span>
                  )}
                </div>
                <div style={{
                  background: match.home_away === "Thuis" ? "rgba(8,208,104,0.20)" : "rgba(255,213,0,0.20)",
                  color: match.home_away === "Thuis" ? "#08D068" : "#FFD600",
                  padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 700, flexShrink: 0
                }}>
                  {match.home_away}
                </div>
                {childPlayerId && match.substitutes?.length > 0 && match.substitutes.includes(childPlayerId) && (
                  <div style={{
                    background: "#08D068", border: "1.5px solid rgba(255,255,255,0.30)",
                    color: "#ffffff", borderRadius: "20px", padding: "2px 8px",
                    fontSize: "10px", fontWeight: 800, flexShrink: 0
                  }}>
                    ✓ Geselecteerd
                  </div>
                )}
                {childPlayerId && match.substitutes?.length > 0 && !match.substitutes.includes(childPlayerId) && (
                  <div style={{
                    background: "rgba(255,61,168,0.20)", border: "1.5px solid rgba(255,255,255,0.20)",
                    color: "#FF3DA8", borderRadius: "20px", padding: "2px 8px",
                    fontSize: "10px", fontWeight: 800, flexShrink: 0
                  }}>
                    Niet geselecteerd
                  </div>
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
      {allPlayers.length > 0 && winningTeams.length > 0 && (
        <TrainerChampionsTrophy players={allPlayers} winningTeams={winningTeams} />
      )}

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