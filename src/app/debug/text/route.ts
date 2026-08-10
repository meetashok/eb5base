export const dynamic = 'force-static';

const BODY = `NPRM Summary Plain Text for Crawler
Docket USCIS-2026-0100
FR Doc 2026-13392
358 pages, July 2 2026, comments close Aug 31 2026
Key points: $800K TEA stays, $1.05M standard stays, new $1.4M high employment, 2 year sustainment, good faith 180 days`;

/**
 * Ultra-plain HTML for crawler testing — no App Router layout, CSS, or JS.
 * Served via route handler so Meta/other bots get raw HTML bytes.
 */
export function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>EB5 Base NPRM plain text (debug)</title>
<meta name="robots" content="index, follow">
</head>
<body>
<pre>${BODY}</pre>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
