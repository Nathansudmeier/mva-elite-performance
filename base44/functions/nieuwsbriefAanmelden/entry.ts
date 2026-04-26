import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const naam = body.naam || "";
    const team_voorkeur = body.team_voorkeur || "Alle";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ status: "error", message: "Ongeldig e-mailadres" }, { status: 400 });
    }

    const bestaande = await base44.asServiceRole.entities.Abonnee.filter({ email });

    if (bestaande && bestaande.length > 0) {
      const ab = bestaande[0];
      if (ab.actief) {
        return Response.json({ status: "already_subscribed", message: "Je bent al aangemeld." });
      }
      // Hernieuwde aanmelding: weer activeren
      const code = ab.bevestigingscode || crypto.randomUUID();
      await base44.asServiceRole.entities.Abonnee.update(ab.id, {
        actief: true,
        bevestigd: true,
        bevestigingscode: code,
        naam: naam || ab.naam,
        team_voorkeur: team_voorkeur || ab.team_voorkeur,
      });
      // Best-effort welkomstmail (mag falen)
      try { await sendWelkomstmail(base44, email, code); } catch (e) { console.warn("[nieuwsbriefAanmelden] mail mislukt:", e?.message); }
      return Response.json({ status: "ok", message: "Aanmelding gelukt! Je ontvangt vanaf nu de wekelijkse nieuwsbrief." });
    }

    const code = crypto.randomUUID();
    await base44.asServiceRole.entities.Abonnee.create({
      email,
      naam,
      team_voorkeur,
      actief: true,
      bevestigd: true,
      bevestigingscode: code,
      aangemeld_op: new Date().toISOString(),
    });

    // Best-effort welkomstmail (mag falen — aanmelding blijft geldig)
    try { await sendWelkomstmail(base44, email, code); } catch (e) { console.warn("[nieuwsbriefAanmelden] mail mislukt:", e?.message); }

    return Response.json({ status: "ok", message: "Aanmelding gelukt! Je ontvangt vanaf nu de wekelijkse nieuwsbrief." });
  } catch (error) {
    console.error("[nieuwsbriefAanmelden]", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
});

async function sendWelkomstmail(base44, email, bevestigingscode) {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bevestig je aanmelding</title>
</head>
<body style="margin:0;padding:0;background:#10121A;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#10121A;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:#1B2A5E;padding:24px 32px;border-radius:8px 8px 0 0;">
      <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:2px;">
        MV<span style="color:#FF6800;">/</span>ARTEMIS
      </span>
    </td>
  </tr>

  <!-- ORANJE ACCENT LIJN -->
  <tr>
    <td style="background:#FF6800;height:3px;font-size:0;line-height:0;">&nbsp;</td>
  </tr>

  <!-- HERO SECTIE -->
  <tr>
    <td style="background:#151D35;padding:40px 32px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#FF6800;">
        NIEUWSBRIEF
      </p>
      <h1 style="margin:0 0 16px;font-size:36px;font-weight:700;color:#ffffff;line-height:1.1;">
        Welkom bij<br>MV Artemis.
      </h1>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;">
        Je bent aangemeld voor de wekelijkse nieuwsbrief van MV Artemis. Elke vrijdag om 18:00 ontvang je het laatste nieuws, uitslagen en aankondigingen van alle teams.
      </p>
    </td>
  </tr>

  <!-- WAT JE KUNT VERWACHTEN -->
  <tr>
    <td style="background:#10121A;padding:28px 32px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);">
        WAT JE KUNT VERWACHTEN
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="33%" style="padding:0 8px 0 0;vertical-align:top;">
            <table width="100%" cellpadding="12" cellspacing="0" border="0" style="background:#202840;border-radius:6px;">
              <tr><td>
                <p style="margin:0 0 6px;font-size:20px;">⚽</p>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ffffff;">Uitslagen</p>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;">
                  Alle resultaten van de week
                </p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 4px;vertical-align:top;">
            <table width="100%" cellpadding="12" cellspacing="0" border="0" style="background:#202840;border-radius:6px;">
              <tr><td>
                <p style="margin:0 0 6px;font-size:20px;">📰</p>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ffffff;">Nieuws</p>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;">
                  Laatste artikelen en updates
                </p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 0 0 8px;vertical-align:top;">
            <table width="100%" cellpadding="12" cellspacing="0" border="0" style="background:#202840;border-radius:6px;">
              <tr><td>
                <p style="margin:0 0 6px;font-size:20px;">📅</p>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ffffff;">Programma</p>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;">
                  Komende wedstrijden
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA KNOP -->
  <tr>
    <td style="background:#FF6800;padding:36px 32px;text-align:center;border-radius:0;">
      <h2 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;line-height:1;">
        Bedankt voor je<br>aanmelding!
      </h2>
      <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.75);">
        Vanaf nu ontvang je elke vrijdag om 18:00 de nieuwsbrief.
      </p>
      <a href="https://mv-artemis.nl/nieuws"
        style="display:inline-block;background:#ffffff;color:#FF6800;text-decoration:none;padding:16px 36px;border-radius:4px;font-weight:700;font-size:16px;letter-spacing:0.5px;">
        Bekijk laatste nieuws →
      </a>
    </td>
  </tr>

  <!-- QUOTE -->
  <tr>
    <td style="background:#0F1630;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:1px;">
        Jouw Ambitie.
        <span style="color:#FF6800;">Ons Doel.</span>
      </p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1B2A5E;padding:20px 32px;border-radius:0 0 8px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ffffff;">
              MV Artemis
            </p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;">
              Meiden Vereniging Artemis<br>
              Sportpark Douwekamp, Opeinde<br>
              info@mv-artemis.nl
            </p>
          </td>
          <td align="right" valign="top">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
              mv-artemis.nl
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,0.2);border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;">
        Je ontvangt deze mail omdat je je hebt aangemeld via mv-artemis.nl. Niet aangemeld? Dan kun je deze mail negeren.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendViaResend({
    to: email,
    subject: "Welkom bij de nieuwsbrief — MV Artemis",
    html,
  });
}

async function sendViaResend({ to, subject, html }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MV Artemis <nieuwsbrief@mv-artemis.nl>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
  return res.json();
}