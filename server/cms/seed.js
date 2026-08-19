// Seeds a complete, editable starter site. Safe to re-run: it only fills
// tables that are empty, so it never overwrites real content.
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const settingsStore = require('./settings');
const auth = require('./auth');
const { defaultsFor } = require('./blocks');
const { slugify } = require('./helpers');

const isEmpty = table => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n === 0;

function insertPage(page, blocks) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO pages (id, slug, title, nav_label, status, show_in_nav, sort_order, seo_description, is_locked)
    VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?)
  `).run(id, page.slug, page.title, page.nav_label || '', page.show_in_nav ? 1 : 0,
    page.sort_order || 0, page.seo_description || '', page.is_locked ? 1 : 0);

  const stmt = db.prepare('INSERT INTO blocks (id, page_id, type, data, sort_order) VALUES (?, ?, ?, ?, ?)');
  blocks.forEach((block, index) => {
    stmt.run(uuidv4(), id, block.type, JSON.stringify(Object.assign(defaultsFor(block.type), block.data || {})), index);
  });
  return id;
}

function seedPages() {
  if (!isEmpty('pages')) return;

  insertPage({ slug: 'home', title: 'Home', is_locked: true, sort_order: 0,
    seo_description: 'LOTE Marketing is a multicultural marketing and communications agency reaching culturally and linguistically diverse audiences across Australia.' }, [
    { type: 'hero', data: {
      eyebrow: 'Multicultural marketing & communications',
      heading: 'Reach every\ncommunity, properly.',
      intro: 'We plan, create and deliver campaigns in more than 40 languages — grounded in community insight, built for measurable behaviour change.',
      variant: 'split',
      background: 'paper',
      links: [
        { label: 'See our work', url: '/work', style: 'primary' },
        { label: 'What we do', url: '/services', style: 'secondary' },
      ],
    } },
    { type: 'marquee', data: {
      items: ['Arabic', 'Simplified Chinese', 'Vietnamese', 'Punjabi', 'Hindi', 'Greek', 'Italian', 'Dari', 'Tagalog', 'Nepali', 'Turkish', 'Khmer'],
      speed: '34', background: 'primary',
    } },
    { type: 'stats', data: {
      heading: 'Why it matters',
      background: 'muted',
      items: [
        { value: '5.8m', label: 'Australians speak a language other than English at home' },
        { value: '40+', label: 'Languages we produce and deliver campaigns in' },
        { value: '300+', label: 'Community and in-language media partners' },
        { value: '18yrs', label: 'Working with government, health and not-for-profits' },
      ],
    } },
    { type: 'services_list', data: {
      eyebrow: 'What we do',
      heading: 'Strategy, creative and media that lands in language.',
      intro: 'Every engagement starts with the community, not the channel.',
      layout: 'rows', background: 'paper',
    } },
    { type: 'work_grid', data: {
      eyebrow: 'Selected work',
      heading: 'Campaigns that changed behaviour.',
      limit: '4', link_label: 'All case studies', link_url: '/work', background: 'muted',
    } },
    { type: 'testimonials', data: { heading: 'What clients say', background: 'primary', limit: '3' } },
    { type: 'logos', data: { heading: 'Trusted by', background: 'paper' } },
    { type: 'insights_list', data: { eyebrow: 'Thinking', heading: 'Insights from the field', limit: '3', link_label: 'All insights', link_url: '/insights', background: 'muted' } },
    // The site-wide footer call to action follows every page, so pages do not
    // repeat one of their own at the bottom.
  ]);

  insertPage({ slug: 'services', title: 'Services', nav_label: 'Services', show_in_nav: 1, sort_order: 1, is_locked: true,
    seo_description: 'Multicultural strategy, in-language creative, translation, community engagement and media buying.' }, [
    { type: 'hero', data: {
      eyebrow: 'Services',
      heading: 'What we do',
      intro: 'Five capabilities that work together — or on their own, if that is what the brief needs.',
      variant: 'centred', background: 'muted',
      links: [{ label: 'Talk to us', url: '/contact', style: 'primary' }],
    } },
    { type: 'services_list', data: { layout: 'cards', heading: '', background: 'paper' } },
    { type: 'feature_grid', data: {
      eyebrow: 'How we work',
      heading: 'A process built on community trust',
      columns: '4', background: 'muted',
      items: [
        { icon: '01', title: 'Listen', text: 'Community consultation, in-language research and stakeholder interviews before a word of creative.' },
        { icon: '02', title: 'Plan', text: 'Audience segmentation by language, media habit and cultural context — not by postcode alone.' },
        { icon: '03', title: 'Create', text: 'Transcreation, not translation. Concepts are built to work in every language they run in.' },
        { icon: '04', title: 'Measure', text: 'Reach, recall and behaviour tracked per community, reported in plain English.' },
      ],
    } },
    { type: 'accordion', data: {
      heading: 'Common questions',
      background: 'paper',
      items: [
        { question: 'Do you translate existing campaigns or start from scratch?', answer: 'Both. Most clients come to us with an English master. We assess what will carry across cultures and what needs rebuilding, then transcreate rather than translate word for word.' },
        { question: 'Which languages can you deliver in?', answer: 'More than 40, with in-house leads for the largest communities and a vetted network of NAATI-certified linguists for the rest.' },
        { question: 'Can you handle media buying as well?', answer: 'Yes. We hold direct relationships with community radio, in-language press, and diaspora digital publishers, and we buy on your behalf at agency rates.' },
        { question: 'How do you measure success?', answer: 'We agree measures up front — awareness, comprehension, or a behavioural action such as bookings or registrations — and report by community so you can see where budget worked hardest.' },
      ],
    } },
  ]);

  insertPage({ slug: 'about', title: 'About', nav_label: 'About', show_in_nav: 1, sort_order: 3,
    seo_description: 'LOTE Marketing is an independent multicultural communications agency.' }, [
    { type: 'hero', data: {
      eyebrow: 'About us',
      heading: 'We are the agency that speaks your audience’s language.',
      intro: 'Independent, community-led, and built by people who grew up translating for their parents.',
      variant: 'centred', background: 'muted', links: [],
    } },
    { type: 'rich_text', data: {
      heading: 'Our story',
      align: 'two-column',
      background: 'paper',
      body: 'LOTE Marketing was founded on a simple frustration: campaigns designed for "the general public" routinely miss the millions of Australians who do their thinking, talking and deciding in another language.\n\nWe started as a translation desk and grew into a full-service agency because clients kept asking the harder question — not "what does this say in Vietnamese?" but "why is nobody in this community responding?"\n\nToday we sit between government, health services and not-for-profits on one side, and 40+ language communities on the other. We are accountable to both.',
    } },
    { type: 'stats', data: {
      background: 'primary',
      items: [
        { value: '2007', label: 'Year we started' },
        { value: '100%', label: 'Independently owned' },
        { value: '26', label: 'People across Melbourne and Sydney' },
        { value: '12', label: 'Languages spoken in the office' },
      ],
    } },
    { type: 'team_grid', data: { eyebrow: 'Our people', heading: 'The team', intro: 'Strategists, linguists and community organisers.', background: 'paper' } },
    { type: 'two_column', data: {
      eyebrow: 'Our commitment',
      heading: 'Community first, always',
      body: 'We pay community consultants properly. We credit the language leads who make campaigns work. And we will tell a client when a campaign should not run at all.\n\n- Certified translators on every project\n- Community review before launch\n- Transparent media reporting by language',
      image_side: 'right', background: 'muted',
      links: [{ label: 'Work with us', url: '/contact', style: 'primary' }],
    } },
  ]);

  insertPage({ slug: 'contact', title: 'Contact', nav_label: 'Contact', show_in_nav: 1, sort_order: 4, is_locked: true,
    seo_description: 'Start a conversation with LOTE Marketing.' }, [
    { type: 'hero', data: {
      eyebrow: 'Contact',
      heading: 'Let’s talk.',
      intro: 'Tell us about the audience you need to reach and the outcome you are chasing.',
      variant: 'centred', background: 'muted', links: [],
    } },
    { type: 'contact_form', data: { show_details: true, background: 'paper' } },
  ]);

  insertPage({ slug: 'work', title: 'Work', sort_order: 2, seo_description: 'Case studies from LOTE Marketing.' }, []);
  insertPage({ slug: 'insights', title: 'Insights', sort_order: 5, seo_description: 'Insights from LOTE Marketing.' }, []);
}

function seedCollection(table, columns, rows) {
  if (!isEmpty(table)) return;
  const cols = ['id', ...columns, 'sort_order'];
  const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`);
  rows.forEach((row, index) => stmt.run(uuidv4(), ...columns.map(c => row[c]), index));
}

