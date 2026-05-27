import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  const { sessie_id, berichten, eerste_bericht, aantal_berichten, pagina, datum, doorverwezen_naar, afgerond } = body;

  if (!sessie_id) {
    return Response.json({ error: 'sessie_id vereist' }, { status: 400 });
  }

  const bestaand = await base44.asServiceRole.entities.ChatbotConversatie.filter({ sessie_id });

  const payload = {
    sessie_id,
    berichten: berichten || '',
    eerste_bericht: eerste_bericht || '',
    aantal_berichten: aantal_berichten || 0,
    pagina: pagina || '/',
    datum: datum || new Date().toISOString(),
    doorverwezen_naar: doorverwezen_naar || null,
    afgerond: afgerond || false,
  };

  if (bestaand && bestaand.length > 0) {
    await base44.asServiceRole.entities.ChatbotConversatie.update(bestaand[0].id, payload);
    return Response.json({ success: true, id: bestaand[0].id });
  } else {
    const nieuw = await base44.asServiceRole.entities.ChatbotConversatie.create(payload);
    return Response.json({ success: true, id: nieuw.id });
  }
});