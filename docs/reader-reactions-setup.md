# Reader Reactions: Setup and Use

At the end of each devotional, after the Prayer, readers see four one-tap reactions. No login is required.

| Reaction | Stored as |
|---|---|
| ♥︎ This spoke to me | `spoke` |
| 👍 Helpful | `helpful` |
| 😐 Okay | `okay` |
| 👎 Not for me today | `not_today` |

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

1. Go to **Admin → Events** and mark `devotional_reaction` as a **key event**, so sessions with a reaction count as engaged.
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

To drop one reaction (for example, down to three), remove its entry from the `REACTIONS` list in `src/App.tsx` and from the list in `netlify/functions/reactions.mts`. Existing rows stay in the database. To rename a label, change only the `label` text. The stored key stays the same, so past data still lines up.
