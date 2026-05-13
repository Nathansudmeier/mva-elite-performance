import React from "react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import Dashboard from "./Dashboard";
import PlayerDashboard from "./PlayerDashboard";
import OuderDashboard from "./OuderDashboard";
import PendingAccess from "./PendingAccess";

export default function DashboardRouter() {
  const { user, isSpeelster, isOuder, isTrainer, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Archived users get a blocked screen
  if (user?.role === 'archived') {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{
          background: "#FF3DA8",
          border: "2.5px solid #1a1a1a",
          borderRadius: "18px",
          boxShadow: "3px 3px 0 #1a1a1a",
          padding: "24px 20px",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: "rgba(255,255,255,0.70)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Account geblokkeerd
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", marginBottom: "12px" }}>
            Geen toegang
          </h1>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            Je account is gearchiveerd door de beheerder. Neem contact op als je denkt dat dit een vergissing is.
          </p>
        </div>
      </div>
    );
  }

  // No role assigned yet
  if (!isTrainer && !isSpeelster && !isOuder) {
    return <PendingAccess />;
  }

  // Parents always see parent dashboard, regardless of other roles
  if (isOuder) return <OuderDashboard />;
  if (isSpeelster) return <PlayerDashboard />;
  return <Dashboard />;
}