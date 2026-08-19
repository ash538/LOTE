# LOTE Marketing website

A custom-built agency website with a full CMS behind it, so the team can add
and change content without touching code. The internal Quote Builder still
lives in the same app at `/app`.

| What | Where |
|------|-------|
| Public website | `/` |
| Admin / CMS | `/admin` |
| Quote Builder (internal) | `/app` |

## Quick start

```bash
npm install
npm run seed     # rate card + starter website content (safe to re-run)
npm start        # http://localhost:4000
```

The first boot prints the generated sign-in to the startup log:

```
[cms] Created admin admin@lotemarketing.com.au with the password "xxxxxxxxxxxx"
```

Sign in at `/admin` with that, then change it under **Account**. Set
`ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first boot to choose your own
instead. There is no default password — an unset one is always random.

Accounts come in two roles. **Editors** manage all content; **admins**
additionally control site settings (which can inject scripts and CSS) and who
has access.

## What the team can edit

Everything on the public site comes out of the database — nothing is hardcoded.

**Pages** are built from sections you add, reorder by dragging, hide, duplicate
or delete. Eighteen section types are available:

| | |
|---|---|
| Hero | Scrolling marquee |
| Text section | Text + image |
| Stats row | Feature grid |
| Services | Case studies |
| Insights | Client logos |
| Testimonials | Team |
| FAQ / accordion | Image gallery |
| Video embed | Call to action |
| Enquiry form | Custom HTML |

**Collections** have their own screens and their own public pages:

- **Work** — case studies at `/work/<slug>`, with challenge, approach, results, gallery and sector filters
- **Services** — service pages at `/services/<slug>`
- **Insights** — articles at `/insights/<slug>`, with categories and an RSS feed
- **Team**, **Testimonials**, **Clients** — used by the matching section types

**Site configuration**

- **Navigation** — header and footer menus, drag to reorder, any link can be a button
- **Form builder** — add, rename, reorder or remove enquiry form fields (text, email, phone, dropdown, checkboxes, date, number); the public form and its validation follow automatically
- **Enquiries** — inbox for form submissions, with status, internal notes and CSV export
- **Media** — image library with drag-free uploads, reusable across every screen
- **Settings & theme** (admins) — brand, logo, colours, fonts, corner radius, button style, custom CSS, contact details, footer copy, SEO defaults, Google Analytics ID
- **Account** — your own password; admins also add and remove editor accounts

Colour and typography settings are injected as CSS variables at render time, so
a theme change shows on the live site on the next page load.

### Drafts and preview

Anything set to `draft`, and any hidden section, is invisible to the public. Add
`?preview=1` to a URL while signed in to see it as it will look.

## Built-in SEO

Per-page titles and meta descriptions, Open Graph and Twitter tags, canonical
URLs, `/sitemap.xml`, `/robots.txt` and an insights feed at `/feed.xml`.

## Tech

- **Backend** — Node.js, Express, SQLite (better-sqlite3)
- **Public site** — server-rendered EJS (fast, crawlable, no build step)
- **Admin** — dependency-free JavaScript, no build step
- **Quote Builder** — React (unchanged, served from `/app` after `npm run build`)

The SQLite database and uploaded images live under `DATA_DIR` (the project root
by default). On a host with an ephemeral filesystem, mount a persistent disk and
point `DATA_DIR` at it — `render.yaml` shows the arrangement. Uploads accept
PNG, JPEG, GIF, WebP and AVIF; SVG is rejected because it can carry script that
would run on the site's own origin.

## API

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/site/enquiries | Submit the enquiry form |
| GET | /api/site/services | Published services |
| GET | /api/site/work | Published case studies |
| GET | /api/site/insights | Published articles |
| GET | /api/site/form-fields | Current enquiry form definition |

### Admin (session cookie required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login · /logout | Session |
| GET | /api/admin/overview | Dashboard counts |
| GET/POST/PUT/DELETE | /api/admin/pages[/:id] | Pages |
| POST | /api/admin/pages/:id/blocks | Add a section |
| PUT/DELETE | /api/admin/blocks/:id | Edit or remove a section |
| POST | /api/admin/blocks/:id/duplicate | Duplicate a section |
| POST | /api/admin/pages/:id/blocks/reorder | Reorder sections |
| GET/POST/PUT/DELETE | /api/admin/collections/:key[/:id] | `work`, `services`, `insights`, `team`, `testimonials`, `clients`, `nav`, `form-fields` |
| POST | /api/admin/collections/:key/reorder | Reorder a collection |
| GET/PUT | /api/admin/settings | Settings and theme (PUT is admin only) |
| GET/PUT/DELETE | /api/admin/enquiries[/:id] | Enquiry inbox |
| GET | /api/admin/enquiries.csv | Export |
| GET/POST/DELETE | /api/admin/media[/:id] | Image library |
| GET/POST/DELETE | /api/admin/users[/:id] | Editor accounts (admin only) |

### Quote Builder

Unchanged: `/api/rates` and `/api/quotes` (see the endpoints in
`server/routes/`).

## Production

```bash
npm run build   # builds the React quote builder for /app
npm start
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATA_DIR` and `NODE_ENV=production`
(which also makes the session cookie secure-only). Both seeds run on every boot
and do nothing when content already exists, so deploys are safe to repeat.
