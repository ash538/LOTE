// Block catalogue. Each entry describes one section type that can be dropped
// onto a page. `fields` drives the admin editor form; `template` names the EJS
// partial in server/views/blocks/. Adding a block here + a partial is all it
// takes to extend the page builder.

const LINK_FIELDS = [
  { name: 'label', label: 'Label', type: 'text' },
  { name: 'url', label: 'URL', type: 'text' },
  { name: 'style', label: 'Style', type: 'select', options: ['primary', 'secondary', 'ghost'] },
];

const BLOCKS = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Big opening statement with call-to-action buttons.',
    template: 'hero',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'textarea' },
      { name: 'intro', label: 'Intro paragraph', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'variant', label: 'Layout', type: 'select', options: ['split', 'centred', 'full-bleed'] },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted', 'primary', 'accent'] },
      { name: 'links', label: 'Buttons', type: 'repeater', fields: LINK_FIELDS },
    ],
    defaults: { variant: 'split', background: 'paper', links: [{ label: 'See our work', url: '/work', style: 'primary' }] },
  },
  {
    type: 'marquee',
    label: 'Scrolling marquee',
    description: 'Looping strip of words — good for capability lists or languages.',
    template: 'marquee',
    fields: [
      { name: 'items', label: 'Items', type: 'list' },
      { name: 'speed', label: 'Seconds per loop', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['primary', 'accent', 'ink', 'muted'] },
    ],
    defaults: { speed: '28', background: 'primary' },
  },
  {
    type: 'rich_text',
    label: 'Text section',
    description: 'Heading plus body copy (Markdown-ish formatting supported).',
    template: 'rich_text',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Body', type: 'richtext' },
      { name: 'align', label: 'Alignment', type: 'select', options: ['left', 'centred', 'two-column'] },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted', 'primary'] },
    ],
    defaults: { align: 'left', background: 'paper' },
  },
  {
    type: 'two_column',
    label: 'Text + image',
    description: 'Copy on one side, image on the other.',
    template: 'two_column',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Body', type: 'richtext' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'image_side', label: 'Image side', type: 'select', options: ['right', 'left'] },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
      { name: 'links', label: 'Buttons', type: 'repeater', fields: LINK_FIELDS },
    ],
    defaults: { image_side: 'right', background: 'paper' },
  },
  {
    type: 'stats',
    label: 'Stats row',
    description: 'Numbers that prove the point.',
    template: 'stats',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['muted', 'paper', 'primary', 'accent'] },
      {
        name: 'items', label: 'Stats', type: 'repeater',
        fields: [
          { name: 'value', label: 'Value', type: 'text' },
          { name: 'label', label: 'Label', type: 'text' },
        ],
      },
    ],
    defaults: { background: 'muted' },
  },
  {
    type: 'feature_grid',
    label: 'Feature grid',
    description: 'Three or four supporting points.',
    template: 'feature_grid',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'intro', label: 'Intro', type: 'textarea' },
      { name: 'columns', label: 'Columns', type: 'select', options: ['3', '2', '4'] },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
      {
        name: 'items', label: 'Features', type: 'repeater',
        fields: [
          { name: 'icon', label: 'Icon / emoji', type: 'text' },
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'text', label: 'Text', type: 'textarea' },
          { name: 'url', label: 'Link URL', type: 'text' },
        ],
      },
    ],
    defaults: { columns: '3', background: 'paper' },
  },
  {
    type: 'services_list',
    label: 'Services',
    description: 'Pulls live entries from the Services collection.',
    template: 'services_list',
    source: 'services',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'intro', label: 'Intro', type: 'textarea' },
      { name: 'limit', label: 'How many (blank = all)', type: 'text' },
      { name: 'featured_only', label: 'Featured only', type: 'checkbox' },
      { name: 'layout', label: 'Layout', type: 'select', options: ['rows', 'cards'] },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: { layout: 'rows', background: 'paper', heading: 'What we do' },
  },
  {
    type: 'work_grid',
    label: 'Case studies',
    description: 'Pulls live entries from the Work collection.',
    template: 'work_grid',
    source: 'work',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'intro', label: 'Intro', type: 'textarea' },
      { name: 'limit', label: 'How many (blank = all)', type: 'text' },
      { name: 'featured_only', label: 'Featured only', type: 'checkbox' },
      { name: 'show_filters', label: 'Show sector filters', type: 'checkbox' },
      { name: 'link_label', label: 'Footer link label', type: 'text' },
      { name: 'link_url', label: 'Footer link URL', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: { heading: 'Selected work', limit: '4', background: 'paper', link_label: 'All case studies', link_url: '/work' },
  },
  {
    type: 'insights_list',
    label: 'Insights',
    description: 'Pulls live entries from the Insights collection.',
    template: 'insights_list',
    source: 'insights',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'limit', label: 'How many', type: 'text' },
      { name: 'link_label', label: 'Footer link label', type: 'text' },
      { name: 'link_url', label: 'Footer link URL', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: { heading: 'Thinking', limit: '3', link_label: 'All insights', link_url: '/insights' },
  },
  {
    type: 'logos',
    label: 'Client logos',
    description: 'Pulls the Clients collection.',
    template: 'logos',
    source: 'clients',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: { heading: 'Trusted by', background: 'muted' },
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Pulls the Testimonials collection.',
    template: 'testimonials',
    source: 'testimonials',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'limit', label: 'How many', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['primary', 'paper', 'muted', 'accent'] },
    ],
    defaults: { background: 'primary', limit: '3' },
  },
  {
    type: 'team_grid',
    label: 'Team',
    description: 'Pulls the Team collection.',
    template: 'team_grid',
    source: 'team',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'intro', label: 'Intro', type: 'textarea' },
      { name: 'limit', label: 'How many (blank = all)', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: { heading: 'The team' },
  },
  {
    type: 'accordion',
    label: 'FAQ / accordion',
    description: 'Expandable question and answer list.',
    template: 'accordion',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
      {
        name: 'items', label: 'Items', type: 'repeater',
        fields: [
          { name: 'question', label: 'Question', type: 'text' },
          { name: 'answer', label: 'Answer', type: 'richtext' },
        ],
      },
    ],
    defaults: { heading: 'Common questions' },
  },
  {
    type: 'gallery',
    label: 'Image gallery',
    description: 'Grid of images.',
    template: 'gallery',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'columns', label: 'Columns', type: 'select', options: ['3', '2', '4'] },
      { name: 'images', label: 'Images', type: 'imagelist' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: { columns: '3' },
  },
  {
    type: 'video',
    label: 'Video embed',
    description: 'YouTube or Vimeo embed.',
    template: 'video',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'embed_url', label: 'Embed URL', type: 'text' },
      { name: 'caption', label: 'Caption', type: 'text' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted', 'ink'] },
    ],
    defaults: { background: 'ink' },
  },
  {
    type: 'cta_banner',
    label: 'Call to action',
    description: 'Full-width prompt to get in touch.',
    template: 'cta_banner',
    fields: [
      { name: 'heading', label: 'Heading', type: 'textarea' },
      { name: 'text', label: 'Supporting text', type: 'textarea' },
      { name: 'background', label: 'Background', type: 'select', options: ['accent', 'primary', 'ink', 'muted'] },
      { name: 'links', label: 'Buttons', type: 'repeater', fields: LINK_FIELDS },
    ],
    defaults: { background: 'accent', links: [{ label: 'Get in touch', url: '/contact', style: 'primary' }] },
  },
  {
    type: 'contact_form',
    label: 'Enquiry form',
    description: 'Renders the form built in the Form builder screen.',
    template: 'contact_form',
    fields: [
      { name: 'heading', label: 'Heading (blank = use setting)', type: 'text' },
      { name: 'intro', label: 'Intro (blank = use setting)', type: 'textarea' },
      { name: 'show_details', label: 'Show contact details beside form', type: 'checkbox' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: { show_details: true },
  },
  {
    type: 'html',
    label: 'Custom HTML',
    description: 'Escape hatch for embeds and anything bespoke.',
    template: 'html',
    fields: [
      { name: 'html', label: 'HTML', type: 'textarea' },
      { name: 'background', label: 'Background', type: 'select', options: ['paper', 'muted'] },
    ],
    defaults: {},
  },
];

const BY_TYPE = Object.fromEntries(BLOCKS.map(b => [b.type, b]));

function defaultsFor(type) {
  const def = BY_TYPE[type];
  return def ? JSON.parse(JSON.stringify(def.defaults || {})) : {};
}

module.exports = { BLOCKS, BY_TYPE, defaultsFor };
