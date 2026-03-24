import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Filled SVG icons
function IconDashboard({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="9" height="9" rx="2" fill={fill} />
      <rect x="14" y="1" width="9" height="9" rx="2" fill={fill} />
      <rect x="1" y="14" width="9" height="9" rx="2" fill={fill} />
      <rect x="14" y="14" width="9" height="9" rx="2" fill={fill} />
    </svg>
  );
}

function IconPlanning({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="17" rx="3.5" fill={fill} />
      <rect x="7" y="2" width="2.5" height="5" rx="1.2" fill={fill} />
      <rect x="14.5" y="2" width="2.5" height="5" rx="1.2" fill={fill} />
      <rect x="4" y="11" width="16" height="2" rx="1" fill="white" opacity="0.6" />
    </svg>
  );
}

function IconSpelers({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4.5" fill={fill} />
      <path d="M3 19C3 15.13 7.13 12 12 12s9 3.13 9 7" stroke={fill} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconTrainingsvormen({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={fill} />
      <polygon points="12,4 14,9 12,8 10,9" fill="white" opacity="0.7" />
      <polygon points="19,8 14.5,10 15,8 14.5,6" fill="white" opacity="0.7" />
      <polygon points="17,17 13,14 15,14 14.5,12" fill="white" opacity="0.7" />
      <polygon points="7,17 11,14 9,14 9.5,12" fill="white" opacity="0.7" />
      <polygon points="5,8 9.5,10 9,8 9.5,6" fill="white" opacity="0.7" />
    </svg>
  );
}

function IconSpelprincipes({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 5.5V17c0 3.5 3.5 5.5 8 6 4.5-.5 8-2.5 8-6V5.5L12 3z" fill={fill} />
      <line x1="12" y1="6" x2="12" y2="21" stroke="white" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

function IconBerichten({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 4C3 3.45 3.45 3 4 3H20C20.55 3 21 3.45 21 4V14C21 14.55 20.55 15 20 15H8L4 19.5V15H4C3.45 15 3 14.55 3 14V4Z" fill={fill} />
    </svg>
  );
}

function IconFoto({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill={fill} />
      <circle cx="12" cy="12" r="3" fill="white" />
      <circle cx="12" cy="12" r="1.5" fill={fill} />
      <path d="M7 9L9 6.5L11 9L14 6.5L17 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBeheer({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" fill={fill} />
      <circle cx="12" cy="4" r="2" fill={fill} />
      <circle cx="12" cy="20" r="2" fill={fill} />
      <line x1="12" y1="6" x2="12" y2="10" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="14" x2="12" y2="18" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const trainerTabItems = [
  { name: "Dashboard", page: "Dashboard", Icon: IconDashboard },
  { name: "Planning", page: "Planning", Icon: IconPlanning },
  { name: "Spelers", page: "Players", Icon: IconSpelers },
  { name: "Trainingen", page: "Trainingsvormen", Icon: IconTrainingsvormen },
  { name: "Foto's", page: "Photowall", Icon: IconFoto },
  { name: "Spelprincipes", page: "Spelprincipes", Icon: IconSpelprincipes },
  { name: "Berichten", page: "Messages", Icon: IconBerichten },
  { name: "Beheer", page: "AccountBeheer", Icon: IconBeheer },
];

function IconProfiel({ fill }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4.5" fill={fill} />
      <path d="M3 20C3 16.13 7.13 13 12 13s9 3.13 9 7H3z" fill={fill} />
    </svg>
  );
}

const speelsterTabItems = [
  { name: "Dashboard", page: "PlayerDashboard", Icon: IconDashboard },
  { name: "Planning", page: "Planning", Icon: IconPlanning },
  { name: "Mijn profiel", page: "PlayerDashboard", Icon: IconProfiel },
  { name: "Foto's", page: "Photowall", Icon: IconFoto },
  { name: "Spelprincipes", page: "Spelprincipes", Icon: IconSpelprincipes },
  { name: "Berichten", page: "Messages", Icon: IconBerichten },
];

const ouderTabItems = [
  { name: "Dashboard", page: "Dashboard", Icon: IconDashboard },
  { name: "Planning", page: "Planning", Icon: IconPlanning },
  { name: "Mijn profiel", page: "PlayerDashboard", Icon: IconProfiel },
  { name: "Foto's", page: "Photowall", Icon: IconFoto },
];

export default function BentoTabBar({ currentPageName, isSpeelsterUser, isOuderUser, onNavigate }) {
  const tabItems = isOuderUser ? ouderTabItems : isSpeelsterUser ? speelsterTabItems : trainerTabItems;

  return (
    <nav
      className="xl:hidden"
      style={{
        position: "fixed", bottom: 0, left: "8px", right: "8px",
        zIndex: 100, padding: "0 0 1rem",
      }}
    >
      <div style={{
        background: "#ffffff",
        border: "2.5px solid #1a1a1a",
        borderRadius: "22px",
        boxShadow: "3px 3px 0 #1a1a1a",
        display: "flex",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        padding: "10px 10px 14px",
        gap: "8px",
      }}>
        {tabItems.map((item) => {
          const isActive = item.page === currentPageName;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={onNavigate}
              style={{
                flex: "0 0 auto",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "6px", textDecoration: "none",
                minWidth: "72px",
                padding: "0 4px",
                scrollSnapAlign: "center",
              }}
            >
              <div style={{
                background: isActive ? "#FF6800" : "transparent",
                borderRadius: isActive ? "12px" : "0",
                border: isActive ? "1.5px solid #1a1a1a" : "none",
                padding: isActive ? "8px 10px" : "8px 10px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <item.Icon fill={isActive ? "#ffffff" : "rgba(26,26,26,0.20)"} />
              </div>
              <span style={{
                fontSize: "10px", fontWeight: 800,
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