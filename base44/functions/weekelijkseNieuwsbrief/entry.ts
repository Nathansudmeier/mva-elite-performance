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
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MV Artemis Nieuwsbrief</title>
</head>
<body style="margin:0;padding:0;background-color:#10121A;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#10121A;">
<tr><td align="center" style="padding:32px 16px;">

<table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#1B2A5E;padding:20px 32px;border-radius:8px 8px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${logoUrl ? `
                <td valign="middle" style="padding-right:12px;">
                  <img src="${logoUrl}" alt="MV Artemis" width="36" height="36" style="display:block;width:36px;height:36px;border:0;outline:none;" />
                </td>
                ` : ''}
                <td valign="middle">
                  <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;font-family:Arial,sans-serif;">
                    MV<span style="color:#FF6800;">/</span>ARTEMIS
                  </span>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <span style="font-size:12px;color:rgba(255,255,255,0.3);font-family:Arial,sans-serif;">
              Week ${dag} ${maand}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ORANJE LIJN -->
  <tr>
    <td style="background-color:#FF6800;height:3px;font-size:0;line-height:0;">&nbsp;</td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="background-color:#151D35;padding:36px 32px;">
      <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#FF6800;font-family:Arial,sans-serif;">
        WEKELIJKSE UPDATE
      </p>
      <h1 style="margin:0 0 14px 0;font-size:34px;font-weight:700;color:#ffffff;line-height:1.1;font-family:Arial,sans-serif;">
        Jouw Ambitie.<br/>Ons Doel.
      </h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;font-family:Arial,sans-serif;">
        Het laatste nieuws, uitslagen en aankondigingen van MV Artemis — samengevat voor jou.
      </p>
    </td>
  </tr>

  ${uitgelicht.length > 0 ? `
  <!-- UITGELICHTE WEDSTRIJD -->
  <tr>
    <td style="background-color:#10121A;padding:28px 32px 0;">
      <p style="margin:0 0 14px 0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#FF6800;font-family:Arial,sans-serif;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
        NIET MISSEN
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1B2A5E;border-radius:6px;border-left:3px solid #FF6800;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FF6800;font-family:Arial,sans-serif;">
              ${uitgelicht[0].titel || ''}
            </p>
            <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">
              MV Artemis vs ${uitgelicht[0].tegenstander || ''}
            </h2>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.8;font-family:Arial,sans-serif;">
              📅 ${uitgelicht[0].datum ? new Date(uitgelicht[0].datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}<br/>
              🕐 ${uitgelicht[0].tijdstip || ''}<br/>
              📍 ${uitgelicht[0].locatie || ''}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ` : ''}

  ${nieuws.length > 0 ? `
  <!-- LAATSTE NIEUWS -->
  <tr>
    <td style="background-color:#10121A;padding:28px 32px 0;">
      <p style="margin:0 0 16px 0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#FF6800;font-family:Arial,sans-serif;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
        LAATSTE NIEUWS
      </p>
      ${nieuws.map((b, i) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:${i < nieuws.length - 1 ? '20px' : '0'};padding-bottom:${i < nieuws.length - 1 ? '20px' : '0'};border-bottom:${i < nieuws.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'};">
        <tr>
          <td>
            <p style="margin:0 0 6px 0;display:inline-block;background-color:rgba(255,104,0,0.2);color:#FF6800;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;">
              ${b.categorie || ''}
            </p>
            ${b.team && b.team !== 'Alle' ? `
            <p style="margin:0 0 6px 8px;display:inline-block;background-color:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;">
              ${b.team}
            </p>
            ` : ''}
            <h3 style="margin:8px 0 8px 0;font-size:17px;font-weight:700;color:#ffffff;line-height:1.2;font-family:Arial,sans-serif;">
              ${b.titel || ''}
            </h3>
            ${b.samenvatting ? `
            <p style="margin:0 0 8px 0;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;font-style:italic;font-family:Arial,sans-serif;">
              ${b.samenvatting}
            </p>
            ` : ''}
            <p style="margin:0 0 10px 0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;font-family:Arial,sans-serif;">
              ${eersteAlinea(b.inhoud)}
              <a href="https://mv-artemis.nl/nieuws/${b.slug}" style="color:#FF6800;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;white-space:nowrap;">
                Lees verder →
              </a>
            </p>
          </td>
        </tr>
      </table>
      `).join('')}
    </td>
  </tr>
  ` : ''}

  ${uitslagen.length > 0 ? `
  <!-- UITSLAGEN -->
  <tr>
    <td style="background-color:#161A24;padding:28px 32px;">
      <p style="margin:0 0 16px 0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#FF6800;font-family:Arial,sans-serif;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
        UITSLAGEN
      </p>
      ${uitslagen.map(w => `
      <table width="100%" cellpadding="12" cellspacing="0" border="0" style="background-color:#202840;border-radius:6px;margin-bottom:8px;">
        <tr>
          <td style="font-size:13px;font-weight:600;color:#ffffff;font-family:Arial,sans-serif;">
            ${w.titel || 'MV Artemis'}
          </td>
          <td align="right" style="font-size:20px;font-weight:700;color:#FF6800;font-family:Arial,sans-serif;">
            ${w.score_thuis ?? ''} - ${w.score_uit ?? ''}
          </td>
        </tr>
      </table>
      `).join('')}
    </td>
  </tr>
  ` : ''}

  ${komendWedstrijden.length > 0 ? `
  <!-- KOMENDE WEDSTRIJDEN -->
  <tr>
    <td style="background-color:#10121A;padding:28px 32px;">
      <p style="margin:0 0 16px 0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#FF6800;font-family:Arial,sans-serif;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
        KOMENDE WEDSTRIJDEN
      </p>
      ${komendWedstrijden.map(w => `
      <table width="100%" cellpadding="14" cellspacing="0" border="0" style="background-color:#1B2A5E;border-radius:6px;margin-bottom:8px;">
        <tr>
          <td>
            ${w.team ? `
            <p style="margin:0 0 4px 0;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);font-family:Arial,sans-serif;">
              ${w.team}
            </p>
            ` : ''}
            <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">
              ${w.titel || ''}
            </p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">
              ${w.datum ? new Date(w.datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
              ${w.tijdstip ? ' · ' + w.tijdstip : ''}
              ${w.locatie ? ' · ' + w.locatie : ''}
            </p>
          </td>
        </tr>
      </table>
      `).join('')}
    </td>
  </tr>
  ` : ''}

  <!-- CTA -->
  <tr>
    <td style="background-color:#FF6800;padding:32px;text-align:center;">
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.7);font-family:Arial,sans-serif;">
        MELD JE AAN
      </p>
      <h2 style="margin:0 0 8px 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.1;font-family:Arial,sans-serif;">
        Wil jij bij MV Artemis<br/>komen voetballen?
      </h2>
      <p style="margin:0 0 20px 0;font-size:13px;color:rgba(255,255,255,0.75);font-family:Arial,sans-serif;">
        Kom een proeftraining doen. Kijk of het klikt.
      </p>
      <a href="https://mv-artemis.nl/proeftraining" style="display:inline-block;background-color:#ffffff;color:#FF6800;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:700;font-size:15px;font-family:Arial,sans-serif;">
        Proeftraining aanvragen →
      </a>
    </td>
  </tr>

  <!-- QUOTE -->
  <tr>
    <td style="background-color:#0F1630;padding:24px 32px;text-align:center;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:1px;font-family:Arial,sans-serif;">
        Jouw Ambitie. <span style="color:#FF6800;">Ons Doel.</span>
      </p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background-color:#1B2A5E;padding:20px 32px;border-radius:0 0 8px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">
              MV Artemis
            </p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;font-family:Arial,sans-serif;">
              Meiden Vereniging Artemis<br/>
              Sportpark Douwekamp, Opeinde<br/>
              info@mv-artemis.nl
            </p>
          </td>
          <td align="right" valign="top">
            <a href="https://mv-artemis.nl" style="font-size:12px;color:rgba(255,255,255,0.3);text-decoration:none;font-family:Arial,sans-serif;">
              mv-artemis.nl
            </a>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">
        <tr>
          <td>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);font-family:Arial,sans-serif;">
              Je ontvangt deze mail omdat je je hebt aangemeld via mv-artemis.nl.
            </p>
          </td>
          <td align="right">
            <a href="https://mv-artemis.nl/nieuwsbrief/afmelden?code=${abonnee.bevestigingscode}" style="font-size:11px;color:rgba(255,255,255,0.25);text-decoration:underline;font-family:Arial,sans-serif;">
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