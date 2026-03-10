import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
  Shield
} from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: Trophy, page: "Dashboard" },
  { name: "Speelsters", icon: Users, page: "Players" },
  { name: "Aanwezigheid", icon: ClipboardCheck, page: "Attendance" },
  { name: "Fysiek", icon: Activity, page: "PhysicalMonitor" },
  { name: "Tactiek", icon: Target, page: "Tactics" },
  { name: "Video", icon: Video, page: "VideoHub" },
  { name: "Reflectie", icon: BarChart3, page: "SelfReflection" },
  { name: "Rapporten", icon: BarChart3, page: "Reports" },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#222]">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#1a1a1a]"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad40ab17517be2ed782cdd/f4c654af8_Artemis.png" alt="FC MV Artemis Noord" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold tracking-tight leading-none">MVA NOORD</h1>
                <p className="text-[10px] text-[#a0a0a0] tracking-[0.2em] uppercase">MO17 Elite</p>
              </div>
            </Link>
          </div>
          <div className="text-xs text-[#a0a0a0] bg-[#141414] px-3 py-1.5 rounded-full border border-[#222]">
            Seizoen 2025-26
          </div>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-56 flex-col bg-[#0a0a0a] border-r border-[#222] z-40">
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#1a3a8f] text-white"
                    : "text-[#a0a0a0] hover:text-white hover:bg-[#141414]"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-[#FF6B00]" : ""} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-[#0a0a0a] border-r border-[#222] pt-20 px-3" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#1a3a8f] text-white"
                        : "text-[#a0a0a0] hover:text-white hover:bg-[#141414]"
                    }`}
                  >
                    <item.icon size={18} className={isActive ? "text-[#FF6B00]" : ""} />
                    {item.name}
                  </Link>
                );
              })}
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#222] z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 ${
                  isActive ? "text-[#FF6B00]" : "text-[#666]"
                }`}
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