import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { base44 as b44 } from "@/api/base44Client";
import IOSInstallBanner from "@/components/common/IOSInstallBanner";
import TopBar from "@/components/layout/TopBar";
// Tabler Icons zijn nu beschikbaar via CDN

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
  { name: "Agenda", icon: "calendar", page: "Agenda" },
  { name: "Trainingen", icon: "list-check", page: "Trainingen" },
  { name: "Spelers", icon: "users", page: "Players" },
  { name: "Staff", icon: "user-cog", page: "Staff" },
  { name: "Wedstrijden", icon: "trophy", page: "Wedstrijden" },
  { name: "Berichten", icon: "message-circle", page: "Messages" },
];

const secondaryNavItems = [
  { name: "Spelprincipes", icon: "grid-dots", page: "Spelprincipes" },
  { name: "Beheer", icon: "settings", page: "AccountBeheer" },
];

function NavLink({ item, currentPageName, onClick, variant = "desktop" }) {
  const isActive = currentPageName === item.page;
  const iconColor = isActive ? "#FF8C3A" : "rgba(255,255,255,0.40)";

  if (variant === "mobile-tab") {
    return (
      <Link
        key={item.page}
        to={createPageUrl(item.page)}
        onClick={onClick}
        className="flex flex-col items-center justify-center py-3 px-2 transition-colors"
      >
        <i
          className={`ti ti-${item.icon}`}
          style={{ fontSize: "22px", color: iconColor }}
        />
        <span className={`text-[11px] mt-1 font-semibold ${isActive ? "t-nav-active" : "t-nav-inactive"}`}
          style={{ color: isActive ? "#FF8C3A" : "rgba(255,255,255,0.50)" }}>
          {item.name}
        </span>
      </Link>
    );
  }

  return (
    <Link
      key={item.page}
      to={createPageUrl(item.page)}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-200`}
      style={{
        color: isActive ? "#FF8C3A" : "rgba(255,255,255,0.50)",
        background: isActive ? "rgba(255,107,0,0.15)" : "transparent",
        border: isActive ? "0.5px solid rgba(255,107,0,0.20)" : "0.5px solid transparent",
        borderRadius: "10px",
      }}
    >
      <i
        className={`ti ti-${item.icon}`}
        style={{ fontSize: "20px", color: iconColor }}
      />
      {item.name}
    </Link>
  );
}

function DeveloperGroup({ currentPageName, onItemClick }) {
  const isAnyActive = desenvolvidoItems.some(item => item.page === currentPageName);
  const [open, setOpen] = useState(isAnyActive);
  const iconColor = isAnyActive ? "#FF8C3A" : "rgba(255,255,255,0.40)";

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold transition-all duration-200"
        style={{
          color: isAnyActive ? "#FF8C3A" : "rgba(255,255,255,0.50)",
          background: isAnyActive ? "rgba(255,107,0,0.15)" : "transparent",
          border: isAnyActive ? "0.5px solid rgba(255,107,0,0.20)" : "0.5px solid transparent",
          borderRadius: "10px",
        }}
      >
        <div className="flex items-center gap-3">
          <i
            className="ti ti-trending-up"
            style={{ fontSize: "20px", color: iconColor }}
          />
          Ontwikkeling
        </div>
        <i
          className={`ti ti-chevron-down transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ fontSize: "16px", color: iconColor }}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#FF8C3A]/40 pl-4">
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
  const [meerOpen, setMeerOpen] = useState(false);
  const { user, isTrainer, isSpeelster } = useCurrentUser();
  const isSpeelsterUser = !isTrainer && isSpeelster;



  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1c0e04" }}>
      <IOSInstallBanner />

      {/* Top bar */}
      <TopBar />

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-[60px] bottom-0 w-56 flex-col z-40 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.38)", borderRight: "0.5px solid rgba(255,255,255,0.07)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)" }}>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {isSpeelsterUser ? (
            <>
              <NavLink item={{ name: "Dashboard", icon: "layout-grid", page: "Dashboard" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Agenda", icon: "calendar", page: "Agenda" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Trainingen", icon: "list-check", page: "Trainingen" }} currentPageName={currentPageName} />
              <NavLink item={{ name: "Wedstrijden", icon: "trophy", page: "Wedstrijden" }} currentPageName={currentPageName} />
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
        <div className="px-3 pb-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm w-full transition-colors"
            style={{ color: "rgba(248,113,113,0.65)" }}
          >
            <i className="ti ti-logout" style={{ fontSize: "20px", color: "rgba(248,113,113,0.65)" }} />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full pt-[60px] px-3 overflow-y-auto" style={{ backgroundColor: "rgba(28,14,4,0.97)", borderRight: "1px solid rgba(255,107,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {isSpeelsterUser ? (
                <>
                  <NavLink item={{ name: "Dashboard", icon: "layout-grid", page: "Dashboard" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Agenda", icon: "calendar", page: "Agenda" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Trainingen", icon: "list-check", page: "Trainingen" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={{ name: "Wedstrijden", icon: "trophy", page: "Wedstrijden" }} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
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
      <main className="lg:pl-56 pb-20 lg:pb-0 relative min-h-screen overflow-hidden">
        {/* Light orbs background layer */}
        <div className="pointer-events-none" style={{ position: "fixed", top: "64px", left: 0, right: 0, bottom: 0, zIndex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,107,0,0.55)", top: -160, left: -100, filter: "blur(80px)" }} />
          <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,150,0,0.30)", top: 380, right: -80, filter: "blur(70px)" }} />
          <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,107,0,0.20)", bottom: 100, left: -40, filter: "blur(60px)" }} />
        </div>
        <div className="relative p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" style={{ zIndex: 2 }}>
          {children}
        </div>
      </main>

      {/* New Tab Bar */}
      {(() => {
        const trainerTabItems = [
          { name: "Dashboard", icon: "layout-dashboard", page: "Dashboard" },
          { name: "Agenda", icon: "calendar", page: "Agenda" },
          { name: "Trainingen", icon: "clipboard-list", page: "Trainingen" },
          { name: "Wedstrijden", icon: "trophy", page: "Wedstrijden" },
          { name: "Spelers", icon: "users", page: "Players" },
          { name: "Staff", icon: "user-cog", page: "Staff" },
          { name: "Berichten", icon: "message-circle", page: "Messages" },
          { name: "Beheer", icon: "settings", page: "AccountBeheer" },
          { name: "Leaderboard", icon: "trophy", page: "Leaderboard" },
        ];
        
        const speelsterTabItems = [
          { name: "Dashboard", icon: "layout-dashboard", page: "Dashboard" },
          { name: "Agenda", icon: "calendar", page: "Agenda" },
          { name: "Trainingen", icon: "clipboard-list", page: "Trainingen" },
          { name: "Wedstrijden", icon: "trophy", page: "Wedstrijden" },
          { name: "Spelprincipes", icon: "presentation", page: "Spelprincipes" },
        ];
        
        const tabItems = isSpeelsterUser ? speelsterTabItems : trainerTabItems;
        
        return (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]" style={{ backgroundColor: "rgba(15,7,2,0.20)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", padding: "8px 8px 20px" }}>
            {/* Orange gradient accent line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.60), transparent)" }} />

            <div className="overflow-x-auto" style={{ scrollBehavior: "smooth" }}>
              <div style={{ display: "flex", gap: "6px", minWidth: "min-content", paddingRight: "8px" }}>
                {tabItems.map((item) => {
                  const isActive = item.page === currentPageName;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "6px 8px", borderRadius: "12px", textDecoration: "none", background: isActive ? "rgba(255,107,0,0.15)" : "transparent", border: isActive ? "0.5px solid rgba(255,107,0,0.25)" : "none", transition: "all 0.15s ease", flexShrink: 0 }}
                    >
                      {isActive && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#FF6B00", marginBottom: "2px" }} />}
                      <i className={`ti ti-${item.icon}`} style={{ fontSize: "22px", stroke: isActive ? "#FF8C3A" : "rgba(255,255,255,0.35)", strokeWidth: 1.5, color: isActive ? "#FF8C3A" : "rgba(255,255,255,0.35)" }} />
                      <span style={{ fontSize: "10px", color: isActive ? "#FF8C3A" : "rgba(255,255,255,0.35)", fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        );
      })()}
    </div>
  );
}