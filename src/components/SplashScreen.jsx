import React, { useEffect, useState } from 'react';

const MVA_LOGO_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/c0045a171_MVAlogo.png";
const EMVI_HOI_URL = "https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/1f773086f_Emvi-hoi.png";
const APP_VERSION = "1.0.0";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    return () => clearTimeout(fadeTimer);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.6s ease-in-out',
      background: 'linear-gradient(160deg, #FF6800 0%, #FF8C00 50%, #FFA500 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '60px 20px 40px',
      boxSizing: 'border-box',
    }}>
      {/* Top section - Logo and title */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        marginTop: '20px',
      }}>
        {/* Club logo */}
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          border: '2.5px solid #1a1a1a',
          boxShadow: '4px 4px 0 #1a1a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', backgroundColor: '#ffffff',
        }}>
          <img src={MVA_LOGO_URL} alt="MVA Noord" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <h1 style={{
          fontSize: '24px', fontWeight: 900, color: '#ffffff',
          letterSpacing: '-0.5px', marginTop: '20px', marginBottom: 0,
          textShadow: '2px 2px 0 rgba(0,0,0,0.15)',
        }}>
          FC MV Artemis Noord
        </h1>

        <p style={{
          fontSize: '12px', color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '6px', fontWeight: 700,
        }}>
          MVA Noord
        </p>
      </div>

      {/* Bottom section - Loading and version */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {/* Loading indicator */}
        <div style={{
          width: '60px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.3)', overflow: 'hidden',
        }}>
          <style>{`
            @keyframes loadingFill {
              from { width: 0; }
              to { width: 100%; }
            }
            .splash-loading-bar {
              height: 100%;
              background: #ffffff;
              border-radius: 2px;
              animation: loadingFill 2s ease-in-out forwards;
            }
          `}</style>
          <div className="splash-loading-bar" />
        </div>

        <div style={{
          fontSize: '11px', fontWeight: 700,
          color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em',
        }}>
          v{APP_VERSION}
        </div>
      </div>

      {/* Emvi - centered in the middle */}
      <img
        src={EMVI_HOI_URL}
        alt="Emvi"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          height: '280px',
          width: 'auto',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}