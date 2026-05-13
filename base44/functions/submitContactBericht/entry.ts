import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const { naam, email, onderwerp, bericht } = body;

  if (!naam || !email || !onderwerp || !bericht) {
    return Response.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const record = await base44.asServiceRole.entities.ContactBericht.create({
    naam, email, onderwerp, bericht,
    datum: new Date().toISOString(),
    status: "nieuw",
  });

  return Response.json({ success: true, id: record.id });
});