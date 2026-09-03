#!/usr/bin/env node
/**
 * Creates a Jotform form from a declarative JSON spec.
 *
 *   JOTFORM_API_KEY=xxxx node scripts/build-jotform-form.mjs jotform/young-adult-ministry-leader-input.json
 *
 * Flags:
 *   --dry-run   Print the flattened request body and exit without calling the API.
 *   --eu        Use the EU endpoint (https://eu-api.jotform.com).
 *   --hipaa     Use the HIPAA endpoint (https://hipaa-api.jotform.com).
 *
 * The API takes flattened, form-encoded parameters:
 *   properties[title]=...
 *   questions[1][type]=control_textarea
 *   questions[1][text]=...
 * Question ids are 1-based; the `order` property is 0-based and is assigned
 * automatically from the order of the `questions` array in the spec.
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const specPath = args.find((a) => !a.startsWith('--')) ??
  'jotform/young-adult-ministry-leader-input.json';

const baseUrl = flags.has('--eu')
  ? 'https://eu-api.jotform.com'
  : flags.has('--hipaa')
    ? 'https://hipaa-api.jotform.com'
    : 'https://api.jotform.com';

const spec = JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf-8'));

// ─── Flatten the spec into Jotform's bracketed parameter names ───────────────
const body = new URLSearchParams();

for (const [key, value] of Object.entries(spec.properties ?? {})) {
  body.append(`properties[${key}]`, String(value));
}

spec.questions.forEach((question, index) => {
  const qid = index + 1;
  body.append(`questions[${qid}][order]`, String(index));
  for (const [key, value] of Object.entries(question)) {
    body.append(`questions[${qid}][${key}]`, String(value));
  }
});

if (flags.has('--dry-run')) {
  for (const [key, value] of body.entries()) console.log(`${key}=${value}`);
  console.log(`\n${spec.questions.length} questions, ` +
    `${spec.questions.filter((q) => q.type === 'control_pagebreak').length + 1} pages.`);
  process.exit(0);
}

const apiKey = process.env.JOTFORM_API_KEY;
if (!apiKey) {
  console.error('JOTFORM_API_KEY is not set. Create a key at ' +
    'https://www.jotform.com/myaccount/api and export it before running.');
  process.exit(1);
}

const response = await fetch(`${baseUrl}/user/forms`, {
  method: 'POST',
  headers: {
    APIKEY: apiKey,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body,
});

const payload = await response.json().catch(() => null);

if (!response.ok || payload?.responseCode >= 400) {
  console.error(`Jotform returned ${payload?.responseCode ?? response.status}: ` +
    `${payload?.message ?? response.statusText}`);
  process.exit(1);
}

const formId = payload.content?.id;
console.log(`Created form ${formId}`);
console.log(`Edit:  https://www.jotform.com/build/${formId}`);
console.log(`Live:  https://form.jotform.com/${formId}`);
console.log('\nStill to set by hand in the builder:');
console.log('  Settings -> Form Settings -> Show Progress Bar (no API property exists for it).');
