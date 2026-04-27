import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { berichten } = await req.json();

  // Haal alle relevante data op via service role (publieke website, geen auth nodig)
  const [wedstrijden, matches, nieuws, agendaItems] = await Promise.all([
    base44.asServiceRole.entities.AgendaItem.list('-date', 50),
    base44.asServiceRole.entities.Match.list('-date', 50),
    base44.asServiceRole.entities.Nieuwsbericht.filter({ gepubliceerd: true }, '-datum', 10),
    base44.asServiceRole.entities.AgendaItem.list('date', 100),
  ]);

  const nu = new Date();
  const vandaag = nu.toISOString().split('T')[0];

  const komende = agendaItems
    .filter(w => w.date >= vandaag)
    .slice(0, 8)
    .map(w => `- ${w.title} op ${new Date(w.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })} om ${w.start_time || '?'}${w.location ? ' bij ' + w.location : ''} (${w.team || 'Alle'})`);

  const gespeeld = matches
    .filter(m => m.score_home !== null && m.score_home !== undefined && m.score_away !== null && m.score_away !== undefined)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map(m => {
      const thuisScore = m.score_home;
      const uitScore = m.score_away;
      const resultaat = thuisScore > uitScore ? 'Gewonnen' : thuisScore < uitScore ? 'Verloren' : 'Gelijkgespeeld';
      return `- ${new Date(m.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}: MV Artemis vs ${m.opponent} — ${m.score_home}-${m.score_away} (${resultaat}) [${m.home_away}] [${m.team}]`;
    });

  const nieuwsLijst = nieuws.map(n =>
    `- ${n.titel} (${new Date(n.datum).toLocaleDateString('nl-NL')}): ${n.samenvatting || ''}`
  );

  const systeemPrompt = `Je bent de Artemis Assistent, de vriendelijke en enthousiaste AI-assistent van MV Artemis (Meiden Vereniging Artemis).

JOUW KARAKTER:
- Direct, eerlijk en warm — net als de club
- Enthousiast over vrouwenvoetbal en de ambities van MV Artemis
- Spreek de gebruiker aan met "jij/je"
- Geen formeel taalgebruik
- Kort en krachtig antwoorden
- Gebruik af en toe een emoji maar niet overdreven
- Sluit aan bij de toon: ambitieus, nuchter, Fries/Noord-Nederlands

OVER MV ARTEMIS:
- Volledige naam: Meiden Vereniging Artemis
- Opgericht: mei 2025
- Locatie: Sportpark Douwekamp, Opeinde, Friesland
- Contact: info@mv-artemis.nl
- Website: mv-artemis.nl
- KVK: 97270679

MISSIE:
De enige zelfstandige vrouwenvoetbalclub in Noord-Nederland. Volledig gericht op meiden en vrouwen. Niet als bijzaak, maar als hoofdzaak.

TEAMS:
- MO15: Speelt dit seizoen (2025/26), tijdelijk. Koploper 1e klasse, ongeslagen.
- MO17: Landelijke 1e Divisie. Jongenscompetitie. 16 speelsters.
- MO20: Start seizoen 2026/27. Selectie is open.
- Vrouwen 1: 3e klasse (promoveert). 9 speelsters. Vlaggenschip van de club.

TECHNISCHE STAF:
- Nathan Sudmeier — Hoofdtrainer / TC (UEFA B)
- Hendrik Overeinder — Keeperstrainer
- Marcel Swart — Performance coach

SPEELFILOSOFIE:
Drie pijlers:
1. Positiespel als basis
2. Verticaal-direct aanvallen
3. Gegenpressing als houding
Kernregel: "De bal moet naar de ruimte waar de meeste winst te halen valt."

PROEFTRAINING:
- Aanmelden via mv-artemis.nl/proeftraining
- Of mailen naar info@mv-artemis.nl
- Leeftijd: 15 jaar en ouder
- Zowel MO17 als Vrouwen 1

KOMENDE WEDSTRIJDEN & ACTIVITEITEN:
${komende.length > 0 ? komende.join('\n') : 'Geen komende activiteiten gevonden'}

GESPEELDE WEDSTRIJDEN & UITSLAGEN (meest recent eerst):
${gespeeld.length > 0 ? gespeeld.join('\n') : 'Nog geen wedstrijden gespeeld'}

RECENT NIEUWS:
${nieuwsLijst.length > 0 ? nieuwsLijst.join('\n') : 'Geen recent nieuws'}

REGELS:
- Gebruik de wedstrijddata hierboven om vragen over uitslagen, tegenstanders en resultaten te beantwoorden
- Verwijs voor proeftraining aanvragen altijd naar mv-artemis.nl/proeftraining
- Verwijs voor contact naar info@mv-artemis.nl
- Als iets niet in bovenstaande data staat: zeg dat eerlijk en verwijs naar info@mv-artemis.nl
- Geef nooit persoonlijke spelersdata zoals telefoonnummers of e-mailadressen
- Houd antwoorden kort: max 3-4 zinnen
- Als iemand wil aanmelden: stuur naar /proeftraining pagina`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: systeemPrompt,
      messages: berichten.map(b => ({
        role: b.rol,
        content: b.inhoud,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json({ error: data.error?.message || 'API fout' }, { status: 500 });
  }

  const antwoord = data.content?.[0]?.text || 'Sorry, ik kon geen antwoord genereren.';
  return Response.json({ antwoord });
});