function seedServices() {
  const rows = [
    {
      title: 'Multicultural strategy', icon: '◍',
      summary: 'Audience research, segmentation and channel planning grounded in community insight.',
      body: 'Before anything is written or bought, we work out who we are actually talking to.\n\n## What that looks like\n\nWe combine census and health data with in-language focus groups, community leader interviews and media consumption research. The output is a plan that names the communities, the languages, the trusted messengers and the moments that matter.\n\n> "The strategy told us to stop translating our brochure and start talking to grandmothers. It doubled our attendance."',
      capabilities: ['Community and audience research', 'Segmentation by language and media habit', 'Channel and messenger planning', 'Behaviour change frameworks', 'Campaign measurement design'],
    },
    {
      title: 'In-language creative', icon: '✎',
      summary: 'Transcreation, concept development and production that works in every language it runs in.',
      body: 'A campaign that only works in English is a campaign that only reaches part of Australia.\n\n## Transcreation, not translation\n\nWe build concepts that survive the trip into another language and culture — checking idiom, imagery, colour, humour and taboo with community reviewers before anything is produced.',
      capabilities: ['Concept development', 'Transcreation and copywriting', 'Photography and film production', 'Design and artwork adaptation', 'Community creative review'],
    },
    {
      title: 'Translation & language services', icon: '⇄',
      summary: 'NAATI-certified translation, subtitling, voiceover and plain-language editing in 40+ languages.',
      body: 'Accuracy is the floor, not the ceiling. Every translation is reviewed for register, reading level and cultural fit.\n\n## Quality process\n\nTranslate, independently review, community check, then sign off. Everything is version-controlled so your team always knows which file is current.',
      capabilities: ['NAATI-certified translation', 'Plain-language and Easy English', 'Subtitling and captioning', 'Voiceover casting and direction', 'Terminology glossaries'],
    },
    {
      title: 'Community engagement', icon: '◎',
      summary: 'Partnerships, events and grassroots activation with the organisations communities already trust.',
      body: 'The most effective channel in multicultural Australia is often a person, not a platform.\n\n## Working through trusted messengers\n\nWe broker and manage relationships with community organisations, faith leaders, in-language media personalities and bicultural workers — and we make sure they are paid and credited for their work.',
      capabilities: ['Community partnership brokering', 'Bicultural worker programs', 'Events and activations', 'Ambassador and influencer programs', 'Stakeholder reporting'],
    },
    {
      title: 'Media planning & buying', icon: '◈',
      summary: 'Direct relationships with in-language press, community radio and diaspora digital publishers.',
      body: 'Mainstream media plans routinely under-deliver against multicultural audiences. We buy where the audience actually is.\n\n## Our network\n\nOver 300 in-language and community media partners across radio, press, digital and out-of-home, bought directly and reported transparently by language and community.',
      capabilities: ['In-language media planning', 'Community radio and press buying', 'Diaspora digital and social', 'Out-of-home in community precincts', 'Reporting by language and community'],
    },
  ];
  if (!isEmpty('services')) return;
  const stmt = db.prepare(`
    INSERT INTO services (id, slug, title, summary, body, icon, capabilities, status, is_featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1, ?)
  `);
  rows.forEach((row, index) => {
    stmt.run(uuidv4(), slugify(row.title), row.title, row.summary, row.body, row.icon, JSON.stringify(row.capabilities), index);
  });
}

