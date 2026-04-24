import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const [instellingen, prestaties, players, agendaItems, trainers, matches] = await Promise.all([
    base44.asServiceRole.entities.WebsiteInstellingen.list(),
    base44.asServiceRole.entities.Prestatie.list(),
    base44.asServiceRole.entities.Player.filter({ active: true }, null, 200),
    base44.asServiceRole.entities.AgendaItem.filter({ type: "Wedstrijd" }, null, 500),
    base44.asServiceRole.entities.Trainer.filter({ active: true }),
    base44.asServiceRole.entities.Match.list("-date", 500),
  ]);

  const sponsors = await base44.asServiceRole.entities.Sponsor.list();

  const liveMatches = (matches || []).filter(m => m.live_status === "live" || m.live_status === "halftime");

  const activeSponsors = (sponsors || []).filter(s => s.actief !== false).sort((a, b) => a.tier - b.tier || a.volgorde - b.volgorde);

  return Response.json({
    instellingen: instellingen?.[0] || null,
    prestaties: (prestaties || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)),
    players: players || [],
    wedstrijden: agendaItems || [],
    trainers: trainers || [],
    matches: matches || [],
    liveMatches: liveMatches,
    sponsors: activeSponsors,
  });
});