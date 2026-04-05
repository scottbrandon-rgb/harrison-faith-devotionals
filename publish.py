#!/usr/bin/env python3
"""
Harrison Faith Devotional Publisher
Parses a .txt devotional file and publishes it to the React app on Netlify.

Usage:
    python3 publish.py "path/to/MyDevo.txt"
    python3 publish.py "path/to/MyDevo.txt" --start-date 2026-04-14
    python3 publish.py "path/to/MyDevo.txt" --dry-run
"""

import re
import os
import sys
import subprocess
import argparse
from datetime import datetime, timedelta

# ── Config ─────────────────────────────────────────────────────────────────────

PROJECT_DIR = os.path.expanduser(
    "~/Library/CloudStorage/Dropbox/Claude Code/Devotionals/harrison-faith-devotionals"
)
CONTENT_DIR = os.path.join(PROJECT_DIR, "content")

SMALL_WORDS = {"a", "an", "the", "and", "but", "or", "for", "nor",
               "on", "at", "to", "by", "of", "in", "up", "as", "is"}

DAY_SEPARATOR = re.compile(r'\.{20,}')

# ── Helpers ────────────────────────────────────────────────────────────────────

def title_case(s):
    """Title case: capitalize all words except small connecting words (unless first)."""
    words = s.split()
    result = []
    for i, w in enumerate(words):
        if i == 0 or w.lower() not in SMALL_WORDS:
            result.append(w[0].upper() + w[1:].lower() if w.isalpha() else w.capitalize())
        else:
            result.append(w.lower())
    return " ".join(result)

def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def next_monday():
    today = datetime.today()
    days_ahead = 7 - today.weekday()  # weekday(): Mon=0 ... Sun=6
    if days_ahead == 7:
        days_ahead = 0  # today is already Monday
    return today + timedelta(days=days_ahead)

def yaml_safe(s):
    """Wrap in double quotes if value contains a colon or quote character."""
    if ':' in s or '"' in s or "'" in s:
        return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'
    return s

def scripture_yaml_safe(s):
    """Always double-quote scripture text; escape any internal double quotes."""
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'

# ── Parser ─────────────────────────────────────────────────────────────────────

def parse_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = f.read()

    series_match = re.search(r'DEVOTIONAL SERIES:\s*(.+)', raw)
    if not series_match:
        sys.exit("ERROR: Could not find 'DEVOTIONAL SERIES:' in the file.")

    series_raw = series_match.group(1).strip()       # e.g. "LEAVING THE 99"
    sermon_series = title_case(series_raw)            # e.g. "Leaving the 99"

    # Series title is the first non-empty, non-"N-Day" line after the SERIES line
    after_series = raw[series_match.end():].lstrip('\n')
    for line in after_series.split('\n'):
        line = line.strip()
        if line and not re.match(r'^\d+-Day', line):
            series_title = line
            break
    else:
        sys.exit("ERROR: Could not determine series title.")

    day_start = re.search(r'\bDAY\s+1\b', raw)
    if not day_start:
        sys.exit("ERROR: Could not find 'DAY 1' in the file.")

    days_section = raw[day_start.start():]
    day_blocks = [b.strip() for b in DAY_SEPARATOR.split(days_section) if b.strip()]

    days = []
    for block in day_blocks:
        day = parse_day_block(block)
        if day:
            days.append(day)

    if not days:
        sys.exit("ERROR: No day blocks found.")

    return sermon_series, series_title, days


def parse_day_block(block):
    dev = {
        'day': 0,
        'title': '',
        'scripture_reference': '',
        'scripture_translation': '',
        'scripture_text': '',
        'devotional_thought': '',
        'application_questions': [],
        'todays_challenge': '',
        'prayer': '',
    }

    day_match = re.search(r'\bDAY\s+(\d+)\b', block)
    if not day_match:
        return None
    dev['day'] = int(day_match.group(1))

    title_match = re.search(r'^Title:\s*(.+)', block, re.MULTILINE)
    if title_match:
        dev['title'] = title_match.group(1).strip()

    section_pattern = re.compile(
        r'^(Scripture Reading:|Devotional Thought:|Application Questions:|Today\'s Challenge:|Prayer:)',
        re.MULTILINE
    )
    parts = section_pattern.split(block)

    i = 1
    while i < len(parts) - 1:
        header = parts[i].strip().rstrip(':')
        body   = parts[i + 1].strip()
        i += 2

        if header == 'Scripture Reading':
            lines = [l.strip() for l in body.split('\n') if l.strip()]
            if lines:
                ref_line = lines[0]
                ref_parts = ref_line.rsplit(' ', 1)
                known_translations = ('ESV', 'CSB', 'NIV', 'NASB', 'NLT', 'KJV', 'NKJV', 'MSG')
                if len(ref_parts) == 2 and ref_parts[1] in known_translations:
                    dev['scripture_reference']   = ref_parts[0].strip()
                    dev['scripture_translation'] = ref_parts[1].strip()
                else:
                    dev['scripture_reference'] = ref_line
                dev['scripture_text'] = ' '.join(lines[1:]).strip().strip('"')

        elif header == 'Devotional Thought':
            dev['devotional_thought'] = body

        elif header == 'Application Questions':
            questions = re.findall(r'\d+\.\s+(.+?)(?=\n\d+\.|\Z)', body, re.DOTALL)
            dev['application_questions'] = [q.strip() for q in questions]

        elif header == "Today's Challenge":
            dev['todays_challenge'] = body

        elif header == 'Prayer':
            dev['prayer'] = body

    return dev

# ── Markdown builder ───────────────────────────────────────────────────────────

