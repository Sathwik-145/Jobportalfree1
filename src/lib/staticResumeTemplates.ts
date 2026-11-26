// Built-in starter set so the Resume Templates page is never empty.
// Admin-added templates from the DB are merged on top of these.

export interface StaticTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_url: string;
  download_url: string;
  source_url?: string;
}

const PREVIEW = (label: string, color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='${color}' stop-opacity='0.95'/>
        <stop offset='100%' stop-color='${color}' stop-opacity='0.45'/>
      </linearGradient></defs>
      <rect width='300' height='400' fill='url(#g)'/>
      <rect x='24' y='28' width='180' height='14' rx='4' fill='white' opacity='0.95'/>
      <rect x='24' y='52' width='120' height='8' rx='3' fill='white' opacity='0.7'/>
      <rect x='24' y='90' width='252' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='104' width='220' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='118' width='240' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='150' width='90' height='10' rx='3' fill='white' opacity='0.9'/>
      <rect x='24' y='170' width='252' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='184' width='200' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='210' width='90' height='10' rx='3' fill='white' opacity='0.9'/>
      <rect x='24' y='230' width='252' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='244' width='220' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='270' width='90' height='10' rx='3' fill='white' opacity='0.9'/>
      <rect x='24' y='290' width='252' height='6' rx='3' fill='white' opacity='0.55'/>
      <rect x='24' y='304' width='180' height='6' rx='3' fill='white' opacity='0.55'/>
      <text x='150' y='370' font-family='system-ui,sans-serif' font-weight='700' font-size='18'
        fill='white' text-anchor='middle' opacity='0.95'>${label}</text>
    </svg>`,
  )}`;

export const STATIC_RESUME_TEMPLATES: StaticTemplate[] = [
  {
    id: "static-modern-pro",
    name: "Modern Professional",
    description: "Clean two-column layout perfect for software engineers.",
    category: "Modern",
    preview_url: PREVIEW("Modern Pro", "#3b82f6"),
    download_url: "https://www.overleaf.com/latex/templates/faangpath-simple-template/npsfpdqnxmbc",
    source_url: "https://www.overleaf.com/latex/templates/faangpath-simple-template/npsfpdqnxmbc",
  },
  {
    id: "static-classic-ats",
    name: "Classic ATS-Friendly",
    description: "Single column, parser-safe — beats ATS filters with ease.",
    category: "ATS",
    preview_url: PREVIEW("Classic ATS", "#0ea5e9"),
    download_url: "https://create.microsoft.com/en-us/template/ats-resume-49a13c7d-2ef7-4f64-9b3f-b8b6d3a3b234",
  },
  {
    id: "static-creative-designer",
    name: "Creative Designer",
    description: "Bold colour blocks for designers, marketers, and creators.",
    category: "Creative",
    preview_url: PREVIEW("Creative", "#ec4899"),
    download_url: "https://www.canva.com/resumes/templates/creative/",
  },
  {
    id: "static-minimal-elegant",
    name: "Minimal Elegant",
    description: "Whitespace-heavy and elegant — great for senior roles.",
    category: "Minimal",
    preview_url: PREVIEW("Minimal", "#0f172a"),
    download_url: "https://www.overleaf.com/latex/templates/awesome-cv/byxwvfvxhgvf",
  },
  {
    id: "static-fresher-grad",
    name: "Fresher / Graduate",
    description: "Education-first layout for college students and freshers.",
    category: "Fresher",
    preview_url: PREVIEW("Fresher", "#14b8a6"),
    download_url: "https://www.overleaf.com/latex/templates/student-cv/btfdsngmrdsq",
  },
  {
    id: "static-data-scientist",
    name: "Data Scientist",
    description: "Skills-and-projects forward layout tuned for data roles.",
    category: "Tech",
    preview_url: PREVIEW("Data Sci", "#8b5cf6"),
    download_url: "https://www.overleaf.com/latex/templates/data-scientist-cv/wfqsfqzqxgwc",
  },
  {
    id: "static-executive",
    name: "Executive",
    description: "Outcome-driven executive resume with achievements bullets.",
    category: "Executive",
    preview_url: PREVIEW("Executive", "#b45309"),
    download_url: "https://create.microsoft.com/en-us/template/executive-resume-7c1f9e2a",
  },
  {
    id: "static-product-manager",
    name: "Product Manager",
    description: "Impact-first PM resume showcasing metrics and launches.",
    category: "PM",
    preview_url: PREVIEW("PM", "#10b981"),
    download_url: "https://www.canva.com/resumes/templates/product-manager/",
  },
];
