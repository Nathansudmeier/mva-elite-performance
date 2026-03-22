import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TYPE_CONFIG } from "./agendaUtils";

const DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function getMonthGrid(year, month) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Mini SVG icons for activity types
function TrainingIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="#60a5fa" opacity="0.9"/>
      <path d="M5 20c0-4 3-6 7-6s7 2 7 6" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    </svg>
  );
}

function WedstrijdIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="#4ade80" strokeWidth="2" opacity="0.9"/>
      <path d="M12 3 L14 8 L12 10 L10 8 Z" fill="#4ade80" opacity="0.9"/>
      <path d="M3 12 L8 10 L10 12 L8 14 Z" fill="#4ade80" opacity="0.9"/>
      <path d="M21 12 L16 14 L14 12 L16 10 Z" fill="#4ade80" opacity="0.9"/>
      <path d="M12 21 L10 16 L12 14 L14 16 Z" fill="#4ade80" opacity="0.9"/>
    </svg>
  );
}

function EventIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="#fbbf24" strokeWidth="2" opacity="0.9"/>
      <path d="M3 9h18" stroke="#fbbf24" strokeWidth="2" opacity="0.9"/>
      <path d="M8 2v4M16 2v4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
    </svg>
  );
}

function ActivityIcon({ type }) {
  if (type === "Training") return <TrainingIcon />;
  if (type === "Wedstrijd") return <WedstrijdIcon />;
  return <EventIcon />;
}

export default function AgendaCalendar({ items, onDayClick }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const grid = getMonthGrid(year, month);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Group items by date
  const byDate = {};
  items.forEach(item => {
    if (!byDate[item.date]) byDate[item.date] = [];
    byDate[item.date].push(item);
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthName = new Date(year, month, 1).toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

  return (
    <div className="glass-dark rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ChevronLeft size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
        </button>
        <span className="t-card-title capitalize">{monthName}</span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
        </button>
      </div>

      {/* Dag headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center t-label py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = toDateStr(year, month, day);
          const dayItems = byDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const hasItems = dayItems.length > 0;

          return (
            <button key={idx} onClick={() => onDayClick(dateStr, dayItems)}
              className="relative flex flex-col items-center py-2 rounded-xl transition-all hover:bg-white/5"
              style={{
                background: isToday ? "rgba(255,140,58,0.15)" : hasItems ? "rgba(255,255,255,0.04)" : "transparent",
                border: isToday ? "1.5px solid #FF8C3A" : "1px solid transparent",
                cursor: "pointer",
              }}>
              <span className="text-sm font-semibold" style={{ color: isToday ? "#FF8C3A" : "rgba(255,255,255,0.85)" }}>
                {day}
              </span>
              {dayItems.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                  {dayItems.slice(0, 3).map((it, i) => (
                    <ActivityIcon key={i} type={it.type} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}