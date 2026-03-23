import React, { useEffect, useState } from 'react';

const MVA_LOGO_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/c0045a171_MVAlogo.png";
const BACKGROUND_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/c259ecb13_Splash.png";
const APP_VERSION = "1.0.0";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // After 2.5 seconds, start fade out
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(fadeTimer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.6s ease-in-out',
    }}>
      {/* Background image */}
      <img
        src={BACKGROUND_URL}
        alt="App background"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          zIndex: 0,
        }}
      />

      {/* Overlay 1: Dark overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 1,
      }} />

      {/* Overlay 2: Gradient fade to bottom */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(28,14,4,0.20) 0%, rgba(28,14,4,0.95) 100%)',
        zIndex: 2,
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}>
        {/* Club logo */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '2px solid rgba(255,107,0,0.60)',
          boxShadow: '0 0 40px rgba(255,107,0,0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}>
          <img
            src={MVA_LOGO_URL}
            alt="MVA Noord"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Club name */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-0.5px',
          marginTop: '16px',
          marginBottom: 0,
        }}>
          FC MV Artemis Noord
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.50)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: '4px',
        }}>
          MVA Noord
        </p>
      </div>

      {/* Version number */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '11px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.05em',
        zIndex: 10,
      }}>
        v{APP_VERSION}
      </div>

      {/* Loading indicator */}
      <div style={{
        position: 'absolute',
        bottom: '48px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '48px',
        height: '3px',
        borderRadius: '2px',
        background: 'rgba(255,255,255,0.20)',
        overflow: 'hidden',
        zIndex: 10,
      }}>
        <style>{`
          @keyframes loadingFill {
            from {
              width: 0;
            }
            to {
              width: 100%;
            }
          }
          .splash-loading-bar {
            height: 100%;
            background: #FF6B00;
            border-radius: 2px;
            animation: loadingFill 2s ease-in-out infinite;
          }
        `}</style>
        <div className="splash-loading-bar" />
      </div>
    </div>
  );
}