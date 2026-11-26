// Home page designs the admin can choose (saved with the landing content in site_settings).
export const LANDING_TEMPLATES = [
  { id: 'classic', name: 'Classic split', description: 'Headline and search on the left, one-place launcher on the right.', swatch: ['226 71% 42%', '228 48% 11%', '18 94% 56%'] },
  { id: 'spotlight', name: 'Spotlight', description: 'Centred headline, wide search and three colourful start cards.', swatch: ['226 71% 42%', '162 63% 38%', '18 94% 56%'] },
  { id: 'aurora', name: 'Aurora', description: 'Glowing colour background with a glass search card and bright stats.', swatch: ['268 70% 58%', '190 80% 45%', '18 94% 56%'] },
  { id: 'midnight', name: 'Midnight', description: 'Dark, bold hero with ember glow and neon shortcuts.', swatch: ['228 48% 11%', '18 94% 56%', '226 80% 62%'] },
  { id: 'editorial', name: 'Editorial', description: 'Magazine-style headline with a live list of the newest openings.', swatch: ['36 33% 97%', '228 42% 12%', '18 94% 56%'] },
  { id: 'studio', name: 'Studio', description: 'A bright workspace, cinematic reveal and clean quick links.' },
  { id: 'horizon', name: 'Horizon', description: 'An immersive campus view with a sweeping entrance.' },
  { id: 'mosaic', name: 'Mosaic', description: 'Bold typography and a staggered grid of colourful destinations.' },
  { id: 'pulse', name: 'Pulse', description: 'A crisp opportunity feed with animated rows and live statistics.' },
  { id: 'atelier', name: 'Atelier', description: 'An editorial layout with photography and elegant line reveals.' },
] as const;

export type LandingTemplateId = typeof LANDING_TEMPLATES[number]['id'];
export const validLandingTemplate = (value: unknown): LandingTemplateId =>
  LANDING_TEMPLATES.some(t => t.id === value) ? value as LandingTemplateId : 'classic';
