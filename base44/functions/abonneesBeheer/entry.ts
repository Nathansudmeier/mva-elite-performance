import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'trainer') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      const list = await base44.asServiceRole.entities.Abonnee.list("-aangemeld_op");
      return Response.json({ abonnees: list || [] });
    }

    if (action === 'create') {
      const email = (body.email || "").trim().toLowerCase();
      if (!email) return Response.json({ error: 'email required' }, { status: 400 });
      const bestaand = await base44.asServiceRole.entities.Abonnee.filter({ email });
      if (bestaand && bestaand.length > 0) {
        return Response.json({ error: 'already_exists' }, { status: 409 });
      }
      const created = await base44.asServiceRole.entities.Abonnee.create({
        email,
        naam: body.naam || "",
        team_voorkeur: body.team_voorkeur || "Alle",
        actief: true,
        bevestigd: body.bevestigd !== false,
        bevestigingscode: crypto.randomUUID(),
        aangemeld_op: new Date().toISOString(),
      });
      return Response.json({ abonnee: created });
    }

    if (action === 'delete') {
      if (!body.id) return Response.json({ error: 'id required' }, { status: 400 });
      await base44.asServiceRole.entities.Abonnee.delete(body.id);
      return Response.json({ ok: true });
    }

    if (action === 'bulkCreate') {
      const items = body.items || [];
      const bestaande = await base44.asServiceRole.entities.Abonnee.list();
      const bestaandeEmails = new Set((bestaande || []).map(a => (a.email || "").toLowerCase()));
      let toegevoegd = 0;
      let alBestaand = 0;
      const nieuwe = [];
      for (const item of items) {
        const email = (item.email || "").toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
        if (bestaandeEmails.has(email)) { alBestaand++; continue; }
        const created = await base44.asServiceRole.entities.Abonnee.create({
          email,
          naam: item.naam || "",
          team_voorkeur: item.team_voorkeur || "Alle",
          actief: true,
          bevestigd: true,
          bevestigingscode: crypto.randomUUID(),
          aangemeld_op: new Date().toISOString(),
        });
        nieuwe.push(created);
        bestaandeEmails.add(email);
        toegevoegd++;
      }
      return Response.json({ toegevoegd, alBestaand, nieuwe });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    console.error("[abonneesBeheer]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});