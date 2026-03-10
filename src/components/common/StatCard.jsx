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
          <p className="text-xs text-[#2F3650] uppercase tracking-wider font-medium">{title}</p>
          <p className="text-2xl font-black mt-1 text-[#1A1F2E]">{value}</p>
          {subtitle && <p className="text-xs text-[#2F3650] mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FDE8DC' }}>
            <Icon size={18} style={{ color: '#D45A30' }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}