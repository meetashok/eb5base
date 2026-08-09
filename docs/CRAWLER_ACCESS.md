# Crawler and bot access

EB5 Base is meant to be indexable for the NPRM comment window (deadline Aug 31, 2026).

## Code (already in repo)

- `src/app/robots.ts` allows `*` and named bots (Googlebot, Bingbot, facebookexternalhit, MetaAI, etc.)
- `src/app/sitemap.xml` via `src/app/sitemap.ts`
- Public pages emit `X-Robots-Tag: index, follow` (admin/login/maintenance are `noindex`)
- Middleware does **not** block by user agent. Bots get the same SSR HTML as browsers.
- Debug: `GET /debug` returns plain `ok`; `/debug/crawl` lists public routes in static HTML.

Verify after deploy:

```bash
curl -I https://eb5base.com/robots.txt
curl -I https://eb5base.com/sitemap.xml
curl -A "Googlebot" https://eb5base.com/nprm | head -n 40
curl -A "facebookexternalhit/1.1" https://eb5base.com/nprm | head -n 40
curl https://eb5base.com/debug
```

You should see real HTML with the NPRM headline, not an empty shell.

## Dashboard (human action required)

If crawlers still get `LIVE_CRAWL_POLICY_BLOCKED` or empty bodies, the block is usually outside Next.js.

### Cloudflare (if used)

1. Security → Bots → turn **off** Bot Fight Mode / Super Bot Fight Mode for this hostname, **or**
2. Add a Custom Rule: User Agent contains `Googlebot` OR `Bingbot` OR `facebookexternalhit` OR `MetaAI` → **Skip** / Allow
3. Caching → Purge Everything after changes

### Vercel Firewall

1. Project → Security → Firewall
2. Disable aggressive managed bot rules for production, **or** allow `/nprm/*`, `/status`, `/tracker`, `/robots.txt`, `/sitemap.xml`
3. Ensure no Edge Middleware or WAF rule returns 403 for unknown UAs

### After changes

Redeploy or purge CDN, then re-run the curl checks above and ask the review crawler to retry.
