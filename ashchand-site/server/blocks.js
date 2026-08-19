// Section catalogue. Each entry is one section type from the approved design.
// `fields` drives the admin editor; `template` names the partial in
// server/views/blocks/. Every section can carry an anchor so the nav can jump
// to it on the single-page layout.

const BLOCKS = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Opening statement with portrait.',
    template: 'hero',
    fields: [
      { name: 'kicker', label: 'Kicker (small line above)', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'textarea' },
      { name: 'intro', label: 'Intro paragraph', type: 'textarea' },
      { name: 'link_label', label: 'Text link label', type: 'text' },
      { name: 'link_url', label: 'Text link URL', type: 'text' },
      { name: 'button_label', label: 'Button label', type: 'text' },
      { name: 'button_url', label: 'Button URL', type: 'text' },
      { name: 'portrait', label: 'Portrait image', type: 'image' },
      { name: 'portrait_alt', label: 'Portrait alt text', type: 'text' },
      { name: 'portrait_label', label: 'Portrait corner label', type: 'text' },
      { name: 'portrait_caption', label: 'Portrait caption', type: 'text' },
    ],
    defaults: {
      link_label: 'Read my story', link_url: '#story',
      button_label: 'Work with me ↗', button_url: '#contact',
    },
  },
  {
    type: 'values_bar',
    label: 'Values bar',
    description: 'Dark strip: a statement plus short value pairs.',
    template: 'values_bar',
    fields: [
      { name: 'statement', label: 'Statement', type: 'textarea' },
      {
        name: 'items', label: 'Values', type: 'repeater',
        fields: [
          { name: 'value', label: 'Word', type: 'text' },
          { name: 'label', label: 'Under it', type: 'text' },
        ],
      },
    ],
    defaults: {},
  },
  {
    type: 'story',
    label: 'Story list',
    description: 'Sticky section title beside a numbered list of stories.',
    template: 'story',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Section heading', type: 'textarea' },
      { name: 'intro', label: 'Section intro', type: 'textarea' },
      {
        name: 'items', label: 'Stories', type: 'repeater',
        fields: [
          { name: 'eyebrow', label: 'Label', type: 'text' },
          { name: 'heading', label: 'Heading', type: 'textarea' },
          { name: 'text', label: 'Text', type: 'textarea' },
        ],
      },
    ],
    defaults: { eyebrow: 'My story' },
  },
  {
    type: 'quote_feature',
    label: 'Quote feature',
    description: 'Butter-coloured section with a large pull quote.',
    template: 'quote_feature',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'textarea' },
      { name: 'quote', label: 'Quote', type: 'textarea' },
      { name: 'note', label: 'Note under the quote', type: 'textarea' },
    ],
    defaults: {},
  },
  {
    type: 'timeline',
    label: 'Experience timeline',
    description: 'Roles listed with a period, title, organisation and detail.',
    template: 'timeline',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Section heading', type: 'textarea' },
      { name: 'intro', label: 'Section intro', type: 'textarea' },
      {
        name: 'items', label: 'Roles', type: 'repeater',
        fields: [
          { name: 'period', label: 'Period', type: 'text' },
          { name: 'title', label: 'Role', type: 'text' },
          { name: 'org', label: 'Organisation', type: 'text' },
          { name: 'text', label: 'Detail', type: 'textarea' },
        ],
      },
    ],
    defaults: { eyebrow: 'Experience' },
  },
  {
    type: 'capabilities',
    label: 'What I do (dark)',
    description: 'Dark section listing numbered capabilities.',
    template: 'capabilities',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Section heading', type: 'textarea' },
      { name: 'intro', label: 'Section intro', type: 'textarea' },
      {
        name: 'items', label: 'Capabilities', type: 'repeater',
        fields: [
          { name: 'heading', label: 'Heading', type: 'text' },
          { name: 'text', label: 'Text', type: 'textarea' },
        ],
      },
    ],
    defaults: { eyebrow: 'What I can do for you' },
  },
  {
    type: 'beliefs',
    label: 'Positions',
    description: 'Numbered arguments you are willing to defend.',
    template: 'beliefs',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Section heading', type: 'textarea' },
      { name: 'intro', label: 'Section intro', type: 'textarea' },
      {
        name: 'items', label: 'Positions', type: 'repeater',
        fields: [
          { name: 'eyebrow', label: 'Label', type: 'text' },
          { name: 'heading', label: 'Position', type: 'textarea' },
          { name: 'text', label: 'Text', type: 'textarea' },
        ],
      },
    ],
    defaults: { eyebrow: 'What I argue' },
  },
  {
    type: 'writing',
    label: 'Writing feature',
    description: 'Butter section featuring an essay, with an optional note box.',
    template: 'writing',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Essay title', type: 'textarea' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'button_label', label: 'Button label', type: 'text' },
      { name: 'file', label: 'Essay file (PDF)', type: 'file' },
      { name: 'button_url', label: 'Or link to a URL instead', type: 'text' },
      { name: 'meta', label: 'Label beside the button', type: 'text' },
      { name: 'note_title', label: 'Note box title', type: 'text' },
      { name: 'note_text', label: 'Note box text', type: 'textarea' },
      { name: 'note_url', label: 'Note box link', type: 'text' },
    ],
    defaults: { eyebrow: 'Essay / working draft', button_label: 'Read the draft ↗' },
  },
  {
    type: 'contact',
    label: 'Contact',
    description: 'Enquiry form built from the Form builder screen.',
    template: 'contact',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'textarea' },
      { name: 'intro', label: 'Intro', type: 'textarea' },
      { name: 'form_kicker', label: 'Label on the form', type: 'text' },
    ],
    defaults: { eyebrow: 'Work with me', form_kicker: 'Enquiry' },
  },
  {
    type: 'rich_text',
    label: 'Text section',
    description: 'Plain section: heading plus body copy.',
    template: 'rich_text',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'textarea' },
      { name: 'body', label: 'Body', type: 'richtext' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'butter', 'ink'] },
    ],
    defaults: { background: 'paper' },
  },
  {
    type: 'html',
    label: 'Custom HTML',
    description: 'Escape hatch for embeds and anything bespoke.',
    template: 'html',
    fields: [
      { name: 'html', label: 'HTML', type: 'textarea' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'butter', 'ink'] },
    ],
    defaults: { background: 'paper' },
  },
];

const BY_TYPE = Object.fromEntries(BLOCKS.map(b => [b.type, b]));

function defaultsFor(type) {
  const def = BY_TYPE[type];
  return def ? JSON.parse(JSON.stringify(def.defaults || {})) : {};
}

module.exports = { BLOCKS, BY_TYPE, defaultsFor };
