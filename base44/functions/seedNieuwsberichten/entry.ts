import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if berichten already exist
    const existing = await base44.entities.Nieuwsbericht.list();
    if (existing && existing.length > 0) {
      return Response.json({ message: 'Berichten already seeded' });
    }

    // Seed data
    const seedData = [
      {
        titel: "MO17 wint Open Fries Kampioenschap",
        slug: "mo17-wint-open-fries-kampioenschap",
        samenvatting: "In de finale werd afgerekend met het SC Heerenveen academie-team. Een historische dag voor de club.",
        inhoud: "# MO17 Wint Open Fries Kampioenschap\n\nEen geweldige dag voor MV Artemis! Onze MO17 heeft het Open Fries Kampioenschap gewonnen.\n\n## De Finale\n\nIn een spannende eindstrijd hebben we **SC Heerenveen** verslagen. Het was een sterke prestatie van ons team, met indrukwekkende speelwijze en mentale sterkte.\n\n## Volgende Stap\n\nDit kampioenschap is slechts het begin. We gaan door naar volgende competitie met dezelfde inzet en drive.",
        afbeelding_url: "",
        categorie: "Resultaten",
        team: "MO17",
        datum: "2025-03-15",
        auteur: "Trainer",
        gepubliceerd: true
      },
      {
        titel: "V1 kampioen in de 3e klasse",
        slug: "v1-kampioen-3e-klasse",
        samenvatting: "Vrouwen 1 promoveert naar de 2e klasse. De eerste stap richting de Topklasse is gezet.",
        inhoud: "# V1 Kampioen in de 3e Klasse\n\nEen historisch moment voor **MV Artemis**! Onze Vrouwen 1 is kampioen geworden in de 3e klasse en promoveert naar de 2e klasse.\n\n## De Weg Naar het Kampioenschap\n\nDit seizoen hebben we constant op hoog niveau gespeeld. De speelsters hebben laten zien wat ze in zich hebben.\n\n## Routekaart Update\n\nDit brengt ons dichter bij onze ambitie: **Topklasse in 2030**. Dit is fase 1 van ons plan.",
        afbeelding_url: "",
        categorie: "Resultaten",
        team: "Vrouwen 1",
        datum: "2025-04-01",
        auteur: "Bestuur",
        gepubliceerd: true
      },
      {
        titel: "Naamswijziging naar MV Artemis",
        slug: "naamswijziging-mv-artemis",
        samenvatting: "Per seizoen 2025-2026 gaan we verder als MV Artemis. Meiden Vereniging Artemis. Schoon, sterk en volledig van ons.",
        inhoud: "# We zijn MV Artemis\n\n## Wat dit Betekent\n\nPer seizoen 2025-2026 gaan we verder onder de naam **MV Artemis** - Meiden Vereniging Artemis.\n\n## De Identiteit\n\nDeze naam weerspiegelt wie we zijn:\n\n- **Artemis**: Sterkte, onafhankelijkheid en ambitie\n- **Meiden Vereniging**: We zijn volledig voor meiden en vrouwen\n- **Het Ons**: Dit is van ons, door ons, voor ons\n\n## Een Nieuw Hoofdstuk\n\nDit is meer dan een naamswijziging. Dit is het begin van een nieuw hoofdstuk in onze geschiedenis.",
        afbeelding_url: "",
        categorie: "Clubnieuws",
        team: "Alle",
        datum: "2025-04-10",
        auteur: "Bestuur",
        gepubliceerd: true
      }
    ];

    // Create berichten
    await base44.entities.Nieuwsbericht.bulkCreate(seedData);

    return Response.json({ message: 'Seeded 3 nieuwsberichten' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});