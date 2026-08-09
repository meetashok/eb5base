import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Crawl checklist',
  description: 'Plain HTML list of public EB5 Base routes for crawler verification.',
  robots: { index: false, follow: false },
};

const ROUTES: { href: string; title: string }[] = [
  { href: '/', title: 'Home' },
  { href: '/nprm', title: 'NPRM hub' },
  { href: '/nprm/summary', title: 'NPRM summary' },
  { href: '/nprm/themes', title: 'NPRM themes' },
  { href: '/nprm/comments', title: 'NPRM comments' },
  { href: '/nprm/write', title: 'NPRM comment builder' },
  { href: '/nprm/about', title: 'NPRM about' },
  { href: '/status', title: 'Status Update' },
  { href: '/tracker', title: 'Case Tracker' },
  { href: '/about', title: 'About' },
  { href: '/disclaimer', title: 'Disclaimer' },
  { href: '/privacy', title: 'Privacy' },
  { href: '/terms', title: 'Terms' },
  { href: '/resources', title: 'Resources' },
  { href: '/contact', title: 'Contact' },
  { href: '/robots.txt', title: 'robots.txt' },
  { href: '/sitemap.xml', title: 'sitemap.xml' },
  { href: '/llms.txt', title: 'llms.txt' },
  { href: '/debug', title: 'Debug ping' },
];

export default function CrawlDebugPage() {
  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>EB5 Base crawl checklist</h1>
      <p>
        Plain HTML route list for crawler and bot verification. Not linked from the main nav.
      </p>
      <ul>
        {ROUTES.map((r) => (
          <li key={r.href}>
            <Link href={r.href}>{r.title}</Link>
            {': '}
            <code>{r.href}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
