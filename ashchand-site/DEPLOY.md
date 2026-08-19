# Putting ashchand.com.au live

Your domain stays with VentraIP. The site runs on Render, and VentraIP points
at it. Visitors only ever see `ashchand.com.au`.

**Never share your VentraIP, Render or GitHub passwords with anyone —
including me. Every step below is done by you, signed in as yourself.**

---

## 1. Create the repository

On GitHub, create a new **empty** repository (no README, no .gitignore) —
`ashchand.com.au` is a good name. Then, on your machine:

```bash
cp -r ashchand-site ~/ashchand.com.au
cd ~/ashchand.com.au
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/ashchand.com.au.git
git push -u origin main
```

That repo now holds the whole site and has nothing to do with the LOTE one.

## 2. Deploy on Render

1. Sign up at [render.com](https://render.com) and connect your GitHub account.
2. **New → Web Service**, and pick the repository.
3. Render reads `render.yaml` and fills in the build and start commands, the
   region and the persistent disk. Leave them as they are.
4. Before the first deploy, add two environment variables:

   | Key | Value |
   |---|---|
   | `ADMIN_EMAIL` | the email you want to sign in with |
   | `ADMIN_PASSWORD` | a long password you choose — a password manager entry, not a memorable one |

   Skip these and the first boot generates a random password and prints it to
   the deploy log instead. Either is fine; setting them is easier.
5. Deploy. When it finishes you get a URL like `ashchand.onrender.com`. Open
   it — the site should be there, and `/admin` should let you sign in.

### About the plan

`render.yaml` specifies the **Starter** instance (about USD $7/month). This is
deliberate, not an upsell:

- The free tier has **no persistent disk**, so your text, images and enquiries
  would be wiped on every deploy and every restart.
- The free tier also sleeps after inactivity, so the first visitor after a
  quiet period waits ~50 seconds for the page.

For a site that is your professional front door, neither is acceptable. The
disk in `render.yaml` requires a paid instance, so a free deploy will fail
until you either upgrade or remove the disk.

## 3. Point the domain at it

**In Render:** open your service → **Settings → Custom Domains** → add
`www.ashchand.com.au`. Render automatically adds the bare `ashchand.com.au`
too and redirects it to the www version. It shows you the exact DNS values to
use — trust that screen over anything written here.

**In VentraIP:** sign in → **Domain Names** → `ashchand.com.au` → **DNS**
(sometimes "Manage DNS" or "DNS Zone Editor"). Add:

| Type | Host / Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | the `…onrender.com` hostname Render shows you | default |
| A | `@` (the root) | the IP Render shows you — currently `216.24.57.1` | default |

Then:

- **Delete any AAAA records** for `@` or `www`. Render is IPv4 only and a
  leftover AAAA record will break the site for some visitors.
- **Remove or replace** any existing A/CNAME records for `@` and `www` that
  point somewhere else (a parking page, an old host). Two conflicting records
  is the most common reason this step fails.

DNS usually updates within 15–30 minutes, occasionally up to a few hours.
Render's Custom Domains screen shows a verification tick once it sees the
change, then issues the HTTPS certificate automatically. You do not need to
buy or install an SSL certificate.

## 4. Final touches once it resolves

In `/admin` → **Settings**:

- **SEO → Canonical site URL** — confirm it reads `https://www.ashchand.com.au`
- **SEO → Google Analytics ID** — add it if you want traffic stats
- **Account** — change your password if you used a temporary one

Then add the two files the design needs: your portrait (Hero section) and the
essay PDF (Writing section). See `README.md`.

---

## Ongoing

- **Editing content:** sign in at `www.ashchand.com.au/admin`. No deploy
  needed — changes are live immediately.
- **Changing code:** push to `main` and Render rebuilds and redeploys.
- **Backups:** the site's content lives in one SQLite file on the Render disk.
  Render's paid plans include disk snapshots; for your own copy, download
  `/var/data/ashchand.db` via the Render shell periodically. Worth doing before
  any big change.

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| Deploy fails on `better-sqlite3` | Node version mismatch. `.node-version` pins Node 20; check Render is honouring it. |
| Site loads but content resets after a deploy | The disk is not mounted, or `DATA_DIR` is not `/var/data`. |
| Domain shows a VentraIP parking page | An old A or CNAME record for `@`/`www` is still in the DNS zone. |
| Certificate never issues | An AAAA record still exists, or DNS has not propagated yet. |
| Can't sign in to `/admin` | Ten failed attempts locks that account for 15 minutes. Wait, or redeploy to clear it. |
