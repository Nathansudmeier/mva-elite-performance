import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // 3 parallelle batches van 3 calls — sneller dan sequentieel, maar voorkomt rate limits
  const [instellingen, prestaties, players] = await Promise.all([
    base44.asServiceRole.entities.WebsiteInstellingen.list(),
    base44.asServiceRole.entities.Prestatie.list(),
    base44.asServiceRole.entities.Player.filter({ active: true }, null, 200),
  ]);

  const [agendaItems, trainers, matches] = await Promise.all([
    base44.asServiceRole.entities.AgendaItem.filter({ type: "Wedstrijd" }, null, 500),
    base44.asServiceRole.entities.Trainer.filter({ active: true }),
    base44.asServiceRole.entities.Match.list("-date", 500),
  ]);

  const [nieuwsberichten, uitgelichteWedstrijden, sponsors] = await Promise.all([
    base44.asServiceRole.entities.Nieuwsbericht.filter({ gepubliceerd: true }, "-datum", 100),
    base44.asServiceRole.entities.UitgelichtWedstrijd.list(),
    base44.asServiceRole.entities.Sponsor.list(),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const activeUitgelicht = (uitgelichteWedstrijden || [])
    .filter(w => w.actief !== false && w.datum && w.datum >= today)
    .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));

  const liveMatches = (matches || []).filter(m => m.live_status === "live" || m.live_status === "halftime");

  const activeSponsors = (sponsors || []).filter(s => s.actief !== false).sort((a, b) => a.tier - b.tier || a.volgorde - b.volgorde);

  const body = JSON.stringify({
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

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Browser cache 60s, CDN 60s, en mag 5 min stale tonen tijdens revalidate
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
});