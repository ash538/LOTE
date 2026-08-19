// Seeds the site with the approved design's content. Idempotent: it only fills
// tables that are empty, so it never overwrites edits made in the admin.
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const settingsStore = require('./settings');
const auth = require('./auth');
const { defaultsFor } = require('./blocks');

const isEmpty = table => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n === 0;

function seedHome() {
  if (!isEmpty('pages')) return;

  const pageId = uuidv4();
  db.prepare(`
    INSERT INTO pages (id, slug, title, status, sort_order, seo_description, is_locked)
    VALUES (?, 'home', 'Home', 'published', 0, ?, 1)
  `).run(pageId, settingsStore.get('seo_description'));

  const blocks = [
    {
      type: 'hero',
      data: {
        kicker: 'Ash Chand / Melbourne, Australia',
        heading: 'I help organisations get better at humans.',
        intro: "I am a CEO, facilitator and writer. I am Fijian Indian. I have ADHD and Tourette's. I am also unreasonably interested in what fifty years of research actually says about leadership.",
        link_label: 'Read my story',
        link_url: '#story',
        button_label: 'Work with me',
        button_url: '#contact',
        portrait: '',
        portrait_alt: 'Ash Chand outdoors',
        portrait_label: 'ASH\nCHAND',
        portrait_caption: 'Leadership / culture / neurodivergence',
      },
    },
    {
      type: 'values_bar',
      data: {
        statement: 'I do not sell leadership slogans. I help people see their own conditions more clearly, then build the capability to act differently inside them.',
        items: [
          { value: 'Fijian', label: 'Indian Australian' },
          { value: 'ADHD', label: "and Tourette's" },
          { value: 'Evidence', label: 'over fashion' },
        ],
      },
    },
    {
      type: 'story',
      anchor: 'story',
      data: {
        eyebrow: 'My story',
        heading: 'Four things that made me useful.',
        intro: 'I am not a neutral observer of this work. Culture, neurodivergence and the experience of not quite fitting are the reasons I see what I see.',
        items: [
          {
            eyebrow: 'Fiji · India · Australia',
            heading: 'I come from people who moved.',
            text: "I am Fijian Indian, raised in Australia. That inheritance is not decoration on a bio; it is how I read a room. When your family has crossed oceans and rebuilt in someone else's system, you learn early that the same behaviour can mean respect in one culture and defiance in another.",
          },
          {
            eyebrow: "ADHD · Tourette's",
            heading: 'My brain works differently, and it is why I am good at this.',
            text: "I have ADHD and Tourette's. I did not shine in English at school, and I still write the way I think: fast, associative, and slightly chaotic until it lands. What comes with it is hyperfocus. When something matters, I go all the way down — into the research, the psychology and the accepted answer that does not hold up.",
          },
          {
            eyebrow: 'Belonging · masking',
            heading: 'I know the cost of shrinking to fit.',
            text: 'Most workplaces quietly ask people to edit themselves: their accent, energy, tics or story. I have done that editing. It is expensive, and organisations pay for it in capability they never see. My work is about removing the need to mask, not rewarding people who mask well.',
          },
          {
            eyebrow: 'Practice · lineage',
            heading: 'Experiences activate behaviours.',
            text: 'Four words from the late Reggie Butler, whose Examined Human practice we carry in Australia. He taught in rooms, through dialogue, story and shared meals, because the body learns what a slide deck cannot teach. Fifty years of research agrees with him.',
          },
        ],
      },
    },
    {
      type: 'quote_feature',
      data: {
        eyebrow: 'What I keep coming back to',
        heading: 'The room teaches what the slide deck cannot.',
        quote: 'Experiences activate behaviours.',
        note: 'Behaviour changes through practice, repetition and reflection in your actual context — not through content delivered once. This is the standard I use for every engagement.',
      },
    },
    {
      type: 'timeline',
      anchor: 'experience',
      data: {
        eyebrow: 'Experience',
        heading: 'Where I have done the work.',
        intro: 'Executive leadership, experiential facilitation and models designed for Australian conditions rather than imported untested.',
        items: [
          {
            period: 'Now',
            title: 'Chief Executive Officer',
            org: 'LOTE Agency',
            text: 'Leading a multicultural engagement and communications practice across strategy, in-language communication and community engagement for government, health and not-for-profit clients.',
          },
          {
            period: 'Now',
            title: 'Facilitator, Examined Human',
            org: 'Australia / Reggie Butler practice lineage',
            text: 'Carrying an experiential leadership practice built on self-examination, dialogue and behaviour change rather than framework fluency.',
          },
          {
            period: 'Ongoing',
            title: 'Co-creator, the 4 Cs',
            org: 'With Bwe Thay',
            text: 'A practical model for multicultural engagement built for Australian conditions rather than imported untested from another market.',
          },
          {
            period: 'Ongoing',
            title: 'Speaker, writer and advisor',
            org: 'Leadership / culture / inclusive service design',
            text: 'Writing and speaking on evidence-based leadership, cultural intelligence, neurodivergence, and designing services with the people who use them.',
          },
        ],
      },
    },
    {
      type: 'capabilities',
      anchor: 'work',
      data: {
        eyebrow: 'What I can do for you',
        heading: 'Four ways I am useful.',
        intro: 'No trademarked pyramid. I diagnose the conditions you are missing, then build capability that survives past the workshop.',
        items: [
          {
            heading: 'Leadership capability, built on evidence',
            text: 'I do not sell a branded framework. I diagnose which conditions your organisation is missing — safety, autonomy, clarity, fairness, relationship quality, expectations, progress and workload — and build the bundle that fits your context.',
          },
          {
            heading: 'Cultural intelligence that is operational',
            text: 'Cultural intelligence predicts performance beyond IQ and personality. I help leaders translate behaviour across cultures so feedback, disagreement and recognition land the way they were intended.',
          },
          {
            heading: 'Neuroinclusion without the poster campaign',
            text: "I speak about ADHD and Tourette's from the inside. The practical work is redesigning meetings, feedback, hiring and communication so different brains can do their best work.",
          },
          {
            heading: 'Engagement and communication that reaches people',
            text: 'Communities are not hard to reach; they are poorly designed for. I build engagement and in-language communication that treats access and equity as design requirements, not afterthoughts.',
          },
        ],
      },
    },
    {
      type: 'beliefs',
      data: {
        eyebrow: 'What I argue',
        heading: 'Positions I can defend.',
        intro: 'These come out of research, lived experience and doing the work. I am happy to be challenged on any of them.',
        items: [
          {
            eyebrow: 'Frameworks',
            heading: 'There is no silver framework. There is a system of conditions.',
            text: 'The right question was never “which framework?” but “which conditions is this organisation missing?” A model trained well but unsupported by evidence is still not capability.',
          },
          {
            eyebrow: 'Capability',
            heading: 'Framework fluency is evidence of reading, not of leadership.',
            text: 'Information-transfer training barely changes behaviour. Practice-based, spaced, feedback-rich learning does. Changed behaviour months later is the only proof that counts.',
          },
          {
            eyebrow: 'Culture',
            heading: 'Some foundations travel. Their expression does not.',
            text: 'Rolling out an untranslated model in a culturally diverse workforce is not evidence-based practice. It is a guess wearing a lanyard.',
          },
        ],
      },
    },
    {
      type: 'writing',
      anchor: 'writing',
      data: {
        eyebrow: 'Essay / working draft',
        heading: 'Which Leadership Framework Is the Right One?',
        summary: 'Fifty years of meta-analytic research, read honestly: why the famous frameworks do not hold, which conditions actually move people, why culture changes what works, and how to build tools for the organisation you are actually in.',
        button_label: 'Read the draft ↗',
        file: '',
        button_url: '',
        meta: 'Research-led long read',
        note_title: 'Substack',
        note_text: 'Future essays and notes will publish here. Add the link in the admin once your Substack is live.',
        note_url: '',
      },
    },
    {
      type: 'contact',
      anchor: 'contact',
      data: {
        eyebrow: 'Work with me',
        heading: 'Tell me what you are trying to move.',
        intro: 'Whether it is a keynote, leadership program, culture diagnostic or a conversation about where to start, I will tell you honestly whether I am the right person for it.',
        form_kicker: 'Enquiry',
      },
    },
  ];

  const stmt = db.prepare('INSERT INTO blocks (id, page_id, type, anchor, data, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  blocks.forEach((block, index) => {
    stmt.run(uuidv4(), pageId, block.type, block.anchor || '',
      JSON.stringify(Object.assign(defaultsFor(block.type), block.data || {})), index);
  });
}

