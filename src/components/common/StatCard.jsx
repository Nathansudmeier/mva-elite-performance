import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "#FF6B00" }) {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="elite-card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#a0a0a0] uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-[#666] mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon size={18} style={{ color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}