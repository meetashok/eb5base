# Private access while public sees maintenance

Goal:
- **Public** → branded maintenance page (no Cloudflare login wall)
- **You + counsel** → open the real directory with one link (cookie lasts 30 days)

Cloudflare Access on `eb5base.com` is **not** what we want for this. If you already enabled it, disable or delete that Access application so the public hits the maintenance page directly.

## Setup

1. Keep `MAINTENANCE_MODE` on (unset or `true`).
2. In Vercel (or your host), add a long random secret:

```bash
MAINTENANCE_BYPASS_SECRET=some-long-random-string
```

3. Redeploy.
4. Unlock URL (share only with counsel):

```text
https://eb5base.com/?access=some-long-random-string
```

Opening that link once sets an httpOnly cookie. After that, normal browsing on `eb5base.com` works for that browser. Public visitors without the cookie still see the pause page.

## Counsel invite (copy/paste)

> While EB5 Base is paused for the public, use this private link to open the directory (do not forward widely):  
> `https://eb5base.com/?access=YOUR_SECRET`  
> It should unlock access in your browser for about 30 days.

## Disable Cloudflare Access on the public hostname

1. Zero Trust → **Access → Applications**
2. Open the app that protects `eb5base.com`
3. **Delete** it, or disable it

After that, `https://eb5base.com` should show the maintenance page with **no** Cloudflare email prompt.

## Restore public access later

When counsel says it is okay:

1. Set `MAINTENANCE_MODE=false` and redeploy, **or** remove `MAINTENANCE_BYPASS_SECRET` and turn maintenance off.
2. You do not need Cloudflare Access unless you want it for another reason.