function seedNav() {
  if (!isEmpty('nav_items')) return;
  const stmt = db.prepare('INSERT INTO nav_items (id, location, label, url, is_button, new_tab, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  [
    ['header', 'My story', '/#story', 0, 0],
    ['header', 'Experience', '/#experience', 0, 0],
    ['header', 'What I do', '/#work', 0, 0],
    ['header', 'Writing', '/#writing', 0, 0],
    ['header', 'Work with me', '/#contact', 1, 0],
    ['footer', 'LinkedIn', 'https://www.linkedin.com/in/ash-chand-494bb593', 0, 1],
  ].forEach((row, index) => stmt.run(uuidv4(), row[0], row[1], row[2], row[3], row[4], index));
}

function seedFormFields() {
  if (!isEmpty('form_fields')) return;
  const stmt = db.prepare(`
    INSERT INTO form_fields (id, name, label, type, placeholder, help, options, is_required, width, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, '[]', ?, 'full', ?)
  `);
  [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'Your name', required: 1 },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@organisation.com', required: 1 },
    { name: 'organisation', label: 'Organisation', type: 'text', placeholder: 'Where you work', required: 0 },
    {
      name: 'question', label: 'What is the real question?', type: 'textarea',
      placeholder: 'A little context helps me prepare something useful.', required: 1,
    },
  ].forEach((field, index) => {
    stmt.run(uuidv4(), field.name, field.label, field.type, field.placeholder, field.help || '', field.required, index);
  });
}

function seed() {
  settingsStore.ensureDefaults();
  auth.ensureAdmin();
  seedHome();
  seedNav();
  seedFormFields();
}

if (require.main === module) {
  seed();
  console.log('[site] Seeded content.');
}

module.exports = seed;
