import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'content');
const outputFile = path.join(__dirname, '..', 'src', 'data.ts');

// ─── Parse a markdown file into a Day object ─────────────────────────────────
function parseDay(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: fm, content } = matter(raw);

  // Extract sections by ## heading
  const sections = {};
  let currentSection = null;
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim().toLowerCase();
      sections[currentSection] = [];
    } else if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  // Normalize section names to canonical keys
  const aliases = {
    'devotional thought': 'devotional',
    'application questions': 'application',
    "today's challenge": 'challenge',
    'prayer to pray': 'prayer',
  };
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (sections[alias] && !sections[canonical]) {
      sections[canonical] = sections[alias];
    }
  }

  const getText = (key) =>
    (sections[key] || []).join('\n').trim();

  // Devotional: split into paragraphs
  const devotional = getText('devotional')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  // Application: extract numbered lines
  const questions = getText('application')
    .split('\n')
    .filter(l => /^\d+\./.test(l.trim()))
    .map(l => l.replace(/^\d+\.\s*/, '').trim());

  return {
    day: fm.day,
    publishDate: fm.publish_date ? (fm.publish_date instanceof Date ? fm.publish_date.toISOString().slice(0, 10) : String(fm.publish_date)) : null,
    title: fm.title,
    scripture: {
      reference: fm.scripture_reference,
      translation: fm.scripture_translation,
      text: fm.scripture_text,
    },
    devotional,
    questions,
    challenge: getText('challenge'),
    prayer: getText('prayer'),
    // Keep metadata for grouping
    _series: fm.series,
    _series_title: fm.series_title,
    _sermon_series: fm.sermon_series,
  };
}

// ─── Walk content directory and group into series ────────────────────────────
function buildData() {
  const sermonSeriesMap = {};

  const sermonFolders = fs.readdirSync(contentDir).filter(f =>
    fs.statSync(path.join(contentDir, f)).isDirectory()
  );

  for (const sermonFolder of sermonFolders) {
    const sermonPath = path.join(contentDir, sermonFolder);
    const weekFolders = fs.readdirSync(sermonPath).filter(f =>
      fs.statSync(path.join(sermonPath, f)).isDirectory()
    );

    for (const weekFolder of weekFolders) {
      const weekPath = path.join(sermonPath, weekFolder);
      const dayFiles = fs.readdirSync(weekPath)
        .filter(f => /^day-\d+\.md$/.test(f))
        .sort();

      const days = dayFiles.map(f => parseDay(path.join(weekPath, f)));
      if (!days.length) continue;

      const first = days[0];
      const sermonSeriesTitle = first._sermon_series;
      const weekSlug = weekFolder;
      const weekTitle = first._series_title;

      if (!sermonSeriesMap[sermonSeriesTitle]) {
        sermonSeriesMap[sermonSeriesTitle] = { title: sermonSeriesTitle, weeks: [] };
      }

      // Clean metadata fields off day objects
      const cleanDays = days.map(({ _series, _series_title, _sermon_series, ...rest }) => rest);

      sermonSeriesMap[sermonSeriesTitle].weeks.push({
        slug: weekSlug,
        title: weekTitle,
        sermonSeries: sermonSeriesTitle,
        days: cleanDays,
      });
    }
  }

  // Sort each sermon series' weeks by day-1 publishDate descending (newest first)
  const result = Object.values(sermonSeriesMap);
  for (const sermonSeries of result) {
    sermonSeries.weeks.sort((a, b) => {
      const dateA = a.days[0]?.publishDate ?? '';
      const dateB = b.days[0]?.publishDate ?? '';
      return dateB.localeCompare(dateA);
    });
  }
  return result;
}

// ─── Generate data.ts ─────────────────────────────────────────────────────────
const allSeries = buildData();

// Current series = most recent week whose day-1 publishDate is on or before today
const today = new Date().toISOString().slice(0, 10);
const allWeeks = allSeries.flatMap(s => s.weeks);
const publishedWeeks = allWeeks.filter(w => (w.days[0]?.publishDate ?? '') <= today);
// Sort globally across all series to find the single most recently published week
publishedWeeks.sort((a, b) => (b.days[0]?.publishDate ?? '').localeCompare(a.days[0]?.publishDate ?? ''));
const currentSeriesWeek = publishedWeeks.length > 0 ? publishedWeeks[0] : allWeeks[0];
// Find it in allSeries to build a safe reference
let currentSeriesRef = `allSeries[0].weeks[0]`;
outer: for (let si = 0; si < allSeries.length; si++) {
  for (let wi = 0; wi < allSeries[si].weeks.length; wi++) {
    if (allSeries[si].weeks[wi].slug === currentSeriesWeek.slug) {
      currentSeriesRef = `allSeries[${si}].weeks[${wi}]`;
      break outer;
    }
  }
}

const seriesColorsSource = `
export const seriesColors: Record<string, { accent: string; light: string; text: string }> = {
  "Leaving the 99": { accent: "#2D4A3E", light: "#EBF0EE", text: "#1e3329" },
  "The Shepherd's Heart": { accent: "#6B3D2E", light: "#F2EAE6", text: "#4a2a1e" },
  "The Way of Blessing": { accent: "#D28D52", light: "#FAF0E6", text: "#7a4e1e" },
  "Influence": { accent: "#302752", light: "#ECEAF4", text: "#1a1430" },
  "The Way of Perfection": { accent: "#FB8C0C", light: "#FEF3E2", text: "#7a4200" },
  "Foundations": { accent: "#998178", light: "#F2EEEC", text: "#4a3d38" },
  "Seek First": { accent: "#181818", light: "#EBEBEB", text: "#181818" },
  "Multiply": { accent: "#C8A96E", light: "#FAF5EC", text: "#6b5530" },
  "Lost Sheep": { accent: "#BA00EE", light: "#F7E0FD", text: "#5D0077" },
};

export function getSeriesColor(name: string) {
  return seriesColors[name] ?? { accent: "#7a6a5a", light: "#f0ece6", text: "#4a3e34" };
}
`;

const output = `// AUTO-GENERATED by scripts/build-content.mjs — do not edit manually
// Run: node scripts/build-content.mjs

export type Day = {
  day: number;
  publishDate: string | null;
  title: string;
  scripture: { reference: string; translation: string; text: string };
  devotional: string[];
  questions: string[];
  challenge: string;
  prayer: string;
};

export type WeeklySeries = {
  slug: string;
  title: string;
  sermonSeries: string;
  days: Day[];
};

export type SermonSeries = {
  title: string;
  weeks: WeeklySeries[];
};
${seriesColorsSource}
export const allSeries: SermonSeries[] = ${JSON.stringify(allSeries, null, 2)};

// Most recently added weekly series
export const currentSeries = ${currentSeriesRef};
`;

fs.writeFileSync(outputFile, output);
console.log(`✅ data.ts generated from ${allSeries.flatMap(s => s.weeks).length} series (${allSeries.flatMap(s => s.weeks.flatMap(w => w.days)).length} days total)`);
