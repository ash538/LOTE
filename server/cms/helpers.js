function slugify(input, fallback = 'item') {
  const slug = String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}

function uniqueSlug(db, table, desired, ignoreId = null) {
  let base = slugify(desired);
  let slug = base;
  let n = 2;
  for (;;) {
    const row = ignoreId
      ? db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(slug, ignoreId)
      : db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug);
    if (!row) return slug;
    slug = `${base}-${n++}`;
  }
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseJson(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

// Small, deliberately limited Markdown subset so editors get formatting
// without us shipping a full parser (or an XSS hole — everything is escaped
// before any tag is introduced).
function richText(input) {
  const source = String(input || '').replace(/\r\n/g, '\n').trim();
  if (!source) return '';

  const inline = text => escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
      /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? `<a href="${url}">${label}</a>` : label)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  const html = [];
  let list = null;

  const closeList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };

  for (const rawBlock of source.split(/\n{2,}/)) {
    const lines = rawBlock.split('\n');
    let paragraph = [];

    const flushParagraph = () => {
      if (paragraph.length) {
        html.push(`<p>${inline(paragraph.join(' '))}</p>`);
        paragraph = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const heading = trimmed.match(/^(#{2,4})\s+(.*)$/);
      const bullet = trimmed.match(/^[-*]\s+(.*)$/);
      const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
      const quote = trimmed.match(/^>\s+(.*)$/);

      if (heading) {
        flushParagraph(); closeList();
        const level = Math.min(heading[1].length + 1, 5);
        html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      } else if (bullet) {
        flushParagraph();
        if (list !== 'ul') { closeList(); html.push('<ul>'); list = 'ul'; }
        html.push(`<li>${inline(bullet[1])}</li>`);
      } else if (numbered) {
        flushParagraph();
        if (list !== 'ol') { closeList(); html.push('<ol>'); list = 'ol'; }
        html.push(`<li>${inline(numbered[1])}</li>`);
      } else if (quote) {
        flushParagraph(); closeList();
        html.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      } else {
        closeList();
        paragraph.push(trimmed);
      }
    }
    flushParagraph();
  }
  closeList();
  return html.join('\n');
}

function excerptFrom(text, length = 165) {
  const plain = String(text || '').replace(/[#>*`_[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= length) return plain;
  // Break on a word boundary when there is one — scripts written without
  // spaces (Chinese, Japanese, Thai, Khmer) fall back to a hard cut.
  const lastSpace = plain.lastIndexOf(' ', length);
  return `${plain.slice(0, lastSpace > 0 ? lastSpace : length)}…`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readTime(body) {
  const words = String(body || '').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

function boolInt(value) {
  if (value === true || value === 1 || value === '1' || value === 'true' || value === 'on') return 1;
  return 0;
}

module.exports = {
  slugify, uniqueSlug, escapeHtml, parseJson, richText,
  excerptFrom, formatDate, readTime, boolInt,
};
