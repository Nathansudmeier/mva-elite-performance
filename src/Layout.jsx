import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import {
  Trophy,
  Users,
  ClipboardCheck,
  Activity,
  Target,
  Video,
  BarChart3,
  Menu,
  X,
  Swords,
  Star,
  LayoutDashboard,
  UserCog,
  LogOut,
  ChevronDown,
  TrendingUp,
} from "lucide-react";

const ontwikkelingPages = ["Attendance", "PhysicalMonitor", "PlayerRatingForm", "SelfReflection", "Reports"];

const ontwikkelingItems = [
  { name: "Aanwezigheid", icon: ClipboardCheck, page: "Attendance" },
  { name: "Fysiek", icon: Activity, page: "PhysicalMonitor" },
  { name: "Beoordeling", icon: Star, page: "PlayerRatingForm" },
  { name: "Reflectie", icon: BarChart3, page: "SelfReflection" },
  { name: "Rapporten", icon: BarChart3, page: "Reports" },
];

const topNavItems = [
  { name: "Dashboard", icon: Trophy, page: "Dashboard" },
  { name: "Speelsters", icon: Users, page: "Players" },
  { name: "Wedstrijden", icon: Swords, page: "Wedstrijden" },
];

const bottomNavItems = [
  { name: "Tactiek", icon: Target, page: "Tactics" },
  { name: "Video", icon: Video, page: "VideoHub" },
  { name: "Accounts", icon: UserCog, page: "AccountBeheer" },
];

const speelsterNavItems = [
  { name: "Mijn Dashboard", icon: LayoutDashboard, page: "PlayerDashboard" },
];

function NavLink({ item, currentPageName, onClick }) {
  const isActive = currentPageName === item.page;
  return (
    <Link
      key={item.page}
      to={createPageUrl(item.page)}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive ? "text-white" : "text-white/75 hover:text-white hover:bg-white/10"
      }`}
      style={isActive ? { backgroundColor: "rgba(255,255,255,0.2)" } : undefined}
    >
      <item.icon size={18} />
      {item.name}
    </Link>
  );
}

function OntwikkelingGroup({ currentPageName, onItemClick }) {
  const isAnyActive = ontwikkelingPages.includes(currentPageName);
  const [open, setOpen] = useState(isAnyActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isAnyActive ? "text-white" : "text-white/75 hover:text-white hover:bg-white/10"
        }`}
        style={isAnyActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
      >
        <div className="flex items-center gap-3">
          <TrendingUp size={18} />
          Ontwikkeling
        </div>
        <ChevronDown size={15} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
          {ontwikkelingItems.map((item) => (
            <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isTrainer, isSpeelster } = useCurrentUser();
  const isSpeelsterUser = !isTrainer && isSpeelster;

  const allMobileItems = [...topNavItems, ...ontwikkelingItems, ...bottomNavItems];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#E8724A" }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: "rgba(200,85,45,0.97)", borderColor: "rgba(255,255,255,0.2)" }}>
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/20">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad40ab17517be2ed782cdd/f4c654af8_Artemis.png" alt="FC MV Artemis Noord" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold tracking-tight leading-none text-white">MVA NOORD</h1>
                <p className="text-[10px] text-white/70 tracking-[0.2em] uppercase">MO17 / Dames 1</p>
              </div>
            </Link>
          </div>
          <div className="text-xs text-white/90 px-3 py-1.5 rounded-full border" style={{ backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }}>
            Seizoen 2025-26
          </div>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-56 flex-col border-r z-40 overflow-y-auto" style={{ backgroundColor: "rgba(200,85,45,0.97)", borderColor: "rgba(255,255,255,0.2)" }}>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {isSpeelsterUser ? (
            speelsterNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} />)
          ) : (
            <>
              {topNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} />)}
              <OntwikkelingGroup currentPageName={currentPageName} />
              {bottomNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} />)}
            </>
          )}
        </nav>
        <div className="px-3 pb-4">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 w-full transition-all"
          >
            <LogOut size={18} />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full border-r pt-20 px-3 overflow-y-auto" style={{ backgroundColor: "rgba(200,85,45,0.99)", borderColor: "rgba(255,255,255,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {isSpeelsterUser ? (
                speelsterNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />)
              ) : (
                <>
                  {topNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />)}
                  <OntwikkelingGroup currentPageName={currentPageName} onItemClick={() => setMobileOpen(false)} />
                  {bottomNavItems.map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />)}
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="pt-16 lg:pl-56">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md border-t z-40" style={{ backgroundColor: "rgba(200,85,45,0.99)", borderColor: "rgba(255,255,255,0.2)" }}>
        <div className="flex justify-around py-2">
          {(isSpeelsterUser ? speelsterNavItems : [topNavItems[0], topNavItems[1], topNavItems[2], { name: "Ontwikkeling", icon: TrendingUp, page: ontwikkelingPages.find(p => p === currentPageName) || "Attendance" }, bottomNavItems[0]]).map((item) => {
            const isActive = item.page === currentPageName || (item.name === "Ontwikkeling" && ontwikkelingPages.includes(currentPageName));
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 ${isActive ? "text-white" : "text-white/65"}`}
              >
                <item.icon size={18} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}