function seedWork() {
  if (!isEmpty('work')) return;
  const rows = [
    {
      title: 'Getting 12 communities to book a health check',
      client: 'State Health Department', sector: 'Health', year: '2025',
      summary: 'A behaviour-change campaign that lifted screening bookings by 41% across twelve language communities.',
      challenge: 'Screening rates among culturally and linguistically diverse Victorians sat 23 points below the state average. Previous campaigns had been translated from English masters and were, in the words of one community leader, "clearly not written for us".',
      approach: 'We ran in-language focus groups across twelve communities, then rebuilt the concept around family responsibility rather than individual risk — the frame that tested strongest almost everywhere.\n\nDelivery ran through community radio, in-language press, GP waiting rooms and 40 bicultural workers who could book people in on the spot.',
      results: [{ value: '41%', label: 'Increase in bookings' }, { value: '12', label: 'Language communities' }, { value: '2.1m', label: 'In-language impressions' }],
      service_tags: ['Strategy', 'In-language creative', 'Community engagement', 'Media'],
      is_featured: 1,
    },
    {
      title: 'Explaining a new tenancy law in 18 languages',
      client: 'Consumer Affairs', sector: 'Government', year: '2025',
      summary: 'Plain-language explainers and community workshops that reached renters most at risk of exploitation.',
      challenge: 'A significant change to tenancy law was landing, and the renters most likely to be exploited were the least likely to read a government website.',
      approach: 'We produced Easy English and in-language explainers, short vertical video for diaspora social channels, and a workshop kit that community legal centres could run themselves.',
      results: [{ value: '18', label: 'Languages delivered' }, { value: '96k', label: 'Explainer downloads' }, { value: '54', label: 'Community workshops run' }],
      service_tags: ['Translation', 'Community engagement'],
      is_featured: 1,
    },
    {
      title: 'A recruitment campaign for bicultural aged care workers',
      client: 'National Aged Care Provider', sector: 'Not-for-profit', year: '2024',
      summary: 'Filling 120 roles in nine months by recruiting where the candidates actually were.',
      challenge: 'Vacancies were being advertised on mainstream job boards to an audience that was not using them, in a sector with a serious trust deficit.',
      approach: 'We built the campaign around existing staff telling their own stories in their own languages, and ran it through community Facebook groups, WhatsApp networks and in-language radio.',
      results: [{ value: '120', label: 'Roles filled' }, { value: '9mo', label: 'Time to fill' }, { value: '63%', label: 'Lower cost per hire' }],
      service_tags: ['Strategy', 'In-language creative', 'Media'],
      is_featured: 1,
    },
    {
      title: 'Emergency messaging that arrived before the flood did',
      client: 'Emergency Services Agency', sector: 'Government', year: '2024',
      summary: 'A standing in-language warning system built and tested before it was needed.',
      challenge: 'During the previous flood event, in-language warnings lagged English ones by up to 14 hours.',
      approach: 'We pre-translated and community-tested a warning library, set up an on-call linguist roster, and integrated approval into the agency’s existing incident workflow.',
      results: [{ value: '<45min', label: 'In-language warning turnaround' }, { value: '22', label: 'Languages on standby' }, { value: '100%', label: 'Warnings issued in-language' }],
      service_tags: ['Translation', 'Strategy'],
      is_featured: 0,
    },
  ];
  const stmt = db.prepare(`
    INSERT INTO work (id, slug, title, client, sector, year, summary, challenge, approach, results, service_tags, status, is_featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
  `);
  rows.forEach((row, index) => {
    stmt.run(uuidv4(), slugify(row.title), row.title, row.client, row.sector, row.year, row.summary,
      row.challenge, row.approach, JSON.stringify(row.results), JSON.stringify(row.service_tags), row.is_featured, index);
  });
}

