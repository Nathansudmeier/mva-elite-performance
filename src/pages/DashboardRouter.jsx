import React from "react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import Dashboard from "./Dashboard";
import PlayerDashboard from "./PlayerDashboard";

export default function DashboardRouter() {
  const { isSpeelster } = useCurrentUser();

  return isSpeelster ? <PlayerDashboard /> : <Dashboard />;
}