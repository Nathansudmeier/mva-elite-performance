import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Filled SVG icons
function IconDashboard({ fill }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill={fill} />
      <rect x="10" y="1" width="7" height="7" rx="1.5" fill={fill} />
      <rect x="1" y="10" width="7" height="7" rx="1.5" fill={fill} />
      <rect x="10" y="10" width="7" height="7" rx="1.5" fill={fill} />
    </svg>
  );
}

function IconPlanning({ fill }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="3" width="16" height="14" rx="3" fill={fill} />
      <rect x="5" y="1" width="2" height="4" rx="1" fill={fill} />
      <rect x="11" y="1" width="2" height="4" rx="1" fill={fill} />
      <rect x="3" y="9" width="12" height="1.5" rx="0.75" fill="white" opacity="0.6" />
    </svg>
  );
}

function IconSpelers({ fill }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="5.5" r="3.5" fill={fill} />
      <path d="M2 15.5C2 12.46 5.13 10 9 10s7 2.46 7 5.5" stroke={fill} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconTrainingsvormen({ fill }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={fill} />
      <polygon points="9,3 10.5,7 9,6 7.5,7" fill="white" opacity="0.7" />
      <polygon points="15,6.5 11.5,8 12,6.5 11.5,5" fill="white" opacity="0.7" />
      <polygon points="13,13.5 10,11 11.5,11 11,9.5" fill="white" opacity="0.7" />
      <polygon points="5,13.5 8,11 6.5,11 7,9.5" fill="white" opacity="0.7" />
      <polygon points="3,6.5 6.5,8 6,6.5 6.5,5" fill="white" opacity="0.7" />
    </svg>
  );
}

function IconSpelprincipes({ fill }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L3 4v9c0 3 2.5 4.5 6 5 3.5-.5 6-2 6-5V4L9 2z" fill={fill} />
      <line x1="9" y1="4" x2="9" y2="16" stroke="white" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

function IconBerichten({ fill }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 3C2 2.45 2.45 2 3 2H15C15.55 2 16 2.45 16 3V11C16 11.55 15.55 12 15 12H6L3 15.5V12H3C2.45 12 2 11.55 2 11V3Z" fill={fill} />
    </svg>
  );
}

const trainerTabItems = [
  { name: "Dashboard", page: "Dashboard", Icon: IconDashboard },
  { name: "Planning", page: "Planning", Icon: IconPlanning },
  { name: "Spelers", page: "Players", Icon: IconSpelers },
  { name: "Trainingsvormen", page: "Trainingsvormen", Icon: IconTrainingsvormen },
  { name: "Spelprincipes", page: "Spelprincipes", Icon: IconSpelprincipes },
  { name: "Berichten", page: "Messages", Icon: IconBerichten },
];

function IconProfiel({ fill }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3.5" fill={fill} />
      <path d="M2 16C2 12.96 5.13 10.5 9 10.5s7 2.46 7 5.5H2z" fill={fill} />
    </svg>
  );
}

const speelsterTabItems = [
  { name: "Planning", page: "Planning", Icon: IconPlanning },
  { name: "Mijn profiel", page: "PlayerDashboard", Icon: IconProfiel },
  { name: "Spelprincipes", page: "Spelprincipes", Icon: IconSpelprincipes },
  { name: "Berichten", page: "Messages", Icon: IconBerichten },
];

export default function BentoTabBar({ currentPageName, isSpeelsterUser, onNavigate }) {
  const tabItems = isSpeelsterUser ? speelsterTabItems : trainerTabItems;

  return (
    <nav
      className="xl:hidden"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 100, padding: "0 1rem 1rem",
      }}
    >
      <div style={{
        background: "#ffffff",
        border: "2.5px solid #1a1a1a",
        borderRadius: "22px",
        boxShadow: "3px 3px 0 #1a1a1a",
        display: "flex",
        padding: "8px 6px 12px",
      }}>
        {tabItems.map((item) => {
          const isActive = item.page === currentPageName;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={onNavigate}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "3px", textDecoration: "none",
              }}
            >
              <div style={{
                background: isActive ? "#FF6800" : "transparent",
                borderRadius: isActive ? "10px" : "0",
                border: isActive ? "1.5px solid #1a1a1a" : "none",
                padding: isActive ? "5px 7px" : "5px 7px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <item.Icon fill={isActive ? "#ffffff" : "rgba(26,26,26,0.20)"} />
              </div>
              <span style={{
                fontSize: "9px", fontWeight: 800,
                color: isActive ? "#FF6800" : "rgba(26,26,26,0.30)",
                whiteSpace: "nowrap",
              }}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}