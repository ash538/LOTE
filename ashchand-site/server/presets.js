// One-click starting points for the design controls. Choosing a preset in the
// admin just fills in the individual settings, so anything can be nudged
// afterwards — nothing here locks you in.

const FONT_PAIRINGS = [
  {
    id: 'editorial',
    label: 'Editorial',
    note: 'The current pairing — a high-contrast display serif over a clean grotesque.',
    heading: '"DM Serif Display", Georgia, serif',
    body: 'Manrope, Arial, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap',
  },
  {
    id: 'classic',
    label: 'Classic',
    note: 'Warmer and softer. Fraunces has a bookish feel.',
    heading: 'Fraunces, Georgia, serif',
    body: 'Inter, Arial, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700;800&display=swap',
  },
  {
    id: 'stately',
    label: 'Stately',
    note: 'Playfair is formal and a little glamorous.',
    heading: '"Playfair Display", Georgia, serif',
    body: '"Source Sans 3", Arial, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
  },
  {
    id: 'swiss',
    label: 'Swiss',
    note: 'No serif at all. Confident and contemporary.',
    heading: '"Space Grotesk", Helvetica, sans-serif',
    body: 'Inter, Arial, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap',
  },
  {
    id: 'loud',
    label: 'Loud',
    note: 'Heavy headlines that shout. Good for short statements.',
    heading: '"Archivo Black", Impact, sans-serif',
    body: 'Archivo, Arial, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&display=swap',
  },
  {
    id: 'quiet',
    label: 'Quiet',
    note: 'Understated and literary. Lets the writing lead.',
    heading: '"EB Garamond", Georgia, serif',
    body: 'Jost, Arial, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=Jost:wght@400;500;600;700&display=swap',
  },
  {
    id: 'technical',
    label: 'Technical',
    note: 'Even and precise. Reads as considered rather than expressive.',
    heading: '"IBM Plex Serif", Georgia, serif',
    body: '"IBM Plex Sans", Arial, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;500;600&display=swap',
  },
  {
    id: 'system',
    label: 'System',
    note: 'No web fonts at all. Fastest possible, uses whatever the visitor has.',
    heading: 'Georgia, "Times New Roman", serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    import: '',
  },
];

const PALETTES = [
  {
    id: 'oxblood',
    label: 'Oxblood & butter',
    note: 'The current palette.',
    paper: '#f7f3eb', ink: '#151310', accent: '#7e1f30', highlight: '#f1d28a', muted: '#64605a',
  },
  {
    id: 'forest',
    label: 'Forest & sand',
    note: 'Calmer and more natural.',
    paper: '#f6f4ee', ink: '#161a15', accent: '#2f5d3f', highlight: '#e3d3b0', muted: '#5f6259',
  },
  {
    id: 'navy',
    label: 'Navy & coral',
    note: 'Crisper and more corporate, with a warm lift.',
    paper: '#f6f6f4', ink: '#111827', accent: '#1e3a5f', highlight: '#f3b8a0', muted: '#5b6472',
  },
  {
    id: 'ink',
    label: 'Ink & ochre',
    note: 'Nearly monochrome with one warm accent.',
    paper: '#f4f2ee', ink: '#131313', accent: '#a35400', highlight: '#e8cf9c', muted: '#63605b',
  },
  {
    id: 'plum',
    label: 'Plum & blush',
    note: 'Softer and less formal.',
    paper: '#f9f5f4', ink: '#1c1418', accent: '#6b2b4f', highlight: '#f0cdd3', muted: '#6a5d63',
  },
  {
    id: 'teal',
    label: 'Teal & gold',
    note: 'Cooler, with a richer highlight.',
    paper: '#f2f5f4', ink: '#0f1c1c', accent: '#14554f', highlight: '#e6c46a', muted: '#5a6664',
  },
  {
    id: 'mono',
    label: 'Monochrome',
    note: 'Black, white and one grey. Nowhere to hide.',
    paper: '#ffffff', ink: '#000000', accent: '#000000', highlight: '#ebebeb', muted: '#666666',
  },
  {
    id: 'night',
    label: 'Night',
    note: 'Dark background. Check your images still work on it.',
    paper: '#14140f', ink: '#f3efe6', accent: '#e2a13c', highlight: '#2b2b22', muted: '#a09a8c',
  },
];

module.exports = { FONT_PAIRINGS, PALETTES };
