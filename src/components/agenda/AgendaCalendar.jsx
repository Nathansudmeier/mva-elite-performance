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

// Activity type color mapping
const typeColors = {
  "Training": { bg: "#08D068", text: "#1a1a1a" },
  "Wedstrijd": { bg: "#FF3DA8", text: "#ffffff" },
  "Toernooi": { bg: "#00C2FF", text: "#1a1a1a" },
};

function ActivityDot({ type }) {
  const colors = typeColors[type] || { bg: "#FFD600", text: "#1a1a1a" };
  return (
    <div style={{
      width: "6px", height: "6px", borderRadius: "50%",
      background: colors.bg, border: "1px solid #1a1a1a",
    }} />
  );
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
    <div style={{
      background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px",
      boxShadow: "3px 3px 0 #1a1a1a", padding: "16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <button onClick={prevMonth}
          style={{
            width: "40px", height: "40px", borderRadius: "12px", display: "flex",
            alignItems: "center", justifyContent: "center", background: "rgba(26,26,26,0.04)",
            border: "2px solid rgba(26,26,26,0.10)", cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,26,26,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(26,26,26,0.04)"; }}>
          <ChevronLeft size={16} color="#1a1a1a" />
        </button>
        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", textTransform: "capitalize" }}>{monthName}</h3>
        <button onClick={nextMonth}
          style={{
            width: "40px", height: "40px", borderRadius: "12px", display: "flex",
            alignItems: "center", justifyContent: "center", background: "rgba(26,26,26,0.04)",
            border: "2px solid rgba(26,26,26,0.10)", cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,26,26,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(26,26,26,0.04)"; }}>
          <ChevronRight size={16} color="#1a1a1a" />
        </button>
      </div>

      {/* Dag headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "8px" }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: "center", fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.55)",
            textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
        {grid.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = toDateStr(year, month, day);
          const dayItems = byDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const hasItems = dayItems.length > 0;

          return (
            <button key={idx} onClick={() => onDayClick(dateStr, dayItems)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "10px 6px", borderRadius: "12px", minHeight: "60px",
                background: isToday ? "#FF6800" : hasItems ? "rgba(255,104,0,0.08)" : "rgba(26,26,26,0.02)",
                border: `2px solid ${isToday ? "#1a1a1a" : hasItems ? "rgba(255,104,0,0.20)" : "rgba(26,26,26,0.06)"}`,
                cursor: "pointer", transition: "all 0.15s", boxShadow: isToday ? "2px 2px 0 #1a1a1a" : "none",
              }}
              onMouseEnter={e => {
                if (!isToday && !hasItems) {
                  e.currentTarget.style.background = "rgba(26,26,26,0.04)";
                  e.currentTarget.style.borderColor = "rgba(26,26,26,0.10)";
                }
              }}
              onMouseLeave={e => {
                if (!isToday && !hasItems) {
                  e.currentTarget.style.background = "rgba(26,26,26,0.02)";
                  e.currentTarget.style.borderColor = "rgba(26,26,26,0.06)";
                }
              }}>
              <span style={{
                fontSize: "13px", fontWeight: 700, color: isToday ? "#ffffff" : "#1a1a1a",
              }}>
                {day}
              </span>
              {dayItems.length > 0 && (
                <div style={{ display: "flex", gap: "3px", marginTop: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                  {dayItems.slice(0, 3).map((it, i) => (
                    <ActivityDot key={i} type={it.type} />
                  ))}
                  {dayItems.length > 3 && (
                    <div style={{ fontSize: "8px", color: "rgba(26,26,26,0.35)", fontWeight: 800, lineHeight: 1 }}>+</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}