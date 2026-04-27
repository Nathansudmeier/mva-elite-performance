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

    const [nieuwsAlle, agendaAlle, matchesAlle, uitgelichtAlle, abonnees, instellingen] = await Promise.all([
      base44.asServiceRole.entities.Nieuwsbericht.filter({ gepubliceerd: true }, '-datum', 3),
      base44.asServiceRole.entities.AgendaItem.filter({ type: 'Wedstrijd' }),
      base44.asServiceRole.entities.Match.list('-date', 100),
      base44.asServiceRole.entities.UitgelichtWedstrijd.filter({ actief: true }),
      base44.asServiceRole.entities.Abonnee.filter({ actief: true, bevestigd: true }),
      base44.asServiceRole.entities.WebsiteInstellingen.list(),
    ]);
    const logoUrl = instellingen?.[0]?.logo_url || '';

    const komendWedstrijden = (agendaAlle || [])
      .filter(i => {
        const d = new Date(i.date);
        return d >= vandaag && d <= zevenDagenVooruit;
      })
      .map(i => ({
        team: i.team || '',
        titel: i.title || '',
        datum: i.date,
        tijdstip: i.start_time || '',
        locatie: i.location || '',
      }));

    // Uitslagen uit Match entity (met score_home/score_away)
    const uitslagen = (matchesAlle || [])
      .filter(m => {
        if (m.score_home == null || m.score_away == null) return false;
        const d = new Date(m.date);
        return d >= zevenDagenGeleden && d < vandaag;
      })
      .map(m => ({
        team: m.team || '',
        titel: `${m.home_away === 'Uit' ? m.opponent : 'MV Artemis'} - ${m.home_away === 'Uit' ? 'MV Artemis' : m.opponent}`,
        score_thuis: m.home_away === 'Uit' ? m.score_away : m.score_home,
        score_uit: m.home_away === 'Uit' ? m.score_home : m.score_away,
      }));

    const uitgelicht = (uitgelichtAlle || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
    const nieuws = nieuwsAlle || [];

    if (!abonnees || abonnees.length === 0) {
      return Response.json({ status: "ok", verstuurd: 0, message: "Geen actieve abonnees." });
    }

    const dag = vandaag.getDate();
    const maand = MAANDEN_KORT[vandaag.getMonth()];
    const subject = `MV Artemis · Week ${dag} ${MAANDEN_LANG[vandaag.getMonth()]} — Nieuws & Uitslagen`;

    let verstuurd = 0;
    let mislukt = 0;
    for (const abonnee of abonnees) {
      try {
        const html = nieuwsbriefHtml({ abonnee, dag, maand, nieuws, komendWedstrijden, uitslagen, uitgelicht, logoUrl });
        const text = nieuwsbriefText({ abonnee, nieuws, komendWedstrijden, uitgelicht });
        await sendViaResend({ to: abonnee.email, subject, html, text });
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

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MV Artemis <nieuwsbrief@nieuwsbrief.mv-artemis.nl>",
      reply_to: "info@mv-artemis.nl",
      to: [to],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
  return res.json();
}

function eersteAlinea(inhoud) {
  if (!inhoud) return '';
  const tekst = inhoud.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return tekst.length > 200 ? tekst.slice(0, 200) + '… ' : tekst + ' ';
}

function nieuwsbriefText({ abonnee, nieuws, komendWedstrijden, uitgelicht }) {
  return `
MV Artemis — Wekelijkse Update

Jouw Ambitie. Ons Doel.

${uitgelicht.length > 0 ? `
NIET MISSEN: ${uitgelicht[0].titel}
MV Artemis vs ${uitgelicht[0].tegenstander}
${uitgelicht[0].datum} · ${uitgelicht[0].tijdstip}
${uitgelicht[0].locatie}
` : ''}

LAATSTE NIEUWS
${nieuws.map(b => `
${b.titel}
${b.samenvatting || ''}
Lees meer: https://mv-artemis.nl/nieuws/${b.slug}
`).join('\n')}

KOMENDE WEDSTRIJDEN
${komendWedstrijden.map(w => `
${w.team || ''} · ${w.titel}
${w.datum} · ${w.tijdstip || ''} · ${w.locatie || ''}
`).join('\n')}

---
MV Artemis · Meiden Vereniging Artemis
Sportpark Douwekamp, Opeinde
info@mv-artemis.nl · mv-artemis.nl

Afmelden: https://mv-artemis.nl/nieuwsbrief/afmelden?code=${abonnee.bevestigingscode}
  `.trim();
}

function nieuwsbriefHtml({ abonnee, dag, maand, nieuws, komendWedstrijden, uitslagen, uitgelicht, logoUrl }) {
  const fontLink = `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&display=swap`;

  const sectionLabel = (text) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr>
        <td style="white-space:nowrap;padding-right:12px;font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#FF6800;font-family:'Barlow Condensed',Arial,sans-serif;vertical-align:middle;">
          ${text}
        </td>
        <td width="100%" style="vertical-align:middle;">
          <div style="height:1px;background:#F0E8E0;font-size:0;line-height:0;">&nbsp;</div>
        </td>
      </tr>
    </table>`;

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MV Artemis Nieuwsbrief</title>
  <link href="${fontLink}" rel="stylesheet" type="text/css"/>
</head>
<body style="margin:0;padding:0;background-color:#F0E8DC;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F0E8DC;">
<tr><td align="center" style="padding:32px 16px;">

<table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#FFF8F2;border-radius:16px;overflow:hidden;border:1px solid #E8E0D8;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#FF6800;padding:16px 24px;border-radius:16px 16px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/d45d4be0f_artemis-logo.png" alt="MV Artemis" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:50%;border:0;outline:none;" />
                </td>
                <td valign="middle">
                  <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:0px;font-family:'Barlow Condensed',Arial,sans-serif;display:block;line-height:1.1;">
                    MV/ARTEMIS
                  </span>
                  <span style="font-size:11px;color:rgba(255,255,255,0.75);font-family:'Barlow',Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">
                    Meiden Vereniging Artemis
                  </span>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <span style="font-size:12px;color:#ffffff;font-family:'Barlow',Arial,sans-serif;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.35);border-radius:20px;padding:4px 12px;display:inline-block;">
              Week ${dag} ${maand}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="background-color:#1A1A2E;padding:28px 28px 24px;position:relative;overflow:hidden;">
      <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FF6800;font-family:'Barlow',Arial,sans-serif;">
        WEKELIJKSE UPDATE
      </p>
      <h1 style="margin:0 0 16px 0;font-size:40px;font-weight:900;color:#ffffff;line-height:1.0;letter-spacing:-0.5px;font-family:'Barlow Condensed',Arial,sans-serif;">
        Jouw <span style="color:#FF6800;">Ambitie.</span><br/>Ons Doel.
      </h1>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:8px;">
            <span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:4px 12px;display:inline-block;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#FF6800;vertical-align:middle;margin-right:6px;"></span>
              <span style="font-size:12px;color:#ffffff;font-family:'Barlow',Arial,sans-serif;">Nieuws</span>
            </span>
          </td>
          <td style="padding-right:8px;">
            <span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:4px 12px;display:inline-block;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#FF6800;vertical-align:middle;margin-right:6px;"></span>
              <span style="font-size:12px;color:#ffffff;font-family:'Barlow',Arial,sans-serif;">Uitslagen</span>
            </span>
          </td>
          <td>
            <span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:4px 12px;display:inline-block;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#FF6800;vertical-align:middle;margin-right:6px;"></span>
              <span style="font-size:12px;color:#ffffff;font-family:'Barlow',Arial,sans-serif;">Wedstrijden</span>
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BODY START -->
  <tr>
    <td style="background-color:#FFF8F2;padding:0;">
      <div style="position:relative;overflow:hidden;background:#FFF8F2;padding:28px 20px 24px;">

        <div style="position:relative;z-index:1;">

      ${uitgelicht.length > 0 ? `
      <!-- UITGELICHTE WEDSTRIJD -->
      ${sectionLabel('NIET MISSEN')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;border:1.5px solid #1A1A2E;box-shadow:3px 3px 0 #1A1A2E;margin-bottom:28px;overflow:hidden;">
        <tr>
          <td style="background-color:#FF6800;padding:8px 16px;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ffffff;letter-spacing:1px;font-family:'Barlow',Arial,sans-serif;">
              ${uitgelicht[0].titel || 'De Topper'}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 18px 20px;">
            <h2 style="margin:0 0 6px 0;font-size:26px;font-weight:900;color:#1A1A2E;line-height:1.1;font-family:'Barlow Condensed',Arial,sans-serif;">
              MV Artemis vs ${uitgelicht[0].tegenstander || ''}
            </h2>
            <p style="margin:0 0 14px 0;font-size:13px;font-weight:600;color:#FF6800;font-family:'Barlow',Arial,sans-serif;">
              ${uitgelicht[0].team || ''} · Eredivisie Women
            </p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:4px;">
                  <span style="font-size:12px;color:#888;font-family:'Barlow',Arial,sans-serif;">
                    📅&nbsp;${uitgelicht[0].datum ? new Date(uitgelicht[0].datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:4px;">
                  <span style="font-size:12px;color:#888;font-family:'Barlow',Arial,sans-serif;">
                    🕐&nbsp;${uitgelicht[0].tijdstip || ''}
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span style="font-size:12px;color:#888;font-family:'Barlow',Arial,sans-serif;">
                    📍&nbsp;${uitgelicht[0].locatie || ''}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ` : ''}

      ${nieuws.length > 0 ? `
      <!-- LAATSTE NIEUWS -->
      ${sectionLabel('LAATSTE NIEUWS')}
      ${nieuws.map((b, i) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:14px;border:1px solid #EEE7DF;margin-bottom:12px;overflow:hidden;">
        <tr>
          <td style="padding:16px;">
            <table cellpadding="0" cellspacing="4" border="0" style="margin-bottom:8px;">
              <tr>
                <td>
                  <span style="display:inline-block;background:#FFF0E6;color:#CC5500;border:1px solid #FFD4B0;border-radius:20px;font-size:10px;font-weight:700;padding:2px 10px;letter-spacing:0.5px;text-transform:uppercase;font-family:'Barlow',Arial,sans-serif;">
                    ${b.categorie || ''}
                  </span>
                </td>
                ${b.team && b.team !== 'Alle' ? `
                <td>
                  <span style="display:inline-block;background:#F0F0F0;color:#555;border:1px solid #DDD;border-radius:20px;font-size:10px;font-weight:700;padding:2px 10px;letter-spacing:0.5px;text-transform:uppercase;font-family:'Barlow',Arial,sans-serif;">
                    ${b.team}
                  </span>
                </td>
                ` : ''}
              </tr>
            </table>
            <h3 style="margin:0 0 4px 0;font-size:20px;font-weight:800;color:#1A1A2E;line-height:1.2;font-family:'Barlow Condensed',Arial,sans-serif;">
              ${b.titel || ''}
            </h3>
            ${b.datum ? `<p style="margin:0 0 8px 0;font-size:11px;color:#AAA;font-style:italic;font-family:'Barlow',Arial,sans-serif;">${new Date(b.datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
            ${b.samenvatting ? `<p style="margin:0 0 8px 0;font-size:13px;color:#555;line-height:1.6;font-family:'Barlow',Arial,sans-serif;">${b.samenvatting}</p>` : ''}
            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;font-family:'Barlow',Arial,sans-serif;">
              ${eersteAlinea(b.inhoud)}<a href="https://mv-artemis.nl/nieuws/${b.slug}" style="color:#FF6800;font-weight:700;text-decoration:none;font-size:12px;font-family:'Barlow',Arial,sans-serif;white-space:nowrap;">Lees verder →</a>
            </p>
          </td>
        </tr>
      </table>
      `).join('')}
      <div style="height:16px;">&nbsp;</div>
      ` : ''}

      ${uitslagen.length > 0 ? `
      <!-- UITSLAGEN -->
      ${sectionLabel('UITSLAGEN')}
      <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:800;color:#1A1A2E;font-family:'Barlow Condensed',Arial,sans-serif;">
        Resultaten van <span style="color:#FF6800;">deze week</span>
      </h2>
      ${uitslagen.map(w => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #EEE7DF;margin-bottom:8px;overflow:hidden;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0 0 2px 0;font-size:10px;text-transform:uppercase;color:#AAA;font-family:'Barlow',Arial,sans-serif;">${w.team || 'MV Artemis'}</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#1A1A2E;font-family:'Barlow Condensed',Arial,sans-serif;">${w.titel || ''}</p>
          </td>
          <td align="right" style="background-color:#1A1A2E;min-width:72px;padding:12px 16px;vertical-align:middle;">
            <span style="font-size:22px;font-weight:900;color:#FF6800;font-family:'Barlow Condensed',Arial,sans-serif;white-space:nowrap;">
              ${w.score_thuis ?? ''} - ${w.score_uit ?? ''}
            </span>
          </td>
        </tr>
      </table>
      `).join('')}
      <div style="height:16px;">&nbsp;</div>
      ` : ''}

      ${komendWedstrijden.length > 0 ? `
      <!-- KOMENDE WEDSTRIJDEN -->
      ${sectionLabel('KOMENDE WEDSTRIJDEN')}
      ${komendWedstrijden.map((w, i) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #EEE7DF;margin-bottom:8px;overflow:hidden;">
        <tr>
          <td style="width:44px;min-width:44px;padding:12px 0 12px 12px;vertical-align:top;">
            <div style="width:44px;height:44px;border-radius:10px;background-color:${i === 0 ? '#FF6800' : '#1A1A2E'};text-align:center;display:inline-block;vertical-align:top;">
              <div style="padding-top:6px;">
                <span style="display:block;font-size:20px;font-weight:900;color:#ffffff;line-height:1;font-family:'Barlow Condensed',Arial,sans-serif;">
                  ${w.datum ? new Date(w.datum).getDate() : '?'}
                </span>
                <span style="display:block;font-size:8px;text-transform:uppercase;color:rgba(255,255,255,0.8);font-family:'Barlow',Arial,sans-serif;">
                  ${w.datum ? MAANDEN_KORT[new Date(w.datum).getMonth()] : ''}
                </span>
              </div>
            </div>
          </td>
          <td style="padding:12px 14px;vertical-align:middle;">
            ${w.team ? `<p style="margin:0 0 2px 0;font-size:9px;text-transform:uppercase;color:#FF6800;letter-spacing:0.5px;font-family:'Barlow',Arial,sans-serif;">${w.team}</p>` : ''}
            <p style="margin:0 0 2px 0;font-size:17px;font-weight:800;color:#1A1A2E;line-height:1.1;font-family:'Barlow Condensed',Arial,sans-serif;">${w.titel || ''}</p>
            <p style="margin:0;font-size:11px;color:#999;font-family:'Barlow',Arial,sans-serif;">
              ${w.tijdstip ? w.tijdstip + ' · ' : ''}${w.locatie || ''}
            </p>
          </td>
        </tr>
      </table>
      `).join('')}
      <div style="height:16px;">&nbsp;</div>
      ` : ''}

        </div><!-- /z-index wrapper -->
      </div><!-- /overflow:hidden wrapper -->
    </td>
  </tr>
  <!-- BODY END -->

  <!-- CTA -->
  <tr>
    <td style="background-color:#1A1A2E;padding:28px 24px;text-align:center;position:relative;overflow:hidden;">
      <p style="margin:0 0 6px 0;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#FF6800;font-family:'Barlow',Arial,sans-serif;">
        MELD JE AAN
      </p>
      <h2 style="margin:0 0 8px 0;font-size:28px;font-weight:900;color:#ffffff;line-height:1.1;font-family:'Barlow Condensed',Arial,sans-serif;">
        Wil jij bij MV Artemis<br/>komen voetballen?
      </h2>
      <p style="margin:0 0 20px 0;font-size:13px;color:rgba(255,255,255,0.6);font-family:'Barlow',Arial,sans-serif;">
        Kom een proeftraining doen. Kijk of het klikt.
      </p>
      <a href="https://mv-artemis.nl/proeftraining" style="display:inline-block;background-color:#FF6800;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:800;font-size:16px;font-family:'Barlow Condensed',Arial,sans-serif;border:2px solid rgba(255,255,255,0.2);">
        Proeftraining aanvragen →
      </a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background-color:#F5EDE4;border-top:1px solid #E8DDD4;padding:20px 24px;border-radius:0 0 16px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle">
            <p style="margin:0 0 2px 0;font-size:18px;font-weight:900;color:#1A1A2E;font-family:'Barlow Condensed',Arial,sans-serif;">
              Jouw Ambitie. <span style="color:#FF6800;">Ons Doel.</span>
            </p>
            <p style="margin:0;font-size:11px;color:#999;font-family:'Barlow',Arial,sans-serif;">
              Sportpark Douwekamp, Opeinde · info@mv-artemis.nl
            </p>
          </td>
          <td align="right" valign="middle">
            <a href="https://mv-artemis.nl/nieuwsbrief/afmelden?code=${abonnee.bevestigingscode}" style="font-size:11px;color:#BBB;text-decoration:underline;font-family:'Barlow',Arial,sans-serif;">
              Afmelden
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>
`;
}