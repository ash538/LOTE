const express = require('express');
const content = require('./content');
const settingsStore = require('./settings');
const { BY_TYPE } = require('./blocks');
const helpers = require('./helpers');
const auth = require('./auth');

const router = express.Router();

// Preview mode lets a signed-in editor see drafts and hidden blocks.
function previewEnabled(req) {
  if (req.query.preview !== '1') return false;
  return !!auth.userForToken(auth.tokenFromRequest(req));
}

function baseContext(req, extra = {}) {
  const settings = settingsStore.all();
  const preview = previewEnabled(req);
  return {
    settings,
    preview,
    nav: content.listNav('header'),
    footerNav: content.listNav('footer'),
    currentPath: req.path,
    h: helpers,
    blockMeta: BY_TYPE,
    resolveBlockSource: block => content.resolveBlockSource(block, { preview }),
    seo: {},
    ...extra,
  };
}

function seoFor({ title, description, image, settings, path }) {
  const suffix = settings.seo_title_suffix || settings.site_name;
  const full = title && title !== suffix ? `${title} — ${suffix}` : suffix;
  const base = (settings.site_url || '').replace(/\/$/, '');
  return {
    title: full,
    description: description || settings.seo_description,
    image: image || settings.seo_og_image,
    canonical: base ? `${base}${path}` : '',
  };
}

function notFound(req, res) {
  const ctx = baseContext(req);
  ctx.seo = seoFor({ title: 'Page not found', settings: ctx.settings, path: req.path });
  res.status(404).render('not-found', ctx);
}

// --- Home & CMS pages ------------------------------------------------------
function renderPage(slug, req, res, next) {
  const preview = previewEnabled(req);
  const page = content.getPage(slug, { preview });
  if (!page) return next();

  const ctx = baseContext(req, { page });
  ctx.seo = seoFor({
    title: page.seo_title || page.title,
    description: page.seo_description,
    image: page.og_image,
    settings: ctx.settings,
    path: req.path,
  });
  res.render('page', ctx);
}

router.get('/', (req, res, next) => renderPage('home', req, res, next));

// --- Work ------------------------------------------------------------------
router.get('/work', (req, res) => {
  const preview = previewEnabled(req);
  const sector = req.query.sector || null;
  const ctx = baseContext(req, {
    items: content.listWork({ preview, sector }),
    sectors: content.workSectors(),
    activeSector: sector,
    intro: content.getPage('work', { preview }),
  });
  ctx.seo = seoFor({ title: 'Our work', description: 'Case studies from campaigns that reached real communities.', settings: ctx.settings, path: req.path });
  res.render('work-index', ctx);
});

router.get('/work/:slug', (req, res, next) => {
  const preview = previewEnabled(req);
  const item = content.getWork(req.params.slug, { preview });
  if (!item) return next();

  const ctx = baseContext(req, { item });
  ctx.seo = seoFor({
    title: item.title,
    description: item.seo_description || item.summary,
    image: item.hero_image,
    settings: ctx.settings,
    path: req.path,
  });
  res.render('work-single', ctx);
});

// --- Services --------------------------------------------------------------
router.get('/services/:slug', (req, res, next) => {
  const preview = previewEnabled(req);
  const item = content.getService(req.params.slug, { preview });
  if (!item) return next();

  const ctx = baseContext(req, {
    item,
    relatedWork: content.listWork({ preview, limit: 3 }),
    otherServices: content.listServices({ preview }).filter(s => s.id !== item.id),
  });
  ctx.seo = seoFor({
    title: item.title,
    description: item.seo_description || item.summary,
    image: item.image,
    settings: ctx.settings,
    path: req.path,
  });
  res.render('service-single', ctx);
});

// --- Insights --------------------------------------------------------------
router.get('/insights', (req, res) => {
  const preview = previewEnabled(req);
  const category = req.query.category || null;
  const ctx = baseContext(req, {
    items: content.listInsights({ preview, category }),
    categories: content.insightCategories(),
    activeCategory: category,
    intro: content.getPage('insights', { preview }),
  });
  ctx.seo = seoFor({ title: 'Insights', description: 'Research, opinion and practical guidance on multicultural communications.', settings: ctx.settings, path: req.path });
  res.render('insights-index', ctx);
});

router.get('/insights/:slug', (req, res, next) => {
  const preview = previewEnabled(req);
  const item = content.getInsight(req.params.slug, { preview });
  if (!item) return next();

  const ctx = baseContext(req, { item });
  ctx.seo = seoFor({
    title: item.title,
    description: item.seo_description || item.excerpt,
    image: item.hero_image,
    settings: ctx.settings,
    path: req.path,
  });
  res.render('insight-single', ctx);
});

// --- Machine-readable ------------------------------------------------------
router.get('/sitemap.xml', (req, res) => {
  const settings = settingsStore.all();
  const base = (settings.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const urls = [
    { loc: '/', priority: '1.0' },
    { loc: '/work', priority: '0.8' },
    { loc: '/insights', priority: '0.7' },
    ...content.listPages().filter(p => p.status === 'published' && p.slug !== 'home')
      .map(p => ({ loc: `/${p.slug}`, priority: '0.6' })),
    ...content.listServices().map(s => ({ loc: `/services/${s.slug}`, priority: '0.7' })),
    ...content.listWork().map(w => ({ loc: `/work/${w.slug}`, priority: '0.7' })),
    ...content.listInsights().map(i => ({ loc: `/insights/${i.slug}`, priority: '0.5' })),
  ];
  const seen = new Set();
  const body = urls
    .filter(u => !seen.has(u.loc) && seen.add(u.loc))
    .map(u => `  <url><loc>${base}${u.loc}</loc><priority>${u.priority}</priority></url>`)
    .join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
});

router.get('/robots.txt', (req, res) => {
  const settings = settingsStore.all();
  const base = (settings.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`);
});

router.get('/feed.xml', (req, res) => {
  const settings = settingsStore.all();
  const base = (settings.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const items = content.listInsights({ limit: 20 }).map(i => `
    <item>
      <title>${helpers.escapeHtml(i.title)}</title>
      <link>${base}/insights/${i.slug}</link>
      <guid>${base}/insights/${i.slug}</guid>
      <pubDate>${new Date(i.published_at).toUTCString()}</pubDate>
      <description>${helpers.escapeHtml(i.excerpt)}</description>
    </item>`).join('');
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${helpers.escapeHtml(settings.site_name)} — Insights</title>
  <link>${base}/insights</link>
  <description>${helpers.escapeHtml(settings.seo_description)}</description>${items}
</channel></rss>`);
});

// --- Catch-all CMS page (must stay last) -----------------------------------
router.get('/:slug', (req, res, next) => {
  if (req.params.slug === 'home') return res.redirect('/');
  renderPage(req.params.slug, req, res, next);
});

module.exports = { router, notFound };
