import React, { useState, useEffect } from "react";

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;
    const dismissed = localStorage.getItem("ios_install_banner_dismissed");

    if (isIOS && !isInStandaloneMode && !dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("ios_install_banner_dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#FF6B00] text-white px-4 py-3 shadow-lg">
      <div className="flex items-start justify-between gap-3 max-w-lg mx-auto">
        <div className="flex items-start gap-3">
          <i className="ti ti-download" style={{ fontSize: "22px", color: "white", marginTop: "2px", flexShrink: 0 }} />
          <div>
            <p className="font-500 text-sm leading-tight">Installeer de app voor meldingen</p>
            <p className="text-xs mt-1 opacity-90 leading-snug">
              Tik op het{" "}
              <i className="ti ti-share" style={{ fontSize: "13px", color: "white" }} />
              {" "}deel-icoon in Safari en kies <strong>'Zet op beginscherm'</strong>.
            </p>
          </div>
        </div>
        <button onClick={dismiss} className="flex-shrink-0 mt-0.5 p-1">
          <i className="ti ti-x" style={{ fontSize: "18px", color: "white" }} />
        </button>
      </div>
    </div>
  );
}