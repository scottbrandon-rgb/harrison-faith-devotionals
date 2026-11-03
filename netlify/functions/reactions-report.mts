// Netlify Function: GET /.netlify/functions/reactions-report
// Returns reaction counts for every devotional. Private: the request must send
// the `x-report-key` header matching the REACTIONS_REPORT_KEY environment variable.

import { timingSafeEqual } from "node:crypto";
import { getDatabase, type DatabaseConnection } from "@netlify/database";
import { ogData } from "../shared/og-data.ts";

let db: DatabaseConnection | undefined;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function keyMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Row = { series_slug: string; day: number; reaction: string; count: number; last_at: string };

export default async (req: Request): Promise<Response> => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const expected = process.env.REACTIONS_REPORT_KEY;
  if (!expected) return json({ error: "Report key is not configured on this site" }, 503);
  if (!keyMatches(req.headers.get("x-report-key") ?? "", expected)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let rows: Row[];
  try {
    db ??= getDatabase();
    const result = await db.pool.query(
      `SELECT series_slug, day, reaction, COUNT(*)::int AS count, MAX(updated_at) AS last_at
         FROM devotional_reactions
        GROUP BY series_slug, day, reaction`,
    );
    rows = result.rows as Row[];
  } catch (err) {
    console.error("Failed to load reactions report", err);
    return json({ error: "Could not load report" }, 500);
  }

  // Fold rows into one entry per devotional, with titles from the content build.
  const pages = new Map<string, {
    slug: string; day: number; weekTitle: string; dayTitle: string; sermonSeries: string;
    publishDate: string | null; counts: Record<string, number>; total: number; lastAt: string;
  }>();
  for (const r of rows) {
    const key = `${r.series_slug}/${r.day}`;
    let page = pages.get(key);
    if (!page) {
      const meta = ogData[key];
      page = {
        slug: r.series_slug,
        day: r.day,
        weekTitle: meta?.weekTitle ?? r.series_slug,
        dayTitle: meta?.dayTitle ?? `Day ${r.day}`,
        sermonSeries: meta?.sermonSeries ?? "",
        publishDate: meta?.publishDate ?? null,
        counts: {},
        total: 0,
        lastAt: r.last_at,
      };
      pages.set(key, page);
    }
    page.counts[r.reaction] = r.count;
    page.total += r.count;
    if (new Date(r.last_at) > new Date(page.lastAt)) page.lastAt = r.last_at;
  }

  return json({ pages: [...pages.values()] });
};
