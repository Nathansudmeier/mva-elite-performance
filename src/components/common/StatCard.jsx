import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "#FF8C3A" }) {
  return (
    <div className="glass p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="t-label mb-2">{title}</p>
          <p className="t-metric-orange" style={{ color }}>{value}</p>
          {subtitle && <p className="t-secondary mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,140,58,0.15)" }}>
            <Icon size={17} className="ic-orange" style={{ color: "#FF8C3A" }} />
          </div>
        )}
      </div>
    </div>
  );
}