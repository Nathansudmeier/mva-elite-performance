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
      background: 'linear-gradient(160deg, #FFF3E8 0%, #FFD600 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
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
        fontSize: '24px', fontWeight: 900, color: '#1a1a1a',
        letterSpacing: '-0.5px', marginTop: '20px', marginBottom: 0,
      }}>
        FC MV Artemis Noord
      </h1>

      <p style={{
        fontSize: '12px', color: 'rgba(26,26,26,0.55)',
        letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '6px', fontWeight: 700,
      }}>
        MVA Noord
      </p>

      {/* Loading indicator */}
      <div style={{
        position: 'absolute', bottom: '56px', left: '50%',
        transform: 'translateX(-50%)',
        width: '60px', height: '4px', borderRadius: '2px',
        background: 'rgba(26,26,26,0.15)', overflow: 'hidden',
      }}>
        <style>{`
          @keyframes loadingFill {
            from { width: 0; }
            to { width: 100%; }
          }
          .splash-loading-bar {
            height: 100%;
            background: #FF6800;
            border-radius: 2px;
            animation: loadingFill 2s ease-in-out forwards;
          }
        `}</style>
        <div className="splash-loading-bar" />
      </div>

      <div style={{
        position: 'absolute', bottom: '28px', left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '11px', fontWeight: 700,
        color: 'rgba(26,26,26,0.35)', letterSpacing: '0.05em',
      }}>
        v{APP_VERSION}
      </div>
    </div>
  );
}