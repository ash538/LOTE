const express = require('express');
const content = require('./content');
const settingsStore = require('./settings');
const { BY_TYPE } = require('./blocks');
const helpers = require('./helpers');
const auth = require('./auth');

const router = express.Router();

// Preview lets a signed-in editor see drafts and hidden sections.
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
    resolveBlockSource: block => content.resolveBlockSource(block),
    seo: {},
    ...extra,
  };
}

function seoFor({ page, settings, path }) {
  const base = (settings.site_url || '').replace(/\/$/, '');
  return {
    title: (page && page.seo_title) || settings.seo_title || settings.site_name,
    description: (page && page.seo_description) || settings.seo_description,
    image: (page && page.og_image) || settings.seo_og_image,
    canonical: base ? `${base}${path === '/' ? '' : path}` : '',
  };
}

function renderPage(slug, req, res, next) {
  const page = content.getPage(slug, { preview: previewEnabled(req) });
  if (!page) return next();

  const ctx = baseContext(req, { page });
  ctx.seo = seoFor({ page, settings: ctx.settings, path: req.path });
  res.render('page', ctx);
}

router.get('/', (req, res, next) => renderPage('home', req, res, next));

router.get('/sitemap.xml', (req, res) => {
  const settings = settingsStore.all();
  const base = (settings.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const urls = content.listPages()
    .filter(p => p.status === 'published')
    .map(p => (p.slug === 'home' ? '/' : `/${p.slug}`));
  const body = urls.map(loc => `  <url><loc>${base}${loc}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
});

router.get('/robots.txt', (req, res) => {
  const settings = settingsStore.all();
  const base = (settings.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`);
});

// Any other CMS page, by slug.
router.get('/:slug', (req, res, next) => {
  if (req.params.slug === 'home') return res.redirect('/');
  renderPage(req.params.slug, req, res, next);
});

function notFound(req, res) {
  const ctx = baseContext(req);
  ctx.seo = seoFor({ settings: ctx.settings, path: req.path });
  ctx.seo.title = `Not found — ${ctx.settings.site_name}`;
  res.status(404).render('not-found', ctx);
}

module.exports = { router, notFound };
