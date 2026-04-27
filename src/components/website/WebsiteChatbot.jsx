import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChatCircle, X, PaperPlaneRight } from "@phosphor-icons/react";
import { base44 } from "@/api/base44Client";

const WELKOMST_TEKST = `Hey! 👋 Ik ben de Artemis Assistent. Stel me gerust een vraag over MV Artemis — over de selecties, proeftrainingen, wedstrijden of onze speelfilosofie.\n\nWaar kan ik je mee helpen?`;

const SNELLE_VRAGEN = [
  "Proeftraining aanvragen",
  "Wanneer speelt MO17?",
  "Wat is jullie speelfilosofie?",
  "Hoe bereik ik jullie?",
];

const chatbotStyles = `
  @keyframes chatBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
  .chatbot-messages::-webkit-scrollbar { width: 4px; }
  .chatbot-messages::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
  .chatbot-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
  .chatbot-textarea::placeholder { color: rgba(255,255,255,0.25); }
  .chatbot-textarea:focus { border-color: rgba(255,104,0,0.4) !important; outline: none; }
`;

export default function WebsiteChatbot() {
  const sessieId = useMemo(() => crypto.randomUUID(), []);

  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('mv_artemis_chat_open') === 'true'; } catch { return false; }
  });
  const [berichten, setBerichten] = useState([
    { rol: 'assistant', inhoud: WELKOMST_TEKST }
  ]);
  const [laden, setLaden] = useState(false);
  const [inputWaarde, setInputWaarde] = useState('');
  const [toonBadge, setToonBadge] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const berichtenEindRef = useRef(null);
  const textareaRef = useRef(null);

  const slaConversatieOp = async (allesBerichten) => {
    try {
      const gebruikersBerichten = allesBerichten.filter(b => b.rol === 'user');
      if (gebruikersBerichten.length === 0) return;

      const alleInhoud = allesBerichten.map(b => b.inhoud).join(' ').toLowerCase();
      let doorverwezen = null;
      if (alleInhoud.includes('proeftraining')) doorverwezen = 'proeftraining';
      else if (alleInhoud.includes('contact') || alleInhoud.includes('mail')) doorverwezen = 'contact';
      else if (alleInhoud.includes('nieuws')) doorverwezen = 'nieuws';

      // Zoek bestaand record op sessie_id
      const bestaand = await base44.entities.ChatbotConversatie.filter({ sessie_id: sessieId });
      const payload = {
        sessie_id: sessieId,
        berichten: JSON.stringify(allesBerichten),
        eerste_bericht: gebruikersBerichten[0]?.inhoud || '',
        aantal_berichten: allesBerichten.length,
        pagina: window.location.pathname,
        datum: new Date().toISOString(),
        doorverwezen_naar: doorverwezen,
        afgerond: false,
      };
      if (bestaand && bestaand.length > 0) {
        await base44.entities.ChatbotConversatie.update(bestaand[0].id, payload);
      } else {
        await base44.entities.ChatbotConversatie.create(payload);
      }
    } catch (e) {
      console.log('Logging fout:', e);
    }
  };

  // Badge na 3 seconden tonen als chat nooit geopend is
  useEffect(() => {
    try {
      const heeftGeopend = localStorage.getItem('mv_artemis_chat_geopend');
      if (!heeftGeopend) {
        const timer = setTimeout(() => setToonBadge(true), 3000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  // Escape sluit chat
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') sluitChat(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-scroll
  useEffect(() => {
    berichtenEindRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [berichten, laden]);

  const openChat = () => {
    setOpen(true);
    setToonBadge(false);
    try {
      localStorage.setItem('mv_artemis_chat_open', 'true');
      localStorage.setItem('mv_artemis_chat_geopend', 'true');
    } catch {}
  };

  const sluitChat = async () => {
    setOpen(false);
    try { localStorage.setItem('mv_artemis_chat_open', 'false'); } catch {}
    // Markeer als afgerond
    try {
      const bestaand = await base44.entities.ChatbotConversatie.filter({ sessie_id: sessieId });
      if (bestaand && bestaand.length > 0) {
        await base44.entities.ChatbotConversatie.update(bestaand[0].id, { afgerond: true });
      }
    } catch {}
  };

  const stuurBericht = async (tekst) => {
    const trimmed = tekst.trim();
    if (!trimmed || laden) return;

    const now = Date.now();
    if (now - lastMessageTime < 2000) return;
    setLastMessageTime(now);

    const nieuweBerichten = [...berichten, { rol: 'user', inhoud: trimmed }];
    setBerichten(nieuweBerichten);
    setInputWaarde('');
    setLaden(true);

    // Stuur naar backend, max 10 berichten context (exclusief welkomst)
    const contextBerichten = nieuweBerichten.slice(1).slice(-10);

    try {
      const res = await base44.functions.invoke('artemisChat', {
        berichten: contextBerichten,
      });
      const antwoord = res.data.antwoord;
      const bijgewerkt = [...nieuweBerichten, { rol: 'assistant', inhoud: antwoord }];
      setBerichten(bijgewerkt);
      await slaConversatieOp(bijgewerkt);
    } catch {
      setBerichten(prev => [...prev, {
        rol: 'assistant',
        inhoud: 'Oeps, er ging iets mis. Probeer het opnieuw of mail naar info@mv-artemis.nl 📧',
      }]);
    } finally {
      setLaden(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stuurBericht(inputWaarde);
    }
  };

  return (
    <>
      <style>{chatbotStyles}</style>

      {/* Chat venster */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          width: '360px',
          height: '520px',
          zIndex: 1000,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          // mobiel
          ...(window.innerWidth < 768 ? {
            width: 'calc(100vw - 32px)',
            height: 'calc(100vh - 120px)',
            bottom: '88px',
            right: '16px',
          } : {}),
        }}>
          {/* Header */}
          <div style={{ background: '#1B2A5E', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FF6800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChatCircle weight="bold" size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff' }}>Artemis Assistent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: '#22C55E' }}>Online</span>
              </div>
            </div>
            <button onClick={sluitChat} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
              <X weight="bold" size={20} />
            </button>
          </div>

          {/* Berichten */}
          <div className="chatbot-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#10121A', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {berichten.map((b, i) => (
              <div key={i}>
                {b.rol === 'assistant' ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FF6800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ChatCircle size={14} color="white" weight="bold" />
                    </div>
                    <div>
                      <div style={{ background: '#202840', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, maxWidth: '85%', whiteSpace: 'pre-wrap' }}>
                        {b.inhoud}
                      </div>
                      {/* Snelle vragen alleen bij welkomstbericht */}
                      {i === 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {SNELLE_VRAGEN.map((v) => (
                            <button key={v} onClick={() => stuurBericht(v)}
                              style={{ background: 'transparent', border: '1px solid rgba(255,104,0,0.4)', borderRadius: '16px', padding: '5px 12px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 600, color: '#FF6800', cursor: 'pointer', transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,104,0,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: '#FF6800', borderRadius: '12px 4px 12px 12px', padding: '10px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: '#fff', lineHeight: 1.55, maxWidth: '85%', whiteSpace: 'pre-wrap' }}>
                      {b.inhoud}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {laden && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FF6800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ChatCircle size={14} color="white" weight="bold" />
                </div>
                <div style={{ background: '#202840', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 12px 12px 12px' }}>
                  <div style={{ display: 'flex', gap: '4px', padding: '12px 14px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: 'chatBounce 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={berichtenEindRef} />
          </div>

          {/* Input */}
          <div style={{ background: '#161A24', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              ref={textareaRef}
              className="chatbot-textarea"
              value={inputWaarde}
              onChange={e => setInputWaarde(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Stel een vraag..."
              rows={1}
              style={{ flex: 1, background: '#202840', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: '#fff', resize: 'none', minHeight: '40px', maxHeight: '100px', lineHeight: 1.4 }}
            />
            <button
              onClick={() => stuurBericht(inputWaarde)}
              disabled={!inputWaarde.trim() || laden}
              style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FF6800', border: 'none', cursor: !inputWaarde.trim() || laden ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !inputWaarde.trim() || laden ? 0.4 : 1, transition: 'opacity 0.15s' }}>
              <PaperPlaneRight weight="bold" size={18} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Chat knop */}
      <button
        onClick={open ? sluitChat : openChat}
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, width: '60px', height: '60px', borderRadius: '50%', background: '#FF6800', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,104,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,104,0,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,104,0,0.4)'; }}
      >
        {open ? <X weight="bold" size={24} color="white" /> : <ChatCircle weight="bold" size={28} color="white" />}

        {/* Notificatie badge */}
        {toonBadge && !open && (
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', background: '#FFD600', borderRadius: '50%', border: '2px solid #10121A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>
            1
          </div>
        )}
      </button>
    </>
  );
}