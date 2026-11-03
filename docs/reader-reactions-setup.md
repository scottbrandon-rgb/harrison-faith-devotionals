# Reader Reactions: Setup and Use

At the end of each devotional, after the Prayer, readers see three one-tap reactions. No login is required.

| Reaction | Icon | Stored as |
|---|---|---|
| This was for me today | ♥︎ heart | `spoke` |
| Helpful | 👍 thumbs up | `helpful` |
| Not for me today | 😐 neutral face | `not_today` |

There's deliberately no thumbs-down, so "Not for me today" reads as "not my need today" rather than as a dislike.

Readers see only their own choice and a short "Thank you for sharing." No counts are shown publicly. Readers can change their answer, but they can't vote twice on the same devotional.

---

## What was added

| File | Purpose |
|---|---|
| `netlify/database/migrations/20261103120000_create_devotional_reactions/migration.sql` | Creates the `devotional_reactions` table. Netlify applies it automatically on deploy. |
| `netlify/functions/reactions.mts` | Saves a reaction. Rejects devotionals that don't exist or haven't been published yet. |
| `netlify/functions/reactions-report.mts` | Returns counts for your private report. It requires a key. |
| `src/App.tsx` | The reaction bar (`ReactionBar`) and the private report page at `/reactions-report`. |
| `package.json` | Adds `@netlify/database`. |

**Privacy:** Each browser gets a random anonymous ID, kept only on the reader's device, so one person can't vote twice. No IP address, name, or email is stored.

---

## Steps to turn it on

### Step 1: Database

Netlify Database is provisioned and the migration applied when a deploy includes `netlify/database/migrations/`. If the deploy log reports that the database isn't enabled, turn on **Netlify Database** for the site in the Netlify dashboard and redeploy.

Deploy previews get **their own database branch**, so test reactions on a preview never touch production data.

### Step 2: Report key

In Netlify, go to **Project configuration → Environment variables** and add:

- **Key:** `REACTIONS_REPORT_KEY`
- **Value:** a long passphrase only you know
- **Scope:** Functions, in all deploy contexts (so it works on previews too)

Redeploy after adding it.

### Step 3: View the report

Visit `/reactions-report` on the site (for example `https://<your-site>/reactions-report`) and enter the key. The page shows:

- Totals and percentages for each reaction
- Every devotional that received reactions, newest first, with a count for each reaction

The page isn't linked anywhere and tells search engines not to index it. The data stays locked without the key.

### Step 4: Google Analytics (optional, recommended)

Every tap also sends a `devotional_reaction` event to GA4 with `reaction`, `series`, `day`, and `devotional_title`. In GA4:

1. Go to **Admin → Data display → Events → Recent events** and click the **star** next to `devotional_reaction` to make it a **key event**, so sessions with a reaction count as engaged. The event shows up only after readers have triggered it, which can take 24–48 hours.
2. Go to **Admin → Custom definitions** and add `reaction`, `series`, and `day` as event-scoped dimensions.

---

## Querying the data directly

With the Netlify CLI linked to the site:

```bash
netlify database connect -q "SELECT reaction, COUNT(*) FROM devotional_reactions GROUP BY reaction"
```

Useful queries:

```sql
-- Reactions per devotional
SELECT series_slug, day, reaction, COUNT(*)
  FROM devotional_reactions
 GROUP BY series_slug, day, reaction
 ORDER BY series_slug, day;

-- Reactions in the last 7 days
SELECT DATE(updated_at) AS day, reaction, COUNT(*)
  FROM devotional_reactions
 WHERE updated_at > NOW() - INTERVAL '7 days'
 GROUP BY 1, 2
 ORDER BY 1;
```

---

## Changing the reactions later

The reactions are defined in two places that must match: the `REACTIONS` list in `src/App.tsx` (labels and icons) and the `REACTIONS` list in `netlify/functions/reactions.mts` (allowed keys).

- **Rename a label:** change only the `label` text. The stored key stays the same, so past data still lines up.
- **Add or remove a reaction:** edit both lists. Existing rows stay in the database.
- The table's CHECK constraint also allows `okay` (from the original four-option design). It's unused and harmless. Adding a brand-new key would need a new migration that updates the constraint.
