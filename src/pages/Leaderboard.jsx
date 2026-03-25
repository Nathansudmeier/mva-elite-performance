import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function Leaderboard() {
  const { data: winningTeams } = useQuery({
    queryKey: ["winningTeams"],
    queryFn: () => base44.entities.WinningTeam.list('-date', 100),
    initialData: [],
  });

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
    initialData: [],
  });

  // Bereken wins per speler
  const playerWins = {};
  winningTeams.forEach((team) => {
    team.winning_player_ids?.forEach((playerId) => {
      playerWins[playerId] = (playerWins[playerId] || 0) + 1;
    });
  });

  // Get recent winners (last 3 winning teams)
  const recentWinnerIds = new Set(
    winningTeams
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .flatMap((w) => w.winning_player_ids || [])
  );

  // Maak leaderboard met speler info
  const leaderboard = players
    .map((p) => ({
      ...p,
      wins: playerWins[p.id] || 0,
    }))
    .sort((a, b) => b.wins - a.wins)
    .filter((p) => p.wins > 0);

  const top3 = leaderboard.slice(0, 3);
  const ranked = leaderboard;

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "100px" }}>
      <h1 className="t-page-title" style={{ textAlign: "center", fontSize: "24px", marginTop: "8px" }}>Champions Trophy</h1>

      {/* PODIUM CARD */}
      {top3.length > 0 && (
        <div style={{ background: "#FFD600", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#FF6800", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="ti ti-trophy" style={{ fontSize: "20px", color: "#ffffff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2 }}>Podium Top 3</p>
              <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", fontWeight: 600, marginTop: "2px" }}>Seizoen 2025-26</p>
            </div>
          </div>

          {/* Podium */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "12px" }}>
            {podiumOrder.map((player, idx) => {
              const originalRank = top3.indexOf(player);
              const isCenter = idx === 1;
              const isHot = recentWinnerIds.has(player.id);

              const circleSize = isCenter ? 64 : 52;
              const circleBg = isCenter ? "#FF6800" : "#ffffff";
              const circleShadow = isCenter ? "3px 3px 0 #1a1a1a" : "2px 2px 0 #1a1a1a";

              return (
                <div key={player.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: isCenter ? "0 0 36%" : "0 0 28%" }}>
                  {isHot && <i className="ti ti-flame" style={{ fontSize: "14px", color: "#FF6800", marginBottom: "3px" }} />}

                  {/* Avatar circle */}
                  <div style={{
                    width: circleSize,
                    height: circleSize,
                    borderRadius: "50%",
                    border: "2.5px solid #1a1a1a",
                    boxShadow: circleShadow,
                    background: player.photo_url ? "transparent" : circleBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    fontSize: isCenter ? 20 : 16,
                    fontWeight: 900,
                    color: isCenter ? "#ffffff" : "#1a1a1a",
                  }}>
                    {player.photo_url
                      ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : player.name?.charAt(0)}
                  </div>

                  {/* Name */}
                  <p style={{ fontSize: isCenter ? 12 : 11, fontWeight: 800, color: "#1a1a1a", marginTop: "8px", textAlign: "center" }}>
                    {player.name?.split(" ")[0]}
                  </p>

                  {/* Wins */}
                  <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(26,26,26,0.55)", marginTop: "2px" }}>
                    {player.wins} win{player.wins !== 1 ? "s" : ""}
                  </p>

                  {/* Position badge */}
                  <div style={{
                    marginTop: "6px",
                    background: circleBg,
                    color: "#1a1a1a",
                    border: "1.5px solid #1a1a1a",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    fontSize: "10px",
                    fontWeight: 900,
                    boxShadow: isCenter ? "2px 2px 0 #1a1a1a" : "none",
                  }}>
                    #{originalRank + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1.5px solid rgba(26,26,26,0.15)", margin: "0.75rem 0" }} />

          {/* Rank 4+ list */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ranked.slice(3, 8).map((player, i) => {
              const isHot = recentWinnerIds.has(player.id);
              return (
                <div key={player.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 0",
                  borderBottom: i < ranked.slice(3, 8).length - 1 ? "1px solid rgba(26,26,26,0.10)" : "none",
                }}>
                  <span style={{ fontSize: "12px", fontWeight: 900, color: "rgba(26,26,26,0.40)", width: "20px", flexShrink: 0 }}>
                    #{i + 4}
                  </span>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    border: "1.5px solid #1a1a1a",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    flexShrink: 0,
                  }}>
                    {player.photo_url
                      ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : player.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", flex: 1 }}>
                    {player.name?.split(" ")[0]} {isHot && <i className="ti ti-flame" style={{ fontSize: "12px", color: "#FF6800", marginLeft: "4px" }} />}
                  </span>
                  <div style={{
                    background: "#ffffff",
                    border: "1.5px solid #1a1a1a",
                    borderRadius: "20px",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#1a1a1a",
                  }}>
                    {player.wins}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VOLLEDIGE RANKING */}
      <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
        <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a", marginBottom: "12px" }}>Volledige Ranking</p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ranked.map((player, i) => {
            const isHot = recentWinnerIds.has(player.id);
            return (
              <div key={player.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < ranked.length - 1 ? "1.5px solid rgba(26,26,26,0.07)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#FF6800", width: "28px", flexShrink: 0, textAlign: "center" }}>
                    #{i + 1}
                  </span>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    border: "2px solid #1a1a1a",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    flexShrink: 0,
                  }}>
                    {player.photo_url
                      ? <img src={player.photo_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : player.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>
                    {player.name} {isHot && <i className="ti ti-flame" style={{ fontSize: "12px", color: "#FF6800", marginLeft: "4px" }} />}
                  </span>
                </div>
                <div style={{
                  background: "#FF6800",
                  border: "2px solid #1a1a1a",
                  borderRadius: "12px",
                  padding: "4px 10px",
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "#ffffff",
                  boxShadow: "2px 2px 0 #1a1a1a",
                  flexShrink: 0,
                }}>
                  {player.wins}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENTE WINNENDE TEAMS */}
      {winningTeams.length > 0 && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a", marginBottom: "12px" }}>Recente Winnende Teams</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }} className="mobile-grid-1col">
            {winningTeams.slice(0, 6).map((team) => (
              <div key={team.id} style={{ borderRadius: "14px", overflow: "hidden", border: "2.5px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a", background: "#ffffff" }}>
                {team.photo_url && <img src={team.photo_url} alt="Winning team" style={{ width: "100%", height: "120px", objectFit: "cover" }} />}
                <div style={{ padding: "10px 12px", background: "#ffffff" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a1a" }}>{format(new Date(team.date), "d MMM yyyy", { locale: nl })}</p>
                  <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.55)", marginTop: "3px", fontWeight: 600 }}>{team.winning_player_ids.length} spelers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaderboard.length === 0 && (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "2rem", textAlign: "center" }}>
          <i className="ti ti-trophy" style={{ fontSize: "36px", color: "rgba(26,26,26,0.15)", marginBottom: "12px", display: "block" }} />
          <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.45)", fontWeight: 600 }}>Nog geen winnaars geregistreerd</p>
        </div>
      )}
    </div>
  );
}