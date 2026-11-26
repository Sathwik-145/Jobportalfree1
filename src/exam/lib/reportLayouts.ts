export const REPORT_LAYOUT_KEY = 'result_pdf_layout';
type RGB = [number, number, number];
/** Seven colourful designs; every design keeps the same scored content and answer review. */
export const REPORT_LAYOUTS = [
  { id: 'classic', name: 'Classic Emerald', description: 'Centred score with an emerald header band', base: 'classic', colors: { dark: [15, 23, 42], accent: [16, 185, 129], light: [236, 253, 245] } },
  { id: 'compact', name: 'Compact Sapphire', description: 'Space-saving header in royal blue', base: 'compact', colors: { dark: [30, 58, 138], accent: [37, 99, 235], light: [239, 246, 255] } },
  { id: 'editorial', name: 'Editorial Ember', description: 'Large title with an orange score panel', base: 'editorial', colors: { dark: [67, 20, 7], accent: [234, 88, 12], light: [255, 237, 213] } },
  { id: 'ocean', name: 'Ocean Teal', description: 'Deep teal header with aqua highlights', base: 'classic', colors: { dark: [19, 78, 74], accent: [20, 184, 166], light: [240, 253, 250] } },
  { id: 'royal', name: 'Royal Violet', description: 'Rich violet header with lavender score card', base: 'classic', colors: { dark: [59, 7, 100], accent: [147, 51, 234], light: [245, 243, 255] } },
  { id: 'sunset', name: 'Sunset Rose', description: 'Warm rose header with a pink score panel', base: 'editorial', colors: { dark: [136, 19, 55], accent: [225, 29, 72], light: [255, 228, 230] } },
  { id: 'gold', name: 'Golden Merit', description: 'Charcoal and gold certificate style', base: 'compact', colors: { dark: [41, 37, 36], accent: [202, 138, 4], light: [254, 249, 195] } },
] as const satisfies readonly { id: string; name: string; description: string; base: 'classic' | 'compact' | 'editorial'; colors: { dark: RGB; accent: RGB; light: RGB } }[];
export type ReportLayout = typeof REPORT_LAYOUTS[number]['id'];
export const validReportLayout = (value: unknown): ReportLayout => REPORT_LAYOUTS.some(x => x.id === value) ? value as ReportLayout : 'classic';
export const reportLayoutInfo = (id: ReportLayout) => REPORT_LAYOUTS.find(x => x.id === id)!;