function seedInsights() {
  if (!isEmpty('insights')) return;
  const rows = [
    {
      title: 'Translation is not a distribution strategy',
      category: 'Opinion', author: 'LOTE Strategy Team', published_at: '2026-07-14',
      excerpt: 'Translating the brochure at the end of the process is the single most common — and most expensive — mistake in multicultural campaigns.',
      body: 'Most multicultural budgets are spent at the wrong end of the process.\n\n## The pattern\n\nA campaign is developed in English, tested with English speakers, signed off, and then — three weeks before launch — someone asks what it costs to "do the languages".\n\nThe translation is accurate. The campaign still fails. Not because the words are wrong, but because the strategy behind them was built for an audience that does not include the people it is now supposedly aimed at.\n\n## What to do instead\n\n- Bring language communities into the research phase, not the production phase\n- Budget for community review before artwork is finalised\n- Test the concept, not just the copy\n- Buy in-language media as a line item, not an afterthought\n\nThe cost difference between doing this properly and doing it late is smaller than most teams assume. The performance difference is not.',
    },
    {
      title: 'Where multicultural audiences actually get their news',
      category: 'Research', author: 'LOTE Research', published_at: '2026-05-02',
      excerpt: 'Our 2026 media habits study across nine communities found WhatsApp and community radio outperforming every mainstream channel for trusted information.',
      body: 'We surveyed 1,840 people across nine language communities about where they go when they need to understand something important.\n\n## Headline findings\n\n1. Closed messaging groups — WhatsApp, WeChat, Viber — were named as a primary source by 61% of respondents\n2. Community radio remains dominant among audiences over 55\n3. Trust in a message depends more on who forwarded it than where it originated\n\n## What it means for planning\n\nIf your media plan is a mainstream buy with an in-language digital layer bolted on, you are buying reach without trust. The channels that carry trust are harder to buy and impossible to fake — they run through people.',
    },
    {
      title: 'Five questions to ask before signing off in-language creative',
      category: 'Practical', author: 'LOTE Creative', published_at: '2026-03-18',
      excerpt: 'A short checklist for teams who do not speak the languages their campaign is running in.',
      body: 'You cannot personally check the work. Here is how to be confident anyway.\n\n## The questions\n\n1. **Who reviewed this besides the translator?** One person is a draft, not a sign-off.\n2. **What reading level is it pitched at?** Aim for the level your audience reads comfortably, not the level the source document was written at.\n3. **Does the imagery work in every market it will run in?** Colour, gesture and family composition all carry meaning.\n4. **Is there a call to action someone can actually complete?** A phone line with no in-language operator is not a call to action.\n5. **Who is the messenger?** In most communities, the answer matters more than the message.',
    },
  ];
  const stmt = db.prepare(`
    INSERT INTO insights (id, slug, title, excerpt, body, category, author, published_at, status, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', 0)
  `);
  rows.forEach(row => {
    stmt.run(uuidv4(), slugify(row.title), row.title, row.excerpt, row.body, row.category, row.author, row.published_at);
  });
}

