import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { base44 as b44 } from "@/api/base44Client";
import IOSInstallBanner from "@/components/common/IOSInstallBanner";
// Tabler Icons zijn nu beschikbaar via CDN

const desenvolvidoItems = [
  { name: "Fysiek", icon: "activity", page: "PhysicalMonitor" },
  { name: "Beoordeling", icon: "list-check", page: "PlayerRatingForm" },
  { name: "Reflectie", icon: "message", page: "SelfReflection" },
  { name: "Rapporten", icon: "trending-up", page: "Reports" },
  { name: "Speelminuten", icon: "activity", page: "Speelminuten" },
];

const mainNavItems = [
  { name: "Dashboard", icon: "layout-grid", page: "Dashboard" },
  { name: "Trainingen", icon: "list-check", page: "Trainingen" },
  { name: "Spelers", icon: "users", page: "Players" },
  { name: "Staff", icon: "user-cog", page: "Staff" },
  { name: "Wedstrijden", icon: "trophy", page: "Wedstrijden" },
];

const secondaryNavItems = [
  { name: "Spelprincipes", icon: "grid-dots", page: "Spelprincipes" },
  { name: "Instellingen", icon: "settings", page: "AccountBeheer" },
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200`}
      style={{
        color: isActive ? "#FF8C3A" : "rgba(255,255,255,0.50)",
        background: isActive ? "rgba(255,140,58,0.12)" : "transparent",
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
        className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200"
        style={{
          color: isAnyActive ? "#FF8C3A" : "rgba(255,255,255,0.50)",
          background: isAnyActive ? "rgba(255,140,58,0.12)" : "transparent",
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
  const { user, isTrainer, isSpeelster } = useCurrentUser();
  const isSpeelsterUser = !isTrainer && isSpeelster;

  // Fetch linked profile photo
  const { data: trainerRecord } = useQuery({
    queryKey: ["trainer", user?.trainer_id],
    queryFn: () => b44.entities.Trainer.filter({ id: user.trainer_id }),
    enabled: !!user?.trainer_id,
    select: (data) => data[0],
  });
  const { data: playerRecord } = useQuery({
    queryKey: ["player-layout", user?.player_id],
    queryFn: async () => {
      const results = await b44.entities.Player.list();
      return results.find(p => p.id === user.player_id) || null;
    },
    enabled: !!user?.player_id,
  });
  const profilePhoto = trainerRecord?.photo_url || playerRecord?.photo_url || null;


  const profileLink = isSpeelsterUser
    ? `/PlayerDashboard`
    : isTrainer && user?.trainer_id
    ? `/TrainerDetail?id=${user.trainer_id}`
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1c0e04" }}>
      <IOSInstallBanner />

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: "rgba(28,14,4,0.85)", borderBottom: "1px solid rgba(255,107,0,0.15)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="lg:hidden p-2 rounded-lg"
              style={{ background: "rgba(255,107,0,0.08)" }}
            >
              {mobileOpen ? (
                <i className="ti ti-x" style={{ fontSize: "24px", color: "#ffffff" }} />
              ) : (
                <i className="ti ti-menu" style={{ fontSize: "24px", color: "#ffffff" }} />
              )}
            </button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden" style={{ border: "2px solid rgba(255,107,0,0.5)" }}>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad40ab17517be2ed782cdd/f4c654af8_Artemis.png" 
                  alt="FC MV Artemis Noord" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold leading-tight text-white" style={{ letterSpacing: "-0.5px" }}>MVA NOORD</h1>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>MO17 / Dames 1</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs px-3 py-1.5 rounded-full" style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,107,0,0.25)", background: "rgba(255,107,0,0.08)" }}>
              Seizoen 2025-26
            </div>
            {profileLink ? (
              <Link to={profileLink} className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center transition-all" style={{ border: "2px solid rgba(255,107,0,0.4)" }}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-[#FF6B00]">
                      {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ border: "2px solid rgba(255,107,0,0.4)" }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt={user?.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-56 flex-col z-40 overflow-y-auto" style={{ backgroundColor: "rgba(28,14,4,0.90)", borderRight: "1px solid rgba(255,107,0,0.15)", backdropFilter: "blur(12px)" }}>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {isSpeelsterUser ? (
            <>
              <NavLink item={mainNavItems[0]} currentPageName={currentPageName} />
              <NavLink item={mainNavItems[1]} currentPageName={currentPageName} />
              <NavLink item={mainNavItems[4]} currentPageName={currentPageName} />
              <NavLink item={mainNavItems[3]} currentPageName={currentPageName} />
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
        <div className="px-3 pb-4">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm w-full transition-colors"
            style={{ color: "#f87171" }}
          >
            <i className="ti ti-logout" style={{ fontSize: "20px", color: "#f87171" }} />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full pt-20 px-3 overflow-y-auto" style={{ backgroundColor: "rgba(28,14,4,0.97)", borderRight: "1px solid rgba(255,107,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {isSpeelsterUser ? (
                <>
                  <NavLink item={mainNavItems[0]} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={mainNavItems[1]} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={mainNavItems[4]} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
                  <NavLink item={mainNavItems[3]} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />
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
      <main className="pt-16 lg:pl-56 pb-20 lg:pb-0 relative min-h-screen overflow-hidden">
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

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40" style={{ backgroundColor: "rgba(28,14,4,0.95)", borderTop: "1px solid rgba(255,107,0,0.15)", backdropFilter: "blur(12px)" }}>
        <div className="flex justify-around">
          {(isSpeelsterUser 
            ? [mainNavItems[0], mainNavItems[1], mainNavItems[4], { name: "Ontwikkeling", icon: "trending-up", page: "SelfReflection" }]
            : [mainNavItems[0], mainNavItems[1], mainNavItems[2], mainNavItems[3]]
          ).map((item) => (
            <NavLink 
              key={item.page}
              item={item} 
              currentPageName={currentPageName} 
              onClick={() => setMobileOpen(false)}
              variant="mobile-tab"
            />
          ))}
        </div>
      </nav>
    </div>
  );
}