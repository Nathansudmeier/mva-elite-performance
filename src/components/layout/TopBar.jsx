import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { base44 } from "@/api/base44Client";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import AvatarMenu from "@/components/layout/AvatarMenu";

function useGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Goedemorgen";
  if (h < 18) return "Goedemiddag";
  return "Goedenavond";
}

function DayBadge({ sessions, matches }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayMatch = matches?.find(m => m.date === today);
  const todaySession = sessions?.find(s => s.date === today);

  const pillStyle = {
    background: "#ffffff",
    border: "2px solid #1a1a1a",
    borderRadius: "20px",
    padding: "6px 14px",
    boxShadow: "2px 2px 0 #1a1a1a",
    display: "flex", alignItems: "center", gap: "6px",
  };

  if (todayMatch) {
    return (
      <div style={pillStyle}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a1a1a" }}>Matchday</span>
      </div>
    );
  }

  if (todaySession) {
    return (
      <div style={pillStyle}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a1a1a" }}>
          Training vandaag · {todaySession.start_time || ""}
        </span>
      </div>
    );
  }

  return (
    <div style={pillStyle}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a1a1a" }}>Rustdag</span>
    </div>
  );
}

export default function TopBar() {
  const { user, isTrainer, isSpeelster, isOuder } = useCurrentUser();
  const greeting = useGreeting();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email, is_read: false }),
    enabled: !!user?.email,
    refetchInterval: 60000,
  });

  const { data: trainerRecord } = useQuery({
    queryKey: ["trainer-topbar", user?.trainer_id],
    queryFn: () => base44.entities.Trainer.filter({ id: user.trainer_id }),
    enabled: !!user?.trainer_id,
    select: (data) => data[0],
  });

  const { data: playerRecord } = useQuery({
    queryKey: ["player-topbar", user?.player_id],
    queryFn: async () => {
      const results = await base44.entities.Player.list();
      return results.find(p => p.id === user.player_id) || null;
    },
    enabled: !!user?.player_id,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["topbar-sessions"],
    queryFn: () => base44.entities.TrainingSession.list(),
    staleTime: 60000,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["topbar-matches"],
    queryFn: () => base44.entities.Match.list(),
    staleTime: 60000,
  });

  const profilePhoto = trainerRecord?.photo_url || playerRecord?.photo_url || null;
  const firstName = user?.full_name?.split(" ")[0] || "";
  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#FF6800",
      borderBottom: "2.5px solid #1a1a1a",
      padding: "0.75rem 1rem",
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "1280px", margin: "0 auto",
      }}>
        {/* Links: club logo */}
        <Link to={isOuder ? "/OuderDashboard" : "/Dashboard"} style={{ textDecoration: "none" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,255,255,0.20)", border: "2px solid #ffffff",
            overflow: "hidden", flexShrink: 0,
          }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad40ab17517be2ed782cdd/f4c654af8_Artemis.png"
              alt="MVA Noord"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </Link>

        {/* Midden: dag badge */}
        <DayBadge sessions={sessions} matches={matches} />

        {/* Rechts: bell + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button
              ref={bellRef}
              onClick={() => setShowNotifications(v => !v)}
              style={{
                position: "relative", width: "34px", height: "34px",
                borderRadius: "50%", background: "rgba(255,255,255,0.20)",
                border: "2px solid #ffffff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifications.length > 0 && (
                <div style={{
                  position: "absolute", top: "-2px", right: "-2px",
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: "#FFD600", border: "2px solid #FF6800",
                }} />
              )}
            </button>
            {showNotifications && user?.email && (
              <NotificationPanel
                userEmail={user.email}
                onClose={() => setShowNotifications(false)}
                anchorRef={bellRef}
              />
            )}
          </div>

          {/* Avatar */}
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            border: "2.5px solid #ffffff",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.20)",
            overflow: "hidden", flexShrink: 0,
            background: profilePhoto ? "transparent" : "#FFD600",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {profilePhoto ? (
              <img src={profilePhoto} alt={firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#1a1a1a" }}>{initials}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}