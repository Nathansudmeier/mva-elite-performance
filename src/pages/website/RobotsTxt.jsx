import { useEffect } from 'react';

export default function RobotsTxt() {
  useEffect(() => {
    document.title = 'robots.txt';
  }, []);

  const content = `User-agent: *
Allow: /

Sitemap: https://mv-artemis.nl/sitemap.xml`;

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
      {content}
    </pre>
  );
}