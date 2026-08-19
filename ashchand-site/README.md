# ashchand.com.au

Ash Chand's personal site — the approved design, rebuilt as a real site with a
CMS behind it so every word, section, colour and form field is editable without
touching code.

This folder is **self-contained**. To move it into its own repository:

```bash
cp -r ashchand-site ~/ashchand.com.au
cd ~/ashchand.com.au
git init && git add -A && git commit -m "Initial commit"
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

## Quick start

```bash
npm install
npm start        # http://localhost:3000
```

The first boot creates your sign-in and fills the site with the approved
content. **Watch the startup log** — it prints a line like:

```
[site] Created sign-in ash@ashchand.com.au with the password "xxxxxxxxxxxx"
```

Sign in at `/admin` with that, then change it under **Account**. To choose your
own instead, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first boot. There
is no default password — an unset one is always randomly generated.

**New here? Read `BUILDER.md`** — a step-by-step walkthrough of using this as
your own website builder.

## The page

One page, built from sections you can edit, reorder by dragging, hide or
duplicate. Twenty-one section types are available; these nine make up the
approved design:

| Section | What it is |
|---|---|
| Hero | The opening line, intro, buttons and your portrait |
| Values bar | The dark strip — Fijian / ADHD / Evidence |
| Story list | "Four things that made me useful" |
| Quote feature | The butter-coloured "Experiences activate behaviours" panel |
| Experience timeline | Roles, each with a period, organisation and detail |
| What I do (dark) | The four capabilities |
| Positions | "Positions I can defend" |
| Writing feature | The essay, its PDF and the Substack note |
| Contact | The enquiry form |

Plus structural sections (**Heading**, **Divider**, **Text**, **Custom HTML**),
a **Card grid**, and six interactive ones: **Accordion**, **Tabs**, **Numbers**
that count up, a **Quote carousel**, an **Image gallery** with a lightbox, and a
**Scrolling strip**. All of them are keyboard accessible and respect a
visitor's reduce-motion setting.

Each section has a **section link name** (its anchor). `story` makes `/#story`
scroll to it, which is how the menu works. Change an anchor and update the
matching menu link under **Menus**.

## Two things to add

1. **Your portrait.** Admin → Page & sections → Hero → Portrait image → Upload.
   Without it the hero runs full width, which also looks right.
2. **The essay PDF.** Admin → Page & sections → Writing feature → Essay file →
   Upload. The "Read the draft" button only appears once a file or URL is set.
   When your Substack is live, put its URL in the note box's link field.

## What else you can change

- **Menus** — header and footer links, drag to reorder; one header link can be
  the button. Footer links are where LinkedIn, Substack and anything else live.
- **Form builder** — add, rename, reorder or remove enquiry fields (text,
  email, phone, dropdown, checkboxes, date, number). The form and its
  validation follow automatically.
- **Enquiries** — every submission, with status, private notes and CSV export.
- **Files** — images and PDFs, reusable anywhere on the site.
- **Settings & theme** — a design playground: eight font pairings, eight colour
  palettes, and sliders for heading size, section spacing, corner rounding and
  page width, all against a live preview of your real site. Plus your name and
  logo letter, footer lines, form wording, SEO and Google Analytics.
- **Account** — your password, and extra sign-ins if you ever want one.

Colours, fonts and spacing are injected as CSS variables at render time, so a
theme change shows on the next page load. Numeric values are clamped and colour
values sanitised, so no setting can break the layout.

### Drafts and preview

Set the page to `draft`, or hide an individual section, and it disappears from
the public site. Add `?preview=1` to any URL while signed in to see hidden and
draft content as it will look.

## Built in

Per-page title and meta description, Open Graph and Twitter tags, canonical
URL, `/sitemap.xml` and `/robots.txt`. The enquiry form has a honeypot and rate
limiting; sign-in has attempt lockout; uploads are restricted to real image
types and PDFs and served with `nosniff`.

## Tech

Node.js, Express, SQLite and server-rendered EJS. No build step, no framework
on the front end — the page ships as HTML and one small script, so it is fast
and search engines read it directly.

The database and uploads live under `DATA_DIR` (the project folder by default).
On a host with an ephemeral filesystem, mount a persistent disk and point
`DATA_DIR` at it, or the content resets on every deploy.

```bash
DATA_DIR=/var/data NODE_ENV=production ADMIN_EMAIL=… ADMIN_PASSWORD=… npm start
```

## Enquiry notifications

Submissions are stored and shown in the admin inbox. There is no mail transport
configured — set `form_notify_email` in Settings and wire up SMTP (or a service
like Postmark or Resend) in `server/routes/public-api.js` if you want an email
alert on each enquiry.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/site/enquiries | Submit the enquiry form |
| GET | /api/site/form-fields | Current form definition |
| POST | /api/admin/login · /logout | Session |
| GET/POST/PUT/DELETE | /api/admin/pages[/:id] | Pages |
| POST | /api/admin/pages/:id/blocks | Add a section |
| PUT/DELETE | /api/admin/blocks/:id | Edit or remove a section |
| POST | /api/admin/blocks/:id/duplicate | Duplicate a section |
| POST | /api/admin/pages/:id/blocks/reorder | Reorder sections |
| GET/POST/PUT/DELETE | /api/admin/collections/:key[/:id] | `nav`, `form-fields` |
| GET/PUT | /api/admin/settings | Settings and theme (PUT is admin only) |
| GET/PUT/DELETE | /api/admin/enquiries[/:id] | Enquiry inbox |
| GET | /api/admin/enquiries.csv | Export |
| GET/POST/DELETE | /api/admin/media[/:id] | Images and PDFs |
| GET/POST/DELETE | /api/admin/users[/:id] | Sign-ins (admin only) |
