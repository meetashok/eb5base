export async function GET() {
  return new Response('ok - crawler can reach API routes', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
