// Edge function: /og-image/:slug/:day.png
// Generates a dynamic 1200×630 PNG for social sharing previews.

import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import type { Config } from "https://edge.netlify.com/";
import { ogData } from "../shared/og-data.ts";

// ─── Font URLs ─────────────────────────────────────────────────────────────────
const PLAYFAIR_BOLD_URL =
  "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf";
const LATO_REGULAR_URL =
  "https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxk.ttf";

// ─── Module-level singletons (cached across requests on same isolate) ──────────
let initPromise: Promise<void> | null = null;
let playfairBold: ArrayBuffer;
let latoRegular: ArrayBuffer;

function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await initWasm(
        fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm")
      );
      [playfairBold, latoRegular] = await Promise.all([
        fetch(PLAYFAIR_BOLD_URL).then((r) => r.arrayBuffer()),
        fetch(LATO_REGULAR_URL).then((r) => r.arrayBuffer()),
      ]);
    })();
  }
  return initPromise;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ─── SVG builder ──────────────────────────────────────────────────────────────
function buildSvg(entry: {
  weekTitle: string;
  sermonSeries: string;
  dayTitle: string;
  reference: string;
  accent: string;
  dayNum: number;
}): string {
  const { weekTitle, sermonSeries, dayTitle, reference, accent, dayNum } = entry;

  // Title sizing and wrapping
  const titleCfg =
    weekTitle.length <= 18
      ? { fontSize: 66, wrapAt: 28 }
      : weekTitle.length <= 28
      ? { fontSize: 56, wrapAt: 32 }
      : { fontSize: 46, wrapAt: 38 };

  const titleLines = wrapText(weekTitle, titleCfg.wrapAt);
  const titleLineHeight = titleCfg.fontSize + 14;
  const titleStartY = titleLines.length > 1 ? 256 : 280;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="64" y="${titleStartY + i * titleLineHeight}" ` +
        `font-family="Playfair Display" font-weight="700" font-size="${titleCfg.fontSize}" ` +
        `fill="white">${escXml(line)}</text>`
    )
    .join("\n  ");

  const afterTitleY = titleStartY + titleLines.length * titleLineHeight;
  const subtitleY = afterTitleY + 36;
  const dividerY = subtitleY + 22;
  const refY = dividerY + 36;

  const subtitleText = `Day ${dayNum} · ${truncate(dayTitle, 44)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <!-- Background -->
  <rect width="1200" height="630" fill="${escXml(accent)}" />
  <rect width="1200" height="630" fill="rgba(0,0,0,0.22)" />

  <!-- Top accent strip -->
  <rect width="1200" height="4" fill="rgba(255,255,255,0.18)" />

  <!-- Church name -->
  <text x="64" y="74" font-family="Lato" font-weight="400" font-size="15"
    fill="rgba(255,255,255,0.62)" letter-spacing="6">HARRISON FAITH</text>
  <text x="64" y="97" font-family="Lato" font-weight="400" font-size="12"
    fill="rgba(255,255,255,0.38)" letter-spacing="3">WEEKLY DEVOTIONAL</text>

  <!-- Series label -->
  <text x="64" y="182" font-family="Lato" font-weight="400" font-size="13"
    fill="rgba(255,255,255,0.52)" letter-spacing="3">${escXml(sermonSeries.toUpperCase())}</text>

  <!-- Week title -->
  ${titleSvg}

  <!-- Day + title subtitle -->
  <text x="64" y="${subtitleY}" font-family="Lato" font-weight="400" font-size="21"
    fill="rgba(255,255,255,0.78)">${escXml(subtitleText)}</text>

  <!-- Divider -->
  <rect x="64" y="${dividerY}" width="56" height="2" fill="rgba(255,255,255,0.32)" />

  <!-- Scripture reference -->
  <text x="64" y="${refY}" font-family="Lato" font-weight="400" font-size="16"
    fill="rgba(255,255,255,0.52)" font-style="italic">${escXml(reference)}</text>

  <!-- Bottom URL -->
  <text x="64" y="600" font-family="Lato" font-weight="400" font-size="13"
    fill="rgba(255,255,255,0.32)">harrisondevotionals.com</text>
</svg>`;
}

// ─── Edge function handler ────────────────────────────────────────────────────
export default async function handler(request: Request): Promise<Response> {
  // Parse /og-image/:slug/:day from URL
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // parts: ['og-image', slug, day]
  if (parts.length < 3) {
    return new Response("Not found", { status: 404 });
  }
  const slug = parts[1];
  const day = parts[2];
  const key = `${slug}/${day}`;

  const entry = ogData[key];
  if (!entry) {
    return new Response("Not found", { status: 404 });
  }

  try {
    await ensureInit();

    const svg = buildSvg(entry);

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: {
        fontBuffers: [
          new Uint8Array(playfairBold),
          new Uint8Array(latoRegular),
        ],
        defaultFontFamily: "Lato",
      },
    });

    const png = resvg.render().asPng();

    return new Response(png, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("og-image error:", err);
    return new Response("Image generation failed", { status: 500 });
  }
}

export const config: Config = {
  path: "/og-image/*",
};
