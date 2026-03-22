import React from 'react';

const BACKGROUND_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/bd658ec94_Appbackground-donker.png";

export default function DashboardBackground() {
  return (
    <img
      src={BACKGROUND_URL}
      alt="Dashboard background"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center top',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}