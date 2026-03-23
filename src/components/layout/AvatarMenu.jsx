import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/**
 * AvatarMenu – klikbare avatar met dropdown (desktop) of bottom sheet (mobiel).
 */
export default function AvatarMenu({ user, profilePhoto, initials, isTrainer, isSpeelster }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Sluit bij klik buiten component
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [open]);

  const isSpeelsterUser = !isTrainer && isSpeelster;

  const rolLabel = user?.role === "admin" ? "Admin" : isTrainer ? "Trainer" : "Speler";

  const profilePath = isSpeelsterUser
    ? "/PlayerDashboard"
    : isTrainer && user?.trainer_id
    ? `/TrainerDetail?id=${user.trainer_id}`
    : "/PlayerDashboard";

  function handleProfile() {
    setOpen(false);
    navigate(profilePath);
  }

  function handleLogout() {
    setOpen(false);
    base44.auth.logout();
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  // Bereken positie van de avatar knop voor dropdown plaatsing
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const avatarRef = useRef(null);

  function handleOpen() {
    if (!open && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
    }
    setOpen(v => !v);
  }

  const menuContent = (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px 10px" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FF6B00", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {profilePhoto
            ? <img src={profilePhoto} alt={user?.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{initials}</span>}
        </div>
        <div style={{ overflow: "hidden" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name || "—"}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{rolLabel}</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "0.5px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

      {/* Menu items */}
      <div style={{ padding: "6px" }}>
        <button
          onClick={handleProfile}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <i className="ti ti-user" style={{ fontSize: 16, color: "#FF8C3A" }} />
          <span style={{ fontSize: 13, color: "#fff" }}>Mijn profiel</span>
        </button>

        <button
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <i className="ti ti-logout" style={{ fontSize: 16, color: "rgba(248,113,113,0.70)" }} />
          <span style={{ fontSize: 13, color: "rgba(248,113,113,0.70)" }}>Uitloggen</span>
        </button>
      </div>
    </>
  );

  return (
    <div ref={containerRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Avatar knop */}
      <button
        ref={avatarRef}
        onClick={handleOpen}
        style={{ width: 32, height: 32, borderRadius: "50%", background: "#FF6B00", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: open ? "2px solid rgba(255,107,0,0.70)" : "2px solid transparent", cursor: "pointer", padding: 0 }}
      >
        {profilePhoto
          ? <img src={profilePhoto} alt={user?.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{initials}</span>}
      </button>

      {/* Render via portal zodat overflow:hidden van header geen probleem is */}
      {open && createPortal(
        <>
          {/* Desktop dropdown */}
          {!isMobile && (
            <div style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999, background: "rgba(20,10,2,0.95)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 16, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.40)", overflow: "hidden" }}>
              {menuContent}
            </div>
          )}

          {/* Mobile bottom sheet */}
          {isMobile && (
            <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
              <div
                onClick={() => setOpen(false)}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
              />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(20,10,2,0.95)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderTop: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", padding: "1rem 1.25rem 2rem", zIndex: 10000 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 12px" }} />
                {menuContent}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}