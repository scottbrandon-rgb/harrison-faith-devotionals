---
name: devotional-workflow
description: "Run this skill when the user says 'new devotional file ready', 'start devotionals',
  'generate this week's devotionals', 'write devos for [title]', or uploads a sermon
  manuscript to the inbox folder. Reads the source file, runs context intake, generates
  5 days of devotional content plus a notifications file, previews each day for approval,
  and publishes final output files."
---

# Devotional Workflow

## Step 1 — Load all reference files

Before doing anything else, read all three reference files in full.
These are non-negotiable inputs to every step that follows.

**1a. Load context questions:**
Read: `skills/devotional/context-questions.md`

**1b. Load voice guide (fetch live from GitHub):**
Run this command and read the full output:
```bash
gh api repos/scottbrandon-rgb/voice-dna/contents/Voice_DNA_Scott_Brandon.md \
  --jq '.content' | base64 -d
```

**1c. Load output structure:**
Read: `skills/devotional/output-and-structure.md`

Do not proceed until all three are loaded. Confirm internally that you have:
- The intake questions and per-day variation guidance
- Scott's full voice DNA
- The exact file format, save paths, and notifications structure

---

## Step 2 — Read the source material

Check for source files. The user will either name file paths directly or say where to look.
Accept any combination of the following — all are valid inputs:

- **Sermon manuscript** — a full written-out sermon (the primary source when present)
- **Sermon notes** — an outline, bullet notes, or rough draft (use as primary if no manuscript)
- **Both** — when both exist, use the manuscript as the body and the notes to catch any
  additional illustrations, asides, or application points the manuscript may not contain

Read all provided files in full. Hold the complete content in context — do not summarize yet.
Note what type(s) of material you have, as this affects how you slice the sermon in Step 4.

If no file is found or named, ask:
> "What's the path to this week's source material? You can give me a manuscript, sermon notes, or both."

---

## Step 3 — Run context intake

Using the questions defined in `context-questions.md` Section A, ask the user the
always-ask questions. Present them as a single numbered list — clean, not a wall of text.

Check for conditional questions (Section B) based on what you found in the source file.
Ask any that apply after the always-ask questions are answered.

After collecting all answers, present the confirmation summary (Section C format) and
**stop**. Wait for explicit confirmation ("yes", "correct", "go ahead", or corrections)
before writing a single word of devotional content.

If the user makes corrections, update the summary and confirm again.

---

## Step 4 — Generate all 5 days

Using:
- The confirmed context from Step 3
- The source manuscript from Step 2
- The structural template and file format from `output-and-structure.md`
- The voice guide fetched in Step 1b
- The per-day variation guidance from `context-questions.md` Section D

Write all five days internally. Do not output them yet.

**Generation rules:**
- Each day covers one movement of the sermon in order (Day 1 = Movement 1, etc.)
- Each day has a unique title (2–5 words), not the week title
- Each day includes the full frontmatter as defined in output-and-structure.md
- Each day has exactly 2 application questions (1 introspective, 1 action-oriented)
- The memory verse is identical across all 5 days
- Publish dates: Day 1 = Monday provided, Days 2–5 = Tue–Fri of same week

Also generate the notifications.md file internally. Do not output it yet.

---

## Step 5 — Preview each day for approval

Present each day one at a time, in full — frontmatter and all sections.

After each day, ask exactly this:

```
✓ Approve  |  ✎ Edit  |  ↺ Rewrite
```

Wait for explicit input before showing the next day.

- **Approve** — log it and show the next day
- **Edit** — ask what to change, make the change, re-present that day, then ask again
- **Rewrite** — rewrite the full day and re-present before moving on

After Day 5 is approved, show the notifications.md preview and apply the same
approve / edit / rewrite process.

---

## Step 6 — Final check

After all content is approved, present a summary:

```
Ready to publish:

- Series: [sermon series]
- Week: [week title]
- Passage: [anchor text]
- Big idea: [one sentence]
- Publish: [Monday date] – [Friday date]
- Days: [one-line summary of each day's angle]
- Notifications: [series announcement text preview]

Any final corrections before I write the files?
```

Wait for confirmation.

---

## Step 7 — Write all files

Using the paths and format defined in `output-and-structure.md`:

1. Determine the sermon series folder slug and week slug from the confirmed context
2. Create the output directory if it does not exist:
   `content/[sermon-series-folder]/[week-slug]/`
3. Write `day-1.md` through `day-5.md`
4. Write `notifications.md`

Report back:
```
✅ 6 files written:

content/[series-folder]/[week-slug]/day-1.md
content/[series-folder]/[week-slug]/day-2.md
content/[series-folder]/[week-slug]/day-3.md
content/[series-folder]/[week-slug]/day-4.md
content/[series-folder]/[week-slug]/day-5.md
content/[series-folder]/[week-slug]/notifications.md

Ready to publish. Say "publish" and I'll run the build and push to Netlify.
```

---

## Step 8 — Publish (if user confirms)

If the user says "publish", "push it", "go ahead", or similar:

1. Run the build script:
```bash
export PATH="/opt/homebrew/bin:$PATH" && node scripts/build-content.mjs
```

2. Stage and commit:
```bash
git add content/[series-folder]/[week-slug]/
git commit -m "Add [Week Title] — [Sermon Series] ([Mon date]–[Fri date])"
```

3. Push:
```bash
git push origin main
```

If the push is rejected (remote has new commits), run:
```bash
git pull --rebase origin main && git push origin main
```

Report confirmation when done.
