import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const { naam, email, telefoon, huidige_club, huidig_team, leeftijd, positie, bericht } = body;

  if (!naam || !email || !telefoon || !huidige_club || !huidig_team || !leeftijd || !positie) {
    return Response.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const aanvraag = await base44.asServiceRole.entities.ProeftrainingAanvraag.create({
    naam, email, telefoon, huidige_club, huidig_team,
    leeftijd: Number(leeftijd),
    positie,
    bericht: bericht || "",
    datum: new Date().toISOString(),
    status: "nieuw",
  });

  return Response.json({ success: true, id: aanvraag.id });
});