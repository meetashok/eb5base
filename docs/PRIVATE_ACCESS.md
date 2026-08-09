# Private access while public sees maintenance

Use this only when you intentionally pause the directory again.

Goal:
- **Public** → branded maintenance page (no Cloudflare login wall)
- **You + counsel** → open the real directory with one link (cookie lasts 30 days)

Cloudflare Access on `eb5base.com` is **not** required. If you already enabled it, disable or delete that Access application so the public hits the site (or maintenance page) directly.

## Current default

The app ships with **maintenance off** (`MAINTENANCE_MODE` unset or `false`). The site is open to everyone — no `?access=` code needed.

## Re-enable a private pause

1. Set `MAINTENANCE_MODE=true` in Vercel (or your host).
2. Add a long random secret:

```bash
MAINTENANCE_BYPASS_SECRET=some-long-random-string
```

3. Redeploy.
4. Unlock URL (share only with counsel):

```text
https://eb5base.com/?access=some-long-random-string
```

Opening that link once sets an httpOnly cookie. After that, normal browsing on `eb5base.com` works for that browser. Public visitors without the cookie still see the pause page (except allowlisted public tools in middleware).

## Counsel invite (copy/paste)

> While EB5 Base is paused for the public, use this private link to open the directory (do not forward widely):  
> `https://eb5base.com/?access=YOUR_SECRET`  
> It should unlock access in your browser for about 30 days.

## Disable Cloudflare Access on the public hostname

1. Zero Trust → **Access → Applications**
2. Open the app that protects `eb5base.com`
3. **Delete** it, or disable it

## Restore / keep public access

1. Set `MAINTENANCE_MODE=false` (or remove the variable) and redeploy.
2. You do not need Cloudflare Access unless you want it for another reason.
