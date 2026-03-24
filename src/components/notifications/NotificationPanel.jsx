import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const TYPE_ICONS = {
  activiteit: { icon: "ti-calendar", color: "#08D068" },
  afmelding:  { icon: "ti-circle-x", color: "#FF3DA8" },
  herinnering:{ icon: "ti-clock",    color: "#FFD600" },
  opstelling: { icon: "ti-layout-distribute-vertical", color: "#00C2FF" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: nl });
  } catch { return ""; }
}

export default function NotificationPanel({ userEmail, onClose, anchorRef }) {
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

  useEffect(() => {
    const handler = (e) => {
      const inPanel = panelRef.current?.contains(e.target);
      const inAnchor = anchorRef?.current?.contains(e.target);
      if (!inPanel && !inAnchor) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose, anchorRef]);

  const handleNotificationClick = (n) => {
    if (!n.is_read) markReadMutation.mutate(n.id);
    if (n.link) navigate(n.link);
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const isMobile = window.innerWidth < 768;

  let dropdownStyle = {};
  if (!isMobile && anchorRef?.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    dropdownStyle = {
      position: "fixed",
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      width: 360,
      borderRadius: 18,
    };
  } else {
    dropdownStyle = {
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      borderRadius: "22px 22px 0 0",
    };
  }

  const panel = (
    <>
      {isMobile && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(26,26,26,0.40)" }}
          onClick={onClose}
        />
      )}

      <div
        ref={panelRef}
        style={{
          ...dropdownStyle,
          zIndex: 9999,
          background: "#ffffff",
          border: "2.5px solid #1a1a1a",
          boxShadow: "3px 3px 0 #1a1a1a",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle (mobile) */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#1a1a1a" }} />
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>Notificaties</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: "#ffffff", background: "#FF6800", borderRadius: 10, padding: "2px 7px", border: "1.5px solid #1a1a1a" }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              style={{ fontSize: 12, color: "#FF6800", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
            >
              Alles gelezen
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: "1.5px", background: "rgba(26,26,26,0.08)", margin: "0 16px" }} />

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {notifications.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 12 }}>
              <i className="ti ti-bell" style={{ fontSize: 32, color: "rgba(26,26,26,0.20)" }} />
              <p style={{ fontSize: 13, color: "rgba(26,26,26,0.40)", textAlign: "center" }}>Geen notificaties</p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = TYPE_ICONS[n.type] || TYPE_ICONS.activiteit;
              return (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 16px",
                    background: n.is_read ? "transparent" : "rgba(255,104,0,0.04)",
                    borderLeft: n.is_read ? "3px solid transparent" : "3px solid #FF6800",
                    border: "none", borderBottom: "1.5px solid rgba(26,26,26,0.06)",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: `${cfg.color}18`, border: `1.5px solid ${cfg.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={`ti ${cfg.icon}`} style={{ fontSize: 16, color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{n.title}</p>
                      {!n.is_read && (
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF6800", flexShrink: 0 }} />
                      )}
                    </div>
                    {n.body && (
                      <p style={{ fontSize: 12, color: "rgba(26,26,26,0.55)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</p>
                    )}
                    <p style={{ fontSize: 10, color: "rgba(26,26,26,0.35)", marginTop: 4, fontWeight: 600 }}>{timeAgo(n.created_date)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {isMobile && <div style={{ height: 24 }} />}
      </div>
    </>
  );

  return createPortal(panel, document.body);
}