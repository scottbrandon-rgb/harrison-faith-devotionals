// Edge function: /read/:slug/:dayNum
// Intercepts devotional page requests and injects Open Graph meta tags
// so social platforms (Twitter, Facebook, iMessage, etc.) show rich previews.
// Regular users get the same HTML — React loads and takes over normally.

import type { Config, Context } from "https://edge.netlify.com/";
import { ogData } from "./og-data.ts";

function escAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaTags(
  entry: {
    weekTitle: string;
    sermonSeries: string;
    dayTitle: string;
    reference: string;
    dayNum: number;
  },
  imageUrl: string,
  pageUrl: string
): string {
  const title = `${entry.weekTitle} · Day ${entry.dayNum} — Harrison Faith`;
  const description = `${entry.dayTitle} | ${entry.reference} | A daily devotional from Harrison Faith Church.`;

  return `
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Harrison Faith Devotionals" />
  <meta property="og:title" content="${escAttr(title)}" />
  <meta property="og:description" content="${escAttr(description)}" />
  <meta property="og:image" content="${escAttr(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escAttr(pageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(title)}" />
  <meta name="twitter:description" content="${escAttr(description)}" />
  <meta name="twitter:image" content="${escAttr(imageUrl)}" />`;
}

export default async function handler(
  request: Request,
  context: Context
): Promise<Response> {
  // Parse /read/:slug/:dayNum
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // parts: ['read', slug, dayNum]
  if (parts.length < 3) {
    return context.next();
  }

  const slug = parts[1];
  const dayNum = parts[2];
  const key = `${slug}/${dayNum}`;
  const entry = ogData[key];

  // If no data found for this slug/day, pass through unchanged
  if (!entry) {
    return context.next();
  }

  // Fetch the underlying page (index.html via SPA redirect)
  const response = await context.next();
  const contentType = response.headers.get("content-type") ?? "";

  // Only modify HTML responses
  if (!contentType.includes("text/html")) {
    return response;
  }

  const html = await response.text();

  const origin = url.origin;
  const imageUrl = `${origin}/og-image/${slug}/${dayNum}`;
  const pageUrl = `${origin}/read/${slug}/${dayNum}`;

  const metaTags = buildMetaTags(entry, imageUrl, pageUrl);

  // Inject meta tags just before </head>
  const modified = html.replace("</head>", `${metaTags}\n  </head>`);

  return new Response(modified, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export const config: Config = {
  path: "/read/*",
};