def build_markdown(day_data, sermon_series, series_title, week_slug, publish_date):
    # Devotional as separate paragraphs
    devo_paras = [p.strip() for p in re.split(r'\n{2,}', day_data['devotional_thought']) if p.strip()]
    devo_md = '\n\n'.join(devo_paras)

    questions_md = '\n'.join(f'- {q}' for q in day_data['application_questions'])

    title_val     = day_data['title'] if day_data['title'] else series_title
    fm_title      = yaml_safe(title_val)
    fm_stitle     = yaml_safe(series_title)
    fm_scripture  = scripture_yaml_safe(day_data['scripture_text'])

    return f"""---
series: {week_slug}
series_title: {fm_stitle}
sermon_series: {sermon_series}
day: {day_data['day']}
publish_date: {publish_date}
title: {fm_title}
scripture_reference: {day_data['scripture_reference']}
scripture_translation: {day_data['scripture_translation']}
scripture_text: {fm_scripture}
---
## Devotional
{devo_md}

## Application
{questions_md}

## Challenge
{day_data['todays_challenge']}

## Prayer
{day_data['prayer']}
"""

# ── Series folder lookup ───────────────────────────────────────────────────────

def find_series_folder(sermon_series):
    """Return the existing content subfolder name for this sermon series, or a new slug."""
    for folder in sorted(os.listdir(CONTENT_DIR)):
        folder_path = os.path.join(CONTENT_DIR, folder)
        if not os.path.isdir(folder_path):
            continue
        for week in os.listdir(folder_path):
            day1 = os.path.join(folder_path, week, 'day-1.md')
            if os.path.exists(day1):
                with open(day1) as f:
                    content = f.read()
                m = re.search(r'^sermon_series:\s*(.+)$', content, re.MULTILINE)
                if m and m.group(1).strip() == sermon_series:
                    return folder
    # No match — derive from series name
    return slugify(sermon_series)

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Publish a .txt devotional to the React app')
    parser.add_argument('file', help='Path to the .txt devotional file')
    parser.add_argument('--start-date', help='Monday start date YYYY-MM-DD (default: next Monday)')
    parser.add_argument('--dry-run', action='store_true', help='Preview output without writing files')
    args = parser.parse_args()

    filepath = os.path.expanduser(args.file)
    if not os.path.exists(filepath):
        sys.exit(f"ERROR: File not found: {filepath}")

    if args.start_date:
        start = datetime.strptime(args.start_date, '%Y-%m-%d')
    else:
        start = next_monday()

    # Parse the txt file
    sermon_series, series_title, days = parse_file(filepath)
    week_slug     = slugify(series_title)
    series_folder = find_series_folder(sermon_series)
    week_dir      = os.path.join(CONTENT_DIR, series_folder, week_slug)

    print(f"\n  Sermon series : {sermon_series}  →  content/{series_folder}/")
    print(f"  Week title    : {series_title}  →  {week_slug}/")
    print(f"  Days found    : {len(days)}")
    print(f"  Start date    : {start.strftime('%A, %B %d %Y')} (Day 1)")
    if args.dry_run:
        print("\n  [DRY RUN — no files will be written]\n")
    print()

    if not args.dry_run:
        answer = input("Proceed? (y/n) ").strip().lower()
        if answer != 'y':
            sys.exit("Aborted.")

        if os.path.exists(week_dir):
            ow = input(f"\n⚠️  {week_dir} already exists. Overwrite? (y/n) ").strip().lower()
            if ow != 'y':
                sys.exit("Aborted.")

        os.makedirs(week_dir, exist_ok=True)

    # Write (or preview) each day
    for day_data in days:
        publish_date = (start + timedelta(days=day_data['day'] - 1)).strftime('%Y-%m-%d')
        md = build_markdown(day_data, sermon_series, series_title, week_slug, publish_date)
        out_path = os.path.join(week_dir, f"day-{day_data['day']}.md")

        if args.dry_run:
            print(f"── Day {day_data['day']} ({publish_date}) ──────────────────────────")
            print(md[:600])
            print("  ...")
        else:
            with open(out_path, 'w') as f:
                f.write(md)
            print(f"  ✅  day-{day_data['day']}.md  ({publish_date})")

    if args.dry_run:
        print("\n[Dry run complete. Run without --dry-run to publish.]\n")
        return

    # Build
    print("\n📦  Building content...")
    env = {**os.environ, 'PATH': f"/opt/homebrew/bin:{os.environ.get('PATH', '')}"}
    result = subprocess.run(
        ['node', 'scripts/build-content.mjs'],
        cwd=PROJECT_DIR, capture_output=True, text=True, env=env
    )
    print(" ", result.stdout.strip())
    if result.returncode != 0:
        print(result.stderr)
        sys.exit("Build failed.")

    # Git commit + push
    print("🚀  Committing and pushing...")
    subprocess.run(['git', 'add', 'content/'], cwd=PROJECT_DIR)
    subprocess.run(
        ['git', 'commit', '-m', f"Add {series_title} — {sermon_series}"],
        cwd=PROJECT_DIR
    )
    push = subprocess.run(
        ['git', 'push', 'origin', 'main'],
        cwd=PROJECT_DIR, capture_output=True, text=True
    )
    if push.returncode != 0:
        # Remote has new commits — rebase and retry
        subprocess.run(['git', 'pull', '--rebase', 'origin', 'main'], cwd=PROJECT_DIR)
        subprocess.run(['git', 'push', 'origin', 'main'], cwd=PROJECT_DIR)

    print(f"\n✅  Done! '{series_title}' is live on Netlify.\n")


if __name__ == '__main__':
    main()
