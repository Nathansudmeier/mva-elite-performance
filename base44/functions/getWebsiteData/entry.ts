import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Sequentieel ophalen om rate limits te voorkomen
  const instellingen = await base44.asServiceRole.entities.WebsiteInstellingen.list();
  const prestaties = await base44.asServiceRole.entities.Prestatie.list();
  const players = await base44.asServiceRole.entities.Player.filter({ active: true }, null, 200);
  const agendaItems = await base44.asServiceRole.entities.AgendaItem.filter({ type: "Wedstrijd" }, null, 500);
  const trainers = await base44.asServiceRole.entities.Trainer.filter({ active: true });
  const matches = await base44.asServiceRole.entities.Match.list("-date", 500);
  const nieuwsberichten = await base44.asServiceRole.entities.Nieuwsbericht.filter({ gepubliceerd: true }, "-datum", 100);
  const uitgelichteWedstrijden = await base44.asServiceRole.entities.UitgelichtWedstrijd.list();
  const sponsors = await base44.asServiceRole.entities.Sponsor.list();

  const today = new Date().toISOString().split("T")[0];
  const activeUitgelicht = (uitgelichteWedstrijden || [])
    .filter(w => w.actief !== false && w.datum && w.datum >= today)
    .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));

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
    nieuwsberichten: nieuwsberichten || [],
    uitgelichteWedstrijden: activeUitgelicht,
  });
});