# Reader Reactions: Where to Click

The code is finished. These steps happen on websites (GitHub, Netlify, Google Analytics), not in the code. Do them in this order.

---

## Step 1: Open a draft pull request on GitHub (this gives you the preview link)

A "draft pull request" is a proposed change that isn't live yet. Netlify builds a private test copy of the site from it.

1. Open this link while signed in to GitHub:
   **https://github.com/scottbrandon-rgb/harrison-faith-devotionals/compare/main...claude/admiring-maxwell-f25do2**
2. You'll see a page titled **Comparing changes**. Click the green **Create pull request** button.
3. Add a title, such as *Reader reactions*.
4. Find the green button at the bottom. Click the **small arrow (▾) on its right side** and choose **Create draft pull request**. Then click the button.
5. Wait 2–5 minutes. A Netlify bot posts a comment on the pull request with a **Deploy Preview** link. That link is your preview.

> **Or let Claude do it:** reply "open the draft" and Claude will create it for you. You'd still check that page for the preview link.

**Nothing changes on the live site** until the pull request is merged.

---

## Step 2: Add your report key in Netlify

This is the password for your private report page.

1. Go to **https://app.netlify.com** and open the Harrison Faith devotionals project.
2. In the left menu, click **Project configuration** (it may be labeled **Site configuration**).
3. Click **Environment variables**.
4. Click **Add a variable**, then **Add a single variable**.
5. Fill in:
   - **Key:** `REACTIONS_REPORT_KEY`
   - **Value:** a passphrase only you know (for example, four random words)
   - **Scopes:** leave it at all scopes, or make sure **Functions** is checked
   - **Deploy contexts:** leave it at **Same value for all deploy contexts**, so it works on the preview too
6. Click **Create variable**.
7. **Redeploy the preview** so it picks up the key. On the pull request, the easiest way is to ask Claude to push again. In Netlify, you can also go to **Deploys**, open the deploy preview, and choose **Retry deploy**.

---

## Step 3: Try it on the preview

1. Open the **Deploy Preview** link from Step 1.
2. Open any published devotional, scroll past the Prayer, and tap a reaction.
3. Add `/reactions-report` to the end of the preview address and enter your key. Your tap should show up.

If the reaction shows "Something went wrong," check the deploy log in Netlify (**Deploys → the preview → Deploy log**) for a database message. If it says Netlify Database isn't enabled, look for **Database** in the project's left menu, turn it on, and retry the deploy.

Taps on the preview go into a **separate test database**, so they never mix with real data.

---

## Step 4: Go live

When you're happy with the preview, open the pull request on GitHub:

1. Click **Ready for review** (this converts the draft into a regular pull request).
2. Click **Merge pull request**, then **Confirm merge**.

Netlify then publishes it to the live site within a few minutes.

---

## Step 5: Google Analytics (optional, after it's live)

This makes reaction taps count as "engaged sessions."

1. Go to **https://analytics.google.com** and open the Harrison Faith property.
2. Click **Admin** (the gear icon at the bottom left).
3. Under **Data display**, click **Events**.
4. Click the **Recent events** tab and find `devotional_reaction`.
5. Click the **star** next to it. A solid star means it's now a key event, and it moves to the **Key events** tab.

**Don't see `devotional_reaction` yet?** An event appears in this list only after readers have triggered it, and Google can take up to 24–48 hours to show it. Either check back the next day, or register it ahead of time:

1. Click **Create event**.
2. Enter the name `devotional_reaction` exactly and turn on **Mark as key event**.
3. Under **Choose how to create an event**, select **Create with code**. Skip any code Google offers; the site already sends this event.
4. Save.

**Do not choose "Create without code."** That builds a new event triggered by page views, which would count page visits as reactions.

Key events count only from the day you star them. Earlier taps aren't counted retroactively. Taps saved in your `/reactions-report` aren't affected either way.

To filter reports by reaction type, also go to **Admin → Custom definitions → Create custom dimension** and add `reaction`, `series`, and `day`, each with scope **Event**.
