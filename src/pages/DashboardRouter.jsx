import React from "react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import Dashboard from "./Dashboard";
import PlayerDashboard from "./PlayerDashboard";

export default function DashboardRouter() {
  const { user, isSpeelster, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return user?.role === "speelster" ? <PlayerDashboard /> : <Dashboard />;
}