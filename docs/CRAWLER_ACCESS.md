# Crawler and bot access

EB5 Base is meant to be indexable for the NPRM comment window (deadline Aug 31, 2026).

## Verified Aug 10 2026

From a probe against production:

- `GET /robots.txt` with Googlebot UA → **200** (text/plain, named bot allows)
- `GET /nprm` with Googlebot / facebookexternalhit → **200** SSR HTML including “The EB-5 Proposed Rule”
- `GET /sitemap.xml` → was **307** to `/login?redirect=/sitemap.xml` (bug)

**Root cause of the sitemap failure:** auth middleware in `src/lib/supabase-middleware.ts` treated unknown paths as login-required. `/sitemap.xml`, `/llms.txt`, and `/debug` were not in the public/static allowlists. Fixed by adding those paths (plus `/disclaimer` and SEO image routes) to `isStaticOrApi` / `isPublicPath`.

Meta review crawlers that still report `LIVE_CRAWL_POLICY_BLOCKED` on some paths may be hitting Cloudflare Bot Fight Mode separately. Code can no longer gate the sitemap behind login.

## Code (in repo)

- `src/app/robots.ts` allows `*` and named bots
- `src/app/sitemap.ts` (must stay public after auth middleware fix)
- `X-Robots-Tag: index, follow` on public routes
- No user-agent blocking in middleware
- `GET /debug` → plain `ok`; `/debug/crawl` → static HTML route list

Verify after every deploy:

```bash
curl -sI https://eb5base.com/robots.txt
curl -sI https://eb5base.com/sitemap.xml   # must be 200, NOT 307 to /login
curl -sI https://eb5base.com/llms.txt
curl -sI https://eb5base.com/debug
curl -A "Googlebot" https://eb5base.com/nprm | head -n 40
curl -A "facebookexternalhit/1.1" https://eb5base.com/nprm | head -n 40
```

## Dashboard (human action if Meta still blocked)

### Cloudflare

1. Security → Bots → turn off Bot Fight Mode / Super Bot Fight Mode, **or**
2. Custom Rule: UA contains Googlebot / Bingbot / facebookexternalhit / MetaAI → Skip
3. Purge cache after changes

### Vercel Firewall

1. Project → Security → Firewall
2. Allow `/nprm/*`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/debug` for all UAs
