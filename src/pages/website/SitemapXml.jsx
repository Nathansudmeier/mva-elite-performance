import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function SitemapXml() {
  const [xml, setXml] = useState('');

  useEffect(() => {
    const generateSitemap = async () => {
      const baseUrl = 'https://mv-artemis.nl';
      const vandaag = new Date().toISOString().split('T')[0];

      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/selecties', priority: '0.9', changefreq: 'monthly' },
        { url: '/mo17', priority: '0.9', changefreq: 'weekly' },
        { url: '/mo20', priority: '0.9', changefreq: 'weekly' },
        { url: '/vrouwen-1', priority: '0.9', changefreq: 'weekly' },
        { url: '/wedstrijden', priority: '0.8', changefreq: 'daily' },
        { url: '/de-club', priority: '0.7', changefreq: 'monthly' },
        { url: '/nieuws', priority: '0.8', changefreq: 'daily' },
        { url: '/proeftraining', priority: '0.8', changefreq: 'monthly' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly' },
      ];

      let nieuwsItems = [];
      try {
        const res = await base44.functions.invoke('getWebsiteData', {});
        const berichten = (res?.data?.nieuwsberichten || []).filter(b => b.gepubliceerd);
        nieuwsItems = berichten.map(b => ({
          url: `/nieuws/${b.slug}`,
          priority: '0.7',
          changefreq: 'monthly',
          lastmod: b.datum
            ? new Date(b.datum).toISOString().split('T')[0]
            : vandaag,
        }));
      } catch (e) {
        console.log('Geen nieuwsberichten gevonden');
      }

      const allPages = [...staticPages, ...nieuwsItems];

      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || vandaag}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

      setXml(xmlContent);
      document.title = 'Sitemap';
    };

    generateSitemap();
  }, []);

  if (!xml) return null;

  return (
    <pre
      style={{
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        background: 'white',
        color: 'black',
        padding: '20px',
        margin: 0,
      }}
    >
      {xml}
    </pre>
  );
}