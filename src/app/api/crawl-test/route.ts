export const dynamic = 'force-static';

/**
 * JSON crawl bypass: returns NPRM summary HTML as a string so Meta / other
 * crawlers can fetch content without relying on HTML page policy.
 */
export function GET() {
  const html =
    '<h1>NPRM Guide</h1><p>Docket USCIS-2026-0100 - 358 pages - Comments close Aug 31 2026</p><p>Key points: $800K TEA stays, $1.05M standard stays, new $1.4M high employment, 2 year sustainment, good faith 180 days. Full guide: https://eb5base.com/nprm</p>';

  return new Response(
    JSON.stringify({
      html,
      url: '/nprm',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
