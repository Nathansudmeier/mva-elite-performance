import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { base44 as b44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Trophy,
  Grid3x3,
  Activity,
  ClipboardList,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  TrendingUp,
} from "lucide-react";

const desenvolvidoItems = [
  { name: "Aanwezigheid", icon: ClipboardList, page: "Attendance" },
  { name: "Fysiek", icon: Activity, page: "PhysicalMonitor" },
  { name: "Beoordeling", icon: ClipboardList, page: "PlayerRatingForm" },
  { name: "Reflectie", icon: MessageSquare, page: "SelfReflection" },
  { name: "Rapporten", icon: TrendingUp, page: "Reports" },
  { name: "Speelminuten", icon: Activity, page: "Speelminuten" },
];

const mainNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Spelers", icon: Users, page: "Players" },
  { name: "Staff", icon: UserCog, page: "Staff" },
  { name: "Wedstrijden", icon: Trophy, page: "Wedstrijden" },
];

const secondaryNavItems = [
  { name: "Spelprincipes", icon: Grid3x3, page: "Spelprincipes" },
  { name: "Instellingen", icon: Settings, page: "AccountBeheer" },
];

function NavLink({ item, currentPageName, onClick, variant = "desktop" }) {
  const isActive = currentPageName === item.page;
  
  if (variant === "mobile-tab") {
    return (
      <Link
        key={item.page}
        to={createPageUrl(item.page)}
        onClick={onClick}
        className="flex flex-col items-center justify-center py-3 px-2 transition-colors"
      >
        <item.icon 
          size={22} 
          strokeWidth={1.5}
          color={isActive ? "#FF6B00" : "#888888"}
        />
        <span className={`text-[11px] mt-1 ${isActive ? "text-[#FF6B00]" : "text-[#888888]"}`}>
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors duration-200 ${
        isActive 
          ? "text-[#FF6B00] bg-[#FFF3EB]" 
          : "text-[#888888] hover:text-[#FF6B00]"
      }`}
    >
      <item.icon size={20} strokeWidth={1.5} />
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
        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm transition-colors duration-200 ${
          isAnyActive 
            ? "text-[#FF6B00] bg-[#FFF3EB]" 
            : "text-[#888888] hover:text-[#FF6B00]"
        }`}
      >
        <div className="flex items-center gap-3">
          <TrendingUp size={20} strokeWidth={1.5} />
          Ontwikkeling
        </div>
        <ChevronDown size={16} strokeWidth={1.5} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#FF6B00] pl-4">
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
    queryKey: ["player", user?.player_id],
    queryFn: () => b44.entities.Player.filter({ id: user.player_id }),
    enabled: !!user?.player_id,
    select: (data) => data[0],
  });
  const profilePhoto = trainerRecord?.photo_url || playerRecord?.photo_url || null;

  const profileLink = isSpeelsterUser
    ? `/PlayerDashboard`
    : isTrainer && user?.trainer_id
    ? `/TrainerDetail?id=${user.trainer_id}`
    : null;

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="lg:hidden p-2 rounded-lg hover:bg-[#F7F5F2]"
            >
              {mobileOpen ? (
                <X size={24} color="#1A1A1A" strokeWidth={1.5} />
              ) : (
                <Menu size={24} color="#1A1A1A" strokeWidth={1.5} />
              )}
            </button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#FF6B00]">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad40ab17517be2ed782cdd/f4c654af8_Artemis.png" 
                  alt="FC MV Artemis Noord" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-500 leading-tight text-[#1A1A1A]">MVA NOORD</h1>
                <p className="text-[11px] text-[#888888]">MO17 / Dames 1</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#888888] px-3 py-2 rounded-full border border-[#E8E6E1] bg-[#F7F5F2]">
              Seizoen 2025-26
            </div>
            {profileLink ? (
              <Link to={profileLink} className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#E8E6E1] hover:border-[#FF6B00] transition-colors bg-[#F7F5F2] flex items-center justify-center">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-500 text-[#FF6B00]">
                      {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#E8E6E1] bg-[#F7F5F2] flex items-center justify-center">
                <span className="text-sm font-500 text-[#888888]">
                  {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-56 flex-col border-r border-[#E8E6E1] z-40 overflow-y-auto bg-[#FFFFFF]">
        <nav className="flex-1 py-4 px-3 space-y-2">
          {isSpeelsterUser ? (
            mainNavItems.slice(0, 1).map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} />)
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#C0392B] hover:bg-[#FFE6E6] w-full transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full pt-20 px-3 overflow-y-auto bg-[#FFFFFF] border-r border-[#E8E6E1]" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-2">
              {isSpeelsterUser ? (
                mainNavItems.slice(0, 1).map((item) => <NavLink key={item.page} item={item} currentPageName={currentPageName} onClick={() => setMobileOpen(false)} />)
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
      <main className="pt-16 lg:pl-56 pb-20 lg:pb-0 relative min-h-screen">
        <div 
          className="lg:hidden fixed inset-0 top-16 bottom-0 z-0 pointer-events-none"
          style={{
            backgroundImage: "url('https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/98a8a794b_Appbackground.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.18
          }}
        />
        <div 
          className="hidden lg:block fixed inset-0 left-56 top-16 bottom-0 z-0 pointer-events-none"
          style={{
            backgroundImage: "url('https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/d23782f96_AppbackgroundWebsite.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.18
          }}
        />
        <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#E8E6E1] z-40">
        <div className="flex justify-around">
          {(isSpeelsterUser 
            ? mainNavItems.slice(0, 1) 
            : [mainNavItems[0], mainNavItems[1], mainNavItems[2], secondaryNavItems[0]]
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