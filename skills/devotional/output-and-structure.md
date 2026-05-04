# Output and Structure — Devotional Files

This file defines exactly what to write and where to write it.
All formats match the existing project pipeline. Do not deviate.

---

## Section A — File Output

### Day files — 5 per week

**Save location:**
```
/Users/scottbrandon/Library/CloudStorage/Dropbox/Claude Code/Devotionals/harrison-faith-devotionals/content/[sermon-series-folder]/[week-slug]/
```

**Sermon series folder** — slugify the sermon series name:
- "Trust & Obey" → `trust-and-obey`
- "Leaving the 99" → `leaving-the-99`
- "Lost Sheep" → `lost-sheep`
- Rule: lowercase, replace spaces and special characters (& / ' etc.) with hyphens

**Week slug** — slugify the week title:
- "Step and See" → `step-and-see`
- "The Risk of Success" → `the-risk-of-success`
- Rule: same as above

**File names:** `day-1.md`, `day-2.md`, `day-3.md`, `day-4.md`, `day-5.md`

**Publish dates:** Day 1 = the Monday provided in intake. Days 2–5 are Tuesday–Friday of that same week.

---

### Notifications file — 1 per week

**File name:** `notifications.md`

**Save location:** Same folder as the day files.

---

## Section B — Day File Format

Each day file must follow this exact structure. Do not add or remove sections.

### Frontmatter

```yaml
---
series: [week-slug]
series_title: [Week Title — match intake exactly, this is what displays in the app]
sermon_series: [Sermon Series Name — match intake exactly, e.g. "Trust & Obey"]
day: [1–5]
publish_date: [YYYY-MM-DD]
title: [Day Title — short, punchy, 2–5 words]
scripture_reference: [Book Chapter:Verse or Chapter:Verse-Verse]
scripture_translation: ESV
scripture_text: "[Full verse text — always double-quoted]"
memory_verse_reference: [Reference + ESV, e.g. "Proverbs 3:5-6 ESV"]
memory_verse_text: "[Full memory verse text — always double-quoted]"
---
```

**Rules:**
- `series_title` and `sermon_series` must match exactly across all 5 days
- `scripture_text` and `memory_verse_text` must always be wrapped in double quotes
- `memory_verse_reference` always ends with the translation (ESV)
- `title` is the day's unique title, not the week title

### Body sections

```markdown
## Devotional
[3–5 paragraphs. See Section C for content rules.]

## Application
1. [Introspective question]
2. [Action-oriented question]

## Challenge
[One concrete, specific action for today. 2–4 sentences. No bullet points.]

## Prayer
[First-person prayer tied directly to the day's text. 3–5 sentences.]
```

**Application format:** Numbered list (`1.` and `2.`), not bullets. Two questions only. No trailing punctuation issues — end each question with a question mark.

---

## Section C — Devotional Body Rules

**Length:** 3–5 paragraphs. Aim for 250–350 words total.

**Paragraph structure:**
- Open with an assertion or scene — never a warm-up sentence
- Build through exposition, illustration, or historical context
- Close on Scripture, a Greek/Hebrew word, or a redirect
- Never close a paragraph on vague encouragement

**Each day must include:**
- At least one direct address to the reader (second person "you")
- At least one connection to the sermon's big idea
- At least one historical, cultural, or word study detail (woven in naturally, never lectured)
- A clear landing — the reader should know exactly what the passage is claiming

**What each day's devotional body is NOT:**
- A summary of all five days
- A retelling of the full passage
- A commentary on adjacent verses
- A generic application paragraph that could belong to any week

---

## Section D — Notifications File Format

Use this exact structure. The dividers are part of the format.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERIES ANNOUNCEMENT (140 characters)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[One punchy sentence announcing the week. 140 characters max.
Hook the reader. Name the series, the theme, the payoff. Make them want in.]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEEK OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2–3 paragraphs. Walk through the week's arc: what Day 1 opens,
what the middle days dig into, what Day 5 lands on.
Write in Scott's voice — direct, pastoral, no fluff.
End with a one-line call to action: "See you in the devos."]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAILY NOTIFICATIONS (140 characters each)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Day 1 — [Day Title]
[Hook sentence. 140 characters max. Make the reader need to open the app.]

Day 2 — [Day Title]
[Hook sentence. 140 characters max.]

Day 3 — [Day Title]
[Hook sentence. 140 characters max.]

Day 4 — [Day Title]
[Hook sentence. 140 characters max.]

Day 5 — [Day Title]
[Hook sentence. 140 characters max.]
```

**Notification rules:**
- 140 characters is a hard limit on announcement and daily notifications
- Each daily hook should tease the day's angle without giving it away
- The hook should feel like the Nathan principle — lands before they see it coming
- Do not use "Today's devos are live" as a full sentence — it is a suffix, not the message
- End each daily notification with "Devos are live." or "Day [N] devos are live."

---

## Section E — After Files Are Written

Once all 6 files are written (5 day files + notifications.md), report:

1. Confirmation that all files were written with their full paths
2. The publish date range (Monday–Friday)
3. Remind the user to run the publish step:

```
Files are ready. To publish:
1. Run: node scripts/build-content.mjs
2. Then: git add content/... && git commit -m "Add [Week Title] — [Sermon Series] ([date range])"
3. Then: git push origin main

Or just tell me to publish and I'll handle steps 1–3.
```
