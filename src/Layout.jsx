import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import IOSInstallBanner from "@/components/common/IOSInstallBanner";
import TopBar from "@/components/layout/TopBar";
import BentoTabBar from "@/components/layout/BentoTabBar";

const desenvolvidoItems = [
  { name: "Fysiek", icon: "activity", page: "PhysicalMonitor" },
  { name: "Beoordeling", icon: "list-check", page: "PlayerRatingForm" },
  { name: "Reflectie", icon: "message", page: "SelfReflection" },
  { name: "Rapporten", icon: "trending-up", page: "Reports" },
  { name: "Speelminuten", icon: "activity", page: "Speelminuten" },
  { name: "Mijn reflecties", icon: "notebook", page: "MijnReflecties" },
];

const mainNavItems = [
  { name: "Dashboard", icon: "layout-grid", page: "Dashboard" },
  { name: "Planning", icon: "calendar", page: "Planning" },
  { name: "Spelers", icon: "users", page: "Players" },
  { name: "Staff", icon: "user-cog", page: "Staff" },
  { name: "Berichten", icon: "message-circle", page: "Messages" },
  { name: "Trainingsvormen", icon: "ball-football", page: "Trainingsvormen" },
];

const secondaryNavItems = [
  { name: "Prikbord", icon: "pin", page: "Prikbord" },
  { name: "Spelprincipes", icon: "grid-dots", page: "Spelprincipes" },
  { name: "Foto's", icon: "photo", page: "Photowall" },
  { name: "Feedback", icon: "message-2", page: "FeedbackOverview" },
  { name: "Beheer", icon: "settings", page: "AccountBeheer" },
];

function NavLink({ item, currentPageName, onClick, variant = "desktop" }) {
  const isActive = currentPageName === item.page;

  return (
    <Link
      key={item.page}
      to={createPageUrl(item.page)}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "9px 12px", borderRadius: "12px",
        textDecoration: "none", fontSize: "14px", fontWeight: isActive ? 800 : 500,
        color: isActive ? "#ffffff" : "rgba(26,26,26,0.55)",
        background: isActive ? "#FF6800" : "transparent",
        transition: "all 0.15s ease",
      }}
    >
      <i className={`ti ti-${item.icon}`} style={{ fontSize: "18px", color: isActive ? "#ffffff" : "rgba(26,26,26,0.40)" }} />
      {item.name}
    </Link>
  );
}

function DeveloperGroup({ currentPageName, onItemClick }) {
  const isAnyActive = desenvolvidoItems.some(item => item.page === currentPageName);
  const [open, setOpen] = useState(isAnyActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "9px 12px", borderRadius: "12px",
          background: isAnyActive ? "#FF6800" : "transparent",
          border: "none", cursor: "pointer", fontSize: "14px",
          fontWeight: isAnyActive ? 800 : 500,
          color: isAnyActive ? "#ffffff" : "rgba(26,26,26,0.55)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="ti ti-trending-up" style={{ fontSize: "18px", color: isAnyActive ? "#ffffff" : "rgba(26,26,26,0.40)" }} />
          Ontwikkeling
        </div>
        <i className={`ti ti-chevron-down`} style={{
          fontSize: "14px", color: isAnyActive ? "#ffffff" : "rgba(26,26,26,0.40)",
          transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s",
        }} />
      </button>
      {open && (
        <div style={{ marginLeft: "16px", marginTop: "4px", paddingLeft: "12px", borderLeft: "2px solid rgba(26,26,26,0.12)" }}>
          {desenvolvidoItems.map((item) => (
            <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isTrainer, isSpeelster, isOuder, playerId: childPlayerId } = useCurrentUser();
  const isSpeelsterUser = !isTrainer && isSpeelster;
  const isOuderUser = isOuder;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "transparent" }}>
      <IOSInstallBanner />
      <TopBar />

      {/* Sidebar desktop */}
      <aside className="hidden xl:flex fixed left-0 top-[60px] bottom-0 w-56 flex-col z-40 overflow-y-auto"
        style={{ background: "#ffffff", borderRight: "2.5px solid #1a1a1a" }}>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {isOuderUser ? (
            <>
              <NavLink item={{ name: "Dashboard", icon: "layout-grid", page: "Dashboard" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Foto's", icon: "photo", page: "Photowall" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Berichten", icon: "message-circle", page: "Messages" }} currentPageName={currentPageName} />
            </>
          ) : isSpeelsterUser ? (
            <>
              <NavLink item={{ name: "Dashboard", icon: "layout-grid", page: "Dashboard" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Planning", icon: "calendar", page: "Planning" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Foto's", icon: "photo", page: "Photowall" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Spelprincipes", icon: "grid-dots", page: "Spelprincipes" }} currentPageName={currentPageName} />
              <DeveloperGroup currentPageName={currentPageName} />
            </>
          ) : (
            <>
              {mainNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} />)}
              <DeveloperGroup currentPageName={currentPageName} />
              {secondaryNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} />)}
            </>
          )}
        </nav>
        <div style={{ borderTop: "2px solid rgba(26,26,26,0.10)", padding: "12px" }}>
          <button
            onClick={() => base44.auth.logout()}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px", borderRadius: "12px",
              background: "transparent", border: "2px solid #FF3DA8",
              color: "#FF3DA8", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", width: "100%",
            }}
          >
            <i className="ti ti-logout" style={{ fontSize: "16px", color: "#FF3DA8" }} />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div style={{ width: "260px", height: "100%", paddingTop: "60px", paddingLeft: "12px", paddingRight: "12px", paddingBottom: "12px", overflowY: "auto", background: "#ffffff", borderRight: "2.5px solid #1a1a1a" }}
            onClick={(e) => e.stopPropagation()}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {isOuderUser ? (
                <>
                  <NavLink item={{ name: "Dashboard", icon: "layout-grid", page: "Dashboard" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Foto's", icon: "photo", page: "Photowall" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Berichten", icon: "message-circle", page: "Messages" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                </>
              ) : isSpeelsterUser ? (
                <>
                  <NavLink item={{ name: "Dashboard", icon: "layout-grid", page: "Dashboard" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Planning", icon: "calendar", page: "Planning" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Foto's", icon: "photo", page: "Photowall" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Spelprincipes", icon: "grid-dots", page: "Spelprincipes" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <DeveloperGroup currentPageName={currentPageName} onItemClick={() => setMobileOpen(false)} />
                </>
              ) : (
                <>
                  {mainNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />)}
                  <DeveloperGroup currentPageName={currentPageName} onItemClick={() => setMobileOpen(false)} />
                  {secondaryNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />)}
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="xl:pl-56 pb-28 xl:pb-8 relative min-h-screen">
        <div className="relative p-4 md:p-6 xl:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Tab Bar - Bento Bold */}
      <BentoTabBar currentPageName={currentPageName} isSpeelsterUser={isSpeelsterUser} isOuderUser={isOuderUser} childPlayerId={childPlayerId} onNavigate={() => setMobileOpen(false)} />
    </div>
  );
}