/** Plain-English meanings for spec terms shoppers run into. Keys are matched case-insensitively. */
export const GLOSSARY: { term: string; pattern: RegExp; meaning: string }[] = [
  { term: "LTPO", pattern: /\bLTPO\b/i, meaning: "A screen that slows its refresh rate when nothing moves, saving battery." },
  { term: "OLED", pattern: /\b(?:P-?OLED|AMOLED|OLED)\b/i, meaning: "Each pixel makes its own light: true blacks, strong contrast and usually better battery on dark screens." },
  { term: "LCD", pattern: /\b(?:LCD|IPS|TN)\b/, meaning: "A backlit screen. Cheaper than OLED, with greyer blacks; TN panels have narrower viewing angles." },
  { term: "Refresh rate", pattern: /\b\d{2,3}\s?Hz\b/i, meaning: "How many times a second the screen redraws. 120Hz+ makes scrolling and games look smoother." },
  { term: "Resolution", pattern: /\b(?:HD\+|FHD\+?|QHD\+?|1\.5K|2\.5K|2\.4K|3K|4K|WUXGA|WQXGA)\b/, meaning: "How many pixels the screen has. Higher looks sharper, especially on bigger screens." },
  { term: "mAh", pattern: /\b[\d,]+\s?mAh\b/i, meaning: "Phone battery size. 5,000 mAh lasts most people a day; 6,500+ is heavy-use territory." },
  { term: "Wh", pattern: /\b\d+\s?Wh\b/, meaning: "Laptop battery size in watt-hours. Around 50 Wh is typical; 70+ Wh lasts noticeably longer." },
  { term: "Charging watts", pattern: /\b\d+\s?W\b(?!h)/, meaning: "Fast-charging speed. Higher charges quicker; 65W+ usually fills a phone in under an hour." },
  { term: "RAM", pattern: /\bRAM\b/, meaning: "Short-term memory for running apps. More RAM keeps more apps and tabs open without reloading." },
  { term: "RTX", pattern: /\bRTX\s?\d{4}\b/i, meaning: "NVIDIA's dedicated gaming graphics. A higher number within a generation is faster (RTX 5060 > 5050)." },
  { term: "Integrated graphics", pattern: /\bintegrated\b|\bIris Xe\b|\bRadeon \d{3}M\b|\bArc\b/i, meaning: "Graphics built into the processor. Fine for everyday use and light games, not demanding ones." },
  { term: "HX / H / U chips", pattern: /\b(?:i[3579]|Core (?:Ultra )?\d)[- ]?\d{3,5}(?:HX|H|U|V)\b/i, meaning: "Intel suffixes: U = efficient thin laptops, H = performance, HX = maximum power (usually gaming)." },
  { term: "Telephoto", pattern: /\btelephoto\b|\bperiscope\b/i, meaning: "A zoom lens for sharp close-ups from far away. Periscope lenses zoom further." },
  { term: "Ultrawide", pattern: /\bultrawide\b/i, meaning: "A wide-angle lens that fits more into the frame, handy for groups and landscapes." },
  { term: "Liquid Retina XDR", pattern: /\bLiquid Retina XDR\b/i, meaning: "Apple's mini-LED laptop screen: very bright HDR with deep contrast." },
];

export type GlossarySegment = { text: string; term?: string; meaning?: string };

/** Splits text into plain runs and glossary matches (each term explained once per string). */
export function splitGlossary(text: string): GlossarySegment[] {
  const matches: { start: number; end: number; term: string; meaning: string }[] = [];
  for (const entry of GLOSSARY) {
    const m = entry.pattern.exec(text);
    if (!m || m.index === undefined) continue;
    const start = m.index;
    const end = start + m[0].length;
    if (matches.some((x) => start < x.end && end > x.start)) continue;
    matches.push({ start, end, term: entry.term, meaning: entry.meaning });
  }
  matches.sort((a, b) => a.start - b.start);
  const segments: GlossarySegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: text.slice(m.start, m.end), term: m.term, meaning: m.meaning });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
