import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAANDEN_KORT = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const MAANDEN_LANG = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Handmatige trigger: admins en trainers. Automation: geen user (service role).
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    const isAutomation = !user;
    if (!isAutomation && user?.role !== 'admin' && user?.role !== 'trainer') {
      return Response.json({ error: 'Forbidden: Admin/trainer access required' }, { status: 403 });
    }

    const vandaag = new Date();
    const zevenDagenGeleden = new Date(vandaag.getTime() - 7 * 24 * 60 * 60 * 1000);
    const zevenDagenVooruit = new Date(vandaag.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [nieuwsAlle, agendaAlle, uitgelichtAlle, abonnees] = await Promise.all([
      base44.asServiceRole.entities.Nieuwsbericht.filter({ gepubliceerd: true }, '-datum', 3),
      base44.asServiceRole.entities.AgendaItem.filter({ type: 'Wedstrijd' }),
      base44.asServiceRole.entities.UitgelichtWedstrijd.filter({ actief: true }),
      base44.asServiceRole.entities.Abonnee.filter({ actief: true, bevestigd: true }),
    ]);

    const komendWedstrijden = (agendaAlle || []).filter(i => {
      const d = new Date(i.date);
      return d >= vandaag && d <= zevenDagenVooruit;
    });
    const uitslagen = (agendaAlle || []).filter(i => {
      const d = new Date(i.date);
      return d >= zevenDagenGeleden && d < vandaag;
    });
    const uitgelicht = (uitgelichtAlle || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));

    if (!abonnees || abonnees.length === 0) {
      return Response.json({ status: "ok", verstuurd: 0, message: "Geen actieve abonnees." });
    }

    const subject = `MV Artemis · Week ${vandaag.getDate()} ${MAANDEN_LANG[vandaag.getMonth()]} — Nieuws & Uitslagen`;

    let verstuurd = 0;
    let mislukt = 0;
    for (const abonnee of abonnees) {
      try {
        const html = bouwNieuwsbrief({ abonnee, vandaag, nieuws: nieuwsAlle || [], komendWedstrijden, uitslagen, uitgelicht });
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: "MV Artemis",
          to: abonnee.email,
          subject,
          body: html,
        });
        verstuurd++;
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.error("[weekelijkseNieuwsbrief] mail error voor", abonnee.email, e);
        mislukt++;
      }
    }

    console.log(`Nieuwsbrief verstuurd naar ${verstuurd} abonnees (${mislukt} mislukt)`);
    return Response.json({ status: "ok", verstuurd, mislukt, totaal: abonnees.length });
  } catch (error) {
    console.error("[weekelijkseNieuwsbrief]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function bouwNieuwsbrief({ abonnee, vandaag, nieuws, komendWedstrijden, uitslagen, uitgelicht }) {
  const formatLangeDatum = (d) => new Date(d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatKorteDatum = (d) => new Date(d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  const weekLabel = `Week ${vandaag.getDate()} ${MAANDEN_KORT[vandaag.getMonth()]}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<style>
  body { margin: 0; padding: 0; background: #10121A; font-family: Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 0 0 40px; }
  .header { background: #1B2A5E; padding: 24px 32px; display: flex; align-items: center; }
  .logo { font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 2px; }
  .logo span { color: #FF6800; }
  .week-label { margin-left: auto; color: rgba(255,255,255,0.4); font-size: 12px; }
  .hero { background: #FF6800; padding: 32px; }
  .hero-tag { color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; }
  .hero h1 { color: #ffffff; font-size: 36px; margin: 0; line-height: 1.1; }
  .hero p { color: rgba(255,255,255,0.8); font-size: 14px; margin: 12px 0 0; line-height: 1.6; }
  .section { padding: 28px 32px; }
  .section-label { color: #FF6800; font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .nieuws-item { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .nieuws-item:last-child { border-bottom: none; margin-bottom: 0; }
  .nieuws-cat { display: inline-block; background: rgba(255,104,0,0.2); color: #FF6800; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 3px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .nieuws-titel { color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 8px; line-height: 1.2; }
  .nieuws-samen { color: rgba(255,255,255,0.55); font-size: 13px; line-height: 1.5; margin: 0 0 10px; }
  .lees-meer { color: #FF6800; font-size: 13px; font-weight: 600; text-decoration: none; }
  .wedstrijd { background: #1B2A5E; border-radius: 6px; padding: 14px 16px; margin-bottom: 8px; }
  .wed-team { color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
  .wed-teams { color: #ffffff; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .wed-info { color: rgba(255,255,255,0.45); font-size: 12px; }
  .uitslag { background: #202840; border-radius: 6px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .uitslag-teams { color: #ffffff; font-size: 14px; font-weight: 600; }
  .uitslag-score { color: #FF6800; font-size: 18px; font-weight: 700; }
  .uitgelicht { background: linear-gradient(135deg, #1B2A5E, #0F1630); border-radius: 6px; padding: 24px; margin-bottom: 24px; border-left: 3px solid #FF6800; }
  .uitgelicht-label { color: #FF6800; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
  .uitgelicht h2 { color: #ffffff; font-size: 28px; margin: 0 0 12px; }
  .uitgelicht-info { color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.6; }
  .cta-btn { display: inline-block; background: #FF6800; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 700; font-size: 14px; margin-top: 16px; }
  .footer { background: #1B2A5E; padding: 24px 32px; text-align: center; }
  .footer p { color: rgba(255,255,255,0.3); font-size: 12px; margin: 0 0 8px; line-height: 1.6; }
  .footer a { color: rgba(255,255,255,0.4); text-decoration: none; }
  .afmeld-link { color: rgba(255,255,255,0.25); font-size: 11px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">MV<span>/</span>ARTEMIS</div>
    <div class="week-label">${weekLabel}</div>
  </div>

  <div class="hero">
    <div class="hero-tag">Wekelijkse update</div>
    <h1>Jouw Ambitie.<br>Ons Doel.</h1>
    <p>Het laatste nieuws, uitslagen en aankondigingen van MV Artemis — samengevat voor jou.</p>
  </div>

  ${uitgelicht.length > 0 ? `
  <div class="section">
    <div class="section-label">Niet missen</div>
    <div class="uitgelicht">
      <div class="uitgelicht-label">${uitgelicht[0].titel || ''}</div>
      <h2>MV Artemis vs ${uitgelicht[0].tegenstander || ''}</h2>
      <div class="uitgelicht-info">
        📅 ${uitgelicht[0].datum ? formatLangeDatum(uitgelicht[0].datum) : ''}<br>
        🕐 ${uitgelicht[0].tijdstip || ''}<br>
        📍 ${uitgelicht[0].locatie || ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${nieuws.length > 0 ? `
  <div class="section">
    <div class="section-label">Laatste nieuws</div>
    ${nieuws.map(b => `
    <div class="nieuws-item">
      <div class="nieuws-cat">${b.categorie || ''}</div>
      <div class="nieuws-titel">${b.titel || ''}</div>
      <div class="nieuws-samen">${b.samenvatting || ''}</div>
      <a href="https://mv-artemis.nl/nieuws/${b.slug}" class="lees-meer">Lees verder →</a>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${uitslagen.length > 0 ? `
  <div class="section" style="background:#161A24; padding: 24px 32px;">
    <div class="section-label">Uitslagen</div>
    ${uitslagen.map(w => `
    <div class="uitslag">
      <div class="uitslag-teams">${w.title || 'MV Artemis'}</div>
      <div class="uitslag-score">${w.score_thuis ?? '-'} - ${w.score_uit ?? '-'}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${komendWedstrijden.length > 0 ? `
  <div class="section">
    <div class="section-label">Komende wedstrijden</div>
    ${komendWedstrijden.map(w => `
    <div class="wedstrijd">
      <div class="wed-team">${w.team || ''}</div>
      <div class="wed-teams">${w.title || ''}</div>
      <div class="wed-info">
        ${formatKorteDatum(w.date)}
        ${w.start_time ? '· ' + w.start_time : ''}
        ${w.location ? '· ' + w.location : ''}
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section" style="text-align: center;">
    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 16px;">Wil jij bij MV Artemis komen voetballen?</p>
    <a href="https://mv-artemis.nl/proeftraining" class="cta-btn">Proeftraining aanvragen →</a>
  </div>

  <div class="footer">
    <p>
      MV Artemis · Meiden Vereniging Artemis<br>
      Sportpark Douwekamp, Opeinde · info@mv-artemis.nl
    </p>
    <p><a href="https://mv-artemis.nl">mv-artemis.nl</a></p>
    <p>
      <a href="https://mv-artemis.nl/nieuwsbrief/afmelden?code=${abonnee.bevestigingscode}" class="afmeld-link">
        Afmelden voor deze nieuwsbrief
      </a>
    </p>
  </div>
</div>
</body>
</html>`;
}