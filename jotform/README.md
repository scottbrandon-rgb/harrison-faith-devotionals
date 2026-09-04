# Young Adult Ministry — Leader Input (Jotform)

**The form is live:** <https://form.jotform.com/262457565846067>
Builder: <https://www.jotform.com/build/262457565846067>

It was built through the Jotform connector, then verified against the spec by
fetching the rendered page: 24 questions in the exact wording below, 12 visible
sub-labels, 24 required fields with only "Anything else we should know?"
optional, 16 long-answer and 9 short-answer boxes, five pages, intro text above
the name field.

Two settings could not be confirmed from the rendered page and should be checked
in the builder:

- **Progress bar.** No progress-bar markup appears on the page, so it is
  probably still off. Turn it on under Settings, Form Settings.
- **Thank-you message.** Jotform does not embed it in the blank form, so it
  cannot be read from outside. Confirm it says "Got it. Thank you — this is
  exactly what we needed."

The rest of this file covers rebuilding the form from scratch.

Two ways to rebuild this form in Jotform. Both produce the same thing: a five-page
form, 24 questions, progress bar, custom thank-you message.

## Option A — build it from the spec (repeatable)

`young-adult-ministry-leader-input.json` is the whole form as data. The script
flattens it into the parameter names Jotform's `POST /user/forms` endpoint wants
and creates the form in one call.

```bash
# See exactly what will be sent, no API call, no key needed:
node scripts/build-jotform-form.mjs jotform/young-adult-ministry-leader-input.json --dry-run

# Create it for real:
export JOTFORM_API_KEY=your_key_here
node scripts/build-jotform-form.mjs jotform/young-adult-ministry-leader-input.json
```

Get an API key at <https://www.jotform.com/myaccount/api>. Give it full access,
not read-only, or form creation is rejected. Add `--eu` or `--hipaa` if the
account sits on one of those endpoints.

The script prints the new form's builder and live URLs when it finishes.

Editing the form later means editing the JSON and re-running, which creates a
new form. The script does not update an existing one.

### One thing the API cannot set

Jotform's properties reference documents no progress-bar property, on the form
or on the page-break element. Turn it on by hand after the form is created:
**Settings → Form Settings → Show Progress Bar**. Everything else in the spec
(title, five pages, sub-labels, required flags, thank-you text) is set by the
script.

## Option B — paste into the AI form builder

Jotform → Create Form → Use AI, then paste `ai-builder-prompt.md`. Faster, but
the AI builder paraphrases wording and guesses at field types, so read every
question against the spec afterward. Sub-labels are the thing it drops most
often.

## What the form asks

| Page | Section | Questions |
|---|---|---|
| 1 | The Night Itself | Name, plus 1–4 |
| 2 | What It Is For | 5–8 |
| 3 | The First-Timer | 9–12 |
| 4 | Logistics | 13–21 |
| 5 | Voice | 22–24 |

Question 24 is the only optional one. Logistics questions 13–19 are short text;
everything else long-form is a text area.
