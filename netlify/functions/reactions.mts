// Netlify Function: POST /.netlify/functions/reactions
// Records (or updates) one anonymous reader's reaction to a devotional.
// Body: { slug: string, day: number, reaction: ReactionKey, visitorId: uuid }

import { getDatabase, type DatabaseConnection } from "@netlify/database";
import { ogData } from "../shared/og-data.ts";

const REACTIONS = ["spoke", "helpful", "okay", "not_today"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reuse the connection pool across warm invocations.
let db: DatabaseConnection | undefined;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) ?? {};
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { slug, day, reaction, visitorId } = body;
  if (
    typeof slug !== "string" ||
    typeof day !== "number" ||
    !Number.isInteger(day) ||
    typeof reaction !== "string" ||
    !REACTIONS.includes(reaction) ||
    typeof visitorId !== "string" ||
    !UUID_RE.test(visitorId)
  ) {
    return json({ error: "Invalid reaction" }, 400);
  }

  // Only accept reactions for devotionals that exist and are already published.
  const entry = ogData[`${slug}/${day}`];
  if (!entry) return json({ error: "Unknown devotional" }, 404);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  if ((entry.publishDate ?? "") > today) return json({ error: "Not yet published" }, 403);

  try {
    db ??= getDatabase();
    await db.pool.query(
      `INSERT INTO devotional_reactions (series_slug, day, reaction, visitor_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (series_slug, day, visitor_id)
       DO UPDATE SET reaction = EXCLUDED.reaction, updated_at = NOW()`,
      [slug, day, reaction, visitorId],
    );
  } catch (err) {
    console.error("Failed to save reaction", err);
    return json({ error: "Could not save reaction" }, 500);
  }

  return json({ ok: true });
};
