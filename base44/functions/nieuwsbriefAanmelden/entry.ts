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
      if (ab.bevestigd && ab.actief) {
        return Response.json({ status: "already_subscribed", message: "Je bent al aangemeld." });
      }
      // Hernieuwde aanmelding: actief weer aanzetten en mail opnieuw sturen indien niet bevestigd
      const code = ab.bevestigingscode || crypto.randomUUID();
      await base44.asServiceRole.entities.Abonnee.update(ab.id, {
        actief: true,
        bevestigingscode: code,
        naam: naam || ab.naam,
        team_voorkeur: team_voorkeur || ab.team_voorkeur,
      });
      if (!ab.bevestigd) {
        await sendBevestigingsmail(base44, email, code);
      }
      return Response.json({ status: "ok", message: "Check je inbox voor de bevestigingslink." });
    }

    const code = crypto.randomUUID();
    await base44.asServiceRole.entities.Abonnee.create({
      email,
      naam,
      team_voorkeur,
      actief: true,
      bevestigd: false,
      bevestigingscode: code,
      aangemeld_op: new Date().toISOString(),
    });

    await sendBevestigingsmail(base44, email, code);

    return Response.json({ status: "ok", message: "Check je inbox voor de bevestigingslink." });
  } catch (error) {
    console.error("[nieuwsbriefAanmelden]", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
});

async function sendBevestigingsmail(base44, email, code) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { margin: 0; padding: 0; background: #10121A; font-family: Arial, sans-serif; }
  .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 2px; margin-bottom: 32px; }
  .logo span { color: #FF6800; }
  .card { background: #1B2A5E; border-radius: 8px; padding: 32px; margin-bottom: 24px; }
  h1 { color: #ffffff; font-size: 32px; margin: 0 0 12px; line-height: 1.1; }
  p { color: rgba(255,255,255,0.65); font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
  .btn { display: inline-block; background: #FF6800; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 700; font-size: 15px; }
  .footer { color: rgba(255,255,255,0.25); font-size: 12px; text-align: center; margin-top: 32px; line-height: 1.6; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">MV<span>/</span>ARTEMIS</div>
  <div class="card">
    <h1>Bevestig je aanmelding.</h1>
    <p>Je hebt je aangemeld voor de wekelijkse nieuwsbrief van MV Artemis. Klik op de knop hieronder om je aanmelding te bevestigen.</p>
    <a href="https://mv-artemis.nl/nieuwsbrief/bevestig?code=${code}" class="btn">
      Bevestig aanmelding →
    </a>
  </div>
  <div class="footer">
    MV Artemis · Meiden Vereniging Artemis<br>
    Sportpark Douwekamp, Opeinde<br>
    info@mv-artemis.nl
  </div>
</div>
</body>
</html>`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    from_name: "MV Artemis",
    to: email,
    subject: "Bevestig je aanmelding — MV Artemis",
    body: html,
  });
}