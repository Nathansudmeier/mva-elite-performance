import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all AgendaItems of type Wedstrijd or Toernooi without a match_id
  const allItems = await base44.asServiceRole.entities.AgendaItem.list();
  const toMigrate = allItems.filter(ai =>
    (ai.type === 'Wedstrijd' || ai.type === 'Toernooi') && !ai.match_id
  );

  let created = 0;
  for (const ai of toMigrate) {
    const teams = ai.team === 'Beide' ? ['MO17', 'Dames 1'] : [ai.team];
    for (const team of teams) {
      const match = await base44.asServiceRole.entities.Match.create({
        opponent: ai.title,
        date: ai.date,
        start_time: ai.start_time || '',
        home_away: ai.home_away === 'Neutraal' ? 'Thuis' : (ai.home_away || 'Thuis'),
        team,
      });
      await base44.asServiceRole.entities.AgendaItem.update(ai.id, { match_id: match.id });
      created++;
    }
  }

  return Response.json({ migrated: toMigrate.length, match_records_created: created });
});