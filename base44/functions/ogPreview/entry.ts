import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const { slug } = body;

  if (!slug) {
    return Response.json({ error: 'slug required' }, { status: 400 });
  }

  try {
    const berichten = await base44.asServiceRole.entities.Nieuwsbericht.filter({ slug, gepubliceerd: true });
    const bericht = berichten?.[0];

    if (!bericht) {
      return Response.json({ error: 'not found' }, { status: 404 });
    }

    const fallbackImg = 'https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/c7a4cfd45_MVAartemis.png';
    const image = bericht.afbeelding_url || fallbackImg;
    const title = bericht.titel || 'Nieuws | MV Artemis';
    const description = bericht.samenvatting || 'Lees het laatste nieuws van MV Artemis.';
    const url = `https://mv-artemis.nl/nieuws/${slug}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title} | MV Artemis</title>
  <meta property="og:title" content="${title} | MV Artemis" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="MV Artemis" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} | MV Artemis" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
  <p>Doorsturen naar <a href="${url}">${title}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});