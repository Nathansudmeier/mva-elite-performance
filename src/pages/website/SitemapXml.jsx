import { useEffect, useState } from 'react';
import { Nieuwsbericht } from '@/api/entities';

export default function SitemapXml() {
  const [xml, setXml] = useState('');

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    const baseUrl = 'https://mv-artemis.nl';
    const vandaag = new Date()
      .toISOString().split('T')[0];

    const staticPages = [
      {
        url: '/',
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: vandaag
      },
      {
        url: '/selecties',
        priority: '0.9',
        changefreq: 'monthly',
        lastmod: vandaag
      },
      {
        url: '/mo15',
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: vandaag
      },
      {
        url: '/mo17',
        priority: '0.9',
        changefreq: 'weekly',
        lastmod: vandaag
      },
      {
        url: '/mo20',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: vandaag
      },
      {
        url: '/vrouwen-1',
        priority: '0.9',
        changefreq: 'weekly',
        lastmod: vandaag
      },
      {
        url: '/wedstrijden',
        priority: '0.8',
        changefreq: 'daily',
        lastmod: vandaag
      },
      {
        url: '/nieuws',
        priority: '0.8',
        changefreq: 'daily',
        lastmod: vandaag
      },
      {
        url: '/de-club',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: vandaag
      },
      {
        url: '/proeftraining',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: vandaag
      },
      {
        url: '/contact',
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: vandaag
      },
      {
        url: '/privacy',
        priority: '0.3',
        changefreq: 'yearly',
        lastmod: vandaag
      },
    ];

    let nieuwsItems = [];
    try {
      const berichten = await Nieuwsbericht.filter(
        { gepubliceerd: true },
        '-datum'
      );
      nieuwsItems = berichten.map(b => ({
        url: `/nieuws/${b.slug}`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: b.datum
          ? new Date(b.datum)
              .toISOString().split('T')[0]
          : vandaag
      }));
    } catch (e) {
      console.log('Geen nieuwsberichten');
    }

    const allPages = [...staticPages, ...nieuwsItems];

    const xmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page =>
`  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
).join('\n')}
</urlset>`;

    setXml(xmlContent);
  };

  if (!xml) return null;

  return (
    <pre style={{
      fontFamily: 'monospace',
      whiteSpace: 'pre',
      background: 'white',
      color: 'black',
      padding: '20px',
      margin: 0,
      fontSize: '13px',
      lineHeight: '1.5'
    }}>
      {xml}
    </pre>
  );
}