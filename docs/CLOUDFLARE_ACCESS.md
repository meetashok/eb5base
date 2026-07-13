# Cloudflare Access lock (owner + attorney only)

Goal: only you and counsel can open the real directory. Everyone else is blocked at Cloudflare.

**Do these steps in order.** Do not turn off maintenance mode until Access is working.

## 1. Confirm DNS is on Cloudflare

1. Open the Cloudflare dashboard for `eb5base.com`.
2. Check DNS records for `eb5base.com` (and `www` if used).
3. Status must be **Proxied** (orange cloud), not DNS-only (grey cloud).

If the domain is not on Cloudflare yet, add the site and switch nameservers first. Access only works when traffic is proxied through Cloudflare.

## 2. Enable Zero Trust Access

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. **Access controls → Applications → Add an application → Self-hosted**
3. Application settings:
   - **Application name:** `EB5 Base`
   - **Session duration:** `24 hours` (or longer if you prefer)
   - **Application domain:** `eb5base.com`
   - Also add `www.eb5base.com` if that hostname is used
4. Create a policy:
   - **Policy name:** `Owner and counsel`
   - **Action:** Allow
   - **Include → Emails:**
     - your email
     - the attorney’s email
5. Under identity / login methods, enable **One-time PIN** (email code). That is enough; no Google Workspace required.
6. Save.

## 3. Test Access while maintenance is still on

1. Open `https://eb5base.com` in a private/incognito window.
2. You should see the Cloudflare Access email prompt (not the public directory).
3. Enter your allowlisted email → enter the PIN from your inbox.
4. After login you may still see the **maintenance page**. That is expected until step 4.
5. Confirm a non-allowlisted email cannot get a working PIN / cannot pass Access.

## 4. Turn off maintenance so the real site loads after login

In your host (Vercel or equivalent):

1. Set environment variable: `MAINTENANCE_MODE=false`
2. Redeploy production

Then:

1. Open `https://eb5base.com`
2. Complete Cloudflare PIN login
3. You should see the real EB5 Base directory (not the pause page)

## 5. Invite the attorney

Send them:

> Please open https://eb5base.com and sign in with Cloudflare using your email (`their@email`). You’ll get a one-time code. After that you’ll reach the directory.

Add their email in the Access policy **before** they try, if you have not already.

## Restore public access later

Only after counsel says it is okay:

1. Remove or disable the Access application (or add a Bypass policy for everyone), **and**
2. Keep or set `MAINTENANCE_MODE=false`

If you only disable Access while maintenance is still on, the public will see the pause page again.