function seedRest() {
  seedCollection('team', ['name', 'role', 'bio', 'languages', 'status'], [
    { name: 'Priya Raman', role: 'Managing Director', bio: 'Twenty years across government communications and community advocacy.', languages: 'English, Tamil, Hindi', status: 'published' },
    { name: 'Hassan Nazari', role: 'Head of Strategy', bio: 'Behavioural science background, focused on health and emergency messaging.', languages: 'English, Dari, Farsi', status: 'published' },
    { name: 'Mei Ling Cho', role: 'Creative Director', bio: 'Leads transcreation and production across all campaigns.', languages: 'English, Cantonese, Mandarin', status: 'published' },
    { name: 'Andreas Papadopoulos', role: 'Head of Media', bio: 'Manages our community media network and buying.', languages: 'English, Greek', status: 'published' },
  ]);

  seedCollection('testimonials', ['quote', 'person', 'role', 'org', 'status'], [
    { quote: 'They told us our campaign would not work before we had spent the money. That is the whole reason we still work with them.', person: 'Director of Communications', role: 'Communications', org: 'State Health Department', status: 'published' },
    { quote: 'The first agency we have worked with that treats community consultation as a deliverable, not a favour.', person: 'Program Manager', role: 'Community Programs', org: 'National Aged Care Provider', status: 'published' },
    { quote: 'In-language warnings went from half a day behind to under an hour. That is a safety outcome, not a marketing one.', person: 'Deputy Commissioner', role: 'Operations', org: 'Emergency Services Agency', status: 'published' },
  ]);

  seedCollection('clients', ['name', 'status'], [
    { name: 'Dept. of Health', status: 'published' },
    { name: 'Consumer Affairs', status: 'published' },
    { name: 'City of Melbourne', status: 'published' },
    { name: 'Emergency Services', status: 'published' },
    { name: 'Settlement Services', status: 'published' },
    { name: 'Aged Care Australia', status: 'published' },
  ]);

  if (isEmpty('nav_items')) {
    const stmt = db.prepare('INSERT INTO nav_items (id, location, label, url, is_button, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    [
      ['header', 'Work', '/work', 0],
      ['header', 'Services', '/services', 0],
      ['header', 'About', '/about', 0],
      ['header', 'Insights', '/insights', 0],
      ['header', 'Contact', '/contact', 1],
      ['footer', 'Work', '/work', 0],
      ['footer', 'Services', '/services', 0],
      ['footer', 'About', '/about', 0],
      ['footer', 'Insights', '/insights', 0],
      ['footer', 'Contact', '/contact', 0],
    ].forEach((row, index) => stmt.run(uuidv4(), row[0], row[1], row[2], row[3], index));
  }

  if (isEmpty('form_fields')) {
    const stmt = db.prepare(`
      INSERT INTO form_fields (id, name, label, type, placeholder, help, options, is_required, width, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    [
      { name: 'name', label: 'Your name', type: 'text', required: 1, width: 'half' },
      { name: 'email', label: 'Email', type: 'email', required: 1, width: 'half' },
      { name: 'organisation', label: 'Organisation', type: 'text', width: 'half' },
      { name: 'phone', label: 'Phone', type: 'tel', width: 'half' },
      { name: 'services', label: 'What do you need help with?', type: 'checkboxes', width: 'full',
        options: ['Strategy', 'In-language creative', 'Translation', 'Community engagement', 'Media buying', 'Not sure yet'] },
      { name: 'budget', label: 'Indicative budget', type: 'select', width: 'half',
        options: ['Under $25k', '$25k – $75k', '$75k – $200k', '$200k+', 'Not yet defined'] },
      { name: 'timing', label: 'When does it need to launch?', type: 'text', width: 'half' },
      { name: 'message', label: 'Tell us about the project', type: 'textarea', required: 1, width: 'full',
        help: 'Who are you trying to reach, and what do you need them to do?' },
    ].forEach((field, index) => {
      stmt.run(uuidv4(), field.name, field.label, field.type, field.placeholder || '', field.help || '',
        JSON.stringify(field.options || []), field.required || 0, field.width, index);
    });
  }
}

function seed() {
  settingsStore.ensureDefaults();
  auth.ensureAdmin();
  seedPages();
  seedServices();
  seedWork();
  seedInsights();
  seedRest();
}

if (require.main === module) {
  seed();
  console.log('[cms] Seeded starter site content.');
}

module.exports = seed;
