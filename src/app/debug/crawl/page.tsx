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
  { href: '/about#disclaimer', title: 'Disclaimer (About)' },
  { href: '/privacy', title: 'Privacy' },
  { href: '/terms', title: 'Terms' },
  { href: '/resources', title: 'Resources' },
  { href: '/contact', title: 'Contact' },
  { href: '/robots.txt', title: 'robots.txt' },
  { href: '/sitemap.xml', title: 'sitemap.xml' },
  { href: '/llms.txt', title: 'llms.txt' },
  { href: '/debug', title: 'Debug ping' },
  { href: '/debug/plain', title: 'NPRM plain summary (debug)' },
  { href: '/debug/text', title: 'NPRM ultra-plain text (debug)' },
  { href: '/api/crawl-test', title: 'Crawl-test JSON API' },
];

export default function CrawlDebugPage() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: '2rem auto',
        padding: '0 1rem 3rem',
        fontFamily: 'system-ui, sans-serif',
        lineHeight: 1.6,
        color: '#111',
      }}
    >
      <h1>Debug Crawl Page - Plain HTML</h1>
      <p>
        If you can see this via curl with a bot user-agent, crawlers are not blocked
        by this app. Not linked from the main nav.
      </p>
      <ul>
        {ROUTES.map((r) => (
          <li key={r.href}>
            <a href={r.href}>{r.title}</a>
            {': '}
            <code>{r.href}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
