import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function PendingAccess() {
  const { user } = useCurrentUser();

  const { data: matches = [] } = useQuery({
    queryKey: ["upcomingMatches-public"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  // Filter upcoming matches only
  const today = new Date().toISOString().split("T")[0];
  const upcomingMatches = matches
    .filter(m => m.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="pb-20 xl:pb-8" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Welcome message */}
      <div style={{
        background: "#FFD600",
        border: "2.5px solid #1a1a1a",
        borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a",
        padding: "20px",
        textAlign: "center"
      }}>
        <p style={{ fontSize: "13px", fontWeight: 800, color: "rgba(26,26,26,0.60)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Welkom {user?.full_name?.split(" ")[0]}
        </p>
        <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#1a1a1a", marginBottom: "12px" }}>
          Wachten op toegang
        </h1>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(26,26,26,0.60)", lineHeight: 1.5 }}>
          De beheerder verleent je binnenkort toegang tot je profiel. In de tussentijd kun je al de komende wedstrijden bekijken.
        </p>
      </div>

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <div style={{
          background: "#1a1a1a",
          border: "2.5px solid #1a1a1a",
          borderRadius: "18px",
          boxShadow: "3px 3px 0 #1a1a1a",
          padding: "16px"
        }}>
          <p className="t-label" style={{ color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>Komende wedstrijden</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {upcomingMatches.map((match) => (
              <div key={match.id} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "12px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px"
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>
                    {match.opponent}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
                    {format(new Date(match.date), "d MMMM HH:mm", { locale: nl })}
                  </p>
                </div>
                <div style={{
                  background: match.home_away === "Thuis" ? "rgba(8,208,104,0.20)" : "rgba(255,213,0,0.20)",
                  color: match.home_away === "Thuis" ? "#08D068" : "#FFD600",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: 700,
                  whiteSpace: "nowrap"
                }}>
                  {match.home_away}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {upcomingMatches.length === 0 && (
        <div style={{
          background: "#ffffff",
          border: "2.5px solid #1a1a1a",
          borderRadius: "18px",
          boxShadow: "3px 3px 0 #1a1a1a",
          padding: "32px 20px",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(26,26,26,0.50)" }}>
            Er staan momenteel geen wedstrijden gepland.
          </p>
        </div>
      )}
    </div>
  );
}