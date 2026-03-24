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

  if (todayMatch) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: "#FF6800", border: "1.5px solid #FF6800",
        borderRadius: "20px", padding: "4px 12px",
      }}>
        <i className="ti ti-trophy" style={{ fontSize: "13px", color: "#ffffff" }} />
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#ffffff" }}>Matchday</span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)" }}>vs {todayMatch.opponent}</span>
      </div>
    );
  }

  if (todaySession) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: "rgba(8,208,104,0.12)", border: "1.5px solid rgba(8,208,104,0.25)",
        borderRadius: "20px", padding: "4px 12px",
      }}>
        <i className="ti ti-clock" style={{ fontSize: "13px", color: "#05a050" }} />
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#05a050" }}>Training</span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px",
      background: "rgba(26,26,26,0.08)", border: "1.5px solid rgba(26,26,26,0.15)",
      borderRadius: "20px", padding: "4px 12px",
    }}>
      <i className="ti ti-moon" style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)" }} />
      <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.55)" }}>Rustdag</span>
    </div>
  );
}

export default function TopBar() {
  const { user, isTrainer, isSpeelster } = useCurrentUser();
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
  const firstName = user?.full_name?.split(" ")[0] || "trainer";
  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#ffffff",
      borderBottom: "2.5px solid #1a1a1a",
      height: "60px", overflow: "hidden",
    }}>
      <div style={{
        position: "relative", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "100%",
        padding: "0 16px", maxWidth: "1280px", margin: "0 auto",
      }}>
        {/* Links: logo + naam */}
        <Link to="/Dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#FFF3E8", border: "2.5px solid #1a1a1a",
            overflow: "hidden", flexShrink: 0,
          }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad40ab17517be2ed782cdd/f4c654af8_Artemis.png"
              alt="MVA Noord"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div className="hidden sm:block">
            <p style={{ fontSize: "15px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
              MVA Noord
            </p>
            <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.40)", marginTop: "1px", lineHeight: 1 }}>
              {greeting}, {firstName}
            </p>
          </div>
        </Link>

        {/* Midden: dag badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="hidden sm:flex">
          <DayBadge sessions={sessions} matches={matches} />
        </div>

        {/* Rechts: bell + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ position: "relative" }}>
            <button
              ref={bellRef}
              onClick={() => setShowNotifications(v => !v)}
              style={{
                position: "relative", width: "34px", height: "34px",
                borderRadius: "50%", background: "#ffffff",
                border: "2px solid #1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <i className="ti ti-bell" style={{ fontSize: "15px", color: "#1a1a1a" }} />
              {unreadNotifications.length > 0 && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#FF6800", border: "1.5px solid #ffffff",
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

          <AvatarMenu
            user={user}
            profilePhoto={profilePhoto}
            initials={initials}
            isTrainer={isTrainer}
            isSpeelster={isSpeelster}
          />
        </div>
      </div>
    </header>
  );
}