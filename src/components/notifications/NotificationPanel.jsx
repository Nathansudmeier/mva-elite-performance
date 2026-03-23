import React, { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const TYPE_ICONS = {
  activiteit: { icon: "ti-calendar", color: "#4ade80" },
  afmelding:  { icon: "ti-circle-x", color: "#f87171" },
  herinnering:{ icon: "ti-clock",    color: "#fbbf24" },
  opstelling: { icon: "ti-layout-distribute-vertical", color: "#60a5fa" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: nl });
  } catch { return ""; }
}

export default function NotificationPanel({ userEmail, onClose }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const panelRef = useRef();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, "-created_date", 50),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userEmail] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userEmail] }),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose]);

  const handleNotificationClick = (n) => {
    if (!n.is_read) markReadMutation.mutate(n.id);
    if (n.link) navigate(n.link);
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed z-50 md:absolute"
        style={{
          // Mobile: bottom sheet
          bottom: 0,
          left: 0,
          right: 0,
          // Desktop: dropdown
          ...(window.innerWidth >= 768 ? {
            bottom: "auto",
            left: "auto",
            right: 0,
            top: "calc(100% + 8px)",
            width: 360,
          } : {}),
          background: "rgba(20,10,3,0.96)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "0.5px solid rgba(255,255,255,0.12)",
          borderRadius: window.innerWidth >= 768 ? "16px" : "24px 24px 0 0",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.20)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Notificaties</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#FF6B00", borderRadius: 10, padding: "1px 6px" }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              style={{ fontSize: 12, color: "#FF8C3A", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Alles gelezen
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {notifications.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 12 }}>
              <i className="ti ti-bell" style={{ fontSize: 32, color: "rgba(255,255,255,0.20)" }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>Geen notificaties</p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = TYPE_ICONS[n.type] || TYPE_ICONS.activiteit;
              return (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    background: n.is_read ? "transparent" : "rgba(255,107,0,0.08)",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: `${cfg.color}18`,
                    border: `0.5px solid ${cfg.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={`ti ${cfg.icon}`} style={{ fontSize: 16, color: cfg.color }} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>{n.title}</p>
                      {!n.is_read && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6B00", flexShrink: 0 }} />
                      )}
                    </div>
                    {n.body && (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</p>
                    )}
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{timeAgo(n.created_date)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Mobile bottom padding */}
        <div className="md:hidden" style={{ height: 20 }} />
      </div>
    </>
  );
}