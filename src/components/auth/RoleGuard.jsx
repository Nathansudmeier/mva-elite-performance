import React from "react";
import { useCurrentUser } from "./useCurrentUser";
import { Shield } from "lucide-react";

export default function RoleGuard({ allowedRoles, children }) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!user || (user.role !== "admin" && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <Shield size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Geen toegang</h2>
          <p className="text-white/70 text-sm mt-1">Je hebt geen rechten om deze pagina te bekijken.</p>
        </div>
      </div>
    );
  }

  return children;
}