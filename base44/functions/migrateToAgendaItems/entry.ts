import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results = { matches_migrated: 0, sessions_migrated: 0, errors: [] };

  // ─── Migrate Match records ───
  const matches = await base44.asServiceRole.entities.Match.list();
  const existingAgendaItems = await base44.asServiceRole.entities.AgendaItem.list();

  for (const match of matches) {
    // Skip if already linked
    const alreadyExists = existingAgendaItems.some(ai => ai.match_id === match.id);
    if (alreadyExists) continue;

    const title = match.opponent
      ? `${match.home_away === "Thuis" ? "Thuis" : "Uit"} vs ${match.opponent}`
      : "Wedstrijd";

    await base44.asServiceRole.entities.AgendaItem.create({
      type: "Wedstrijd",
      title,
      date: match.date,
      start_time: match.start_time || "14:00",
      team: match.team || "Beide",
      match_id: match.id,
      notes: match.notes || "",
    });
    results.matches_migrated++;
  }

  // ─── Migrate TrainingSession records ───
  const sessions = await base44.asServiceRole.entities.TrainingSession.list();

  // Re-fetch agenda items after match migration
  const updatedAgendaItems = await base44.asServiceRole.entities.AgendaItem.list();

  for (const session of sessions) {
    const alreadyExists = updatedAgendaItems.some(ai => ai.training_session_id === session.id);
    if (alreadyExists) continue;

    const typeMap = { "Training": "Training", "Wedstrijd": "Wedstrijd", "Fysieke Test": "Evenement" };
    const agendaType = typeMap[session.type] || "Training";

    await base44.asServiceRole.entities.AgendaItem.create({
      type: agendaType,
      title: session.type === "Training" ? "Training" : (session.type || "Training"),
      date: session.date,
      start_time: "19:00",
      team: "Beide",
      training_session_id: session.id,
      notes: session.notes || "",
    });
    results.sessions_migrated++;
  }

  return Response.json(results);
});