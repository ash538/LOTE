# Using the builder

Your site is not a fixed design with a few editable words. It is a set of
sections you assemble, and a theme you control. This is how to drive it.

---

## Step 1 — Get it running

**On your own machine, to play safely:**

```bash
cd ashchand.com.au
npm install
npm start
```

Open `http://localhost:3000`. The startup log prints a sign-in and password.
Nothing you do here touches the live site — it is your sandbox.

**Live, for real:** see `DEPLOY.md`. Same tool, same screens.

## Step 2 — Sign in

Go to `/admin`. Sign in. Change your password under **Account**.

You land on the Dashboard. The left sidebar is the whole tool:

| Screen | What it is for |
|---|---|
| **Page & sections** | Building the page |
| **Menus** | The header and footer links |
| **Form builder** | The fields on your enquiry form |
| **Enquiries** | What people have sent you |
| **Files** | Images and PDFs |
| **Settings & theme** | Fonts, colours, spacing, SEO |
| **Account** | Your password and access |

## Step 3 — Play with the design

**Settings & theme → Colours & type.** The screen is split: controls on the
left, a live preview of your actual site on the right.

1. **Click a font pairing.** Eight of them, each shown in its own typeface.
   The preview changes instantly.
2. **Click a colour palette.** Eight of those too. Each sets all five colours
   at once.
3. **Nudge the sliders** — heading size, section spacing, corner rounding, page
   width. Watch the preview react.
4. **Fine-tune anything** with the individual colour pickers and font fields.
5. **Toggle** the scroll progress bar and the fade-in animation.
6. Hit **Desktop / Mobile** above the preview to check both.

Nothing is live until you press **Save settings**. Changed your mind? **Discard
changes** puts it back.

> The five colours are used consistently: *paper* is the background, *ink* is
> text and dark sections, *accent* is links and highlights, *highlight* is the
> butter-coloured panels, *muted* is secondary text. Change them and the whole
> site follows.

## Step 4 — Build the page

**Page & sections → Edit.** Your page is a stack of sections. Each one:

- **Click its title** to open it and edit its content
- **Drag the ⠿ handle** to reorder
- **Hide** to take it off the site without deleting it
- **Duplicate** to copy one you like
- **Delete** to remove it

**+ Add section** opens the full catalogue — 21 types:

**Structure**
| | |
|---|---|
| **Heading** | A standalone heading — three sizes, left or centred, optional rule |
| **Divider** | A line, a dotted rule, or just space |
| **Text section** | Heading plus body copy |
| **Custom HTML** | Anything bespoke |

**Content**
| | |
|---|---|
| **Hero** | The opening statement and portrait |
| **Values bar** | The dark strip of short value pairs |
| **Story list** | Numbered stories beside a sticky title |
| **Quote feature** | One large pull quote |
| **Experience timeline** | Roles with period, organisation and detail |
| **What I do** | Numbered capabilities on dark |
| **Positions** | Arguments you will defend |
| **Card grid** | Two to four cards, each optionally a link |
| **Writing feature** | An essay, its PDF and a note box |
| **Contact** | The enquiry form |

**Interactive**
| | |
|---|---|
| **Accordion** | Questions that expand when clicked — good for FAQs |
| **Tabs** | Several panels behind clickable tabs, arrow-key navigable |
| **Numbers** | Figures that count up when they scroll into view |
| **Quote carousel** | Quotes with arrows, dots, keyboard and swipe |
| **Image gallery** | A grid that opens full-size on click |
| **Scrolling strip** | Words that scroll across, pausing on hover |
| **Call to action** | A full-width prompt with a button |

Every interactive section works with a keyboard and a screen reader, and
respects "reduce motion" if a visitor has it switched on.

## Step 5 — Wire up the menu

Each section has a **Section link name** at the top of its editor. Set one to
`story`, and `/#story` scrolls there.

Then **Menus → New link**: label `My story`, URL `/#story`. Drag to reorder.
One header link can be the button. Footer links are where LinkedIn, Substack
and anything else live.

## Step 6 — Check it before it goes live

- **Preview** (top of the page editor) shows drafts and hidden sections
- Set the page to `draft` to take the whole thing offline
- `?preview=1` on any URL does the same while you are signed in

## Step 7 — Publish

Content and theme changes are **live the moment you save**. There is no build,
no deploy, no waiting.

---

## A few things worth knowing

**Text formatting.** Body fields take a light markup: `## heading`, `**bold**`,
`*italic*`, `- bullet`, `> quote`, `[link](/url)`. Headings keep your line
breaks, so you control where a big headline wraps.

**Images.** Upload in place, or from **Files** to reuse. PNG, JPEG, GIF, WebP,
AVIF and PDF. SVG is refused deliberately — it can carry scripts.

**The form.** **Form builder** adds, renames and reorders fields. The public
form and its validation follow automatically. Submissions land in
**Enquiries** with statuses, private notes and CSV export.

**If you break the look**, no colour or font choice can break the layout — the
values are clamped and sanitised. Reset by picking the *Editorial* pairing and
*Oxblood & butter* palette, and setting the sliders back to their middle.

**Custom CSS** is at the bottom of the theme tab if you want to go further than
the controls allow.
