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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255,107,0,0.15)",
          border: "0.5px solid rgba(255,107,0,0.30)",
          borderRadius: "20px",
          padding: "6px 14px",
        }}
      >
        <i className="ti ti-trophy" style={{ fontSize: "14px", color: "#FF8C3A" }} />
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#FF8C3A", lineHeight: 1 }}>Matchday</p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px", lineHeight: 1 }}>
            vs {todayMatch.opponent}
          </p>
        </div>
      </div>
    );
  }

  if (todaySession) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(74,222,128,0.10)",
          border: "0.5px solid rgba(74,222,128,0.20)",
          borderRadius: "20px",
          padding: "6px 14px",
        }}
      >
        <i className="ti ti-clock" style={{ fontSize: "14px", color: "#4ade80" }} />
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80", lineHeight: 1 }}>Training</p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px", lineHeight: 1 }}>
            {todaySession.notes || "Vandaag ingepland"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(96,165,250,0.10)",
        border: "0.5px solid rgba(96,165,250,0.20)",
        borderRadius: "20px",
        padding: "6px 14px",
      }}
    >
      <i className="ti ti-moon" style={{ fontSize: "14px", color: "#60a5fa" }} />
      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", lineHeight: 1 }}>Rustdag</p>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px", lineHeight: 1 }}>
          Geen training of wedstrijd
        </p>
      </div>
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
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(0,0,0,0.30)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        borderBottom: "0.5px solid rgba(255,107,0,0.15)",
        height: "60px",
        overflow: "hidden",
      }}
    >
      {/* Decoratieve lichtbollen */}
      <div
        style={{
          position: "absolute",
          pointerEvents: "none",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(255,107,0,0.25) 0%, transparent 65%)",
          top: "-80px",
          left: "-40px",
        }}
      />
      <div
        style={{
          position: "absolute",
          pointerEvents: "none",
          width: "150px",
          height: "150px",
          background: "radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 65%)",
          top: "-60px",
          right: "200px",
        }}
      />
      {/* Accent lijn onderaan */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.40), rgba(255,107,0,0.20), transparent)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          padding: "0 16px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        {/* Links: logo + naam */}
        <Link to="/Dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#1a1008",
              border: "1px solid rgba(255,107,0,0.35)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad40ab17517be2ed782cdd/f4c654af8_Artemis.png"
              alt="MVA Noord"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div className="hidden sm:block">
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
              MVA Noord
            </p>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)", marginTop: "2px", lineHeight: 1 }}>
              {greeting}, {firstName}
            </p>
          </div>
        </Link>

        {/* Midden: scheidingslijn + dag badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="hidden sm:flex">
          <div style={{ width: "0.5px", height: "28px", background: "rgba(255,255,255,0.10)" }} />
          <DayBadge sessions={sessions} matches={matches} />
        </div>

        {/* Rechts: bell + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Notificatie bell */}
          <div style={{ position: "relative" }}>
            <button
              ref={bellRef}
              onClick={() => setShowNotifications(v => !v)}
              style={{
                position: "relative",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: showNotifications ? "rgba(255,107,0,0.15)" : "rgba(255,255,255,0.07)",
                border: showNotifications ? "0.5px solid rgba(255,107,0,0.30)" : "0.5px solid rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <i className="ti ti-bell" style={{ fontSize: "14px", color: showNotifications ? "#FF8C3A" : "rgba(255,255,255,0.55)" }} />
              {unreadNotifications.length > 0 && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#FF6B00", border: "1.5px solid #1c0e04",
                }} />
              )}
            </button>
            {showNotifications && user?.email && (
              <NotificationPanel
                userEmail={user.email}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* Avatar met dropdown */}
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