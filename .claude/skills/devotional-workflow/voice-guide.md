# Voice Guide — Scott Brandon

The authoritative voice reference for this workflow lives in a private GitHub repository
and must be fetched at runtime before any devotional content is written.

---

## How to Fetch at Runtime

Run **both** commands and read the full output of each before writing a single word of devotional content. Together they are the complete voice reference.

```bash
gh api repos/scottbrandon-rgb/voice-dna/contents/preaching-voice.md \
  --jq '.content' | base64 -d
```

```bash
gh api repos/scottbrandon-rgb/voice-dna/contents/Anti-AI-Writing.md \
  --jq '.content' | base64 -d
```

**Repository:** `scottbrandon-rgb/voice-dna`
**Files:** `preaching-voice.md` and `Anti-AI-Writing.md`
**Branch:** `main`

---

## What These Files Contain

**preaching-voice.md** covers:

- **Core identity** — Who Scott is, how he preaches, his theological commitments
- **Worldview and beliefs** — The convictions that shape every piece he writes
- **Writing voice** — Sentence architecture, vocabulary fingerprint, rhythm, the Nathan
  principle, the landing standard
- **Who he is writing for** — The reader profile, their distortions, what they resist
  but need, what it sounds like when a piece lands

**Anti-AI-Writing.md** covers:

- The specific patterns, constructions, and phrases that would make Scott pull a piece down
- Enforcement protocol for reviewing content before it ships

---

## Critical Rules When Writing in Scott's Voice

These are extracted from the Voice DNA for quick reference during generation.
Always defer to the full fetched document if there is any conflict.

1. **Short declaratives land after longer exposition — never before.**
   Don't open with the punch. Build first.

2. **Staccato repetition appears exactly once per piece, at the emotional core.**
   It is discipline, not default rhythm. Do not use it as a crutch.

3. **Greek and Hebrew words get translated through a doorway, never a lecture.**
   One plain-English equivalent, immediately. Move on.

4. **Never warm up a paragraph.** Open with an assertion. Close on Scripture,
   a Greek word, or a redirect — never on "may we all strive to..."

5. **The Nathan principle.** Set them up talking about something else, then:
   "that man is you." They don't see it coming until it hits.

6. **Clever over clean.** Phrases others don't write. Things that don't normally go together but make complete sense when they land.

7. **Direct address is a structural hinge, not decoration.**
   Use it at a gear-shift moment, not throughout.

8. **The landing standard.** "As catchy as a song you didn't want to hear in
   Home Depot." Easy logical flow — "Yeah...that makes sense. Yeah...ok." When the punchlines land and the application is as relevant as yesterday's text message, it's ready.

9. **The reader is busy and reads as a checkbox.** Get to it. Make it land.
   Don't play. Catch their attention in the first sentence or you've lost them.

10. **Never end on vague encouragement.** The reader should feel caught,
    not coddled.
